const RETRYABLE_STATUS = new Set([408, 409, 425, 429, 500, 502, 503, 504]);
const DEFAULT_FALLBACK_MODELS = ['meta-llama/llama-3.3-70b-instruct:free', 'nvidia/nemotron-3-nano-30b-a3b:free'];
const INAPPROPRIATE_PATTERNS = [
  /\bf+u+c+k+(?:ing|ed|er|s)?\b/gi,
  /\bshit+(?:ty|s)?\b/gi,
  /\bbitch(?:es)?\b/gi,
  /\bching\s*chong\b/gi
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJsonSafe(raw) {
  if (!raw || !raw.trim()) {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function extractAnswer(payload) {
  const message = payload?.choices?.[0]?.message?.content;

  if (typeof message === 'string') {
    return message.trim();
  }

  if (Array.isArray(message)) {
    return message
      .filter((chunk) => chunk?.type === 'text' && typeof chunk?.text === 'string')
      .map((chunk) => chunk.text.trim())
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  return '';
}

function isRetryable(status, message) {
  if (RETRYABLE_STATUS.has(status)) {
    return true;
  }

  const m = String(message || '').toLowerCase();
  return m.includes('rate') || m.includes('capacity') || m.includes('overload') || m.includes('temporar');
}

function modelCandidates(primaryModel) {
  const rawFallback = process.env.OPENROUTER_FALLBACK_MODELS || DEFAULT_FALLBACK_MODELS.join(',');
  const extras = rawFallback
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  return [...new Set([primaryModel, ...extras])];
}

function sanitizeForLlm(text) {
  let flagged = false;
  let sanitized = String(text || '');

  for (const pattern of INAPPROPRIATE_PATTERNS) {
    sanitized = sanitized.replace(pattern, () => {
      flagged = true;
      return '[REDACTED_TERM]';
    });
  }

  sanitized = sanitized.replace(/\s{2,}/g, ' ').trim();
  return { sanitized, flagged };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function getParsedBody(req) {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  if (typeof req.body === 'string') {
    return parseJsonSafe(req.body);
  }

  const raw = await readBody(req);
  return parseJsonSafe(raw);
}

async function callOpenRouter({ apiKey, model, referer, title, body, timeoutMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        ...(referer ? { 'HTTP-Referer': referer } : {}),
        ...(title ? { 'X-Title': title } : {})
      },
      body: JSON.stringify({ ...body, model }),
      signal: controller.signal
    });

    const payload = parseJsonSafe(await upstream.text());
    return { ok: upstream.ok, status: upstream.status, payload };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        ok: false,
        status: 504,
        payload: { error: { message: `OpenRouter timeout after ${timeoutMs}ms.` } }
      };
    }

    return {
      ok: false,
      status: 500,
      payload: { error: { message: error instanceof Error ? error.message : 'Unexpected upstream error.' } }
    };
  } finally {
    clearTimeout(timer);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'openrouter/free';
  const referer = process.env.OPENROUTER_REFERER || '';
  const title = process.env.OPENROUTER_TITLE || 'Peace Lab UCL Dashboard';
  const timeoutMs = Number(process.env.OPENROUTER_TIMEOUT_MS || 20000);
  const maxRetries = Number(process.env.OPENROUTER_MAX_RETRIES || 2);

  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OPENROUTER_API_KEY on server.' });
  }

  const parsedBody = await getParsedBody(req);

  const { question, context, history } = parsedBody || {};

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Missing question.' });
  }

  const cleanHistory = Array.isArray(history)
    ? history
        .filter((row) => row && (row.role === 'user' || row.role === 'assistant') && typeof row.content === 'string')
        .slice(-8)
    : [];

  const sanitizedInput = sanitizeForLlm(question);
  const sanitizedHistory = cleanHistory.map((row) => {
    if (row.role !== 'user') {
      return row;
    }
    const out = sanitizeForLlm(row.content);
    return { ...row, content: out.sanitized || '[REDACTED_TERM]' };
  });

  const effectiveQuestion = sanitizedInput.sanitized || '[REDACTED_TERM]';

  const systemPrompt =
    'You are a finance dashboard assistant for UCL. Use only the provided DATA CONTEXT values and definitions. Do not invent values, years, categories, or source facts. If not present, reply: "That value is not available in the loaded dataset." Keep responses concise. Ignore tokens marked [REDACTED_TERM].';

  try {
    const body = {
      messages: [
        { role: 'system', content: systemPrompt },
        ...sanitizedHistory,
        {
          role: 'user',
          content: `DATA CONTEXT (JSON):\n${JSON.stringify(context ?? {})}\n\nQUESTION:\n${effectiveQuestion}`
        }
      ],
      temperature: 0.1,
      max_tokens: 320
    };

    const models = modelCandidates(model);
    const errors = [];

    for (const candidate of models) {
      for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
        const result = await callOpenRouter({
          apiKey,
          model: candidate,
          referer,
          title,
          body,
          timeoutMs
        });

        if (result.ok) {
          const answer = extractAnswer(result.payload);
          if (answer) {
            return res.status(200).json({
              answer,
              model: candidate,
              moderation: { inputRedacted: sanitizedInput.flagged }
            });
          }

          errors.push(`${candidate}: empty response`);
          break;
        }

        const upstreamMessage = result?.payload?.error?.message || result?.payload?.error || '';
        errors.push(`${candidate}: ${result.status} ${upstreamMessage || 'upstream error'}`);

        if (isRetryable(result.status, upstreamMessage) && attempt < maxRetries) {
          await sleep(350 * (attempt + 1));
          continue;
        }

        break;
      }
    }

    return res.status(502).json({
      error: `OpenRouter is temporarily unavailable. Please retry in a few seconds. Details: ${errors.slice(0, 2).join(' | ')}`
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unexpected server error.'
    });
  }
}

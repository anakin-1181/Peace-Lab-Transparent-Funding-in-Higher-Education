import type { DashboardData } from '../types';
import { DATA_REFERENCE_TABLES, DATA_SOURCE_INFO } from './dataReference';

type ChatRole = 'user' | 'assistant';

export type LlmMessage = {
  role: ChatRole;
  content: string;
};

type ChatRequest = {
  question: string;
  data: DashboardData;
  history: LlmMessage[];
  signal?: AbortSignal;
};

type ChatApiResponse = {
  answer?: string;
  moderation?: {
    inputRedacted?: boolean;
  };
  error?: {
    message?: string;
    error?: string;
  };
};

async function safeReadJson(response: Response): Promise<ChatApiResponse> {
  const raw = await response.text();
  if (!raw.trim()) {
    return {};
  }

  try {
    return JSON.parse(raw) as ChatApiResponse;
  } catch {
    return {};
  }
}

function compactDataContext(data: DashboardData) {
  const maxDepartmentContext = 40;
  const latestYear = data.table5.years[data.table5.years.length - 1];
  const latestRows = latestYear ? data.table5.byYear[latestYear]?.departments ?? [] : [];
  const ranked = [...latestRows]
    .sort((a, b) => b.total - a.total)
    .slice(0, maxDepartmentContext)
    .map((row) => ({
      code: row.code,
      name: row.name,
      total: row.total
    }));

  return {
    provider: data.provider,
    dataReference: {
      organisation: DATA_SOURCE_INFO.organisation,
      portal: DATA_SOURCE_INFO.portal,
      type: DATA_SOURCE_INFO.type,
      providerScope: DATA_SOURCE_INFO.providerScope,
      tables: DATA_REFERENCE_TABLES.map((table) => ({
        id: table.id,
        title: table.title,
        purpose: table.purpose,
        link: table.link,
        keyNotes: table.hesaNotes.slice(0, 4),
        columns: table.columns.map(([column]) => column)
      }))
    },
    table1: data.table1,
    table6: data.table6,
    table8: data.table8,
    table5: {
      latestYear: latestYear ?? null,
      years: data.table5.years,
      researchTotal: latestYear ? data.table5.byYear[latestYear]?.researchTotal ?? null : null,
      departmentCount: latestRows.length,
      departments: ranked
    }
  };
}

export async function askLlm({ question, data, history, signal }: ChatRequest) {
  const context = compactDataContext(data);
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      question,
      context,
      history: history.slice(-8)
    }),
    signal
  });

  const payload = await safeReadJson(response);

  if (!response.ok) {
    const reason =
      payload?.error?.message ??
      payload?.error?.error ??
      (response.status === 404
        ? 'Chat API route not found. On local machine, run with Vercel dev, or test on deployed Vercel app.'
        : `LLM request failed with status ${response.status}`);
    throw new Error(reason);
  }

  const answer = typeof payload?.answer === 'string' ? payload.answer.trim() : '';
  if (!answer) {
    throw new Error('LLM returned an empty response.');
  }

  return answer;
}

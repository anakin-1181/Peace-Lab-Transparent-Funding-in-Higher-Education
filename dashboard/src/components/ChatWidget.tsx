import { useState } from 'react';
import type { DashboardData } from '../types';
import { askLlm } from '../lib/llmChat';
import { maskInappropriateText } from '../lib/contentFilter';

type ChatMessage = {
  id: number;
  role: 'assistant' | 'user';
  text: string;
};

const STARTER_PROMPTS = [
  'What is HESA?',
  'What does Table 6 represent?',
  'What is total income in Table 1?',
  'Break down Table 6 UK vs Non-UK fees',
  'What are staff costs in Table 8?',
  'Which department has the highest Table 5 total?'
];

export function ChatWidget({ data }: { data: DashboardData }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moderationNote, setModerationNote] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant',
      text: 'Ask about UCL finance values and data reference definitions (for example: "What is HESA?" or "What is Table 5?"). Responses are grounded on loaded dataset context.'
    }
  ]);

  async function submitQuestion(raw: string) {
    const question = raw.trim();
    if (!question || loading) {
      return;
    }

    setError(null);
    setModerationNote(null);
    setLoading(true);
    const maskedForDisplay = maskInappropriateText(question);

    if (maskedForDisplay.flagged) {
      setModerationNote('Inappropriate terms were blurred in display and ignored for model processing.');
    }

    setMessages((prev) => {
      const firstId = prev.length + 1;
      return [...prev, { id: firstId, role: 'user', text: maskedForDisplay.masked }];
    });
    setInput('');

    try {
      const history = messages.map((msg) => ({
        role: msg.role,
        content: msg.text
      }));
      const answer = await askLlm({ question, data, history });

      setMessages((prev) => {
        const id = prev.length + 1;
        return [...prev, { id, role: 'assistant', text: answer }];
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="panel chat-widget">
      <div className="chat-head">
        <h2>Data Assistant</h2>
        <p>Light LLM assistant via server API, grounded in loaded UCL JSON</p>
      </div>

      <div className="chat-prompt-row">
        {STARTER_PROMPTS.map((prompt) => (
          <button key={prompt} type="button" className="secondary-btn chat-prompt" onClick={() => void submitQuestion(prompt)} disabled={loading}>
            {prompt}
          </button>
        ))}
      </div>

      <div className="chat-log" aria-live="polite">
        {messages.map((message) => (
          <article className={`chat-bubble ${message.role}`} key={message.id}>
            <h4>{message.role === 'assistant' ? 'Assistant' : 'You'}</h4>
            <p>{message.text}</p>
          </article>
        ))}
        {loading ? (
          <article className="chat-bubble assistant">
            <h4>Assistant</h4>
            <p>Thinking...</p>
          </article>
        ) : null}
      </div>

      <form
        className="chat-form"
        onSubmit={(event) => {
          event.preventDefault();
          void submitQuestion(input);
        }}
      >
        <label className="text-input">
          <span>Ask a question</span>
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="e.g. What is total expenditure?"
            disabled={loading}
          />
        </label>
        <button className="secondary-btn" type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send'}
        </button>
      </form>

      {error ? (
        <div className="notice">
          <p>{error}</p>
        </div>
      ) : null}

      {moderationNote ? (
        <div className="notice">
          <p>{moderationNote}</p>
        </div>
      ) : null}
    </section>
  );
}

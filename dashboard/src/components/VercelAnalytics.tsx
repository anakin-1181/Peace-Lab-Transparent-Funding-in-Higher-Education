import { useEffect } from 'react';

declare global {
  interface Window {
    va?: (...args: unknown[]) => void;
    vaq?: unknown[];
  }
}

export function VercelAnalytics() {
  useEffect(() => {
    if (!import.meta.env.PROD || typeof window === 'undefined') {
      return;
    }

    if (!window.va) {
      window.va = (...args: unknown[]) => {
        window.vaq = window.vaq || [];
        window.vaq.push(args);
      };
    }

    const existing = document.querySelector('script[data-vercel-insights]');
    if (existing) {
      return;
    }

    const script = document.createElement('script');
    script.defer = true;
    script.src = '/_vercel/insights/script.js';
    script.dataset.vercelInsights = 'true';
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return null;
}

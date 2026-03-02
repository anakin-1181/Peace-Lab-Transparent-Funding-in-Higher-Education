import { useEffect, useState } from 'react';
import type { DashboardData } from '../types';

type State = {
  loading: boolean;
  error: string | null;
  data: DashboardData | null;
};

export function useDashboardData() {
  const [state, setState] = useState<State>({
    loading: true,
    error: null,
    data: null
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const res = await fetch('/ucl-data.json', { cache: 'no-cache' });
        if (!res.ok) {
          throw new Error(`Failed to load data: ${res.status}`);
        }

        const parsed = (await res.json()) as DashboardData;
        if (mounted) {
          setState({ loading: false, error: null, data: parsed });
        }
      } catch (error) {
        if (mounted) {
          setState({
            loading: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            data: null
          });
        }
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  return state;
}

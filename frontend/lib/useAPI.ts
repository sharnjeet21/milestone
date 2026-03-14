import { useCallback, useState } from "react";

type APIState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export function useAPI<T>() {
  const [state, setState] = useState<APIState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }));
  }, []);

  const execute = useCallback(async (fn: () => Promise<T>): Promise<T | null> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const result = await fn();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setState((prev) => ({ ...prev, loading: false, error: message }));
      return null;
    }
  }, []);

  return { ...state, execute, setData };
}

import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from "react";

type UseAPIOptions<T> = {
  initialData?: T | null;
  immediate?: boolean;
  request?: () => Promise<T>;
};

export type UseAPIResult<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (request?: () => Promise<T>) => Promise<T | null>;
  setData: Dispatch<SetStateAction<T | null>>;
};

export function useAPI<T>(options: UseAPIOptions<T> = {}): UseAPIResult<T> {
  const { initialData = null, immediate = false, request } = options;
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (overrideRequest?: () => Promise<T>) => {
      const resolvedRequest = overrideRequest ?? request;

      if (!resolvedRequest) {
        return data;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await resolvedRequest();
        setData(response);
        return response;
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Request failed"));
        return null;
      } finally {
        setLoading(false);
      }
    },
    [data, request],
  );

  useEffect(() => {
    if (!immediate || !request) {
      return;
    }

    void execute(request);
  }, [execute, immediate, request]);

  return { data, loading, error, execute, setData };
}

export default useAPI;

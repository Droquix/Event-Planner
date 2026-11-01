import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Custom React hook for executing abortable async tasks (e.g. AI API calls).
 * Automatically cancels in-flight requests on new triggers or unmount,
 * guards against race conditions from stale responses, and tracks loading and error states.
 */
export function useAbortableRequest<TData = void, TResult = unknown>(
  requestFn: (data: TData, signal: AbortSignal) => Promise<TResult>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  const execute = useCallback(
    async (data: TData): Promise<TResult | undefined> => {
      // Abort any currently pending request
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      const currentId = ++requestIdRef.current;
      setLoading(true);
      setError(null);

      try {
        const result = await requestFn(data, controller.signal);
        // Ignore stale response if a newer request was dispatched
        if (currentId !== requestIdRef.current) {
          return undefined;
        }
        setLoading(false);
        return result;
      } catch (err: unknown) {
        // Ignore if replaced by a newer request
        if (currentId !== requestIdRef.current) {
          return undefined;
        }
        // Silently handle explicit aborts
        if (err instanceof DOMException && err.name === 'AbortError') {
          return undefined;
        }
        const message = err instanceof Error ? err.message : 'Request failed';
        setError(message);
        setLoading(false);
        return undefined;
      }
    },
    [requestFn]
  );

  const abort = useCallback(() => {
    controllerRef.current?.abort();
    setLoading(false);
  }, []);

  return {
    execute,
    loading,
    error,
    setError,
    abort,
  };
}

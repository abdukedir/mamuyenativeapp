import { useEffect, useState } from 'react';

export function useBusinessCollection<T>(
  subscribe: (onItems: (items: T[]) => void, onError: (error: Error) => void) => () => void
) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribe(
      (nextItems) => {
        setItems(nextItems);
        setError(null);
        setLoading(false);
      },
      (nextError) => {
        setError(nextError.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [subscribe]);

  return { items, loading, error };
}

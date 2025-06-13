import { useEffect, useState } from "react";

interface UseFetchResult<T> {
  data: T | null;
  isPending: boolean;
  error: string | null;
} 

function useFetch<T = unknown>(url: string): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortCont = new AbortController();

    const token = localStorage.getItem('token');
    fetch(url, { 
      signal: abortCont.signal,
      headers:{
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      } 
    })
      .then(res => {
        if (!res.ok) {
          throw Error("Could not fetch the data from that resource");
        }
        return res.json();
      })
      .then((data: T) => {
        setError(null);
        setData(data);
        setIsPending(false);
      })
      .catch(err => {
        if (err.name === 'AbortError') {
          console.log('fetch aborted');
        } else {
          setIsPending(false);
          setError(err.message);
        }
      });

    return () => abortCont.abort();
  }, [url]);

  return { data, isPending, error };
}

export default useFetch;

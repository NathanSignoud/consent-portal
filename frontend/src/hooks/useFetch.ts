import { useEffect, useState, useCallback, useRef } from "react";
import { ApiResponse, isApiError, ApiErrorResponse } from '@/types';

// Configuration API
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Interface pour les options de fetch
interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

// Interface pour le résultat du hook
interface UseFetchResult<T> {
  data: T | null;
  isPending: boolean;
  isLoading: boolean; // Alias pour isPending
  error: string | null;
  errorDetails: ApiErrorResponse | null;
  isSuccess: boolean;
  isError: boolean;
  retry: () => void;
  refetch: () => void;
}

// Interface pour les options du hook
interface UseFetchOptions extends FetchOptions {
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
}

// Cache simple pour éviter les requêtes redondantes
const cache = new Map<string, { data: any; timestamp: number; staleTime: number }>();

// Fonction utilitaire pour obtenir le token
const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

// Fonction utilitaire pour construire les headers
const buildHeaders = (options: FetchOptions = {}): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (!options.skipAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Fonction pour gérer les timeouts
const fetchWithTimeout = async (
  url: string, 
  options: FetchOptions, 
  timeout: number = 10000
): Promise<Response> => {
  const controller = new AbortController();
  const signal = controller.signal;

  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal || signal,
      headers: buildHeaders(options)
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Fonction pour gérer les retries
const fetchWithRetry = async (
  url: string,
  options: FetchOptions,
  retries: number = 0,
  retryDelay: number = 1000
): Promise<Response> => {
  try {
    return await fetchWithTimeout(url, options, options.timeout);
  } catch (error: any) {
    if (retries > 0 && error.name !== 'AbortError') {
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return fetchWithRetry(url, options, retries - 1, retryDelay * 2);
    }
    throw error;
  }
};

// Hook principal useFetch modernisé
function useFetch<T = unknown>(
  url: string, 
  options: UseFetchOptions = {}
): UseFetchResult<T> {
  const {
    enabled = true,
    refetchOnMount = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutes par défaut
    retries = 1,
    retryDelay = 1000,
    timeout = 10000,
    ...fetchOptions
  } = options;

  // États
  const [data, setData] = useState<T | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<ApiErrorResponse | null>(null);

  // Refs pour éviter les re-renders inutiles
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Construction de l'URL complète
  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  // Fonction de fetch principale
  const fetchData = useCallback(async (ignoreCache = false) => {
    if (!enabled || !mountedRef.current) return;

    // Vérifier le cache
    const cacheKey = `${fullUrl}${JSON.stringify(fetchOptions)}`;
    const cached = cache.get(cacheKey);
    
    if (!ignoreCache && cached && (Date.now() - cached.timestamp) < cached.staleTime) {
      setData(cached.data);
      setError(null);
      setErrorDetails(null);
      return;
    }

    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Nouvelle requête
    abortControllerRef.current = new AbortController();
    setIsPending(true);
    setError(null);
    setErrorDetails(null);

    try {
      const response = await fetchWithRetry(
        fullUrl,
        {
          ...fetchOptions,
          signal: abortControllerRef.current.signal
        },
        retries,
        retryDelay
      );

      if (!mountedRef.current) return;

      if (!response.ok) {
        // Essayer de parser la réponse d'erreur
        let errorData: ApiErrorResponse | null = null;
        try {
          const errorResponse = await response.json();
          if (isApiError(errorResponse)) {
            errorData = errorResponse;
            throw new Error(errorResponse.message);
          }
        } catch (parseError) {
          // Si le parsing échoue, utiliser le status HTTP
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData: T = await response.json();

      if (!mountedRef.current) return;

      // Vérifier si c'est une réponse d'erreur API
      if (isApiError(responseData as any)) {
        const apiError = responseData as any as ApiErrorResponse;
        setError(apiError.message);
        setErrorDetails(apiError);
        return;
      }

      // Succès - mettre en cache et sauvegarder
      cache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now(),
        staleTime
      });

      setData(responseData);
      setError(null);
      setErrorDetails(null);

    } catch (err: any) {
      if (!mountedRef.current) return;

      if (err.name === 'AbortError') {
        console.log('Fetch aborted for:', fullUrl);
        return;
      }

      console.error('Fetch error:', err);
      
      // Gestion des erreurs spécialisées
      let errorMessage = err.message || 'Une erreur est survenue';
      
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = 'Problème de connexion. Vérifiez votre réseau.';
      } else if (err.message.includes('timeout')) {
        errorMessage = 'La requête a pris trop de temps. Réessayez.';
      } else if (err.message.includes('401')) {
        errorMessage = 'Session expirée. Veuillez vous reconnecter.';
        // Optionnel: rediriger vers login
        // window.location.href = '/login';
      } else if (err.message.includes('403')) {
        errorMessage = 'Accès non autorisé.';
      } else if (err.message.includes('404')) {
        errorMessage = 'Ressource introuvable.';
      } else if (err.message.includes('500')) {
        errorMessage = 'Erreur serveur. Réessayez plus tard.';
      }

      setError(errorMessage);
      
      // Si on a des détails d'erreur API, les sauvegarder
      if (err.response?.data && isApiError(err.response.data)) {
        setErrorDetails(err.response.data);
      }

    } finally {
      if (mountedRef.current) {
        setIsPending(false);
      }
    }
  }, [fullUrl, enabled, retries, retryDelay, staleTime, JSON.stringify(fetchOptions)]);

  // Fonction retry/refetch
  const retry = useCallback(() => {
    fetchData(true); // Ignorer le cache lors du retry
  }, [fetchData]);

  // Effet principal
  useEffect(() => {
    if (enabled && refetchOnMount) {
      fetchData();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData, enabled, refetchOnMount]);

  // Refetch sur focus de la fenêtre
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (enabled) {
        fetchData(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchData, enabled, refetchOnWindowFocus]);

  // Cleanup au démontage
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // États calculés
  const isSuccess = !isPending && !error && data !== null;
  const isError = !isPending && error !== null;

  return {
    data,
    isPending,
    isLoading: isPending, // Alias
    error,
    errorDetails,
    isSuccess,
    isError,
    retry,
    refetch: retry // Alias
  };
}

// Hook spécialisé pour les requêtes authentifiées
export const useAuthFetch = <T = unknown>(
  url: string,
  options: UseFetchOptions = {}
) => {
  return useFetch<T>(url, { ...options, skipAuth: false });
};

// Hook spécialisé pour les requêtes publiques
export const usePublicFetch = <T = unknown>(
  url: string,
  options: UseFetchOptions = {}
) => {
  return useFetch<T>(url, { ...options, skipAuth: true });
};

// Hook pour les mutations (POST, PUT, PATCH, DELETE)
export const useMutation = <TData = unknown, TVariables = unknown>(
  url: string,
  options: FetchOptions & {
    method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    onSuccess?: (data: TData) => void;
    onError?: (error: string) => void;
  } = {}
) => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const mutate = useCallback(async (variables?: TVariables) => {
    setIsPending(true);
    setError(null);

    try {
      const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
      
      const response = await fetch(fullUrl, {
        method: options.method || 'POST',
        headers: buildHeaders(options),
        body: variables ? JSON.stringify(variables) : undefined,
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData: TData = await response.json();

      if (isApiError(responseData as any)) {
        const apiError = responseData as any as ApiErrorResponse;
        throw new Error(apiError.message);
      }

      setData(responseData);
      options.onSuccess?.(responseData);
      
      return responseData;

    } catch (err: any) {
      const errorMessage = err.message || 'Une erreur est survenue';
      setError(errorMessage);
      options.onError?.(errorMessage);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, [url, options]);

  return {
    mutate,
    isPending,
    error,
    data,
    isSuccess: !isPending && !error && data !== null,
    isError: !isPending && error !== null
  };
};

// Fonction pour vider le cache
export const clearFetchCache = (pattern?: string) => {
  if (pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
};

export default useFetch;
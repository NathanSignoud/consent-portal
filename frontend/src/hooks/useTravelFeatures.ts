import { useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
  DayVisitStop, 
  MatrixResult, 
  TravelTimeResponse, 
  TravelTimeRequest,
  TravelMatrixRequest,
  DayVisitsResponse,
  ApiResponse,
  isApiError 
} from '@/types';

// Configuration API
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Interface pour les options de géolocalisation
interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

// Interface pour les coordonnées avec nom optionnel
interface NamedCoordinates {
  coords: [number, number]; // [longitude, latitude]
  name?: string;
  address?: string;
}

// Interface pour l'optimisation d'itinéraire
interface RouteOptimizationResult {
  optimizedOrder: number[];
  totalDistance: number;
  totalDuration: number;
  routes: Array<{
    from: number;
    to: number;
    distance: number;
    duration: number;
  }>;
}

// Interface de retour du hook
interface UseTravelFeaturesReturn {
  // États de chargement
  isTravelLoading: boolean;
  isVisitsLoading: boolean;
  isMatrixLoading: boolean;
  isGeolocationLoading: boolean;
  isOptimizationLoading: boolean;
  
  // Données
  travelResult: TravelTimeResponse | null;
  dayVisits: DayVisitStop[];
  matrixResult: MatrixResult | null;
  currentLocation: [number, number] | null;
  optimizedRoute: RouteOptimizationResult | null;
  
  // Erreurs
  travelError: string | null;
  visitsError: string | null;
  matrixError: string | null;
  geolocationError: string | null;
  optimizationError: string | null;
  
  // Actions
  testTravelTime: (from?: [number, number], to?: [number, number]) => Promise<TravelTimeResponse | null>;
  loadDayVisits: (date?: string) => Promise<DayVisitStop[]>;
  buildMatrixForDay: (date?: string, origin?: [number, number]) => Promise<MatrixResult | null>;
  calculateTravelTime: (from: [number, number], to: [number, number]) => Promise<TravelTimeResponse | null>;
  getCurrentLocation: (options?: GeolocationOptions) => Promise<[number, number] | null>;
  optimizeRoute: (locations: NamedCoordinates[], startFrom?: [number, number]) => Promise<RouteOptimizationResult | null>;
  
  // Utilitaires
  clearErrors: () => void;
  clearResults: () => void;
}

export const useTravelFeatures = (
  getAuthHeaders: () => { headers: { Authorization: string } }
): UseTravelFeaturesReturn => {
  
  // États de chargement
  const [isTravelLoading, setIsTravelLoading] = useState(false);
  const [isVisitsLoading, setIsVisitsLoading] = useState(false);
  const [isMatrixLoading, setIsMatrixLoading] = useState(false);
  const [isGeolocationLoading, setIsGeolocationLoading] = useState(false);
  const [isOptimizationLoading, setIsOptimizationLoading] = useState(false);
  
  // Données
  const [travelResult, setTravelResult] = useState<TravelTimeResponse | null>(null);
  const [dayVisits, setDayVisits] = useState<DayVisitStop[]>([]);
  const [matrixResult, setMatrixResult] = useState<MatrixResult | null>(null);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null);
  const [optimizedRoute, setOptimizedRoute] = useState<RouteOptimizationResult | null>(null);
  
  // Erreurs
  const [travelError, setTravelError] = useState<string | null>(null);
  const [visitsError, setVisitsError] = useState<string | null>(null);
  const [matrixError, setMatrixError] = useState<string | null>(null);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [optimizationError, setOptimizationError] = useState<string | null>(null);
  
  // Refs pour la gestion des requêtes
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fonction utilitaire pour gérer les erreurs API
  const handleApiError = useCallback((error: any, defaultMessage: string): string => {
    console.error('Travel API Error:', error);
    
    if (error?.response?.data) {
      if (isApiError(error.response.data)) {
        return error.response.data.message;
      } else if (error.response.data.error) {
        return error.response.data.error;
      }
    }
    
    if (error?.message) {
      return error.message;
    }
    
    return defaultMessage;
  }, []);

  // Fonction pour valider les coordonnées
  const validateCoordinates = useCallback((coords: [number, number]): boolean => {
    const [lon, lat] = coords;
    return (
      typeof lon === 'number' && 
      typeof lat === 'number' &&
      lon >= -180 && lon <= 180 &&
      lat >= -90 && lat <= 90 &&
      !isNaN(lon) && !isNaN(lat)
    );
  }, []);

  // Fonction pour valider le format de date
  const validateDate = useCallback((date: string): boolean => {
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
  }, []);

  // Obtenir la position actuelle de l'utilisateur
  const getCurrentLocation = useCallback(async (
    options: GeolocationOptions = {}
  ): Promise<[number, number] | null> => {
    setIsGeolocationLoading(true);
    setGeolocationError(null);
    
    const defaultOptions: GeolocationOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5 * 60 * 1000, // 5 minutes
      ...options
    };

    try {
      if (!navigator.geolocation) {
        throw new Error('Géolocalisation non supportée par ce navigateur');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, defaultOptions);
      });

      const coords: [number, number] = [
        position.coords.longitude,
        position.coords.latitude
      ];

      setCurrentLocation(coords);
      return coords;

    } catch (error: any) {
      let errorMessage = 'Impossible d\'obtenir votre position';
      
      if (error.code === 1) {
        errorMessage = 'Accès à la géolocalisation refusé';
      } else if (error.code === 2) {
        errorMessage = 'Position indisponible';
      } else if (error.code === 3) {
        errorMessage = 'Délai d\'attente dépassé pour la géolocalisation';
      }
      
      setGeolocationError(errorMessage);
      return null;
    } finally {
      setIsGeolocationLoading(false);
    }
  }, []);

  // Calculer le temps de trajet entre deux points
  const calculateTravelTime = useCallback(async (
    from: [number, number],
    to: [number, number]
  ): Promise<TravelTimeResponse | null> => {
    if (!validateCoordinates(from) || !validateCoordinates(to)) {
      setTravelError('Coordonnées invalides');
      return null;
    }

    setIsTravelLoading(true);
    setTravelError(null);
    setTravelResult(null);

    try {
      // Annuler la requête précédente
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const requestData: TravelTimeRequest = { from, to };

      const response = await axios.post(
        `${API_BASE_URL}/api/calendar/travel-time`,
        requestData,
        {
          ...getAuthHeaders(),
          signal: abortControllerRef.current.signal
        }
      );

      if (isApiError(response.data)) {
        throw new Error(response.data.message);
      }

      const result: TravelTimeResponse = response.data;
      setTravelResult(result);
      return result;

    } catch (error: any) {
      if (error.name === 'AbortError') return null;
      
      const errorMessage = handleApiError(error, 'Impossible de calculer le trajet');
      setTravelError(errorMessage);
      return null;
    } finally {
      setIsTravelLoading(false);
    }
  }, [validateCoordinates, getAuthHeaders, handleApiError]);

  // Test avec coordonnées par défaut (Paris)
  const testTravelTime = useCallback(async (
    from: [number, number] = [2.3522, 48.8566], // Tour Eiffel
    to: [number, number] = [2.295, 48.8738]     // Arc de Triomphe
  ): Promise<TravelTimeResponse | null> => {
    return calculateTravelTime(from, to);
  }, [calculateTravelTime]);

  // Charger les visites du jour
  const loadDayVisits = useCallback(async (
    date?: string
  ): Promise<DayVisitStop[]> => {
    const targetDate = date || new Date().toISOString().slice(0, 10);
    
    if (!validateDate(targetDate)) {
      setVisitsError('Format de date invalide (YYYY-MM-DD attendu)');
      return [];
    }

    setIsVisitsLoading(true);
    setVisitsError(null);
    setDayVisits([]);

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/calendar/day-visits?date=${targetDate}`,
        getAuthHeaders()
      );

      if (isApiError(response.data)) {
        throw new Error(response.data.message);
      }

      const visitsData: DayVisitsResponse = response.data;
      const stops = visitsData.stops || [];
      
      setDayVisits(stops);
      
      if (stops.length === 0) {
        setVisitsError(`Aucune visite prévue le ${new Date(targetDate).toLocaleDateString('fr-FR')}`);
      }

      return stops;

    } catch (error: any) {
      const errorMessage = handleApiError(error, 'Erreur lors du chargement des visites');
      setVisitsError(errorMessage);
      return [];
    } finally {
      setIsVisitsLoading(false);
    }
  }, [validateDate, getAuthHeaders, handleApiError]);

  // Construire la matrice de distance/temps pour le jour
  const buildMatrixForDay = useCallback(async (
    date?: string,
    origin?: [number, number]
  ): Promise<MatrixResult | null> => {
    const targetDate = date || new Date().toISOString().slice(0, 10);
    
    if (!validateDate(targetDate)) {
      setMatrixError('Format de date invalide');
      return null;
    }

    if (origin && !validateCoordinates(origin)) {
      setMatrixError('Coordonnées d\'origine invalides');
      return null;
    }

    setIsMatrixLoading(true);
    setMatrixError(null);
    setMatrixResult(null);

    try {
      const requestData: TravelMatrixRequest = { date: targetDate };
      if (origin) {
        requestData.origin = origin;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/calendar/travel-matrix`,
        requestData,
        getAuthHeaders()
      );

      if (isApiError(response.data)) {
        throw new Error(response.data.message);
      }

      const result: MatrixResult = response.data;
      setMatrixResult(result);
      return result;

    } catch (error: any) {
      const errorMessage = handleApiError(error, 'Erreur lors du calcul de la matrice');
      setMatrixError(errorMessage);
      return null;
    } finally {
      setIsMatrixLoading(false);
    }
  }, [validateDate, validateCoordinates, getAuthHeaders, handleApiError]);

  // Optimiser un itinéraire (algorithme du voyageur de commerce simplifié)
  const optimizeRoute = useCallback(async (
    locations: NamedCoordinates[],
    startFrom?: [number, number]
  ): Promise<RouteOptimizationResult | null> => {
    if (locations.length < 2) {
      setOptimizationError('Au moins 2 emplacements requis pour l\'optimisation');
      return null;
    }

    setIsOptimizationLoading(true);
    setOptimizationError(null);
    setOptimizedRoute(null);

    try {
      // Préparer les coordonnées pour la matrice
      let allCoords: [number, number][] = locations.map(loc => loc.coords);
      
      if (startFrom) {
        allCoords = [startFrom, ...allCoords];
      }

      // Construire la matrice de distances
      const response = await axios.post(
        `${API_BASE_URL}/api/calendar/travel-matrix`,
        { locations: allCoords },
        getAuthHeaders()
      );

      if (isApiError(response.data)) {
        throw new Error(response.data.message);
      }

      const matrix: MatrixResult = response.data;
      
      // Algorithme glouton simple pour optimiser l'itinéraire
      const visited = new Set<number>();
      const optimizedOrder: number[] = [];
      let currentIndex = 0; // Commencer par le premier point (origine ou premier lieu)
      
      optimizedOrder.push(currentIndex);
      visited.add(currentIndex);
      
      let totalDistance = 0;
      let totalDuration = 0;
      const routes: Array<{from: number; to: number; distance: number; duration: number}> = [];

      // Trouver le prochain point le plus proche non visité
      while (visited.size < matrix.count) {
        let nearestIndex = -1;
        let nearestDistance = Infinity;
        
        for (let i = 0; i < matrix.count; i++) {
          if (!visited.has(i) && matrix.distances[currentIndex][i] < nearestDistance) {
            nearestDistance = matrix.distances[currentIndex][i];
            nearestIndex = i;
          }
        }
        
        if (nearestIndex !== -1) {
          const distance = matrix.distances[currentIndex][nearestIndex];
          const duration = matrix.durations[currentIndex][nearestIndex];
          
          routes.push({
            from: currentIndex,
            to: nearestIndex,
            distance,
            duration
          });
          
          totalDistance += distance;
          totalDuration += duration;
          
          optimizedOrder.push(nearestIndex);
          visited.add(nearestIndex);
          currentIndex = nearestIndex;
        }
      }

      const result: RouteOptimizationResult = {
        optimizedOrder,
        totalDistance,
        totalDuration,
        routes
      };

      setOptimizedRoute(result);
      return result;

    } catch (error: any) {
      const errorMessage = handleApiError(error, 'Erreur lors de l\'optimisation de l\'itinéraire');
      setOptimizationError(errorMessage);
      return null;
    } finally {
      setIsOptimizationLoading(false);
    }
  }, [getAuthHeaders, handleApiError]);

  // Fonctions utilitaires
  const clearErrors = useCallback(() => {
    setTravelError(null);
    setVisitsError(null);
    setMatrixError(null);
    setGeolocationError(null);
    setOptimizationError(null);
  }, []);

  const clearResults = useCallback(() => {
    setTravelResult(null);
    setDayVisits([]);
    setMatrixResult(null);
    setOptimizedRoute(null);
  }, []);

  return {
    // États de chargement
    isTravelLoading,
    isVisitsLoading,
    isMatrixLoading,
    isGeolocationLoading,
    isOptimizationLoading,
    
    // Données
    travelResult,
    dayVisits,
    matrixResult,
    currentLocation,
    optimizedRoute,
    
    // Erreurs
    travelError,
    visitsError,
    matrixError,
    geolocationError,
    optimizationError,
    
    // Actions
    testTravelTime,
    loadDayVisits,
    buildMatrixForDay,
    calculateTravelTime,
    getCurrentLocation,
    optimizeRoute,
    
    // Utilitaires
    clearErrors,
    clearResults
  };
};

// Hook spécialisé pour la planification d'itinéraires
export const useRoutePlanning = (
  getAuthHeaders: () => { headers: { Authorization: string } }
) => {
  const travelFeatures = useTravelFeatures(getAuthHeaders);
  
  // Planifier un itinéraire complet pour une journée
  const planDayRoute = useCallback(async (date: string) => {
    // 1. Obtenir la position actuelle
    const currentPos = await travelFeatures.getCurrentLocation();
    
    // 2. Charger les visites du jour
    const visits = await travelFeatures.loadDayVisits(date);
    
    if (visits.length === 0) return null;
    
    // 3. Préparer les locations pour l'optimisation
    const locations: NamedCoordinates[] = visits.map(visit => ({
      coords: visit.coords,
      name: visit.nom,
      address: `${visit.adresse.rue}, ${visit.adresse.ville}`
    }));
    
    // 4. Optimiser l'itinéraire
    const optimized = await travelFeatures.optimizeRoute(locations, currentPos || undefined);
    
    return {
      currentLocation: currentPos,
      visits,
      optimizedRoute: optimized
    };
  }, [travelFeatures]);

  return {
    ...travelFeatures,
    planDayRoute
  };
};
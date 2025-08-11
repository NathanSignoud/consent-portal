import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { 
  Task, 
  Patient2, 
  ApiResponse, 
  isApiError, 
  TaskSummary,
  TaskFilter,
  DayVisitsResponse 
} from '@/types';

// Configuration API
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Interface pour les options de filtrage
interface CalendarDataFilters {
  status?: TaskFilter;
  patientId?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Interface pour l'état du hook
interface CalendarDataState {
  tasks: Task[];
  patients: Patient2[];
  selectedDateTasks: Task[];
  summary: TaskSummary | null;
  dayVisits: DayVisitsResponse | null;
  isLoading: boolean;
  isTasksLoading: boolean;
  isPatientsLoading: boolean;
  error: string;
  filters: CalendarDataFilters;
}

// Interface de retour du hook
interface UseCalendarDataReturn extends CalendarDataState {
  // Actions de données
  fetchTasks: (filters?: CalendarDataFilters) => Promise<void>;
  fetchPatients: () => Promise<void>;
  fetchTasksByDate: (date: string) => Promise<void>;
  fetchSummary: (date?: string) => Promise<void>;
  fetchDayVisits: (date: string) => Promise<void>;
  loadData: () => Promise<void>;
  refreshAll: () => Promise<void>;
  
  // Setters
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  setPatients: React.Dispatch<React.SetStateAction<Patient2[]>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
  setFilters: React.Dispatch<React.SetStateAction<CalendarDataFilters>>;
  clearError: () => void;
  
  // Utilitaires
  getAuthHeaders: () => { headers: { Authorization: string } };
  handleError: (error: any, defaultMessage: string) => void;
  
  // Données calculées
  getTasksForDate: (date: string) => Task[];
  getPatientTasks: (patientId: string) => Task[];
  getCompletedTasks: () => Task[];
  getPendingTasks: () => Task[];
}

export const useCalendarData = (userId: string): UseCalendarDataReturn => {
  // État principal
  const [state, setState] = useState<CalendarDataState>({
    tasks: [],
    patients: [],
    selectedDateTasks: [],
    summary: null,
    dayVisits: null,
    isLoading: true,
    isTasksLoading: false,
    isPatientsLoading: false,
    error: "",
    filters: {}
  });

  // Fonction pour obtenir les headers d'authentification
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem("token") || "";
    if (!token) {
      throw new Error("Token d'authentification manquant. Veuillez vous reconnecter.");
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }, []);

  // Gestion centralisée des erreurs
  const handleError = useCallback((error: any, defaultMessage: string) => {
    console.error('Calendar Data Error:', error);
    
    let message = defaultMessage;
    
    if (error?.response?.data) {
      if (isApiError(error.response.data)) {
        message = error.response.data.message;
      } else if (error.response.data.error) {
        message = error.response.data.error;
      }
    } else if (error?.message) {
      message = error.message;
    }
    
    setState(prev => ({ ...prev, error: message }));
  }, []);

  // Fonction pour effacer les erreurs
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: "" }));
  }, []);

  // Récupération des tâches avec filtres
  const fetchTasks = useCallback(async (filters: CalendarDataFilters = {}) => {
    setState(prev => ({ ...prev, isTasksLoading: true, error: "" }));
    
    try {
      // Construire les paramètres de requête
      const params = new URLSearchParams({ userId });
      
      if (filters.status && filters.status !== 'all') {
        params.append('completed', filters.status === 'completed' ? 'true' : 'false');
      }
      if (filters.patientId) {
        params.append('patientId', filters.patientId);
      }
      if (filters.dateFrom) {
        params.append('date', filters.dateFrom); // API backend attend 'date' pour une date spécifique
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/tasks?${params.toString()}`,
        getAuthHeaders()
      );

      if (isApiError(response.data)) {
        throw new Error(response.data.message);
      }

      const tasks: Task[] = response.data;
      
      setState(prev => ({
        ...prev,
        tasks,
        filters: { ...prev.filters, ...filters },
        isTasksLoading: false,
        error: ""
      }));

    } catch (error) {
      setState(prev => ({ ...prev, isTasksLoading: false }));
      handleError(error, "Impossible de charger les tâches");
    }
  }, [userId, getAuthHeaders, handleError]);

  // Récupération des patients
  const fetchPatients = useCallback(async () => {
    setState(prev => ({ ...prev, isPatientsLoading: true, error: "" }));
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/patient2`,
        getAuthHeaders()
      );

      if (isApiError(response.data)) {
        throw new Error(response.data.message);
      }

      const patients: Patient2[] = response.data;
      
      setState(prev => ({
        ...prev,
        patients,
        isPatientsLoading: false,
        error: ""
      }));

    } catch (error) {
      setState(prev => ({ ...prev, isPatientsLoading: false }));
      handleError(error, "Impossible de charger les patients");
    }
  }, [getAuthHeaders, handleError]);

  // Récupération des tâches pour une date spécifique
  const fetchTasksByDate = useCallback(async (date: string) => {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      handleError(new Error("Format de date invalide"), "Format de date invalide (YYYY-MM-DD requis)");
      return;
    }

    setState(prev => ({ ...prev, isTasksLoading: true, error: "" }));
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/tasks?userId=${userId}&date=${date}`,
        getAuthHeaders()
      );

      if (isApiError(response.data)) {
        throw new Error(response.data.message);
      }

      const selectedDateTasks: Task[] = response.data;
      
      setState(prev => ({
        ...prev,
        selectedDateTasks,
        isTasksLoading: false,
        error: ""
      }));

    } catch (error) {
      setState(prev => ({ ...prev, isTasksLoading: false }));
      handleError(error, `Impossible de charger les tâches du ${date}`);
    }
  }, [userId, getAuthHeaders, handleError]);

  // Récupération du résumé/statistiques
  const fetchSummary = useCallback(async (date?: string) => {
    try {
      const url = date 
        ? `${API_BASE_URL}/api/tasks/user/${userId}/summary?date=${date}`
        : `${API_BASE_URL}/api/tasks/user/${userId}/summary`;

      const response = await axios.get(url, getAuthHeaders());

      if (isApiError(response.data)) {
        throw new Error(response.data.message);
      }

      const summary: TaskSummary = response.data;
      
      setState(prev => ({
        ...prev,
        summary,
        error: ""
      }));

    } catch (error) {
      handleError(error, "Impossible de charger les statistiques");
    }
  }, [userId, getAuthHeaders, handleError]);

  // Récupération des visites du jour (avec géolocalisation)
  const fetchDayVisits = useCallback(async (date: string) => {
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      handleError(new Error("Format de date invalide"), "Format de date invalide pour les visites");
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/calendar/day-visits?date=${date}`,
        getAuthHeaders()
      );

      if (isApiError(response.data)) {
        throw new Error(response.data.message);
      }

      const dayVisits: DayVisitsResponse = response.data;
      
      setState(prev => ({
        ...prev,
        dayVisits,
        error: ""
      }));

    } catch (error) {
      handleError(error, `Impossible de charger les visites du ${date}`);
    }
  }, [getAuthHeaders, handleError]);

  // Chargement initial de toutes les données
  const loadData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: "" }));
    
    try {
      await Promise.all([
        fetchTasks(),
        fetchPatients(),
        fetchSummary()
      ]);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [fetchTasks, fetchPatients, fetchSummary]);

  // Rechargement complet
  const refreshAll = useCallback(async () => {
    clearError();
    await loadData();
  }, [loadData, clearError]);

  // Fonctions utilitaires calculées
  const getTasksForDate = useCallback((date: string): Task[] => {
    return state.tasks.filter(task => task.date === date);
  }, [state.tasks]);

  const getPatientTasks = useCallback((patientId: string): Task[] => {
    return state.tasks.filter(task => task.patientId === patientId);
  }, [state.tasks]);

  const getCompletedTasks = useCallback((): Task[] => {
    return state.tasks.filter(task => task.completed);
  }, [state.tasks]);

  const getPendingTasks = useCallback((): Task[] => {
    return state.tasks.filter(task => !task.completed);
  }, [state.tasks]);

  // Setters avec setState
  const setTasks = useCallback((tasks: React.SetStateAction<Task[]>) => {
    setState(prev => ({
      ...prev,
      tasks: typeof tasks === 'function' ? tasks(prev.tasks) : tasks
    }));
  }, []);

  const setPatients = useCallback((patients: React.SetStateAction<Patient2[]>) => {
    setState(prev => ({
      ...prev,
      patients: typeof patients === 'function' ? patients(prev.patients) : patients
    }));
  }, []);

  const setError = useCallback((error: React.SetStateAction<string>) => {
    setState(prev => ({
      ...prev,
      error: typeof error === 'function' ? error(prev.error) : error
    }));
  }, []);

  const setFilters = useCallback((filters: React.SetStateAction<CalendarDataFilters>) => {
    setState(prev => ({
      ...prev,
      filters: typeof filters === 'function' ? filters(prev.filters) : filters
    }));
  }, []);

  // Chargement initial
  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId, loadData]);

  // Retour de l'interface complète
  return {
    // État
    ...state,
    
    // Actions
    fetchTasks,
    fetchPatients,
    fetchTasksByDate,
    fetchSummary,
    fetchDayVisits,
    loadData,
    refreshAll,
    
    // Setters
    setTasks,
    setPatients,
    setError,
    setFilters,
    clearError,
    
    // Utilitaires
    getAuthHeaders,
    handleError,
    
    // Données calculées
    getTasksForDate,
    getPatientTasks,
    getCompletedTasks,
    getPendingTasks
  };
};

// Hook spécialisé pour le mode "vue patient"
export const usePatientCalendarData = (userId: string, patientId: string) => {
  const calendarData = useCalendarData(userId);
  
  // Filtrer automatiquement par patient
  useEffect(() => {
    if (patientId && userId) {
      calendarData.fetchTasks({ patientId });
    }
  }, [patientId, userId]);

  return {
    ...calendarData,
    // Données spécifiques au patient
    patientTasks: calendarData.getPatientTasks(patientId),
    currentPatient: calendarData.patients.find(p => p._id === patientId)
  };
};

// FONCTIONS DE RÉTROCOMPATIBILITÉ
// Pour faciliter la migration

export const useCalendarDataLegacy = (userId: string) => {
  const modernData = useCalendarData(userId);
  
  // Convertir les Task en CalendarTask pour rétrocompatibilité
  const events = modernData.tasks.map(task => ({
    _id: task._id || '',
    title: task.icnp?.term?.fr || 'Tâche sans titre',
    date: task.date,
    completed: task.completed,
    source: task.patientId ? "patient" as const : "manual" as const,
    patientId: task.patientId,
    patientName: task.patientName,
    actionId: task._id
  }));

  return {
    events,
    patients: modernData.patients,
    isLoading: modernData.isLoading,
    error: modernData.error,
    setEvents: (events: any) => {
      // Conversion inverse si nécessaire
      console.warn('setEvents legacy - considérez migrer vers setTasks');
    },
    setPatients: modernData.setPatients,
    setError: modernData.setError,
    fetchEvents: () => modernData.fetchTasks(),
    fetchPatients: modernData.fetchPatients,
    loadData: modernData.loadData,
    getAuthHeaders: modernData.getAuthHeaders,
    handleError: modernData.handleError
  };
};
import axios from 'axios';
import { 
  Task, 
  Patient2, 
  CreateTaskData, 
  UpdateTaskData, 
  ApiResponse, 
  isApiError,
  IcnpData 
} from '@/types';

// Configuration API
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Interface pour les paramètres du hook
interface UseCalendarActionsParams {
  userId: string;
  onTasksUpdate: (tasks: Task[]) => void;
  onError: (message: string) => void;
  getAuthHeaders: () => { headers: { Authorization: string } };
}

// Interface pour les options de création de tâche
interface CreateTaskOptions {
  title?: string; // Pour rétrocompatibilité
  icnp: IcnpData;
  date: string;
  patientId?: string;
  patientName?: string;
  notes?: string;
}

// Interface pour les retours de fonction
interface ActionResult {
  success: boolean;
  message?: string;
  data?: any;
}

export const useCalendarActions = ({
  userId,
  onTasksUpdate,
  onError,
  getAuthHeaders
}: UseCalendarActionsParams) => {
  
  // Fonction utilitaire pour gérer les erreurs API
  const handleApiError = (error: any, defaultMessage: string): ActionResult => {
    console.error('API Error:', error);
    
    if (error.response?.data?.message) {
      onError(error.response.data.message);
      return { success: false, message: error.response.data.message };
    } else if (error.message) {
      onError(error.message);
      return { success: false, message: error.message };
    } else {
      onError(defaultMessage);
      return { success: false, message: defaultMessage };
    }
  };

  // Fonction pour récupérer toutes les tâches de l'utilisateur
  const fetchTasks = async (): Promise<ActionResult> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/tasks?userId=${userId}`,
        getAuthHeaders()
      );

      if (isApiError(response.data)) {
        return handleApiError(response.data, 'Erreur lors de la récupération des tâches');
      }

      const tasks: Task[] = response.data;
      onTasksUpdate(tasks);
      
      return { success: true, data: tasks };
    } catch (error) {
      return handleApiError(error, 'Erreur lors de la récupération des tâches');
    }
  };

  // Fonction pour créer une nouvelle tâche
  const addTask = async (options: CreateTaskOptions): Promise<ActionResult> => {
    try {
      // Validation des données
      if (!options.icnp?.id || !options.icnp?.term?.fr) {
        onError('Données ICNP requises (ID et terme français)');
        return { success: false, message: 'Données ICNP incomplètes' };
      }

      if (!options.date || !/^\d{4}-\d{2}-\d{2}$/.test(options.date)) {
        onError('Date requise au format YYYY-MM-DD');
        return { success: false, message: 'Format de date invalide' };
      }

      // Construire les données de la tâche
      const taskData: CreateTaskData = {
        icnp: options.icnp,
        date: options.date,
        userId,
        patientId: options.patientId,
        patientName: options.patientName,
        notes: options.notes
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/tasks`,
        taskData,
        getAuthHeaders()
      );

      if (isApiError(response.data)) {
        return handleApiError(response.data, 'Erreur lors de la création de la tâche');
      }

      const newTask: Task = response.data;
      
      // Rafraîchir la liste des tâches
      await fetchTasks();
      
      return { 
        success: true, 
        message: 'Tâche créée avec succès',
        data: newTask 
      };
    } catch (error) {
      return handleApiError(error, 'Erreur lors de la création de la tâche');
    }
  };

  // Fonction pour supprimer une tâche
  const deleteTask = async (taskId: string): Promise<ActionResult> => {
    try {
      if (!taskId) {
        onError('ID de tâche requis');
        return { success: false, message: 'ID de tâche manquant' };
      }

      const response = await axios.delete(
        `${API_BASE_URL}/api/tasks/${taskId}`,
        getAuthHeaders()
      );

      if (isApiError(response.data)) {
        return handleApiError(response.data, 'Erreur lors de la suppression');
      }

      // Rafraîchir la liste des tâches
      await fetchTasks();
      
      return { 
        success: true, 
        message: 'Tâche supprimée avec succès' 
      };
    } catch (error) {
      return handleApiError(error, 'Erreur lors de la suppression de la tâche');
    }
  };

  // Fonction pour basculer le statut d'une tâche (réalisé/à faire)
  const toggleTaskComplete = async (taskId: string): Promise<ActionResult> => {
    try {
      if (!taskId) {
        onError('ID de tâche requis');
        return { success: false, message: 'ID de tâche manquant' };
      }

      const response = await axios.patch(
        `${API_BASE_URL}/api/tasks/${taskId}/toggle`,
        {},
        getAuthHeaders()
      );

      if (isApiError(response.data)) {
        return handleApiError(response.data, 'Erreur lors du changement de statut');
      }

      const updatedTask: Task = response.data;
      
      // Rafraîchir la liste des tâches
      await fetchTasks();
      
      return { 
        success: true, 
        message: `Tâche marquée comme ${updatedTask.completed ? 'réalisée' : 'à faire'}`,
        data: updatedTask 
      };
    } catch (error) {
      return handleApiError(error, 'Erreur lors du changement de statut');
    }
  };

  // Fonction pour mettre à jour une tâche
  const updateTask = async (taskId: string, updates: UpdateTaskData): Promise<ActionResult> => {
    try {
      if (!taskId) {
        onError('ID de tâche requis');
        return { success: false, message: 'ID de tâche manquant' };
      }

      const response = await axios.patch(
        `${API_BASE_URL}/api/tasks/${taskId}`,
        updates,
        getAuthHeaders()
      );

      if (isApiError(response.data)) {
        return handleApiError(response.data, 'Erreur lors de la mise à jour');
      }

      const updatedTask: Task = response.data;
      
      // Rafraîchir la liste des tâches
      await fetchTasks();
      
      return { 
        success: true, 
        message: 'Tâche mise à jour avec succès',
        data: updatedTask 
      };
    } catch (error) {
      return handleApiError(error, 'Erreur lors de la mise à jour de la tâche');
    }
  };

  // Fonction pour récupérer les tâches d'une date spécifique
  const getTasksByDate = async (date: string): Promise<ActionResult> => {
    try {
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        onError('Date requise au format YYYY-MM-DD');
        return { success: false, message: 'Format de date invalide' };
      }

      const response = await axios.get(
        `${API_BASE_URL}/api/tasks?userId=${userId}&date=${date}`,
        getAuthHeaders()
      );

      if (isApiError(response.data)) {
        return handleApiError(response.data, 'Erreur lors de la récupération des tâches');
      }

      const tasks: Task[] = response.data;
      
      return { 
        success: true, 
        data: tasks 
      };
    } catch (error) {
      return handleApiError(error, 'Erreur lors de la récupération des tâches du jour');
    }
  };

  // Fonction pour récupérer les statistiques de l'utilisateur
  const getTasksSummary = async (date?: string): Promise<ActionResult> => {
    try {
      const url = date 
        ? `${API_BASE_URL}/api/tasks/user/${userId}/summary?date=${date}`
        : `${API_BASE_URL}/api/tasks/user/${userId}/summary`;

      const response = await axios.get(url, getAuthHeaders());

      if (isApiError(response.data)) {
        return handleApiError(response.data, 'Erreur lors de la récupération des statistiques');
      }

      return { 
        success: true, 
        data: response.data 
      };
    } catch (error) {
      return handleApiError(error, 'Erreur lors de la récupération des statistiques');
    }
  };

  // FONCTIONS DE RÉTROCOMPATIBILITÉ
  // Pour faciliter la migration depuis l'ancien système

  // Ancienne fonction addTask avec titre simple
  const addTaskLegacy = async (title: string, date: string): Promise<boolean> => {
    if (!title.trim() || !date) return false;

    // Créer une structure ICNP basique pour rétrocompatibilité
    const icnpData: IcnpData = {
      id: '', // Pas d'ID ICNP pour les tâches legacy
      axis: 'IC',
      term: {
        fr: title.trim()
      }
    };

    const result = await addTask({
      icnp: icnpData,
      date,
      notes: 'Tâche créée via l\'ancien système'
    });

    return result.success;
  };

  // Ancienne fonction toggleComplete
  const toggleComplete = async (taskId: string): Promise<boolean> => {
    const result = await toggleTaskComplete(taskId);
    return result.success;
  };

  return {
    // Nouvelles fonctions modernes
    addTask,
    deleteTask,
    updateTask,
    toggleTaskComplete,
    fetchTasks,
    getTasksByDate,
    getTasksSummary,
    
    // Fonctions de rétrocompatibilité
    addTaskLegacy,
    toggleComplete,
    
    // Utilitaires
    handleApiError
  };
};

// Hook spécialisé pour les tâches avec patients
export const usePatientTasks = ({
  userId,
  onTasksUpdate,
  onError,
  getAuthHeaders
}: UseCalendarActionsParams) => {
  const calendarActions = useCalendarActions({
    userId,
    onTasksUpdate,
    onError,
    getAuthHeaders
  });

  // Créer une tâche liée à un patient
  const addPatientTask = async (
    patientId: string,
    patientName: string,
    icnp: IcnpData,
    date: string,
    notes?: string
  ): Promise<ActionResult> => {
    return calendarActions.addTask({
      icnp,
      date,
      patientId,
      patientName,
      notes
    });
  };

  // Récupérer les tâches d'un patient spécifique
  const getPatientTasks = async (patientId: string): Promise<ActionResult> => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/tasks?userId=${userId}&patientId=${patientId}`,
        getAuthHeaders()
      );

      if (isApiError(response.data)) {
        return calendarActions.handleApiError(response.data, 'Erreur lors de la récupération des tâches patient');
      }

      return { 
        success: true, 
        data: response.data 
      };
    } catch (error) {
      return calendarActions.handleApiError(error, 'Erreur lors de la récupération des tâches patient');
    }
  };

  return {
    ...calendarActions,
    addPatientTask,
    getPatientTasks
  };
};
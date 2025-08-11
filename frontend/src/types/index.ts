// ==========================================
// TYPES ICNP (International Classification for Nursing Practice)
// ==========================================

export interface IcnpTerm {
  fr: string;
  en?: string;
}

export interface IcnpDescription {
  fr?: string;
  en?: string;
}

export interface IcnpData {
  id: string;              // ex: "10030429"
  axis: string;            // ex: "IC" pour interventions
  term: IcnpTerm;
  description?: IcnpDescription;
}

export interface IcnpIntervention {
  _id: string;             // ex: "icnp:10043656"
  icnp_id: string;         // ex: "10043656"
  axis: string;            // ex: "IC"
  term: IcnpTerm;
  description?: IcnpDescription;
  sct?: {
    id?: string;
    term?: string;
  };
  source?: {
    icnp_fr?: string;
    icnp_en?: string;
    created_at?: string;
  };
  flags?: {
    missing_fr?: boolean;
    has_description?: boolean;
    has_sct?: boolean;
  };
}

// ==========================================
// TYPES TÂCHES (nouveau modèle Task)
// ==========================================

export interface Task {
  _id?: string;
  icnp: IcnpData;          // Structure ICNP complète
  date: string;            // Format "YYYY-MM-DD"
  completed: boolean;
  notes?: string;
  patientId?: string;      // Référence vers Patient2
  patientName?: string;    // Cache du nom patient
  userId: string;          // Utilisateur propriétaire
  createdAt?: string;
  updatedAt?: string;
}

// Type pour création de tâche (sans champs auto-générés)
export interface CreateTaskData {
  icnp: IcnpData;
  date: string;
  userId: string;
  patientId?: string;
  patientName?: string;
  notes?: string;
}

// Type pour mise à jour de tâche
export interface UpdateTaskData {
  completed?: boolean;
  notes?: string;
  date?: string;
  icnp?: Partial<IcnpData>;
}

// Ancien type pour rétrocompatibilité (à supprimer progressivement)
export type CalendarTask = Task;

// ==========================================
// TYPES PATIENTS (modèle Patient2)
// ==========================================

export interface PatientAction {
  // === Legacy (compatibilité) ===
  label: string;
  status: 'à faire' | 'réalisé';
  date?: Date | string | null;

  // === Nouveau bloc ICNP ===
  icnp: IcnpData;

  // === Champs métier ===
  patientName?: string;
  notes?: string;
}

export interface PatientConsent {
  sectionTitle: string;
  answers: string[];
  checkboxes: {
    understood: boolean;
    surgeryConsent: boolean;
    otherConsent: boolean;
  };
  validatedAt?: Date | string;
}

export interface PatientAddress {
  rue?: string;
  codePostal?: string;
  ville?: string;
  complement?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Patient2 {
  _id: string;
  nom: string;
  prenom?: string;
  dateNaissance?: Date | string;
  sexe?: string;
  statutIdentite?: string;
  uniteOrganisationnelle?: string;
  ipp?: string;
  situationDossier?: string;
  dateDebutPriseEnCharge?: Date | string;
  dateSortieEffective?: Date | string;
  dateSortiePrevue?: Date | string;
  hopitalProvenance?: string;
  pathologies: string[];
  actions: PatientAction[];
  consents: PatientConsent[];
  adresse?: PatientAddress;
  createdAt?: string;
  updatedAt?: string;
}

// Type pour création de patient
export interface CreatePatientData {
  nom: string;
  prenom?: string;
  dateNaissance?: string;
  sexe?: 'M' | 'F' | 'Autre';
  adresse?: Omit<PatientAddress, 'latitude' | 'longitude'>;
  pathologies?: string[];
  actions?: PatientAction[];
  consents?: PatientConsent[];
}

// Ancien type pour rétrocompatibilité
export type Patient = Patient2;

// ==========================================
// TYPES VISITES ET ITINÉRAIRES
// ==========================================

export interface DayVisitAction {
  taskId: string;
  icnp: IcnpData;
  date: string;
  completed: boolean;
  notes?: string | null;
}

export interface DayVisitStop {
  patientId: string;
  nom: string;
  adresse: {
    rue: string;
    codePostal: string;
    ville: string;
    complement?: string;
  };
  coords: [number, number]; // [longitude, latitude]
  actions: DayVisitAction[];
}

export interface DayVisitsResponse {
  date: string;
  count: number;
  stops: DayVisitStop[];
}

export interface TravelMatrixRequest {
  locations?: [number, number][];
  date?: string;
  origin?: [number, number];
}

export interface MatrixResult {
  count: number;
  durations: number[][]; // en secondes
  distances: number[][]; // en mètres
}

export interface TravelTimeRequest {
  from: [number, number];
  to: [number, number];
}

export interface TravelTimeResponse {
  distance_km: string;
  duration_min: number;
}

// ==========================================
// TYPES AUTHENTIFICATION
// ==========================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role?: 'user' | 'admin' | 'nurse' | 'doctor';
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  expiresIn?: string;
  user?: CurrentUser;
  message?: string;
}

export interface CurrentUser {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  createdAt?: string;
  lastLogin?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// ==========================================
// TYPES API ET ERREURS
// ==========================================

export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  timestamp: string;
  path?: string;
  method?: string;
  details?: any;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ApiSuccessResponse<T = any> {
  success: true;
  data?: T;
  message?: string;
  [key: string]: any;
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse;

// ==========================================
// TYPES UI ET FILTRES
// ==========================================

export type CalendarView = "dayGridMonth" | "timeGridWeek" | "timeGridDay";
export type TaskFilter = "all" | "completed" | "pending";
export type SourceFilter = "all" | "manual" | "patient";

export interface TaskFilters {
  status: TaskFilter;
  source: SourceFilter;
  userId?: string;
  patientId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
}

export interface TaskSummary {
  total: number;
  completed: number;
  pending: number;
  byDate: Record<string, {
    total: number;
    completed: number;
    pending: number;
  }>;
}

// ==========================================
// TYPES FORMULAIRES
// ==========================================

export interface TaskFormData {
  icnpId: string;
  icnpTermFr: string;
  icnpTermEn?: string;
  icnpDescriptionFr?: string;
  date: string;
  patientId?: string;
  notes?: string;
}

export interface PatientFormData {
  nom: string;
  prenom?: string;
  dateNaissance?: string;
  sexe?: 'M' | 'F' | 'Autre';
  adresse?: {
    rue?: string;
    codePostal?: string;
    ville?: string;
    complement?: string;
  };
}

// ==========================================
// TYPES RECHERCHE ICNP
// ==========================================

export interface IcnpSearchParams {
  q?: string;
  limit?: number;
}

export interface IcnpSearchResult {
  icnp_id: string;
  axis?: string;
  term: IcnpTerm;
  description?: IcnpDescription;
  score?: number;
}

// ==========================================
// UTILS ET HELPERS
// ==========================================

// Helper pour vérifier si une réponse API est une erreur
export const isApiError = (response: ApiResponse): response is ApiErrorResponse => {
  return response.success === false;
};

// Helper pour extraire les données d'une réponse API
export const getApiData = <T>(response: ApiResponse<T>): T | null => {
  return isApiError(response) ? null : (response.data || response as any);
};

// Formatters pour dates
export const formatDateForApi = (date: Date | string): string => {
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
};

export const formatDateForDisplay = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR');
};

// Formatters pour tâches
export const createTaskFromForm = (formData: TaskFormData, userId: string): CreateTaskData => ({
  icnp: {
    id: formData.icnpId,
    axis: 'IC',
    term: {
      fr: formData.icnpTermFr,
      en: formData.icnpTermEn
    },
    description: formData.icnpDescriptionFr ? {
      fr: formData.icnpDescriptionFr
    } : undefined
  },
  date: formData.date,
  userId,
  patientId: formData.patientId,
  notes: formData.notes
});

export default {};
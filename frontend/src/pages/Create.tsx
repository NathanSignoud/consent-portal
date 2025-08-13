import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import ActionForm from "@/components/ActionForm";
import { 
  UserPlus, 
  User, 
  Calendar, 
  Hospital, 
  FileText, 
  Plus, 
  X, 
  CheckCircle, 
  AlertCircle,
  Save,
  RefreshCw,
  MapPin,
  ArrowLeft,
  Info,
  Heart,
  Shield,
  Globe,
  Check,
  Clock,
  Activity,
  Stethoscope
} from "lucide-react";
import { IcnpData } from "@/types";

// Types pour une meilleure sécurité
interface Action {
  label: string;
  status: 'à faire' | 'réalisé';
  date: string | null;
  icnp?: IcnpData;
  notes?: string;
  priority?: 'basse' | 'normale' | 'haute' | 'urgente';
  category?: string;
  estimatedDuration?: number;
}

interface Consent {
  sectionTitle: string;
  answers: string[];
  checkboxes: {
    understood: boolean;
    surgeryConsent: boolean;
    otherConsent: boolean;
  };
  validatedAt?: Date;
}

interface Adresse {
  rue: string;
  codePostal: string;
  ville: string;
  complement: string;
}

interface FormData {
  nom: string;
  prenom: string;
  dateNaissance: string;
  sexe: string;
  statutIdentite: string;
  uniteOrganisationnelle: string;
  ipp: string;
  situationDossier: string;
  dateDebutPriseEnCharge: string;
  dateSortieEffective: string;
  dateSortiePrevue: string;
  hopitalProvenance: string;
  pathologies: string;
}

const defaultConsents: Consent[] = [
  { 
    sectionTitle: "Soins et interventions", 
    answers: [], 
    checkboxes: { understood: false, surgeryConsent: false, otherConsent: false }
  },
  { 
    sectionTitle: "Transmission des données", 
    answers: [], 
    checkboxes: { understood: false, surgeryConsent: false, otherConsent: false }
  },
  { 
    sectionTitle: "Photos et vidéos", 
    answers: [], 
    checkboxes: { understood: false, surgeryConsent: false, otherConsent: false }
  },
  { 
    sectionTitle: "Recherche et études", 
    answers: [], 
    checkboxes: { understood: false, surgeryConsent: false, otherConsent: false }
  }
];

const CreatePatientPage: React.FC = () => {
  const navigate = useNavigate();

  // États pour les champs du formulaire
  const [formData, setFormData] = useState<FormData>({
    nom: "",
    prenom: "",
    dateNaissance: "",
    sexe: "",
    statutIdentite: "",
    uniteOrganisationnelle: "",
    ipp: "",
    situationDossier: "Ouvert",
    dateDebutPriseEnCharge: new Date().toISOString().split('T')[0],
    dateSortieEffective: "",
    dateSortiePrevue: "",
    hopitalProvenance: "",
    pathologies: ""
  });

  // État pour l'adresse
  const [adresse, setAdresse] = useState<Adresse>({
    rue: "",
    codePostal: "",
    ville: "",
    complement: ""
  });

  const [actions, setActions] = useState<Action[]>([]);
  const [consents, setConsents] = useState<Consent[]>(defaultConsents);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // État pour le formulaire d'action
  const [showActionForm, setShowActionForm] = useState(false);
  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(null);

  // Validation en temps réel
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Fonction de validation
  const validateField = useCallback((field: string, value: string) => {
    const errors: Record<string, string> = { ...validationErrors };
    
    switch (field) {
      case 'nom':
        if (!value.trim()) {
          errors.nom = "Le nom est obligatoire";
        } else if (value.trim().length < 2) {
          errors.nom = "Le nom doit contenir au moins 2 caractères";
        } else {
          delete errors.nom;
        }
        break;
      case 'dateNaissance':
        if (!value) {
          errors.dateNaissance = "La date de naissance est obligatoire";
        } else {
          const birthDate = new Date(value);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          if (age < 0 || age > 150) {
            errors.dateNaissance = "Date de naissance invalide";
          } else {
            delete errors.dateNaissance;
          }
        }
        break;
      case 'sexe':
        if (!value) {
          errors.sexe = "Le sexe est obligatoire";
        } else {
          delete errors.sexe;
        }
        break;
      case 'codePostal':
        if (value && !/^\d{5}$/.test(value)) {
          errors.codePostal = "Le code postal doit contenir 5 chiffres";
        } else {
          delete errors.codePostal;
        }
        break;
    }
    
    setValidationErrors(errors);
  }, [validationErrors]);

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    validateField(field, value);
    if (error) setError("");
  }, [validateField, error]);

  const handleAdresseChange = useCallback((field: keyof Adresse, value: string) => {
    setAdresse(prev => ({
      ...prev,
      [field]: value
    }));
    validateField(field, value);
  }, [validateField]);

  // Gestion des actions avec le nouveau composant ActionForm
  const handleAddAction = useCallback((newAction: Omit<Action, 'id'>) => {
    const actionToAdd: Action = {
      ...newAction,
      date: newAction.date || null
    };
    
    if (editingActionIndex !== null) {
      // Mode édition
      setActions(prev => prev.map((action, index) => 
        index === editingActionIndex ? actionToAdd : action
      ));
      setEditingActionIndex(null);
    } else {
      // Mode ajout
      setActions(prev => [...prev, actionToAdd]);
    }
    
    setShowActionForm(false);
  }, [editingActionIndex]);

  const handleEditAction = useCallback((index: number) => {
    setEditingActionIndex(index);
    setShowActionForm(true);
  }, []);

  const handleRemoveAction = useCallback((index: number) => {
    setActions(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleCancelActionForm = useCallback(() => {
    setShowActionForm(false);
    setEditingActionIndex(null);
  }, []);

  const handleConsentChange = useCallback((index: number, field: string, value: boolean | string) => {
    setConsents(prev => prev.map((consent, i) => {
      if (i !== index) return consent;
      
      if (field.startsWith('checkboxes.')) {
        const checkboxField = field.split('.')[1];
        return {
          ...consent,
          checkboxes: {
            ...consent.checkboxes,
            [checkboxField]: value
          }
        };
      }
      
      if (field === 'answers') {
        return {
          ...consent,
          answers: typeof value === 'string' ? [value] : consent.answers
        };
      }
      
      return consent;
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      nom: "",
      prenom: "",
      dateNaissance: "",
      sexe: "",
      statutIdentite: "",
      uniteOrganisationnelle: "",
      ipp: "",
      situationDossier: "Ouvert",
      dateDebutPriseEnCharge: new Date().toISOString().split('T')[0],
      dateSortieEffective: "",
      dateSortiePrevue: "",
      hopitalProvenance: "",
      pathologies: ""
    });
    setAdresse({
      rue: "",
      codePostal: "",
      ville: "",
      complement: ""
    });
    setActions([]);
    setConsents(defaultConsents);
    setValidationErrors({});
  }, []);

  const handleSubmit = async () => {
    // Validation finale
    const requiredFields = {
      nom: formData.nom,
      dateNaissance: formData.dateNaissance,
      sexe: formData.sexe
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value.trim())
      .map(([field]) => field);

    if (missingFields.length > 0 || Object.keys(validationErrors).length > 0) {
      setError("Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Préparation des pathologies
      const pathologiesArray = formData.pathologies
        .split('-')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      // Préparation du payload avec les nouvelles actions ICNP
      const payload = {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim() || undefined,
        dateNaissance: formData.dateNaissance || undefined,
        sexe: formData.sexe || undefined,
        statutIdentite: formData.statutIdentite || undefined,
        uniteOrganisationnelle: formData.uniteOrganisationnelle || undefined,
        ipp: formData.ipp || undefined,
        situationDossier: formData.situationDossier || undefined,
        dateDebutPriseEnCharge: formData.dateDebutPriseEnCharge || undefined,
        dateSortieEffective: formData.dateSortieEffective || undefined,
        dateSortiePrevue: formData.dateSortiePrevue || undefined,
        hopitalProvenance: formData.hopitalProvenance || undefined,
        pathologies: pathologiesArray,
        actions: actions.map(action => ({
          // Compatibilité legacy
          label: action.label,
          status: action.status,
          date: action.date,
          // Nouveau système ICNP
          icnp: action.icnp || {
            id: '',
            axis: 'IC',
            term: { fr: action.label }
          },
          // Métadonnées
          notes: action.notes,
          priority: action.priority,
          category: action.category,
          estimatedDuration: action.estimatedDuration
        })),
        consents: consents.map(consent => ({
          ...consent,
          validatedAt: new Date().toISOString()
        })),
        adresse: (adresse.rue || adresse.codePostal || adresse.ville || adresse.complement) ? {
          rue: adresse.rue || undefined,
          codePostal: adresse.codePostal || undefined,
          ville: adresse.ville || undefined,
          complement: adresse.complement || undefined
        } : undefined
      };

      // Suppression des propriétés undefined
      Object.keys(payload).forEach(key => {
        if (payload[key as keyof typeof payload] === undefined || payload[key as keyof typeof payload] === "") {
          delete payload[key as keyof typeof payload];
        }
      });

      console.log("🚀 Création patient - Payload:", payload);

      // Appel API
      const response = await fetch('/api/patient2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Patient créé avec succès:", result);
      
      setSuccess(true);
      resetForm();
      
      // Redirection automatique après succès
      setTimeout(() => {
        navigate('/hub/admin');
      }, 2000);
      
    } catch (err: any) {
      console.error("❌ Erreur création patient:", err);
      
      if (err.message.includes('409')) {
        setError("Un patient avec ces informations existe déjà");
      } else if (err.message.includes('400')) {
        setError("Données invalides. Vérifiez les champs du formulaire.");
      } else if (err.message.includes('500')) {
        setError("Erreur serveur. Veuillez réessayer ou contacter l'administrateur.");
      } else {
        setError(err.message || "Erreur lors de la création du patient");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.nom.trim() && formData.dateNaissance && formData.sexe && Object.keys(validationErrors).length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 relative overflow-hidden">
      
      {/* Éléments décoratifs de fond */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-200/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-purple-200/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* En-tête avec navigation */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Nouveau Patient
              </h1>
              <p className="text-gray-600 mt-1">Créer un nouveau dossier patient avec actions ICNP</p>
            </div>
          </div>
        </div>

        {/* Messages d'état */}
        {error && (
          <Alert className="mb-6 bg-red-50/80 backdrop-blur-sm border-red-200/50">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <AlertDescription className="text-red-800 font-medium">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 bg-green-50/80 backdrop-blur-sm border-green-200/50">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <AlertDescription className="text-green-800 font-medium">
              Patient créé avec succès ! Redirection en cours...
            </AlertDescription>
          </Alert>
        )}

        {/* Informations de validation */}
        {Object.keys(validationErrors).length > 0 && (
          <Alert className="mb-6 bg-amber-50/80 backdrop-blur-sm border-amber-200/50">
            <Info className="w-5 h-5 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <div className="font-medium mb-2">Erreurs à corriger :</div>
              <ul className="list-disc list-inside space-y-1">
                {Object.entries(validationErrors).map(([field, message]) => (
                  <li key={field} className="text-sm">{message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Informations personnelles */}
          <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <User className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Informations personnelles</h2>
                <Badge variant="outline" className="text-xs">Obligatoire</Badge>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nom" className="text-sm font-medium text-gray-700">
                      Nom * {validationErrors.nom && <span className="text-red-500 text-xs">({validationErrors.nom})</span>}
                    </Label>
                    <Input
                      id="nom"
                      type="text"
                      placeholder="Ex : Dupont"
                      value={formData.nom}
                      onChange={(e) => handleInputChange('nom', e.target.value)}
                      className={`mt-1 bg-white/80 backdrop-blur-sm border rounded-lg focus:ring-2 focus:ring-blue-500/50 ${
                        validationErrors.nom ? 'border-red-300 focus:border-red-500' : 'border-gray-200/50'
                      }`}
                    />
                  </div>

                  <div>
                    <Label htmlFor="prenom" className="text-sm font-medium text-gray-700">
                      Prénom
                    </Label>
                    <Input
                      id="prenom"
                      type="text"
                      placeholder="Ex : Jean"
                      value={formData.prenom}
                      onChange={(e) => handleInputChange('prenom', e.target.value)}
                      className="mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateNaissance" className="text-sm font-medium text-gray-700">
                      Date de naissance * {validationErrors.dateNaissance && <span className="text-red-500 text-xs">({validationErrors.dateNaissance})</span>}
                    </Label>
                    <Input
                      id="dateNaissance"
                      type="date"
                      value={formData.dateNaissance}
                      onChange={(e) => handleInputChange('dateNaissance', e.target.value)}
                      className={`mt-1 bg-white/80 backdrop-blur-sm border rounded-lg focus:ring-2 focus:ring-blue-500/50 ${
                        validationErrors.dateNaissance ? 'border-red-300 focus:border-red-500' : 'border-gray-200/50'
                      }`}
                    />
                  </div>

                  <div>
                    <Label htmlFor="sexe" className="text-sm font-medium text-gray-700">
                      Sexe * {validationErrors.sexe && <span className="text-red-500 text-xs">({validationErrors.sexe})</span>}
                    </Label>
                    <select
                      id="sexe"
                      value={formData.sexe}
                      onChange={(e) => handleInputChange('sexe', e.target.value)}
                      className={`mt-1 w-full bg-white/80 backdrop-blur-sm border rounded-lg focus:ring-2 focus:ring-blue-500/50 px-3 py-2 ${
                        validationErrors.sexe ? 'border-red-300 focus:border-red-500' : 'border-gray-200/50'
                      }`}
                    >
                      <option value="">Sélectionner</option>
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="statutIdentite" className="text-sm font-medium text-gray-700">
                      Statut identité
                    </Label>
                    <select
                      id="statutIdentite"
                      value={formData.statutIdentite}
                      onChange={(e) => handleInputChange('statutIdentite', e.target.value)}
                      className="mt-1 w-full bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50 px-3 py-2"
                    >
                      <option value="">Sélectionner</option>
                      <option value="Validé">Validé</option>
                      <option value="Provisoire">Provisoire</option>
                      <option value="Anonyme">Anonyme</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="ipp" className="text-sm font-medium text-gray-700">
                      IPP (Identifiant Patient Permanent)
                    </Label>
                    <Input
                      id="ipp"
                      type="text"
                      placeholder="Généré automatiquement si vide"
                      value={formData.ipp}
                      onChange={(e) => handleInputChange('ipp', e.target.value)}
                      className="mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="pathologies" className="text-sm font-medium text-gray-700">
                    Pathologies
                    <span className="text-gray-500 text-xs ml-2">(Séparer par des tirets)</span>
                  </Label>
                  <Input
                    id="pathologies"
                    type="text"
                    placeholder="Ex: Diabète - Hypertension - Asthme"
                    value={formData.pathologies}
                    onChange={(e) => handleInputChange('pathologies', e.target.value)}
                    className="mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50"
                  />
                  {formData.pathologies && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {formData.pathologies.split('-').map((pathology, index) => {
                        const trimmed = pathology.trim();
                        return trimmed ? (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <Heart className="w-3 h-3 mr-1" />
                            {trimmed}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Adresse */}
          <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <MapPin className="w-5 h-5 text-red-600" />
                <h2 className="text-xl font-semibold text-gray-900">Adresse</h2>
                <Badge variant="outline" className="text-xs">Optionnel</Badge>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rue" className="text-sm font-medium text-gray-700">
                    Rue
                  </Label>
                  <Input
                    id="rue"
                    type="text"
                    placeholder="Ex : 123 rue de la Paix"
                    value={adresse.rue}
                    onChange={(e) => handleAdresseChange('rue', e.target.value)}
                    className="mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="codePostal" className="text-sm font-medium text-gray-700">
                      Code postal {validationErrors.codePostal && <span className="text-red-500 text-xs">({validationErrors.codePostal})</span>}
                    </Label>
                    <Input
                      id="codePostal"
                      type="text"
                      placeholder="Ex : 75001"
                      maxLength={5}
                      value={adresse.codePostal}
                      onChange={(e) => handleAdresseChange('codePostal', e.target.value)}
                      className={`mt-1 bg-white/80 backdrop-blur-sm border rounded-lg focus:ring-2 focus:ring-blue-500/50 ${
                        validationErrors.codePostal ? 'border-red-300 focus:border-red-500' : 'border-gray-200/50'
                      }`}
                    />
                  </div>

                  <div>
                    <Label htmlFor="ville" className="text-sm font-medium text-gray-700">
                      Ville
                    </Label>
                    <Input
                      id="ville"
                      type="text"
                      placeholder="Ex : Paris"
                      value={adresse.ville}
                      onChange={(e) => handleAdresseChange('ville', e.target.value)}
                      className="mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="complement" className="text-sm font-medium text-gray-700">
                    Complément d'adresse
                  </Label>
                  <Input
                    id="complement"
                    type="text"
                    placeholder="Ex : Bâtiment A, 2ème étage, Porte 201"
                    value={adresse.complement}
                    onChange={(e) => handleAdresseChange('complement', e.target.value)}
                    className="mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div className="p-3 bg-blue-50/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Globe className="w-4 h-4 text-blue-600 mt-0.5" />
                    <p className="text-sm text-blue-700">
                      <strong>Géolocalisation automatique :</strong> Les coordonnées GPS seront calculées automatiquement si l'adresse est complète.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Informations hospitalières */}
        <Card className="mt-8 bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Hospital className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Informations hospitalières</h2>
              <Badge variant="outline" className="text-xs">Optionnel</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="uniteOrganisationnelle" className="text-sm font-medium text-gray-700">
                  Unité organisationnelle
                </Label>
                <Input
                  id="uniteOrganisationnelle"
                  type="text"
                  placeholder="Ex : Service de cardiologie"
                  value={formData.uniteOrganisationnelle}
                  onChange={(e) => handleInputChange('uniteOrganisationnelle', e.target.value)}
                  className="mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <Label htmlFor="situationDossier" className="text-sm font-medium text-gray-700">
                  Situation du dossier
                </Label>
                <select
                  id="situationDossier"
                  value={formData.situationDossier}
                  onChange={(e) => handleInputChange('situationDossier', e.target.value)}
                  className="mt-1 w-full bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50 px-3 py-2"
                >
                  <option value="Ouvert">Ouvert</option>
                  <option value="En cours">En cours</option>
                  <option value="Fermé">Fermé</option>
                  <option value="En attente">En attente</option>
                  <option value="Suspendu">Suspendu</option>
                </select>
              </div>

              <div>
                <Label htmlFor="hopitalProvenance" className="text-sm font-medium text-gray-700">
                  Hôpital de provenance
                </Label>
                <Input
                  id="hopitalProvenance"
                  type="text"
                  placeholder="Ex : CHU de Nice"
                  value={formData.hopitalProvenance}
                  onChange={(e) => handleInputChange('hopitalProvenance', e.target.value)}
                  className="mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <Label htmlFor="dateDebutPriseEnCharge" className="text-sm font-medium text-gray-700">
                  Date début prise en charge
                </Label>
                <Input
                  id="dateDebutPriseEnCharge"
                  type="date"
                  value={formData.dateDebutPriseEnCharge}
                  onChange={(e) => handleInputChange('dateDebutPriseEnCharge', e.target.value)}
                  className="mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <Label htmlFor="dateSortiePrevue" className="text-sm font-medium text-gray-700">
                  Date sortie prévue
                </Label>
                <Input
                  id="dateSortiePrevue"
                  type="date"
                  value={formData.dateSortiePrevue}
                  onChange={(e) => handleInputChange('dateSortiePrevue', e.target.value)}
                  className="mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <Label htmlFor="dateSortieEffective" className="text-sm font-medium text-gray-700">
                  Date sortie effective
                </Label>
                <Input
                  id="dateSortieEffective"
                  type="date"
                  value={formData.dateSortieEffective}
                  onChange={(e) => handleInputChange('dateSortieEffective', e.target.value)}
                  className="mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            <div className="mt-4 p-3 bg-green-50/50 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-green-600 mt-0.5" />
                <p className="text-sm text-green-700">
                  <strong>Conseil :</strong> La date de début de prise en charge est pré-remplie avec la date d'aujourd'hui.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions et consentements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          
          {/* Actions ICNP avec le nouveau composant ActionForm */}
          <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-purple-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Actions de soins ICNP</h2>
                  <Badge variant="outline" className="text-xs">{actions.length} action{actions.length > 1 ? 's' : ''}</Badge>
                </div>
                
                <Button 
                  onClick={() => setShowActionForm(true)}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg shadow-lg transition-all duration-300"
                  disabled={showActionForm}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une action
                </Button>
              </div>

              {/* Composant ActionForm moderne */}
              {showActionForm && (
                <div className="mb-6">
                  <ActionForm
                    isVisible={showActionForm}
                    onCancel={handleCancelActionForm}
                    onAddAction={handleAddAction}
                    title={editingActionIndex !== null ? "Modifier l'action" : "Nouvelle action de soins"}
                    placeholder="Rechercher une intervention ICNP..."
                    mode="detailed"
                    showIcnpDetails={true}
                    showSuggestions={true}
                    allowCustomActions={true}
                    editingAction={editingActionIndex !== null ? actions[editingActionIndex] : undefined}
                    isEditing={editingActionIndex !== null}
                    patientName={`${formData.prenom} ${formData.nom}`.trim() || "Nouveau patient"}
                  />
                </div>
              )}

              {/* Liste des actions */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {actions.length === 0 ? (
                  <div className="text-center py-8">
                    <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 italic">Aucune action définie</p>
                    <p className="text-sm text-gray-400 mt-1">Utilisez le système ICNP pour définir des actions de soins standardisées</p>
                  </div>
                ) : (
                  actions.map((action, index) => (
                    <div
                      key={index}
                      className="group flex items-center justify-between p-4 bg-white/60 hover:bg-white/80 rounded-lg border border-gray-100 transition-all duration-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <p className="font-medium text-gray-900">{action.label}</p>
                          {action.icnp && action.icnp.id && (
                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                              ICNP: {action.icnp.id}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <Badge 
                            variant={action.status === 'réalisé' ? "default" : "secondary"}
                            className={action.status === 'réalisé' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                          >
                            {action.status === 'réalisé' ? (
                              <Check className="w-3 h-3 mr-1" />
                            ) : (
                              <Clock className="w-3 h-3 mr-1" />
                            )}
                            {action.status === 'réalisé' ? 'Réalisé' : 'À faire'}
                          </Badge>
                          
                          {action.priority && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                action.priority === 'urgente' ? 'border-red-300 text-red-700' :
                                action.priority === 'haute' ? 'border-orange-300 text-orange-700' :
                                action.priority === 'normale' ? 'border-blue-300 text-blue-700' :
                                'border-gray-300 text-gray-700'
                              }`}
                            >
                              {action.priority}
                            </Badge>
                          )}
                          
                          {action.category && (
                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              {action.category}
                            </span>
                          )}
                          
                          {action.date && (
                            <span className="text-xs text-gray-600 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(action.date).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                          
                          {action.estimatedDuration && (
                            <span className="text-xs text-gray-600 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {action.estimatedDuration}min
                            </span>
                          )}
                        </div>
                        
                        {action.notes && (
                          <p className="text-sm text-gray-600 mt-2 italic">{action.notes}</p>
                        )}
                        
                        {action.icnp?.description?.fr && (
                          <p className="text-sm text-blue-600 mt-1">{action.icnp.description.fr}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <button
                          onClick={() => handleEditAction(index)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                          title="Modifier cette action"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveAction(index)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded"
                          title="Supprimer cette action"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {actions.length > 0 && (
                <div className="mt-4 p-3 bg-purple-50/50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Activity className="w-4 h-4 text-purple-600 mt-0.5" />
                    <p className="text-sm text-purple-700">
                      <strong>Actions ICNP définies :</strong> Les interventions suivent la classification internationale pour la pratique infirmière (ICNP).
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Consentements */}
          <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="w-5 h-5 text-orange-600" />
                <h2 className="text-xl font-semibold text-gray-900">Consentements</h2>
                <Badge variant="outline" className="text-xs">Conformité RGPD</Badge>
              </div>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {consents.map((consent, index) => (
                  <div key={index} className="p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold text-orange-600">
                        {index + 1}
                      </span>
                      {consent.sectionTitle}
                    </h3>
                    
                    {/* Remarques/Notes */}
                    <div className="mb-3">
                      <Label className="text-sm font-medium text-gray-700">
                        Remarques/Notes
                      </Label>
                      <Input
                        type="text"
                        placeholder="Ajouter une note ou remarque..."
                        onChange={(e) => handleConsentChange(index, 'answers', e.target.value)}
                        className="mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-orange-500/50"
                      />
                    </div>

                    {/* Cases à cocher */}
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id={`understood-${index}`}
                          checked={consent.checkboxes.understood}
                          onChange={(e) => handleConsentChange(index, 'checkboxes.understood', e.target.checked)}
                          className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 mt-0.5"
                        />
                        <label
                          htmlFor={`understood-${index}`}
                          className="text-sm text-gray-700 leading-relaxed"
                        >
                          <strong>Information comprise et acceptée</strong><br />
                          <span className="text-gray-600">Le patient a lu et compris les informations fournies</span>
                        </label>
                      </div>

                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id={`surgery-${index}`}
                          checked={consent.checkboxes.surgeryConsent}
                          onChange={(e) => handleConsentChange(index, 'checkboxes.surgeryConsent', e.target.checked)}
                          className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 mt-0.5"
                        />
                        <label
                          htmlFor={`surgery-${index}`}
                          className="text-sm text-gray-700 leading-relaxed"
                        >
                          <strong>Consentement aux soins/intervention</strong><br />
                          <span className="text-gray-600">Accord pour les soins médicaux et interventions proposés</span>
                        </label>
                      </div>

                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id={`other-${index}`}
                          checked={consent.checkboxes.otherConsent}
                          onChange={(e) => handleConsentChange(index, 'checkboxes.otherConsent', e.target.checked)}
                          className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 mt-0.5"
                        />
                        <label
                          htmlFor={`other-${index}`}
                          className="text-sm text-gray-700 leading-relaxed"
                        >
                          <strong>Autres consentements</strong><br />
                          <span className="text-gray-600">Consentements spécifiques selon le contexte</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-orange-50/50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-orange-600 mt-0.5" />
                  <p className="text-sm text-orange-700">
                    <strong>Conformité RGPD :</strong> Les consentements seront horodatés automatiquement lors de la création.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bouton de soumission */}
        <Card className="mt-8 bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Créer le dossier patient</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Vérifiez toutes les informations avant de créer le dossier avec les actions ICNP.
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isFormValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-600">
                      Formulaire {isFormValid ? 'valide' : 'incomplet'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${actions.length > 0 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm text-gray-600">
                      {actions.length} action{actions.length > 1 ? 's' : ''} ICNP
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${actions.filter(a => a.icnp?.id).length > 0 ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm text-gray-600">
                      {actions.filter(a => a.icnp?.id).length} avec code ICNP
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={resetForm}
                  disabled={isLoading}
                  className="px-6 py-3"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Réinitialiser
                </Button>
                
                <Button 
                  onClick={handleSubmit}
                  disabled={!isFormValid || isLoading}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Créer le patient
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {!isFormValid && (
              <Alert className="mt-4 bg-amber-50/50 border-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <strong>Champs obligatoires manquants :</strong> nom, date de naissance et sexe sont requis.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatePatientPage;
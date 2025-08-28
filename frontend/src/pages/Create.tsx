import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
  Heart,
  Activity,
  Stethoscope,
  BookOpen,
  Edit3,
  Search,
  Loader2,
  Clock,
  Check
} from "lucide-react";

// Types pour les actions ICNP
interface IcnpIntervention {
  _id: string;
  icnp_id: string;
  axis: string;
  term: {
    fr: string;
    en?: string;
  };
  description?: {
    fr?: string;
    en?: string;
  };
}

interface Action {
  label: string;
  status: 'à faire' | 'réalisé';
  date: string | null;
  icnp?: {
    id: string;
    axis: string;
    term: { fr: string; en?: string };
    description?: { fr?: string; en?: string };
  };
  notes?: string;
  priority?: 'basse' | 'normale' | 'haute' | 'urgente';
  category?: string;
  estimatedDuration?: number;
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

interface Adresse {
  rue: string;
  codePostal: string;
  ville: string;
  complement: string;
}

// =======================================
// COMPOSANT ACTION FORM ICNP INTÉGRÉ
// =======================================

interface ActionFormProps {
  isVisible: boolean;
  onCancel: () => void;
  onAddAction: (action: any) => void;
  editingAction?: Action;
  isEditing?: boolean;
}

const ActionFormICNP: React.FC<ActionFormProps> = ({
  isVisible,
  onCancel,
  onAddAction,
  editingAction,
  isEditing = false
}) => {
  const [searchQuery, setSearchQuery] = useState(editingAction?.label || '');
  const [icnpResults, setIcnpResults] = useState<IcnpIntervention[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIcnp, setSelectedIcnp] = useState<IcnpIntervention | null>(
    editingAction?.icnp ? {
      _id: `icnp:${editingAction.icnp.id}`,
      icnp_id: editingAction.icnp.id,
      axis: editingAction.icnp.axis,
      term: editingAction.icnp.term,
      description: editingAction.icnp.description
    } : null
  );
  const [formData, setFormData] = useState({
    status: editingAction?.status || 'à faire',
    date: editingAction?.date || '',
    priority: editingAction?.priority || 'normale',
    notes: editingAction?.notes || '',
    estimatedDuration: editingAction?.estimatedDuration || 30
  });

  // Recherche ICNP dans la base de données
  const searchIcnp = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setIcnpResults([]);
      return;
    }

    setIsSearching(true);
    try {
      console.log('🔍 Recherche ICNP:', query);
      const response = await fetch(`/api/icnp?q=${encodeURIComponent(query)}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const results = await response.json();
      console.log('✅ Résultats ICNP:', results);
      setIcnpResults(results || []);
    } catch (error) {
      console.error('❌ Erreur recherche ICNP:', error);
      setIcnpResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Déclenchement de la recherche avec debounce
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    
    // Si on efface la recherche, effacer la sélection
    if (!value.trim()) {
      setSelectedIcnp(null);
      setIcnpResults([]);
      return;
    }

    // Debounce de 300ms
    const timeoutId = setTimeout(() => {
      searchIcnp(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchIcnp]);

  // Sélection d'une intervention ICNP
  const handleSelectIcnp = useCallback((intervention: IcnpIntervention) => {
    console.log('✅ ICNP sélectionnée:', intervention);
    setSelectedIcnp(intervention);
    setSearchQuery(intervention.term.fr);
    setIcnpResults([]);
  }, []);

  // Soumission du formulaire
  const handleSubmit = useCallback(() => {
    if (!searchQuery.trim()) {
      alert('Veuillez saisir un titre pour l\'action');
      return;
    }

    const actionData = {
      label: searchQuery.trim(),
      status: formData.status,
      date: formData.date || null,
      priority: formData.priority,
      notes: formData.notes,
      estimatedDuration: formData.estimatedDuration,
      
      // Données ICNP si sélectionnées
      icnp: selectedIcnp ? {
        id: selectedIcnp.icnp_id,
        axis: selectedIcnp.axis,
        term: {
          fr: selectedIcnp.term.fr,
          en: selectedIcnp.term.en
        },
        description: {
          fr: selectedIcnp.description?.fr,
          en: selectedIcnp.description?.en
        }
      } : undefined
    };

    console.log('📤 Données action envoyées:', actionData);
    onAddAction(actionData);
  }, [searchQuery, formData, selectedIcnp, onAddAction]);

  if (!isVisible) return null;

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Activity className="w-5 h-5" />
          {isEditing ? 'Modifier l\'action ICNP' : 'Nouvelle action ICNP'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Recherche ICNP */}
        <div>
          <Label className="text-sm font-medium text-purple-700">
            Rechercher une intervention ICNP *
          </Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Ex: toilette, pansement, surveillance..."
              className="pl-10 pr-4 border-purple-200 focus:border-purple-400 focus:ring-purple-400"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-purple-600" />
            )}
          </div>

          {/* Résultats de recherche ICNP */}
          {icnpResults.length > 0 && (
            <div className="mt-2 max-h-60 overflow-y-auto border border-purple-200 rounded-lg bg-white shadow-lg">
              {icnpResults.map((result, index) => (
                <div
                  key={result._id}
                  onClick={() => handleSelectIcnp(result)}
                  className="p-3 hover:bg-purple-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{result.term.fr}</p>
                      {result.description?.fr && (
                        <p className="text-sm text-gray-600 mt-1">{result.description.fr}</p>
                      )}
                    </div>
                    <div className="ml-3 flex flex-col items-end">
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {result.icnp_id}
                      </Badge>
                      <span className="text-xs text-gray-500 mt-1">{result.axis}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Intervention sélectionnée */}
          {selectedIcnp && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">ICNP sélectionnée</span>
                </div>
                <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                  Code: {selectedIcnp.icnp_id}
                </Badge>
              </div>
              {selectedIcnp.description?.fr && (
                <p className="text-sm text-blue-700 mt-2 italic">{selectedIcnp.description.fr}</p>
              )}
            </div>
          )}
        </div>

        {/* Statut */}
        <div>
          <Label className="text-sm font-medium text-purple-700">Statut</Label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'à faire' | 'réalisé' }))}
            className="mt-1 w-full border border-purple-200 rounded-lg px-3 py-2 focus:border-purple-400 focus:ring-purple-400"
          >
            <option value="à faire">À faire</option>
            <option value="réalisé">Réalisé</option>
          </select>
        </div>

        {/* Date de réalisation */}
        <div>
          <Label className="text-sm font-medium text-purple-700">
            Date de réalisation {formData.status === 'réalisé' && '*'}
          </Label>
          <Input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className="mt-1 border-purple-200 focus:border-purple-400 focus:ring-purple-400"
          />
        </div>

        {/* Priorité */}
        <div>
          <Label className="text-sm font-medium text-purple-700">Priorité</Label>
          <select
            value={formData.priority}
            onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
            className="mt-1 w-full border border-purple-200 rounded-lg px-3 py-2 focus:border-purple-400 focus:ring-purple-400"
          >
            <option value="basse">Basse</option>
            <option value="normale">Normale</option>
            <option value="haute">Haute</option>
            <option value="urgente">Urgente</option>
          </select>
        </div>

        {/* Durée estimée */}
        <div>
          <Label className="text-sm font-medium text-purple-700">Durée estimée (minutes)</Label>
          <Input
            type="number"
            min="5"
            max="240"
            value={formData.estimatedDuration}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 30 }))}
            className="mt-1 border-purple-200 focus:border-purple-400 focus:ring-purple-400"
          />
        </div>

        {/* Notes */}
        <div>
          <Label className="text-sm font-medium text-purple-700">Notes</Label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Notes additionnelles sur l'intervention..."
            rows={3}
            className="mt-1 w-full border border-purple-200 rounded-lg px-3 py-2 focus:border-purple-400 focus:ring-purple-400 resize-none"
          />
        </div>

        {/* Boutons d'action */}
        <div className="flex justify-end gap-3 pt-4 border-t border-purple-200">
          <Button
            onClick={onCancel}
            variant="outline"
            className="border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isEditing ? (
              <>
                <Edit3 className="w-4 h-4 mr-2" />
                Modifier
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// =======================================
// COMPOSANT PRINCIPAL CREATE
// =======================================

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

  const [adresse, setAdresse] = useState<Adresse>({
    rue: "",
    codePostal: "",
    ville: "",
    complement: ""
  });

  const [actions, setActions] = useState<Action[]>([]);
  
  // États pour l'interface
  const [showActionForm, setShowActionForm] = useState(false);
  const [editingActionIndex, setEditingActionIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Validation et gestion des champs
  const validateField = useCallback((field: keyof FormData, value: string) => {
    const errors = { ...validationErrors };
    
    switch (field) {
      case 'nom':
        if (!value.trim()) {
          errors.nom = "Le nom est obligatoire";
        } else if (value.length < 2) {
          errors.nom = "Le nom doit contenir au moins 2 caractères";
        } else {
          delete errors.nom;
        }
        break;
      case 'dateNaissance':
        if (value) {
          const birthDate = new Date(value);
          const now = new Date();
          const age = now.getFullYear() - birthDate.getFullYear();
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
    }
    
    setValidationErrors(errors);
  }, [validationErrors]);

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
    if (error) setError("");
  }, [validateField, error]);

  const handleAdresseChange = useCallback((field: keyof Adresse, value: string) => {
    setAdresse(prev => ({ ...prev, [field]: value }));
  }, []);

  // Gestion des actions ICNP
  const handleAddAction = useCallback((actionData: any) => {
    console.log("🆕 Action ICNP reçue:", actionData);
    
    const newAction: Action = {
      label: actionData.label,
      status: actionData.status || 'à faire',
      date: actionData.date || null,
      icnp: actionData.icnp,
      notes: actionData.notes || '',
      priority: actionData.priority || 'normale',
      category: actionData.category || '',
      estimatedDuration: actionData.estimatedDuration || 30
    };

    if (editingActionIndex !== null) {
      setActions(prev => prev.map((action, index) => 
        index === editingActionIndex ? newAction : action
      ));
      setEditingActionIndex(null);
    } else {
      setActions(prev => [...prev, newAction]);
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

  // Fonction de soumission
  const handleSubmit = async () => {
    // Validation finale
    const requiredFields = { nom: formData.nom, dateNaissance: formData.dateNaissance, sexe: formData.sexe };
    const missingFields = Object.entries(requiredFields).filter(([_, value]) => !value.trim()).map(([field]) => field);

    if (missingFields.length > 0 || Object.keys(validationErrors).length > 0) {
      setError("Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Traitement des pathologies
      let pathologiesArray: string[] = [];
      if (formData.pathologies && formData.pathologies.trim()) {
        pathologiesArray = formData.pathologies
          .split('-')
          .map(p => p.trim())
          .filter(p => p.length > 0)
          .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
      }

      // Payload avec actions ICNP
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
        
        // Actions avec données ICNP complètes
        actions: actions.map(action => ({
          label: action.label,
          status: action.status,
          date: action.date,
          icnp: action.icnp || {
            id: '',
            axis: 'IC',
            term: { fr: action.label },
            description: { fr: null, en: null }
          },
          patientName: `${formData.prenom} ${formData.nom}`.trim(),
          notes: action.notes,
          priority: action.priority,
          estimatedDuration: action.estimatedDuration
        })),
        
        adresse: (adresse.rue || adresse.codePostal || adresse.ville || adresse.complement) ? {
          rue: adresse.rue || undefined,
          codePostal: adresse.codePostal || undefined,
          ville: adresse.ville || undefined,
          complement: adresse.complement || undefined
        } : undefined
      };

      console.log("🚀 Payload avec ICNP:", JSON.stringify(payload, null, 2));

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
      console.log("✅ Patient créé avec ICNP:", result);
      
      setSuccess(true);
      setTimeout(() => navigate('/hub/admin'), 2000);
      
    } catch (err: any) {
      console.error("❌ Erreur création:", err);
      setError(err.message || "Erreur lors de la création du patient");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.nom.trim() && formData.dateNaissance && formData.sexe && Object.keys(validationErrors).length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        
        {/* En-tête */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/hub/admin')}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              Nouveau Patient
            </h1>
            <p className="text-gray-600 mt-2">Créer un dossier patient avec interventions ICNP standardisées</p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Patient créé avec succès ! Redirection en cours...
            </AlertDescription>
          </Alert>
        )}

        {/* =======================================
            BLOC 1: INFORMATIONS PERSONNELLES
            ======================================= */}
        
        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="nom" className="text-sm font-medium text-gray-700">Nom *</Label>
              <Input
                id="nom"
                type="text"
                value={formData.nom}
                onChange={(e) => handleInputChange('nom', e.target.value)}
                className={validationErrors.nom ? 'border-red-300' : ''}
                placeholder="Nom de famille"
              />
              {validationErrors.nom && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.nom}</p>
              )}
            </div>

            <div>
              <Label htmlFor="prenom" className="text-sm font-medium text-gray-700">Prénom</Label>
              <Input
                id="prenom"
                type="text"
                value={formData.prenom}
                onChange={(e) => handleInputChange('prenom', e.target.value)}
                placeholder="Prénom"
              />
            </div>

            <div>
              <Label htmlFor="dateNaissance" className="text-sm font-medium text-gray-700">Date de naissance *</Label>
              <Input
                id="dateNaissance"
                type="date"
                value={formData.dateNaissance}
                onChange={(e) => handleInputChange('dateNaissance', e.target.value)}
                className={validationErrors.dateNaissance ? 'border-red-300' : ''}
              />
              {validationErrors.dateNaissance && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.dateNaissance}</p>
              )}
            </div>

            <div>
              <Label htmlFor="sexe" className="text-sm font-medium text-gray-700">Sexe *</Label>
              <select
                id="sexe"
                value={formData.sexe}
                onChange={(e) => handleInputChange('sexe', e.target.value)}
                className={`mt-1 w-full border rounded-lg px-3 py-2 ${
                  validationErrors.sexe ? 'border-red-300' : 'border-gray-200'
                }`}
              >
                <option value="">Sélectionner</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
                <option value="Autre">Autre</option>
              </select>
              {validationErrors.sexe && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.sexe}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* =======================================
            BLOC 2: INFORMATIONS MÉDICALES
            ======================================= */}
        
        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-600" />
              Informations médicales
            </CardTitle>
          </CardHeader>
          <CardContent>
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
                className="mt-1"
              />
              {formData.pathologies && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {formData.pathologies.split('-').map((pathology, index) => {
                    const trimmed = pathology.trim();
                    return trimmed ? (
                      <Badge key={index} variant="secondary" className="bg-red-50 text-red-700 border-red-200">
                        {trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* =======================================
            BLOC 3: INFORMATIONS ADMINISTRATIVES
            ======================================= */}
        
        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hospital className="w-5 h-5 text-green-600" />
              Informations administratives
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="ipp" className="text-sm font-medium text-gray-700">IPP (Identifiant Patient)</Label>
                <Input
                  id="ipp"
                  type="text"
                  value={formData.ipp}
                  onChange={(e) => handleInputChange('ipp', e.target.value)}
                  placeholder="Identifiant unique"
                />
              </div>

              <div>
                <Label htmlFor="statutIdentite" className="text-sm font-medium text-gray-700">Statut d'identité</Label>
                <Input
                  id="statutIdentite"
                  type="text"
                  value={formData.statutIdentite}
                  onChange={(e) => handleInputChange('statutIdentite', e.target.value)}
                  placeholder="Ex: Validé, Provisoire"
                />
              </div>

              <div>
                <Label htmlFor="uniteOrganisationnelle" className="text-sm font-medium text-gray-700">Unité organisationnelle</Label>
                <Input
                  id="uniteOrganisationnelle"
                  type="text"
                  value={formData.uniteOrganisationnelle}
                  onChange={(e) => handleInputChange('uniteOrganisationnelle', e.target.value)}
                  placeholder="Service hospitalier"
                />
              </div>

              <div>
                <Label htmlFor="situationDossier" className="text-sm font-medium text-gray-700">Situation dossier</Label>
                <select
                  id="situationDossier"
                  value={formData.situationDossier}
                  onChange={(e) => handleInputChange('situationDossier', e.target.value)}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2"
                >
                  <option value="Ouvert">Ouvert</option>
                  <option value="En cours">En cours</option>
                  <option value="Fermé">Fermé</option>
                  <option value="Suspendu">Suspendu</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
              <div>
                <Label htmlFor="dateDebutPriseEnCharge" className="text-sm font-medium text-gray-700">Début prise en charge</Label>
                <Input
                  id="dateDebutPriseEnCharge"
                  type="date"
                  value={formData.dateDebutPriseEnCharge}
                  onChange={(e) => handleInputChange('dateDebutPriseEnCharge', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="dateSortiePrevue" className="text-sm font-medium text-gray-700">Sortie prévue</Label>
                <Input
                  id="dateSortiePrevue"
                  type="date"
                  value={formData.dateSortiePrevue}
                  onChange={(e) => handleInputChange('dateSortiePrevue', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="dateSortieEffective" className="text-sm font-medium text-gray-700">Sortie effective</Label>
                <Input
                  id="dateSortieEffective"
                  type="date"
                  value={formData.dateSortieEffective}
                  onChange={(e) => handleInputChange('dateSortieEffective', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="hopitalProvenance" className="text-sm font-medium text-gray-700">Hôpital de provenance</Label>
              <Input
                id="hopitalProvenance"
                type="text"
                value={formData.hopitalProvenance}
                onChange={(e) => handleInputChange('hopitalProvenance', e.target.value)}
                placeholder="Établissement de provenance"
              />
            </div>
          </CardContent>
        </Card>

        {/* =======================================
            BLOC 4: ACTIONS ICNP (INTÉGRATION COMPLÈTE)
            ======================================= */}
        
        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600" />
                <span>Actions et interventions ICNP</span>
                <Badge variant="outline" className="ml-2">
                  {actions.length} action{actions.length > 1 ? 's' : ''}
                </Badge>
              </div>
              
              <Button 
                onClick={() => setShowActionForm(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                disabled={showActionForm}
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une action ICNP
              </Button>
            </CardTitle>
          </CardHeader>
          
          <CardContent>
            {/* Formulaire d'ajout d'action ICNP */}
            <ActionFormICNP
              isVisible={showActionForm}
              onCancel={handleCancelActionForm}
              onAddAction={handleAddAction}
              editingAction={editingActionIndex !== null ? actions[editingActionIndex] : undefined}
              isEditing={editingActionIndex !== null}
            />

            {/* Liste des actions avec informations ICNP complètes */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {actions.length === 0 ? (
                <div className="text-center py-8">
                  <Stethoscope className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 italic">Aucune action ICNP définie</p>
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
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-gray-900">{action.label}</p>
                            {action.icnp?.id && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                <BookOpen className="w-3 h-3 mr-1" />
                                ICNP: {action.icnp.id}
                              </Badge>
                            )}
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
                          </div>
                          
                          {/* Description ICNP */}
                          {action.icnp?.description?.fr && (
                            <p className="text-sm text-gray-600 mt-1 italic">
                              {action.icnp.description.fr}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 flex-wrap">
                        {/* Date de réalisation */}
                        {action.date && (
                          <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(action.date).toLocaleDateString('fr-FR')}
                          </Badge>
                        )}
                        
                        {/* Priorité */}
                        {action.priority && action.priority !== 'normale' && (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              action.priority === 'urgente' ? 'border-red-300 text-red-700 bg-red-50' :
                              action.priority === 'haute' ? 'border-orange-300 text-orange-700 bg-orange-50' :
                              'border-yellow-300 text-yellow-700 bg-yellow-50'
                            }`}
                          >
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {action.priority}
                          </Badge>
                        )}

                        {/* Durée estimée */}
                        {action.estimatedDuration && (
                          <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                            <Clock className="w-3 h-3 mr-1" />
                            {action.estimatedDuration} min
                          </Badge>
                        )}
                      </div>

                      {/* Notes */}
                      {action.notes && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                          <p className="text-sm text-yellow-800">
                            <FileText className="w-3 h-3 inline mr-1" />
                            {action.notes}
                          </p>
                        </div>
                      )}

                      {/* Informations ICNP détaillées */}
                      {action.icnp && (action.icnp.term?.en || action.icnp.description?.fr) && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="text-xs text-blue-800 space-y-1">
                            {action.icnp.term?.en && (
                              <div className="flex items-center gap-1">
                                <span className="font-medium">EN:</span>
                                <span>{action.icnp.term.en}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              <span>Axe: {action.icnp.axis} ({action.icnp.axis === 'IC' ? 'Interventions' : 'Autre'})</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions d'édition/suppression */}
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        type="button"
                        onClick={() => handleEditAction(index)}
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleRemoveAction(index)}
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Statistiques des actions ICNP */}
            {actions.length > 0 && (
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-purple-700 font-medium">
                        {actions.length} action{actions.length > 1 ? 's' : ''} total
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-blue-700 font-medium">
                        {actions.filter(a => a.icnp?.id).length} avec code ICNP
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-green-700 font-medium">
                        {actions.filter(a => a.status === 'réalisé').length} réalisée{actions.filter(a => a.status === 'réalisé').length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-indigo-700 font-medium">
                    Durée totale estimée: {actions.reduce((acc, action) => acc + (action.estimatedDuration || 30), 0)} min
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* =======================================
            BLOC 5: ADRESSE
            ======================================= */}
        
        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              Adresse du patient
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="rue" className="text-sm font-medium text-gray-700">Adresse complète</Label>
              <Input
                id="rue"
                type="text"
                value={adresse.rue}
                onChange={(e) => handleAdresseChange('rue', e.target.value)}
                placeholder="Numéro et nom de rue"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="codePostal" className="text-sm font-medium text-gray-700">Code postal</Label>
                <Input
                  id="codePostal"
                  type="text"
                  value={adresse.codePostal}
                  onChange={(e) => handleAdresseChange('codePostal', e.target.value)}
                  placeholder="Code postal"
                />
              </div>

              <div>
                <Label htmlFor="ville" className="text-sm font-medium text-gray-700">Ville</Label>
                <Input
                  id="ville"
                  type="text"
                  value={adresse.ville}
                  onChange={(e) => handleAdresseChange('ville', e.target.value)}
                  placeholder="Ville"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="complement" className="text-sm font-medium text-gray-700">Complément d'adresse</Label>
              <Input
                id="complement"
                type="text"
                value={adresse.complement}
                onChange={(e) => handleAdresseChange('complement', e.target.value)}
                placeholder="Appartement, étage, etc."
              />
            </div>
          </CardContent>
        </Card>

        {/* =======================================
            BARRE DE VALIDATION ET SOUMISSION
            ======================================= */}
        
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 shadow-lg sticky bottom-4">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-green-800 text-lg">Récapitulatif de création</p>
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
                  onClick={() => window.location.reload()}
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
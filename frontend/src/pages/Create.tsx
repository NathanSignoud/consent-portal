import { useState } from "react";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  MapPin
} from "lucide-react";

type Action = {
  label: string;
  status: 'à faire' | 'réalisé';
  date: string | null;
};

type Consent = {
  sectionTitle: string;
  answers: string[];
  checkboxes: {
    understood: boolean;
    surgeryConsent: boolean;
    otherConsent: boolean;
  };
};

type Adresse = {
  rue: string;
  codePostal: string;
  ville: string;
  complement: string;
};

const defaultConsents: Consent[] = [
  { 
    sectionTitle: "Soins", 
    answers: [], 
    checkboxes: { understood: false, surgeryConsent: false, otherConsent: false }
  },
  { 
    sectionTitle: "Transmission données", 
    answers: [], 
    checkboxes: { understood: false, surgeryConsent: false, otherConsent: false }
  },
  { 
    sectionTitle: "Photos", 
    answers: [], 
    checkboxes: { understood: false, surgeryConsent: false, otherConsent: false }
  }
];

const CreatePatientPage = () => {
  // États pour les champs du formulaire
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    dateNaissance: "",
    sexe: "",
    statutIdentite: "",
    uniteOrganisationnelle: "",
    ipp: "",
    situationDossier: "",
    dateDebutPriseEnCharge: "",
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

  // Nouvelle action
  const [newAction, setNewAction] = useState({
    label: "",
    status: "à faire" as const,
    date: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAdresseChange = (field: keyof Adresse, value: string) => {
    setAdresse(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddAction = () => {
    if (!newAction.label) return;
    
    setActions(prev => [...prev, {
      ...newAction,
      date: newAction.date || null
    }]);
    
    setNewAction({
      label: "",
      status: "à faire",
      date: ""
    });
  };

  const handleRemoveAction = (index: number) => {
    setActions(prev => prev.filter((_, i) => i !== index));
  };

  const handleConsentChange = (index: number, field: string, value: boolean | string) => {
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
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");
    setSuccess(false);

    try {
      // Préparation des pathologies (conversion string vers array)
      const pathologiesArray = formData.pathologies
        .split('-')
        .map(p => p.trim())
        .filter(p => p.length > 0);

      // Préparation des données pour l'API
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
        actions: actions,
        consents: consents,
        adresse: {
          rue: adresse.rue || undefined,
          codePostal: adresse.codePostal || undefined,
          ville: adresse.ville || undefined,
          complement: adresse.complement || undefined
        }
      };

      // Suppression des propriétés undefined pour éviter les erreurs
      Object.keys(payload).forEach(key => {
        if (payload[key] === undefined || payload[key] === "") {
          delete payload[key];
        }
      });

      // Nettoyage de l'adresse si tous les champs sont vides
      if (!adresse.rue && !adresse.codePostal && !adresse.ville && !adresse.complement) {
        delete payload.adresse;
      }

      console.log("=== DEBUG PAYLOAD ===");
      console.log("Payload final à envoyer:", JSON.stringify(payload, null, 2));
      console.log("==================");

      // Appel API POST
      const response = await axios.post('/api/patient2', payload, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        },
        timeout: 10000
      });

      console.log("Patient créé avec succès:", response.data);
      setSuccess(true);
      
      // Réinitialiser le formulaire après succès
      setFormData({
        nom: "",
        prenom: "",
        dateNaissance: "",
        sexe: "",
        statutIdentite: "",
        uniteOrganisationnelle: "",
        ipp: "",
        situationDossier: "",
        dateDebutPriseEnCharge: "",
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
      
    } catch (err: any) {
      console.error("=== ERREUR DÉTAILLÉE ===");
      console.error("Erreur complète:", err);
      console.error("Response data:", err.response?.data);
      console.error("Response status:", err.response?.status);
      console.error("======================");
      
      if (err.response) {
        const statusCode = err.response.status;
        const errorData = err.response.data;
        const errorMessage = errorData?.message || errorData?.error || "Erreur serveur inconnue";
        
        if (statusCode === 400) {
          setError(`Données invalides: ${errorMessage}`);
        } else if (statusCode === 409) {
          setError("Un patient avec ces informations existe déjà");
        } else if (statusCode === 500) {
          setError(`Erreur serveur: ${errorMessage}. Vérifiez les logs du serveur.`);
        } else {
          setError(`Erreur ${statusCode}: ${errorMessage}`);
        }
      } else if (err.request) {
        setError("Impossible de contacter le serveur. Vérifiez que le serveur est démarré sur localhost:5000");
      } else {
        setError(`Erreur de configuration: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.nom && formData.dateNaissance && formData.sexe;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 relative overflow-hidden">
      
      {/* Éléments décoratifs de fond */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-200/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-purple-200/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Nouveau Patient
              </h1>
              <p className="text-gray-600 mt-1">Créer un nouveau dossier patient</p>
            </div>
          </div>
        </div>

        {/* Messages d'état */}
        {error && (
          <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-xl">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800 font-medium">
                Patient créé avec succès ! Le dossier a été enregistré dans le système.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Informations personnelles */}
          <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <User className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">Informations personnelles</h2>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nom" className="text-sm font-medium text-gray-700">
                      Nom *
                    </Label>
                    <Input
                      id="nom"
                      type="text"
                      placeholder="Ex : Dupont"
                      value={formData.nom}
                      onChange={(e) => handleInputChange('nom', e.target.value)}
                      className="mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50"
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
                      Date de naissance *
                    </Label>
                    <Input
                      id="dateNaissance"
                      type="date"
                      value={formData.dateNaissance}
                      onChange={(e) => handleInputChange('dateNaissance', e.target.value)}
                      className="mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  <div>
                    <Label htmlFor="sexe" className="text-sm font-medium text-gray-700">
                      Sexe *
                    </Label>
                    <select
                      id="sexe"
                      value={formData.sexe}
                      onChange={(e) => handleInputChange('sexe', e.target.value)}
                      className="mt-1 w-full bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50 px-3 py-2"
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
                      IPP
                    </Label>
                    <Input
                      id="ipp"
                      type="text"
                      placeholder="Identifiant patient"
                      value={formData.ipp}
                      onChange={(e) => handleInputChange('ipp', e.target.value)}
                      className="mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="pathologies" className="text-sm font-medium text-gray-700">
                    Pathologies
                  </Label>
                  <Input
                    id="pathologies"
                    type="text"
                    placeholder="Séparer par des tirets, ex: Diabète - Hypertension"
                    value={formData.pathologies}
                    onChange={(e) => handleInputChange('pathologies', e.target.value)}
                    className="mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50"
                  />
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
                      Code postal
                    </Label>
                    <Input
                      id="codePostal"
                      type="text"
                      placeholder="Ex : 75001"
                      value={adresse.codePostal}
                      onChange={(e) => handleAdresseChange('codePostal', e.target.value)}
                      className="mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50"
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
                    placeholder="Ex : Bâtiment A, 2ème étage"
                    value={adresse.complement}
                    onChange={(e) => handleAdresseChange('complement', e.target.value)}
                    className="mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div className="p-3 bg-blue-50/50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    💡 Les coordonnées GPS (latitude/longitude) seront calculées automatiquement après la création du patient.
                  </p>
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
                  <option value="">Sélectionner</option>
                  <option value="Ouvert">Ouvert</option>
                  <option value="Fermé">Fermé</option>
                  <option value="En attente">En attente</option>
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
          </CardContent>
        </Card>

        {/* Actions et consentements */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          
          {/* Actions */}
          <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">Actions à réaliser</h2>
              </div>
              
              {/* Formulaire nouvelle action */}
              <div className="space-y-4 mb-6 p-4 bg-gray-50/50 rounded-xl">
                <div>
                  <Label htmlFor="actionLabel" className="text-sm font-medium text-gray-700">
                    Description de l'action
                  </Label>
                  <Input
                    id="actionLabel"
                    type="text"
                    placeholder="Ex : Prélèvement sanguin"
                    value={newAction.label}
                    onChange={(e) => setNewAction(prev => ({ ...prev, label: e.target.value }))}
                    className="mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="actionStatus" className="text-sm font-medium text-gray-700">
                      Statut
                    </Label>
                    <select
                      id="actionStatus"
                      value={newAction.status}
                      onChange={(e) => setNewAction(prev => ({ ...prev, status: e.target.value as any }))}
                      className="mt-1 w-full bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50 px-3 py-2"
                    >
                      <option value="à faire">À faire</option>
                      <option value="réalisé">Réalisé</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="actionDate" className="text-sm font-medium text-gray-700">
                      Date prévue
                    </Label>
                    <Input
                      id="actionDate"
                      type="date"
                      value={newAction.date}
                      onChange={(e) => setNewAction(prev => ({ ...prev, date: e.target.value }))}
                      className="mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleAddAction}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg shadow-lg"
                  disabled={!newAction.label}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter l'action
                </Button>
              </div>

              {/* Liste des actions */}
              <div className="space-y-3">
                {actions.length === 0 ? (
                  <p className="text-gray-500 italic text-center py-4">Aucune action définie</p>
                ) : (
                  actions.map((action, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{action.label}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            action.status === 'réalisé' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {action.status === 'réalisé' ? 'Réalisé' : 'À faire'}
                          </span>
                          {action.date && (
                            <span className="text-xs text-gray-600">
                              {new Date(action.date).toLocaleDateString('fr-FR')}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveAction(index)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Consentements */}
          <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <CheckCircle className="w-5 h-5 text-orange-600" />
                <h2 className="text-xl font-semibold text-gray-900">Consentements</h2>
              </div>
              
              <div className="space-y-4">
                {consents.map((consent, index) => (
                  <div key={index} className="p-4 bg-gray-50/50 rounded-xl">
                    <h3 className="font-medium text-gray-900 mb-3">{consent.sectionTitle}</h3>
                    
                    {/* Réponses textuelles */}
                    <div className="mb-3">
                      <Label className="text-sm font-medium text-gray-700">
                        Remarques/Notes
                      </Label>
                      <Input
                        type="text"
                        placeholder="Ajouter une note..."
                        onChange={(e) => handleConsentChange(index, 'answers', e.target.value)}
                        className="mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>

                    {/* Cases à cocher */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`understood-${index}`}
                          checked={consent.checkboxes.understood}
                          onChange={(e) => handleConsentChange(index, 'checkboxes.understood', e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`understood-${index}`}
                          className="text-sm text-gray-700"
                        >
                          Information comprise et acceptée
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`surgery-${index}`}
                          checked={consent.checkboxes.surgeryConsent}
                          onChange={(e) => handleConsentChange(index, 'checkboxes.surgeryConsent', e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`surgery-${index}`}
                          className="text-sm text-gray-700"
                        >
                          Consentement aux soins/intervention
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`other-${index}`}
                          checked={consent.checkboxes.otherConsent}
                          onChange={(e) => handleConsentChange(index, 'checkboxes.otherConsent', e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`other-${index}`}
                          className="text-sm text-gray-700"
                        >
                          Autres consentements
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
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
                  Vérifiez toutes les informations avant de créer le dossier
                </p>
              </div>
              
              <Button 
                onClick={handleSubmit}
                disabled={!isFormValid || isLoading}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
            
            {!isFormValid && (
              <p className="text-sm text-amber-600 mt-2">
                * Les champs nom, date de naissance et sexe sont obligatoires
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CreatePatientPage;
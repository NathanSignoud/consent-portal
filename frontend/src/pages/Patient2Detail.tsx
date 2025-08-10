import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PatientDetailsTabs from "@/components/PatientDetailsTabs";
import { ArrowLeft, User, Calendar, MapPin, Heart, Shield, Trash2, AlertTriangle, RefreshCw, CheckCircle } from "lucide-react";
import LanguageSelector from "@/components/LanguageSelector";

interface Action {
  label: string;
  status: 'à faire' | 'réalisé';
  date?: string | null;
}

const Patient2Detail = () => {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<any>(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all');
  const [isDeleting, setIsDeleting] = useState(false);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const [language, setLanguage] = useState('fr');

  useEffect(() => {
    fetch(`http://localhost:5000/api/patient2/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        if (!res.ok) throw Error("Patient non trouvé");
        return res.json();
      })
      .then(data => {
        setPatient(data);
        setIsPending(false);
      })
      .catch(err => {
        setError(err.message);
        setIsPending(false);
      });
  }, [id]);

  const calculateAge = (dateNaissance: string) => {
    const birth = new Date(dateNaissance);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  };

  const handleActionToggle = (index: number) => {
    const updatedActions = [...(patient.actions || [])];
    const current = updatedActions[index];
    const newStatus = current.status === 'réalisé' ? 'à faire' : 'réalisé';
    const newDate = newStatus === 'réalisé' ? new Date().toISOString() : null;
    const [language, setLanguage] = useState('fr');

    updatedActions[index] = { ...current, status: newStatus, date: newDate };

    fetch(`http://localhost:5000/api/patient2/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ actions: updatedActions })
    })
      .then(res => res.json())
      .then(data => setPatient(data))
      .catch(err => console.error("Erreur mise à jour action:", err));
  };

  const handleDelete = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce patient ? Cette action est irréversible.")) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await fetch(`http://localhost:5000/api/patient2/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      navigate('/');
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      setIsDeleting(false);
    }
  };

  const filteredActions: Action[] = patient?.actions?.filter((action: Action) => {
    if (filter === 'todo') return action.status === 'à faire';
    if (filter === 'done') return action.status === 'réalisé';
    return true;
  }) || [];

  const getInitials = (prenom: string = "", nom: string = "") => {
    return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
  };

  const getSituationConfig = (situation: string) => {
    const situationLower = situation?.toLowerCase() || "";
    
    if (situationLower.includes("terminé") || situationLower.includes("fermé")) {
      return {
        color: "bg-red-50 text-red-700 border-red-200",
        icon: <CheckCircle className="w-4 h-4" />,
        dotColor: "bg-red-500"
      };
    }
    if (situationLower.includes("en cours") || situationLower.includes("actif")) {
      return {
        color: "bg-green-50 text-green-700 border-green-200",
        icon: <Shield className="w-4 h-4" />,
        dotColor: "bg-green-500"
      };
    }
    return {
      color: "bg-gray-50 text-gray-700 border-gray-200",
      icon: <AlertTriangle className="w-4 h-4" />,
      dotColor: "bg-gray-500"
    };
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-3">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="text-gray-700 font-medium">Chargement du patient...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-lg max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) return null;

  const situationConfig = getSituationConfig(patient.situationDossier);
  const initials = getInitials(patient.prenom, patient.nom);
  const age = patient.dateNaissance ? calculateAge(patient.dateNaissance) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 relative overflow-hidden">
      {/* Éléments décoratifs de fond */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-200/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-purple-200/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Navigation et actions */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="group inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-sm text-gray-700 hover:bg-white hover:shadow-md transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Retour à la liste
          </button>

          <div className="flex items-center gap-4">
            <LanguageSelector onLanguageChange={setLanguage} />
          </div>
        

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="group inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl shadow-sm hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {isDeleting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            )}
            {isDeleting ? "Suppression..." : "Supprimer le patient"}
          </button>
        </div>

        {/* En-tête du patient */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-start gap-6">
            
            {/* Avatar et statut */}
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {initials}
              </div>
              <div className={`absolute -bottom-2 -right-2 w-6 h-6 ${situationConfig.dotColor} rounded-full border-3 border-white shadow-sm`}></div>
            </div>

            {/* Informations principales */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {patient.prenom} {patient.nom}
                  </h1>
                  <div className="flex items-center gap-4 text-gray-600">
                    {age && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">{age} ans</span>
                      </div>
                    )}
                    {patient.uniteOrganisationnelle && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium">{patient.uniteOrganisationnelle}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Badge de situation */}
                <div className={`inline-flex items-center gap-2 text-sm font-medium rounded-xl px-4 py-2 border ${situationConfig.color}`}>
                  {situationConfig.icon}
                  {patient.situationDossier || "Statut inconnu"}
                </div>
              </div>

              {/* Pathologies */}
              {Array.isArray(patient.pathologies) && patient.pathologies.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Heart className="w-4 h-4 text-red-600" />
                    <span>Pathologies :</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {patient.pathologies.map((pathology, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center text-sm bg-red-50 text-red-700 px-3 py-1 rounded-lg border border-red-200"
                      >
                        {pathology}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contenu principal avec tabs */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Dossier patient</h2>
            <p className="text-gray-600">Informations, documents et actions de suivi</p>
          </div>
          {console.log(`Patient ID: ${patient._id}, Language: ${language}`)}
          <PatientDetailsTabs
            patient={patient}
            filter={filter}
            language={language}
            setFilter={setFilter}
            handleActionToggle={handleActionToggle}
          />
        </div>

      </div>
    </div>
  );
};

export default Patient2Detail;
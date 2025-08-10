import { Calendar, User, MapPin, Heart, Hospital, Clock, FileText, Badge, Activity, AlertCircle, CheckCircle, Info } from "lucide-react";

export interface Action {
  label: string;
  status: "à faire" | "réalisé";
  date?: string | null;
}

export interface Patient2 {
  _id: string;
  nom: string;
  dateNaissance: string;
  sexe: string;
  statutIdentite: string;
  uniteOrganisationnelle?: string;
  ipp?: string;
  situationDossier?: string;
  dateDebutPriseEnCharge?: string;
  dateSortieEffective?: string;
  dateSortiePrevue?: string;
  hopitalProvenance?: string;
  actions?: Action[];
  pathologies?: string[];
}

interface PatientInfosProps {
  patient: Patient2;
  calculateAge: (dateNaissance: string) => number;
}

const PatientInfos = ({ patient, calculateAge }: PatientInfosProps) => {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Non renseigné";
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusConfig = (status: string) => {
    const statusLower = status?.toLowerCase() || "";
    
    if (statusLower.includes("terminé") || statusLower.includes("fermé") || statusLower.includes("sorti")) {
      return {
        color: "bg-red-50 text-red-700 border-red-200",
        icon: <CheckCircle className="w-4 h-4" />
      };
    }
    if (statusLower.includes("en cours") || statusLower.includes("actif") || statusLower.includes("hospitalisé")) {
      return {
        color: "bg-green-50 text-green-700 border-green-200",
        icon: <Activity className="w-4 h-4" />
      };
    }
    if (statusLower.includes("attente") || statusLower.includes("pause")) {
      return {
        color: "bg-yellow-50 text-yellow-700 border-yellow-200",
        icon: <Clock className="w-4 h-4" />
      };
    }
    return {
      color: "bg-gray-50 text-gray-700 border-gray-200",
      icon: <Info className="w-4 h-4" />
    };
  };

  const getSexeIcon = (sexe: string) => {
    const sexeLower = sexe?.toLowerCase() || "";
    if (sexeLower.includes("f") || sexeLower.includes("femme")) {
      return "♀";
    }
    if (sexeLower.includes("m") || sexeLower.includes("homme")) {
      return "♂";
    }
    return "⚬";
  };

  const age = calculateAge(patient.dateNaissance);
  const statusConfig = getStatusConfig(patient.situationDossier || "");

  return (
    <div className="space-y-8">
      
      {/* Section Identité */}
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-lg">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Identité</h3>
            <p className="text-sm text-gray-600">Informations personnelles</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-semibold">
                {patient.nom.charAt(0)}
              </div>
              <div>
                <p className="text-sm text-gray-600">Nom complet</p>
                <p className="font-semibold text-gray-900">{patient.nom}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Âge</p>
                <p className="font-semibold text-gray-900">{age} ans</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600 font-bold text-lg">
                {getSexeIcon(patient.sexe)}
              </div>
              <div>
                <p className="text-sm text-gray-600">Sexe</p>
                <p className="font-semibold text-gray-900">{patient.sexe}</p>
              </div>
            </div>

            {patient.ipp && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Badge className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">IPP</p>
                  <p className="font-semibold text-gray-900">{patient.ipp}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/50">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Statut d'identité</span>
          </div>
          <p className="text-gray-900 font-medium">{patient.statutIdentite}</p>
        </div>
      </div>

      {/* Section Médicale */}
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-100 rounded-lg">
            <Heart className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Informations médicales</h3>
            <p className="text-sm text-gray-600">Suivi et pathologies</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Unité organisationnelle */}
          {patient.uniteOrganisationnelle && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Unité organisationnelle</p>
                <p className="font-semibold text-gray-900">{patient.uniteOrganisationnelle}</p>
              </div>
            </div>
          )}

          {/* Situation du dossier */}
          {patient.situationDossier && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">Situation du dossier</p>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border text-sm font-medium mt-1 ${statusConfig.color}`}>
                  {statusConfig.icon}
                  {patient.situationDossier}
                </div>
              </div>
            </div>
          )}

          {/* Pathologies */}
          {patient.pathologies && patient.pathologies.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pathologies</p>
                  <p className="text-xs text-gray-500">{patient.pathologies.length} pathologie(s) identifiée(s)</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 ml-13">
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

      {/* Section Hospitalière */}
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Hospital className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Suivi hospitalier</h3>
            <p className="text-sm text-gray-600">Dates et provenance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Début de prise en charge</p>
                <p className="font-semibold text-gray-900">{formatDate(patient.dateDebutPriseEnCharge)}</p>
              </div>
            </div>

            {patient.hopitalProvenance && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Hospital className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Hôpital de provenance</p>
                  <p className="font-semibold text-gray-900">{patient.hopitalProvenance}</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Sortie prévue</p>
                <p className="font-semibold text-gray-900">{formatDate(patient.dateSortiePrevue)}</p>
              </div>
            </div>

            {patient.dateSortieEffective && (
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sortie effective</p>
                  <p className="font-semibold text-gray-900">{formatDate(patient.dateSortieEffective)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section Statistiques actions */}
      {patient.actions && patient.actions.length > 0 && (
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Résumé des actions</h3>
              <p className="text-sm text-gray-600">Suivi des interventions</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50/80 backdrop-blur-sm rounded-xl p-4 border border-blue-200/50">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Total</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{patient.actions.length}</p>
            </div>

            <div className="bg-green-50/80 backdrop-blur-sm rounded-xl p-4 border border-green-200/50">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Réalisées</span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {patient.actions.filter(action => action.status === 'réalisé').length}
              </p>
            </div>

            <div className="bg-orange-50/80 backdrop-blur-sm rounded-xl p-4 border border-orange-200/50">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-700">À faire</span>
              </div>
              <p className="text-2xl font-bold text-orange-900">
                {patient.actions.filter(action => action.status === 'à faire').length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientInfos;
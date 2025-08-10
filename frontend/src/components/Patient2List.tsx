import { Link } from "react-router-dom";
import React from "react";
import { Patient2 } from "../types/patient2";
import { User, Calendar, MapPin, Activity, ChevronRight, Trash2, Heart, Shield, AlertCircle, CheckCircle, Clock } from "lucide-react";

interface Patient2ListProps {
  patients: Patient2[];
  title: string;
  handleDelete?: (id: string) => void;
}

const Patient2List: React.FC<Patient2ListProps> = ({ patients, title, handleDelete }) => {
  const calculateAge = (dateNaissance: string): number => {
    const birth = new Date(dateNaissance);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const getSituationConfig = (situation: string) => {
    const situationLower = situation.toLowerCase();
    
    if (situationLower.includes("terminé") || situationLower.includes("fermé")) {
      return {
        color: "bg-red-50 text-red-700 border-red-200",
        icon: <CheckCircle className="w-3 h-3" />,
        dotColor: "bg-red-500"
      };
    }
    if (situationLower.includes("en cours") || situationLower.includes("actif")) {
      return {
        color: "bg-green-50 text-green-700 border-green-200",
        icon: <Activity className="w-3 h-3" />,
        dotColor: "bg-green-500"
      };
    }
    if (situationLower.includes("attente") || situationLower.includes("pause")) {
      return {
        color: "bg-yellow-50 text-yellow-700 border-yellow-200",
        icon: <Clock className="w-3 h-3" />,
        dotColor: "bg-yellow-500"
      };
    }
    return {
      color: "bg-gray-50 text-gray-700 border-gray-200",
      icon: <AlertCircle className="w-3 h-3" />,
      dotColor: "bg-gray-500"
    };
  };

  const getInitials = (nom: string) => {
    return nom
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  if (patients.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun patient trouvé</h3>
          <p className="text-gray-500">Essayez d'ajuster vos critères de recherche</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
        {patients.map((patient) => {
          const age = calculateAge(patient.dateNaissance);
          const situation = patient.situationDossier || "Inconnue";
          const situationConfig = getSituationConfig(situation);
          const initials = getInitials(patient.nom || "");

          return (
            <div
              key={patient._id}
              className="group bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:bg-white/90 p-6 relative overflow-hidden"
            >
              {/* Élément décoratif */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-2xl"></div>
              
              <div className="relative z-10">
                {/* En-tête avec avatar et statut */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {/* Avatar avec initiales */}
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        {initials}
                      </div>
                      {/* Indicateur de statut */}
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${situationConfig.dotColor} rounded-full border-2 border-white shadow-sm`}></div>
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                        <Link to={`/patient2/${patient._id}`} className="hover:underline">
                          {patient.nom?.toUpperCase()}
                        </Link>
                      </h3>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium">{age} ans</span>
                      </div>
                    </div>
                  </div>

                  {/* Badge situation */}
                  <div className={`inline-flex items-center gap-2 text-xs font-medium rounded-xl px-3 py-2 border ${situationConfig.color}`}>
                    {situationConfig.icon}
                    {situation}
                  </div>
                </div>

                {/* Informations détaillées */}
                <div className="space-y-3 mb-6">
                  {/* Unité organisationnelle */}
                  {patient.uniteOrganisationnelle && (
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <div className="p-1 bg-blue-100 rounded-lg">
                        <MapPin className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium">Unité :</span>
                      <span className="text-gray-600">{patient.uniteOrganisationnelle}</span>
                    </div>
                  )}

                  {/* Pathologies */}
                  {Array.isArray(patient.pathologies) && patient.pathologies.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <div className="p-1 bg-blue-100 rounded-lg">
                          <Heart className="w-4 h-4 text-blue-600" />
                        </div>
                        <span>Pathologies :</span>
                      </div>
                      <div className="flex flex-wrap gap-2 ml-7">
                        {patient.pathologies.slice(0, 3).map((pathology, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center text-xs bg-gray-50 text-gray-700 px-2 py-1 rounded-lg border border--200"
                          >
                            {pathology}
                          </span>
                        ))}
                        {patient.pathologies.length > 3 && (
                          <span className="inline-flex items-center text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded-lg border border-gray-200">
                            +{patient.pathologies.length - 3} autre(s)
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100/50">
                  <Link
                    to={`/patient2/${patient._id}`}
                    className="group/link inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-all duration-200 hover:gap-3"
                  >
                    <Shield className="w-4 h-4" />
                    Voir le détail
                    <ChevronRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                  
                  {handleDelete && (
                    <button
                      onClick={() => handleDelete(patient._id)}
                      className="group/delete inline-flex items-center gap-2 text-red-500 hover:text-red-700 font-medium text-sm transition-all duration-200 hover:bg-red-50 px-3 py-2 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 group-hover/delete:scale-110 transition-transform" />
                      Supprimer
                    </button>
                  )}
                </div>
              </div>

              {/* Effet de survol */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Patient2List;
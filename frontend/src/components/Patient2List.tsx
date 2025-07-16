import { Link } from "react-router-dom";
import React from "react";
import { Patient2 } from "../types/patient2";

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

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
        {patients.map((patient) => {
          const age = calculateAge(patient.dateNaissance);
          const situation = patient.situationDossier || "Inconnue";
          const badgeColor = situation.toLowerCase().includes("terminé")
            ? "bg-red-100 text-red-800"
            : "bg-green-100 text-green-800";

          return (
            <div
              key={patient._id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
            >
              <div>
                {/* Nom + Âge */}
                <h3 className="text-xl font-semibold text-blue-700 mb-1">
                  <Link to={`/patient2/${patient._id}`} className="hover:underline">
                    {patient.nom?.toUpperCase()}{" "}
                    <span className="text-gray-500 font-normal">({age} ans)</span>
                  </Link>
                </h3>

                {/* Badge situation */}
                <span className={`inline-block text-xs font-medium rounded-full px-2 py-1 mb-2 ${badgeColor}`}>
                  {situation}
                </span>

                {/* Unité */}
                {patient.uniteOrganisationnelle && (
                  <p className="text-sm text-gray-700">
                    <strong>Unité :</strong> {patient.uniteOrganisationnelle}
                  </p>
                )}

                {/* Pathologies */}
                {Array.isArray(patient.pathologies) && patient.pathologies.length > 0 && (
                  <>
                    <p className="text-sm font-medium text-gray-700 mt-2">Pathologies :</p>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {patient.pathologies.map((pathology, index) => (
                        <li key={index}>{pathology}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              {/* Boutons */}
              <div className="mt-4 flex justify-between items-center">
                <Link
                  to={`/patient2/${patient._id}`}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Voir le détail →
                </Link>
                {handleDelete && (
                  <button
                    onClick={() => handleDelete(patient._id)}
                    className="text-red-500 text-sm hover:text-red-700"
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Patient2List;

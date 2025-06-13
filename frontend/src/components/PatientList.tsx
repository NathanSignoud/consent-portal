import { Link } from "react-router-dom";
import React from "react";
import { Patient } from '../types/patient'; // adapte le chemin si besoin


interface PatientListProps {
  patients: Patient[];
  title: string;
  handleDelete?: (id: string) => void;
}

const PatientList: React.FC<PatientListProps> = ({ patients, title, handleDelete }) => {
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
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{title}</h2>

      <div className="grid gap-6">
        {patients.map((patient) => (
          <div
            key={patient._id}
            className="bg-white shadow-md rounded-lg p-5 border border-gray-100 hover:shadow-lg transition"
          >
            <div className="flex justify-between items-start">
              <Link to={`/patient/${patient._id}`}>
                <h3 className="text-xl font-semibold text-blue-700 hover:underline">
                  {patient.prenom} {patient.nom}
                  <span className="text-gray-500 font-normal">
                    {" "}({calculateAge(patient.dateNaissance)} ans)
                  </span>
                </h3>
              </Link>
              {handleDelete && (
                <button
                  onClick={() => handleDelete(patient._id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Supprimer
                </button>
              )}
            </div>

            {Array.isArray(patient.pathologies) && patient.pathologies.length > 0 && (
              <>
                <p className="text-sm text-gray-600 mt-2 font-medium">Pathologies :</p>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {patient.pathologies.map((pathology) => (
                    <li key={pathology}>{pathology}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatientList;

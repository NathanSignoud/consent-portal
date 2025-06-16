import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import React from "react";

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<any>(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch(`http://localhost:5000/api/patients/${id}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
      .then((res) => {
        if (!res.ok) throw Error("Patient non trouvé");
        return res.json();
      })
      .then((data) => {
        setPatient(data);
        setIsPending(false);
      })
      .catch((err) => {
        setError(err.message);
        setIsPending(false);
      });
  }, [id]);

  const calculateAge = (dateNaissance: string) => {
    const birth = new Date(dateNaissance);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleDelete = () => {
    fetch(`http://localhost:5000/api/patients/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).then(() => navigate('/'));
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      {isPending && <p className="text-gray-500">Chargement...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {patient && (
        <>
          <h2 className="text-2xl font-bold text-blue-700 mb-4">
            {patient.prenom} {patient.nom}
          </h2>
          <p className="mb-2"><strong>Âge :</strong> {calculateAge(patient.dateNaissance)} ans</p>
          <p className="mb-2"><strong>Date de prise en charge :</strong> {new Date(patient.datePriseEnCharge).toLocaleDateString()}</p>
          <p className="mb-2"><strong>Numéro de contact :</strong> {patient.numeroContact}</p>
          <p className="mb-2"><strong>Adresse :</strong> {patient.adresse}, {patient.codePostal}</p>

          {patient.pathologies?.length > 0 && (
            <p className="mb-2"><strong>Pathologies :</strong> {patient.pathologies.join(", ")}</p>
          )}
          {patient.allergies?.length > 0 && (
            <p className="mb-2"><strong>Allergies :</strong> {patient.allergies.join(", ")}</p>
          )}
          {patient.medication?.length > 0 && (
            <p className="mb-4"><strong>Médications :</strong> {patient.medication.join(", ")}</p>
          )}

          <h3 className="text-xl font-semibold mt-6 mb-2">Documents PDF</h3>
          {patient.pdfs?.length > 0 ? (
            <ul className="space-y-2 mb-4">
              {patient.pdfs.map((pdf: any) => (
                <li key={pdf._id} className="flex justify-between items-center bg-gray-100 p-3 rounded">
                  <span>{pdf.filename}</span>
                  <Link
                    to={`/patient/${patient._id}/divide/${pdf._id}`}
                    className="text-blue-600 hover:underline"
                  >
                    Voir
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Aucun document PDF.</p>
          )}

          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Supprimer le patient
          </button>
        </>
      )}
    </div>
  );
};

export default PatientDetail;

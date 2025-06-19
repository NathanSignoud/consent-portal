import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import React from "react";

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
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all');

  useEffect(() => {
    fetch(`http://localhost:5000/api/patient2/${id}`, {
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

  const handleActionToggle = (index: number) => {
    const updatedActions = [...(patient.actions || [])];
    const current = updatedActions[index];
    const newStatus = current.status === 'réalisé' ? 'à faire' : 'réalisé';
    const newDate = newStatus === 'réalisé' ? new Date().toISOString() : null;

    updatedActions[index] = {
      ...current,
      status: newStatus,
      date: newDate
    };

    fetch(`http://localhost:5000/api/patient2/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ actions: updatedActions })
    })
      .then(res => res.json())
      .then(data => {
        setPatient(data);
      })
      .catch(err => console.error("Erreur mise à jour action:", err));
  };

  const filteredActions: Action[] = patient?.actions?.filter((action: Action) => {
    if (filter === 'todo') return action.status === 'à faire';
    if (filter === 'done') return action.status === 'réalisé';
    return true;
  }) || [];

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
          <p className="mb-2"><strong>Date de prise en charge :</strong> {new Date(patient.dateDebutPriseEnCharge).toLocaleDateString()}</p>
          <p className="mb-2"><strong>Sexe :</strong> {patient.sexe}</p>
          <p className="mb-2"><strong>Situation :</strong> {patient.situationDossier}</p>

          {patient.pathologies?.length > 0 && (
            <ul className="list-disc list-inside text-sm text-gray-700">
                  {patient.pathologies.map((pathology, index) => (
                    <li key={index}>{pathology}</li>
                  ))}
                </ul>
          )}

          <h3 className="text-xl font-semibold mt-6 mb-2">Actions</h3>

          <div className="flex gap-3 mb-4">
            <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Toutes</button>
            <button onClick={() => setFilter('todo')} className={`px-3 py-1 rounded ${filter === 'todo' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>À faire</button>
            <button onClick={() => setFilter('done')} className={`px-3 py-1 rounded ${filter === 'done' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Faites</button>
          </div>

          <ul className="space-y-2 mb-4">
            {filteredActions.map((action, index) => (
              <li key={index} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={action.status === 'réalisé'}
                  onChange={() => handleActionToggle(index)}
                />
                <span className={action.status === 'réalisé' ? "line-through text-green-700" : "text-gray-800"}>{action.label}</span>
                {action.status === 'réalisé' && action.date && (
                  <span className="text-sm text-gray-500">({new Date(action.date).toLocaleDateString()})</span>
                )}
              </li>
            ))}
          </ul>

          <button
            onClick={() => {
              fetch(`http://localhost:5000/api/patient2/${id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }).then(() => navigate('/'));
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Supprimer le patient
          </button>
        </>
      )}
    </div>
  );
};

export default Patient2Detail;

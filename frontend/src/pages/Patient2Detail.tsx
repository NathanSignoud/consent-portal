import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PatientDetailsTabs from "@/components/PatientDetailsTabs";


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
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

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

  const filteredActions: Action[] = patient?.actions?.filter((action: Action) => {
    if (filter === 'todo') return action.status === 'à faire';
    if (filter === 'done') return action.status === 'réalisé';
    return true;
  }) || [];

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      {isPending && <p className="text-gray-500">Chargement...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {patient && (
        <>
          <h2 className="text-2xl font-bold text-blue-700 mb-6">
            {patient.prenom} {patient.nom}
          </h2>

          <PatientDetailsTabs
            patient={patient}
            filter={filter}
            setFilter={setFilter}
            handleActionToggle={handleActionToggle}
          />

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
            className="bg-red-600 text-white px-4 py-2 mt-4 rounded hover:bg-red-700"
          >
            Supprimer le patient
          </button>
        </>
      )}
    </div>
  );
};

export default Patient2Detail;

import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ConsentForm from '@/components/ConsentForm';

const SectionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { title, body, pdfPath } = location.state || {};
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!id || !body || !token) {
      setError("Informations manquantes");
      return;
    }

    const fetchSummary = async () => {
      try {
        const res = await fetch('/flask/summarize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ patientId: id, text: body })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur de l'API");
        setResponse(data.message);
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchSummary();
  }, [id, body, token]);

  return (
    <div className="max-w-3xl mx-auto p-6 mt-10 bg-white rounded shadow space-y-6">
      <h1 className="text-2xl font-bold text-blue-700">{title}</h1>
      <p className="text-gray-700 whitespace-pre-line">{body}</p>

      <div className="bg-blue-50 p-4 rounded border text-blue-800">
        <strong>Réponse API :</strong>
        <p>{error ? `❌ ${error}` : response || 'Chargement...'}</p>
      </div>

      {/* Composant de consentement réutilisable */}
      <ConsentForm
        patientId={id!}
        sectionTitle={title}
      />

      <div className="text-center">
        <button
          onClick={() => navigate(`/patient2/${id}`)}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
        >
          ← Retour au patient
        </button>
      </div>
    </div>
  );
};

export default SectionDetail;

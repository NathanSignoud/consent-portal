import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface Section {
  title: string;
  body: string;
}

const Divided = () => {
  const { id, pdfPath } = useParams<{ id: string; pdfPath: string }>();
  const navigate = useNavigate();
  const [sections, setSections] = useState<Section[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !pdfPath) return;

    const fetchDividedSections = async () => {
      try {
        const decodedPath = decodeURIComponent(pdfPath);
        const fileName = decodedPath.split('/').pop();
        if (!fileName) throw new Error("Nom de fichier invalide");

        const res = await fetch(`/flask/divide/${fileName}`);
        if (!res.ok) throw new Error("Erreur lors de la division du PDF");

        const data = await res.json();
        const parsed = Array.isArray(data.sections) ? data.sections : [];
        setSections(parsed);
      } catch (err: any) {
        const message = err?.message || "Erreur inconnue";
        console.error("Erreur dans Divided:", message);
        setError(message);
      }
    };

    fetchDividedSections();
  }, [id, pdfPath]);

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10 bg-white rounded shadow space-y-6">
      <h1 className="text-2xl font-bold text-blue-700 text-center">{pdfPath}</h1>
      {error && <p className="text-red-500 text-center">{error}</p>}

      {sections.map((section, idx) => (
        <div
          key={idx}
          className="bg-gray-100 rounded p-4 shadow cursor-pointer hover:bg-gray-200 transition"
          onClick={() =>
            navigate(`/section/${id}`, { state: { title: section.title, body: section.body } })
          }
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-2">{section.title}</h2>
        </div>
      ))}

      <div className="text-center mt-8">
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

export default Divided;

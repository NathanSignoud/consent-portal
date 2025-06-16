import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface Section {
  title: string;
  body: string;
}

const Divided = () => {
  const { id, pdfId } = useParams<{ id: string; pdfId: string }>();
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const [sections, setSections] = useState<Section[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDividedSections = async () => {
      try {
        const resPatient = await fetch(`/api/patients/${id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const dataPatient = await resPatient.json();

        const pdf = dataPatient.pdfs.find((p: any) => p._id === pdfId);
        if (!pdf) throw new Error("PDF introuvable");

        const res = await fetch(`/divide?patientId=${id}&pdfName=${pdf.path}`);
        const data = await res.json();

        if (data.sections) {
          setSections(data.sections);
        } else {
          throw new Error("Erreur dans la réponse de l'API");
        }
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchDividedSections();
  }, [id, pdfId]);

  return (
    <div className="max-w-4xl mx-auto p-6 mt-10 bg-white rounded shadow space-y-6">
      <h1 className="text-2xl font-bold text-blue-700 text-center">Analyse du PDF</h1>
      {error && <p className="text-red-500 text-center">{error}</p>}
 
      {sections.map((section, idx) => (
        <div key={idx} className="bg-gray-100 rounded p-4 shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-2 ">{section.title}</h2>
          <p className="text-gray-700 whitespace-pre-line">{section.body}</p>
        </div>
      ))}

      <div className="text-center mt-8">
        <button
          onClick={() => navigate(`/patient/${id}`)}
          className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
        >
          ← Retour au patient
        </button>
      </div>
    </div>
  );
};

export default Divided;

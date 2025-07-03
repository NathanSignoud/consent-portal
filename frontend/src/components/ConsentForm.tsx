import { useState } from "react";

interface ConsentFormProps {
  patientId: string;
  sectionTitle: string;
}

const ConsentForm = ({ patientId, sectionTitle }: ConsentFormProps) => {
  const [understood, setUnderstood] = useState(false);
  const [surgeryConsent, setSurgeryConsent] = useState(false);
  const [dataConsent, setDataConsent] = useState(false);
  const [response, setResponse] = useState<string | null>(null);

  const handleSubmit = async () => {
    const res = await fetch(`/api/patient2/${patientId}/consent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        sectionTitle,
        answers: [],
        checkboxes: {
          understood,
          surgeryConsent,
          dataConsent,
        },
      }),
    });

    const data = await res.json();
    setResponse(data.message || "Consentement mis à jour !");
  };

  return (
    <div className="mt-8 p-4 border rounded bg-gray-50 space-y-4">
      <h2 className="text-lg font-semibold text-blue-700">Consentement</h2>

      <div>
        <p className="text-sm mb-1">J’ai bien compris ce document</p>
        <input
          type="checkbox"
          checked={understood}
          onChange={(e) => setUnderstood(e.target.checked)}
        />
      </div>

      <div>
        <p className="text-sm mb-1">Je consens à me faire opérer</p>
        <input
          type="checkbox"
          checked={surgeryConsent}
          onChange={(e) => setSurgeryConsent(e.target.checked)}
        />
      </div>

      <div>
        <p className="text-sm mb-1">Je consens au partage de mes données médicales</p>
        <input
          type="checkbox"
          checked={dataConsent}
          onChange={(e) => setDataConsent(e.target.checked)}
        />
      </div>

      <button
        onClick={handleSubmit}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Valider le consentement
      </button>

      {response && (
        <p className="text-green-700 font-medium mt-2">{response}</p>
      )}
    </div>
  );
};

export default ConsentForm;

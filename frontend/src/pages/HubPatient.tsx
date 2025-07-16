import { useState } from "react";

const HubPatient = () => {
  const [corsMessage, setCorsMessage] = useState<string | null>(null);

  const handleCorsTest = async () => {
    try {
      fetch("http://localhost:5001/api/test-cors")
          .then(res => res.json())
          .then(data => console.log(data))
          .catch(console.error);
    } catch (error) {
      console.error("Erreur CORS :", error);
      setCorsMessage("Erreur lors de la communication avec le serveur Flask");
    }
  };

  return (
    <div className="p-6 text-center">
      <h1 className="text-3xl font-bold text-blue-700 mb-4">Espace Patient</h1>
      <p className="text-gray-600 mb-6">Bienvenue sur votre espace personnel.</p>

      <button
        onClick={handleCorsTest}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Tester CORS avec Flask
      </button>

      {corsMessage && (
        <p className="mt-4 text-green-700 font-semibold">Réponse Flask : {corsMessage}</p>
      )}
    </div>
  );
};

export default HubPatient;

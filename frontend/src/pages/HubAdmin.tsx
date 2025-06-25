import { useState, useEffect } from "react";
import useFetch from "../hooks/useFetch";
import Patient2List from "../components/Patient2List";
import SearchBar from "../components/SearchBar";
import { Patient2 } from "../types/patient2";
import React from "react";

const HubAdmin = () => {
  const [patientList, setPatientList] = useState<Patient2[] | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMethod, setSortMethod] = useState<'alphabetical' | 'date'>('alphabetical');
  const [importMessage, setImportMessage] = useState("");

  const fetchPatients = () => {
    setIsPending(true);
    fetch('/api/patient2', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Erreur lors du chargement des patients");
        return res.json();
      })
      .then(data => {
        setPatientList(data);
        setIsPending(false);
      })
      .catch(err => {
        setError(err.message);
        setIsPending(false);
      });
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const calculateAge = (dateNaissance?: string): string => {
    if (!dateNaissance) return "";
    const birth = new Date(dateNaissance);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age.toString();
  };

  const filteredPatients = (patientList ?? []).filter((patient) => {
    const nom = patient.nom?.toLowerCase() || "";
    const age = calculateAge(patient.dateNaissance);
    const search = searchTerm.toLowerCase();
    return nom.includes(search) || age.includes(search);
  });

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    if (sortMethod === "alphabetical") {
      return (a.nom ?? "").toLowerCase().localeCompare((b.nom ?? "").toLowerCase());
    }
    if (sortMethod === "date") {
      return new Date(b.dateDebutPriseEnCharge ?? "").getTime() - new Date(a.dateDebutPriseEnCharge ?? "").getTime();
    }
    return 0;
  });

  const handleFileImport = (e: React.FormEvent) => {
    e.preventDefault();
    const fileInput = (document.getElementById("fileInput") as HTMLInputElement);
    const file = fileInput.files?.[0];
    if (!file) return alert("Sélectionne un fichier .xlsx");

    const formData = new FormData();
    formData.append("file", file);

    fetch("/api/patient2/import", {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setImportMessage(data.message || "Import terminé.");
        fetchPatients(); // 🔁 mise à jour automatique après import
      })
      .catch(() => setImportMessage("Erreur lors de l'import"));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">Tableau de bord Aide Soignant</h1>

      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setSortMethod("alphabetical")}
          className={`px-4 py-2 rounded ${sortMethod === "alphabetical" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"}`}
        >
          Trier par nom
        </button>
        <button
          onClick={() => setSortMethod("date")}
          className={`px-4 py-2 rounded ${sortMethod === "date" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"}`}
        >
          Trier par date d'entrée
        </button>
      </div>

      <form onSubmit={handleFileImport} className="mb-6 space-y-2">
        <input id="fileInput" type="file" accept=".xlsx, .xls" />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Importer depuis fichier
        </button>
        {importMessage && <p className="text-blue-600">{importMessage}</p>}
      </form>

      {error && <p className="text-red-500">{error}</p>}
      {isPending && <p className="text-gray-500">Chargement...</p>}
      {patientList && <Patient2List patients={sortedPatients} title="Liste des patients" />}
    </div>
  );
};

export default HubAdmin;

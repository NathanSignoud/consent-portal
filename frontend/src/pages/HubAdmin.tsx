import { useState, useEffect, FormEvent } from "react";
import useFetch from "../hooks/useFetch";
import Patient2List from "../components/Patient2List";
import SearchBar from "../components/SearchBar";
import { Patient2 } from "../types/patient2";

const HubAdmin = () => {
  const [patientList, setPatientList] = useState<Patient2[] | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMethod, setSortMethod] = useState<'alphabetical' | 'date'>('alphabetical');
  const [importMessage, setImportMessage] = useState("");
  const [showImportForm, setShowImportForm] = useState(false);


  // 🔄 Charger les patients
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

  // 📆 Calcul de l'âge
  const calculateAge = (dateNaissance?: string): string => {
    if (!dateNaissance) return "";
    const birth = new Date(dateNaissance);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age.toString();
  };

  // 🔍 Filtrage + tri
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
      return new Date(b.dateDebutPriseEnCharge ?? "").getTime() -
             new Date(a.dateDebutPriseEnCharge ?? "").getTime();
    }
    return 0;
  });

  // 📁 Import fichier Excel
  const handleFileImport = (e: FormEvent) => {
    e.preventDefault();
    const fileInput = document.getElementById("fileInput") as HTMLInputElement;
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
        fetchPatients();
      })
      .catch(() => setImportMessage("Erreur lors de l'import"));
  };

  // 🧱 UI
  return (
    <div className="min-h-screen py-10 px-4 sm:px-8">
    <div className="max-w-6xl mx-auto">
      {/* ✅ Titre avec style dashboard */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Tableau de bord Administrateur</h1>
        <div className="h-1 w-24 bg-blue-600 rounded-full" />
      </div>

      {/* 🔍 Barre de recherche + Tri */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

        <div className="flex gap-2">
          <button
            onClick={() => setSortMethod("alphabetical")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              sortMethod === "alphabetical"
                ? "bg-blue-600 text-white shadow"
                : "bg-white text-gray-800 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Trier par nom
          </button>
          <button
            onClick={() => setSortMethod("date")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              sortMethod === "date"
                ? "bg-blue-600 text-white shadow"
                : "bg-white text-gray-800 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            Trier par date
          </button>
        </div>
      </div>

      <button
        onClick={() => setShowImportForm(!showImportForm)}
        className="mb-6 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
      >
        {showImportForm ? "Fermer l'import Excel" : "Importer des patients"}
      </button>


      {/* Import Excel */}
      {showImportForm && (
        <form onSubmit={handleFileImport} className="mb-6">
          <input
            type="file"
            id="fileInput"
            accept=".xlsx"
            className="mb-4 p-2 border border-gray-300 rounded-lg"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Importer
          </button>
          {importMessage && (
            <p className="mt-2 text-green-600 font-medium">{importMessage}</p>
          )}
        </form>
      )}




      {/* 🔄 État */}
      {error && <p className="text-red-600 font-medium">{error}</p>}
      {isPending && <p className="text-gray-600 italic">Chargement des patients...</p>}

      {/* 📋 Liste */}
      {patientList && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-4"></h2>
          <Patient2List patients={sortedPatients} title="Liste des patients" />
        </div>
      )}
    </div>
  </div>

  );
};

export default HubAdmin;

import { useState } from "react";
import useFetch from "../hooks/useFetch";
import PatientList from "../components/PatientList";
import SearchBar from "../components/SearchBar";
import { Patient } from "../types/patient";
import React from "react";
 
const HubDoctor = () => {
  const { data: patientList, isPending, error } = useFetch<Patient[]>('/api/patients');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMethod, setSortMethod] = useState<'alphabetical' | 'date'>('alphabetical');

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
    const prenom = patient.prenom?.toLowerCase() || "";
    const age = calculateAge(patient.dateNaissance);
    const search = searchTerm.toLowerCase();

    return (
      nom.includes(search) ||
      prenom.includes(search) ||
      age.includes(search)
    );
  });

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    if (sortMethod === "alphabetical") {
      const aName = `${a.nom ?? ""} ${a.prenom ?? ""}`.toLowerCase();
      const bName = `${b.nom ?? ""} ${b.prenom ?? ""}`.toLowerCase();
      return aName.localeCompare(bName);
    }
    if (sortMethod === "date") {
      return new Date(b.datePriseEnCharge ?? "").getTime() - new Date(a.datePriseEnCharge ?? "").getTime();
    }
    return 0;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">Tableau de bord Médecin</h1>
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
          Trier par date de prise en charge
        </button>
      </div>

      {error && <p className="text-red-500">{error}</p>}
      {isPending && <p className="text-gray-500">Chargement...</p>}
      <PatientList patients={sortedPatients} title="Liste des patients" />
    </div>
  );
};

export default HubDoctor;

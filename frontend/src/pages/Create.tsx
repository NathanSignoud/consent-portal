import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface InputProps {
  label: string;
  type?: string;
  value: string;
  onChange: (val: string) => void;
}

const Input = ({ label, type = "text", value, onChange }: InputProps) => (
  <div className="space-y-1">
    <label className="block text-sm font-medium text-gray-700">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

interface FieldListProps {
  label: string;
  values: string[];
  setValues: (val: string[]) => void;
}

const FieldList = ({ label, values, setValues }: FieldListProps) => (
  <div className="col-span-1 md:col-span-2">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {values.map((val, index) => (
      <input
        key={index}
        type="text"
        value={val}
        onChange={(e) => {
          const updated = [...values];
          updated[index] = e.target.value;
          setValues(updated);
        }}
        className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    ))}
    <button
      type="button"
      onClick={() => setValues([...values, ""])}
      className="text-sm text-blue-600 hover:underline"
    >
      + Ajouter un champ
    </button>
  </div>
);

const CreatePatient = () => {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [dateNaissance, setDateNaissance] = useState("");
  const [datePriseEnCharge, setDatePriseEnCharge] = useState("");
  const [numeroContact, setNumeroContact] = useState("");
  const [adresse, setAdresse] = useState("");
  const [codePostal, setCodePostal] = useState("");

  const [pathologies, setPathologies] = useState<string[]>([""]);
  const [allergies, setAllergies] = useState<string[]>([""]);
  const [medication, setMedication] = useState<string[]>([""]);
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [isPending, setIsPending] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); 

    const formData = new FormData();
    formData.append("nom", nom);
    formData.append("prenom", prenom);
    formData.append("dateNaissance", dateNaissance);
    formData.append("datePriseEnCharge", datePriseEnCharge);
    formData.append("numeroContact", numeroContact);
    formData.append("adresse", adresse);
    formData.append("codePostal", codePostal);
    formData.append("pathologies", JSON.stringify(pathologies.filter(p => p.trim() !== "")));
    formData.append("allergies", JSON.stringify(allergies.filter(a => a.trim() !== "")));
    formData.append("medication", JSON.stringify(medication.filter(m => m.trim() !== "")));

    pdfFiles.forEach(file => formData.append("pdfs", file));

    fetch("http://localhost:5000/api/patients", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
      body: formData,
    })
      .then(res => {
        for (const [key, value] of formData.entries()) {
          console.log(key, value);
        }
        if (!res.ok) throw new Error("Erreur lors de la création du patient.");
        return res.json();
      })
      .then(() => {
        setIsPending(false);
        navigate("/");
      })
      .catch(err => console.error(err));
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-3xl bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h2 className="text-2xl font-semibold text-center mb-6">Créer un nouveau patient</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Nom" value={nom} onChange={setNom} />
          <Input label="Prénom" value={prenom} onChange={setPrenom} />
          <Input label="Date de naissance" type="date" value={dateNaissance} onChange={setDateNaissance} />
          <Input label="Date de prise en charge" type="date" value={datePriseEnCharge} onChange={setDatePriseEnCharge} />
          <Input label="Numéro de contact" type="tel" value={numeroContact} onChange={setNumeroContact} />
          <Input label="Adresse" value={adresse} onChange={setAdresse} />
          <Input label="Code postal" value={codePostal} onChange={setCodePostal} />

          <FieldList label="Pathologies" values={pathologies} setValues={setPathologies} />
          <FieldList label="Allergies" values={allergies} setValues={setAllergies} />
          <FieldList label="Médications" values={medication} setValues={setMedication} />

          <div className="col-span-1 md:col-span-2 space-y-1">
            <label className="block text-sm font-medium text-gray-700">PDFs</label>
            <input
              type="file"
              multiple
              accept="application/pdf"
              onChange={(e) => setPdfFiles(Array.from(e.target.files ?? []))}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
            >
              Créer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePatient;

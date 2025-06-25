import { Link } from "react-router-dom";

interface PatientDocumentsProps {
  patientId: string;
}

const fixedPDFs = [
  {
    filename: "Règlement de fonctionnement",
    path: "Reglement_de_fonctionnement.pdf"
  },
  {
    filename: "Règlement juridique d’intervention",
    path: "Reglement_juridique_intervention.pdf"
  }
];

const PatientDocuments = ({ patientId }: PatientDocumentsProps) => {
  return (
    <div>
      <h3 className="text-xl font-semibold mt-6 mb-2">Documents PDF</h3>
      <ul className="space-y-2 mb-4">
        {fixedPDFs.map((pdf, index) => (
          <li
            key={index}
            className="flex justify-between items-center bg-gray-100 p-3 rounded"
          >
            <span>{pdf.filename}</span>
            <Link
              to={`/patient/${patientId}/divide/${encodeURIComponent(pdf.path)}`}
              className="text-blue-600 hover:underline"
            >
              Voir
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PatientDocuments;

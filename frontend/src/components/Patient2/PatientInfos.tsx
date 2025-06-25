interface PatientInfosProps {
  patient: any;
  calculateAge: (date: string) => number;
}

const PatientInfos = ({ patient, calculateAge }: PatientInfosProps) => {
  return (
    <div>
      <p><strong>Âge :</strong> {calculateAge(patient.dateNaissance)} ans</p>
      <p><strong>Date de prise en charge :</strong> {new Date(patient.dateDebutPriseEnCharge).toLocaleDateString()}</p>
      <p><strong>Sexe :</strong> {patient.sexe}</p>
      <p><strong>Situation :</strong> {patient.situationDossier}</p>

      {patient.pathologies?.length > 0 && (
        <>
          <h4 className="font-semibold mt-4">Pathologies :</h4>
          <ul className="list-disc list-inside text-sm text-gray-700">
            {patient.pathologies.map((pathology: string, index: number) => (
              <li key={index}>{pathology}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default PatientInfos;

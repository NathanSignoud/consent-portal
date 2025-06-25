import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PatientInfos from "@/components/patient2/PatientInfos";
import PatientDocuments from "@/components/patient2/PatientDocuments";
import PatientActions from "@/components/patient2/PatientActions";
import { Patient2, Action } from "@/types/patient2";

interface Props {
  patient: Patient2;
  filter: 'all' | 'todo' | 'done';
  setFilter: (f: 'all' | 'todo' | 'done') => void;
  handleActionToggle: (index: number) => void;
}

const PatientDetailsTabs = ({
  patient,
  filter,
  setFilter,
  handleActionToggle
}: Props) => {
  const calculateAge = (dateNaissance: string) => {
    const birth = new Date(dateNaissance);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  };

  return (
    <Tabs defaultValue="infos" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="infos">Informations</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="actions">Actions</TabsTrigger>
      </TabsList>

      <TabsContent value="infos">
        <PatientInfos patient={patient} calculateAge={calculateAge} />
      </TabsContent>

      <TabsContent value="documents">
        <PatientDocuments patientId={patient._id} />
      </TabsContent>

      <TabsContent value="actions">
        <PatientActions
          actions={patient.actions || []}
          filter={filter}
          setFilter={setFilter}
          onToggle={handleActionToggle}
        />
      </TabsContent>
    </Tabs>
  );
};

export default PatientDetailsTabs;

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PatientInfos from "@/components/patient2/PatientInfos";
import PatientDocuments from "@/components/patient2/PatientDocuments";
import PatientActions from "@/components/patient2/PatientActions";
import { Patient2, Action } from "@/types/patient2";
import { User, FileText, Activity, Info, Upload, CheckSquare, AlertTriangle } from "lucide-react";

interface Props {
  patient: Patient2;
  filter: 'all' | 'todo' | 'done';
  language: string;
  setFilter: (f: 'all' | 'todo' | 'done') => void;
  handleActionToggle: (index: number) => void;
  onAddAction?: (newAction: Omit<Action, 'id'>) => void;
  onDeleteAction?: (index: number) => void;
  isUpdatingAction?: boolean;
}

const PatientDetailsTabs = ({
  patient,
  filter,
  language,
  setFilter,
  handleActionToggle,
  onAddAction,
  onDeleteAction,
  isUpdatingAction
}: Props) => {

  // Debug temporaire
  console.log('PatientDetailsTabs props:', {
    patient: !!patient,
    filter,
    setFilter: typeof setFilter,
    handleActionToggle: typeof handleActionToggle,
    onAddAction: typeof onAddAction,
    onDeleteAction: typeof onDeleteAction,
    isUpdatingAction
  });

  console.log(`Patient Details Tabs - Patient ID: ${patient._id}, Language: ${language}`);
  
  const calculateAge = (dateNaissance: string) => {
    const birth = new Date(dateNaissance);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  };

  // Calculer les statistiques pour les badges
  const totalActions = patient.actions?.length || 0;
  const completedActions = patient.actions?.filter(action => action.status === 'réalisé').length || 0;
  const pendingActions = totalActions - completedActions;

  return (
    <div className="w-full">
      <Tabs defaultValue="infos" className="w-full">
        
        {/* Tabs Navigation modernisée */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-200/50">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100/80 backdrop-blur-sm border border-gray-200/50 rounded-xl p-1 shadow-sm">
            <TabsTrigger 
              value="infos" 
              className="relative flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-white/70 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-md"
            >
              <User className="w-4 h-4" />
              <span>Informations</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="documents" 
              className="relative flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-white/70 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-md"
            >
              <FileText className="w-4 h-4" />
              <span>Documents</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="actions" 
              className="relative flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-900 hover:bg-white/70 data-[state=active]:bg-white data-[state=active]:text-green-600 data-[state=active]:shadow-md"
            >
              <Activity className="w-4 h-4" />
              <span>Actions</span>
              {totalActions > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                  {completedActions}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Content Areas avec animations */}
        <div className="min-h-[500px]">
          <TabsContent 
            value="infos" 
            className="mt-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-300"
          >
            <div className="p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Info className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Informations patient</h3>
                  <p className="text-sm text-gray-600">Données personnelles et médicales</p>
                </div>
              </div>
              <PatientInfos patient={patient} calculateAge={calculateAge} />
            </div>
          </TabsContent>

          <TabsContent 
            value="documents" 
            className="mt-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-300"
          >
            <div className="p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Upload className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
                  <p className="text-sm text-gray-600">Fichiers et rapports liés au patient</p>
                </div>
              </div>
              <PatientDocuments patientId={patient._id} language={language} />
            </div>
          </TabsContent>

          <TabsContent 
            value="actions" 
            className="mt-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-300"
          >
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckSquare className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Actions de suivi</h3>
                    <p className="text-sm text-gray-600">Tâches et interventions réalisées</p>
                  </div>
                </div>
                
                {/* Statistiques rapides */}
                {totalActions > 0 && (
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">Réalisées:</span>
                      <span className="font-semibold text-green-600">{completedActions}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-gray-600">À faire:</span>
                      <span className="font-semibold text-orange-600">{pendingActions}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Vérification stricte des props */}
              {filter && setFilter && handleActionToggle ? (
                <PatientActions
                  actions={patient.actions || []}
                  filter={filter}
                  setFilter={setFilter}
                  onToggle={handleActionToggle}
                  onAddAction={onAddAction}
                  onDeleteAction={onDeleteAction}
                  isUpdating={isUpdatingAction}
                />
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="text-red-600 font-medium">Erreur de configuration</p>
                  <div className="text-xs text-gray-500 mt-2 space-y-1">
                    <p>filter: {JSON.stringify(filter)}</p>
                    <p>setFilter: {String(typeof setFilter)}</p>
                    <p>handleActionToggle: {String(typeof handleActionToggle)}</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default PatientDetailsTabs;
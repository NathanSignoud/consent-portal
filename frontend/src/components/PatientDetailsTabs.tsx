import React, { useState, useMemo, useCallback } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import PatientInfos from "@/components/patient2/PatientInfos";
import PatientDocuments from "@/components/patient2/PatientDocuments";
import PatientActions from "@/components/patient2/PatientActions";
import { Patient2, Action } from "@/types/patient2";
import { 
  User, 
  FileText, 
  Activity, 
  Info, 
  Upload, 
  CheckSquare, 
  AlertTriangle,
  Calendar,
  Heart,
  Shield,
  Clock,
  TrendingUp,
  RefreshCw,
  Settings,
  Download,
  Eye,
  EyeOff
} from "lucide-react";

interface PatientDetailsTabsProps {
  patient: Patient2;
  filter: 'all' | 'todo' | 'done';
  language: string;
  setFilter: (f: 'all' | 'todo' | 'done') => void;
  handleActionToggle: (index: number) => void;
  onAddAction?: (newAction: Omit<Action, 'id'>) => void;
  onDeleteAction?: (index: number) => void;
  onEditAction?: (index: number, updatedAction: Partial<Action>) => void;
  isUpdatingAction?: boolean;
  
  // Nouvelles props pour fonctionnalités avancées
  onRefresh?: () => void;
  onExportData?: () => void;
  showAdvancedFeatures?: boolean;
  compactMode?: boolean;
  readOnly?: boolean;
  onTabChange?: (tab: string) => void;
  defaultTab?: string;
}

const PatientDetailsTabs: React.FC<PatientDetailsTabsProps> = ({
  patient,
  filter,
  language,
  setFilter,
  handleActionToggle,
  onAddAction,
  onDeleteAction,
  onEditAction,
  isUpdatingAction = false,
  onRefresh,
  onExportData,
  showAdvancedFeatures = true,
  compactMode = false,
  readOnly = false,
  onTabChange,
  defaultTab = "infos"
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fonction pour calculer l'âge
  const calculateAge = useCallback((dateNaissance: string): number => {
    if (!dateNaissance) return 0;
    const birth = new Date(dateNaissance);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  }, []);

  // Calculs des statistiques pour les badges
  const stats = useMemo(() => {
    const totalActions = patient.actions?.length || 0;
    const completedActions = patient.actions?.filter(action => action.status === 'réalisé').length || 0;
    const pendingActions = totalActions - completedActions;
    const completionRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
    
    const urgentActions = patient.actions?.filter(action => 
      action.priority === 'urgente' || action.label?.toLowerCase().includes('urgent')
    ).length || 0;

    const documentsCount = patient.documents?.length || 0;
    const age = calculateAge(patient.dateNaissance);
    const pathologiesCount = patient.pathologies?.length || 0;

    return {
      totalActions,
      completedActions,
      pendingActions,
      completionRate,
      urgentActions,
      documentsCount,
      age,
      pathologiesCount
    };
  }, [patient, calculateAge]);

  // Gestion du changement d'onglet
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    onTabChange?.(value);
  }, [onTabChange]);

  // Validation des props critiques
  const hasValidProps = useMemo(() => {
    return Boolean(filter && setFilter && handleActionToggle);
  }, [filter, setFilter, handleActionToggle]);

  // Configuration des onglets
  const tabsConfig = [
    {
      value: "infos",
      label: "Informations",
      icon: User,
      color: "blue",
      badge: stats.pathologiesCount > 0 ? stats.pathologiesCount : undefined,
      description: "Données personnelles et médicales"
    },
    {
      value: "documents",
      label: "Documents",
      icon: FileText,
      color: "indigo",
      badge: stats.documentsCount > 0 ? stats.documentsCount : undefined,
      description: "Fichiers et rapports liés au patient"
    },
    {
      value: "actions",
      label: "Actions",
      icon: Activity,
      color: "green",
      badge: stats.totalActions > 0 ? stats.completedActions : undefined,
      description: "Tâches et interventions réalisées"
    }
  ];

  if (!patient) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Patient non trouvé</h3>
          <p className="text-gray-500">Impossible de charger les informations du patient</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="w-full">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          
          {/* En-tête avec navigation et contrôles */}
          <div className="px-6 pt-6 pb-4 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-blue-50/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Dossier patient</h2>
                <p className="text-sm text-gray-600">
                  {patient.nom} - {stats.age} ans
                  {stats.totalActions > 0 && (
                    <span className="ml-2 text-green-600">
                      • {stats.completedActions}/{stats.totalActions} actions terminées
                    </span>
                  )}
                </p>
              </div>

              {/* Contrôles rapides */}
              {showAdvancedFeatures && (
                <div className="flex items-center gap-2">
                  {/* Toggle informations sensibles */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSensitiveInfo(!showSensitiveInfo)}
                      >
                        {showSensitiveInfo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {showSensitiveInfo ? 'Masquer' : 'Afficher'} les informations sensibles
                    </TooltipContent>
                  </Tooltip>

                  {/* Actualiser */}
                  {onRefresh && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onRefresh}
                          disabled={isLoading}
                        >
                          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Actualiser les données</TooltipContent>
                    </Tooltip>
                  )}

                  {/* Exporter */}
                  {onExportData && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={onExportData}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Exporter les données</TooltipContent>
                    </Tooltip>
                  )}
                </div>
              )}
            </div>

            {/* Navigation par onglets */}
            <TabsList className={`
              grid w-full grid-cols-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl p-1 shadow-sm
              ${compactMode ? 'h-10' : 'h-12'}
            `}>
              {tabsConfig.map((tab) => (
                <TabsTrigger 
                  key={tab.value}
                  value={tab.value}
                  className={`
                    relative flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium 
                    rounded-lg transition-all duration-200 text-gray-600 hover:text-gray-900 
                    hover:bg-white/70 data-[state=active]:bg-white data-[state=active]:text-${tab.color}-600 
                    data-[state=active]:shadow-md
                    ${compactMode ? 'text-xs px-2 py-2' : ''}
                  `}
                >
                  <tab.icon className={`${compactMode ? 'w-3 h-3' : 'w-4 h-4'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <Badge 
                      variant="secondary" 
                      className={`
                        ml-1 text-xs bg-${tab.color}-100 text-${tab.color}-700 border-${tab.color}-200
                        ${compactMode ? 'text-xs px-1' : ''}
                      `}
                    >
                      {tab.badge}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Barre de progression globale */}
            {stats.totalActions > 0 && (
              <div className="mt-4 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Progression globale</span>
                    <span className="font-medium text-gray-900">{stats.completionRate}%</span>
                  </div>
                  <Progress value={stats.completionRate} className="h-2" />
                </div>
                
                {stats.urgentActions > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {stats.urgentActions} urgent{stats.urgentActions > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Contenu des onglets */}
          <div className={`${compactMode ? 'min-h-[400px]' : 'min-h-[600px]'}`}>
            
            {/* Onglet Informations */}
            <TabsContent 
              value="infos" 
              className="mt-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-300"
            >
              <div className={`${compactMode ? 'p-4' : 'p-6'}`}>
                <div className="mb-6 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Info className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Informations patient</h3>
                    <p className="text-sm text-gray-600">Données personnelles et médicales</p>
                  </div>
                </div>
                
                <PatientInfos 
                  patient={patient} 
                  calculateAge={calculateAge}
                  showSensitiveInfo={showSensitiveInfo}
                  compactMode={compactMode}
                  readOnly={readOnly}
                />
              </div>
            </TabsContent>

            {/* Onglet Documents */}
            <TabsContent 
              value="documents" 
              className="mt-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-300"
            >
              <div className={`${compactMode ? 'p-4' : 'p-6'}`}>
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <Upload className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Documents</h3>
                      <p className="text-sm text-gray-600">Fichiers et rapports liés au patient</p>
                    </div>
                  </div>
                  
                  {stats.documentsCount > 0 && (
                    <Badge variant="outline" className="text-indigo-600 border-indigo-200">
                      {stats.documentsCount} document{stats.documentsCount > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                
                <PatientDocuments 
                  patientId={patient._id} 
                  language={language}
                  compactMode={compactMode}
                  readOnly={readOnly}
                />
              </div>
            </TabsContent>

            {/* Onglet Actions */}
            <TabsContent 
              value="actions" 
              className="mt-0 animate-in fade-in-50 slide-in-from-bottom-4 duration-300"
            >
              <div className={`${compactMode ? 'p-4' : 'p-6'}`}>
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
                  {stats.totalActions > 0 && (
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-600">Réalisées:</span>
                        <span className="font-semibold text-green-600">{stats.completedActions}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-gray-600">À faire:</span>
                        <span className="font-semibold text-orange-600">{stats.pendingActions}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Vérification des props et rendu du composant actions */}
                {hasValidProps ? (
                  <PatientActions
                    actions={patient.actions || []}
                    filter={filter}
                    setFilter={setFilter}
                    onToggle={handleActionToggle}
                    onAddAction={onAddAction}
                    onDeleteAction={onDeleteAction}
                    onEditAction={onEditAction}
                    isUpdating={isUpdatingAction}
                    compactMode={compactMode}
                    showIcnpInfo={showAdvancedFeatures}
                    showProgress={showAdvancedFeatures}
                    showStats={showAdvancedFeatures}
                    patientName={patient.nom}
                  />
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">Erreur de configuration des actions</p>
                        <p className="text-sm">
                          Les props requises pour la gestion des actions ne sont pas correctement configurées.
                        </p>
                        <div className="text-xs space-y-1 mt-3 p-2 bg-red-50 rounded border">
                          <p><strong>filter:</strong> {JSON.stringify(filter)}</p>
                          <p><strong>setFilter:</strong> {String(typeof setFilter)}</p>
                          <p><strong>handleActionToggle:</strong> {String(typeof handleActionToggle)}</p>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Indicateur de chargement global */}
        {isUpdatingAction && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
            <div className="bg-white rounded-lg shadow-lg p-4 flex items-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Mise à jour en cours...</span>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default PatientDetailsTabs;
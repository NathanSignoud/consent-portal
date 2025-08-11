import React, { useMemo, useState } from "react";
import { 
  Calendar, 
  User, 
  MapPin, 
  Heart, 
  Hospital, 
  Clock, 
  FileText, 
  Badge as BadgeIcon, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Edit3,
  Phone,
  Mail,
  Home,
  Stethoscope,
  UserCheck,
  Building2,
  TrendingUp,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  MoreHorizontal
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Patient2, PatientAction, PatientAddress } from "@/types";

interface PatientInfosProps {
  patient: Patient2;
  calculateAge?: (dateNaissance: string) => number;
  
  // Nouvelles props pour fonctionnalités avancées
  showActions?: boolean;
  showAddress?: boolean;
  showStatistics?: boolean;
  showPathologies?: boolean;
  allowEdit?: boolean;
  compactMode?: boolean;
  
  // Actions possibles
  onEdit?: (patient: Patient2) => void;
  onViewFullProfile?: (patientId: string) => void;
  onExportData?: (patient: Patient2) => void;
  onCopyInfo?: (text: string) => void;
  
  // Personnalisation
  variant?: 'default' | 'detailed' | 'summary';
  showSensitiveData?: boolean;
}

const PatientInfos: React.FC<PatientInfosProps> = ({ 
  patient, 
  calculateAge,
  showActions = true,
  showAddress = true,
  showStatistics = true,
  showPathologies = true,
  allowEdit = false,
  compactMode = false,
  onEdit,
  onViewFullProfile,
  onExportData,
  onCopyInfo,
  variant = 'default',
  showSensitiveData = true
}) => {
  const [hideSensitiveInfo, setHideSensitiveInfo] = useState(!showSensitiveData);
  const [activeTab, setActiveTab] = useState('identity');

  // Fonction par défaut pour calculer l'âge
  const defaultCalculateAge = (dateNaissance: string): number => {
    const birth = new Date(dateNaissance);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const ageCalculator = calculateAge || defaultCalculateAge;

  // Formatage des dates
  const formatDate = (dateString: string | Date | undefined, includeTime = false) => {
    if (!dateString) return "Non renseigné";
    
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      };
      
      if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
      }
      
      return date.toLocaleDateString('fr-FR', options);
    } catch {
      return "Date invalide";
    }
  };

  // Configuration du statut
  const getStatusConfig = (status: string) => {
    const statusLower = status?.toLowerCase() || "";
    
    if (statusLower.includes("terminé") || statusLower.includes("fermé") || statusLower.includes("sorti")) {
      return {
        color: "bg-red-50 text-red-700 border-red-200",
        icon: <CheckCircle className="w-4 h-4" />,
        variant: "destructive" as const
      };
    }
    if (statusLower.includes("en cours") || statusLower.includes("actif") || statusLower.includes("hospitalisé")) {
      return {
        color: "bg-green-50 text-green-700 border-green-200",
        icon: <Activity className="w-4 h-4" />,
        variant: "default" as const
      };
    }
    if (statusLower.includes("attente") || statusLower.includes("pause")) {
      return {
        color: "bg-yellow-50 text-yellow-700 border-yellow-200",
        icon: <Clock className="w-4 h-4" />,
        variant: "secondary" as const
      };
    }
    return {
      color: "bg-gray-50 text-gray-700 border-gray-200",
      icon: <Info className="w-4 h-4" />,
      variant: "outline" as const
    };
  };

  // Icône selon le sexe
  const getSexeIcon = (sexe: string) => {
    const sexeLower = sexe?.toLowerCase() || "";
    if (sexeLower.includes("f") || sexeLower.includes("femme")) {
      return { icon: "♀", color: "text-pink-600 bg-pink-100" };
    }
    if (sexeLower.includes("m") || sexeLower.includes("homme")) {
      return { icon: "♂", color: "text-blue-600 bg-blue-100" };
    }
    return { icon: "⚬", color: "text-gray-600 bg-gray-100" };
  };

  // Calculs des statistiques
  const patientStats = useMemo(() => {
    const actions = patient.actions || [];
    const totalActions = actions.length;
    const completedActions = actions.filter(action => action.status === 'réalisé').length;
    const pendingActions = totalActions - completedActions;
    const completionRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
    
    // Calcul du temps depuis le début de prise en charge
    const daysSinceAdmission = patient.dateDebutPriseEnCharge 
      ? Math.floor((Date.now() - new Date(patient.dateDebutPriseEnCharge).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    // Actions avec ICNP
    const icnpActions = actions.filter(action => action.icnp?.id).length;
    
    return {
      totalActions,
      completedActions,
      pendingActions,
      completionRate,
      daysSinceAdmission,
      icnpActions,
      pathologiesCount: patient.pathologies?.length || 0
    };
  }, [patient]);

  const age = ageCalculator(patient.dateNaissance);
  const statusConfig = getStatusConfig(patient.situationDossier || "");
  const sexeConfig = getSexeIcon(patient.sexe);

  // Handlers
  const handleCopyToClipboard = (text: string, label: string) => {
    if (onCopyInfo) {
      onCopyInfo(text);
    } else {
      navigator.clipboard.writeText(text);
      // Vous pourriez ajouter une notification toast ici
    }
  };

  // Composant InfoCard
  const InfoCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    value: string | React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
  }> = ({ icon, title, subtitle, value, actions, className = "" }) => (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-600">{title}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        <div className="font-semibold text-gray-900">{value}</div>
      </div>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </div>
  );

  // Mode summary pour affichage compact
  if (variant === 'summary') {
    return (
      <Card className="bg-white/50 backdrop-blur-sm border border-white/20 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                {patient.nom.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{patient.nom}</h3>
                <p className="text-sm text-gray-600">{age} ans • {patient.sexe}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={statusConfig.variant}>
                {statusConfig.icon}
                <span className="ml-1">{patient.situationDossier}</span>
              </Badge>
              
              {onViewFullProfile && (
                <Button variant="outline" size="sm" onClick={() => onViewFullProfile(patient._id)}>
                  <Eye className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Interface détaillée principale
  return (
    <div className="space-y-6">
      
      {/* En-tête avec actions */}
      <Card className="bg-white/50 backdrop-blur-sm border border-white/20 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {patient.nom.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{patient.nom}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <Badge variant="outline">ID: {patient._id.slice(-8)}</Badge>
                  {patient.ipp && (
                    <Badge variant="outline">IPP: {patient.ipp}</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setHideSensitiveInfo(!hideSensitiveInfo)}
                    className="text-gray-500"
                  >
                    {hideSensitiveInfo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {allowEdit && onEdit && (
                <Button variant="outline" onClick={() => onEdit(patient)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleCopyToClipboard(patient._id, 'ID Patient')}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copier l'ID
                  </DropdownMenuItem>
                  
                  {onViewFullProfile && (
                    <DropdownMenuItem onClick={() => onViewFullProfile(patient._id)}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Voir le profil complet
                    </DropdownMenuItem>
                  )}
                  
                  {onExportData && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onExportData(patient)}>
                        <FileText className="w-4 h-4 mr-2" />
                        Exporter les données
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onglets d'information */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="identity" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Identité
          </TabsTrigger>
          <TabsTrigger value="medical" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Médical
          </TabsTrigger>
          <TabsTrigger value="hospital" className="flex items-center gap-2">
            <Hospital className="w-4 h-4" />
            Hospitalier
          </TabsTrigger>
          {showStatistics && (
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Statistiques
            </TabsTrigger>
          )}
        </TabsList>

        {/* Onglet Identité */}
        <TabsContent value="identity" className="space-y-6">
          <Card className="bg-white/50 backdrop-blur-sm border border-white/20 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Informations personnelles</h3>
                  <p className="text-sm text-gray-600">Données d'identité du patient</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <InfoCard
                    icon={<FileText className="w-5 h-5 text-blue-600" />}
                    title="Nom complet"
                    value={hideSensitiveInfo ? "••••••••" : patient.nom}
                    actions={
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleCopyToClipboard(patient.nom, 'Nom')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    }
                  />

                  <InfoCard
                    icon={<Calendar className="w-5 h-5 text-purple-600" />}
                    title="Âge"
                    subtitle={hideSensitiveInfo ? "••••••••" : formatDate(patient.dateNaissance)}
                    value={`${age} ans`}
                  />
                </div>

                <div className="space-y-4">
                  <InfoCard
                    icon={<div className={`w-5 h-5 rounded-full ${sexeConfig.color} flex items-center justify-center font-bold text-sm`}>
                      {sexeConfig.icon}
                    </div>}
                    title="Sexe"
                    value={patient.sexe}
                  />

                  <InfoCard
                    icon={<BadgeIcon className="w-5 h-5 text-gray-600" />}
                    title="Statut d'identité"
                    value={patient.statutIdentite}
                  />
                </div>
              </div>

              {patient.ipp && (
                <div className="mt-6 p-4 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Identifiant Patient Permanent (IPP)</p>
                      <p className="text-lg font-bold text-gray-900 font-mono">{patient.ipp}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCopyToClipboard(patient.ipp!, 'IPP')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Adresse si disponible */}
          {showAddress && patient.adresse && (
            <Card className="bg-white/50 backdrop-blur-sm border border-white/20 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Home className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Adresse</h3>
                </div>
                
                <div className="space-y-2">
                  {patient.adresse.rue && (
                    <p className="text-gray-900">{hideSensitiveInfo ? "••••••••" : patient.adresse.rue}</p>
                  )}
                  <p className="text-gray-900">
                    {hideSensitiveInfo ? "•••••" : `${patient.adresse.codePostal || ''} ${patient.adresse.ville || ''}`}
                  </p>
                  {patient.adresse.complement && (
                    <p className="text-sm text-gray-600">{patient.adresse.complement}</p>
                  )}
                  
                  {patient.adresse.latitude && patient.adresse.longitude && (
                    <div className="flex items-center gap-2 mt-3">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Géolocalisé ({patient.adresse.latitude.toFixed(4)}, {patient.adresse.longitude.toFixed(4)})
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Onglet Médical */}
        <TabsContent value="medical" className="space-y-6">
          <Card className="bg-white/50 backdrop-blur-sm border border-white/20 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Heart className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Informations médicales</h3>
                  <p className="text-sm text-gray-600">Suivi et pathologies</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Unité organisationnelle */}
                {patient.uniteOrganisationnelle && (
                  <InfoCard
                    icon={<Building2 className="w-5 h-5 text-blue-600" />}
                    title="Unité organisationnelle"
                    value={patient.uniteOrganisationnelle}
                  />
                )}

                {/* Situation du dossier */}
                {patient.situationDossier && (
                  <InfoCard
                    icon={<Activity className="w-5 h-5 text-green-600" />}
                    title="Situation du dossier"
                    value={
                      <Badge variant={statusConfig.variant} className="mt-1">
                        {statusConfig.icon}
                        <span className="ml-1">{patient.situationDossier}</span>
                      </Badge>
                    }
                  />
                )}

                {/* Pathologies */}
                {showPathologies && patient.pathologies && patient.pathologies.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <Stethoscope className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Pathologies diagnostiquées</p>
                        <p className="text-sm text-gray-600">{patient.pathologies.length} pathologie(s) identifiée(s)</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {patient.pathologies.map((pathology, index) => (
                        <div 
                          key={index}
                          className="flex items-center gap-3 p-3 bg-red-50/50 rounded-lg border border-red-100"
                        >
                          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                          <span className="text-sm text-red-800 font-medium">{pathology}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Hospitalier */}
        <TabsContent value="hospital" className="space-y-6">
          <Card className="bg-white/50 backdrop-blur-sm border border-white/20 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Hospital className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Suivi hospitalier</h3>
                  <p className="text-sm text-gray-600">Dates et provenance</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <InfoCard
                    icon={<UserCheck className="w-5 h-5 text-green-600" />}
                    title="Début de prise en charge"
                    subtitle={patientStats.daysSinceAdmission > 0 ? `Il y a ${patientStats.daysSinceAdmission} jours` : undefined}
                    value={formatDate(patient.dateDebutPriseEnCharge)}
                  />

                  {patient.hopitalProvenance && (
                    <InfoCard
                      icon={<Hospital className="w-5 h-5 text-purple-600" />}
                      title="Hôpital de provenance"
                      value={patient.hopitalProvenance}
                    />
                  )}
                </div>

                <div className="space-y-4">
                  <InfoCard
                    icon={<Calendar className="w-5 h-5 text-orange-600" />}
                    title="Sortie prévue"
                    value={formatDate(patient.dateSortiePrevue)}
                  />

                  {patient.dateSortieEffective && (
                    <InfoCard
                      icon={<CheckCircle className="w-5 h-5 text-red-600" />}
                      title="Sortie effective"
                      value={formatDate(patient.dateSortieEffective)}
                    />
                  )}
                </div>
              </div>

              {/* Timeline visuelle */}
              <div className="mt-8 p-4 bg-gray-50/80 backdrop-blur-sm rounded-xl">
                <h4 className="font-medium text-gray-900 mb-4">Timeline du séjour</h4>
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-300"></div>
                  <div className="space-y-4">
                    {patient.dateDebutPriseEnCharge && (
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <UserCheck className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">Admission</p>
                          <p className="text-sm text-gray-600">{formatDate(patient.dateDebutPriseEnCharge, true)}</p>
                        </div>
                      </div>
                    )}
                    
                    {patient.dateSortiePrevue && !patient.dateSortieEffective && (
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">Sortie prévue</p>
                          <p className="text-sm text-gray-600">{formatDate(patient.dateSortiePrevue)}</p>
                        </div>
                      </div>
                    )}
                    
                    {patient.dateSortieEffective && (
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">Sortie effective</p>
                          <p className="text-sm text-gray-600">{formatDate(patient.dateSortieEffective, true)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Statistiques */}
        {showStatistics && (
          <TabsContent value="stats" className="space-y-6">
            <Card className="bg-white/50 backdrop-blur-sm border border-white/20 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Statistiques détaillées</h3>
                    <p className="text-sm text-gray-600">Analyse des données patient</p>
                  </div>
                </div>

                {/* Métriques principales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50/80 backdrop-blur-sm rounded-xl p-4 border border-blue-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Actions totales</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{patientStats.totalActions}</p>
                  </div>

                  <div className="bg-green-50/80 backdrop-blur-sm rounded-xl p-4 border border-green-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Réalisées</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900">{patientStats.completedActions}</p>
                  </div>

                  <div className="bg-orange-50/80 backdrop-blur-sm rounded-xl p-4 border border-orange-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-700">En attente</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-900">{patientStats.pendingActions}</p>
                  </div>

                  <div className="bg-purple-50/80 backdrop-blur-sm rounded-xl p-4 border border-purple-200/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Stethoscope className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-700">Pathologies</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900">{patientStats.pathologiesCount}</p>
                  </div>
                </div>

                {/* Progression des actions */}
                {patientStats.totalActions > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Progression des actions</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {patientStats.completedActions} / {patientStats.totalActions} terminées
                      </span>
                    </div>
                    <Progress value={patientStats.completionRate} className="h-3 mb-2" />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0%</span>
                      <span className="font-medium">{patientStats.completionRate}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                )}

                {/* Statistiques ICNP */}
                {patientStats.icnpActions > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-indigo-50/80 backdrop-blur-sm rounded-xl p-4 border border-indigo-200/50">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-medium text-indigo-700">Actions ICNP</span>
                      </div>
                      <p className="text-xl font-bold text-indigo-900">{patientStats.icnpActions}</p>
                      <p className="text-xs text-indigo-600">
                        {Math.round((patientStats.icnpActions / patientStats.totalActions) * 100)}% des actions
                      </p>
                    </div>

                    <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">Durée séjour</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900">{patientStats.daysSinceAdmission}</p>
                      <p className="text-xs text-gray-600">
                        {patientStats.daysSinceAdmission === 1 ? 'jour' : 'jours'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Alerte si aucune action */}
                {patientStats.totalActions === 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Aucune action n'a encore été enregistrée pour ce patient.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Résumé des actions si activé */}
      {showActions && patient.actions && patient.actions.length > 0 && (
        <Card className="bg-white/50 backdrop-blur-sm border border-white/20 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Activity className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Actions récentes</h3>
                  <p className="text-sm text-gray-600">Dernières interventions</p>
                </div>
              </div>
              
              <Badge variant="outline">
                {patient.actions.length} action(s)
              </Badge>
            </div>

            <div className="space-y-3">
              {patient.actions.slice(-3).map((action, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    action.status === 'réalisé' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-orange-50 border-orange-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    action.status === 'réalisé' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-orange-500 text-white'
                  }`}>
                    {action.status === 'réalisé' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{action.label}</p>
                    {action.icnp?.term?.fr && action.label !== action.icnp.term.fr && (
                      <p className="text-sm text-blue-600">ICNP: {action.icnp.term.fr}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={action.status === 'réalisé' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {action.status}
                      </Badge>
                      {action.icnp?.id && (
                        <Badge variant="outline" className="text-xs">
                          {action.icnp.id}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {action.date && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {formatDate(action.date)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              
              {patient.actions.length > 3 && (
                <div className="text-center pt-2">
                  <Button variant="outline" size="sm">
                    Voir toutes les actions ({patient.actions.length})
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations de contact si disponibles */}
      <Card className="bg-blue-50/30 backdrop-blur-sm border border-blue-200/50 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Informations importantes</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Patient pris en charge depuis {patientStats.daysSinceAdmission} jour(s)</p>
                <p>• {patientStats.totalActions} action(s) planifiée(s) ou réalisée(s)</p>
                {patientStats.icnpActions > 0 && (
                  <p>• {patientStats.icnpActions} intervention(s) normalisée(s) ICNP</p>
                )}
                <p>• Dossier mis à jour le {formatDate(new Date())}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientInfos;
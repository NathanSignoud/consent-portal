import React, { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  User, 
  Calendar, 
  MapPin, 
  Activity, 
  ChevronRight, 
  Trash2, 
  Heart, 
  Shield, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Eye,
  EyeOff,
  Filter,
  Grid3X3,
  List,
  MoreHorizontal,
  Phone,
  Mail,
  FileText,
  Edit3,
  Copy,
  Download,
  Star,
  AlertTriangle,
  Users,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Patient2 } from "../types/patient2";

interface Patient2ListProps {
  patients: Patient2[];
  title: string;
  handleDelete?: (id: string) => void;
  onEdit?: (patient: Patient2) => void;
  onView?: (patientId: string) => void;
  onExport?: (patient: Patient2) => void;
  
  // Nouvelles props pour fonctionnalités avancées
  isLoading?: boolean;
  viewMode?: 'grid' | 'list' | 'compact';
  showSearch?: boolean;
  showFilters?: boolean;
  showStats?: boolean;
  allowActions?: boolean;
  showPatientDetails?: boolean;
  onPatientSelect?: (patients: Patient2[]) => void;
  selectedPatients?: string[];
  
  // Personnalisation
  className?: string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
}

interface PatientStats {
  total: number;
  active: number;
  completed: number;
  urgent: number;
  averageAge: number;
}

const Patient2List: React.FC<Patient2ListProps> = ({ 
  patients, 
  title, 
  handleDelete,
  onEdit,
  onView,
  onExport,
  isLoading = false,
  viewMode = 'grid',
  showSearch = false,
  showFilters = false,
  showStats = true,
  allowActions = true,
  showPatientDetails = true,
  onPatientSelect,
  selectedPatients = [],
  className = "",
  emptyStateTitle = "Aucun patient trouvé",
  emptyStateDescription = "Essayez d'ajuster vos critères de recherche"
}) => {
  const [localViewMode, setLocalViewMode] = useState<'grid' | 'list' | 'compact'>(viewMode);
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);
  const [expandedPatients, setExpandedPatients] = useState<Set<string>>(new Set());

  // Calculs des statistiques
  const stats: PatientStats = useMemo(() => {
    const total = patients.length;
    const active = patients.filter(p => p.situationDossier?.toLowerCase().includes('actif') || p.situationDossier?.toLowerCase().includes('en cours')).length;
    const completed = patients.filter(p => p.situationDossier?.toLowerCase().includes('terminé') || p.situationDossier?.toLowerCase().includes('fermé')).length;
    const urgent = patients.filter(p => p.pathologies?.some(path => path.toLowerCase().includes('urgent'))).length;
    const ages = patients.map(p => calculateAge(p.dateNaissance)).filter(age => age > 0);
    const averageAge = ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 0;

    return { total, active, completed, urgent, averageAge };
  }, [patients]);

  const calculateAge = useCallback((dateNaissance: string): number => {
    if (!dateNaissance) return 0;
    const birth = new Date(dateNaissance);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }, []);

  const getSituationConfig = useCallback((situation: string) => {
    const situationLower = situation?.toLowerCase() || '';
    
    if (situationLower.includes("terminé") || situationLower.includes("fermé")) {
      return {
        color: "bg-red-50 text-red-700 border-red-200",
        icon: <CheckCircle className="w-3 h-3" />,
        dotColor: "bg-red-500"
      };
    }
    if (situationLower.includes("en cours") || situationLower.includes("actif")) {
      return {
        color: "bg-green-50 text-green-700 border-green-200",
        icon: <Activity className="w-3 h-3" />,
        dotColor: "bg-green-500"
      };
    }
    if (situationLower.includes("attente") || situationLower.includes("pause")) {
      return {
        color: "bg-yellow-50 text-yellow-700 border-yellow-200",
        icon: <Clock className="w-3 h-3" />,
        dotColor: "bg-yellow-500"
      };
    }
    return {
      color: "bg-gray-50 text-gray-700 border-gray-200",
      icon: <AlertCircle className="w-3 h-3" />,
      dotColor: "bg-gray-500"
    };
  }, []);

  const getInitials = useCallback((nom: string) => {
    return nom
      ?.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase() || '??';
  }, []);

  const handlePatientExpand = useCallback((patientId: string) => {
    setExpandedPatients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(patientId)) {
        newSet.delete(patientId);
      } else {
        newSet.add(patientId);
      }
      return newSet;
    });
  }, []);

  const handleCopyInfo = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    // Ici, vous pourriez ajouter une notification toast
  }, []);

  // Rendu des statistiques
  const StatsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-800">Total</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">Actifs</p>
              <p className="text-2xl font-bold text-green-900">{stats.active}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-800">Terminés</p>
              <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-orange-800">Urgents</p>
              <p className="text-2xl font-bold text-orange-900">{stats.urgent}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-purple-800">Âge moyen</p>
              <p className="text-2xl font-bold text-purple-900">{stats.averageAge} ans</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Rendu d'un patient en mode grille
  const PatientGridCard = ({ patient }: { patient: Patient2 }) => {
    const age = calculateAge(patient.dateNaissance);
    const situation = patient.situationDossier || "Inconnue";
    const situationConfig = getSituationConfig(situation);
    const initials = getInitials(patient.nom || "");
    const isExpanded = expandedPatients.has(patient._id);

    return (
      <Card className="group bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:bg-white/90 relative overflow-hidden">
        {/* Élément décoratif */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-2xl"></div>
        
        <CardContent className="p-6 relative z-10">
          {/* En-tête avec avatar et statut */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              {/* Avatar avec initiales */}
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {initials}
                </div>
                {/* Indicateur de statut */}
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${situationConfig.dotColor} rounded-full border-2 border-white shadow-sm`}></div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                  <Link to={`/patient2/${patient._id}`} className="hover:underline">
                    {patient.nom?.toUpperCase()}
                  </Link>
                </h3>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm font-medium">{age} ans</span>
                </div>
              </div>
            </div>

            {/* Badge situation */}
            <Badge variant="outline" className={`${situationConfig.color} flex items-center gap-2`}>
              {situationConfig.icon}
              {situation}
            </Badge>
          </div>

          {/* Informations détaillées */}
          <div className="space-y-3 mb-6">
            {/* Unité organisationnelle */}
            {patient.uniteOrganisationnelle && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <div className="p-1 bg-blue-100 rounded-lg">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-medium">Unité :</span>
                <span className="text-gray-600">{patient.uniteOrganisationnelle}</span>
              </div>
            )}

            {/* Pathologies */}
            {Array.isArray(patient.pathologies) && patient.pathologies.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <div className="p-1 bg-red-100 rounded-lg">
                    <Heart className="w-4 h-4 text-red-600" />
                  </div>
                  <span>Pathologies :</span>
                </div>
                <div className="flex flex-wrap gap-2 ml-7">
                  {patient.pathologies.slice(0, isExpanded ? undefined : 3).map((pathology, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {pathology}
                    </Badge>
                  ))}
                  {!isExpanded && patient.pathologies.length > 3 && (
                    <button
                      onClick={() => handlePatientExpand(patient._id)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      +{patient.pathologies.length - 3} autre(s)
                    </button>
                  )}
                  {isExpanded && patient.pathologies.length > 3 && (
                    <button
                      onClick={() => handlePatientExpand(patient._id)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Voir moins
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Informations supplémentaires en mode étendu */}
            {isExpanded && showPatientDetails && (
              <div className="border-t border-gray-100 pt-4 space-y-3">
                {patient.dateNaissance && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Né(e) le {new Date(patient.dateNaissance).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
                
                {patient.sexe && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>Sexe : {patient.sexe}</span>
                  </div>
                )}

                {/* Actions du patient */}
                {patient.actions && patient.actions.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Actions en cours</span>
                    </div>
                    <Progress 
                      value={(patient.actions.filter(a => a.status === 'réalisé').length / patient.actions.length) * 100}
                      className="h-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {patient.actions.filter(a => a.status === 'réalisé').length}/{patient.actions.length} terminées
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100/50">
            <Link
              to={`/patient2/${patient._id}`}
              className="group/link inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm transition-all duration-200 hover:gap-3"
            >
              <Shield className="w-4 h-4" />
              Voir le détail
              <ChevronRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
            </Link>
            
            {allowActions && (
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(patient)}>
                        <Edit3 className="w-4 h-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem onClick={() => handleCopyInfo(patient._id, 'ID Patient')}>
                      <Copy className="w-4 h-4 mr-2" />
                      Copier l'ID
                    </DropdownMenuItem>
                    
                    {onExport && (
                      <DropdownMenuItem onClick={() => onExport(patient)}>
                        <Download className="w-4 h-4 mr-2" />
                        Exporter
                      </DropdownMenuItem>
                    )}
                    
                    {handleDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(patient._id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Effet de survol */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </CardContent>
      </Card>
    );
  };

  // État vide
  if (patients.length === 0 && !isLoading) {
    return (
      <div className={`max-w-6xl mx-auto px-4 py-12 ${className}`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{emptyStateTitle}</h3>
          <p className="text-gray-500">{emptyStateDescription}</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={`max-w-6xl mx-auto px-4 py-6 ${className}`}>
        
        {/* En-tête avec titre et contrôles */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-600">Gestion et suivi des patients</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Commutateur d'affichage des infos sensibles */}
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

            {/* Mode d'affichage */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Button
                variant={localViewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLocalViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={localViewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLocalViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        {showStats && <StatsCards />}

        {/* État de chargement */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Chargement des patients...</span>
          </div>
        )}

        {/* Liste des patients */}
        {!isLoading && (
          <div className={`
            ${localViewMode === 'grid' 
              ? 'grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2' 
              : 'space-y-4'
            }
          `}>
            {patients.map((patient) => (
              <PatientGridCard key={patient._id} patient={patient} />
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default Patient2List;
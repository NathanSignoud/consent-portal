import React, { useState, useMemo, useCallback } from 'react';
import { 
  Calendar, 
  User, 
  Users, // Icône Users ajoutée
  MapPin, 
  Heart, 
  Hospital, 
  Clock, 
  FileText, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Eye,
  Edit3,
  Trash2,
  Download,
  MoreHorizontal,
  AlertTriangle,
  Grid,
  List,
  Filter,
  Search,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  // IMPORTANT: Définir calculateAge AVANT le useMemo
  const calculateAge = useCallback((dateNaissance: string | Date | undefined): number => {
    if (!dateNaissance) return 0;
    
    try {
      const birth = new Date(dateNaissance);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      return age > 0 ? age : 0;
    } catch {
      return 0;
    }
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

  const getInitials = useCallback((nom: string, prenom?: string) => {
    const fullName = `${nom || ''} ${prenom || ''}`.trim();
    return fullName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase() || '??';
  }, []);

  // Formatage des dates
  const formatDate = useCallback((dateString: string | Date | undefined) => {
    if (!dateString) return "Non renseigné";
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return "Date invalide";
    }
  }, []);

  // Formatage de l'adresse - FONCTION CRUCIALE POUR ÉVITER L'ERREUR
  const formatAddress = useCallback((adresse: any) => {
    // Vérification stricte du type et de la structure
    if (!adresse || typeof adresse !== 'object') {
      return "Adresse non renseignée";
    }
    
    const parts = [];
    
    // Extraire de manière sécurisée chaque propriété
    if (adresse.rue && typeof adresse.rue === 'string') {
      parts.push(adresse.rue);
    }
    
    if (adresse.codePostal && adresse.ville) {
      const postal = typeof adresse.codePostal === 'string' ? adresse.codePostal : String(adresse.codePostal);
      const ville = typeof adresse.ville === 'string' ? adresse.ville : String(adresse.ville);
      parts.push(`${postal} ${ville}`);
    } else if (adresse.ville) {
      const ville = typeof adresse.ville === 'string' ? adresse.ville : String(adresse.ville);
      parts.push(ville);
    }
    
    return parts.length > 0 ? parts.join(', ') : "Adresse non renseignée";
  }, []);

  // Calculs des statistiques (maintenant calculateAge est défini)
  const stats: PatientStats = useMemo(() => {
    const total = patients.length;
    const active = patients.filter(p => 
      p.situationDossier?.toLowerCase().includes('actif') || 
      p.situationDossier?.toLowerCase().includes('en cours')
    ).length;
    const completed = patients.filter(p => 
      p.situationDossier?.toLowerCase().includes('terminé') || 
      p.situationDossier?.toLowerCase().includes('fermé')
    ).length;
    const urgent = patients.filter(p => 
      p.pathologies?.some(path => path.toLowerCase().includes('urgent'))
    ).length;
    
    const ages = patients
      .map(p => calculateAge(p.dateNaissance))
      .filter(age => age > 0);
    
    const averageAge = ages.length > 0 
      ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) 
      : 0;

    return { total, active, completed, urgent, averageAge };
  }, [patients, calculateAge]);

  // État de chargement
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des patients...</p>
        </div>
      </div>
    );
  }

  // État vide
  if (!patients || patients.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Users className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{emptyStateTitle}</h3>
        <p className="text-gray-600 mb-6 max-w-sm mx-auto">{emptyStateDescription}</p>
      </div>
    );
  }

  // Composant pour les statistiques
  const StatsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
    const initials = getInitials(patient.nom, patient.prenom);

    return (
      <Card className="group hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-blue-300">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                {initials}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {patient.prenom} {patient.nom}
                </h3>
                <p className="text-sm text-gray-600">{age} ans</p>
              </div>
            </div>

            {allowActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onView && (
                    <DropdownMenuItem onClick={() => onView(patient._id || '')}>
                      <Eye className="w-4 h-4 mr-2" />
                      Voir le dossier
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(patient)}>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                  )}
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
                        onClick={() => handleDelete(patient._id || '')}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={situationConfig.color}>
                {situationConfig.icon}
                <span className="ml-1">{situation}</span>
              </Badge>
            </div>

            {showPatientDetails && (
              <>
                {patient.dateDebutPriseEnCharge && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Prise en charge: {formatDate(patient.dateDebutPriseEnCharge)}</span>
                  </div>
                )}

                {patient.pathologies && patient.pathologies.length > 0 && (
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <Heart className="w-4 h-4 mt-0.5 text-red-500" />
                    <div>
                      <span className="font-medium">Pathologies:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {patient.pathologies.slice(0, 2).map((pathology, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {pathology}
                          </Badge>
                        ))}
                        {patient.pathologies.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{patient.pathologies.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {patient.adresse && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{formatAddress(patient.adresse)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Rendu d'un patient en mode liste
  const PatientListItem = ({ patient }: { patient: Patient2 }) => {
    const age = calculateAge(patient.dateNaissance);
    const situation = patient.situationDossier || "Inconnue";
    const situationConfig = getSituationConfig(situation);
    const initials = getInitials(patient.nom, patient.prenom);

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {initials}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {patient.prenom} {patient.nom}
                  </h3>
                  <span className="text-sm text-gray-600">{age} ans</span>
                  <Badge variant="outline" className={`${situationConfig.color} text-xs`}>
                    {situationConfig.icon}
                    <span className="ml-1">{situation}</span>
                  </Badge>
                </div>
                
                {showPatientDetails && (
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    {patient.dateDebutPriseEnCharge && (
                      <span>Prise en charge: {formatDate(patient.dateDebutPriseEnCharge)}</span>
                    )}
                    {patient.pathologies && patient.pathologies.length > 0 && (
                      <span>Pathologies: {patient.pathologies.length}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {allowActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onView && (
                    <DropdownMenuItem onClick={() => onView(patient._id || '')}>
                      <Eye className="w-4 h-4 mr-2" />
                      Voir le dossier
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(patient)}>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                  )}
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
                        onClick={() => handleDelete(patient._id || '')}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* En-tête avec titre et contrôles de vue */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <p className="text-gray-600 mt-1">
            {patients.length} patient{patients.length > 1 ? 's' : ''} au total
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={localViewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLocalViewMode('grid')}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={localViewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setLocalViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      {showStats && <StatsCards />}

      {/* Liste des patients */}
      {localViewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((patient) => (
            <PatientGridCard key={patient._id} patient={patient} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {patients.map((patient) => (
            <PatientListItem key={patient._id} patient={patient} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Patient2List;
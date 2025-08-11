import React, { useState, useMemo, useCallback } from 'react';
import { 
  Filter, 
  Search, 
  Calendar, 
  User, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  X,
  ChevronDown,
  Tag,
  Users,
  Activity
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { 
  TaskFilter, 
  SourceFilter, 
  TaskFilters, 
  TaskSummary,
  Patient2 
} from '@/types';

interface FiltersProps {
  // Props legacy (rétrocompatibilité)
  filter?: TaskFilter;
  sourceFilter?: SourceFilter;
  onFilterChange?: (filter: TaskFilter) => void;
  onSourceFilterChange?: (filter: SourceFilter) => void;
  totalTasks?: number;
  completedTasks?: number;
  pendingTasks?: number;
  manualTasks?: number;
  patientTasks?: number;
  
  // Nouvelles props modernes
  filters?: TaskFilters;
  onFiltersChange?: (filters: TaskFilters) => void;
  summary?: TaskSummary;
  patients?: Patient2[];
  
  // Options d'affichage
  showDateFilter?: boolean;
  showPatientFilter?: boolean;
  showSearchFilter?: boolean;
  showPriorityFilter?: boolean;
  showIcnpFilter?: boolean;
  
  // Personnalisation
  variant?: 'default' | 'compact' | 'sidebar';
  className?: string;
}

// Interface pour un filtre actif
interface ActiveFilter {
  key: string;
  label: string;
  value: string;
  color: string;
}

const Filters: React.FC<FiltersProps> = ({ 
  // Props legacy
  filter = 'all',
  sourceFilter = 'all',
  onFilterChange,
  onSourceFilterChange,
  totalTasks = 0,
  completedTasks = 0,
  pendingTasks = 0,
  manualTasks = 0,
  patientTasks = 0,
  
  // Nouvelles props
  filters,
  onFiltersChange,
  summary,
  patients = [],
  showDateFilter = true,
  showPatientFilter = true,
  showSearchFilter = true,
  showPriorityFilter = false,
  showIcnpFilter = false,
  variant = 'default',
  className = ''
}) => {
  // État local pour les filtres avancés
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'normal' | 'low'>('all');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Utiliser le summary si disponible, sinon les props legacy
  const stats = useMemo(() => {
    if (summary) {
      return {
        total: summary.total,
        completed: summary.completed,
        pending: summary.pending,
        manual: manualTasks, // Pas dans le summary, utiliser la prop
        patient: patientTasks
      };
    }
    return {
      total: totalTasks,
      completed: completedTasks,
      pending: pendingTasks,
      manual: manualTasks,
      patient: patientTasks
    };
  }, [summary, totalTasks, completedTasks, pendingTasks, manualTasks, patientTasks]);

  // Gestion des filtres modernes
  const currentFilters = useMemo(() => {
    if (filters) return filters;
    
    // Conversion depuis les props legacy
    return {
      status: filter,
      source: sourceFilter,
      userId: undefined,
      patientId: selectedPatient || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined
    };
  }, [filters, filter, sourceFilter, selectedPatient, dateFrom, dateTo]);

  // Liste des filtres actifs
  const activeFilters = useMemo((): ActiveFilter[] => {
    const active: ActiveFilter[] = [];
    
    if (currentFilters.status !== 'all') {
      active.push({
        key: 'status',
        label: 'Statut',
        value: currentFilters.status === 'completed' ? 'Terminées' : 'En attente',
        color: currentFilters.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
      });
    }
    
    if (currentFilters.source && currentFilters.source !== 'all') {
      active.push({
        key: 'source',
        label: 'Source',
        value: currentFilters.source === 'manual' ? 'Manuelles' : 'Patients',
        color: currentFilters.source === 'manual' ? 'bg-purple-100 text-purple-800' : 'bg-teal-100 text-teal-800'
      });
    }
    
    if (currentFilters.patientId) {
      const patient = patients.find(p => p._id === currentFilters.patientId);
      if (patient) {
        active.push({
          key: 'patient',
          label: 'Patient',
          value: `${patient.nom} ${patient.prenom || ''}`.trim(),
          color: 'bg-blue-100 text-blue-800'
        });
      }
    }
    
    if (searchQuery) {
      active.push({
        key: 'search',
        label: 'Recherche',
        value: searchQuery,
        color: 'bg-gray-100 text-gray-800'
      });
    }
    
    if (currentFilters.dateFrom) {
      active.push({
        key: 'dateFrom',
        label: 'Depuis',
        value: new Date(currentFilters.dateFrom).toLocaleDateString('fr-FR'),
        color: 'bg-indigo-100 text-indigo-800'
      });
    }
    
    return active;
  }, [currentFilters, patients, searchQuery]);

  // Fonction pour mettre à jour les filtres
  const updateFilters = useCallback((newFilters: Partial<TaskFilters>) => {
    if (onFiltersChange) {
      onFiltersChange({ ...currentFilters, ...newFilters });
    } else {
      // Mode legacy
      if (newFilters.status && onFilterChange) {
        onFilterChange(newFilters.status);
      }
      if (newFilters.source && onSourceFilterChange) {
        onSourceFilterChange(newFilters.source);
      }
    }
  }, [currentFilters, onFiltersChange, onFilterChange, onSourceFilterChange]);

  // Fonction pour supprimer un filtre
  const removeFilter = useCallback((filterKey: string) => {
    switch (filterKey) {
      case 'status':
        updateFilters({ status: 'all' });
        break;
      case 'source':
        updateFilters({ source: 'all' });
        break;
      case 'patient':
        setSelectedPatient('');
        updateFilters({ patientId: undefined });
        break;
      case 'search':
        setSearchQuery('');
        break;
      case 'dateFrom':
        setDateFrom('');
        updateFilters({ dateFrom: undefined });
        break;
    }
  }, [updateFilters]);

  // Fonction pour effacer tous les filtres
  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedPatient('');
    setDateFrom('');
    setDateTo('');
    setPriorityFilter('all');
    updateFilters({
      status: 'all',
      source: 'all',
      patientId: undefined,
      dateFrom: undefined,
      dateTo: undefined
    });
  }, [updateFilters]);

  // Rendu compact pour sidebar
  if (variant === 'compact') {
    return (
      <div className={`space-y-3 ${className}`}>
        {/* Filtres rapides */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={currentFilters.status === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilters({ status: 'all' })}
            className="text-xs"
          >
            Toutes ({stats.total})
          </Button>
          <Button
            variant={currentFilters.status === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilters({ status: 'pending' })}
            className="text-xs"
          >
            En attente ({stats.pending})
          </Button>
          <Button
            variant={currentFilters.status === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilters({ status: 'completed' })}
            className="text-xs"
          >
            Terminées ({stats.completed})
          </Button>
        </div>
        
        {/* Recherche rapide */}
        {showSearchFilter && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm"
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={`bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
          </div>
          
          {activeFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4 mr-1" />
              Effacer tout
            </Button>
          )}
        </div>

        {/* Filtres actifs */}
        {activeFilters.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Filtres actifs :</p>
            <div className="flex flex-wrap gap-2">
              {activeFilters.map((activeFilter) => (
                <Badge
                  key={activeFilter.key}
                  variant="secondary"
                  className={`${activeFilter.color} cursor-pointer hover:opacity-80`}
                  onClick={() => removeFilter(activeFilter.key)}
                >
                  {activeFilter.label}: {activeFilter.value}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Recherche */}
          {showSearchFilter && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Recherche</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher dans les interventions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          )}

          {/* Filtres par statut */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Par statut</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => updateFilters({ status: 'all' })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  currentFilters.status === 'all'
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Activity className="w-4 h-4" />
                Toutes ({stats.total})
              </button>
              <button
                onClick={() => updateFilters({ status: 'pending' })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  currentFilters.status === 'pending'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Clock className="w-4 h-4" />
                En attente ({stats.pending})
              </button>
              <button
                onClick={() => updateFilters({ status: 'completed' })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  currentFilters.status === 'completed'
                    ? 'bg-green-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                Terminées ({stats.completed})
              </button>
            </div>
          </div>

          {/* Filtres par source */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Par source</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => updateFilters({ source: 'all' })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  currentFilters.source === 'all'
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Tag className="w-4 h-4" />
                Toutes sources ({stats.total})
              </button>
              <button
                onClick={() => updateFilters({ source: 'manual' })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  currentFilters.source === 'manual'
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <User className="w-4 h-4" />
                Manuelles ({stats.manual})
              </button>
              <button
                onClick={() => updateFilters({ source: 'patient' })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  currentFilters.source === 'patient'
                    ? 'bg-teal-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users className="w-4 h-4" />
                Patients ({stats.patient})
              </button>
            </div>
          </div>

          {/* Filtres avancés */}
          <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between"
                disabled={!showDateFilter && !showPatientFilter && !showPriorityFilter}
              >
                <span className="flex items-center gap-2">
                  <ChevronDown className="w-4 h-4" />
                  Filtres avancés
                </span>
                {(currentFilters.patientId || currentFilters.dateFrom || priorityFilter !== 'all') && (
                  <Badge variant="secondary">Actifs</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
                {/* Filtre par patient */}
                {showPatientFilter && patients.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Patient</p>
                    <Select
                      value={selectedPatient}
                      onValueChange={(value) => {
                        setSelectedPatient(value);
                        updateFilters({ patientId: value || undefined });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un patient" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Tous les patients</SelectItem>
                        {patients.map((patient) => (
                          <SelectItem key={patient._id} value={patient._id}>
                            {patient.nom} {patient.prenom}
                            {patient.uniteOrganisationnelle && (
                              <span className="text-gray-500 ml-2">
                                ({patient.uniteOrganisationnelle})
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Filtre par date */}
                {showDateFilter && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Période</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-600">Du</label>
                        <Input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => {
                            setDateFrom(e.target.value);
                            updateFilters({ dateFrom: e.target.value || undefined });
                          }}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600">Au</label>
                        <Input
                          type="date"
                          value={dateTo}
                          onChange={(e) => {
                            setDateTo(e.target.value);
                            updateFilters({ dateTo: e.target.value || undefined });
                          }}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Filtre par priorité */}
                {showPriorityFilter && (
                  <div>
                    <p className="text-sm font-medium mb-2">Priorité</p>
                    <Select
                      value={priorityFilter}
                      onValueChange={(value: any) => setPriorityFilter(value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes priorités</SelectItem>
                        <SelectItem value="high">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            Haute
                          </div>
                        </SelectItem>
                        <SelectItem value="normal">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-500" />
                            Normale
                          </div>
                        </SelectItem>
                        <SelectItem value="low">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-gray-500" />
                            Basse
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant de filtres rapides pour header
export const QuickFilters: React.FC<Pick<FiltersProps, 'filters' | 'onFiltersChange' | 'summary'>> = ({
  filters,
  onFiltersChange,
  summary
}) => (
  <div className="flex items-center gap-2">
    <Badge
      variant={filters?.status === 'all' ? 'default' : 'secondary'}
      className="cursor-pointer"
      onClick={() => onFiltersChange?.({ ...filters, status: 'all' })}
    >
      Toutes ({summary?.total || 0})
    </Badge>
    <Badge
      variant={filters?.status === 'pending' ? 'default' : 'secondary'}
      className="cursor-pointer"
      onClick={() => onFiltersChange?.({ ...filters, status: 'pending' })}
    >
      En attente ({summary?.pending || 0})
    </Badge>
    <Badge
      variant={filters?.status === 'completed' ? 'default' : 'secondary'}
      className="cursor-pointer"
      onClick={() => onFiltersChange?.({ ...filters, status: 'completed' })}
    >
      Terminées ({summary?.completed || 0})
    </Badge>
  </div>
);

export default Filters;
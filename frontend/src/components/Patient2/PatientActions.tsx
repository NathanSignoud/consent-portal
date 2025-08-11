import React, { useState, useMemo, useCallback } from "react";
import { 
  CheckCircle, 
  Circle, 
  Calendar, 
  Filter, 
  Clock, 
  CheckSquare, 
  AlertCircle, 
  Plus, 
  X, 
  Activity,
  User,
  FileText,
  Tag,
  TrendingUp,
  MoreHorizontal,
  Edit3,
  Copy,
  Archive
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import ActionForm from "@/components/ActionForm";
import { IcnpData } from "@/types";

// Interface modernisée compatible avec le nouveau système ICNP
interface PatientAction {
  // === Legacy (compatibilité) ===
  id?: string;
  label: string;
  status: 'à faire' | 'réalisé';
  date?: string | Date | null;
  createdAt?: string;
  completedAt?: string;
  category?: string;
  priority?: 'basse' | 'normale' | 'haute' | 'urgente';
  description?: string;

  // === Nouveau bloc ICNP normalisé ===
  icnp?: IcnpData;

  // === Champs métier utiles côté UI ===
  patientName?: string;
  notes?: string;
  assignedTo?: string;
  estimatedDuration?: number; // en minutes
  dependencies?: string[]; // IDs d'autres actions
  tags?: string[];
}

interface PatientActionsProps {
  // Props de base
  actions: PatientAction[];
  filter: 'all' | 'todo' | 'done';
  setFilter: (f: 'all' | 'todo' | 'done') => void;
  onToggle: (index: number) => void;
  onAddAction?: (newAction: Omit<PatientAction, 'id'>) => void;
  onDeleteAction?: (index: number) => void;
  onEditAction?: (index: number, updatedAction: Partial<PatientAction>) => void;
  isUpdating?: boolean;
  
  // Nouvelles props pour fonctionnalités avancées
  showIcnpInfo?: boolean;
  showProgress?: boolean;
  showStats?: boolean;
  groupByCategory?: boolean;
  allowBulkActions?: boolean;
  compactMode?: boolean;
  patientName?: string;
  
  // Callbacks avancés
  onDuplicateAction?: (index: number) => void;
  onArchiveAction?: (index: number) => void;
  onExportActions?: () => void;
}

const PatientActions: React.FC<PatientActionsProps> = ({ 
  actions, 
  filter, 
  setFilter, 
  onToggle,
  onAddAction,
  onDeleteAction,
  onEditAction,
  isUpdating = false,
  showIcnpInfo = true,
  showProgress = true,
  showStats = true,
  groupByCategory = false,
  allowBulkActions = false,
  compactMode = false,
  patientName,
  onDuplicateAction,
  onArchiveAction,
  onExportActions
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedActions, setSelectedActions] = useState<Set<number>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['default']));

  // Calculs des statistiques
  const stats = useMemo(() => {
    const total = actions.length;
    const completed = actions.filter(action => action.status === 'réalisé').length;
    const pending = total - completed;
    const urgent = actions.filter(action => action.priority === 'urgente').length;
    const withIcnp = actions.filter(action => action.icnp?.id).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Calcul du temps estimé total
    const estimatedTime = actions.reduce((acc, action) => {
      return acc + (action.estimatedDuration || 0);
    }, 0);

    return {
      total,
      completed,
      pending,
      urgent,
      withIcnp,
      completionRate,
      estimatedTime
    };
  }, [actions]);

  // Filtrage des actions
  const filteredActions = useMemo(() => {
    return actions.filter((action) => {
      if (filter === 'todo') return action.status === 'à faire';
      if (filter === 'done') return action.status === 'réalisé';
      return true;
    });
  }, [actions, filter]);

  // Groupement par catégorie
  const groupedActions = useMemo(() => {
    if (!groupByCategory) return { 'default': filteredActions };
    
    return filteredActions.reduce((groups, action) => {
      const category = action.category || action.icnp?.axis || 'Sans catégorie';
      if (!groups[category]) groups[category] = [];
      groups[category].push(action);
      return groups;
    }, {} as Record<string, PatientAction[]>);
  }, [filteredActions, groupByCategory]);

  // Handlers
  const handleAddAction = useCallback((newAction: Omit<PatientAction, 'id'>) => {
    if (onAddAction) {
      onAddAction(newAction);
      setShowAddForm(false);
    }
  }, [onAddAction]);

  const handleToggleAction = useCallback((index: number) => {
    if (isUpdating) return;
    onToggle(index);
  }, [onToggle, isUpdating]);

  const handleSelectAction = useCallback((index: number, selected: boolean) => {
    setSelectedActions(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(index);
      } else {
        newSet.delete(index);
      }
      return newSet;
    });
  }, []);

  const handleBulkComplete = useCallback(() => {
    selectedActions.forEach(index => {
      if (actions[index]?.status === 'à faire') {
        handleToggleAction(index);
      }
    });
    setSelectedActions(new Set());
  }, [selectedActions, actions, handleToggleAction]);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  // Formatage de la date
  const formatDate = useCallback((date: string | Date | null | undefined) => {
    if (!date) return null;
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return null;
    }
  }, []);

  // Composant Action Item
  const ActionItem: React.FC<{ 
    action: PatientAction; 
    index: number; 
    originalIndex: number; 
    compact?: boolean 
  }> = ({ action, index, originalIndex, compact = false }) => {
    const isCompleted = action.status === 'réalisé';
    const isUrgent = action.priority === 'urgente';
    const hasIcnp = !!action.icnp?.id;

    return (
      <div 
        className={`group relative p-4 bg-white/50 backdrop-blur-sm border border-white/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ${
          !compact && 'hover:scale-[1.01]'
        } ${
          isCompleted ? 'bg-green-50/50 border-green-200/50' : 'hover:bg-white/80'
        } ${
          isUrgent ? 'ring-2 ring-red-200 border-red-300' : ''
        } ${
          isUpdating ? 'opacity-70' : ''
        }`}
      >
        <div className="flex items-start gap-4">
          
          {/* Checkbox avec sélection bulk */}
          <div className="flex flex-col gap-2">
            {allowBulkActions && (
              <input
                type="checkbox"
                checked={selectedActions.has(originalIndex)}
                onChange={(e) => handleSelectAction(originalIndex, e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300"
                disabled={isUpdating}
              />
            )}
            
            <button
              onClick={() => handleToggleAction(originalIndex)}
              disabled={isUpdating}
              className={`flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                isCompleted 
                  ? 'bg-green-500 border-green-500 text-white hover:bg-green-600' 
                  : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
              } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isCompleted ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Circle className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
              )}
            </button>
          </div>

          {/* Contenu de l'action */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <p className={`font-medium transition-all duration-300 ${
                    isCompleted 
                      ? 'line-through text-green-700' 
                      : 'text-gray-900'
                  }`}>
                    {action.label}
                  </p>
                  
                  {isUrgent && (
                    <Badge variant="destructive" className="text-xs animate-pulse">
                      Urgent
                    </Badge>
                  )}
                </div>
                
                {/* Informations ICNP */}
                {showIcnpInfo && hasIcnp && (
                  <div className="mb-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2 text-sm">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-blue-900">
                        {action.icnp?.term?.fr}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {action.icnp?.id}
                      </Badge>
                    </div>
                    {action.icnp?.description?.fr && (
                      <p className="text-xs text-blue-700 mt-1 ml-6">
                        {action.icnp.description.fr}
                      </p>
                    )}
                  </div>
                )}
                
                {/* Description */}
                {action.description && (
                  <p className="text-sm text-gray-600 mb-2">{action.description}</p>
                )}
                
                {/* Notes */}
                {action.notes && (
                  <p className="text-sm text-gray-500 mb-2 italic">{action.notes}</p>
                )}
                
                {/* Badges et métadonnées */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={isCompleted ? "default" : "secondary"} className="text-xs">
                    {isCompleted ? (
                      <><CheckSquare className="w-3 h-3 mr-1" /> Terminé</>
                    ) : (
                      <><Clock className="w-3 h-3 mr-1" /> En attente</>
                    )}
                  </Badge>
                  
                  {action.category && (
                    <Badge variant="outline" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" />
                      {action.category}
                    </Badge>
                  )}
                  
                  {action.priority && action.priority !== 'normale' && (
                    <Badge 
                      variant={action.priority === 'urgente' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {action.priority}
                    </Badge>
                  )}
                  
                  {action.estimatedDuration && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {action.estimatedDuration} min
                    </Badge>
                  )}
                  
                  {action.assignedTo && (
                    <Badge variant="outline" className="text-xs">
                      <User className="w-3 h-3 mr-1" />
                      {action.assignedTo}
                    </Badge>
                  )}
                </div>
                
                {/* Date de completion */}
                {isCompleted && (action.date || action.completedAt) && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                    <Calendar className="w-3 h-3" />
                    <span>Terminé le {formatDate(action.date || action.completedAt)}</span>
                  </div>
                )}
                
                {/* Tags */}
                {action.tags && action.tags.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {action.tags.map((tag, tagIndex) => (
                      <span 
                        key={tagIndex}
                        className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Menu d'actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0"
                    disabled={isUpdating}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onEditAction && (
                    <DropdownMenuItem onClick={() => onEditAction(originalIndex, action)}>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Modifier
                    </DropdownMenuItem>
                  )}
                  
                  {onDuplicateAction && (
                    <DropdownMenuItem onClick={() => onDuplicateAction(originalIndex)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Dupliquer
                    </DropdownMenuItem>
                  )}
                  
                  {onArchiveAction && (
                    <DropdownMenuItem onClick={() => onArchiveAction(originalIndex)}>
                      <Archive className="w-4 h-4 mr-2" />
                      Archiver
                    </DropdownMenuItem>
                  )}
                  
                  {onDeleteAction && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDeleteAction(originalIndex)}
                        className="text-red-600"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Barre de progression pour actions terminées */}
        {isCompleted && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-b-xl"></div>
        )}
      </div>
    );
  };

  // Interface vide
  if (actions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Actions de suivi</h3>
            {patientName && (
              <p className="text-sm text-gray-600">Patient: {patientName}</p>
            )}
          </div>
          {onAddAction && (
            <Button
              onClick={() => setShowAddForm(true)}
              disabled={isUpdating}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une action
            </Button>
          )}
        </div>

        {showAddForm && (
          <ActionForm
            isVisible={showAddForm}
            onAddAction={handleAddAction}
            onCancel={() => setShowAddForm(false)}
            disabled={isUpdating}
            placeholder="Titre de l'action..."
            title="Nouvelle action"
            submitText="Ajouter"
            mode="compact"
            showAdvanced={true}
          />
        )}

        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckSquare className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune action enregistrée</h3>
          <p className="text-gray-500">Les actions de suivi apparaîtront ici</p>
        </div>
      </div>
    );
  }

  // Interface principale
  return (
    <div className="space-y-6">
      
      {/* En-tête avec statistiques */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Actions de suivi</h3>
          {patientName && (
            <p className="text-sm text-gray-600">Patient: {patientName}</p>
          )}
          {showStats && (
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="outline" className="text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                {stats.completionRate}% complété
              </Badge>
              {stats.withIcnp > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Activity className="w-3 h-3 mr-1" />
                  {stats.withIcnp} avec ICNP
                </Badge>
              )}
              {stats.estimatedTime > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {Math.round(stats.estimatedTime / 60)}h estimées
                </Badge>
              )}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {allowBulkActions && selectedActions.size > 0 && (
            <Button variant="outline" size="sm" onClick={handleBulkComplete}>
              <CheckSquare className="w-4 h-4 mr-1" />
              Terminer sélectionnées ({selectedActions.size})
            </Button>
          )}
          
          {onExportActions && (
            <Button variant="outline" size="sm" onClick={onExportActions}>
              <FileText className="w-4 h-4 mr-1" />
              Exporter
            </Button>
          )}
          
          {onAddAction && !showAddForm && (
            <Button
              onClick={() => setShowAddForm(true)}
              disabled={isUpdating}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          )}
        </div>
      </div>

      {/* Formulaire d'ajout */}
      {showAddForm && (
        <ActionForm
          isVisible={showAddForm}
          onAddAction={handleAddAction}
          onCancel={() => setShowAddForm(false)}
          disabled={isUpdating}
          placeholder="Titre de l'action..."
          title="Nouvelle action"
          submitText="Ajouter"
          mode="compact"
          showAdvanced={true}
        />
      )}
      
      {/* Filtres */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtrer par :</span>
        </div>
        
        <div className="flex bg-gray-100/80 backdrop-blur-sm rounded-xl p-1 border border-gray-200/50 shadow-sm">
          <Button
            variant={filter === 'all' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('all')}
            disabled={isUpdating}
            className="rounded-lg"
          >
            Toutes
            <Badge variant="secondary" className="ml-2">
              {stats.total}
            </Badge>
          </Button>
          
          <Button
            variant={filter === 'todo' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('todo')}
            disabled={isUpdating}
            className="rounded-lg"
          >
            À faire
            <Badge variant="secondary" className="ml-2">
              {stats.pending}
            </Badge>
          </Button>
          
          <Button
            variant={filter === 'done' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilter('done')}
            disabled={isUpdating}
            className="rounded-lg"
          >
            Réalisées
            <Badge variant="secondary" className="ml-2">
              {stats.completed}
            </Badge>
          </Button>
        </div>
      </div>

      {/* Indicateur de mise à jour */}
      {isUpdating && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Mise à jour en cours...
          </AlertDescription>
        </Alert>
      )}

      {/* Liste des actions (groupée ou simple) */}
      {filteredActions.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune action correspondante</p>
        </div>
      ) : groupByCategory ? (
        <div className="space-y-6">
          {Object.entries(groupedActions).map(([category, categoryActions]) => (
            <div key={category} className="space-y-3">
              <Button
                variant="ghost"
                className="w-full justify-between p-3"
                onClick={() => toggleCategory(category)}
              >
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  <span className="font-medium">{category}</span>
                  <Badge variant="secondary">{categoryActions.length}</Badge>
                </div>
              </Button>
              
              {expandedCategories.has(category) && (
                <div className="space-y-3 pl-4">
                  {categoryActions.map((action, index) => {
                    const originalIndex = actions.findIndex(a => a === action);
                    return (
                      <ActionItem
                        key={action.id || originalIndex}
                        action={action}
                        index={index}
                        originalIndex={originalIndex}
                        compact={compactMode}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredActions.map((action, index) => {
            const originalIndex = actions.findIndex(a => a === action);
            return (
              <ActionItem
                key={action.id || originalIndex}
                action={action}
                index={index}
                originalIndex={originalIndex}
                compact={compactMode}
              />
            );
          })}
        </div>
      )}

      {/* Barre de progression globale */}
      {showProgress && stats.total > 0 && (
        <div className="p-4 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progression générale</span>
            <span className="text-sm font-semibold text-gray-900">
              {stats.completed} / {stats.total} actions terminées
            </span>
          </div>
          <Progress value={stats.completionRate} className="h-2 mb-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span className="font-medium">{stats.completionRate}%</span>
            <span>100%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientActions;
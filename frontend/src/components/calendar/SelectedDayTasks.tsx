import React, { useMemo, useState, useCallback } from 'react';
import { 
  CalendarDays, 
  Clock, 
  CheckCircle, 
  Users, 
  X, 
  Edit3,
  AlertTriangle,
  MapPin,
  FileText,
  ChevronDown,
  ChevronUp,
  Filter,
  MoreHorizontal,
  Activity,
  User
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Task, TaskFilter } from '@/types';

interface SelectedDayTasksProps {
  // Props legacy (rétrocompatibilité)
  selectedDate?: string | null;
  tasks?: any[];
  onToggleComplete?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  
  // Nouvelles props modernes
  modernTasks?: Task[];
  date?: string;
  onTaskComplete?: (taskId: string) => void;
  onTaskEdit?: (task: Task) => void;
  onTaskDelete?: (taskId: string) => void;
  onTaskAdd?: () => void;
  onNavigateToPatient?: (patientId: string) => void;
  
  // Options d'affichage
  showAddButton?: boolean;
  showPatientNavigation?: boolean;
  showProgress?: boolean;
  showFilters?: boolean;
  groupByType?: boolean;
  compactMode?: boolean;
  
  // Personnalisation
  title?: string;
  emptyMessage?: string;
  className?: string;
}

// Interface pour les statistiques du jour
interface DayStats {
  total: number;
  completed: number;
  pending: number;
  patient: number;
  manual: number;
  overdue: number;
  completionRate: number;
}

// Interface pour une tâche groupée
interface GroupedTasks {
  patient: Task[];
  manual: Task[];
  overdue: Task[];
}

const SelectedDayTasks: React.FC<SelectedDayTasksProps> = ({ 
  // Props legacy
  selectedDate,
  tasks = [],
  onToggleComplete,
  onDelete,
  
  // Nouvelles props
  modernTasks,
  date,
  onTaskComplete,
  onTaskEdit,
  onTaskDelete,
  onTaskAdd,
  onNavigateToPatient,
  
  // Options
  showAddButton = true,
  showPatientNavigation = true,
  showProgress = true,
  showFilters = false,
  groupByType = false,
  compactMode = false,
  
  // Personnalisation
  title,
  emptyMessage = "Aucune intervention prévue pour cette date",
  className = ""
}) => {
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    patient: true,
    manual: true,
    overdue: true
  });

  // Détermine les données à utiliser (moderne ou legacy)
  const displayDate = date || selectedDate;
  const displayTasks = modernTasks || tasks;

  // Ne rien afficher si pas de date sélectionnée
  if (!displayDate) return null;

  // Formatage de la date
  const formattedDate = useMemo(() => {
    try {
      const dateObj = new Date(displayDate + (displayDate.includes('T') ? '' : 'T12:00:00'));
      return dateObj.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return displayDate;
    }
  }, [displayDate]);

  // Calcul des statistiques
  const stats = useMemo((): DayStats => {
    const now = new Date();
    const selectedDateObj = new Date(displayDate);
    
    const total = displayTasks.length;
    const completed = displayTasks.filter(task => task.completed).length;
    const pending = total - completed;
    const patient = displayTasks.filter(task => 
      modernTasks ? task.patientId : task.source === 'patient'
    ).length;
    const manual = total - patient;
    
    // Tâches en retard (date passée et non terminées)
    const overdue = displayTasks.filter(task => {
      if (task.completed) return false;
      const taskDate = new Date(task.date || displayDate);
      return taskDate < now && taskDate.toDateString() !== now.toDateString();
    }).length;
    
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      total,
      completed,
      pending,
      patient,
      manual,
      overdue,
      completionRate
    };
  }, [displayTasks, displayDate, modernTasks]);

  // Filtrage des tâches
  const filteredTasks = useMemo(() => {
    return displayTasks.filter(task => {
      switch (filter) {
        case 'completed':
          return task.completed;
        case 'pending':
          return !task.completed;
        default:
          return true;
      }
    });
  }, [displayTasks, filter]);

  // Groupement des tâches par type
  const groupedTasks = useMemo((): GroupedTasks => {
    const now = new Date();
    
    const overdue = filteredTasks.filter(task => {
      if (task.completed) return false;
      const taskDate = new Date(task.date || displayDate);
      return taskDate < now && taskDate.toDateString() !== now.toDateString();
    });
    
    const patient = filteredTasks.filter(task => 
      (modernTasks ? task.patientId : task.source === 'patient') && !overdue.includes(task)
    );
    
    const manual = filteredTasks.filter(task => 
      !(modernTasks ? task.patientId : task.source === 'patient') && !overdue.includes(task)
    );
    
    return { patient, manual, overdue };
  }, [filteredTasks, displayDate, modernTasks]);

  // Gestion des actions
  const handleToggleComplete = useCallback((taskId: string) => {
    if (onTaskComplete) {
      onTaskComplete(taskId);
    } else if (onToggleComplete) {
      onToggleComplete(taskId);
    }
  }, [onTaskComplete, onToggleComplete]);

  const handleDelete = useCallback((taskId: string) => {
    if (onTaskDelete) {
      onTaskDelete(taskId);
    } else if (onDelete) {
      onDelete(taskId);
    }
  }, [onTaskDelete, onDelete]);

  const toggleGroup = useCallback((group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  }, []);

  // Composant pour une tâche individuelle
  const TaskItem: React.FC<{ task: Task | any; isModern?: boolean }> = ({ task, isModern = false }) => {
    const isCompleted = task.completed;
    const isPatient = isModern ? !!task.patientId : task.source === 'patient';
    const isOverdue = !isCompleted && new Date(task.date || displayDate) < new Date();
    
    let bgColor = 'bg-blue-50/50 border-blue-200 text-blue-800';
    let iconBg = 'bg-blue-500';
    let icon = <Clock className="w-4 h-4 text-white" />;
    
    if (isCompleted) {
      bgColor = 'bg-green-50/50 border-green-200 text-green-800';
      iconBg = 'bg-green-500';
      icon = <CheckCircle className="w-4 h-4 text-white" />;
    } else if (isOverdue) {
      bgColor = 'bg-red-50/50 border-red-200 text-red-800';
      iconBg = 'bg-red-500';
      icon = <AlertTriangle className="w-4 h-4 text-white" />;
    } else if (isPatient) {
      bgColor = 'bg-teal-50/50 border-teal-200 text-teal-800';
      iconBg = 'bg-teal-500';
      icon = <Users className="w-4 h-4 text-white" />;
    }

    return (
      <div className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-sm ${bgColor}`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`p-1 rounded-full ${iconBg} flex-shrink-0`}>
            {icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-medium ${isCompleted ? "line-through opacity-75" : ""}`}>
                {isModern ? (task.icnp?.term?.fr || 'Intervention') : task.title}
              </span>
              
              {isModern && task.icnp?.id && (
                <Badge variant="outline" className="text-xs">
                  {task.icnp.id}
                </Badge>
              )}
              
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  En retard
                </Badge>
              )}
            </div>
            
            {/* Informations supplémentaires */}
            <div className="text-xs text-gray-600 space-y-1">
              {isPatient && (task.patientName || task.patientId) && (
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>Patient: {task.patientName || `ID: ${task.patientId}`}</span>
                  {showPatientNavigation && onNavigateToPatient && task.patientId && (
                    <button
                      onClick={() => onNavigateToPatient(task.patientId)}
                      className="text-blue-600 hover:text-blue-800 ml-1"
                    >
                      <MapPin className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
              
              {isModern && task.notes && (
                <div className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  <span className="truncate">{task.notes}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Actions rapides */}
          <Button
            size="sm"
            variant={isCompleted ? "outline" : "default"}
            onClick={() => handleToggleComplete(task._id || task.id)}
            className={`text-xs ${
              isCompleted
                ? "border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isCompleted ? "Annuler" : "Terminé"}
          </Button>

          {/* Menu d'actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onTaskEdit && (
                <DropdownMenuItem onClick={() => onTaskEdit(task)}>
                  <Edit3 className="w-4 h-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
              )}
              
              {(!isPatient || (isPatient && task.source !== 'patient')) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleDelete(task._id || task.id)}
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
    );
  };

  // Composant pour un groupe de tâches
  const TaskGroup: React.FC<{ 
    title: string; 
    tasks: Task[]; 
    icon: React.ReactNode; 
    groupKey: string;
    color: string;
  }> = ({ title, tasks, icon, groupKey, color }) => {
    if (tasks.length === 0) return null;

    return (
      <Collapsible 
        open={expandedGroups[groupKey]} 
        onOpenChange={() => toggleGroup(groupKey)}
      >
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full justify-between p-3 mb-2">
            <div className="flex items-center gap-2">
              <div className={`p-1 rounded ${color}`}>
                {icon}
              </div>
              <span className="font-medium">{title}</span>
              <Badge variant="secondary">{tasks.length}</Badge>
            </div>
            {expandedGroups[groupKey] ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3">
          {tasks.map((task) => (
            <TaskItem 
              key={task._id || task.id} 
              task={task} 
              isModern={!!modernTasks}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <Card className={`mt-8 bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl ${className}`}>
      <CardContent className="p-6">
        {/* En-tête */}
        <Collapsible open={!isCollapsed} onOpenChange={setIsCollapsed}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <CalendarDays className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {title || `Interventions du ${formattedDate}`}
                </h2>
                <p className="text-sm text-gray-600">
                  {stats.total} intervention(s) • {stats.completed} terminée(s)
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {showAddButton && onTaskAdd && (
                <Button variant="outline" size="sm" onClick={onTaskAdd}>
                  <Activity className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
              )}
              
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          <CollapsibleContent>
            {/* Statistiques et progression */}
            {showProgress && stats.total > 0 && (
              <div className="mb-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">
                      {stats.total} total
                    </Badge>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {stats.completed} terminées
                    </Badge>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      {stats.pending} en attente
                    </Badge>
                    {stats.overdue > 0 && (
                      <Badge variant="destructive">
                        {stats.overdue} en retard
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm font-medium text-indigo-700">
                    {stats.completionRate}% complété
                  </span>
                </div>
                <Progress value={stats.completionRate} className="h-2" />
              </div>
            )}

            {/* Filtres rapides */}
            {showFilters && (
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-4 h-4 text-gray-500" />
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  Toutes ({stats.total})
                </Button>
                <Button
                  variant={filter === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('pending')}
                >
                  En attente ({stats.pending})
                </Button>
                <Button
                  variant={filter === 'completed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('completed')}
                >
                  Terminées ({stats.completed})
                </Button>
              </div>
            )}

            {/* Contenu principal */}
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 italic">{emptyMessage}</p>
                {showAddButton && onTaskAdd && (
                  <Button variant="outline" className="mt-3" onClick={onTaskAdd}>
                    <Activity className="w-4 h-4 mr-2" />
                    Ajouter une intervention
                  </Button>
                )}
              </div>
            ) : groupByType ? (
              // Affichage groupé
              <div className="space-y-4">
                {stats.overdue > 0 && (
                  <TaskGroup
                    title="En retard"
                    tasks={groupedTasks.overdue}
                    icon={<AlertTriangle className="w-4 h-4 text-white" />}
                    groupKey="overdue"
                    color="bg-red-500"
                  />
                )}
                
                <TaskGroup
                  title="Interventions patients"
                  tasks={groupedTasks.patient}
                  icon={<Users className="w-4 h-4 text-white" />}
                  groupKey="patient"
                  color="bg-teal-500"
                />
                
                <TaskGroup
                  title="Tâches manuelles"
                  tasks={groupedTasks.manual}
                  icon={<Activity className="w-4 h-4 text-white" />}
                  groupKey="manual"
                  color="bg-blue-500"
                />
              </div>
            ) : (
              // Affichage liste simple
              <div className="space-y-3">
                {filteredTasks.map((task) => (
                  <TaskItem 
                    key={task._id || task.id} 
                    task={task} 
                    isModern={!!modernTasks}
                  />
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default SelectedDayTasks;
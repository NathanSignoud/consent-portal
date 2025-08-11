import React, { useMemo, useCallback, useState } from 'react';
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin, { DateClickArg, EventClickArg } from "@fullcalendar/interaction";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  CalendarDays as CalendarIcon, 
  Clock, 
  Eye,
  Filter,
  Download,
  Settings,
  ChevronDown,
  Users,
  Activity,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { CalendarView, Task, TaskSummary } from '@/types';

interface MainCalendarProps {
  // Props legacy (rétrocompatibilité)
  currentView?: CalendarView;
  onViewChange?: (view: CalendarView) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  calendarRef?: React.RefObject<FullCalendar>;
  events?: any[];
  onDateClick?: (arg: DateClickArg) => void;
  
  // Nouvelles props modernes
  tasks?: Task[];
  summary?: TaskSummary;
  selectedDate?: string;
  onTaskClick?: (task: Task) => void;
  onTaskComplete?: (taskId: string) => void;
  onTaskEdit?: (task: Task) => void;
  onExportCalendar?: () => void;
  
  // Personnalisation
  showToolbar?: boolean;
  showStats?: boolean;
  showLegend?: boolean;
  enableEventDetails?: boolean;
  compactMode?: boolean;
  className?: string;
  
  // Filtres visuels
  showCompletedTasks?: boolean;
  showPatientTasks?: boolean;
  showManualTasks?: boolean;
}

// Interface pour un événement FullCalendar enrichi
interface EnrichedEvent {
  id: string;
  title: string;
  date: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  classNames: string[];
  extendedProps: {
    task: Task;
    isCompleted: boolean;
    isPatient: boolean;
    icnpCode?: string;
    patientName?: string;
    priority?: 'high' | 'normal' | 'low';
  };
}

const MainCalendar: React.FC<MainCalendarProps> = ({ 
  // Props legacy
  currentView = "dayGridMonth",
  onViewChange,
  onRefresh,
  isLoading = false,
  calendarRef,
  events = [],
  onDateClick,
  
  // Nouvelles props
  tasks = [],
  summary,
  selectedDate,
  onTaskClick,
  onTaskComplete,
  onTaskEdit,
  onExportCalendar,
  
  // Options
  showToolbar = true,
  showStats = true,
  showLegend = true,
  enableEventDetails = true,
  compactMode = false,
  className = "",
  
  // Filtres
  showCompletedTasks = true,
  showPatientTasks = true,
  showManualTasks = true
}) => {
  const [view, setView] = useState<CalendarView>(currentView);
  const [showEventPopover, setShowEventPopover] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Conversion des tâches en événements FullCalendar
  const calendarEvents = useMemo((): EnrichedEvent[] => {
    const dataSource = tasks.length > 0 ? tasks : events;
    
    return dataSource
      .filter(item => {
        // Filtrage selon les options d'affichage
        if (tasks.length > 0) {
          // Mode moderne avec Task[]
          const task = item as Task;
          if (!showCompletedTasks && task.completed) return false;
          if (!showPatientTasks && task.patientId) return false;
          if (!showManualTasks && !task.patientId) return false;
          return true;
        } else {
          // Mode legacy avec events[]
          if (!showCompletedTasks && item.completed) return false;
          if (!showPatientTasks && item.source === 'patient') return false;
          if (!showManualTasks && item.source === 'manual') return false;
          return true;
        }
      })
      .map(item => {
        if (tasks.length > 0) {
          // Mode moderne : conversion Task -> Event
          const task = item as Task;
          
          const isCompleted = task.completed;
          const isPatient = !!task.patientId;
          const isOverdue = new Date(task.date) < new Date() && !isCompleted;
          
          let backgroundColor = '#3b82f6'; // Bleu par défaut
          let borderColor = '#2563eb';
          
          if (isCompleted) {
            backgroundColor = '#10b981'; // Vert
            borderColor = '#059669';
          } else if (isOverdue) {
            backgroundColor = '#dc2626'; // Rouge
            borderColor = '#b91c1c';
          } else if (isPatient) {
            backgroundColor = '#0d9488'; // Teal
            borderColor = '#0f766e';
          }
          
          const classNames = [
            isPatient ? 'patient-event' : 'manual-event',
            isCompleted ? 'completed-event' : 'pending-event'
          ];
          
          if (isOverdue) classNames.push('overdue-event');
          
          return {
            id: task._id || `task-${Date.now()}`,
            title: task.icnp?.term?.fr || 'Intervention',
            date: task.date,
            backgroundColor,
            borderColor,
            textColor: '#ffffff',
            classNames,
            extendedProps: {
              task,
              isCompleted,
              isPatient,
              icnpCode: task.icnp?.id,
              patientName: task.patientName,
              priority: 'normal' // À adapter selon vos données
            }
          };
        } else {
          // Mode legacy : utiliser les events tels quels
          return {
            id: item._id || item.id,
            title: item.title,
            date: item.date,
            backgroundColor: item.backgroundColor || (item.completed ? '#10b981' : '#3b82f6'),
            borderColor: item.borderColor || (item.completed ? '#059669' : '#2563eb'),
            textColor: '#ffffff',
            classNames: [
              item.source === 'patient' ? 'patient-event' : 'manual-event',
              item.completed ? 'completed-event' : 'pending-event'
            ],
            extendedProps: {
              task: item,
              isCompleted: item.completed,
              isPatient: item.source === 'patient',
              patientName: item.patientName
            }
          };
        }
      });
  }, [tasks, events, showCompletedTasks, showPatientTasks, showManualTasks]);

  // Gestion du changement de vue
  const handleViewChange = useCallback((newView: CalendarView) => {
    setView(newView);
    onViewChange?.(newView);
  }, [onViewChange]);

  // Gestion du clic sur un événement
  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    const task = clickInfo.event.extendedProps.task;
    
    if (enableEventDetails) {
      setSelectedTask(task);
      setShowEventPopover(true);
    }
    
    onTaskClick?.(task);
  }, [enableEventDetails, onTaskClick]);

  // Personnalisation des événements au montage
  const handleEventDidMount = useCallback((info: any) => {
    const extendedProps = info.event.extendedProps;
    
    // Ajouter un tooltip informatif
    let tooltip = info.event.title;
    
    if (extendedProps.icnpCode) {
      tooltip += `\nCode ICNP: ${extendedProps.icnpCode}`;
    }
    
    if (extendedProps.patientName) {
      tooltip += `\nPatient: ${extendedProps.patientName}`;
    }
    
    if (extendedProps.task?.notes) {
      tooltip += `\nNotes: ${extendedProps.task.notes}`;
    }
    
    info.el.title = tooltip;
    
    // Ajouter des classes CSS pour le style
    if (extendedProps.isCompleted) {
      info.el.style.opacity = '0.8';
    }
    
    // Badge pour code ICNP
    if (extendedProps.icnpCode && view === 'dayGridMonth') {
      const badge = document.createElement('span');
      badge.className = 'icnp-code';
      badge.textContent = extendedProps.icnpCode;
      info.el.appendChild(badge);
    }
  }, [view]);

  // Statistiques pour l'affichage
  const displayStats = useMemo(() => {
    if (summary) {
      return {
        total: summary.total,
        completed: summary.completed,
        pending: summary.pending,
        completionRate: summary.total > 0 ? Math.round((summary.completed / summary.total) * 100) : 0
      };
    }
    
    // Calcul depuis les événements
    const total = calendarEvents.length;
    const completed = calendarEvents.filter(e => e.extendedProps.isCompleted).length;
    
    return {
      total,
      completed,
      pending: total - completed,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [summary, calendarEvents]);

  return (
    <Card className={`bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl overflow-hidden ${className}`}>
      <CardContent className="p-6">
        {/* En-tête avec toolbar */}
        {showToolbar && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Calendrier des Interventions
              </h2>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Sélecteur de vue */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleViewChange("dayGridMonth")}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    view === "dayGridMonth"
                      ? "bg-blue-500 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Mois
                </button>
                <button
                  onClick={() => handleViewChange("timeGridWeek")}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    view === "timeGridWeek"
                      ? "bg-blue-500 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Semaine
                </button>
                <button
                  onClick={() => handleViewChange("timeGridDay")}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    view === "timeGridDay"
                      ? "bg-blue-500 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Jour
                </button>
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-1" />
                    Actions
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onRefresh} disabled={isLoading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                    Actualiser
                  </DropdownMenuItem>
                  {onExportCalendar && (
                    <DropdownMenuItem onClick={onExportCalendar}>
                      <Download className="w-4 h-4 mr-2" />
                      Exporter PDF
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Eye className="w-4 h-4 mr-2" />
                    Paramètres d'affichage
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {/* Statistiques rapides */}
        {showStats && displayStats.total > 0 && (
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <Activity className="w-3 h-3 mr-1" />
                  {displayStats.total} interventions
                </Badge>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {displayStats.completed} terminées
                </Badge>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                  <Clock className="w-3 h-3 mr-1" />
                  {displayStats.pending} en attente
                </Badge>
              </div>
              <div className="text-sm text-blue-700 font-medium">
                {displayStats.completionRate}% complété
              </div>
            </div>
            <Progress value={displayStats.completionRate} className="h-2" />
          </div>
        )}

        {/* Légende */}
        {showLegend && (
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-gray-600">Légende :</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-teal-500"></div>
              <span>Patients</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span>Manuelles</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span>Terminées</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span>En retard</span>
            </div>
          </div>
        )}

        {/* Calendrier principal */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <p className="text-gray-600">Chargement des interventions...</p>
          </div>
        ) : (
          <div className="calendar-container">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              initialView={view}
              events={calendarEvents}
              height="auto"
              locale="fr"
              dateClick={onDateClick}
              eventClick={handleEventClick}
              eventDidMount={handleEventDidMount}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: "",
              }}
              dayMaxEvents={view === "dayGridMonth" ? 3 : false}
              moreLinkText="plus"
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              slotDuration="01:00:00"
              nowIndicator={true}
              weekends={true}
              editable={false}
              selectable={true}
              selectMirror={true}
              dayHeaderFormat={{ weekday: 'short', day: 'numeric' }}
              businessHours={{
                daysOfWeek: [1, 2, 3, 4, 5],
                startTime: '08:00',
                endTime: '17:00',
              }}
            />
          </div>
        )}

        {/* Popover de détails d'événement */}
        {enableEventDetails && selectedTask && (
          <Popover open={showEventPopover} onOpenChange={setShowEventPopover}>
            <PopoverTrigger asChild>
              <div style={{ display: 'none' }} />
            </PopoverTrigger>
            <PopoverContent className="w-80" align="center">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold text-gray-900">
                    {selectedTask.icnp?.term?.fr || 'Intervention'}
                  </h4>
                  <Badge variant={selectedTask.completed ? "success" : "secondary"}>
                    {selectedTask.completed ? 'Terminée' : 'En attente'}
                  </Badge>
                </div>
                
                {selectedTask.icnp?.id && (
                  <div className="text-sm">
                    <span className="font-medium">Code ICNP:</span> {selectedTask.icnp.id}
                  </div>
                )}
                
                {selectedTask.patientName && (
                  <div className="text-sm">
                    <span className="font-medium">Patient:</span> {selectedTask.patientName}
                  </div>
                )}
                
                <div className="text-sm">
                  <span className="font-medium">Date:</span> {new Date(selectedTask.date).toLocaleDateString('fr-FR')}
                </div>
                
                {selectedTask.notes && (
                  <div className="text-sm">
                    <span className="font-medium">Notes:</span>
                    <p className="mt-1 text-gray-600">{selectedTask.notes}</p>
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  {!selectedTask.completed && onTaskComplete && (
                    <Button size="sm" onClick={() => onTaskComplete(selectedTask._id!)}>
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Marquer terminée
                    </Button>
                  )}
                  {onTaskEdit && (
                    <Button variant="outline" size="sm" onClick={() => onTaskEdit(selectedTask)}>
                      Modifier
                    </Button>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </CardContent>
    </Card>
  );
};

export default MainCalendar;
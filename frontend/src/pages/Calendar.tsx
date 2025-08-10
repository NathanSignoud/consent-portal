import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar, Plus, CheckCircle, X, Clock, RefreshCw, AlertCircle, Star, Filter, User, Users } from "lucide-react";

type CalendarTask = {
  _id?: string;
  title: string;
  date: string;
  completed: boolean;
  source?: 'manual' | 'patient';
  patientId?: string;
  patientName?: string;
  actionId?: string;
};

type PatientAction = {
  _id?: string;
  label: string;
  status: string;
  date: string | null;
};

type Patient = {
  _id: string;
  nom: string;
  actions: PatientAction[];
};

type Props = {
  currentUser: {
    _id: string;
    email: string;
    role: string;
  };
};

const CalendarPage = ({ currentUser }: Props) => {
  const userId = currentUser._id;
  const calendarRef = useRef<FullCalendar>(null);

  const [events, setEvents] = useState<CalendarTask[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [sourceFilterState, setSourceFilterState] = useState<'all' | 'manual' | 'patient'>('all');
  const [currentView, setCurrentView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('dayGridMonth');

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await axios.get(`/api/calendar/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setEvents(res.data);
      setError("");
    } catch (err) {
      console.error("Erreur lors du chargement des tâches :", err);
      setError("Impossible de charger les tâches");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await axios.get(`/api/patient2`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setPatients(res.data);
      
      // Convertir les actions des patients en événements de calendrier
      const patientEvents: CalendarTask[] = [];
      
      res.data.forEach((patient: Patient) => {
        patient.actions.forEach((action: PatientAction, index: number) => {
          if (action.date) {
            patientEvents.push({
              _id: `patient-${patient._id}-${index}`,
              title: action.label,
              date: action.date,
              completed: action.status === 'réalisé',
              source: 'patient',
              patientId: patient._id,
              patientName: patient.nom,
              actionId: action._id || index.toString()
            });
          }
        });
      });
      
      // Fusionner avec les tâches manuelles existantes
      setEvents(prevEvents => {
        // Garder seulement les tâches manuelles
        const manualEvents = prevEvents.filter(event => event.source === 'manual' || !event.source);
        // Ajouter les nouvelles tâches des patients
        return [...manualEvents, ...patientEvents];
      });
      
    } catch (err) {
      console.error("Erreur lors du chargement des patients :", err);
      setError("Impossible de charger les actions des patients");
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchPatients();
  }, [userId]);

  const handleAdd = async () => {
    if (!newTitle || !newDate) return;
    try {
      const token = localStorage.getItem("token") || "";
      const res = await axios.post(`/api/calendar/${userId}`, {
        title: newTitle,
        date: newDate,
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Mettre à jour seulement les tâches manuelles
      setEvents(prevEvents => {
        const patientEvents = prevEvents.filter(event => event.source === 'patient');
        const newManualEvents = res.data.map((task: any) => ({
          ...task,
          source: 'manual'
        }));
        return [...newManualEvents, ...patientEvents];
      });
      
      setNewTitle("");
      setNewDate("");
    } catch (err) {
      console.error("Erreur lors de l'ajout :", err);
      setError("Erreur lors de l'ajout de la tâche");
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await axios.delete(`/api/calendar/${userId}/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Mettre à jour seulement les tâches manuelles
      setEvents(prevEvents => {
        const patientEvents = prevEvents.filter(event => event.source === 'patient');
        const newManualEvents = res.data.map((task: any) => ({
          ...task,
          source: 'manual'
        }));
        return [...newManualEvents, ...patientEvents];
      });
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
      setError("Erreur lors de la suppression");
    }
  };

  const handleToggleComplete = async (taskId: string) => {
    const task = events.find(e => e._id === taskId);
    
    if (task?.source === 'patient') {
      // Pour les tâches des patients, mettre à jour via l'API patient
      try {
        const token = localStorage.getItem("token") || "";
        const patient = patients.find(p => p._id === task.patientId);
        if (patient) {
          const updatedActions = patient.actions.map((action, index) => 
            (action._id === task.actionId || index.toString() === task.actionId)
              ? { ...action, status: action.status === 'réalisé' ? 'à faire' : 'réalisé' }
              : action
          );
          
          await axios.put(`/api/patient2/${task.patientId}`, {
            actions: updatedActions,
            consents: patient.consents || []
          }, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          // Recharger les données des patients
          fetchPatients();
        }
      } catch (err) {
        console.error("Erreur lors du changement de statut patient :", err);
        setError("Erreur lors du changement de statut");
      }
    } else {
      // Pour les tâches manuelles, utiliser l'API du calendrier
      try {
        const token = localStorage.getItem("token") || "";
        const res = await axios.patch(`/api/calendar/${userId}/${taskId}`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        setEvents(prevEvents => {
          const patientEvents = prevEvents.filter(event => event.source === 'patient');
          const newManualEvents = res.data.map((task: any) => ({
            ...task,
            source: 'manual'
          }));
          return [...newManualEvents, ...patientEvents];
        });
      } catch (err) {
        console.error("Erreur lors du changement de statut :", err);
        setError("Erreur lors du changement de statut");
      }
    }
  };

  const handleDateClick = (arg: DateClickArg) => {
    const clickedDate = arg.dateStr;
    setSelectedDate(clickedDate);
    setNewDate(clickedDate);
    
    console.log("Date cliquée:", clickedDate);
    console.log("Tous les événements:", events);
    console.log("Événements filtrés pour cette date:", events.filter(e => e.date === clickedDate));
  };

  const handleRefresh = () => {
    fetchEvents();
    fetchPatients();
  };

  // Filtrage des événements
  const filteredEvents = events.filter(event => {
    // Filtre par statut
    if (filter === 'completed' && !event.completed) return false;
    if (filter === 'pending' && event.completed) return false;
    
    // Filtre par source
    if (sourceFilterState === 'manual' && event.source === 'patient') return false;
    if (sourceFilterState === 'patient' && event.source !== 'patient') return false;
    
    return true;
  });

  const totalTasks = events.length;
  const completedTasks = events.filter(task => task.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const manualTasks = events.filter(task => task.source !== 'patient').length;
  const patientTasks = events.filter(task => task.source === 'patient').length;

  // Fonction pour changer de vue - approche simplifiée
  const handleViewChange = (newView: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay') => {
    setCurrentView(newView);
  };

  // Effect pour forcer la mise à jour du calendrier lors du changement de vue
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(currentView);
    }
  }, [currentView]);

  // Fonction pour obtenir le titre selon la vue
  const getEventTitle = (event: CalendarTask) => {
    if (currentView === 'dayGridMonth') {
      // Vue mensuelle : juste le nom du patient pour les actions patients
      return event.source === 'patient' ? event.patientName || 'Patient' : event.title;
    } else {
      // Vues jour/semaine : détail complet
      return event.source === 'patient' 
        ? `${event.title} - ${event.patientName}` 
        : event.title;
    }
  };

  // Fonction pour formater les événements selon la vue
  const formatEventsForCalendar = () => {
    return filteredEvents.map(event => {
      const baseEvent = {
        id: event._id,
        title: getEventTitle(event),
        backgroundColor: event.source === 'patient' 
          ? (event.completed ? '#059669' : '#0d9488') 
          : (event.completed ? '#10b981' : '#3b82f6'),
        borderColor: event.source === 'patient' 
          ? (event.completed ? '#047857' : '#0f766e') 
          : (event.completed ? '#059669' : '#2563eb'),
        textColor: '#ffffff',
        classNames: event.source === 'patient' ? ['patient-event'] : ['manual-event'],
        extendedProps: {
          source: event.source,
          patientName: event.patientName,
          actionLabel: event.title,
          completed: event.completed
        }
      };

      // Configuration selon la vue
      if (currentView === 'dayGridMonth') {
        return {
          ...baseEvent,
          date: event.date,
          allDay: true
        };
      } else {
        // Pour les vues temporelles, ajouter une heure par défaut
        return {
          ...baseEvent,
          start: `${event.date}T09:00:00`,
          end: `${event.date}T10:00:00`,
          allDay: false
        };
      }
    });
  };

  const selectedDateTasks = events.filter((e) => {
    // Normaliser les dates pour la comparaison
    const eventDate = new Date(e.date).toISOString().split('T')[0];
    const selectedDateNormalized = selectedDate ? new Date(selectedDate).toISOString().split('T')[0] : null;
    return eventDate === selectedDateNormalized;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 relative overflow-hidden">
      
      {/* Éléments décoratifs de fond */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-200/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-purple-200/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <Calendar className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Planning des Tâches
              </h1>
              <p className="text-gray-600 mt-1">Organisez votre planning de soins et actions patients</p>
            </div>
          </div>

          {/* Statistiques améliorées */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Star className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total tâches</p>
                  <p className="text-2xl font-bold text-gray-900">{totalTasks}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Terminées</p>
                  <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">En attente</p>
                  <p className="text-2xl font-bold text-orange-600">{pendingTasks}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <User className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Manuelles</p>
                  <p className="text-2xl font-bold text-purple-600">{manualTasks}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Users className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Patients</p>
                  <p className="text-2xl font-bold text-teal-600">{patientTasks}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Calendrier principal */}
          <div className="xl:col-span-2">
            <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Calendrier</h2>
                  <div className="flex items-center gap-3">
                    {/* Sélecteur de vue */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => handleViewChange('dayGridMonth')}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          currentView === 'dayGridMonth' 
                            ? 'bg-blue-500 text-white' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Mois
                      </button>
                      <button
                        onClick={() => handleViewChange('timeGridWeek')}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          currentView === 'timeGridWeek' 
                            ? 'bg-blue-500 text-white' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Semaine
                      </button>
                      <button
                        onClick={() => handleViewChange('timeGridDay')}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          currentView === 'timeGridDay' 
                            ? 'bg-blue-500 text-white' 
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Jour
                      </button>
                    </div>
                    
                    <button
                      onClick={handleRefresh}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      disabled={isLoading}
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                      Actualiser
                    </button>
                  </div>
                </div>
                
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                ) : (
                  <div className="calendar-container">
                    <FullCalendar
                      ref={calendarRef}
                      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                      initialView={currentView}
                      events={formatEventsForCalendar()}
                      height="auto"
                      locale="fr"
                      dateClick={handleDateClick}
                      headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: ''
                      }}
                      dayMaxEvents={currentView === 'dayGridMonth' ? 3 : false}
                      moreLinkText="plus"
                      slotMinTime="06:00:00"
                      slotMaxTime="22:00:00"
                      slotDuration="01:00:00"
                      eventDidMount={(info) => {
                        // Améliorer l'affichage des événements
                        if (info.event.extendedProps.source === 'patient') {
                          info.el.style.fontWeight = '500';
                          if (currentView === 'dayGridMonth') {
                            info.el.title = `Patient: ${info.event.extendedProps.patientName} - ${info.event.extendedProps.actionLabel}`;
                          } else {
                            info.el.title = `Action patient: ${info.event.extendedProps.actionLabel}`;
                          }
                        }
                      }}
                      viewDidMount={() => {
                        // Callback quand la vue est montée/changée
                        console.log(`Vue changée vers: ${currentView}`);
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Panneau latéral */}
          <div className="space-y-6">
            
            {/* Formulaire d'ajout */}
            <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Plus className="w-5 h-5 text-green-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Ajouter une tâche manuelle</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                      Titre de la tâche
                    </Label>
                    <Input
                      id="title"
                      type="text"
                      placeholder="Ex : Réunion équipe"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="date" className="text-sm font-medium text-gray-700">
                      Date prévue
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>
                  
                  <Button 
                    onClick={handleAdd} 
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg shadow-lg"
                    disabled={!newTitle || !newDate}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter la tâche
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Filtres améliorés */}
            <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Filter className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
                </div>
                
                <div className="space-y-4">
                  {/* Filtre par statut */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Par statut</p>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          filter === 'all' 
                            ? 'bg-blue-500 text-white shadow-md' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Toutes ({totalTasks})
                      </button>
                      <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          filter === 'pending' 
                            ? 'bg-orange-500 text-white shadow-md' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        En attente ({pendingTasks})
                      </button>
                      <button
                        onClick={() => setFilter('completed')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          filter === 'completed' 
                            ? 'bg-green-500 text-white shadow-md' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Terminées ({completedTasks})
                      </button>
                    </div>
                  </div>

                  {/* Filtre par source */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Par source</p>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setSourceFilterState('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          sourceFilterState === 'all' 
                            ? 'bg-indigo-500 text-white shadow-md' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Toutes sources ({totalTasks})
                      </button>
                      <button
                        onClick={() => setSourceFilterState('manual')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          sourceFilterState === 'manual' 
                            ? 'bg-purple-500 text-white shadow-md' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Manuelles ({manualTasks})
                      </button>
                      <button
                        onClick={() => setSourceFilterState('patient')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          sourceFilterState === 'patient' 
                            ? 'bg-teal-500 text-white shadow-md' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Patients ({patientTasks})
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tâches du jour sélectionné */}
        {selectedDate && (
          <Card className="mt-8 bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl">
            <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Tâches du {selectedDate ? new Date(selectedDate + 'T12:00:00').toLocaleDateString("fr-FR") : ''}
                  </h2>
                  <p className="text-sm text-gray-600">{selectedDateTasks.length} tâche(s) prévue(s)</p>
                </div>
              </div>
              
              {selectedDateTasks.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 italic">Aucune tâche prévue pour cette date</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateTasks.map((task) => (
                    <div
                      key={task._id}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        task.completed
                          ? 'bg-green-50/50 border-green-200 text-green-800'
                          : task.source === 'patient'
                          ? 'bg-teal-50/50 border-teal-200 text-teal-800'
                          : 'bg-blue-50/50 border-blue-200 text-blue-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1 rounded-full ${
                          task.completed ? 'bg-green-500' : 
                          task.source === 'patient' ? 'bg-teal-500' : 'bg-blue-500'
                        }`}>
                          {task.completed ? (
                            <CheckCircle className="w-4 h-4 text-white" />
                          ) : task.source === 'patient' ? (
                            <Users className="w-4 h-4 text-white" />
                          ) : (
                            <Clock className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div>
                          <span className={`font-medium ${task.completed ? "line-through opacity-75" : ""}`}>
                            {task.source === 'patient' ? task.title : task.title}
                          </span>
                          {task.source === 'patient' && (
                            <p className="text-xs text-gray-500 mt-1">
                              Patient: {task.patientName} • Action patient
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleComplete(task._id!)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            task.completed
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {task.completed ? "Annuler" : "Effectué"}
                        </button>
                        {task.source !== 'patient' && (
                          <button
                            onClick={() => handleDelete(task._id!)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .calendar-container .fc-toolbar-title {
            font-size: 1.5rem !important;
            font-weight: 600 !important;
            color: #1f2937 !important;
          }
          
          .calendar-container .fc-button {
            background: #3b82f6 !important;
            border: none !important;
            border-radius: 8px !important;
            padding: 0.5rem 1rem !important;
          }
          
          .calendar-container .fc-button:hover {
            background: #2563eb !important;
          }
          
          .calendar-container .fc-daygrid-day:hover {
            background: #f8fafc !important;
          }
          
          .calendar-container .fc-day-today {
            background: #dbeafe !important;
          }

          .patient-event {
            border-left: 4px solid #0f766e !important;
            font-weight: 500 !important;
          }

          .manual-event {
            border-left: 4px solid #2563eb !important;
          }

          .fc-event-title {
            font-size: 0.75rem !important;
            line-height: 1.2 !important;
          }

          .fc-timegrid-event {
            font-size: 0.8rem !important;
          }

          .fc-timegrid-event-harness {
            margin: 1px 0 !important;
          }

          .fc-col-header-cell {
            background: #f8fafc !important;
            font-weight: 600 !important;
          }

          .fc-timegrid-axis {
            font-size: 0.75rem !important;
            color: #6b7280 !important;
          }
        `
      }} />
    </div>
  );
};

export default CalendarPage;
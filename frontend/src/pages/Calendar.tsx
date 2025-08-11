import React, { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction";

// Import des types
import { 
  CalendarTask, 
  CalendarView, 
  TaskFilter, 
  SourceFilter,
  CurrentUser 
} from '../types';

// Import des hooks personnalisés
import { 
  useCalendarData, 
  useCalendarActions,
  useTravelFeatures 
} from '../hooks';

// Import des composants
import {
  BackgroundDecorations,
  CalendarHeader,
  ErrorMessage,
  MainCalendar,
  AddTaskForm,
  Filters,
  TravelTest,
  DayVisits,
  SelectedDayTasks,
  CalendarStyles
} from '../components/calendar';

interface CalendarPageProps {
  currentUser: CurrentUser;
}

const CalendarPage: React.FC<CalendarPageProps> = ({ currentUser }) => {
  const userId = currentUser._id;
  const calendarRef = useRef<FullCalendar>(null);

  // Hooks personnalisés pour les données
  const {
    events,
    patients,
    isLoading,
    error,
    setEvents,
    setError,
    fetchPatients,
    loadData,
    getAuthHeaders,
    handleError
  } = useCalendarData(userId);

  // Hook pour les actions CRUD
  const { addTask, deleteTask, toggleComplete } = useCalendarActions(
    events,
    patients,
    userId,
    getAuthHeaders,
    setEvents,
    setError,
    fetchPatients,
    handleError
  );

  // Hook pour les fonctionnalités de trajet
  const {
    isTravelLoading,
    travelResult,
    travelError,
    testTravelTime,
    isVisitsLoading,
    visitsError,
    dayVisits,
    loadDayVisits,
    isMatrixLoading,
    matrixError,
    matrixResult,
    buildMatrixForDay
  } = useTravelFeatures(getAuthHeaders);

  // États locaux pour l'interface
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [currentView, setCurrentView] = useState<CalendarView>("dayGridMonth");

  // Chargement initial des données
  useEffect(() => {
    loadData();
  }, [userId]);

  // Synchronisation de la vue du calendrier
  useEffect(() => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(currentView);
    }
  }, [currentView]);

  // Handlers pour les événements
  const handleAdd = async () => {
    const success = await addTask(newTitle, newDate);
    if (success) {
      setNewTitle("");
      setNewDate("");
    }
  };

  const handleDateClick = (arg: DateClickArg) => {
    setSelectedDate(arg.dateStr);
    setNewDate(arg.dateStr);
  };

  const handleViewChange = (newView: CalendarView) => {
    setCurrentView(newView);
  };

  // Fonctions utilitaires
  const getEventTitle = (event: CalendarTask) => {
    if (currentView === "dayGridMonth") {
      return event.source === "patient" ? event.patientName || "Patient" : event.title;
    } else {
      return event.source === "patient"
        ? `${event.title} - ${event.patientName}`
        : event.title;
    }
  };

  // Filtrage des événements
  const filteredEvents = events.filter((event) => {
    if (filter === "completed" && !event.completed) return false;
    if (filter === "pending" && event.completed) return false;
    if (sourceFilter === "manual" && event.source === "patient") return false;
    if (sourceFilter === "patient" && event.source !== "patient") return false;
    return true;
  });

  // Formatage des événements pour FullCalendar
  const formatEventsForCalendar = () => {
    return filteredEvents.map((event) => {
      const baseEvent = {
        id: event._id,
        title: getEventTitle(event),
        backgroundColor:
          event.source === "patient"
            ? event.completed ? "#059669" : "#0d9488"
            : event.completed ? "#10b981" : "#3b82f6",
        borderColor:
          event.source === "patient"
            ? event.completed ? "#047857" : "#0f766e"
            : event.completed ? "#059669" : "#2563eb",
        textColor: "#ffffff",
        classNames: event.source === "patient" ? ["patient-event"] : ["manual-event"],
        extendedProps: {
          source: event.source,
          patientName: event.patientName,
          actionLabel: event.title,
          completed: event.completed,
        },
      };

      if (currentView === "dayGridMonth") {
        return { ...baseEvent, date: event.date, allDay: true };
      } else {
        return {
          ...baseEvent,
          start: `${event.date}T09:00:00`,
          end: `${event.date}T10:00:00`,
          allDay: false,
        };
      }
    });
  };

  // Calcul des statistiques
  const totalTasks = events.length;
  const completedTasks = events.filter(task => task.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const manualTasks = events.filter(task => task.source !== "patient").length;
  const patientTasks = events.filter(task => task.source === "patient").length;

  // Tâches de la date sélectionnée
  const selectedDateTasks = events.filter((e) => {
    if (!selectedDate) return false;
    const eventDate = new Date(e.date).toISOString().split("T")[0];
    const selectedDateNormalized = new Date(selectedDate).toISOString().split("T")[0];
    return eventDate === selectedDateNormalized;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 relative overflow-hidden">
      <BackgroundDecorations />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <CalendarHeader
          totalTasks={totalTasks}
          completedTasks={completedTasks}
          pendingTasks={pendingTasks}
          manualTasks={manualTasks}
          patientTasks={patientTasks}
        />

        <ErrorMessage error={error} />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Calendrier principal */}
          <div className="xl:col-span-2">
            <MainCalendar
              currentView={currentView}
              onViewChange={handleViewChange}
              onRefresh={loadData}
              isLoading={isLoading}
              calendarRef={calendarRef}
              events={formatEventsForCalendar()}
              onDateClick={handleDateClick}
            />
          </div>

          {/* Panneau latéral */}
          <div className="space-y-6">
            <AddTaskForm
              newTitle={newTitle}
              newDate={newDate}
              onTitleChange={setNewTitle}
              onDateChange={setNewDate}
              onAdd={handleAdd}
            />

            <Filters
              filter={filter}
              sourceFilter={sourceFilter}
              onFilterChange={setFilter}
              onSourceFilterChange={setSourceFilter}
              totalTasks={totalTasks}
              completedTasks={completedTasks}
              pendingTasks={pendingTasks}
              manualTasks={manualTasks}
              patientTasks={patientTasks}
            />

            <TravelTest
              isTravelLoading={isTravelLoading}
              travelError={travelError}
              travelResult={travelResult}
              onTestTravel={testTravelTime}
            />

            <DayVisits
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onLoadVisits={() => loadDayVisits(selectedDate)}
              onBuildMatrix={() => buildMatrixForDay(selectedDate)}
              isVisitsLoading={isVisitsLoading}
              isMatrixLoading={isMatrixLoading}
              visitsError={visitsError}
              matrixError={matrixError}
              dayVisits={dayVisits}
              matrixResult={matrixResult}
            />
          </div>
        </div>

        <SelectedDayTasks
          selectedDate={selectedDate}
          tasks={selectedDateTasks}
          onToggleComplete={toggleComplete}
          onDelete={deleteTask}
        />
      </div>

      <CalendarStyles />
    </div>
  );
};

export default CalendarPage;
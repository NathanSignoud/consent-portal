// src/pages/Calendar.tsx

import { useEffect, useState } from "react";
import axios from "axios";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

type CalendarTask = {
  _id?: string;
  title: string;
  date: string;
  completed: boolean;
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

  const [events, setEvents] = useState<CalendarTask[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/calendar/${userId}`);
      setEvents(res.data);
    } catch (err) {
      console.error("Erreur lors du chargement des tâches :", err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [userId]);

  const handleAdd = async () => {
    if (!newTitle || !newDate) return;
    try {
      const res = await axios.post(`http://localhost:5000/api/calendar/${userId}`, {
        title: newTitle,
        date: newDate,
      });
      setEvents(res.data);
      setNewTitle("");
      setNewDate("");
    } catch (err) {
      console.error("Erreur lors de l’ajout :", err);
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      const res = await axios.delete(`http://localhost:5000/api/calendar/${userId}/${taskId}`);
      setEvents(res.data);
    } catch (err) {
      console.error("Erreur lors de la suppression :", err);
    }
  };

  const handleToggleComplete = async (taskId: string) => {
    try {
      const res = await axios.patch(`http://localhost:5000/api/calendar/${userId}/${taskId}`);
      setEvents(res.data);
    } catch (err) {
      console.error("Erreur lors du changement de statut :", err);
    }
  };

  const handleDateClick = (arg: DateClickArg) => {
    setSelectedDate(arg.dateStr);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">Planning des Tâches</h1>

      {/* Calendrier */}
      <Card className="shadow-md rounded-2xl p-4">
        <CardContent>
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            height="auto"
            locale="fr"
            dateClick={handleDateClick}
          />
        </CardContent>
      </Card>

      {/* Formulaire d'ajout */}
      <div className="mt-8 space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Ajouter une tâche</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Titre</Label>
            <Input
              id="title"
              type="text"
              placeholder="Ex : Toilette - Mme Dupont"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={handleAdd} className="mt-2">
          Ajouter la tâche
        </Button>
      </div>

      {/* Tâches du jour sélectionné */}
      {selectedDate && (
        <div className="mt-10 bg-gray-50 border rounded-xl p-4">
          <h2 className="text-lg font-bold mb-2">
            Tâches du {new Date(selectedDate).toLocaleDateString("fr-FR")}
          </h2>
          <ul className="list-disc list-inside space-y-2">
            {events
              .filter((e) => e.date === selectedDate)
              .map((e) => (
                <li key={e._id} className="flex items-center justify-between">
                  <span className={e.completed ? "line-through text-gray-500" : ""}>
                    {e.title}
                  </span>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleToggleComplete(e._id!)}
                      className="text-green-600 hover:underline text-sm"
                    >
                      {e.completed ? "Annuler" : "Effectué"}
                    </button>
                    <button
                      onClick={() => handleDelete(e._id!)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Supprimer
                    </button>
                  </div>
                </li>
              ))}
            {events.filter((e) => e.date === selectedDate).length === 0 && (
              <li className="text-gray-500 italic">Aucune tâche prévue</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;

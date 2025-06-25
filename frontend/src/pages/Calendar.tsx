// src/pages/Calendar.tsx
import { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { Card, CardContent } from "@/components/ui/card";

const initialEvents = [
  { title: "Toilette - Mme Dupont", date: "2025-06-20" },
  { title: "Médicaments - M. Martin", date: "2025-06-21" },
];

const CalendarPage = () => {
  const [events, setEvents] = useState(initialEvents);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-700 mb-6">Planning des Tâches</h1>

      <Card className="shadow-md rounded-2xl p-4">
        <CardContent>
          <FullCalendar
            plugins={[dayGridPlugin]}
            initialView="dayGridMonth"
            events={events}
            height="auto"
            locale="fr"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarPage;

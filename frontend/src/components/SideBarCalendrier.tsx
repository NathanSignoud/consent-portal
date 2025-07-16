import { Link, useLocation } from "react-router-dom";
import { CalendarCheck, PlusCircle } from "lucide-react";

const SidebarCalendrier = () => {
  const location = useLocation();
  const linkClass = (path: string) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg transition ${
      location.pathname === path ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-gray-200"
    }`;

  return (
    <div className="w-64 h-screen bg-white border-r shadow-sm p-4">
      <nav className="space-y-2">
        <Link to="/calendrier" className={linkClass("/calendrier")}>
          <CalendarCheck className="w-5 h-5" /> Mon calendrier
        </Link>
        <Link to="/calendrier/ajouter" className={linkClass("/calendrier/ajouter")}>
          <PlusCircle className="w-5 h-5" /> Ajouter un événement
        </Link>
      </nav>
    </div>
  );
};

export default SidebarCalendrier;

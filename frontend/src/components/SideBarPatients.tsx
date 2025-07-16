import { Link, useLocation } from "react-router-dom";
import { Users, FileText } from "lucide-react";

const SidebarPatients = () => {
  const location = useLocation();
  const linkClass = (path: string) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg transition ${
      location.pathname === path ? "bg-blue-100 text-blue-700 font-semibold" : "text-gray-700 hover:bg-gray-200"
    }`;

  return (
    <div className="w-64 h-screen bg-white border-r shadow-sm p-4">
      <nav className="space-y-2">
        <Link to="/patient2" className={linkClass("/patient2")}>
          <Users className="w-5 h-5" /> Liste des patients
        </Link>
        <Link to="/documents" className={linkClass("/documents")}>
          <FileText className="w-5 h-5" /> Documents
        </Link>
      </nav>
    </div>
  );
};

export default SidebarPatients;

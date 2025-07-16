import { useLocation } from "react-router-dom";

import NavBar from "./NavBar";
import SidebarCalendrier from "./SideBarCalendrier";
import SidebarPatients from "./SideBarPatients";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  // Choix de la sidebar selon la route
  const renderSidebar = () => {
    if (location.pathname.startsWith("/calendrier")) {
      return <SidebarCalendrier />;
    } else {
      return <SidebarPatients />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {renderSidebar()}

      <div className="flex flex-col flex-1">
        <NavBar />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;

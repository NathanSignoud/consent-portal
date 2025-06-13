import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.jpg';
import React from 'react';

interface NavBarProps {
  logged: boolean;
  setLogged: (value: boolean) => void;
}

const NavBar: React.FC<NavBarProps> = ({ logged, setLogged }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    setLogged(false);
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex justify-between items-center">
      <div className="flex items-center space-x-4">
        <img src={logo} alt="Logo" className="h-10 w-auto rounded-full shadow-md" />
        <span className="text-xl font-semibold text-gray-800">Doctor Portal</span>
      </div>

      <div className="flex space-x-6 items-center text-sm font-medium text-gray-700">
        <Link to="/" className="hover:text-blue-600 transition">Accueil</Link>
        <Link to="/create" className="hover:text-blue-600 transition">Nouveau patient</Link>
        {!logged && (
          <Link to="/login" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
            Connexion
          </Link>
        )}
        {logged && (
          <button
            onClick={handleLogout}
            className="text-red-600 hover:text-red-800 transition"
          >
            Déconnexion
          </button>
        )}
      </div>
    </nav>
  );
};

export default NavBar;

import React, { useState } from 'react';
import { Calendar, Home, UserPlus, LogIn, LogOut, Menu, X, Globe, ChevronDown, Check, Heart } from 'lucide-react';

// Mock Link et useNavigate
const Link = ({ to, children, className, onClick, ...props }) => (
  <a href={to} className={className} onClick={onClick} {...props}>
    {children}
  </a>
);

const useNavigate = () => (path: string) => console.log("Navigate to:", path);

// Composant LanguageSelector intégré
interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'Anglais', nativeName: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Espagnol', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Allemand', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italien', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portugais', nativeName: 'Português', flag: '🇵🇹' }
];

const LanguageSelector = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(languages[0]);
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
    setIsOpen(false);
    localStorage.setItem('selectedLanguage', language.code);
    console.log('Langue sélectionnée:', language);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group inline-flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg shadow-sm text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200"
      >
        <span className="text-lg">{selectedLanguage.flag}</span>
        <span className="text-sm font-medium hidden sm:inline">{selectedLanguage.code.toUpperCase()}</span>
        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg z-50">
            <div className="p-2">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageSelect(language)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                    selectedLanguage.code === language.code
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="text-lg">{language.flag}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{language.name}</p>
                    <p className="text-xs text-gray-500">{language.nativeName}</p>
                  </div>
                  {selectedLanguage.code === language.code && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

interface NavBarProps {
  logged: boolean;
  currentUser: any;
  setLogged: (value: boolean) => void;
  setCurrentUser: (user: any) => void;
}

const NavBar: React.FC<NavBarProps> = ({ logged, setLogged }) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    setLogged(false);
    setCurrentUser(null);
    navigate('/login');
  };

  const navItems = [
    { to: '/create', label: 'Nouveau patient', icon: UserPlus }
  ];

  return (
    <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo et titre */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-3">
              <img src="/src/assets/logo.jpg" alt="Logo" className="h-10 w-10 rounded-full shadow-md object-cover" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Portail Aide Soignant
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">Gestion des patients</p>
              </div>
            </div>
          </div>

          {/* Navigation desktop */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              to="/"
              className="group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-all duration-200"
            >
              <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Accueil
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
            </Link>
            
            <Link
              to="/calendar"
              className="group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg transition-all duration-200"
            >
              <Calendar className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Planning
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">

            {/* Boutons d'authentification */}
            <div className="flex items-center space-x-2">
              {!logged ? (
                <Link
                  to="/login"
                  className="group inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <LogIn className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">Connexion</span>
                </Link>
              ) : (
                <button
                  onClick={handleLogout}
                  className="group inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                >
                  <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">Déconexion</span>
                </button>
              )}
            </div>

            {/* Menu mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-xl">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="group flex items-center gap-3 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                <Home className="w-5 h-5" />
                Accueil
              </Link>
              
              <Link
                to="/calendar"
                onClick={() => setIsMobileMenuOpen(false)}
                className="group flex items-center gap-3 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                <Calendar className="w-5 h-5" />
                Planning
              </Link>
              
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="group flex items-center gap-3 px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
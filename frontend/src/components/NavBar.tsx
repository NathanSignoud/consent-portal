import React, { useState, useCallback, useEffect, memo } from 'react';
import { 
  Calendar, 
  Home, 
  UserPlus, 
  LogIn, 
  LogOut, 
  Menu, 
  X, 
  Search,
  Settings,
  User,
  Users,
  Activity,
  Heart,
  FileText,
  ChevronDown,
  MapPin,
  Clock,
  Stethoscope,
  Bookmark,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup
} from '@/components/ui/dropdown-menu';
import LanguageSelector from './LanguageSelector';
import { CurrentUser } from '@/types';

// Types pour la navigation
interface NavItem {
  id: string;
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  isNew?: boolean;
  requiredRoles?: string[];
  description?: string;
}

// Props de la NavBar (simplifiées)
interface NavBarProps {
  // État d'authentification
  logged: boolean;
  currentUser: CurrentUser | null;
  setLogged: (value: boolean) => void;
  setCurrentUser: (user: CurrentUser | null) => void;
  
  // Navigation
  currentPath?: string;
  onNavigate?: (path: string) => void;
  
  // Recherche (optionnelle)
  searchEnabled?: boolean;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  
  // Personnalisation
  variant?: 'default' | 'minimal' | 'professional';
  
  // Callbacks
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onHelpClick?: () => void;
  onLogout?: () => void;
}

// Mock pour React Router (à remplacer par les vrais)
const Link = ({ to, children, className, onClick, ...props }: any) => (
  <a href={to} className={className} onClick={onClick} {...props}>
    {children}
  </a>
);

const useNavigate = () => (path: string) => console.log("Navigate to:", path);

// Items de navigation simplifiés (SANS Stats ni Admin)
const getNavItemsByRole = (userRole?: string): NavItem[] => {
  const baseItems: NavItem[] = [
    {
      id: 'home',
      to: '/',
      label: 'Accueil',
      icon: Home,
      description: 'Tableau de bord principal'
    },
    {
      id: 'calendar',
      to: '/calendar',
      label: 'Planning',
      icon: Calendar,
      description: 'Gestion des interventions'
    }
  ];

  // Ajout d'éléments spécifiques selon le rôle (mais SANS admin ni stats)
  if (userRole === 'doctor' || userRole === 'nurse') {
    baseItems.push({
      id: 'patients',
      to: '/patients',
      label: 'Patients',
      icon: Users,
      description: 'Gestion des patients'
    });
  }

  if (userRole === 'doctor') {
    baseItems.push({
      id: 'create',
      to: '/create',
      label: 'Nouveau Patient',
      icon: UserPlus,
      description: 'Ajouter un patient'
    });
  }

  return baseItems;
};

// Composant principal NavBar nettoyé
const NavBar: React.FC<NavBarProps> = memo(({
  logged,
  currentUser,
  setLogged,
  setCurrentUser,
  currentPath = '/',
  onNavigate,
  searchEnabled = false,
  onSearch,
  searchPlaceholder = "Rechercher...",
  variant = 'default',
  onProfileClick,
  onSettingsClick,
  onHelpClick,
  onLogout
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const navigate = useNavigate();

  // Items de navigation basés sur le rôle utilisateur
  const navItems = getNavItemsByRole(currentUser?.role);

  // Gestion de la déconnexion
  const handleLogout = useCallback(() => {
    if (onLogout) {
      onLogout();
    } else {
      // Logique par défaut
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
      setLogged(false);
      setCurrentUser(null);
      navigate('/login');
    }
  }, [onLogout, setLogged, setCurrentUser, navigate]);

  // Gestion de la recherche
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  }, [onSearch]);

  // Fermer le menu mobile lors du changement de route
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentPath]);

  // Rendu minimal pour version compacte
  if (variant === 'minimal') {
    return (
      <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-12">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-red-500" />
              <span className="font-semibold text-gray-900">Aide Soignant</span>
            </div>
            
            <div className="flex items-center gap-2">
              <LanguageSelector variant="minimal" />
              {logged && (
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo et titre */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src="/src/assets/logo.jpg" 
                  alt="Logo" 
                  className="h-10 w-10 rounded-full shadow-md object-cover" 
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Portail Aide Soignant
                </h1>
              </div>
            </div>
          </div>

          {/* Navigation desktop */}
          <div className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = currentPath === item.to;
              const canAccess = !item.requiredRoles || 
                (currentUser?.role && item.requiredRoles.includes(currentUser.role));
              
              if (!canAccess) return null;
              
              return (
                <Link
                  key={item.id}
                  to={item.to}
                  className={`group relative inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'text-blue-600 bg-blue-50 shadow-sm' 
                      : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50/50'
                  }`}
                  title={item.description}
                  onClick={() => onNavigate?.(item.to)}
                >
                  <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  {item.label}
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                  {item.isNew && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Actions et profil */}
          <div className="flex items-center space-x-3">
            
            {/* Sélecteur de langue */}
            <LanguageSelector variant="compact" />
            
            {logged && currentUser ? (
              <>
                {/* Recherche desktop (si activée) */}
                {searchEnabled && (
                  <div className="hidden md:flex relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder={searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-9 w-64 bg-white/50"
                    />
                  </div>
                )}

                {/* Menu utilisateur simplifié */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.email}`} 
                          alt={currentUser.email} 
                        />
                        <AvatarFallback>
                          {currentUser.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {currentUser.firstName && currentUser.lastName 
                            ? `${currentUser.firstName} ${currentUser.lastName}`
                            : currentUser.email
                          }
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {currentUser.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={onProfileClick}>
                        <User className="w-4 h-4 mr-2" />
                        Mon profil
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onSettingsClick}>
                        <Settings className="w-4 h-4 mr-2" />
                        Paramètres
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Bookmark className="w-4 h-4 mr-2" />
                        Favoris
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={onHelpClick}>
                        <HelpCircle className="w-4 h-4 mr-2" />
                        Aide et support
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <FileText className="w-4 h-4 mr-2" />
                        Documentation
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              /* Bouton connexion pour utilisateurs non connectés */
              <Link
                to="/login"
                className="group inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <LogIn className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Connexion</span>
              </Link>
            )}

            {/* Menu mobile */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Menu mobile */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200/50 bg-white/95 backdrop-blur-xl">
            
            {/* Recherche mobile */}
            {searchEnabled && logged && (
              <div className="p-4 border-b border-gray-200/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            )}
            
            {/* Navigation mobile */}
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const isActive = currentPath === item.to;
                const canAccess = !item.requiredRoles || 
                  (currentUser?.role && item.requiredRoles.includes(currentUser.role));
                
                if (!canAccess) return null;
                
                return (
                  <Link
                    key={item.id}
                    to={item.to}
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onNavigate?.(item.to);
                    }}
                    className={`group flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'text-blue-600 bg-blue-50' 
                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                    {item.badge && (
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
});

NavBar.displayName = 'NavBar';

export default NavBar;
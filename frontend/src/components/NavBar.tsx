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
  Bell,
  Settings,
  User,
  Users,
  Activity,
  Heart,
  FileText,
  BarChart3,
  Shield,
  ChevronDown,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  Stethoscope,
  Bookmark,
  HelpCircle,
  Moon,
  Sun,
  Palette
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
  DropdownMenuGroup,
  DropdownMenuShortcut
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
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
  shortcut?: string;
  description?: string;
}

// Types pour les notifications
interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  patientId?: string;
  taskId?: string;
}

// Types pour les préférences utilisateur
interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  compactMode: boolean;
  showNotifications: boolean;
  autoSave: boolean;
  soundEnabled: boolean;
}

// Props de la NavBar
interface NavBarProps {
  // État d'authentification
  logged: boolean;
  currentUser: CurrentUser | null;
  setLogged: (value: boolean) => void;
  setCurrentUser: (user: CurrentUser | null) => void;
  
  // Navigation
  currentPath?: string;
  onNavigate?: (path: string) => void;
  
  // Recherche
  searchEnabled?: boolean;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  
  // Notifications
  notifications?: Notification[];
  unreadCount?: number;
  onNotificationRead?: (notificationId: string) => void;
  onNotificationClear?: () => void;
  
  // Préférences
  userPreferences?: UserPreferences;
  onPreferencesChange?: (preferences: Partial<UserPreferences>) => void;
  
  // Personnalisation
  showBreadcrumbs?: boolean;
  showQuickActions?: boolean;
  showUserStats?: boolean;
  compactMode?: boolean;
  variant?: 'default' | 'minimal' | 'professional';
  
  // Actions personnalisées
  customActions?: React.ReactNode;
  
  // Callbacks
  onThemeChange?: (theme: string) => void;
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onHelpClick?: () => void;
}

// Mock pour React Router (à remplacer par les vrais)
const Link = ({ to, children, className, onClick, ...props }: any) => (
  <a href={to} className={className} onClick={onClick} {...props}>
    {children}
  </a>
);

const useNavigate = () => (path: string) => console.log("Navigate to:", path);

// Items de navigation par rôle
const getNavItemsByRole = (userRole?: string): NavItem[] => {
  const baseItems: NavItem[] = [
    {
      id: 'home',
      to: '/',
      label: 'Accueil',
      icon: Home,
      description: 'Tableau de bord principal',
      shortcut: 'H'
    },
    {
      id: 'calendar',
      to: '/calendar',
      label: 'Planning',
      icon: Calendar,
      description: 'Gestion des interventions ICNP',
      shortcut: 'P'
    }
  ];

  if (userRole === 'nurse' || userRole === 'doctor' || userRole === 'admin') {
    baseItems.push(
      {
        id: 'patients',
        to: '/patients',
        label: 'Patients',
        icon: Users,
        description: 'Gestion des patients',
        shortcut: 'U'
      },
      {
        id: 'interventions',
        to: '/interventions',
        label: 'Interventions ICNP',
        icon: Stethoscope,
        badge: 'ICNP',
        description: 'Référentiel des interventions',
        shortcut: 'I'
      }
    );
  }

  if (userRole === 'admin') {
    baseItems.push(
      {
        id: 'analytics',
        to: '/analytics',
        label: 'Statistiques',
        icon: BarChart3,
        description: 'Analyses et rapports',
        shortcut: 'S'
      },
      {
        id: 'admin',
        to: '/admin',
        label: 'Administration',
        icon: Shield,
        description: 'Gestion du système',
        requiredRoles: ['admin']
      }
    );
  }

  return baseItems;
};

// Notifications mockées
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'info',
    title: 'Nouvelle intervention ICNP',
    message: 'Une nouvelle intervention a été ajoutée au référentiel',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    isRead: false,
    actionUrl: '/interventions',
    actionLabel: 'Voir'
  },
  {
    id: '2',
    type: 'warning',
    title: 'Patient en attente',
    message: 'Le patient Martin Dubois attend sa prise en charge',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    isRead: false,
    patientId: 'p123',
    actionUrl: '/patients/p123',
    actionLabel: 'Voir le patient'
  },
  {
    id: '3',
    type: 'success',
    title: 'Action terminée',
    message: 'Toilette corporelle réalisée pour Mme Dupont',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    isRead: true,
    taskId: 't456'
  }
];

const NavBar: React.FC<NavBarProps> = memo(({ 
  logged,
  currentUser,
  setLogged,
  setCurrentUser,
  currentPath = '/',
  onNavigate,
  searchEnabled = true,
  onSearch,
  searchPlaceholder = 'Rechercher patients, interventions...',
  notifications = mockNotifications,
  unreadCount = 0,
  onNotificationRead,
  onNotificationClear,
  userPreferences,
  onPreferencesChange,
  showBreadcrumbs = false,
  showQuickActions = true,
  showUserStats = true,
  compactMode = false,
  variant = 'default',
  customActions,
  onThemeChange,
  onProfileClick,
  onSettingsClick,
  onHelpClick
}) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const navItems = getNavItemsByRole(currentUser?.role);
  const actualUnreadCount = notifications.filter(n => !n.isRead).length;

  // Gestion de la déconnexion
  const handleLogout = useCallback(() => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    setLogged(false);
    setCurrentUser(null);
    navigate('/login');
  }, [setLogged, setCurrentUser, navigate]);

  // Gestion de la recherche
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  }, [onSearch]);

  // Gestion des notifications
  const handleNotificationClick = useCallback((notification: Notification) => {
    if (!notification.isRead) {
      onNotificationRead?.(notification.id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
    setIsNotificationsOpen(false);
  }, [onNotificationRead, navigate]);

  // Formatage du temps relatif
  const formatRelativeTime = useCallback((date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  }, []);

  // Icône de notification selon le type
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Bell className="w-4 h-4 text-blue-600" />;
    }
  };

  // Stats utilisateur
  const userStats = {
    tasksToday: 8,
    completed: 5,
    patients: 12,
    interventions: 25
  };

  // Navigation mobile fermée sur changement de route
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
                <p className="text-xs text-gray-500">
                  {logged && currentUser ? `Connecté en tant que ${currentUser.role}` : 'Gestion des soins ICNP'}
                </p>
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

          {/* Barre de recherche (desktop) */}
          {searchEnabled && logged && (
            <div className="hidden md:flex items-center flex-1 max-w-lg mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  className="pl-9 bg-gray-50/50 border-gray-200/50 rounded-lg focus:bg-white transition-all duration-200"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSearch('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Actions et profil */}
          <div className="flex items-center space-x-3">
            
            {/* Sélecteur de langue */}
            <LanguageSelector variant="compact" />
            
            {logged && currentUser ? (
              <>
                {/* Notifications */}
                <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="relative">
                      <Bell className="w-5 h-5" />
                      {actualUnreadCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
                        >
                          {actualUnreadCount > 9 ? '9+' : actualUnreadCount}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">Notifications</h4>
                        {actualUnreadCount > 0 && (
                          <Button variant="ghost" size="sm" onClick={onNotificationClear}>
                            Tout marquer lu
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="max-h-80 overflow-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Aucune notification</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${
                              !notification.isRead ? 'bg-blue-50/50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {getNotificationIcon(notification.type)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium text-sm text-gray-900 truncate">
                                    {notification.title}
                                  </p>
                                  {!notification.isRead && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                  {notification.message}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-gray-500">
                                    {formatRelativeTime(notification.timestamp)}
                                  </span>
                                  {notification.actionLabel && (
                                    <span className="text-xs text-blue-600">
                                      {notification.actionLabel}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Actions rapides */}
                {showQuickActions && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <UserPlus className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions rapides</DropdownMenuLabel>
                      <DropdownMenuItem>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Nouveau patient
                        <DropdownMenuShortcut>⌘N</DropdownMenuShortcut>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Activity className="w-4 h-4 mr-2" />
                        Nouvelle intervention
                        <DropdownMenuShortcut>⌘I</DropdownMenuShortcut>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Calendar className="w-4 h-4 mr-2" />
                        Planifier une tâche
                        <DropdownMenuShortcut>⌘T</DropdownMenuShortcut>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Profil utilisateur */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 px-3 py-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={currentUser.avatar} />
                        <AvatarFallback className="bg-blue-500 text-white">
                          {currentUser.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden sm:block text-left">
                        <p className="text-sm font-medium text-gray-900">
                          {currentUser.firstName || currentUser.email.split('@')[0]}
                        </p>
                        <p className="text-xs text-gray-500">{currentUser.role}</p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={currentUser.avatar} />
                          <AvatarFallback className="bg-blue-500 text-white">
                            {currentUser.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {currentUser.firstName || currentUser.email.split('@')[0]}
                          </p>
                          <p className="text-sm text-gray-500">{currentUser.email}</p>
                          <Badge variant="outline" className="mt-1">{currentUser.role}</Badge>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    
                    {showUserStats && (
                      <>
                        <DropdownMenuSeparator />
                        <div className="px-2 py-3">
                          <p className="text-sm font-medium mb-2">Aujourd'hui</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="text-center p-2 bg-blue-50 rounded">
                              <p className="font-semibold text-blue-600">{userStats.tasksToday}</p>
                              <p className="text-gray-600">Tâches</p>
                            </div>
                            <div className="text-center p-2 bg-green-50 rounded">
                              <p className="font-semibold text-green-600">{userStats.completed}</p>
                              <p className="text-gray-600">Terminées</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    
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
                        Documentation ICNP
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
              /* Boutons non connecté */
              <Link
                to="/login"
                className="group inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <LogIn className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Connexion</span>
              </Link>
            )}

            {/* Actions personnalisées */}
            {customActions}

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
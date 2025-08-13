import React, { useEffect, useState, useCallback, memo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { 
  Shield, 
  Lock, 
  AlertTriangle, 
  Clock, 
  User, 
  LogIn,
  RefreshCw,
  Home,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CurrentUser } from '@/types';

// Interface pour les permissions granulaires
interface Permission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

// Interface pour la gestion des rôles
interface Role {
  id: string;
  name: string;
  displayName: string;
  permissions: Permission[];
  hierarchy: number; // Pour la hiérarchie des rôles
  isActive: boolean;
  description?: string;
}

// Interface pour l'audit des accès
interface AccessAttempt {
  userId: string;
  route: string;
  timestamp: Date;
  success: boolean;
  reason?: string;
  userAgent?: string;
  ip?: string;
}

// Props pour PrivateRoute
interface PrivateRouteProps {
  children: React.ReactNode;
  
  // Authentification de base
  logged?: boolean;
  currentUser?: CurrentUser | null;
  
  // Gestion des rôles
  allowedRoles?: string[];
  requiredPermissions?: Permission[];
  minimumHierarchy?: number;
  
  // Redirections intelligentes
  fallbackRoute?: string;
  loginRoute?: string;
  unauthorizedRoute?: string;
  
  // Options avancées
  requireEmailVerification?: boolean;
  requireMFA?: boolean;
  allowGuestAccess?: boolean;
  sessionTimeout?: number; // en minutes
  
  // Fonctionnalités de sécurité
  auditAccess?: boolean;
  showAccessDeniedDetails?: boolean;
  enableSessionWarning?: boolean;
  
  // Loading et UX
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  
  // Callbacks
  onAccessDenied?: (reason: string, user?: CurrentUser) => void;
  onSessionExpired?: () => void;
  onUnauthorizedAccess?: (attempt: AccessAttempt) => void;
  
  // Personnalisation
  variant?: 'default' | 'minimal' | 'detailed';
  showDebugInfo?: boolean;
}

// Définition des rôles avec hiérarchie
const roleHierarchy: Record<string, Role> = {
  'guest': {
    id: 'guest',
    name: 'guest',
    displayName: 'Invité',
    permissions: [
      { resource: 'public', action: 'read' }
    ],
    hierarchy: 0,
    isActive: true,
    description: 'Accès public limité'
  },
  'patient': {
    id: 'patient',
    name: 'patient',
    displayName: 'Patient',
    permissions: [
      { resource: 'profile', action: 'read' },
      { resource: 'profile', action: 'update', conditions: { ownProfile: true } },
      { resource: 'documents', action: 'read', conditions: { ownDocuments: true } }
    ],
    hierarchy: 1,
    isActive: true,
    description: 'Accès patient aux données personnelles'
  },
  'nurse': {
    id: 'nurse',
    name: 'nurse',
    displayName: 'Aide-soignant(e)',
    permissions: [
      { resource: '*', action: '*' }
    ],
    hierarchy: 4,
    isActive: true,
    description: 'Gestion des soins et interventions ICNP'
  },
  'doctor': {
    id: 'doctor',
    name: 'doctor',
    displayName: 'Médecin',
    permissions: [
      { resource: 'patients', action: '*' },
      { resource: 'interventions', action: '*' },
      { resource: 'calendar', action: '*' },
      { resource: 'reports', action: 'read' }
    ],
    hierarchy: 3,
    isActive: true,
    description: 'Accès médical complet'
  },
  'admin': {
    id: 'admin',
    name: 'admin',
    displayName: 'Administrateur',
    permissions: [
      { resource: '*', action: '*' }
    ],
    hierarchy: 4,
    isActive: true,
    description: 'Accès administrateur complet'
  }
};

// Hook pour la gestion des sessions
const useSessionManagement = (
  sessionTimeout?: number,
  onSessionExpired?: () => void,
  enableWarning: boolean = true
) => {
  const [sessionWarning, setSessionWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isSessionValid, setIsSessionValid] = useState(true);

  const extendSession = useCallback(() => {
    const newExpiry = Date.now() + (sessionTimeout || 30) * 60 * 1000;
    localStorage.setItem('sessionExpiry', newExpiry.toString());
    setSessionWarning(false);
    setIsSessionValid(true);
  }, [sessionTimeout]);

  useEffect(() => {
    if (!sessionTimeout) return;

    const checkSession = () => {
      const expiry = localStorage.getItem('sessionExpiry');
      if (!expiry) {
        extendSession();
        return;
      }

      const expiryTime = parseInt(expiry);
      const now = Date.now();
      const remaining = expiryTime - now;

      if (remaining <= 0) {
        setIsSessionValid(false);
        onSessionExpired?.();
        return;
      }

      setTimeRemaining(Math.floor(remaining / 1000));

      // Avertissement 5 minutes avant expiration
      if (enableWarning && remaining <= 5 * 60 * 1000 && !sessionWarning) {
        setSessionWarning(true);
      }
    };

    const interval = setInterval(checkSession, 1000);
    checkSession();

    return () => clearInterval(interval);
  }, [sessionTimeout, onSessionExpired, enableWarning, sessionWarning, extendSession]);

  return {
    sessionWarning,
    timeRemaining,
    isSessionValid,
    extendSession,
    dismissWarning: () => setSessionWarning(false)
  };
};

// Fonction de validation des permissions
const checkPermissions = (
  userRole: string,
  requiredPermissions: Permission[],
  currentUser?: CurrentUser
): { hasAccess: boolean; missingPermissions: Permission[] } => {
  const role = roleHierarchy[userRole];
  if (!role || !role.isActive) {
    return { hasAccess: false, missingPermissions: requiredPermissions };
  }

  const missingPermissions: Permission[] = [];

  for (const required of requiredPermissions) {
    const hasPermission = role.permissions.some(permission => {
      // Wildcard permissions
      if (permission.resource === '*' || permission.action === '*') {
        return true;
      }

      // Exact match
      if (permission.resource === required.resource && 
          permission.action === required.action) {
        
        // Check conditions if any
        if (required.conditions && permission.conditions) {
          return Object.entries(required.conditions).every(([key, value]) => 
            permission.conditions![key] === value
          );
        }
        
        return true;
      }

      return false;
    });

    if (!hasPermission) {
      missingPermissions.push(required);
    }
  }

  return {
    hasAccess: missingPermissions.length === 0,
    missingPermissions
  };
};

// Composant d'accès refusé
const AccessDeniedScreen: React.FC<{
  reason: string;
  currentUser?: CurrentUser | null;
  showDetails: boolean;
  missingPermissions?: Permission[];
  onRetry?: () => void;
  onGoHome?: () => void;
  onLogin?: () => void;
  variant?: 'default' | 'minimal' | 'detailed';
}> = memo(({ 
  reason, 
  currentUser, 
  showDetails, 
  missingPermissions = [],
  onRetry,
  onGoHome,
  onLogin,
  variant = 'default'
}) => {
  const [showPermissionDetails, setShowPermissionDetails] = useState(false);

  if (variant === 'minimal') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Lock className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Accès refusé</h2>
            <p className="text-gray-600 mb-4">{reason}</p>
            <div className="flex gap-2 justify-center">
              {onLogin && (
                <Button onClick={onLogin}>
                  <LogIn className="w-4 h-4 mr-2" />
                  Se connecter
                </Button>
              )}
              {onGoHome && (
                <Button variant="outline" onClick={onGoHome}>
                  <Home className="w-4 h-4 mr-2" />
                  Accueil
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50/30 to-pink-100/40 flex items-center justify-center p-4">
      
      {/* Éléments décoratifs de fond */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-orange-200/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <Card className="relative z-10 w-full max-w-2xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg">
        <CardContent className="p-8">
          
          {/* En-tête */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-10 h-10 text-red-600" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Accès refusé</h1>
            <p className="text-lg text-gray-600">{reason}</p>
          </div>

          {/* Informations utilisateur */}
          {currentUser && showDetails && (
            <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Informations de la session
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Utilisateur :</span>
                  <p className="font-medium">{currentUser.email}</p>
                </div>
                <div>
                  <span className="text-gray-600">Rôle actuel :</span>
                  <Badge variant="outline" className="ml-2">
                    {roleHierarchy[currentUser.role]?.displayName || currentUser.role}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-600">Dernière connexion :</span>
                  <p className="font-medium">
                    {currentUser.lastLogin ? new Date(currentUser.lastLogin).toLocaleString('fr-FR') : 'Inconnue'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Session :</span>
                  <p className="font-medium text-green-600">Active</p>
                </div>
              </div>
            </div>
          )}

          {/* Détails des permissions manquantes */}
          {showDetails && missingPermissions.length > 0 && (
            <div className="bg-yellow-50/80 backdrop-blur-sm rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-yellow-900 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Permissions requises
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPermissionDetails(!showPermissionDetails)}
                >
                  {showPermissionDetails ? (
                    <><EyeOff className="w-4 h-4 mr-1" /> Masquer</>
                  ) : (
                    <><Eye className="w-4 h-4 mr-1" /> Détails</>
                  )}
                </Button>
              </div>
              
              {showPermissionDetails && (
                <div className="space-y-2">
                  {missingPermissions.map((permission, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-yellow-200">
                      <Lock className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                      <div className="flex-1">
                        <span className="font-medium text-yellow-800">
                          {permission.action} sur {permission.resource}
                        </span>
                        {permission.conditions && (
                          <p className="text-sm text-yellow-700 mt-1">
                            Conditions : {JSON.stringify(permission.conditions)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Suggestions d'actions */}
          <div className="bg-blue-50/80 backdrop-blur-sm rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-4">Que pouvez-vous faire ?</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Vérifiez que vous êtes connecté avec le bon compte
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Contactez votre administrateur pour obtenir les permissions nécessaires
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Retournez à l'accueil et naviguez vers une section autorisée
              </li>
              {!currentUser && (
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  Connectez-vous si vous avez un compte
                </li>
              )}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {!currentUser && onLogin && (
              <Button onClick={onLogin} className="bg-blue-600 hover:bg-blue-700">
                <LogIn className="w-4 h-4 mr-2" />
                Se connecter
              </Button>
            )}
            
            {onRetry && (
              <Button variant="outline" onClick={onRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            )}
            
            {onGoHome && (
              <Button variant="outline" onClick={onGoHome}>
                <Home className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Button>
            )}
            
            <Button variant="ghost" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Page précédente
            </Button>
          </div>

          {/* Informations de débogage */}
          {variant === 'detailed' && process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-xs text-gray-500">
              <summary className="cursor-pointer font-medium">Informations de débogage</summary>
              <pre className="mt-2 p-3 bg-gray-100 rounded overflow-auto">
                {JSON.stringify({
                  currentUser: currentUser,
                  missingPermissions,
                  timestamp: new Date().toISOString(),
                  userAgent: navigator.userAgent
                }, null, 2)}
              </pre>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

// Composant de chargement
const LoadingScreen: React.FC<{ message?: string }> = ({ message = 'Vérification des autorisations...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <Card className="w-full max-w-md">
      <CardContent className="p-8 text-center">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Vérification...</h2>
        <p className="text-gray-600 mb-4">{message}</p>
        <Progress value={undefined} className="w-full" />
      </CardContent>
    </Card>
  </div>
);

// Avertissement de session
const SessionWarning: React.FC<{
  timeRemaining: number;
  onExtend: () => void;
  onDismiss: () => void;
}> = ({ timeRemaining, onExtend, onDismiss }) => {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="fixed top-4 right-4 z-50">
      <Alert className="bg-yellow-50 border-yellow-200 shadow-lg">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Session expire bientôt</p>
              <p className="text-sm">{minutes}m {seconds}s restantes</p>
            </div>
            <div className="flex gap-2 ml-4">
              <Button size="sm" onClick={onExtend}>
                Prolonger
              </Button>
              <Button size="sm" variant="ghost" onClick={onDismiss}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

// Composant principal PrivateRoute
const PrivateRoute: React.FC<PrivateRouteProps> = memo(({
  children,
  logged = false,
  currentUser = null,
  allowedRoles = [],
  requiredPermissions = [],
  minimumHierarchy,
  fallbackRoute = '/',
  loginRoute = '/login',
  unauthorizedRoute = '/unauthorized',
  requireEmailVerification = false,
  requireMFA = false,
  allowGuestAccess = false,
  sessionTimeout,
  auditAccess = false,
  showAccessDeniedDetails = true,
  enableSessionWarning = true,
  loadingComponent,
  errorComponent,
  onAccessDenied,
  onSessionExpired,
  onUnauthorizedAccess,
  variant = 'default',
  showDebugInfo = false
}) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [accessDeniedReason, setAccessDeniedReason] = useState<string>('');
  const [missingPermissions, setMissingPermissions] = useState<Permission[]>([]);

  const {
    sessionWarning,
    timeRemaining,
    isSessionValid,
    extendSession,
    dismissWarning
  } = useSessionManagement(sessionTimeout, onSessionExpired, enableSessionWarning);

  // Log d'audit
  const logAccess = useCallback((success: boolean, reason?: string) => {
    if (!auditAccess) return;

    const attempt: AccessAttempt = {
      userId: currentUser?.id || 'anonymous',
      route: location.pathname,
      timestamp: new Date(),
      success,
      reason,
      userAgent: navigator.userAgent,
      ip: 'client-side' // Sera rempli côté serveur
    };

    onUnauthorizedAccess?.(attempt);
    console.log('Access attempt logged:', attempt);
  }, [auditAccess, currentUser, location.pathname, onUnauthorizedAccess]);

  // Vérification des autorisations
  useEffect(() => {
    const checkAccess = async () => {
      setIsLoading(true);

      try {
        // Vérification de la session
        if (sessionTimeout && !isSessionValid) {
          setAccessDeniedReason('Votre session a expiré');
          logAccess(false, 'Session expired');
          setIsLoading(false);
          return;
        }

        // Accès invité autorisé
        if (allowGuestAccess && !logged) {
          logAccess(true);
          setIsLoading(false);
          return;
        }

        // Utilisateur non connecté
        if (!logged || !currentUser) {
          setAccessDeniedReason('Vous devez être connecté pour accéder à cette page');
          logAccess(false, 'Not authenticated');
          setIsLoading(false);
          return;
        }

        // Vérification email
        if (requireEmailVerification && !currentUser.emailVerified) {
          setAccessDeniedReason('Vous devez vérifier votre email pour continuer');
          logAccess(false, 'Email not verified');
          setIsLoading(false);
          return;
        }

        // Vérification MFA
        if (requireMFA && !currentUser.mfaEnabled) {
          setAccessDeniedReason('L\'authentification à deux facteurs est requise');
          logAccess(false, 'MFA required');
          setIsLoading(false);
          return;
        }

        // Vérification des rôles
        if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
          setAccessDeniedReason(`Votre rôle (${roleHierarchy[currentUser.role]?.displayName || currentUser.role}) n'est pas autorisé`);
          logAccess(false, 'Role not allowed');
          setIsLoading(false);
          return;
        }

        // Vérification de la hiérarchie
        if (minimumHierarchy !== undefined) {
          const userHierarchy = roleHierarchy[currentUser.role]?.hierarchy ?? -1;
          if (userHierarchy < minimumHierarchy) {
            setAccessDeniedReason('Permissions insuffisantes pour cette ressource');
            logAccess(false, 'Insufficient hierarchy');
            setIsLoading(false);
            return;
          }
        }

        // Vérification des permissions granulaires
        if (requiredPermissions.length > 0) {
          const { hasAccess, missingPermissions: missing } = checkPermissions(
            currentUser.role,
            requiredPermissions,
            currentUser
          );

          if (!hasAccess) {
            setMissingPermissions(missing);
            setAccessDeniedReason('Permissions insuffisantes pour cette action');
            logAccess(false, 'Missing permissions');
            setIsLoading(false);
            return;
          }
        }

        // Accès autorisé
        logAccess(true);
        onAccessDenied && onAccessDenied('', currentUser);

      } catch (error) {
        console.error('Error checking access:', error);
        setAccessDeniedReason('Erreur lors de la vérification des autorisations');
        logAccess(false, 'Verification error');
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [
    logged, 
    currentUser, 
    allowedRoles, 
    requiredPermissions, 
    minimumHierarchy,
    requireEmailVerification,
    requireMFA,
    allowGuestAccess,
    sessionTimeout,
    isSessionValid,
    location.pathname,
    logAccess,
    onAccessDenied
  ]);

  // Affichage du chargement
  if (isLoading) {
    return loadingComponent || <LoadingScreen />;
  }

  // Redirection pour utilisateur non connecté (sauf accès invité)
  if (!allowGuestAccess && (!logged || !currentUser)) {
    return <Navigate to={loginRoute} state={{ from: location }} replace />;
  }

  // Affichage de l'accès refusé
  if (accessDeniedReason) {
    const handleRetry = () => window.location.reload();
    const handleGoHome = () => window.location.href = fallbackRoute;
    const handleLogin = () => window.location.href = loginRoute;

    return (
      <>
        {errorComponent || (
          <AccessDeniedScreen
            reason={accessDeniedReason}
            currentUser={currentUser}
            showDetails={showAccessDeniedDetails}
            missingPermissions={missingPermissions}
            onRetry={handleRetry}
            onGoHome={handleGoHome}
            onLogin={!currentUser ? handleLogin : undefined}
            variant={variant}
          />
        )}
      </>
    );
  }

  // Rendu des enfants avec avertissement de session si nécessaire
  return (
    <>
      {children}
      {sessionWarning && (
        <SessionWarning
          timeRemaining={timeRemaining}
          onExtend={extendSession}
          onDismiss={dismissWarning}
        />
      )}
    </>
  );
});

PrivateRoute.displayName = 'PrivateRoute';

// Export des utilitaires pour réutilisation
export { roleHierarchy, checkPermissions };
export type { Permission, Role, AccessAttempt };

export default PrivateRoute;
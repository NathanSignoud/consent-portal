import React, { useState, useEffect, ReactNode } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Heart, AlertTriangle } from 'lucide-react';

// Composants
import NavBar from './components/NavBar';
import PrivateRoute from './components/PrivateRoute';

// Pages
import HubDoctor from './pages/HubDoctor';
import HubAdmin from './pages/HubNurse';
import HubPatient from './pages/HubPatient';
import Create from './pages/Create';
import Login from './pages/Login';
import PatientDetail from './pages/PatientDetail';
import Patient2Detail from './pages/Patient2Detail';
import NotFound from './pages/NotFound';
import Register from './pages/Register';
import PdfViewer from './pages/PdfViewer';
import Divided from './pages/Divided';
import CalendarPage from './pages/Calendar';
import SectionDetail from './pages/SectionDetail';

// Types
interface User {
  id: string;
  email: string;
  role: 'user' | 'doctor' | 'nurse' | 'admin';
  createdAt?: string;
  lastLogin?: string;
  [key: string]: any;
}

interface AppState {
  logged: boolean;
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}

// Utilitaires pour la gestion des rôles
const getUserRedirectPath = (userRole: string): string => {
  switch (userRole) {
    case 'admin':
      return '/hub/admin';
    case 'doctor':
      return '/hub/medecin';
    case 'nurse':
      return '/hub/admin'; // Personnel soignant vers admin
    case 'user':
      return '/hub/patient';
    default:
      return '/login';
  }
};

const getRoleDisplayName = (role: string): string => {
  switch (role) {
    case 'admin':
      return 'Administrateur';
    case 'doctor':
      return 'Médecin';
    case 'nurse':
      return 'Personnel Soignant';
    case 'user':
      return 'Patient';
    default:
      return 'Utilisateur';
  }
};

// Mapping des rôles pour les permissions
const ROLE_PERMISSIONS = {
  admin: ['admin', 'nurse', 'doctor', 'user'], // Admin peut tout
  doctor: ['doctor'], // Médecin accès médecin uniquement
  nurse: ['nurse', 'user'], // Personnel soignant peut voir patients
  user: ['user'] // Patient accès patient uniquement
};

// Composant de chargement global
const AppLoader: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
    <div className="text-center">
      <div className="mb-4 p-4 bg-blue-100 rounded-full inline-block">
        <Heart className="w-8 h-8 text-blue-600 animate-pulse" />
      </div>
      <div className="flex items-center gap-3 text-blue-600">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="text-lg font-medium">Chargement de l'application...</span>
      </div>
    </div>
  </div>
);

// Composant d'erreur globale
const AppError: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
    <div className="text-center max-w-md mx-4">
      <div className="mb-4 p-4 bg-red-100 rounded-full inline-block">
        <AlertTriangle className="w-8 h-8 text-red-600" />
      </div>
      <h2 className="text-xl font-bold text-red-800 mb-2">Erreur d'application</h2>
      <p className="text-red-700 mb-4">{error}</p>
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Réessayer
      </button>
    </div>
  </div>
);

// Page d'accueil pour utilisateurs non connectés
const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="mb-8 p-6 bg-blue-100 rounded-full inline-block">
          <Heart className="w-16 h-16 text-blue-600" />
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Plateforme Médicale Sécurisée
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Système de gestion des dossiers patients avec suivi médical intégré et outils de soins modernes
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
          >
            Se connecter
          </button>
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-3 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
          >
            Créer un compte
          </button>
        </div>

        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <div className="p-6 bg-white rounded-xl shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Patients</h3>
            <p className="text-gray-600">Accès sécurisé à votre dossier médical et suivi de soins</p>
          </div>
          
          <div className="p-6 bg-white rounded-xl shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Médecins</h3>
            <p className="text-gray-600">Gestion complète des dossiers patients et prescriptions</p>
          </div>
          
          <div className="p-6 bg-white rounded-xl shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Personnel</h3>
            <p className="text-gray-600">Administration des soins et gestion des patients</p>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  // État principal de l'application
  const [appState, setAppState] = useState<AppState>({
    logged: false,
    currentUser: null,
    isLoading: true,
    error: null
  });

  const location = useLocation();
  const navigate = useNavigate();

  // Initialisation de l'application
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setAppState(prev => ({ ...prev, isLoading: true, error: null }));

        // Vérifier les données stockées
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('currentUser');

        if (storedToken && storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            
            // Valider le token côté serveur (optionnel)
            const response = await fetch('/api/auth/me', {
              headers: {
                'Authorization': `Bearer ${storedToken}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              const validatedUser = await response.json();
              setAppState({
                logged: true,
                currentUser: validatedUser.user || userData,
                isLoading: false,
                error: null
              });
            } else {
              // Token invalide, nettoyer
              localStorage.removeItem('token');
              localStorage.removeItem('currentUser');
              setAppState({
                logged: false,
                currentUser: null,
                isLoading: false,
                error: null
              });
            }
          } catch (parseError) {
            console.error('Erreur parsing user data:', parseError);
            localStorage.removeItem('token');
            localStorage.removeItem('currentUser');
            setAppState({
              logged: false,
              currentUser: null,
              isLoading: false,
              error: null
            });
          }
        } else {
          setAppState({
            logged: false,
            currentUser: null,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Erreur initialisation app:', error);
        setAppState({
          logged: false,
          currentUser: null,
          isLoading: false,
          error: 'Erreur lors du chargement de l\'application'
        });
      }
    };

    initializeApp();
  }, []);

  // Fonctions de gestion de l'état
  const setLogged = (logged: boolean) => {
    setAppState(prev => ({ ...prev, logged }));
  };

  const setCurrentUser = (user: User | null) => {
    setAppState(prev => ({ ...prev, currentUser: user }));
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    setAppState({
      logged: false,
      currentUser: null,
      isLoading: false,
      error: null
    });
    navigate('/login');
  };

  // États de chargement et d'erreur
  if (appState.isLoading) {
    return <AppLoader />;
  }

  if (appState.error) {
    return <AppError error={appState.error} onRetry={handleRetry} />;
  }

  console.log('🚀 App State:', {
    logged: appState.logged,
    userRole: appState.currentUser?.role,
    currentPath: location.pathname
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <NavBar 
        logged={appState.logged} 
        setLogged={setLogged} 
        currentUser={appState.currentUser} 
        setCurrentUser={setCurrentUser}
        onLogout={handleLogout}
      />

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Routes>
          
          {/* Route d'accueil avec redirection intelligente */}
          <Route
            path="/"
            element={
              appState.logged && appState.currentUser ? (
                <Navigate 
                  to={getUserRedirectPath(appState.currentUser.role)} 
                  replace 
                />
              ) : (
                <HomePage />
              )
            }
          />

          {/* Routes d'authentification */}
          <Route
            path="/login"
            element={
              appState.logged && appState.currentUser ? (
                <Navigate 
                  to={getUserRedirectPath(appState.currentUser.role)} 
                  replace 
                />
              ) : (
                <Login setLogged={setLogged} setCurrentUser={setCurrentUser} />
              )
            }
          />

          <Route
            path="/register"
            element={
              appState.logged && appState.currentUser ? (
                <Navigate 
                  to={getUserRedirectPath(appState.currentUser.role)} 
                  replace 
                />
              ) : (
                <Register />
              )
            }
          />

          {/* Routes protégées - Hub Admin */}
          <Route
            path="/hub/admin"
            element={
              <PrivateRoute
                logged={appState.logged}
                currentUser={appState.currentUser}
                allowedRoles={['admin', 'nurse']}
                redirectTo="/login"
              >
                <HubAdmin />
              </PrivateRoute>
            }
          />

          {/* Routes protégées - Hub Médecin */}
          <Route
            path="/hub/medecin"
            element={
              <PrivateRoute
                logged={appState.logged}
                currentUser={appState.currentUser}
                allowedRoles={['doctor']}
                redirectTo="/login"
              >
                <HubDoctor />
              </PrivateRoute>
            }
          />

          {/* Routes protégées - Hub Patient */}
          <Route
            path="/hub/patient"
            element={
              <PrivateRoute
                logged={appState.logged}
                currentUser={appState.currentUser}
                allowedRoles={['user']}
                redirectTo="/login"
              >
                <HubPatient />
              </PrivateRoute>
            }
          />

          {/* Routes fonctionnelles - Calendrier */}
          <Route
            path="/calendar"
            element={
              <PrivateRoute
                logged={appState.logged}
                currentUser={appState.currentUser}
                allowedRoles={['admin', 'doctor', 'nurse']}
                redirectTo="/login"
              >
                <CalendarPage currentUser={appState.currentUser} />
              </PrivateRoute>
            }
          />

          {/* Routes patients */}
          <Route
            path="/patient/:id"
            element={
              <PrivateRoute
                logged={appState.logged}
                currentUser={appState.currentUser}
                allowedRoles={['admin', 'doctor', 'nurse']}
                redirectTo="/login"
              >
                <PatientDetail />
              </PrivateRoute>
            }
          />

          <Route
            path="/patient2/:id"
            element={
              <PrivateRoute
                logged={appState.logged}
                currentUser={appState.currentUser}
                allowedRoles={['admin', 'doctor', 'nurse']}
                redirectTo="/login"
              >
                <Patient2Detail />
              </PrivateRoute>
            }
          />

          {/* Routes documents et PDF */}
          <Route
            path="/patient/:id/pdf/:pdfId"
            element={
              <PrivateRoute
                logged={appState.logged}
                currentUser={appState.currentUser}
                allowedRoles={['admin', 'doctor', 'nurse']}
                redirectTo="/login"
              >
                <PdfViewer />
              </PrivateRoute>
            }
          />

          <Route
            path="/patient/:id/divide/:pdfPath/:language"
            element={
              <PrivateRoute
                logged={appState.logged}
                currentUser={appState.currentUser}
                allowedRoles={['admin', 'doctor', 'nurse']}
                redirectTo="/login"
              >
                <Divided />
              </PrivateRoute>
            }
          />

          <Route
            path="/section/:id/:language"
            element={
              <PrivateRoute
                logged={appState.logged}
                currentUser={appState.currentUser}
                allowedRoles={['admin', 'doctor', 'nurse', 'user']}
                redirectTo="/login"
              >
                <SectionDetail />
              </PrivateRoute>
            }
          />

          {/* Routes utilitaires */}
          <Route
            path="/create"
            element={
              <PrivateRoute
                logged={appState.logged}
                currentUser={appState.currentUser}
                allowedRoles={['admin', 'doctor']}
                redirectTo="/login"
              >
                <Create />
              </PrivateRoute>
            }
          />

          {/* Route 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Informations de debug en développement */}
      {process.env.NODE_ENV === 'development' && appState.currentUser && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs z-50">
          <div>👤 {appState.currentUser.email}</div>
          <div>🔐 {getRoleDisplayName(appState.currentUser.role)}</div>
          <div>📍 {location.pathname}</div>
        </div>
      )}
    </div>
  );
}

export default App;
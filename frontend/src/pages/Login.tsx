import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  Heart, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  UserPlus, 
  ArrowLeft,
  LogIn
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LoginProps {
  setLogged: (val: boolean) => void;
  setCurrentUser: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ setLogged, setCurrentUser }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('currentUser');
    
    if (token && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setLogged(true);
        setCurrentUser(user);
        
        // Redirection automatique selon le rôle
        const redirectPath = user.role === 'admin' ? '/hub/admin' 
          : user.role === 'doctor' ? '/hub/medecin'
          : user.role === 'nurse' ? '/hub/admin' // Personnel soignant vers admin
          : user.role === 'user' ? '/hub/patient'
          : '/';
        
        navigate(redirectPath);
      } catch (error) {
        // Si erreur de parsing, nettoyer le localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
      }
    }
  }, [setLogged, setCurrentUser, navigate]);

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('L\'adresse email est requise');
      return false;
    }
    
    if (!formData.email.includes('@')) {
      setError('Veuillez entrer une adresse email valide');
      return false;
    }
    
    if (!formData.password) {
      setError('Le mot de passe est requis');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError('');

    try {
      console.log('🔄 Tentative de connexion pour:', formData.email);

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password
        }),
      });

      console.log('📡 Statut de la réponse:', response.status);

      const data = await response.json();
      console.log('📦 Données reçues:', { ...data, token: data.token ? '***' : undefined });

      if (!response.ok) {
        throw new Error(data.message || `Erreur ${response.status}: ${response.statusText}`);
      }

      if (!data.success) {
        throw new Error(data.message || 'Erreur de connexion');
      }

      // Vérification des données requises
      if (!data.token) {
        throw new Error('Token manquant dans la réponse');
      }

      if (!data.user) {
        throw new Error('Informations utilisateur manquantes');
      }

      console.log('✅ Connexion réussie pour:', data.user.email);

      // Sauvegarder les données
      localStorage.setItem('token', data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      
      if (rememberMe) {
        localStorage.setItem('rememberLogin', 'true');
      }

      // Mettre à jour l'état global
      setLogged(true);
      setCurrentUser(data.user);

      // Redirection selon le rôle
      const userRole = data.user.role;
      let redirectPath = '/';

      switch (userRole) {
        case 'admin':
          redirectPath = '/hub/admin';
          break;
        case 'doctor':
          redirectPath = '/hub/medecin';
          break;
        case 'nurse':
          redirectPath = '/hub/admin'; // Personnel soignant vers admin
          break;
        case 'user':
          redirectPath = '/hub/patient';
          break;
        default:
          redirectPath = '/';
      }

      console.log('🔄 Redirection vers:', redirectPath);
      navigate(redirectPath);

    } catch (err: any) {
      console.error('❌ Erreur de connexion:', err);
      setError(err.message || 'Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: 'email' | 'password') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (error) setError(''); // Effacer l'erreur lors de la saisie
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 relative overflow-hidden flex items-center justify-center">
      
      {/* Éléments décoratifs de fond */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-200/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-purple-200/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Conteneur principal */}
      <div className="relative z-10 w-full max-w-md mx-4">
        
        {/* Bouton retour vers l'accueil */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-200 shadow-sm hover:shadow-md rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Retour à l'accueil
          </Button>
        </div>

        {/* Carte principale */}
        <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Connexion
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Accédez à votre espace médical sécurisé
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            
            {/* Affichage des erreurs */}
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* Formulaire */}
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Champ Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  Adresse email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  placeholder="votre@email.com"
                  disabled={isLoading}
                  required
                  autoComplete="email"
                  className="h-12 px-4 bg-white/50 border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200"
                />
              </div>

              {/* Champ Mot de passe */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-gray-500" />
                  Mot de passe
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    placeholder="••••••••"
                    disabled={isLoading}
                    required
                    autoComplete="current-password"
                    className="h-12 px-4 pr-12 bg-white/50 border-gray-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100/50"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-500" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <span className="ml-2 text-sm text-gray-600">Se souvenir de moi</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              {/* Bouton de connexion */}
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Connexion en cours...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Se connecter</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </Button>
            </form>

            {/* Lien d'inscription */}
            <div className="pt-6 border-t border-gray-200/50">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  Pas encore de compte ?
                </p>
                <Link to="/register">
                  <Button
                    variant="outline"
                    className="group px-6 py-3 bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <UserPlus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Créer un compte
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations de sécurité */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🔒 Connexion sécurisée • Vos données sont protégées
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
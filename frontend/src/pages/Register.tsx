import React, { useState } from 'react';
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
  LogIn, 
  ArrowLeft, 
  User, 
  Shield, 
  Stethoscope, 
  Users,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false
  });
  const [formSubmitted, setFormSubmitted] = useState(false); // Nouvelle protection
  const navigate = useNavigate();

  const roleOptions = [
    { 
      value: 'user', 
      label: 'Patient', 
      icon: User, 
      description: 'Accès aux informations personnelles et dossier médical',
      color: 'text-blue-600 bg-blue-100 border-blue-200'
    },
    { 
      value: 'doctor', 
      label: 'Médecin', 
      icon: Stethoscope, 
      description: 'Accès complet aux dossiers patients et prescriptions',
      color: 'text-green-600 bg-green-100 border-green-200'
    },
    { 
      value: 'nurse', 
      label: 'Personnel Soignant', 
      icon: Shield, 
      description: 'Gestion des patients et administration des soins',
      color: 'text-purple-600 bg-purple-100 border-purple-200'
    },
    { 
      value: 'admin', 
      label: 'Administrateur', 
      icon: Shield, 
      description: 'Administration complète du système',
      color: 'text-red-600 bg-red-100 border-red-200'
    }
  ];

  // Validation du mot de passe en temps réel
  const checkPasswordStrength = (password: string) => {
    setPasswordStrength({
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password)
    });
  };

  const validateForm = () => {
    // Validation email
    if (!formData.email.trim()) {
      setError('L\'adresse email est requise');
      return false;
    }
    
    if (!formData.email.includes('@') || !formData.email.includes('.')) {
      setError('Veuillez entrer une adresse email valide');
      return false;
    }
    
    // Validation mot de passe
    if (!formData.password) {
      setError('Le mot de passe est requis');
      return false;
    }
    
    const strengthChecks = Object.values(passwordStrength);
    if (!strengthChecks.every(check => check)) {
      setError('Le mot de passe ne respecte pas tous les critères de sécurité');
      return false;
    }
    
    // Validation confirmation mot de passe
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    
    // Validation rôle
    if (!formData.role) {
      setError('Veuillez sélectionner un rôle');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Debug des données du formulaire
    console.log('🔍 État du formulaire avant validation:', formData);
    console.log('🔍 Validation password strength:', passwordStrength);
    
    if (!validateForm()) {
      console.log('❌ Validation du formulaire échouée');
      return;
    }
    
    // Vérification supplémentaire des données
    if (!formData.email.trim() || !formData.password || !formData.role) {
      setError('Tous les champs sont obligatoires');
      console.log('❌ Champs manquants:', {
        email: !formData.email.trim(),
        password: !formData.password,
        role: !formData.role
      });
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('🔄 Tentative de création de compte pour:', formData.email);
      console.log('📤 Données envoyées:', {
        email: formData.email.trim().toLowerCase(),
        password: '[MASKED]', // Ne pas logger le mot de passe
        role: formData.role
      });

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          role: formData.role
        }),
      });

      console.log('📡 Statut de la réponse:', response.status);

      const data = await response.json();
      console.log('📦 Données reçues:', data);

      // Afficher les détails de validation si disponibles
      if (data.errors && Array.isArray(data.errors)) {
        console.log('🔍 Erreurs de validation détaillées:', data.errors);
        data.errors.forEach((error: any, index: number) => {
          console.log(`   ${index + 1}. ${error.field}: ${error.message}`);
        });
      }

      // Gestion spéciale de l'erreur 429 (Rate Limiting)
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') || '60';
        throw new Error(`Trop de tentatives. Réessayez dans ${retryAfter} secondes ou redémarrez le serveur backend.`);
      }

      if (!response.ok) {
        // Affichage d'erreur plus détaillé
        let errorMessage = data.message || `Erreur ${response.status}: ${response.statusText}`;
        
        if (data.errors && Array.isArray(data.errors)) {
          const errorDetails = data.errors.map((err: any) => `${err.field}: ${err.message}`).join('\n');
          errorMessage += `\n\nDétails:\n${errorDetails}`;
        }
        
        throw new Error(errorMessage);
      }

      if (!data.success) {
        throw new Error(data.message || 'Erreur lors de la création du compte');
      }

      console.log('✅ Compte créé avec succès pour:', data.user?.email);

      setSuccess('Compte créé avec succès ! Redirection vers la page de connexion...');
      setError('');
      
      // Réinitialiser le formulaire
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        role: 'user'
      });
      
      // Redirection après un délai pour afficher le message de succès
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.',
            email: formData.email 
          }
        });
      }, 2000);

    } catch (err: any) {
      console.error('❌ Erreur création compte:', err);
      setError(err.message || 'Erreur lors de la création du compte');
      setSuccess('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log(`🔄 Champ ${field} modifié:`, value);
    
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      console.log('📝 Nouvel état formData:', newData);
      return newData;
    });
    
    if (field === 'password') {
      checkPasswordStrength(value);
    }
    
    if (error) setError(''); // Effacer l'erreur lors de la saisie
  };

  const handleRoleSelect = (role: string) => {
    console.log('🔄 Rôle sélectionné:', role);
    setFormData(prev => {
      const newData = { ...prev, role };
      console.log('📝 Nouvel état formData après sélection rôle:', newData);
      return newData;
    });
    if (error) setError('');
  };

  const selectedRole = roleOptions.find(role => role.value === formData.role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 relative overflow-hidden flex items-center justify-center">
      
      {/* Éléments décoratifs de fond */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-200/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-purple-200/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Conteneur principal */}
      <div className="relative z-10 w-full max-w-lg mx-4">
        
        {/* Bouton retour */}
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
            <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Créer un compte
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Rejoignez notre plateforme médicale sécurisée
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            
            {/* Affichage des messages */}
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {success}
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
                  className="h-12 px-4 bg-white/50 border-gray-200 focus:border-green-400 focus:ring-green-400/20 transition-all duration-200"
                />
              </div>

              {/* Sélection du rôle */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  Type de compte
                </label>
                <div className="grid gap-3">
                  {roleOptions.map((role) => {
                    const IconComponent = role.icon;
                    const isSelected = formData.role === role.value;
                    
                    return (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => handleRoleSelect(role.value)}
                        disabled={isLoading}
                        className={`
                          relative p-4 rounded-xl border-2 text-left transition-all duration-200 group
                          ${isSelected 
                            ? `${role.color} border-current shadow-md` 
                            : 'bg-white/50 border-gray-200 hover:border-gray-300 hover:bg-white/70'
                          }
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`
                            p-2 rounded-lg transition-colors
                            ${isSelected ? 'bg-white/20' : 'bg-gray-100'}
                          `}>
                            <IconComponent className={`
                              w-5 h-5 transition-colors
                              ${isSelected ? role.color.split(' ')[0] : 'text-gray-600'}
                            `} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className={`
                                font-medium transition-colors
                                ${isSelected ? role.color.split(' ')[0] : 'text-gray-900'}
                              `}>
                                {role.label}
                              </h3>
                              {isSelected && (
                                <CheckCircle className={`w-4 h-4 ${role.color.split(' ')[0]}`} />
                              )}
                            </div>
                            <p className={`
                              text-sm mt-1 transition-colors
                              ${isSelected ? role.color.split(' ')[0] : 'text-gray-600'}
                            `}>
                              {role.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
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
                    autoComplete="new-password"
                    className="h-12 px-4 pr-12 bg-white/50 border-gray-200 focus:border-green-400 focus:ring-green-400/20 transition-all duration-200"
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

                {/* Indicateurs de force du mot de passe */}
                {formData.password && (
                  <div className="mt-3 space-y-2">
                    <div className="text-xs font-medium text-gray-700">Critères de sécurité :</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={`flex items-center gap-2 ${passwordStrength.length ? 'text-green-600' : 'text-gray-400'}`}>
                        {passwordStrength.length ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        8 caractères min.
                      </div>
                      <div className={`flex items-center gap-2 ${passwordStrength.lowercase ? 'text-green-600' : 'text-gray-400'}`}>
                        {passwordStrength.lowercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        Minuscule
                      </div>
                      <div className={`flex items-center gap-2 ${passwordStrength.uppercase ? 'text-green-600' : 'text-gray-400'}`}>
                        {passwordStrength.uppercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        Majuscule
                      </div>
                      <div className={`flex items-center gap-2 ${passwordStrength.number ? 'text-green-600' : 'text-gray-400'}`}>
                        {passwordStrength.number ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        Chiffre
                      </div>
                      <div className={`flex items-center gap-2 ${passwordStrength.special ? 'text-green-600' : 'text-gray-400'}`}>
                        {passwordStrength.special ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        Caractère spécial
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirmation mot de passe */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-gray-500" />
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange('confirmPassword')}
                    placeholder="••••••••"
                    disabled={isLoading}
                    required
                    autoComplete="new-password"
                    className="h-12 px-4 pr-12 bg-white/50 border-gray-200 focus:border-green-400 focus:ring-green-400/20 transition-all duration-200"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100/50"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-500" />
                    )}
                  </Button>
                </div>

                {/* Validation de correspondance */}
                {formData.confirmPassword && (
                  <div className={`flex items-center gap-2 text-xs mt-2 ${
                    formData.password === formData.confirmPassword ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formData.password === formData.confirmPassword ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      <X className="w-3 h-3" />
                    )}
                    {formData.password === formData.confirmPassword 
                      ? 'Les mots de passe correspondent' 
                      : 'Les mots de passe ne correspondent pas'
                    }
                  </div>
                )}
              </div>

              {/* Bouton de création */}
              <Button
                type="submit"
                disabled={isLoading || !Object.values(passwordStrength).every(Boolean) || formData.password !== formData.confirmPassword}
                className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Création du compte...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>Créer mon compte</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </Button>
            </form>

            {/* Lien de connexion */}
            <div className="pt-6 border-t border-gray-200/50">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  Déjà un compte ?
                </p>
                <Link to="/login">
                  <Button
                    variant="outline"
                    className="group px-6 py-3 bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <LogIn className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Se connecter
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations de sécurité */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            🔒 Inscription sécurisée • Vos données sont protégées • Conformité RGPD
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
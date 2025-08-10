import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import React from 'react';
import { Eye, EyeOff, Mail, Lock, Heart, AlertCircle, CheckCircle, Loader2, LogIn, ArrowLeft, User, Shield, Stethoscope, Users } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Patient');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      if (!res.ok) throw new Error('Erreur lors de l\'enregistrement');

      setSuccess('Utilisateur créé avec succès.');
      setError('');
      setEmail('');
      setPassword('');
      setRole('Patient');
      
      // Délai pour afficher le message de succès
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message);
      setSuccess('');
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    { 
      value: 'Patient', 
      label: 'Patient', 
      icon: User, 
      description: 'Accès aux informations personnelles',
      color: 'text-blue-600 bg-blue-100'
    },
    { 
      value: 'Doctor', 
      label: 'Médecin', 
      icon: Stethoscope, 
      description: 'Accès complet aux dossiers patients',
      color: 'text-green-600 bg-green-100'
    },
    { 
      value: 'Administrator', 
      label: 'Aide Soignant', 
      icon: Shield, 
      description: 'Gestion des patients et soins',
      color: 'text-purple-600 bg-purple-100'
    }
  ];

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
        
        {/* Bouton retour */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/login')}
            className="group inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-sm text-gray-700 hover:bg-white hover:shadow-md transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Retour à la connexion
          </button>
        </div>

        {/* Carte d'inscription */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-8">
          
          {/* En-tête */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
              Inscription
            </h1>
            <p className="text-gray-600">Créez votre compte portail aide soignant</p>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="mb-6 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            </div>
          )}

          {/* Message de succès */}
          {success && (
            <div className="mb-6 p-4 bg-green-50/80 backdrop-blur-sm border border-green-200/50 rounded-xl">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-800 font-medium">{success}</p>
              </div>
            </div>
          )}

          {/* Formulaire */}
          <div className="space-y-6">
            
            {/* Champ email */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="votre.email@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 shadow-sm hover:shadow-md placeholder-gray-400"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Champ mot de passe */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 shadow-sm hover:shadow-md placeholder-gray-400"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Sélection du rôle */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                Type de compte
              </label>
              
              <div className="space-y-2">
                {roleOptions.map((option) => (
                  <label
                    key={option.value}
                    className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                      role === option.value
                        ? 'border-green-500 bg-green-50/50'
                        : 'border-gray-200 hover:border-gray-300 bg-white/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={role === option.value}
                      onChange={(e) => setRole(e.target.value)}
                      className="sr-only"
                      disabled={isLoading}
                    />
                    
                    <div className={`p-2 rounded-lg mr-3 ${option.color}`}>
                      <option.icon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">{option.label}</span>
                        {role === option.value && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Bouton d'inscription */}
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading}
              className="group relative w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none"></div>
            </button>
          </div>

          {/* Lien de connexion */}
          <div className="mt-8 pt-6 border-t border-gray-200/50">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                Déjà un compte ?
              </p>
              <Link
                to="/login"
                className="group inline-flex items-center gap-2 px-6 py-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
              >
                <LogIn className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
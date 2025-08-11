import React, { useState, useCallback, useEffect, memo } from 'react';
import { 
  Globe, 
  ChevronDown, 
  Check, 
  Settings, 
  Translate,
  Volume2,
  VolumeX,
  Download,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuGroup
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';

// Interface pour une langue
interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
  isRTL?: boolean;
  icnpSupport?: boolean;
  translationProgress?: number;
  isOfflineAvailable?: boolean;
  lastUpdated?: string;
}

// Interface pour les préférences linguistiques
interface LanguagePreferences {
  primaryLanguage: string;
  fallbackLanguage: string;
  autoDetect: boolean;
  useVoiceAssistant: boolean;
  downloadOfflineMode: boolean;
  showTransliteration: boolean;
}

// Props du composant
interface LanguageSelectorProps {
  // Variantes d'affichage
  variant?: 'default' | 'compact' | 'minimal' | 'advanced' | 'floating';
  position?: 'header' | 'sidebar' | 'floating' | 'footer';
  size?: 'sm' | 'md' | 'lg';
  
  // Fonctionnalités
  showProgress?: boolean;
  showRegion?: boolean;
  showIcnpSupport?: boolean;
  showOfflineStatus?: boolean;
  enableVoiceAssistant?: boolean;
  enableOfflineMode?: boolean;
  enableAutoDetect?: boolean;
  
  // Données et callbacks
  currentLanguage?: string;
  availableLanguages?: Language[];
  preferences?: LanguagePreferences;
  onLanguageChange?: (language: string, previousLanguage?: string) => void;
  onPreferencesChange?: (preferences: Partial<LanguagePreferences>) => void;
  onDownloadLanguage?: (languageCode: string) => void;
  
  // Personnalisation
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

// Langues supportées enrichies
const defaultLanguages: Language[] = [
  { 
    code: 'fr', 
    name: 'Français', 
    nativeName: 'Français', 
    flag: '🇫🇷', 
    region: 'Europe',
    icnpSupport: true,
    translationProgress: 100,
    isOfflineAvailable: true,
    lastUpdated: '2024-02-01'
  },
  { 
    code: 'en', 
    name: 'Anglais', 
    nativeName: 'English', 
    flag: '🇬🇧', 
    region: 'Europe',
    icnpSupport: true,
    translationProgress: 100,
    isOfflineAvailable: true,
    lastUpdated: '2024-02-01'
  },
  { 
    code: 'es', 
    name: 'Espagnol', 
    nativeName: 'Español', 
    flag: '🇪🇸', 
    region: 'Europe',
    icnpSupport: true,
    translationProgress: 95,
    isOfflineAvailable: true,
    lastUpdated: '2024-01-15'
  },
  { 
    code: 'de', 
    name: 'Allemand', 
    nativeName: 'Deutsch', 
    flag: '🇩🇪', 
    region: 'Europe',
    icnpSupport: true,
    translationProgress: 90,
    isOfflineAvailable: false,
    lastUpdated: '2024-01-10'
  },
  { 
    code: 'it', 
    name: 'Italien', 
    nativeName: 'Italiano', 
    flag: '🇮🇹', 
    region: 'Europe',
    icnpSupport: true,
    translationProgress: 85,
    isOfflineAvailable: false,
    lastUpdated: '2024-01-05'
  },
  { 
    code: 'pt', 
    name: 'Portugais', 
    nativeName: 'Português', 
    flag: '🇵🇹', 
    region: 'Europe',
    icnpSupport: true,
    translationProgress: 80,
    isOfflineAvailable: false,
    lastUpdated: '2023-12-20'
  },
  { 
    code: 'nl', 
    name: 'Néerlandais', 
    nativeName: 'Nederlands', 
    flag: '🇳🇱', 
    region: 'Europe',
    icnpSupport: true,
    translationProgress: 75,
    isOfflineAvailable: false,
    lastUpdated: '2023-12-15'
  },
  { 
    code: 'ar', 
    name: 'Arabe', 
    nativeName: 'العربية', 
    flag: '🇸🇦', 
    region: 'Moyen-Orient',
    isRTL: true,
    icnpSupport: false,
    translationProgress: 45,
    isOfflineAvailable: false,
    lastUpdated: '2023-11-30'
  },
  { 
    code: 'zh', 
    name: 'Chinois', 
    nativeName: '中文', 
    flag: '🇨🇳', 
    region: 'Asie',
    icnpSupport: false,
    translationProgress: 30,
    isOfflineAvailable: false,
    lastUpdated: '2023-11-20'
  },
  { 
    code: 'ja', 
    name: 'Japonais', 
    nativeName: '日本語', 
    flag: '🇯🇵', 
    region: 'Asie',
    icnpSupport: false,
    translationProgress: 25,
    isOfflineAvailable: false,
    lastUpdated: '2023-11-15'
  }
];

// Hook pour gérer les préférences linguistiques
const useLanguagePreferences = (initialLanguage?: string) => {
  const [preferences, setPreferences] = useState<LanguagePreferences>(() => {
    const saved = localStorage.getItem('languagePreferences');
    return saved ? JSON.parse(saved) : {
      primaryLanguage: initialLanguage || 'fr',
      fallbackLanguage: 'en',
      autoDetect: true,
      useVoiceAssistant: false,
      downloadOfflineMode: false,
      showTransliteration: false
    };
  });

  const updatePreferences = useCallback((updates: Partial<LanguagePreferences>) => {
    setPreferences(prev => {
      const newPrefs = { ...prev, ...updates };
      localStorage.setItem('languagePreferences', JSON.stringify(newPrefs));
      return newPrefs;
    });
  }, []);

  return { preferences, updatePreferences };
};

const LanguageSelector: React.FC<LanguageSelectorProps> = memo(({ 
  variant = 'default',
  position = 'header',
  size = 'md',
  showProgress = false,
  showRegion = false,
  showIcnpSupport = true,
  showOfflineStatus = false,
  enableVoiceAssistant = false,
  enableOfflineMode = false,
  enableAutoDetect = true,
  currentLanguage,
  availableLanguages = defaultLanguages,
  onLanguageChange,
  onPreferencesChange,
  onDownloadLanguage,
  className = '',
  disabled = false,
  loading = false
}) => {
  const { preferences, updatePreferences } = useLanguagePreferences(currentLanguage);
  const [isOpen, setIsOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);

  const selectedLanguage = availableLanguages.find(
    lang => lang.code === (currentLanguage || preferences.primaryLanguage)
  ) || availableLanguages[0];

  // Auto-détection de la langue du navigateur
  useEffect(() => {
    if (enableAutoDetect && preferences.autoDetect && !currentLanguage) {
      const browserLang = navigator.language.split('-')[0];
      const supportedLang = availableLanguages.find(lang => lang.code === browserLang);
      if (supportedLang) {
        handleLanguageSelect(supportedLang);
      }
    }
  }, [enableAutoDetect, preferences.autoDetect, currentLanguage, availableLanguages]);

  // Gestion de la sélection de langue
  const handleLanguageSelect = useCallback((language: Language) => {
    const previousLanguage = selectedLanguage.code;
    setIsOpen(false);
    
    updatePreferences({ primaryLanguage: language.code });
    onLanguageChange?.(language.code, previousLanguage);
    
    // Mise à jour de la direction RTL
    if (language.isRTL) {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = language.code;
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = language.code;
    }
    
    console.log('Langue changée:', { from: previousLanguage, to: language.code });
  }, [selectedLanguage, updatePreferences, onLanguageChange]);

  // Gestion du téléchargement hors ligne
  const handleDownloadLanguage = useCallback((language: Language) => {
    onDownloadLanguage?.(language.code);
    // Simulation du téléchargement
    console.log('Téléchargement de la langue:', language.name);
  }, [onDownloadLanguage]);

  // Gestion des préférences
  const handlePreferenceChange = useCallback((key: keyof LanguagePreferences, value: any) => {
    const updates = { [key]: value };
    updatePreferences(updates);
    onPreferencesChange?.(updates);
  }, [updatePreferences, onPreferencesChange]);

  // Configuration des tailles
  const getSizeConfig = () => {
    switch (size) {
      case 'sm':
        return { buttonClass: 'px-2 py-1 text-sm', iconSize: 'w-3 h-3', flagSize: 'text-sm' };
      case 'lg':
        return { buttonClass: 'px-5 py-3 text-lg', iconSize: 'w-6 h-6', flagSize: 'text-2xl' };
      default:
        return { buttonClass: 'px-3 py-2 text-sm', iconSize: 'w-4 h-4', flagSize: 'text-lg' };
    }
  };

  const sizeConfig = getSizeConfig();

  // Composant LanguageItem
  const LanguageItem: React.FC<{ 
    language: Language; 
    isSelected: boolean; 
    onSelect: () => void;
    showDetails?: boolean;
  }> = ({ language, isSelected, onSelect, showDetails = false }) => (
    <button
      onClick={onSelect}
      disabled={disabled || loading}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
        isSelected
          ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
          : 'hover:bg-gray-50 text-gray-700 border border-transparent hover:border-gray-200'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span className="text-xl flex-shrink-0">{language.flag}</span>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate">{language.name}</p>
          {showIcnpSupport && language.icnpSupport && (
            <Badge variant="outline" className="text-xs">ICNP</Badge>
          )}
          {showOfflineStatus && language.isOfflineAvailable && (
            <Wifi className="w-3 h-3 text-green-600" />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <p className="text-sm text-gray-500 truncate">{language.nativeName}</p>
          {showRegion && (
            <span className="text-xs text-gray-400">• {language.region}</span>
          )}
        </div>
        
        {showDetails && showProgress && language.translationProgress !== undefined && (
          <div className="mt-1">
            <div className="flex items-center gap-2">
              <Progress value={language.translationProgress} className="h-1 flex-1" />
              <span className="text-xs text-gray-500">{language.translationProgress}%</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {showDetails && enableOfflineMode && !language.isOfflineAvailable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadLanguage(language);
            }}
            className="p-1"
          >
            <Download className="w-3 h-3" />
          </Button>
        )}
        
        <span className="text-xs font-mono text-gray-400">
          {language.code.toUpperCase()}
        </span>
        
        {isSelected && (
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    </button>
  );

  // Version minimale pour floating
  if (variant === 'minimal') {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled || loading}
            className={`w-10 h-10 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-full shadow-lg text-gray-700 hover:bg-white hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center ${className}`}
          >
            <Globe className={sizeConfig.iconSize} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="end">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200/50">
              <Globe className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-900">Langue</span>
            </div>
            <div className="space-y-1">
              {availableLanguages.slice(0, 6).map((language) => (
                <LanguageItem
                  key={language.code}
                  language={language}
                  isSelected={selectedLanguage.code === language.code}
                  onSelect={() => handleLanguageSelect(language)}
                />
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Version compacte pour header
  if (variant === 'compact') {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            disabled={disabled || loading}
            className={`inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg shadow-sm text-gray-700 hover:bg-white hover:shadow-md transition-all duration-200 ${sizeConfig.buttonClass} ${className}`}
          >
            <span className={sizeConfig.flagSize}>{selectedLanguage.flag}</span>
            <span className="font-medium hidden sm:inline">
              {selectedLanguage.code.toUpperCase()}
            </span>
            <ChevronDown className={`${sizeConfig.iconSize} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Choisir la langue</DropdownMenuLabel>
          {availableLanguages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageSelect(language)}
              className="flex items-center gap-3"
            >
              <span className="text-lg">{language.flag}</span>
              <div className="flex-1">
                <p className="font-medium">{language.name}</p>
                <p className="text-xs text-gray-500">{language.nativeName}</p>
              </div>
              {selectedLanguage.code === language.code && (
                <Check className="w-4 h-4 text-blue-600" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Version avancée avec préférences
  if (variant === 'advanced') {
    return (
      <div className="flex items-center gap-2">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              disabled={disabled || loading}
              className={`inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ${className}`}
            >
              <div className="p-2 bg-blue-100 rounded-lg">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">{selectedLanguage.name}</p>
                <p className="text-xs text-gray-500">{selectedLanguage.nativeName}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedLanguage.flag}</span>
                {showIcnpSupport && selectedLanguage.icnpSupport && (
                  <Badge variant="outline" className="text-xs">ICNP</Badge>
                )}
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center gap-2">
              <Translate className="w-4 h-4" />
              Sélectionner la langue
            </DropdownMenuLabel>
            <div className="max-h-64 overflow-auto p-2 space-y-1">
              {availableLanguages.map((language) => (
                <LanguageItem
                  key={language.code}
                  language={language}
                  isSelected={selectedLanguage.code === language.code}
                  onSelect={() => handleLanguageSelect(language)}
                  showDetails={true}
                />
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Bouton des préférences */}
        <DropdownMenu open={isPreferencesOpen} onOpenChange={setIsPreferencesOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="p-2">
              <Settings className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Préférences linguistiques</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem 
                onClick={() => handlePreferenceChange('autoDetect', !preferences.autoDetect)}
                className="flex items-center gap-2"
              >
                <input 
                  type="checkbox" 
                  checked={preferences.autoDetect}
                  onChange={() => {}}
                  className="w-4 h-4"
                />
                Détection automatique
              </DropdownMenuItem>
              
              {enableVoiceAssistant && (
                <DropdownMenuItem 
                  onClick={() => handlePreferenceChange('useVoiceAssistant', !preferences.useVoiceAssistant)}
                  className="flex items-center gap-2"
                >
                  {preferences.useVoiceAssistant ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                  Assistant vocal
                </DropdownMenuItem>
              )}
              
              {enableOfflineMode && (
                <DropdownMenuItem 
                  onClick={() => handlePreferenceChange('downloadOfflineMode', !preferences.downloadOfflineMode)}
                  className="flex items-center gap-2"
                >
                  {preferences.downloadOfflineMode ? (
                    <Wifi className="w-4 h-4" />
                  ) : (
                    <WifiOff className="w-4 h-4" />
                  )}
                  Mode hors ligne
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  // Version par défaut
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled || loading}
          className={`inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-sm text-gray-700 hover:bg-white hover:shadow-md transition-all duration-300 ${sizeConfig.buttonClass} ${className}`}
        >
          <div className="p-2 bg-blue-100 rounded-lg">
            <Globe className={`${sizeConfig.iconSize} text-blue-600`} />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium">{selectedLanguage.name}</p>
            <p className="text-xs text-gray-500">{selectedLanguage.nativeName}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={sizeConfig.flagSize}>{selectedLanguage.flag}</span>
            <ChevronDown className={`${sizeConfig.iconSize} transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-600" />
          Sélectionner la langue
        </DropdownMenuLabel>
        <div className="p-2 space-y-2 max-h-64 overflow-auto">
          {availableLanguages.map((language) => (
            <LanguageItem
              key={language.code}
              language={language}
              isSelected={selectedLanguage.code === language.code}
              onSelect={() => handleLanguageSelect(language)}
              showDetails={showProgress || showOfflineStatus}
            />
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

LanguageSelector.displayName = 'LanguageSelector';

export default LanguageSelector;
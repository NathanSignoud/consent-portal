import { useState } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';

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
  { code: 'pt', name: 'Portugais', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'nl', name: 'Néerlandais', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'ar', name: 'Arabe', nativeName: 'العربية', flag: '🇸🇦' }
];

interface LanguageSelectorProps {
  variant?: 'default' | 'compact' | 'minimal';
  position?: 'header' | 'sidebar' | 'floating';
  onLanguageChange?: (language: string) => void;
}

const LanguageSelector = ({ 
  variant = 'default', 
  position = 'header',
  onLanguageChange 
}: LanguageSelectorProps) => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(languages[0]);
  const [isOpen, setIsOpen] = useState(false);

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
    setIsOpen(false);
    onLanguageChange?.(language.code);
    console.log('Langue sélectionnée:', language);
  };

  // Version compacte pour header
  if (variant === 'compact') {
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
        )}
      </div>
    );
  }

  // Version minimale pour floating
  if (variant === 'minimal') {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="group w-10 h-10 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-full shadow-lg text-gray-700 hover:bg-white hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center"
        >
          <Globe className="w-5 h-5" />
        </button>

        {isOpen && (
          <div className="absolute bottom-full right-0 mb-2 w-56 bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg z-50">
            <div className="p-3">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200/50">
                <Globe className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-gray-900">Choisir la langue</span>
              </div>
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
        )}
      </div>
    );
  }

  // Version par défaut (complète)
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group inline-flex items-center gap-3 px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-sm text-gray-700 hover:bg-white hover:shadow-md transition-all duration-300"
      >
        <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-all duration-200">
          <Globe className="w-5 h-5 text-blue-600 group-hover:text-white" />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium">{selectedLanguage.name}</p>
          <p className="text-xs text-gray-500">{selectedLanguage.nativeName}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl">{selectedLanguage.flag}</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg z-50">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-200/50">
              <Globe className="w-5 h-5 text-blue-600" />
              <span className="text-lg font-semibold text-gray-900">Sélectionner la langue</span>
            </div>
            
            <div className="space-y-2">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageSelect(language)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                    selectedLanguage.code === language.code
                      ? 'bg-blue-50 text-blue-700 border-2 border-blue-200 shadow-sm'
                      : 'hover:bg-gray-50 text-gray-700 border-2 border-transparent'
                  }`}
                >
                  <span className="text-2xl">{language.flag}</span>
                  <div className="flex-1">
                    <p className="font-semibold">{language.name}</p>
                    <p className="text-sm text-gray-500">{language.nativeName}</p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs font-mono text-gray-400 mr-2">{language.code.toUpperCase()}</span>
                    {selectedLanguage.code === language.code && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
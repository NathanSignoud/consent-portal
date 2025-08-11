import { useState, useEffect } from "react";
import { Plus, X, Clock, CheckSquare, Search, Tag } from "lucide-react";

interface Action {
  id?: string;
  label: string;
  status: 'à faire' | 'réalisé';
  date?: string | null;
  createdAt?: string;
  completedAt?: string;
  category?: string;
  priority?: 'basse' | 'normale' | 'haute' | 'urgente';
  description?: string;
}

interface ActionFormProps {
  onAddAction: (action: Omit<Action, 'id'>) => void;
  onCancel?: () => void;
  isVisible: boolean;
  disabled?: boolean;
  initialData?: Partial<Action>;
  showAdvanced?: boolean;
  placeholder?: string;
  title?: string;
  submitText?: string;
  mode?: 'inline' | 'modal' | 'compact';
}

// Actions prédéfinies pour faciliter la saisie (à terme, cela viendra de la BDD)
const PREDEFINED_ACTIONS = [
  { label: "Contrôle de la tension artérielle", category: "Surveillance" },
  { label: "Prise de médicament", category: "Traitement" },
  { label: "Toilette", category: "Soins d'hygiène" },
  { label: "Aide au repas", category: "Nutrition" },
  { label: "Mobilisation", category: "Kinésithérapie" },
  { label: "Pansement", category: "Soins techniques" },
  { label: "Surveillance glycémie", category: "Surveillance" },
  { label: "Entretien avec la famille", category: "Communication" },
  { label: "Évaluation douleur", category: "Surveillance" },
  { label: "Aide à la marche", category: "Mobilité" }
];

const CATEGORIES = [
  "Surveillance",
  "Traitement", 
  "Soins d'hygiène",
  "Nutrition",
  "Kinésithérapie",
  "Soins techniques",
  "Communication",
  "Mobilité",
  "Administration",
  "Autre"
];

const ActionForm = ({
  onAddAction,
  onCancel,
  isVisible,
  disabled = false,
  initialData = {},
  showAdvanced = false,
  placeholder = "Titre de l'action...",
  title = "Nouvelle action",
  submitText = "Ajouter",
  mode = 'inline'
}: ActionFormProps) => {
  const [formData, setFormData] = useState<Partial<Action>>({
    label: '',
    status: 'à faire',
    category: '',
    priority: 'normale',
    description: '',
    ...initialData
  });
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState(PREDEFINED_ACTIONS);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  useEffect(() => {
    if (formData.label) {
      const filtered = PREDEFINED_ACTIONS.filter(action =>
        action.label.toLowerCase().includes(formData.label!.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0 && formData.label.length > 1);
    } else {
      setShowSuggestions(false);
    }
  }, [formData.label]);

  const handleSubmit = () => {
    if (!formData.label?.trim()) return;

    const newAction: Omit<Action, 'id'> = {
      label: formData.label.trim(),
      status: formData.status || 'à faire',
      category: formData.category || undefined,
      priority: formData.priority || 'normale',
      description: formData.description || undefined,
      createdAt: new Date().toISOString(),
      date: formData.status === 'réalisé' ? new Date().toISOString() : null,
      completedAt: formData.status === 'réalisé' ? new Date().toISOString() : undefined
    };

    onAddAction(newAction);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      label: '',
      status: 'à faire',
      category: '',
      priority: 'normale',
      description: ''
    });
    setShowSuggestions(false);
    setIsAdvancedOpen(false);
  };

  const handleCancel = () => {
    resetForm();
    onCancel?.();
  };

  const selectSuggestion = (suggestion: typeof PREDEFINED_ACTIONS[0]) => {
    setFormData(prev => ({
      ...prev,
      label: suggestion.label,
      category: suggestion.category
    }));
    setShowSuggestions(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isVisible) return null;

  const formContent = (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center gap-2">
        <Plus className="w-4 h-4 text-blue-500" />
        <h4 className="font-medium text-gray-900">{title}</h4>
      </div>

      {/* Champ principal */}
      <div className="relative">
        <input
          type="text"
          value={formData.label || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white/80"
          onKeyPress={handleKeyPress}
          disabled={disabled}
          autoFocus
        />

        {/* Suggestions */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {filteredSuggestions.slice(0, 5).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => selectSuggestion(suggestion)}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
              >
                <Search className="w-3 h-3 text-gray-400" />
                <span className="flex-1">{suggestion.label}</span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {suggestion.category}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Statut initial */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-gray-700">Statut :</span>
        <div className="flex gap-2">
          <button
            onClick={() => setFormData(prev => ({ ...prev, status: 'à faire' }))}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              formData.status === 'à faire'
                ? 'bg-orange-100 text-orange-700 border border-orange-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            disabled={disabled}
          >
            <Clock className="w-3 h-3 inline mr-1" />
            À faire
          </button>
          <button
            onClick={() => setFormData(prev => ({ ...prev, status: 'réalisé' }))}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              formData.status === 'réalisé'
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            disabled={disabled}
          >
            <CheckSquare className="w-3 h-3 inline mr-1" />
            Réalisé
          </button>
        </div>
      </div>

      {/* Options avancées */}
      {showAdvanced && (
        <>
          <button
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            disabled={disabled}
          >
            {isAdvancedOpen ? 'Masquer' : 'Afficher'} les options avancées
          </button>

          {isAdvancedOpen && (
            <div className="space-y-3 p-3 bg-gray-50/50 rounded-lg">
              {/* Catégorie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie
                </label>
                <select
                  value={formData.category || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white text-sm"
                  disabled={disabled}
                >
                  <option value="">Sélectionner une catégorie</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Priorité */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priorité
                </label>
                <select
                  value={formData.priority || 'normale'}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white text-sm"
                  disabled={disabled}
                >
                  <option value="basse">Basse</option>
                  <option value="normale">Normale</option>
                  <option value="haute">Haute</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optionnelle)
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Précisions sur l'action à effectuer..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 bg-white text-sm resize-none"
                  disabled={disabled}
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Boutons d'action */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSubmit}
          disabled={!formData.label?.trim() || disabled}
          className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
        >
          {disabled ? "..." : submitText}
        </button>
        
        {onCancel && (
          <button
            onClick={handleCancel}
            disabled={disabled}
            className="px-3 py-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  // Modes d'affichage différents
  if (mode === 'modal') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
          {formContent}
        </div>
      </div>
    );
  }

  if (mode === 'compact') {
    return (
      <div className="p-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-sm">
        {formContent}
      </div>
    );
  }

  // Mode inline par défaut
  return (
    <div className="p-4 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-sm">
      {formContent}
    </div>
  );
};

export default ActionForm;
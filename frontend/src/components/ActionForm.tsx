import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  X, 
  ChevronDown, 
  User, 
  Calendar, 
  FileText, 
  Clock,
  AlertCircle,
  CheckCircle,
  Tag,
  Stethoscope,
  Activity,
  Loader2,
  BookOpen,
  Hash,
  Globe,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem 
} from '@/components/ui/command';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  IcnpData, 
  IcnpSearchResult, 
  PatientAction,
  Patient2
} from '@/types';

interface ActionFormProps {
  // Props de base pour compatibilité
  isVisible?: boolean;
  onCancel?: () => void;
  onAddAction?: (action: Omit<PatientAction, 'id'>) => void;
  disabled?: boolean;
  title?: string;
  placeholder?: string;
  
  // Nouvelles props ICNP
  patientId?: string;
  patientName?: string;
  patients?: Patient2[];
  showPatientSelector?: boolean;
  
  // Configuration avancée
  mode?: 'simple' | 'detailed' | 'expert';
  showIcnpDetails?: boolean;
  showSuggestions?: boolean;
  allowCustomActions?: boolean;
  
  // Callbacks ICNP
  onSearchIcnp?: (query: string) => Promise<IcnpSearchResult[]>;
  onActionCreate?: (actionData: ActionFormData) => void;
  onActionUpdate?: (actionId: string, data: Partial<ActionFormData>) => void;
  
  // Édition d'action existante
  editingAction?: PatientAction;
  isEditing?: boolean;
}

interface ActionFormData {
  // Champs de base
  label: string;
  status: 'à faire' | 'réalisé';
  priority: 'basse' | 'normale' | 'haute' | 'urgente';
  category?: string;
  description?: string;
  notes?: string;
  estimatedDuration?: number;
  
  // Données ICNP
  icnp: IcnpData | null;
  
  // Données patient
  patientId?: string;
  patientName?: string;
  
  // Métadonnées
  createdAt?: string;
  completedAt?: string;
  assignedTo?: string;
  tags?: string[];
}

// Actions prédéfinies compatibles ICNP
const PREDEFINED_ACTIONS = [
  {
    label: "Surveillance des signes vitaux",
    category: "Surveillance",
    icnpCode: "10032101",
    description: "Contrôle tension, pouls, température"
  },
  {
    label: "Administration de médicaments",
    category: "Médication",
    icnpCode: "10032063",
    description: "Administrer les médicaments prescrits"
  },
  {
    label: "Toilette du patient",
    category: "Hygiène",
    icnpCode: "10030429",
    description: "Aide à la toilette et hygiène corporelle"
  },
  {
    label: "Pansement",
    category: "Soins",
    icnpCode: "10032078",
    description: "Réfection ou surveillance de pansement"
  },
  {
    label: "Mobilisation du patient",
    category: "Mobilité",
    icnpCode: "10032088",
    description: "Aide à la mobilisation et déplacements"
  }
];

const ActionForm: React.FC<ActionFormProps> = ({
  isVisible = true,
  onCancel,
  onAddAction,
  disabled = false,
  title = "Nouvelle action",
  placeholder = "Tapez votre action ou recherchez ICNP...",
  patientId,
  patientName,
  patients = [],
  showPatientSelector = false,
  mode = 'detailed',
  showIcnpDetails = true,
  showSuggestions = true,
  allowCustomActions = true,
  onSearchIcnp,
  onActionCreate,
  onActionUpdate,
  editingAction,
  isEditing = false
}) => {
  // États principaux
  const [formData, setFormData] = useState<ActionFormData>({
    label: '',
    status: 'à faire',
    priority: 'normale',
    category: '',
    description: '',
    notes: '',
    estimatedDuration: 30,
    icnp: null,
    patientId,
    patientName
  });

  // États ICNP
  const [icnpSearchQuery, setIcnpSearchQuery] = useState('');
  const [icnpResults, setIcnpResults] = useState<IcnpSearchResult[]>([]);
  const [isSearchingIcnp, setIsSearchingIcnp] = useState(false);
  const [isIcnpOpen, setIsIcnpOpen] = useState(false);
  const [selectedIcnp, setSelectedIcnp] = useState<IcnpSearchResult | null>(null);

  // États UI
  const [showSuggestionsPanel, setShowSuggestionsPanel] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(mode === 'expert');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialisation en mode édition
  useEffect(() => {
    if (isEditing && editingAction) {
      setFormData({
        label: editingAction.label,
        status: editingAction.status,
        priority: editingAction.priority || 'normale',
        category: editingAction.category || '',
        description: editingAction.description || '',
        notes: editingAction.notes || '',
        estimatedDuration: editingAction.estimatedDuration || 30,
        icnp: editingAction.icnp || null,
        patientId: editingAction.patientId || patientId,
        patientName: editingAction.patientName || patientName,
        createdAt: editingAction.createdAt,
        completedAt: editingAction.completedAt,
        assignedTo: editingAction.assignedTo,
        tags: editingAction.tags || []
      });
      
      if (editingAction.icnp) {
        setSelectedIcnp({
          icnp_id: editingAction.icnp.id,
          axis: editingAction.icnp.axis,
          term: editingAction.icnp.term,
          description: editingAction.icnp.description
        });
      }
    }
  }, [isEditing, editingAction, patientId, patientName]);

  // Recherche ICNP avec debounce
  useEffect(() => {
    const searchIcnp = async () => {
      if (!icnpSearchQuery.trim() || icnpSearchQuery.length < 2) {
        setIcnpResults([]);
        return;
      }

      setIsSearchingIcnp(true);
      try {
        if (onSearchIcnp) {
          const results = await onSearchIcnp(icnpSearchQuery);
          setIcnpResults(results);
        } else {
          // Fallback vers l'API directe
          const response = await fetch(`/api/icnp?q=${encodeURIComponent(icnpSearchQuery)}&limit=8`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.ok) {
            const results = await response.json();
            setIcnpResults(results);
          }
        }
      } catch (error) {
        console.error('Erreur recherche ICNP:', error);
        setIcnpResults([]);
      } finally {
        setIsSearchingIcnp(false);
      }
    };

    const timer = setTimeout(searchIcnp, 300);
    return () => clearTimeout(timer);
  }, [icnpSearchQuery, onSearchIcnp]);

  // Suggestions filtrées
  const filteredSuggestions = useMemo(() => {
    if (!formData.label.trim()) return [];
    
    return PREDEFINED_ACTIONS.filter(action =>
      action.label.toLowerCase().includes(formData.label.toLowerCase()) ||
      action.category.toLowerCase().includes(formData.label.toLowerCase())
    );
  }, [formData.label]);

  // Validation du formulaire
  const validate = useCallback((): boolean => {
    const errors: string[] = [];

    if (!formData.label.trim()) {
      errors.push('Le libellé de l\'action est obligatoire');
    }

    if (mode === 'expert' && !selectedIcnp && !allowCustomActions) {
      errors.push('Une intervention ICNP doit être sélectionnée');
    }

    if (showPatientSelector && !formData.patientId) {
      errors.push('Un patient doit être sélectionné');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, [formData, selectedIcnp, mode, allowCustomActions, showPatientSelector]);

  // Sélection d'une intervention ICNP
  const handleIcnpSelect = useCallback((intervention: IcnpSearchResult) => {
    setSelectedIcnp(intervention);
    setFormData(prev => ({
      ...prev,
      label: intervention.term.fr,
      icnp: {
        id: intervention.icnp_id,
        axis: intervention.axis || 'IC',
        term: intervention.term,
        description: intervention.description
      },
      description: intervention.description?.fr || ''
    }));
    setIcnpSearchQuery('');
    setIsIcnpOpen(false);
  }, []);

  // Effacer la sélection ICNP
  const clearIcnpSelection = useCallback(() => {
    setSelectedIcnp(null);
    setFormData(prev => ({
      ...prev,
      icnp: null,
      description: ''
    }));
  }, []);

  // Sélection d'une suggestion prédéfinie
  const selectSuggestion = useCallback((suggestion: typeof PREDEFINED_ACTIONS[0]) => {
    setFormData(prev => ({
      ...prev,
      label: suggestion.label,
      category: suggestion.category,
      description: suggestion.description
    }));
    setShowSuggestionsPanel(false);
    
    // Rechercher automatiquement l'intervention ICNP correspondante
    if (suggestion.icnpCode) {
      setIcnpSearchQuery(suggestion.icnpCode);
    }
  }, []);

  // Soumission du formulaire
  const handleSubmit = useCallback(async () => {
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const actionData: Omit<PatientAction, 'id'> = {
        label: formData.label.trim(),
        status: formData.status,
        priority: formData.priority,
        category: formData.category,
        description: formData.description,
        notes: formData.notes,
        estimatedDuration: formData.estimatedDuration,
        icnp: formData.icnp,
        patientName: formData.patientName,
        date: formData.status === 'réalisé' ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
        completedAt: formData.status === 'réalisé' ? new Date().toISOString() : undefined,
        assignedTo: formData.assignedTo,
        tags: formData.tags
      };

      if (isEditing && onActionUpdate && editingAction) {
        await onActionUpdate(editingAction.id || '', actionData);
      } else if (onActionCreate) {
        await onActionCreate(formData);
      } else if (onAddAction) {
        onAddAction(actionData);
      }

      resetForm();
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validate, isSubmitting, isEditing, onActionUpdate, editingAction, onActionCreate, onAddAction]);

  // Réinitialisation du formulaire
  const resetForm = useCallback(() => {
    setFormData({
      label: '',
      status: 'à faire',
      priority: 'normale',
      category: '',
      description: '',
      notes: '',
      estimatedDuration: 30,
      icnp: null,
      patientId,
      patientName
    });
    setSelectedIcnp(null);
    setIcnpSearchQuery('');
    setShowSuggestionsPanel(false);
    setIsAdvancedOpen(mode === 'expert');
    setValidationErrors([]);
  }, [patientId, patientName, mode]);

  // Gestion des touches clavier
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel?.();
    }
  }, [handleSubmit, onCancel]);

  if (!isVisible) return null;

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Plus className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg text-blue-900">
                {isEditing ? 'Modifier l\'action' : title}
              </CardTitle>
              <CardDescription className="text-blue-700">
                {mode === 'expert' 
                  ? 'Intervention ICNP avec détails complets'
                  : mode === 'detailed'
                  ? 'Action avec recherche ICNP'
                  : 'Action rapide'
                }
              </CardDescription>
            </div>
          </div>
          
          {mode === 'expert' && (
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              Mode Expert
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        
        {/* Sélecteur de patient */}
        {showPatientSelector && patients.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="patient" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Patient
            </Label>
            <Select
              value={formData.patientId}
              onValueChange={(value) => {
                const patient = patients.find(p => p._id === value);
                setFormData(prev => ({
                  ...prev,
                  patientId: value,
                  patientName: patient ? `${patient.nom} ${patient.prenom || ''}`.trim() : ''
                }));
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un patient" />
              </SelectTrigger>
              <SelectContent>
                {patients.map((patient) => (
                  <SelectItem key={patient._id} value={patient._id}>
                    {patient.nom} {patient.prenom || ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Champ principal avec recherche ICNP */}
        <div className="space-y-3">
          <Label htmlFor="action-label" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Libellé de l'action *
          </Label>
          
          {/* Intervention ICNP sélectionnée */}
          {selectedIcnp && showIcnpDetails && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Stethoscope className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-900">Intervention ICNP sélectionnée</span>
                  </div>
                  <div className="space-y-2">
                    <div className="font-medium text-green-800">{selectedIcnp.term.fr}</div>
                    {selectedIcnp.description?.fr && (
                      <div className="text-sm text-green-700">{selectedIcnp.description.fr}</div>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-green-700 border-green-300">
                        <Hash className="w-3 h-3 mr-1" />
                        {selectedIcnp.icnp_id}
                      </Badge>
                      {selectedIcnp.axis && (
                        <Badge variant="outline" className="text-green-700 border-green-300">
                          <Tag className="w-3 h-3 mr-1" />
                          Axe {selectedIcnp.axis}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearIcnpSelection}
                  className="text-green-600 hover:text-green-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Recherche d'intervention ICNP */}
          {!selectedIcnp && (showIcnpDetails || mode === 'expert') && (
            <div className="space-y-2">
              <Popover open={isIcnpOpen} onOpenChange={setIsIcnpOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isIcnpOpen}
                    className="w-full justify-between bg-white/80 backdrop-blur-sm border border-gray-200/50"
                    disabled={disabled}
                  >
                    {icnpSearchQuery || "🔍 Rechercher une intervention ICNP..."}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Tapez pour rechercher dans ICNP..."
                      value={icnpSearchQuery}
                      onValueChange={setIcnpSearchQuery}
                    />
                    <CommandEmpty>
                      {isSearchingIcnp ? (
                        <div className="flex items-center gap-2 p-4">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Recherche en cours...
                        </div>
                      ) : (
                        'Aucune intervention trouvée.'
                      )}
                    </CommandEmpty>
                    {icnpResults.length > 0 && (
                      <CommandGroup heading="Interventions ICNP">
                        {icnpResults.map((intervention) => (
                          <CommandItem
                            key={intervention.icnp_id}
                            value={intervention.icnp_id}
                            onSelect={() => handleIcnpSelect(intervention)}
                            className="flex flex-col items-start gap-1 p-3"
                          >
                            <div className="font-medium">{intervention.term.fr}</div>
                            {intervention.description?.fr && (
                              <div className="text-sm text-gray-600">{intervention.description.fr}</div>
                            )}
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                Code: {intervention.icnp_id}
                              </Badge>
                              {intervention.axis && (
                                <Badge variant="outline" className="text-xs">
                                  Axe: {intervention.axis}
                                </Badge>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Champ texte pour libellé libre */}
          <div className="relative">
            <Input
              id="action-label"
              type="text"
              value={formData.label}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, label: e.target.value }));
                if (showSuggestions && e.target.value.length > 2) {
                  setShowSuggestionsPanel(true);
                }
              }}
              placeholder={selectedIcnp ? selectedIcnp.term.fr : placeholder}
              className="w-full"
              onKeyPress={handleKeyPress}
              disabled={disabled || (selectedIcnp && !allowCustomActions)}
            />

            {/* Suggestions prédéfinies */}
            {showSuggestionsPanel && showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                <div className="p-2 border-b border-gray-100">
                  <span className="text-xs font-medium text-gray-700">Suggestions</span>
                </div>
                {filteredSuggestions.slice(0, 5).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => selectSuggestion(suggestion)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm border-b border-gray-50 last:border-0"
                  >
                    <Search className="w-3 h-3 text-gray-400" />
                    <div className="flex-1">
                      <div className="font-medium">{suggestion.label}</div>
                      <div className="text-xs text-gray-500">{suggestion.category}</div>
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => setShowSuggestionsPanel(false)}
                  className="w-full px-3 py-2 text-center text-xs text-gray-500 hover:bg-gray-50"
                >
                  Fermer les suggestions
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Champs principaux */}
        <div className="grid grid-cols-2 gap-4">
          {/* Statut */}
          <div className="space-y-2">
            <Label>Statut</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={formData.status === 'à faire' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormData(prev => ({ ...prev, status: 'à faire' }))}
                disabled={disabled}
                className="flex-1"
              >
                <Clock className="w-4 h-4 mr-1" />
                À faire
              </Button>
              <Button
                type="button"
                variant={formData.status === 'réalisé' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFormData(prev => ({ ...prev, status: 'réalisé' }))}
                disabled={disabled}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Réalisé
              </Button>
            </div>
          </div>

          {/* Priorité */}
          <div className="space-y-2">
            <Label>Priorité</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basse">🟢 Basse</SelectItem>
                <SelectItem value="normale">🟡 Normale</SelectItem>
                <SelectItem value="haute">🟠 Haute</SelectItem>
                <SelectItem value="urgente">🔴 Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Options avancées */}
        {(mode === 'detailed' || mode === 'expert') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Options avancées</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
              </Button>
            </div>

            {isAdvancedOpen && (
              <div className="space-y-4 border-l-2 border-gray-200 pl-4">
                {/* Catégorie */}
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Input
                    id="category"
                    value={formData.category || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="ex: Hygiène, Surveillance, Médication..."
                    disabled={disabled}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description détaillée de l'action..."
                    rows={2}
                    disabled={disabled}
                  />
                </div>

                {/* Durée estimée */}
                <div className="space-y-2">
                  <Label htmlFor="duration">Durée estimée (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="5"
                    max="480"
                    step="5"
                    value={formData.estimatedDuration || 30}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 30 }))}
                    disabled={disabled}
                  />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes privées</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Notes personnelles, observations..."
                    rows={2}
                    disabled={disabled}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Erreurs de validation */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              <ul className="space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {selectedIcnp && (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-green-600">Intervention ICNP liée</span>
              </>
            )}
            {formData.label && !selectedIcnp && allowCustomActions && (
              <>
                <Info className="w-4 h-4 text-blue-600" />
                <span className="text-blue-600">Action personnalisée</span>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Annuler
            </Button>

            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!formData.label.trim() || isSubmitting || disabled}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : isEditing ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Modifier
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Raccourcis clavier */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">Ctrl</kbd> + 
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs mx-1">Enter</kbd> 
          pour enregistrer • 
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs ml-1">Échap</kbd> 
          pour annuler
        </div>
      </CardContent>

      {/* Informations ICNP en mode expert */}
      {mode === 'expert' && selectedIcnp && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-blue-900">Détails ICNP</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-800">Code ICNP:</span>
              <div className="text-blue-700">{selectedIcnp.icnp_id}</div>
            </div>
            <div>
              <span className="font-medium text-blue-800">Axe:</span>
              <div className="text-blue-700">
                {selectedIcnp.axis} 
                <span className="text-xs ml-1">
                  ({selectedIcnp.axis === 'IC' ? 'Interventions' : 'Autre'})
                </span>
              </div>
            </div>
            <div>
              <span className="font-medium text-blue-800">Terme français:</span>
              <div className="text-blue-700">{selectedIcnp.term.fr}</div>
            </div>
            {selectedIcnp.term.en && (
              <div>
                <span className="font-medium text-blue-800">Terme anglais:</span>
                <div className="text-blue-700 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {selectedIcnp.term.en}
                </div>
              </div>
            )}
          </div>
          
          {selectedIcnp.description?.fr && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <span className="font-medium text-blue-800 block mb-1">Description complète:</span>
              <div className="text-blue-700 italic">{selectedIcnp.description.fr}</div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default ActionForm;
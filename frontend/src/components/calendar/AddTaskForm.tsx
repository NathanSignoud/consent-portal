import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, X, ChevronDown, User, Calendar, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { 
  CreateTaskData, 
  IcnpSearchResult, 
  Patient2, 
  IcnpData 
} from '@/types';

interface AddTaskFormProps {
  // Props pour la compatibilité legacy
  newTitle?: string;
  newDate: string;
  onTitleChange?: (value: string) => void;
  onDateChange: (value: string) => void;
  onAdd: () => void;
  
  // Nouvelles props modernes
  onAddTask?: (taskData: CreateTaskData) => void;
  patients?: Patient2[];
  isLoading?: boolean;
  
  // Props optionnelles
  showPatientSelector?: boolean;
  showNotesField?: boolean;
  defaultPatientId?: string;
  
  // Fonctions de recherche ICNP
  onSearchIcnp?: (query: string) => Promise<IcnpSearchResult[]>;
  
  // Mode du formulaire
  mode?: 'legacy' | 'modern';
}

const AddTaskForm: React.FC<AddTaskFormProps> = ({
  // Legacy props
  newTitle = '',
  newDate,
  onTitleChange,
  onDateChange,
  onAdd,
  
  // Modern props
  onAddTask,
  patients = [],
  isLoading = false,
  showPatientSelector = true,
  showNotesField = true,
  defaultPatientId,
  onSearchIcnp,
  mode = 'modern'
}) => {
  // État local pour le mode moderne
  const [selectedIcnp, setSelectedIcnp] = useState<IcnpSearchResult | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient2 | null>(null);
  const [notes, setNotes] = useState('');
  const [icnpSearchQuery, setIcnpSearchQuery] = useState('');
  const [icnpResults, setIcnpResults] = useState<IcnpSearchResult[]>([]);
  const [isSearchingIcnp, setIsSearchingIcnp] = useState(false);
  const [isIcnpOpen, setIsIcnpOpen] = useState(false);
  
  // États pour le mode legacy
  const [legacyTitle, setLegacyTitle] = useState(newTitle);

  // Initialiser le patient sélectionné
  useEffect(() => {
    if (defaultPatientId && patients.length > 0) {
      const patient = patients.find(p => p._id === defaultPatientId);
      if (patient) {
        setSelectedPatient(patient);
      }
    }
  }, [defaultPatientId, patients]);

  // Recherche ICNP avec debouncing
  useEffect(() => {
    const searchIcnp = async () => {
      if (!onSearchIcnp || !icnpSearchQuery.trim() || icnpSearchQuery.length < 2) {
        setIcnpResults([]);
        return;
      }

      setIsSearchingIcnp(true);
      try {
        const results = await onSearchIcnp(icnpSearchQuery.trim());
        setIcnpResults(results);
      } catch (error) {
        console.error('Erreur recherche ICNP:', error);
        setIcnpResults([]);
      } finally {
        setIsSearchingIcnp(false);
      }
    };

    const debounceTimer = setTimeout(searchIcnp, 300);
    return () => clearTimeout(debounceTimer);
  }, [icnpSearchQuery, onSearchIcnp]);

  // Fonction pour gérer la sélection d'une intervention ICNP
  const handleIcnpSelect = useCallback((icnp: IcnpSearchResult) => {
    setSelectedIcnp(icnp);
    setIcnpSearchQuery(icnp.term.fr);
    setIsIcnpOpen(false);
  }, []);

  // Fonction pour réinitialiser le formulaire
  const resetForm = useCallback(() => {
    setSelectedIcnp(null);
    setSelectedPatient(defaultPatientId ? patients.find(p => p._id === defaultPatientId) || null : null);
    setNotes('');
    setIcnpSearchQuery('');
    setLegacyTitle('');
    if (onTitleChange) onTitleChange('');
  }, [defaultPatientId, patients, onTitleChange]);

  // Validation du formulaire
  const isFormValid = useMemo(() => {
    if (mode === 'legacy') {
      return legacyTitle.trim() && newDate;
    }
    return selectedIcnp && newDate;
  }, [mode, legacyTitle, newDate, selectedIcnp]);

  // Fonction pour gérer l'ajout de tâche
  const handleSubmit = useCallback(() => {
    if (!isFormValid) return;

    if (mode === 'legacy') {
      // Mode legacy : utiliser l'ancienne interface
      onAdd();
      return;
    }

    if (!onAddTask || !selectedIcnp) return;

    // Mode moderne : créer la structure ICNP
    const icnpData: IcnpData = {
      id: selectedIcnp.icnp_id,
      axis: selectedIcnp.axis || 'IC',
      term: {
        fr: selectedIcnp.term.fr,
        en: selectedIcnp.term.en
      },
      description: selectedIcnp.description
    };

    const taskData: CreateTaskData = {
      icnp: icnpData,
      date: newDate,
      userId: '', // Sera rempli par le composant parent
      patientId: selectedPatient?._id,
      patientName: selectedPatient ? `${selectedPatient.nom} ${selectedPatient.prenom || ''}`.trim() : undefined,
      notes: notes.trim() || undefined
    };

    onAddTask(taskData);
    resetForm();
  }, [isFormValid, mode, onAdd, onAddTask, selectedIcnp, newDate, selectedPatient, notes, resetForm]);

  // Fonction pour supprimer la sélection ICNP
  const clearIcnpSelection = useCallback(() => {
    setSelectedIcnp(null);
    setIcnpSearchQuery('');
  }, []);

  if (mode === 'legacy') {
    // Rendu legacy pour compatibilité
    return (
      <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Ajouter une tâche manuelle</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                Titre de la tâche
              </Label>
              <Input
                id="title"
                type="text"
                placeholder="Ex : Réunion équipe"
                value={legacyTitle}
                onChange={(e) => {
                  setLegacyTitle(e.target.value);
                  onTitleChange?.(e.target.value);
                }}
                className="mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div>
              <Label htmlFor="date" className="text-sm font-medium text-gray-700">
                Date prévue
              </Label>
              <Input
                id="date"
                type="date"
                value={newDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg shadow-lg"
              disabled={!isFormValid || isLoading}
            >
              <Plus className="w-4 h-4 mr-2" />
              {isLoading ? 'Ajout en cours...' : 'Ajouter la tâche'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Rendu moderne avec ICNP
  return (
    <Card className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">Ajouter une intervention ICNP</h2>
        </div>

        <div className="space-y-4">
          {/* Sélection d'intervention ICNP */}
          <div>
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Search className="w-4 h-4" />
              Intervention ICNP *
            </Label>
            
            {selectedIcnp ? (
              // Affichage de l'intervention sélectionnée
              <div className="mt-1 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-blue-900">{selectedIcnp.term.fr}</div>
                    {selectedIcnp.description?.fr && (
                      <div className="text-sm text-blue-700 mt-1">{selectedIcnp.description.fr}</div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        Code: {selectedIcnp.icnp_id}
                      </Badge>
                      {selectedIcnp.axis && (
                        <Badge variant="outline" className="text-xs">
                          Axe: {selectedIcnp.axis}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearIcnpSelection}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              // Recherche d'intervention
              <Popover open={isIcnpOpen} onOpenChange={setIsIcnpOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isIcnpOpen}
                    className="w-full justify-between mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50"
                  >
                    {icnpSearchQuery || "Rechercher une intervention..."}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Tapez pour rechercher..."
                      value={icnpSearchQuery}
                      onValueChange={setIcnpSearchQuery}
                    />
                    <CommandEmpty>
                      {isSearchingIcnp ? 'Recherche en cours...' : 'Aucune intervention trouvée.'}
                    </CommandEmpty>
                    <CommandGroup className="max-h-64 overflow-auto">
                      {icnpResults.map((result) => (
                        <CommandItem
                          key={result.icnp_id}
                          value={result.term.fr}
                          onSelect={() => handleIcnpSelect(result)}
                          className="cursor-pointer"
                        >
                          <div className="flex flex-col gap-1 w-full">
                            <div className="font-medium">{result.term.fr}</div>
                            {result.description?.fr && (
                              <div className="text-xs text-gray-600">{result.description.fr}</div>
                            )}
                            <div className="text-xs text-blue-600">Code: {result.icnp_id}</div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Sélection de patient */}
          {showPatientSelector && patients.length > 0 && (
            <div>
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="w-4 h-4" />
                Patient (optionnel)
              </Label>
              <Select
                value={selectedPatient?._id || ''}
                onValueChange={(value) => {
                  const patient = patients.find(p => p._id === value);
                  setSelectedPatient(patient || null);
                }}
              >
                <SelectTrigger className="mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50">
                  <SelectValue placeholder="Sélectionner un patient" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun patient</SelectItem>
                  {patients.map((patient) => (
                    <SelectItem key={patient._id} value={patient._id}>
                      {patient.nom} {patient.prenom}
                      {patient.uniteOrganisationnelle && (
                        <span className="text-gray-500 ml-2">({patient.uniteOrganisationnelle})</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date */}
          <div>
            <Label htmlFor="date" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Date prévue *
            </Label>
            <Input
              id="date"
              type="date"
              value={newDate}
              onChange={(e) => onDateChange(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Notes */}
          {showNotesField && (
            <div>
              <Label htmlFor="notes" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes (optionnel)
              </Label>
              <Textarea
                id="notes"
                placeholder="Informations complémentaires..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="mt-1 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-lg focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          )}

          {/* Bouton d'ajout */}
          <Button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg shadow-lg"
            disabled={!isFormValid || isLoading}
          >
            <Plus className="w-4 h-4 mr-2" />
            {isLoading ? 'Ajout en cours...' : 'Ajouter l\'intervention'}
          </Button>

          {/* Aide contextuelle */}
          {!selectedIcnp && (
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              💡 <strong>Astuce :</strong> Tapez quelques mots-clés pour rechercher une intervention ICNP 
              (ex: "toilette", "administration", "surveillance")
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AddTaskForm;
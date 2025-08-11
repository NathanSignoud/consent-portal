import { useState, useEffect } from "react";
import { 
  Shield, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Clock,
  User,
  Lock,
  Download,
  Eye,
  Loader2
} from "lucide-react";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface ConsentFormProps {
  patientId: string;
  sectionTitle: string;
  mode?: 'simple' | 'detailed' | 'medical';
  onConsentChange?: (isValid: boolean, data: ConsentData) => void;
  showPatientInfo?: boolean;
  requiredConsents?: ConsentType[];
  autoSave?: boolean;
  readOnly?: boolean;
}

interface ConsentData {
  understood: boolean;
  surgeryConsent: boolean;
  dataConsent: boolean;
  informationConsent?: boolean;
  researchConsent?: boolean;
  additionalComments?: string;
  timestamp: string;
  ipAddress?: string;
  patientSignature?: boolean;
}

interface ConsentType {
  id: string;
  label: string;
  description: string;
  required: boolean;
  category: 'medical' | 'data' | 'research' | 'information';
}

const ConsentForm = ({ 
  patientId, 
  sectionTitle,
  mode = 'detailed',
  onConsentChange,
  showPatientInfo = true,
  requiredConsents = [],
  autoSave = false,
  readOnly = false
}: ConsentFormProps) => {
  const [consentData, setConsentData] = useState<ConsentData>({
    understood: false,
    surgeryConsent: false,
    dataConsent: false,
    informationConsent: false,
    researchConsent: false,
    additionalComments: '',
    timestamp: new Date().toISOString(),
    patientSignature: false
  });

  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [patientInfo, setPatientInfo] = useState<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Définition des consentements par défaut selon le mode
  const defaultConsents: ConsentType[] = [
    {
      id: 'understood',
      label: 'Compréhension du document',
      description: 'Je confirme avoir lu et compris ce document médical',
      required: true,
      category: 'information'
    },
    {
      id: 'surgeryConsent',
      label: 'Consentement à l\'intervention',
      description: 'Je consens à recevoir les soins ou l\'intervention proposée',
      required: mode === 'medical',
      category: 'medical'
    },
    {
      id: 'dataConsent',
      label: 'Partage des données médicales',
      description: 'J\'autorise le partage de mes données médicales avec l\'équipe soignante',
      required: true,
      category: 'data'
    },
    {
      id: 'informationConsent',
      label: 'Droit à l\'information',
      description: 'Je souhaite être informé(e) de l\'évolution de mon état de santé',
      required: false,
      category: 'information'
    },
    {
      id: 'researchConsent',
      label: 'Participation à la recherche',
      description: 'J\'accepte que mes données soient utilisées de manière anonymisée pour la recherche médicale',
      required: false,
      category: 'research'
    }
  ];

  const activeConsents = requiredConsents.length > 0 ? requiredConsents : defaultConsents;

  // Chargement des informations patient
  useEffect(() => {
    if (showPatientInfo && patientId) {
      fetchPatientInfo();
    }
  }, [patientId, showPatientInfo]);

  // Auto-save
  useEffect(() => {
    if (autoSave && hasUnsavedChanges && !readOnly) {
      const timer = setTimeout(() => {
        handleSave(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [consentData, autoSave, hasUnsavedChanges]);

  // Validation et notification
  useEffect(() => {
    const isValid = validateConsent();
    onConsentChange?.(isValid, consentData);
  }, [consentData]);

  const fetchPatientInfo = async () => {
    try {
      const response = await fetch(`/api/patient2/${patientId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPatientInfo(data);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des infos patient:', err);
    }
  };

  const validateConsent = (): boolean => {
    return activeConsents
      .filter(consent => consent.required)
      .every(consent => {
        const key = consent.id as keyof ConsentData;
        return consentData[key] === true;
      });
  };

  const updateConsent = (key: keyof ConsentData, value: boolean | string) => {
    setConsentData(prev => ({
      ...prev,
      [key]: value,
      timestamp: new Date().toISOString()
    }));
    setHasUnsavedChanges(true);
    setError(null);
  };

  const handleSave = async (silent = false) => {
    if (readOnly) return;
    
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/patient2/${patientId}/consent`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          sectionTitle,
          consentData,
          mode,
          timestamp: new Date().toISOString()
        }),
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Erreur lors de la sauvegarde");
      
      if (!silent) {
        setResponse("Consentement enregistré avec succès !");
        setTimeout(() => setResponse(null), 5000);
      }
      setHasUnsavedChanges(false);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateConsent()) {
      setError("Veuillez compléter tous les champs obligatoires");
      return;
    }
    await handleSave();
  };

  const getConsentIcon = (category: ConsentType['category']) => {
    switch (category) {
      case 'medical': return <Shield className="w-4 h-4" />;
      case 'data': return <Lock className="w-4 h-4" />;
      case 'research': return <FileText className="w-4 h-4" />;
      case 'information': return <Info className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const isValid = validateConsent();
  const requiredCount = activeConsents.filter(c => c.required).length;
  const completedCount = activeConsents.filter(c => c.required && consentData[c.id as keyof ConsentData]).length;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl text-blue-900">Formulaire de consentement</CardTitle>
            <CardDescription className="text-blue-700">
              {sectionTitle} - Validation et consentement éclairé
            </CardDescription>
          </div>
          
          {/* Indicateur de progression */}
          <div className="text-right">
            <div className="text-sm font-medium text-blue-800">
              {completedCount}/{requiredCount} obligatoires
            </div>
            <div className="w-20 h-2 bg-blue-200 rounded-full mt-1">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / requiredCount) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        
        {/* Informations patient */}
        {showPatientInfo && patientInfo && (
          <Alert>
            <User className="w-4 h-4" />
            <AlertDescription>
              <strong>Patient :</strong> {patientInfo.nom} {patientInfo.prenom} 
              {patientInfo.dateNaissance && (
                <span className="ml-2 text-sm text-gray-600">
                  (né(e) le {new Date(patientInfo.dateNaissance).toLocaleDateString('fr-FR')})
                </span>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Messages d'état */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {response && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">{response}</AlertDescription>
          </Alert>
        )}

        {/* Liste des consentements */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Déclarations de consentement
          </h3>

          {activeConsents.map((consent) => (
            <div 
              key={consent.id}
              className={`
                p-4 border rounded-lg transition-all duration-200
                ${consentData[consent.id as keyof ConsentData] 
                  ? 'border-green-200 bg-green-50' 
                  : consent.required 
                    ? 'border-orange-200 bg-orange-50' 
                    : 'border-gray-200 bg-gray-50'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getConsentIcon(consent.category)}
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={consentData[consent.id as keyof ConsentData] as boolean}
                      onCheckedChange={(checked) => 
                        updateConsent(consent.id as keyof ConsentData, checked as boolean)
                      }
                      disabled={readOnly}
                      className="data-[state=checked]:bg-green-600"
                    />
                    <label className="font-medium text-gray-900 cursor-pointer">
                      {consent.label}
                      {consent.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <Badge variant={consent.required ? "destructive" : "secondary"} className="text-xs">
                      {consent.required ? 'Obligatoire' : 'Optionnel'}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 ml-6">
                    {consent.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Commentaires additionnels */}
        {mode === 'detailed' && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Commentaires ou questions (optionnel)
            </label>
            <Textarea
              value={consentData.additionalComments || ''}
              onChange={(e) => updateConsent('additionalComments', e.target.value)}
              placeholder="Ajoutez vos commentaires, questions ou préoccupations..."
              rows={3}
              disabled={readOnly}
              className="resize-none"
            />
          </div>
        )}

        {/* Signature électronique pour le mode médical */}
        {mode === 'medical' && (
          <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={consentData.patientSignature}
                onCheckedChange={(checked) => 
                  updateConsent('patientSignature', checked as boolean)
                }
                disabled={readOnly}
              />
              <div className="flex-1">
                <label className="font-medium text-blue-900 cursor-pointer">
                  Signature électronique *
                </label>
                <p className="text-sm text-blue-700 mt-1">
                  En cochant cette case, je certifie que les informations sont exactes et que je donne mon consentement éclairé.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Informations légales */}
        <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3 h-3" />
            <span>Horodatage : {new Date(consentData.timestamp).toLocaleString('fr-FR')}</span>
          </div>
          <p>
            Ce consentement est conforme au RGPD et peut être révoqué à tout moment. 
            Vos données sont traitées de manière confidentielle selon notre politique de confidentialité.
          </p>
        </div>

        {/* Actions */}
        {!readOnly && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {hasUnsavedChanges && (
                <>
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                  <span>Modifications non sauvegardées</span>
                </>
              )}
              {autoSave && !hasUnsavedChanges && (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Sauvegardé automatiquement</span>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => handleSave(false)}
                disabled={isSaving || !hasUnsavedChanges}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  'Sauvegarder'
                )}
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={!isValid || isSaving}
                className={`
                  ${isValid 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-gray-300 cursor-not-allowed'
                  }
                `}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validation...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Valider le consentement
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConsentForm;
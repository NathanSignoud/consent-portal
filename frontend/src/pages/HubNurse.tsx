import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Search, 
  Users, 
  Calendar, 
  Upload, 
  FileText, 
  Filter, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Plus, 
  TrendingUp, 
  Activity, 
  Heart, 
  Shield, 
  Clock, 
  ArrowRight, 
  BarChart3, 
  Star, 
  Loader2 
} from "lucide-react";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { handleExport as exportPatientsToPDF } from "../hooks/handleExport";
import Patient2List from "../components/Patient2List";
import SearchBar from "../components/SearchBar";
import { Patient2 } from "../types/patient2";

const HubNurse: React.FC = () => {
  const navigate = useNavigate(); // Ajout du hook de navigation

  // États
  const [patientList, setPatientList] = useState<Patient2[] | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMethod, setSortMethod] = useState('alphabetical');
  const [importMessage, setImportMessage] = useState("");
  const [exportMessage, setExportMessage] = useState("");
  const [showImportForm, setShowImportForm] = useState(false);

  // Fonction pour calculer l'âge
  const calculateAge = useCallback((dateNaissance: string): number => {
    if (!dateNaissance) return 0;
    const birth = new Date(dateNaissance);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }, []);

  // Fonction pour récupérer les patients
  const fetchPatients = useCallback(async () => {
    setIsPending(true);
    setError(null);
    
    try {
      const response = await fetch('/api/patient2', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        }
      });

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des patients");
      }

      const data = await response.json();
      setPatientList(data);
    } catch (err: any) {
      console.error('Erreur fetchPatients:', err);
      setError(err.message || 'Erreur lors du chargement');
    } finally {
      setIsPending(false);
    }
  }, []);

  // Chargement initial
  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Filtrage et tri des patients
  const filteredPatients = (patientList ?? []).filter((patient: Patient2) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      patient.nom?.toLowerCase().includes(searchLower) ||
      patient.prenom?.toLowerCase().includes(searchLower) ||
      patient.ipp?.toLowerCase().includes(searchLower) ||
      patient.situationDossier?.toLowerCase().includes(searchLower)
    );
  });

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    switch (sortMethod) {
      case 'alphabetical':
        return `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`);
      case 'age':
        return calculateAge(b.dateNaissance) - calculateAge(a.dateNaissance);
      case 'recent':
        return new Date(b.dateDebutPriseEnCharge || 0).getTime() - new Date(a.dateDebutPriseEnCharge || 0).getTime();
      default:
        return 0;
    }
  });

  // FONCTIONS DE NAVIGATION POUR Patient2List
  const handleViewPatient = useCallback((patientId: string) => {
    console.log('Navigation vers patient:', patientId);
    navigate(`/patient2/${patientId}`);
  }, [navigate]);

  const handleEditPatient = useCallback((patient: Patient2) => {
    console.log('Modification patient:', patient._id);
    // Navigation vers une page d'édition ou modal
    navigate(`/patient2/${patient._id}/edit`);
  }, [navigate]);

  const handleExportPatient = useCallback((patient: Patient2) => {
    console.log('Export patient:', patient._id);
    // Logique d'export (PDF, Excel, etc.)
  }, []);

  const handleDeletePatient = useCallback(async (patientId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce patient ?')) return;
    
    try {
      const response = await fetch(`/api/patient2/${patientId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        }
      });

      if (response.ok) {
        // Recharger la liste
        await fetchPatients();
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (err: any) {
      console.error('Erreur suppression:', err);
      setError(err.message);
    }
  }, [fetchPatients]);

  // Export global
  const handleExportAll = async () => {
    if (!patientList || patientList.length === 0) return;

    setIsExporting(true);
    setExportMessage("");

    try {
      await exportPatientsToPDF(patientList);
      setExportMessage("Export réussi !");
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      setExportMessage("Erreur lors de l'export");
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportMessage(""), 3000);
    }
  };

  // Statistiques rapides
  const stats = {
    total: patientList?.length || 0,
    active: patientList?.filter(p => 
      p.situationDossier?.toLowerCase().includes('actif') || 
      p.situationDossier?.toLowerCase().includes('en cours')
    ).length || 0,
    completed: patientList?.filter(p => 
      p.situationDossier?.toLowerCase().includes('terminé') || 
      p.situationDossier?.toLowerCase().includes('fermé')
    ).length || 0
  };

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-blue-600">Chargement des patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                Hub Personnel Soignant
              </h1>
              <p className="text-gray-600 mt-2">
                Gestion des patients et suivi des interventions ICNP
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={fetchPatients}
                variant="outline"
                disabled={isPending}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isPending ? 'animate-spin' : ''}`} />
                Actualiser
              </Button>
              
              <Link to="/calendar">
                <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                  <Calendar className="w-4 h-4 mr-2" />
                  Planning
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/70 backdrop-blur-xl border border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Patients</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-xl border border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Dossiers Actifs</p>
                  <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                </div>
                <Activity className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-xl border border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Terminés</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.completed}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Barre de recherche et filtres */}
        <Card className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="flex-1">
                <SearchBar
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  placeholder="Rechercher par nom, prénom, IPP..."
                  className="w-full"
                />
              </div>
              
              <div className="flex items-center gap-3">
                <select
                  value={sortMethod}
                  onChange={(e) => setSortMethod(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="alphabetical">Ordre alphabétique</option>
                  <option value="age">Par âge</option>
                  <option value="recent">Plus récents</option>
                </select>

                <Button
                  onClick={handleExportAll}
                  disabled={isExporting || !patientList?.length}
                  variant="outline"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Exporter
                </Button>
              </div>
            </div>

            {exportMessage && (
              <Alert className={`mt-4 ${exportMessage.includes('Erreur') ? 'border-red-200' : 'border-green-200'}`}>
                <AlertDescription>{exportMessage}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Messages d'erreur */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Liste des patients */}
        {patientList && (
          <Card className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    Liste des patients
                  </CardTitle>
                  <CardDescription>
                    {filteredPatients.length} patient(s) trouvé(s) sur {patientList.length} total
                  </CardDescription>
                </div>
                
                <Link to="/create">
                  <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nouveau patient
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <Patient2List 
                patients={sortedPatients} 
                title="Liste des patients"
                showStats={false} // On a déjà les stats au-dessus
                showSearch={false} // On a déjà la recherche au-dessus
                allowActions={true}
                viewMode="grid"
                emptyStateTitle="Aucun patient trouvé"
                emptyStateDescription="Aucun patient ne correspond à vos critères de recherche"
                onView={handleViewPatient}
                onEdit={handleEditPatient}
                onExport={handleExportPatient}
                handleDelete={handleDeletePatient}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HubNurse;
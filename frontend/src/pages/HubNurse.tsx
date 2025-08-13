import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
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

  // Fonction pour calculer l'âge (définie en premier)
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
  const filteredPatients = (patientList ?? []).filter((patient) => {
    const nom = patient.nom?.toLowerCase() || "";
    const prenom = patient.prenom?.toLowerCase() || "";
    const age = calculateAge(patient.dateNaissance).toString();
    const search = searchTerm.toLowerCase();
    
    return nom.includes(search) || 
           prenom.includes(search) || 
           age.includes(search) ||
           patient.situationDossier?.toLowerCase().includes(search);
  });

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    if (sortMethod === "alphabetical") {
      const aName = `${a.nom || ""} ${a.prenom || ""}`.toLowerCase();
      const bName = `${b.nom || ""} ${b.prenom || ""}`.toLowerCase();
      return aName.localeCompare(bName);
    }
    if (sortMethod === "date") {
      const aDate = new Date(a.dateDebutPriseEnCharge || "").getTime();
      const bDate = new Date(b.dateDebutPriseEnCharge || "").getTime();
      return bDate - aDate; // Plus récent en premier
    }
    return 0;
  });

  // Gestion de l'import de fichier
  const handleFileImport = async () => {
    const fileInput = document.getElementById("fileInput") as HTMLInputElement;
    const file = fileInput?.files?.[0];
    
    if (!file) {
      alert("Sélectionnez un fichier .xlsx");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setImportMessage("Import en cours...");

      const response = await fetch("/api/patient2/import", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'importation");
      }

      setImportMessage("Import terminé avec succès !");
      
      // Recharger les patients après import
      setTimeout(() => {
        fetchPatients();
        setImportMessage("");
        if (fileInput) fileInput.value = ""; // Reset du input
      }, 2000);

    } catch (err: any) {
      console.error('Erreur import:', err);
      setImportMessage("Erreur lors de l'importation.");
      setTimeout(() => setImportMessage(""), 3000);
    }
  };

  // Gestion de l'export PDF
  const handleExportClick = async () => {
    try {
      setIsExporting(true);
      setExportMessage("");
      
      if (!sortedPatients || sortedPatients.length === 0) {
        setExportMessage("Aucun patient à exporter");
        return;
      }
      
      await exportPatientsToPDF(sortedPatients);
      setExportMessage("Export PDF généré avec succès !");
      
    } catch (error: any) {
      console.error('Erreur export:', error);
      setExportMessage("Erreur lors de l'export. Veuillez réessayer.");
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportMessage(""), 3000);
    }
  };

  // Calculs des statistiques
  const calculatePatientStats = () => {
    if (!patientList || patientList.length === 0) {
      return { total: 0, newThisMonth: 0, activeFollowUps: 0, percentageIncrease: 0 };
    }

    const total = patientList.length;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const newThisMonth = patientList.filter(patient => {
      if (!patient.dateDebutPriseEnCharge) return false;
      const date = new Date(patient.dateDebutPriseEnCharge);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;
    
    const activeFollowUps = patientList.filter(patient => 
      patient.situationDossier?.toLowerCase().includes("en cours") || 
      patient.situationDossier?.toLowerCase().includes("actif")
    ).length;

    const previousMonthPatients = total - newThisMonth;
    const percentageIncrease = previousMonthPatients > 0 
      ? Math.round((newThisMonth / previousMonthPatients) * 100) 
      : 0;

    return { total, newThisMonth, activeFollowUps, percentageIncrease };
  };

  const stats = calculatePatientStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Tableau de bord Personnel Soignant
            </h1>
          </div>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Gestion des patients, suivi des soins et administration des dossiers médicaux
          </p>
        </div>

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide">
                    Total Patients
                  </p>
                  <p className="text-3xl font-bold text-blue-900 mt-1">
                    {stats.total}
                  </p>
                </div>
                <div className="p-3 bg-blue-500 rounded-xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 font-semibold text-sm uppercase tracking-wide">
                    Nouveaux ce mois
                  </p>
                  <p className="text-3xl font-bold text-green-900 mt-1">
                    {stats.newThisMonth}
                  </p>
                </div>
                <div className="p-3 bg-green-500 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 font-semibold text-sm uppercase tracking-wide">
                    Suivis actifs
                  </p>
                  <p className="text-3xl font-bold text-orange-900 mt-1">
                    {stats.activeFollowUps}
                  </p>
                </div>
                <div className="p-3 bg-orange-500 rounded-xl">
                  <Activity className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 font-semibold text-sm uppercase tracking-wide">
                    Évolution
                  </p>
                  <p className="text-3xl font-bold text-purple-900 mt-1">
                    +{stats.percentageIncrease}%
                  </p>
                </div>
                <div className="p-3 bg-purple-500 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Section Recherche et Filtres */}
          <Card className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-600" />
                Recherche et Filtres
              </CardTitle>
              <CardDescription>
                Trouvez rapidement un patient ou filtrez la liste
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SearchBar 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm}
                placeholder="Rechercher par nom, prénom, âge ou situation..."
              />
              
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={sortMethod === "alphabetical" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortMethod("alphabetical")}
                  className="text-sm"
                >
                  <Filter className="w-4 h-4 mr-1" />
                  Alphabétique
                </Button>
                <Button
                  variant={sortMethod === "date" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortMethod("date")}
                  className="text-sm"
                >
                  <Calendar className="w-4 h-4 mr-1" />
                  Par date
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchPatients}
                  disabled={isPending}
                  className="text-sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${isPending ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Section Export/Import */}
          <Card className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-green-600" />
                Gestion des données
              </CardTitle>
              <CardDescription>
                Importez ou exportez les données patients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleExportClick}
                  disabled={isExporting || !sortedPatients.length}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Exporter PDF
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setShowImportForm(!showImportForm)}
                  className="border-blue-200 hover:bg-blue-50"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importer Excel
                </Button>
              </div>

              {exportMessage && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {exportMessage}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Formulaire d'import (conditionnel) */}
        {showImportForm && (
          <Card className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Import de fichier Excel
              </CardTitle>
              <CardDescription>
                Sélectionnez un fichier .xlsx contenant les données patients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    id="fileInput"
                    type="file"
                    accept=".xlsx,.xls"
                    className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
                  />
                </div>
                
                <Button
                  onClick={handleFileImport}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Lancer l'import
                </Button>
              </div>
              
              {importMessage && (
                <Alert className="mt-4 bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {importMessage}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Messages d'état */}
        {error && (
          <Alert className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {isPending && (
          <Alert className="bg-blue-50 border-blue-200">
            <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
            <AlertDescription className="text-blue-800">
              Chargement des patients...
            </AlertDescription>
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
                showStats={true}
                showSearch={false} // On a déjà la recherche en haut
                allowActions={true}
                viewMode="grid"
                emptyStateTitle="Aucun patient trouvé"
                emptyStateDescription="Aucun patient ne correspond à vos critères de recherche"
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HubNurse;
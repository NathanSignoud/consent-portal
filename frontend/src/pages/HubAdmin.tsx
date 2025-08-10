import { useState, useEffect, FormEvent } from "react";
import { Link } from "react-router-dom";
import { Search, Users, Calendar, Upload, FileText, Filter, RefreshCw, CheckCircle, AlertCircle, Download, Plus, TrendingUp, Activity, Heart, Shield, Clock, ArrowRight, BarChart3, Star, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import useFetch from "../hooks/useFetch";
// Correction: Import avec alias pour éviter le conflit de noms
import { handleExport as exportPatientsToPDF } from "../hooks/handleExport";

import Patient2List from "../components/Patient2List";
import SearchBar from "../components/SearchBar";
import { Patient2 } from "../types/patient2";

const HubAdmin = () => {
  const [patientList, setPatientList] = useState<Patient2[] | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null); // Correction: typage
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMethod, setSortMethod] = useState('alphabetical');
  const [importMessage, setImportMessage] = useState("");
  const [exportMessage, setExportMessage] = useState(""); // Ajout pour les messages d'export
  const [showImportForm, setShowImportForm] = useState(false);

  // Correction: Vraie fonction fetch au lieu de simulation
  const fetchPatients = () => {
    setIsPending(true);
    setError(null);
    
    fetch('/api/patient2', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token") || ""}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Erreur lors du chargement des patients");
        return res.json();
      })
      .then(data => {
        setPatientList(data);
        setIsPending(false);
      })
      .catch(err => {
        setError(err.message);
        setIsPending(false);
      });
  };

  // Correction: useEffect avec fetchPatients
  useEffect(() => {
    fetchPatients();
  }, []);

  const calculateAge = (dateNaissance: string) => {
    if (!dateNaissance) return "";
    const birth = new Date(dateNaissance);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age.toString();
  };

  const filteredPatients = (patientList ?? []).filter((patient) => {
    const nom = patient.nom?.toLowerCase() || "";
    const age = calculateAge(patient.dateNaissance);
    const search = searchTerm.toLowerCase();
    return nom.includes(search) || age.includes(search);
  });

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    if (sortMethod === "alphabetical") {
      return (a.nom ?? "").toLowerCase().localeCompare((b.nom ?? "").toLowerCase());
    }
    if (sortMethod === "date") {
      return new Date(b.dateDebutPriseEnCharge ?? "").getTime() -
             new Date(a.dateDebutPriseEnCharge ?? "").getTime();
    }
    return 0;
  });
  
  const handleFileImport = async () => {
    const fileInput = document.getElementById("fileInput") as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) return alert("Sélectionnez un fichier .xlsx");

    const formData = new FormData();
    formData.append("file", file);

    try {
      setImportMessage("Import en cours...");

      const res = await fetch("/api/patient2/import", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: formData,
      });

      if (!res.ok) throw new Error("Erreur lors de l'importation");

      setImportMessage("Import terminé avec succès !");
      // Recharger les patients après import
      setTimeout(() => {
        fetchPatients();
        setImportMessage("");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setImportMessage("Erreur lors de l'importation.");
      setTimeout(() => setImportMessage(""), 3000);
    }
  };

  // Correction: Fonction d'export corrigée
  const handleExportClick = async () => {
    try {
      setIsExporting(true);
      setExportMessage("");
      
      // Vérifier qu'il y a des patients à exporter
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
      // Effacer le message après 3 secondes
      setTimeout(() => setExportMessage(""), 3000);
    }
  };

  // Correction: Calculs statistiques sécurisés
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
      patient.situationDossier === "Séjour en cours" || 
      patient.situationDossier === "En cours"
    ).length;

    // Calcul du pourcentage d'augmentation
    const previousMonthPatients = total - newThisMonth;
    const percentageIncrease = previousMonthPatients > 0 
      ? Math.round((newThisMonth / previousMonthPatients) * 100) 
      : 0;

    return { total, newThisMonth, activeFollowUps, percentageIncrease };
  };

  const { total, newThisMonth, activeFollowUps, percentageIncrease } = calculatePatientStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 relative overflow-hidden">
      {/* Éléments décoratifs de fond */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-200/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-purple-200/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* En-tête avec breadcrumb et actions */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <nav className="flex items-center space-x-2 text-sm mb-4" aria-label="Breadcrumb">
                <span className="text-gray-500">Hub</span>               
                <ArrowRight className="w-4 h-4 text-gray-400" />
                <span className="text-blue-600 font-semibold bg-blue-50 px-3 py-1 rounded-full">Patients</span>
              </nav>
              
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Tableau de bord Aide Soignant
                  </h1>
                  <p className="text-gray-600 mt-1 text-lg">Gestion et suivi des patients</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button 
                onClick={fetchPatients}
                disabled={isPending}
                className="group relative inline-flex items-center px-6 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-lg text-gray-700 hover:bg-white hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 mr-2 transition-transform duration-300 ${isPending ? 'animate-spin' : 'group-hover:rotate-180'}`} />
                Actualiser
              </button>
              
              <Link to="/create" className="group relative inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                Nouveau patient
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              </Link>
            </div>
          </div>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="group bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:bg-white/80">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Patients
              </CardTitle>
              <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {total}
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <span className="text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +{percentageIncrease}%
                </span> 
                vs mois dernier
              </p>
            </CardContent>
          </Card>

          <Card className="group bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:bg-white/80">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Nouveaux ce mois
              </CardTitle>
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg group-hover:shadow-green-500/25 transition-all duration-300">
                <Activity className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {newThisMonth}
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <span className="text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Ce mois
                </span> 
                nouvelles admissions
              </p>
            </CardContent>
          </Card>

          <Card className="group bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:bg-white/80">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Suivis actifs
              </CardTitle>
              <div className="p-3 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl shadow-lg group-hover:shadow-purple-500/25 transition-all duration-300">
                <Shield className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {activeFollowUps}
              </div>
              <p className="text-xs text-gray-500">
                Patients en cours
              </p>
            </CardContent>
          </Card>

          <Card className="group bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-105 hover:bg-white/80">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Rendez-vous
              </CardTitle>
              <div className="p-3 bg-gradient-to-r from-orange-500 to-amber-600 rounded-xl shadow-lg group-hover:shadow-orange-500/25 transition-all duration-300">
                <Clock className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 mb-1">28</div>
              <p className="text-xs text-gray-500">
                Aujourd'hui
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Messages d'export */}
        {exportMessage && (
          <Alert className={`mb-6 backdrop-blur-sm ${
            exportMessage.includes('succès') 
              ? 'bg-green-50 border-green-200/50' 
              : 'bg-red-50 border-red-200/50'
          }`}>
            {exportMessage.includes('succès') ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={
              exportMessage.includes('succès') ? 'text-green-800' : 'text-red-800'
            }>
              {exportMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Barre d'outils principale */}
        <Card className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              
              {/* Barre de recherche améliorée */}
              <div className="flex-1 max-w-md">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Rechercher par nom ou âge..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 shadow-sm hover:shadow-md placeholder-gray-400"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>

              {/* Actions et filtres */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 hidden sm:inline">Trier par :</span>
                </div>
                
                <div className="flex bg-gray-100/80 backdrop-blur-sm rounded-xl p-1 border border-gray-200/50">
                  <button
                    onClick={() => setSortMethod("alphabetical")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      sortMethod === "alphabetical"
                        ? "bg-white text-blue-600 shadow-sm border border-blue-200"
                        : "text-gray-600 hover:text-gray-800 hover:bg-white/50"
                    }`}
                  >
                    Nom
                  </button>
                  <button
                    onClick={() => setSortMethod("date")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      sortMethod === "date"
                        ? "bg-white text-blue-600 shadow-sm border border-blue-200"
                        : "text-gray-600 hover:text-gray-800 hover:bg-white/50"
                    }`}
                  >
                    Date
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportClick}
                    disabled={isExporting || !sortedPatients || sortedPatients.length === 0}
                    className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Export...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Exporter PDF
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowImportForm(!showImportForm)}
                    className={`group inline-flex items-center px-4 py-2 rounded-xl shadow-sm text-sm font-medium transition-all duration-200 ${
                      showImportForm 
                        ? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700" 
                        : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700"
                    }`}
                  >
                    <Upload className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    {showImportForm ? "Fermer" : "Importer"}
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulaire d'import amélioré */}
        {showImportForm && (
          <Card className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg mb-8 animate-in slide-in-from-top-4 duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                  <Upload className="w-5 h-5 text-white" />
                </div>
                Importer des patients depuis Excel
              </CardTitle>
              <CardDescription>
                Sélectionnez un fichier .xlsx contenant les données des patients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid w-full max-w-sm items-center gap-2">
                  <label htmlFor="fileInput" className="text-sm font-medium text-gray-700">
                    Fichier Excel
                  </label>
                  <input
                    id="fileInput"
                    type="file"
                    accept=".xlsx"
                    className="flex h-12 w-full rounded-xl border border-gray-200/50 bg-white/80 backdrop-blur-sm px-4 py-3 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-blue-600 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 shadow-sm hover:shadow-md"
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleFileImport}
                    className="group inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-green-500/25 font-medium"
                  >
                    <Upload className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Lancer l'import
                  </button>
                  
                  {importMessage && (
                    <Alert className="flex-1 max-w-md bg-green-50 border-green-200/50 backdrop-blur-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800 font-medium">
                        {importMessage}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Messages d'état */}
        {error && (
          <Alert className="mb-8 bg-red-50 border-red-200/50 backdrop-blur-sm">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {isPending && (
          <Alert className="mb-8 bg-blue-50 border-blue-200/50 backdrop-blur-sm">
            <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
            <AlertDescription className="text-blue-800">
              Chargement des patients...
            </AlertDescription>
          </Alert>
        )}

        {/* Conteneur pour votre composant Patient2List */}
        {patientList && (
          <Card className="bg-white/70 backdrop-blur-xl border border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                Liste des patients
              </CardTitle>
              <CardDescription>
                {filteredPatients.length} patient(s) trouvé(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Patient2List patients={sortedPatients} title="Liste des patients" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HubAdmin;
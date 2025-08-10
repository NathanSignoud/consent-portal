import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, FileText, Eye, Loader2, AlertTriangle, ChevronRight, Download, Bookmark, Clock, CheckCircle } from 'lucide-react';
import LanguageSelector from '@/components/LanguageSelector';

interface Section {
  title: string;
  body: string;
}

const Divided = () => {
  const { id, pdfPath, language } = useParams<{ id: string; pdfPath: string; language: string }>();
  const navigate = useNavigate();
  const [sections, setSections] = useState<Section[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id || !pdfPath) return;

    const fetchDividedSections = async () => {
      setIsLoading(true);
      try {
        const decodedPath = decodeURIComponent(pdfPath);
        const fileName = decodedPath.split('/').pop();
        if (!fileName) throw new Error("Nom de fichier invalide");

        const res = await fetch(`/flask/divide/${fileName}/${language}`);
        if (!res.ok) throw new Error("Erreur lors de la division du PDF");

        const data = await res.json();
        const parsed = Array.isArray(data.sections) ? data.sections : [];
        setSections(parsed);
      } catch (err: any) {
        const message = err?.message || "Erreur inconnue";
        console.error("Erreur dans Divided:", message);
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDividedSections();
  }, [id, pdfPath]);

  const getDocumentName = () => {
    if (!pdfPath) return "Document";
    const decodedPath = decodeURIComponent(pdfPath);
    return decodedPath.split('/').pop()?.replace('.pdf', '') || "Document";
  };

  const handleSectionClick = (section: Section) => {
    navigate(`/section/${id}/${language}`, { 
      state: { 
        title: section.title, 
        body: section.body,
        documentName: getDocumentName(),
      } 
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <div>
              <p className="text-gray-700 font-medium">Analyse du document en cours...</p>
              <p className="text-sm text-gray-500">Division en sections</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-lg max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de traitement</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Réessayer
              </button>
              <button
                onClick={() => navigate(`/patient2/${id}`)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40 relative overflow-hidden">
      {/* Éléments décoratifs de fond */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-indigo-200/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-purple-200/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Navigation et en-tête */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(`/patient2/${id}`)}
            className="group inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-sm text-gray-700 hover:bg-white hover:shadow-md transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Retour au patient
          </button>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Document analysé</p>
              <p className="font-semibold text-gray-900">{sections.length} section(s) trouvée(s)</p>
            </div>
          </div>
        </div>

        {/* En-tête du document */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
              PDF
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {getDocumentName()}
              </h1>
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4" />
                  <span className="text-sm font-medium">{sections.length} sections</span>
                </div>
                {sections.length > 0 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Analyse terminée</span>
                  </div>
                )}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50/80 backdrop-blur-sm rounded-xl border border-blue-200/50">
                <p className="text-sm text-blue-700">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Cliquez sur une section pour l'afficher en détail
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des sections */}
        {sections.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune section détectée</h3>
              <p className="text-gray-500">Le document ne contient pas de sections analysables</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Sections du document</h2>
              <p className="text-gray-600">Sélectionnez une section pour la consulter</p>
            </div>

            {sections.map((section, idx) => (
              <div
                key={idx}
                onClick={() => handleSectionClick(section)}
                className="group bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-[1.01] hover:bg-white/90"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                      {idx + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {section.title}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Section {idx + 1}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>Contenu disponible</span>
                        </div>
                      </div>
                      
                      {/* Aperçu du contenu */}
                      <div className="mt-3 p-3 bg-gray-50/80 backdrop-blur-sm rounded-lg border border-gray-200/50">
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {section.body.length > 150 
                            ? `${section.body.substring(0, 150)}...` 
                            : section.body
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-all duration-200">
                      <Eye className="w-5 h-5 text-blue-600 group-hover:text-white" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200" />
                  </div>
                </div>

                {/* Barre de progression visuelle */}
                <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Actions globales */}
        {sections.length > 0 && (
          <div className="mt-8 bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Download className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Actions sur le document</h3>
                  <p className="text-sm text-gray-600">Gérer l'ensemble des sections</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm">
                  <Download className="w-4 h-4" />
                  Télécharger PDF
                </button>
                
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm">
                  <FileText className="w-4 h-4" />
                  Générer rapport
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Divided;
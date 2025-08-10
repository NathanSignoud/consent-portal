import { FileText, Eye, Download, Calendar, Scale, File, ExternalLink, FolderOpen } from "lucide-react";

// Mock Link component for demonstration
const Link = ({ to, children, className, ...props }) => (
  <a href={to} className={className} {...props}>
    {children}
  </a>
);

interface PatientDocumentsProps {
  patientId: string;
  language: string;
}

const fixedPDFs = [
  {
    filename: "Règlement de fonctionnement",
    path: "Reglement_de_fonctionnement.pdf",
    type: "Règlement",
    size: "1.2 MB",
    lastModified: "2024-01-15"
  },
  {
    filename: "Règlement juridique d'intervention",
    path: "Reglement_juridique_intervention.pdf",
    type: "Juridique",
    size: "890 KB",
    lastModified: "2024-01-20"
  }
];

const PatientDocuments = ({ patientId, language }: PatientDocumentsProps) => {

  console.log(`Patient ID: ${patientId}, Language: ${language}`);

  const getDocumentTypeConfig = (type: string) => {
    switch (type.toLowerCase()) {
      case 'règlement':
        return {
          color: 'bg-blue-100 text-blue-700 border-blue-200',
          icon: <FileText className="w-3 h-3" />
        };
      case 'juridique':
        return {
          color: 'bg-purple-100 text-purple-700 border-purple-200',
          icon: <Scale className="w-3 h-3" />
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: <File className="w-3 h-3" />
        };
    }
  };

  const formatFileSize = (size: string) => {
    return size;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (fixedPDFs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FolderOpen className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun document disponible</h3>
        <p className="text-gray-500">Les documents du patient apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* En-tête avec statistiques */}
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Documents disponibles</h3>
              <p className="text-sm text-gray-600">{fixedPDFs.length} document(s) PDF</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <File className="w-4 h-4" />
              <span>PDF</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="w-4 h-4" />
              <span>Téléchargeables</span>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des documents */}
      <div className="space-y-4">
        {fixedPDFs.map((pdf, index) => {
          const typeConfig = getDocumentTypeConfig(pdf.type);
          
          return (
            <div
              key={index}
              className="group bg-white/50 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] hover:bg-white/80"
            >
              <div className="flex items-start justify-between">
                
                {/* Informations du document */}
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                    PDF
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                          {pdf.filename}
                        </h4>
                        
                        {/* Métadonnées */}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <File className="w-3 h-3" />
                            <span>{formatFileSize(pdf.size)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(pdf.lastModified)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Badge de type */}
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${typeConfig.color}`}>
                        {typeConfig.icon}
                        {pdf.type}
                      </div>
                    </div>
                    
                    {/* Chemin du fichier */}
                    <div className="text-xs text-gray-500 bg-gray-50/80 backdrop-blur-sm px-3 py-1 rounded-lg font-mono">
                      {pdf.path}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <Link
                    to={`/patient/${patientId}/divide/${encodeURIComponent(pdf.path)}/${language}`}
                    className="group/link inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <Eye className="w-4 h-4 group-hover/link:scale-110 transition-transform" />
                    <span>Voir</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </Link>
                  
                  <button className="group/download inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 shadow-sm hover:shadow-md">
                    <Download className="w-4 h-4 group-hover/download:scale-110 transition-transform" />
                    <span>Télécharger</span>
                  </button>
                </div>
              </div>
              
              {/* Barre de progression visuelle */}
              <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions globales */}
      <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Download className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Actions groupées</h4>
              <p className="text-sm text-gray-600">Gérer tous les documents</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-sm">
              <Download className="w-4 h-4" />
              Télécharger tout
            </button>
            
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors shadow-sm">
              <FileText className="w-4 h-4" />
              Générer rapport
            </button>
          </div>
        </div>
      </div>
      
      {/* Informations sur les documents */}
      <div className="bg-blue-50/80 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/50">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">À propos des documents</h4>
            <p className="text-sm text-blue-700 mb-2">
              Ces documents sont des références réglementaires liées au suivi du patient.
            </p>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• Les documents sont au format PDF et peuvent être téléchargés</li>
              <li>• Cliquez sur "Voir" pour ouvrir le document dans un nouvel onglet</li>
              <li>• Utilisez "Télécharger" pour sauvegarder le fichier localement</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDocuments;
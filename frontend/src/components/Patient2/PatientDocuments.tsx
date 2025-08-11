import React, { useState, useMemo, useCallback } from "react";
import { 
  FileText, 
  Eye, 
  Download, 
  Calendar, 
  Scale, 
  File, 
  ExternalLink, 
  FolderOpen,
  Search,
  Filter,
  Upload,
  Trash2,
  Share2,
  Archive,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Tag,
  MoreHorizontal,
  Folder,
  Image,
  FileImage,
  Video,
  Music
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Interface pour un document patient
interface PatientDocument {
  id?: string;
  filename: string;
  path: string;
  type: 'Règlement' | 'Juridique' | 'Medical' | 'Administratif' | 'Consentement' | 'Autre';
  category?: string;
  size: string;
  lastModified: string;
  createdBy?: string;
  description?: string;
  tags?: string[];
  status?: 'active' | 'archived' | 'pending';
  version?: string;
  downloadCount?: number;
  isPrivate?: boolean;
  expiryDate?: string;
  fileType?: 'pdf' | 'doc' | 'docx' | 'jpg' | 'png' | 'mp4' | 'mp3' | 'other';
}

interface PatientDocumentsProps {
  patientId: string;
  patientName?: string;
  language: string;
  
  // Props pour les documents
  documents?: PatientDocument[];
  isLoading?: boolean;
  
  // Actions disponibles
  onUpload?: (files: FileList) => void;
  onDownload?: (document: PatientDocument) => void;
  onDelete?: (documentId: string) => void;
  onShare?: (document: PatientDocument) => void;
  onArchive?: (documentId: string) => void;
  
  // Permissions
  canUpload?: boolean;
  canDelete?: boolean;
  canShare?: boolean;
  
  // Options d'affichage
  showSearch?: boolean;
  showFilters?: boolean;
  showStats?: boolean;
  compactMode?: boolean;
  groupByType?: boolean;
}

// Documents par défaut (mock data enrichie)
const defaultDocuments: PatientDocument[] = [
  {
    id: "doc_1",
    filename: "Règlement de fonctionnement",
    path: "Reglement_de_fonctionnement.pdf",
    type: "Règlement",
    category: "Réglementaire",
    size: "1.2 MB",
    lastModified: "2024-01-15",
    createdBy: "Dr. Martin",
    description: "Règlement interne de l'établissement de soins",
    tags: ["règlement", "fonctionnement", "obligatoire"],
    status: "active",
    version: "v2.1",
    downloadCount: 15,
    fileType: "pdf",
    isPrivate: false
  },
  {
    id: "doc_2",
    filename: "Règlement juridique d'intervention",
    path: "Reglement_juridique_intervention.pdf",
    type: "Juridique",
    category: "Légal",
    size: "890 KB",
    lastModified: "2024-01-20",
    createdBy: "Service juridique",
    description: "Cadre juridique des interventions médicales",
    tags: ["juridique", "intervention", "consentement"],
    status: "active",
    version: "v1.5",
    downloadCount: 8,
    fileType: "pdf",
    isPrivate: false
  },
  {
    id: "doc_3",
    filename: "Consentement éclairé",
    path: "Consentement_eclaire_template.pdf",
    type: "Consentement",
    category: "Médical",
    size: "450 KB",
    lastModified: "2024-02-01",
    createdBy: "Dr. Dupont",
    description: "Formulaire de consentement éclairé pour interventions",
    tags: ["consentement", "médical", "formulaire"],
    status: "active",
    version: "v3.0",
    downloadCount: 32,
    fileType: "pdf",
    isPrivate: false,
    expiryDate: "2024-12-31"
  }
];

const PatientDocuments: React.FC<PatientDocumentsProps> = ({ 
  patientId, 
  patientName,
  language,
  documents = defaultDocuments,
  isLoading = false,
  onUpload,
  onDownload,
  onDelete,
  onShare,
  onArchive,
  canUpload = true,
  canDelete = false,
  canShare = true,
  showSearch = true,
  showFilters = true,
  showStats = true,
  compactMode = false,
  groupByType = false
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [currentView, setCurrentView] = useState<'grid' | 'list'>('list');

  // Configuration des types de documents
  const getDocumentTypeConfig = useCallback((type: string) => {
    switch (type.toLowerCase()) {
      case 'règlement':
        return {
          color: 'bg-blue-100 text-blue-700 border-blue-200',
          icon: <FileText className="w-4 h-4" />,
          bgColor: 'from-blue-500 to-blue-600'
        };
      case 'juridique':
        return {
          color: 'bg-purple-100 text-purple-700 border-purple-200',
          icon: <Scale className="w-4 h-4" />,
          bgColor: 'from-purple-500 to-purple-600'
        };
      case 'medical':
        return {
          color: 'bg-green-100 text-green-700 border-green-200',
          icon: <FileText className="w-4 h-4" />,
          bgColor: 'from-green-500 to-green-600'
        };
      case 'consentement':
        return {
          color: 'bg-orange-100 text-orange-700 border-orange-200',
          icon: <CheckCircle className="w-4 h-4" />,
          bgColor: 'from-orange-500 to-orange-600'
        };
      case 'administratif':
        return {
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: <Folder className="w-4 h-4" />,
          bgColor: 'from-gray-500 to-gray-600'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-700 border-gray-200',
          icon: <File className="w-4 h-4" />,
          bgColor: 'from-gray-500 to-gray-600'
        };
    }
  }, []);

  // Icône selon le type de fichier
  const getFileTypeIcon = useCallback((fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return { icon: 'PDF', color: 'from-red-500 to-red-600' };
      case 'doc':
      case 'docx':
        return { icon: 'DOC', color: 'from-blue-500 to-blue-600' };
      case 'jpg':
      case 'png':
        return { icon: 'IMG', color: 'from-green-500 to-green-600' };
      case 'mp4':
        return { icon: 'VID', color: 'from-purple-500 to-purple-600' };
      case 'mp3':
        return { icon: 'AUD', color: 'from-yellow-500 to-yellow-600' };
      default:
        return { icon: 'FILE', color: 'from-gray-500 to-gray-600' };
    }
  }, []);

  // Filtrage des documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = searchQuery === "" || 
        doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = selectedType === "all" || doc.type === selectedType;
      const matchesStatus = selectedStatus === "all" || doc.status === selectedStatus;
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [documents, searchQuery, selectedType, selectedStatus]);

  // Groupement par type
  const groupedDocuments = useMemo(() => {
    if (!groupByType) return { 'Tous': filteredDocuments };
    
    return filteredDocuments.reduce((groups, doc) => {
      const type = doc.type;
      if (!groups[type]) groups[type] = [];
      groups[type].push(doc);
      return groups;
    }, {} as Record<string, PatientDocument[]>);
  }, [filteredDocuments, groupByType]);

  // Statistiques
  const stats = useMemo(() => {
    const total = documents.length;
    const active = documents.filter(doc => doc.status === 'active').length;
    const archived = documents.filter(doc => doc.status === 'archived').length;
    const totalSize = documents.reduce((acc, doc) => {
      const size = parseFloat(doc.size.replace(/[^\d.]/g, ''));
      const unit = doc.size.includes('MB') ? 1024 : 1;
      return acc + (size * unit);
    }, 0);
    
    return { total, active, archived, totalSize: Math.round(totalSize) };
  }, [documents]);

  // Handlers
  const handleDownload = useCallback((document: PatientDocument) => {
    if (onDownload) {
      onDownload(document);
    } else {
      // Fallback - téléchargement direct
      const link = document.createElement('a');
      link.href = `/pdf/${document.path}`;
      link.download = document.filename;
      link.click();
    }
  }, [onDownload]);

  const handleView = useCallback((document: PatientDocument) => {
    const url = `/patient/${patientId}/divide/${encodeURIComponent(document.path)}/${language}`;
    window.open(url, '_blank');
  }, [patientId, language]);

  const handleSelectDocument = useCallback((documentId: string, selected: boolean) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(documentId);
      } else {
        newSet.delete(documentId);
      }
      return newSet;
    });
  }, []);

  const handleBulkDownload = useCallback(() => {
    selectedDocuments.forEach(docId => {
      const doc = documents.find(d => d.id === docId);
      if (doc) handleDownload(doc);
    });
    setSelectedDocuments(new Set());
  }, [selectedDocuments, documents, handleDownload]);

  // Formatage
  const formatFileSize = useCallback((size: string) => size, []);
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }, []);

  // Composant Document Item
  const DocumentItem: React.FC<{ document: PatientDocument; compact?: boolean }> = ({ 
    document, 
    compact = false 
  }) => {
    const typeConfig = getDocumentTypeConfig(document.type);
    const fileTypeConfig = getFileTypeIcon(document.fileType || 'pdf');
    const isSelected = selectedDocuments.has(document.id || '');
    const isExpiring = document.expiryDate && new Date(document.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return (
      <Card className="group bg-white/50 backdrop-blur-sm border border-white/20 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] hover:bg-white/80">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            
            {/* Checkbox et icône */}
            <div className="flex items-start gap-4">
              {!compact && (
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => handleSelectDocument(document.id || '', e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300"
                />
              )}
              
              <div className={`w-12 h-12 bg-gradient-to-br ${fileTypeConfig.color} rounded-xl flex items-center justify-center text-white font-bold shadow-lg text-xs`}>
                {fileTypeConfig.icon}
              </div>
              
              {/* Informations du document */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {document.filename}
                    </h4>
                    
                    {document.description && !compact && (
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {document.description}
                      </p>
                    )}
                    
                    {/* Métadonnées */}
                    <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
                      <div className="flex items-center gap-1">
                        <File className="w-3 h-3" />
                        <span>{formatFileSize(document.size)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(document.lastModified)}</span>
                      </div>
                      {document.createdBy && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{document.createdBy}</span>
                        </div>
                      )}
                      {document.downloadCount !== undefined && (
                        <div className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          <span>{document.downloadCount} téléchargements</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Badges */}
                  <div className="flex flex-col gap-2 items-end">
                    <Badge variant="outline" className={typeConfig.color}>
                      {typeConfig.icon}
                      <span className="ml-1">{document.type}</span>
                    </Badge>
                    
                    {document.version && (
                      <Badge variant="secondary" className="text-xs">
                        {document.version}
                      </Badge>
                    )}
                    
                    {isExpiring && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Expire bientôt
                      </Badge>
                    )}
                    
                    {document.isPrivate && (
                      <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
                        Privé
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Tags */}
                {document.tags && document.tags.length > 0 && !compact && (
                  <div className="flex gap-1 mb-3 flex-wrap">
                    {document.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span 
                        key={tagIndex}
                        className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                    {document.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{document.tags.length - 3} autres</span>
                    )}
                  </div>
                )}
                
                {/* Chemin du fichier */}
                {!compact && (
                  <div className="text-xs text-gray-500 bg-gray-50/80 backdrop-blur-sm px-3 py-1 rounded-lg font-mono mb-3">
                    {document.path}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-4">
              <Button
                onClick={() => handleView(document)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
                size="sm"
              >
                <Eye className="w-4 h-4 mr-1" />
                Voir
                <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
              </Button>
              
              <Button
                onClick={() => handleDownload(document)}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-1" />
                Télécharger
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canShare && onShare && (
                    <DropdownMenuItem onClick={() => onShare(document)}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Partager
                    </DropdownMenuItem>
                  )}
                  
                  {onArchive && (
                    <DropdownMenuItem onClick={() => onArchive(document.id || '')}>
                      <Archive className="w-4 h-4 mr-2" />
                      Archiver
                    </DropdownMenuItem>
                  )}
                  
                  {canDelete && onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => onDelete(document.id || '')}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {/* Barre de progression */}
          <div className="mt-4 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 w-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Interface vide
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FolderOpen className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun document disponible</h3>
        <p className="text-gray-500 mb-4">Les documents du patient apparaîtront ici</p>
        {canUpload && onUpload && (
          <Button className="bg-blue-500 hover:bg-blue-600">
            <Upload className="w-4 h-4 mr-2" />
            Ajouter des documents
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* En-tête avec statistiques */}
      <Card className="bg-white/50 backdrop-blur-sm border border-white/20 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Documents du patient</h3>
                {patientName && (
                  <p className="text-sm text-gray-600">Patient: {patientName}</p>
                )}
                {showStats && (
                  <p className="text-sm text-gray-600">
                    {stats.total} document(s) • {stats.totalSize} KB total
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {selectedDocuments.size > 0 && (
                <Button onClick={handleBulkDownload} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Télécharger sélectionnés ({selectedDocuments.size})
                </Button>
              )}
              
              {canUpload && onUpload && (
                <Button className="bg-blue-500 hover:bg-blue-600">
                  <Upload className="w-4 h-4 mr-2" />
                  Ajouter
                </Button>
              )}
            </div>
          </div>
          
          {/* Statistiques détaillées */}
          {showStats && (
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
                <p className="text-sm text-blue-700">Actifs</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">{stats.archived}</p>
                <p className="text-sm text-gray-700">Archivés</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{stats.totalSize}</p>
                <p className="text-sm text-green-700">KB total</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recherche et filtres */}
      {(showSearch || showFilters) && (
        <Card className="bg-white/50 backdrop-blur-sm border border-white/20 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              
              {/* Recherche */}
              {showSearch && (
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Rechercher dans les documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              )}
              
              {/* Filtres */}
              {showFilters && (
                <div className="flex gap-3">
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="all">Tous types</option>
                    <option value="Règlement">Règlement</option>
                    <option value="Juridique">Juridique</option>
                    <option value="Medical">Médical</option>
                    <option value="Consentement">Consentement</option>
                    <option value="Administratif">Administratif</option>
                  </select>
                  
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="all">Tous statuts</option>
                    <option value="active">Actifs</option>
                    <option value="archived">Archivés</option>
                    <option value="pending">En attente</option>
                  </select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des documents */}
      {filteredDocuments.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Aucun document ne correspond aux critères de recherche.
          </AlertDescription>
        </Alert>
      ) : groupByType ? (
        <Tabs defaultValue={Object.keys(groupedDocuments)[0]} className="space-y-4">
          <TabsList className="grid w-full grid-cols-auto">
            {Object.entries(groupedDocuments).map(([type, docs]) => (
              <TabsTrigger key={type} value={type} className="flex items-center gap-2">
                {getDocumentTypeConfig(type).icon}
                {type} ({docs.length})
              </TabsTrigger>
            ))}
          </TabsList>
          
          {Object.entries(groupedDocuments).map(([type, docs]) => (
            <TabsContent key={type} value={type} className="space-y-4">
              {docs.map((document) => (
                <DocumentItem
                  key={document.id || document.path}
                  document={document}
                  compact={compactMode}
                />
              ))}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="space-y-4">
          {filteredDocuments.map((document) => (
            <DocumentItem
              key={document.id || document.path}
              document={document}
              compact={compactMode}
            />
          ))}
        </div>
      )}

      {/* Actions globales */}
      <Card className="bg-white/50 backdrop-blur-sm border border-white/20 shadow-sm">
        <CardContent className="p-6">
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
              <Button
                onClick={() => {
                  filteredDocuments.forEach(doc => handleDownload(doc));
                }}
                className="bg-green-500 hover:bg-green-600"
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger tout
              </Button>
              
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                Générer rapport
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Informations sur les documents */}
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <strong>À propos des documents :</strong> Ces documents sont des références liées au suivi du patient. 
          Cliquez sur "Voir" pour ouvrir dans un nouvel onglet ou "Télécharger" pour sauvegarder localement.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default PatientDocuments;
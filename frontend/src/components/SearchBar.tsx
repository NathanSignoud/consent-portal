import React, { useState, useMemo } from 'react';
import { Search, X, Filter, SortAsc, SortDesc } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  placeholder?: string;
  showAdvancedFilters?: boolean;
  onFilterChange?: (filters: SearchFilters) => void;
  sortOptions?: SortOption[];
  currentSort?: string;
  onSortChange?: (sort: string) => void;
  resultsCount?: number;
  className?: string;
}

interface SearchFilters {
  searchTerm: string;
  dateRange?: {
    from: string;
    to: string;
  };
  categories?: string[];
  status?: string[];
}

interface SortOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  searchTerm, 
  setSearchTerm,
  placeholder = "Rechercher par nom, prénom ou pathologie...",
  showAdvancedFilters = false,
  onFilterChange,
  sortOptions = [],
  currentSort,
  onSortChange,
  resultsCount,
  className = ""
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    searchTerm: searchTerm
  });

  const defaultSortOptions: SortOption[] = [
    { value: 'alphabetical', label: 'Alphabétique', icon: <SortAsc className="w-4 h-4" /> },
    { value: 'date', label: 'Date', icon: <SortDesc className="w-4 h-4" /> },
    { value: 'recent', label: 'Plus récent', icon: <SortDesc className="w-4 h-4" /> }
  ];

  const activeSortOptions = sortOptions.length > 0 ? sortOptions : defaultSortOptions;

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    const updatedFilters = { ...filters, searchTerm: value };
    setFilters(updatedFilters);
    onFilterChange?.(updatedFilters);
  };

  const clearSearch = () => {
    handleSearch('');
  };

  const handleFilterToggle = () => {
    setShowFilters(!showFilters);
  };

  const hasActiveFilters = useMemo(() => {
    return searchTerm.length > 0 || 
           filters.categories?.length || 
           filters.status?.length ||
           filters.dateRange?.from;
  }, [searchTerm, filters]);

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* Barre de recherche principale */}
      <div className="relative">
        <div className={`
          flex items-center w-full px-4 py-3 
          border rounded-xl shadow-sm bg-white
          transition-all duration-200
          ${isFocused 
            ? 'border-blue-400 ring-2 ring-blue-100 shadow-md' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}>
          <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
          
          <input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="flex-1 outline-none text-gray-900 placeholder-gray-500"
          />

          {/* Actions à droite */}
          <div className="flex items-center gap-2 ml-3">
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Effacer la recherche"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {showAdvancedFilters && (
              <button
                onClick={handleFilterToggle}
                className={`
                  p-2 rounded-lg transition-colors
                  ${showFilters || hasActiveFilters
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                  }
                `}
                title="Filtres avancés"
              >
                <Filter className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Indicateur de résultats */}
        {resultsCount !== undefined && (
          <div className="absolute top-full left-0 mt-1 text-sm text-gray-500">
            {resultsCount} résultat{resultsCount !== 1 ? 's' : ''} trouvé{resultsCount !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Barre de tri rapide */}
      {activeSortOptions.length > 0 && onSortChange && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Trier par :</span>
          {activeSortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onSortChange(option.value)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium
                transition-all duration-200
                ${currentSort === option.value
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* Filtres avancés (expandable) */}
      {showAdvancedFilters && showFilters && (
        <div className="bg-gray-50 border rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Filtres avancés</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtre par période */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Période</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Du"
                  onChange={(e) => {
                    const updatedFilters = {
                      ...filters,
                      dateRange: {
                        ...filters.dateRange,
                        from: e.target.value,
                        to: filters.dateRange?.to || ''
                      }
                    };
                    setFilters(updatedFilters);
                    onFilterChange?.(updatedFilters);
                  }}
                />
                <input
                  type="date"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="Au"
                  onChange={(e) => {
                    const updatedFilters = {
                      ...filters,
                      dateRange: {
                        from: filters.dateRange?.from || '',
                        to: e.target.value
                      }
                    };
                    setFilters(updatedFilters);
                    onFilterChange?.(updatedFilters);
                  }}
                />
              </div>
            </div>

            {/* Filtre par statut */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Statut</label>
              <select 
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                onChange={(e) => {
                  const updatedFilters = {
                    ...filters,
                    status: e.target.value ? [e.target.value] : []
                  };
                  setFilters(updatedFilters);
                  onFilterChange?.(updatedFilters);
                }}
              >
                <option value="">Tous les statuts</option>
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
              </select>
            </div>
          </div>

          {/* Actions des filtres */}
          <div className="flex justify-between pt-2 border-t border-gray-200">
            <button
              onClick={() => {
                const resetFilters: SearchFilters = { searchTerm: '' };
                setFilters(resetFilters);
                setSearchTerm('');
                onFilterChange?.(resetFilters);
              }}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Réinitialiser
            </button>
            
            <div className="text-sm text-gray-500">
              {hasActiveFilters ? 'Filtres appliqués' : 'Aucun filtre'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
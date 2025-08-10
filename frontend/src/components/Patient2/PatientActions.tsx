import { CheckCircle, Circle, Calendar, Filter, Clock, CheckSquare, AlertCircle } from "lucide-react";

interface Action {
  label: string;
  status: 'à faire' | 'réalisé';
  date?: string | null;
}

interface PatientActionsProps {
  actions: Action[];
  filter: 'all' | 'todo' | 'done';
  setFilter: (f: 'all' | 'todo' | 'done') => void;
  onToggle: (index: number) => void;
}

const PatientActions = ({ actions, filter, setFilter, onToggle }: PatientActionsProps) => {
  const filtered = actions.filter((action) => {
    if (filter === 'todo') return action.status === 'à faire';
    if (filter === 'done') return action.status === 'réalisé';
    return true;
  });

  const totalActions = actions.length;
  const completedActions = actions.filter(action => action.status === 'réalisé').length;
  const pendingActions = totalActions - completedActions;

  if (actions.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckSquare className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune action enregistrée</h3>
        <p className="text-gray-500">Les actions de suivi apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Filtres modernisés */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filtrer par :</span>
        </div>
        
        <div className="flex bg-gray-100/80 backdrop-blur-sm rounded-xl p-1 border border-gray-200/50 shadow-sm">
          <button 
            onClick={() => setFilter('all')} 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === 'all' 
                ? 'bg-white text-blue-600 shadow-md border border-blue-200/50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            Toutes
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs bg-blue-100 text-blue-700 rounded-full">
              {totalActions}
            </span>
          </button>
          
          <button 
            onClick={() => setFilter('todo')} 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === 'todo' 
                ? 'bg-white text-orange-600 shadow-md border border-orange-200/50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            À faire
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs bg-orange-100 text-orange-700 rounded-full">
              {pendingActions}
            </span>
          </button>
          
          <button 
            onClick={() => setFilter('done')} 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              filter === 'done' 
                ? 'bg-white text-green-600 shadow-md border border-green-200/50' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            Réalisées
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs bg-green-100 text-green-700 rounded-full">
              {completedActions}
            </span>
          </button>
        </div>
      </div>

      {/* Liste des actions */}
      {filtered.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-500">Aucune action correspondante</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((action, index) => {
            const isCompleted = action.status === 'réalisé';
            const originalIndex = actions.findIndex(a => a === action);
            
            return (
              <div 
                key={index} 
                className={`group relative p-4 bg-white/50 backdrop-blur-sm border border-white/20 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01] ${
                  isCompleted ? 'bg-green-50/50 border-green-200/50' : 'hover:bg-white/80'
                }`}
              >
                <div className="flex items-start gap-4">
                  
                  {/* Checkbox personnalisé */}
                  <button
                    onClick={() => onToggle(originalIndex)}
                    className={`flex-shrink-0 w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                      isCompleted 
                        ? 'bg-green-500 border-green-500 text-white hover:bg-green-600' 
                        : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Circle className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
                    )}
                  </button>

                  {/* Contenu de l'action */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`font-medium transition-all duration-300 ${
                          isCompleted 
                            ? 'line-through text-green-700' 
                            : 'text-gray-900'
                        }`}>
                          {action.label}
                        </p>
                        
                        {/* Statut et date */}
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            isCompleted 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {isCompleted ? (
                              <CheckSquare className="w-3 h-3" />
                            ) : (
                              <Clock className="w-3 h-3" />
                            )}
                            {action.status === 'réalisé' ? 'Terminé' : 'En attente'}
                          </span>
                          
                          {isCompleted && action.date && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {new Date(action.date).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Barre de progression visuelle pour les actions terminées */}
                {isCompleted && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-emerald-500 rounded-b-xl"></div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Barre de progression globale */}
      {totalActions > 0 && (
        <div className="mt-6 p-4 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progression générale</span>
            <span className="text-sm font-semibold text-gray-900">
              {completedActions} / {totalActions} actions terminées
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${totalActions > 0 ? (completedActions / totalActions) * 100 : 0}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span className="font-medium">
              {totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0}%
            </span>
            <span>100%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientActions;
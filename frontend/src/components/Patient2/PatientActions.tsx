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

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Toutes</button>
        <button onClick={() => setFilter('todo')} className={`px-3 py-1 rounded ${filter === 'todo' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>À faire</button>
        <button onClick={() => setFilter('done')} className={`px-3 py-1 rounded ${filter === 'done' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Faites</button>
      </div>

      <ul className="space-y-2">
        {filtered.map((action, index) => (
          <li key={index} className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={action.status === 'réalisé'}
              onChange={() => onToggle(index)}
            />
            <span className={action.status === 'réalisé' ? "line-through text-green-700" : "text-gray-800"}>
              {action.label}
            </span>
            {action.status === 'réalisé' && action.date && (
              <span className="text-sm text-gray-500">
                ({new Date(action.date).toLocaleDateString()})
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PatientActions;

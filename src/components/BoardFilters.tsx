import { Priority } from '../types';
import { Search, Filter, RefreshCw, X, PlusCircle, Users } from 'lucide-react';

interface BoardFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedClient: string;
  onClientChange: (clientName: string) => void;
  selectedPriority: string;
  onPriorityChange: (priority: string) => void;
  clientsList: string[];
  clearFilters: () => void;
  onAddCardClick: () => void;
}

export default function BoardFilters({
  searchQuery,
  onSearchChange,
  selectedClient,
  onClientChange,
  selectedPriority,
  onPriorityChange,
  clientsList,
  clearFilters,
  onAddCardClick
}: BoardFiltersProps) {
  
  const hasActiveFilters = searchQuery !== '' || selectedClient !== '' || selectedPriority !== '';

  return (
    <div id="board-filters" className="p-0 border-0 space-y-3 bg-transparent dark:bg-transparent">
      
      {/* Grid of inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1">
            Buscar por Texto
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Ex: Identidade ou checklist..."
              className="w-full pl-8 pr-8 py-1.5 border rounded-lg text-xs placeholder:text-slate-400 dark:placeholder:text-[#52525B] bg-white dark:bg-[#18181B] hover:bg-slate-50 dark:hover:bg-[#1E1E22] text-slate-800 dark:text-[#E4E4E7] border-slate-205 dark:border-[#27272A] focus:outline-hidden focus:ring-1 focus:ring-blue-500 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-800 dark:hover:text-[#E4E4E7] p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-[#27272A] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Client filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Users className="w-3 h-3 text-slate-400" />
            <span>Filtrar por Cliente</span>
          </label>
          <select
            value={selectedClient}
            onChange={e => onClientChange(e.target.value)}
            className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white dark:bg-[#18181B] hover:bg-slate-50 dark:hover:bg-[#1E1E22] text-slate-800 dark:text-[#E4E4E7] border-slate-205 dark:border-[#27272A] focus:outline-hidden focus:ring-1 focus:ring-blue-500 transition-colors"
          >
            <option value="" className="bg-white dark:bg-[#18181B] text-slate-800 dark:text-[#E4E4E7]">Exibir Todos os Clientes</option>
            {clientsList.map(client => (
              <option key={client} value={client} className="bg-white dark:bg-[#18181B] text-slate-800 dark:text-[#E4E4E7]">
                {client}
              </option>
            ))}
          </select>
        </div>

        {/* Priority filter */}
        <div>
          <label className="block text-[10px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider mb-1">
            Filtrar por Prioridade
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {(['all', 'low', 'medium', 'high'] as const).map(p => {
              const label = p === 'all' ? 'Todas' : p === 'low' ? 'Baixa' : p === 'medium' ? 'Média' : 'Alta';
              const isSelected = selectedPriority === p || (p === 'all' && selectedPriority === '');
              
              return (
                <button
                  key={p}
                  onClick={() => onPriorityChange(p === 'all' ? '' : p)}
                  className={`py-1.5 px-1 border rounded-lg text-xs font-bold cursor-pointer text-center truncate transition-all
                    ${isSelected 
                      ? 'bg-blue-500 text-white border-blue-500 font-bold shadow-xs' 
                      : 'bg-slate-50 dark:bg-[#18181B] text-slate-600 dark:text-[#A1A1AA] border-slate-200 dark:border-[#27272A] hover:bg-slate-100 dark:hover:bg-[#1E1E22]'
                    }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Clear active filter badge warning if active */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between border rounded-lg px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#1D1D21] border-slate-200 dark:border-[#27272A] text-slate-600 dark:text-[#E4E4E7]">
          <div className="flex items-center gap-2 font-medium">
            <Filter className="w-3.5 h-3.5 text-blue-500" />
            <span>
              Resultados parciais: limpando filtros exibe cards ocultados.
            </span>
          </div>
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 font-extrabold text-[#172b4d] dark:text-white dark:hover:text-blue-200 hover:bg-slate-100 dark:hover:bg-[#27272A] px-2.5 py-1 bg-white dark:bg-[#18181B] rounded-md border border-slate-200 dark:border-[#27272A] transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Limpar Filtros</span>
          </button>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Card, Column, Priority, Subtask, Client } from '../types';
import { INITIAL_LABELS } from '../data';
import { 
  X, 
  Plus, 
  Check, 
  Trash2, 
  Calendar, 
  AlertTriangle,
  User,
  FileText,
  Bookmark,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  card?: Card; // If present, we are editing. If undefined, we are creating.
  columns: Column[];
  currentColumnId?: string; // Default column for new cards
  clients: Client[];        // Dynamically registered clients list
  onSave: (cardData: Omit<Card, 'id' | 'createdAt'> & { id?: string; clientId?: string }) => void;
}

export default function TaskModal({
  isOpen,
  onClose,
  card,
  columns,
  currentColumnId,
  clients,
  onSave
}: TaskModalProps) {
  // Local state for all fields
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientId, setClientId] = useState(''); // Link directly to clients database
  const [description, setDescription] = useState('');
  const [columnId, setColumnId] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [validationError, setValidationError] = useState('');
  const [showManualClient, setShowManualClient] = useState(false);

  // Set initial fields when card changes or when modal is opened for add
  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setClientName(card.clientName || '');
      setClientId(card.clientId || '');
      setDescription(card.description || '');
      setColumnId(card.columnId);
      setPriority(card.priority);
      setDueDate(card.dueDate || '');
      setSubtasks(card.subtasks || []);
      setSelectedLabels(card.labels || []);
      
      // If there is a clientId, default to dropdown. Otherwise, if there is clientName, show manual.
      if (card.clientId) {
        setShowManualClient(false);
      } else if (card.clientName) {
        setShowManualClient(true);
      } else {
        setShowManualClient(false);
      }
    } else {
      setTitle('');
      setClientName('');
      setClientId('');
      setDescription('');
      setColumnId(currentColumnId || columns[0]?.id || 'todo');
      setPriority('medium');
      setDueDate('');
      setSubtasks([]);
      setSelectedLabels([]);
      setShowManualClient(false);
    }
    setNewSubtaskTitle('');
    setValidationError('');
  }, [card, isOpen, currentColumnId, columns]);

  if (!isOpen) return null;

  // Toggle label selection
  const handleToggleLabel = (labelName: string) => {
    if (selectedLabels.includes(labelName)) {
      setSelectedLabels(selectedLabels.filter(l => l !== labelName));
    } else {
      setSelectedLabels([...selectedLabels, labelName]);
    }
  };

  // Add a subtask
  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    
    const newSub: Subtask = {
      id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      title: newSubtaskTitle.trim(),
      completed: false
    };

    setSubtasks([...subtasks, newSub]);
    setNewSubtaskTitle('');
  };

  // Toggle subtask completion
  const handleToggleSubtask = (subtaskId: string) => {
    setSubtasks(subtasks.map(sub => 
      sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub
    ));
  };

  // Remove individual subtask
  const handleRemoveSubtask = (subtaskId: string) => {
    setSubtasks(subtasks.filter(sub => sub.id !== subtaskId));
  };

  // Handle Form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setValidationError('O título da tarefa é obrigatório.');
      return;
    }

    onSave({
      id: card?.id, // Will preserve original ID if editing
      title: title.trim(),
      clientName: showManualClient ? clientName.trim() : (clients.find(c => c.id === clientId)?.name || ''),
      clientId: showManualClient ? undefined : (clientId || undefined),
      description: description.trim(),
      columnId,
      priority,
      dueDate: dueDate || undefined,
      subtasks,
      labels: selectedLabels
    });
    
    onClose();
  };

  return (
    <div id="modal-overlay" className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div 
        id="modal-panel" 
        className="rounded-2xl w-full max-w-2xl shadow-2xl border flex flex-col max-h-[90vh] bg-white dark:bg-[#121215] border-slate-200 dark:border-[#27272A]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50 dark:bg-[#18181B] border-slate-200 dark:border-[#27272A] rounded-t-2xl">
          <h3 className="text-lg font-display font-bold text-slate-800 dark:text-[#E4E4E7]">
            {card ? 'Editar Cartão' : 'Criar Novo Cartão'}
          </h3>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-[#27272A] rounded-full text-slate-400 dark:text-[#71717A] hover:text-slate-800 dark:hover:text-[#E4E4E7] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body Scrollable area */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {validationError && (
            <div className="p-3.5 bg-red-50 dark:bg-[#2D161B] text-red-600 dark:text-rose-400 rounded-xl border border-red-200 dark:border-rose-900/40 flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Section 1: Title and Client Name */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-[#71717A] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <span>Título da Tarefa *</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => {
                  setTitle(e.target.value);
                  if (e.target.value) setValidationError('');
                }}
                placeholder="Ex: Desenvolver fluxo de checkout"
                className="w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-[#18181B] text-slate-800 dark:text-[#E4E4E7] border-slate-200 dark:border-[#27272A] placeholder:text-slate-400 dark:placeholder:text-[#52525B] focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-sm transition-shadow"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-[#71717A] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400 dark:text-[#71717A]" />
                  <span>Vincular Cliente</span>
                </label>
                {clients.length > 0 && !showManualClient ? (
                  <div className="space-y-2">
                    <select
                      value={clientId}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '__manual__') {
                          setShowManualClient(true);
                          setClientId('');
                          setClientName('');
                        } else {
                          setClientId(val);
                          const linked = clients.find(c => c.id === val);
                          setClientName(linked ? linked.name : '');
                        }
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-[#18181B] text-slate-800 dark:text-[#E4E4E7] border-slate-200 dark:border-[#27272A] focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-sm transition-shadow"
                    >
                      <option value="">-- Sem cliente --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                      <option value="__manual__">+ Cadastrar nome avulso...</option>
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={clientName}
                      onChange={e => setClientName(e.target.value)}
                      placeholder="Ex: Mendonça Advogados"
                      className="w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-[#18181B] text-slate-800 dark:text-[#E4E4E7] border-slate-200 dark:border-[#27272A] placeholder:text-slate-400 dark:placeholder:text-[#52525B] focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-sm transition-shadow"
                    />
                    {clients.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowManualClient(false);
                          setClientName('');
                          setClientId('');
                        }}
                        className="text-[10px] text-blue-500 font-semibold hover:underline"
                      >
                        Voltar para lista de clientes cadastrados
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-[#71717A] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-slate-400 dark:text-[#71717A]" />
                  <span>Data de Entrega</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-[#18181B] text-slate-800 dark:text-[#E4E4E7] border-slate-200 dark:border-[#27272A] focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-sm transition-shadow"
                />
              </div>
            </div>

          </div>

          {/* Section 2: Columns Layout (Column, Priority) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-[#71717A] uppercase tracking-wider mb-1.5">
                Coluna / Status
              </label>
              <select
                value={columnId}
                onChange={e => setColumnId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-[#18181B] text-slate-800 dark:text-[#E4E4E7] border-slate-200 dark:border-[#27272A] focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-sm transition-shadow"
              >
                {columns.map(col => (
                  <option key={col.id} value={col.id} className="bg-white dark:bg-[#18181B] text-slate-800 dark:text-[#E4E4E7]">
                    {col.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-[#71717A] uppercase tracking-wider mb-1.5">
                Prioridade
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as Priority[]).map(p => {
                  const label = p === 'low' ? 'Baixa' : p === 'medium' ? 'Média' : 'Alta';
                  const isSelected = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`py-2.5 px-1 text-xs font-bold rounded-xl border transition-all cursor-pointer text-center
                        ${isSelected 
                          ? p === 'high' 
                            ? 'bg-rose-50 dark:bg-[#3F1B22] text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-900/60 ring-2 ring-rose-900/30' 
                            : p === 'medium'
                              ? 'bg-amber-50 dark:bg-[#3F2B1B] text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-900/60 ring-2 ring-amber-900/30'
                              : 'bg-emerald-50 dark:bg-[#132F21] text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-950/60 ring-2 ring-emerald-950/30'
                          : 'bg-slate-50 dark:bg-[#18181B] text-slate-600 dark:text-[#A1A1AA] border-slate-200 dark:border-[#27272A] hover:bg-slate-100 dark:hover:bg-[#27272A]'
                        }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 3: Description */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-[#71717A] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400 dark:text-[#71717A]" />
              <span>Descrição detalhada</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Descreva o escopo da tarefa, combinados com o cliente ou links úteis..."
              className="w-full px-3.5 py-2.5 rounded-xl border bg-white dark:bg-[#18181B] text-slate-800 dark:text-[#E4E4E7] border-slate-200 dark:border-[#27272A] placeholder:text-slate-400 dark:placeholder:text-[#52525B] focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-sm transition-shadow"
            />
          </div>


          {/* Section 4: Labels / Tags */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-[#71717A] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-slate-400 dark:text-[#71717A]" />
              <span>Etiquetas de Classificação</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {INITIAL_LABELS.map(lbl => {
                const isSelected = selectedLabels.includes(lbl.name);
                return (
                  <button
                    key={lbl.name}
                    type="button"
                    onClick={() => handleToggleLabel(lbl.name)}
                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-all cursor-pointer flex items-center gap-1
                      ${isSelected 
                        ? `${lbl.color} ring-2 ring-offset-1 ring-slate-900/40 border-transparent font-semibold` 
                        : 'bg-slate-50 dark:bg-[#18181B] text-slate-600 dark:text-[#A1A1AA] border-slate-200 dark:border-[#27272A] hover:bg-slate-100 dark:hover:bg-[#1E1E22]'
                      }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                    {lbl.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Subtasks checklist manager */}
          <div className="space-y-3.5">
            <label className="block text-xs font-bold text-slate-500 dark:text-[#71717A] uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 dark:text-[#71717A]" />
              <span>Lista de Subtarefas ({subtasks.length})</span>
            </label>

            {/* Subtask input bar */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={e => setNewSubtaskTitle(e.target.value)}
                placeholder="Ex: Revisar layout mobile"
                className="flex-1 px-3.5 py-2.5 rounded-xl border text-slate-800 dark:text-[#E4E4E7] placeholder:text-slate-400 dark:placeholder:text-[#52525B] focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-sm bg-white dark:bg-[#18181B] border-slate-200 dark:border-[#27272A]"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask(e);
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded-xl font-medium text-sm flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Adicionar</span>
              </button>
            </div>

            {/* Subtask list */}
            {subtasks.length > 0 ? (
              <div className="border rounded-xl overflow-hidden bg-slate-50 dark:bg-[#18181B] border-slate-200 dark:border-[#27272A] divide-y divide-slate-100 dark:divide-[#27272A]">
                {subtasks.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between px-3.5 py-2.5 max-sm:gap-2">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={sub.completed}
                        onChange={() => handleToggleSubtask(sub.id)}
                        className="w-4 h-4 rounded text-blue-500 focus:ring-blue-500 border-slate-300 dark:border-[#27272A] cursor-pointer accent-blue-500"
                      />
                      <span className={`text-sm select-none truncate ${sub.completed ? 'line-through text-slate-400 dark:text-[#71717A]' : 'text-slate-700 dark:text-[#E4E4E7]'}`}>
                        {sub.title}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(sub.id)}
                      className="p-1 text-slate-400 dark:text-[#71717A] hover:text-rose-500 hover:bg-red-50 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer dark:hover:bg-[#2D161B]/50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-[#71717A] italic px-1">
                Nenhuma subtarefa adicionada para este cartão. Use o campo acima para preencher uma lista de checagem.
              </p>
            )}
          </div>

        </form>

        {/* Footer save/cancel buttons */}
        <div className="px-6 py-4 border-t bg-slate-50 dark:bg-[#18181B] border-slate-200 dark:border-[#27272A] rounded-b-2xl flex items-center justify-end gap-3.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-[#A1A1AA] dark:hover:text-white dark:hover:bg-[#27272A] rounded-xl transition-colors cursor-pointer"
          >
            Mandar de Volta (Cancelar)
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm rounded-xl transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            {card ? 'Salvar Alterações' : 'Criar Cartão'}
          </button>
        </div>
      </div>
    </div>
  );
}

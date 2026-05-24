import React, { useState, useRef, useEffect } from 'react';
import { Column, Card } from '../types';
import TaskCard from './TaskCard';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Layers,
  ArrowRightCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ColumnContainerProps {
  key?: any;
  column: Column;
  cards: Card[];
  columnsList: Column[];
  onEditCard: (card: Card) => void;
  onDeleteCard: (id: string) => void;
  onMoveCardColumn: (cardId: string, targetColumnId: string) => void;
  onRenameColumn: (columnId: string, newTitle: string) => void;
  onDeleteColumn: (columnId: string) => void;
  onAddCardToColumn: (columnId: string) => void;
  onTogglePause?: (cardId: string) => void;
}

export default function ColumnContainer({
  column,
  cards,
  columnsList,
  onEditCard,
  onDeleteCard,
  onMoveCardColumn,
  onRenameColumn,
  onDeleteColumn,
  onAddCardToColumn,
  onTogglePause
}: ColumnContainerProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(column.title);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleSaveTitle = () => {
    if (editedTitle.trim() && editedTitle.trim() !== column.title) {
      onRenameColumn(column.id, editedTitle.trim());
    } else {
      setEditedTitle(column.title);
    }
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setEditedTitle(column.title);
      setIsEditingTitle(false);
    }
  };

  return (
    <div 
      id={`column-${column.id}`} 
      className="p-3 bg-[#f1f2f4] dark:bg-[#161a1d] flex flex-col w-[280px] min-w-[280px] max-w-[280px] flex-shrink-0 rounded-xl h-full max-h-[100%] border border-[#dfe1e6]/50 dark:border-[#2c3440]/30 shadow-xs select-none overflow-hidden"
    >
      {/* Header of Column */}
      <div className="flex items-center justify-between mb-3.5 group/header min-h-[38px] px-1">
        {isEditingTitle ? (
          <div className="flex items-center gap-1.5 w-full">
            <input
              ref={inputRef}
              type="text"
              value={editedTitle}
              onChange={e => setEditedTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={handleKeyDown}
              maxLength={24}
              className="w-full bg-white dark:bg-[#18181B] px-2.5 py-1 text-sm font-sans font-bold rounded-lg border border-blue-500 text-slate-800 dark:text-[#E4E4E7] focus:outline-hidden"
            />
            <button 
              onMouseDown={handleSaveTitle} // Triggers before onBlur
              className="p-1 bg-blue-500 text-white rounded-md cursor-pointer shrink-0"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-grow min-w-0 pr-1 select-none">
            <h3 
              onDoubleClick={() => setIsEditingTitle(true)}
              title="Duplo clique para renomear"
              className="text-sm font-sans font-extrabold text-[#172b4d] dark:text-[#e4e4e7] truncate cursor-pointer hover:bg-slate-200/60 dark:hover:bg-[#1D1D21] px-1.5 py-0.5 rounded-lg transition-colors"
            >
              {column.title}
            </h3>
            <span className="bg-slate-200/80 dark:bg-[#1C1C21] border border-slate-300/30 dark:border-[#27272A] text-slate-650 dark:text-[#A1A1AA] text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">
              {cards.length}
            </span>
            <button
               onClick={() => setIsEditingTitle(true)}
              className="opacity-0 group-hover/header:opacity-100 p-1 text-slate-400 dark:text-[#71717A] hover:text-slate-800 dark:hover:text-white rounded-lg transition-opacity cursor-pointer hidden sm:block shrink-0"
            >
              <Edit className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Delete Column option if custom or empty lists */}
        {/* We can warn if list is not empty, but let user delete it anyway (will delete associated cards) */}
        <button
          onClick={() => onDeleteColumn(column.id)}
          title="Excluir Coluna"
          className="p-1 px-1.5 text-slate-405 dark:text-[#71717A] hover:text-rose-500 hover:bg-rose-50 dark:hover:text-rose-450 dark:hover:bg-[#2D161B] rounded-lg transition-all cursor-pointer shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Cards Scrollable Panel inside Column */}
      <div className="flex-1 overflow-y-auto space-y-2.5 min-h-0 pr-0.5 mb-2 select-none">
        <AnimatePresence mode="popLayout">
          {cards.length > 0 ? (
            cards.map(card => (
              <TaskCard
                key={card.id}
                card={card}
                columns={columnsList}
                onEdit={onEditCard}
                onDelete={onDeleteCard}
                onMoveColumn={onMoveCardColumn}
                onTogglePause={onTogglePause}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full min-h-[100px] rounded-xl border border-dashed border-slate-300 dark:border-[#27272A] flex flex-col items-center justify-center p-4 text-center text-slate-400 dark:text-[#71717A] bg-white/40 dark:bg-[#0A0A0C]/20"
            >
              <Layers className="w-5 h-5 mb-1 text-slate-300 dark:text-[#27272A]" />
              <p className="text-[10px] font-medium leading-relaxed">Nenhum cartão</p>
              <button
                onClick={() => onAddCardToColumn(column.id)}
                className="mt-1.5 text-[10px] font-bold text-blue-500 hover:text-blue-600 hover:underline cursor-pointer"
              >
                + Incluir agora
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>


      {/* Foot add control */}
      <button
        onClick={() => onAddCardToColumn(column.id)}
        className="w-full py-2 bg-transparent hover:bg-slate-300/35 dark:hover:bg-white/5 text-[#5e6c84] dark:text-[#9ba8b4] hover:text-[#172b4d] dark:hover:text-white flex items-center justify-center gap-1 text-xs font-bold rounded-lg transition-all cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Adicionar cartão</span>
      </button>
    </div>
  );
}

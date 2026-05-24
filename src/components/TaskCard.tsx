import React from 'react';
import { Card, Column, Priority } from '../types';
import { motion } from 'motion/react';
import { 
  CheckSquare, 
  Calendar, 
  Trash2, 
  Edit3, 
  ChevronLeft, 
  ChevronRight,
  User,
  Play,
  Pause,
  Clock
} from 'lucide-react';

interface TaskCardProps {
  key?: any;
  card: Card;
  columns: Column[];
  onEdit: (card: Card) => void;
  onDelete: (id: string) => void;
  onMoveColumn: (cardId: string, targetColumnId: string) => void;
  onTogglePause?: (cardId: string) => void;
}

export default function TaskCard({ 
  card, 
  columns, 
  onEdit, 
  onDelete, 
  onMoveColumn,
  onTogglePause
}: TaskCardProps) {
  
  // Calculate subtask progress
  const totalSubtasks = card.subtasks.length;
  const completedSubtasks = card.subtasks.filter(s => s.completed).length;
  const progressPercent = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  // Render Priority styles
  const getPriorityInfo = (p: Priority) => {
    switch (p) {
      case 'high':
        return { label: 'Alta', bg: 'bg-[#3F1B22] text-rose-400 border-rose-900/50', dot: 'bg-rose-500' };
      case 'medium':
        return { label: 'Média', bg: 'bg-[#3F2B1B] text-amber-400 border-amber-900/50', dot: 'bg-amber-500' };
      case 'low':
      default:
        return { label: 'Baixa', bg: 'bg-[#132F21] text-emerald-400 border-emerald-900/50', dot: 'bg-emerald-500' };
    }
  };

  const priorityInfo = getPriorityInfo(card.priority);

  // Format Due Date
  const isOverdue = card.dueDate ? new Date(card.dueDate) < new Date(new Date().setHours(0,0,0,0)) : false;
  const isNearDue = card.dueDate ? (() => {
    const timeDiff = new Date(card.dueDate).getTime() - new Date().getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff >= 0 && daysDiff <= 3;
  })() : false;

  const currentColumnIndex = columns.findIndex(col => col.id === card.columnId);

  return (
    <motion.div
      id={`task-card-${card.id}`}
      layoutId={card.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2, transition: { duration: 0.12 } }}
      className={`p-3 rounded-lg border transition-all duration-155 relative flex flex-col gap-2 group bg-white dark:bg-[#22272B] border-slate-300/40 dark:border-[#2C3440]/80 shadow-xs hover:shadow-sm hover:border-[#85B8FF] dark:hover:border-[#388BFF]
        ${card.isPaused 
          ? 'ring-2 ring-amber-400/50 border-amber-400/30' 
          : card.columnId === 'in_progress' 
            ? 'ring-1 ring-blue-500/20 border-blue-400/30' 
            : ''
        }`}
    >
      {/* Top badges bar */}
      <div className="flex items-center justify-between gap-1.5 flex-wrap">
        <div className="flex items-center gap-1 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-extrabold tracking-wide uppercase border ${priorityInfo.bg}`}>
            <span className={`w-1 h-1 rounded-full ${priorityInfo.dot}`}></span>
            {priorityInfo.label}
          </span>
          {card.isPaused && (
            <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-[#3F2B1B] text-amber-600 dark:text-amber-400 border border-amber-200/50 px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
              <Clock className="w-2.5 h-2.5 animate-pulse" /> Pausado
            </span>
          )}
        </div>

        {card.dueDate && (
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border
            ${card.columnId === 'done' 
              ? 'bg-slate-50 dark:bg-[#1E1E22] text-[#71717A] border-slate-200' 
              : isOverdue 
                ? 'bg-rose-50 dark:bg-[#3F1B22] text-rose-600 dark:text-rose-400 border-rose-200 animate-pulse' 
                : isNearDue 
                  ? 'bg-amber-50 dark:bg-[#3F2B1B] text-amber-600 dark:text-amber-400 border-amber-200' 
                  : 'bg-emerald-50 dark:bg-[#1B3F24] text-emerald-600 dark:text-emerald-400 border-emerald-200'
            }`}
          >
            <Calendar className="w-3 h-3" />
            {new Date(card.dueDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}
            {isOverdue && card.columnId !== 'done' && ' ⚠️'}
          </span>
        )}
      </div>

      {/* Client & Title */}
      <div className="space-y-0.5">
        {card.clientName && (
          <div className="flex items-center gap-1 text-[10px] font-extrabold text-[#0079BF] dark:text-[#579DFF] uppercase tracking-wider">
            <User className="w-2.5 h-2.5 text-[#0079BF] dark:text-[#579DFF]" />
            <span className="truncate max-w-[190px]">{card.clientName}</span>
          </div>
        )}
        <h4 className="text-[13px] font-sans font-semibold text-[#172b4d] dark:text-[#e4e4e7] leading-snug tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {card.title}
        </h4>
      </div>

      {/* Description */}
      {card.description && (
        <p className="text-[11px] text-[#5e6c84] dark:text-[#8B9AA7] line-clamp-2 leading-normal">
          {card.description}
        </p>
      )}

      {/* Custom labels */}
      {card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {card.labels.map(label => (
            <span 
              key={label} 
              className="text-[9px] font-bold bg-[#EBECF0] dark:bg-[#2C3440] text-slate-700 dark:text-[#E4E4E7] px-1.5 py-0.5 rounded border border-slate-300/30"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Subtasks Progress */}
      {totalSubtasks > 0 && (
        <div className="space-y-1 mt-0.5 border-t border-slate-200/50 dark:border-[#2C3440] pt-2">
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1 font-bold">
              <CheckSquare className="w-3 h-3 text-slate-400" />
              <span>Subtarefas</span>
            </div>
            <span className="font-extrabold text-slate-700 dark:text-white">{completedSubtasks}/{totalSubtasks}</span>
          </div>
          
          <div className="w-full bg-slate-200/60 dark:bg-[#27272A] h-1 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Command/Actions Tray */}
      <div className="flex items-center justify-between border-t border-slate-200/50 dark:border-[#2C3440] pt-2 mt-0.5">
        {/* Quick Column Moving Controls */}
        <div className="flex items-center gap-1">
          <button
            title="Mover para esquerda"
            disabled={currentColumnIndex <= 0}
            onClick={() => onMoveColumn(card.id, columns[currentColumnIndex - 1].id)}
            className="p-1 text-slate-400 hover:text-[#172b4d] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-md transition-colors cursor-pointer disabled:opacity-20"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          
          <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold select-none uppercase tracking-wider">
            Posição
          </span>

          <button
            title="Mover para direita"
            disabled={currentColumnIndex >= columns.length - 1}
            onClick={() => onMoveColumn(card.id, columns[currentColumnIndex + 1].id)}
            className="p-1 text-[#a1a1aa] hover:text-[#172b4d] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-md transition-colors cursor-pointer disabled:opacity-20"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Edit, Pause and Trash action block */}
        <div className="flex items-center gap-0.5">
          {onTogglePause && (
            <button
              onClick={() => onTogglePause(card.id)}
              title={card.isPaused ? "Retomar tarefa" : "Pausar tarefa"}
              className={`p-1 rounded-md transition-all cursor-pointer ${
                card.isPaused 
                  ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/25" 
                  : "text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              {card.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
          )}

          <button
            onClick={() => onEdit(card)}
            title="Editar card"
            className="p-1 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-md transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(card.id)}
            title="Excluir card"
            className="p-1 text-[#a1a1aa] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-md transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

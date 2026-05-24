import { Card } from '../types';
import { Kanban, CheckSquare, Calendar, Users, Percent } from 'lucide-react';

interface StatsBannerProps {
  cards: Card[];
}

export default function StatsBanner({ cards }: StatsBannerProps) {
  // Stats calculations
  const totalCards = cards.length;
  const inProgress = cards.filter(c => c.columnId === 'in_progress').length;
  const completed = cards.filter(c => c.columnId === 'done').length;

  // Subtask progress
  let totalSubtasks = 0;
  let completedSubtasks = 0;
  cards.forEach(card => {
    totalSubtasks += card.subtasks.length;
    completedSubtasks += card.subtasks.filter(s => s.completed).length;
  });

  const subtaskRate = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Active client names
  const clientSet = new Set(cards.map(c => c.clientName).filter(Boolean));
  const totalClients = clientSet.size;

  // Hard deadline urgency checker (due in less than 3 days, not completed)
  const today = new Date();
  const criticalDeadlines = cards.filter(card => {
    if (card.columnId === 'done' || !card.dueDate) return false;
    const dueDate = new Date(card.dueDate);
    const timeDiff = dueDate.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff <= 3; // Within 3 days or past due
  }).length;

  return (
    <div id="stats-banner-container" className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div id="stat-total" className="p-3 rounded-lg border flex items-center gap-3 bg-slate-50/50 dark:bg-white/5 border-slate-200/40 dark:border-white/5">
        <div className="p-2 bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded-lg">
          <Kanban className="w-4.5 h-4.5" />
        </div>
        <div>
          <p className="text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider">Total Cards</p>
          <p className="text-base font-sans font-black text-slate-800 dark:text-white leading-none mt-0.5">{totalCards}</p>
        </div>
      </div>

      <div id="stat-in-progress" className="p-3 rounded-lg border flex items-center gap-3 bg-slate-50/50 dark:bg-white/5 border-slate-200/40 dark:border-white/5">
        <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
          <CheckSquare className="w-4.5 h-4.5" />
        </div>
        <div>
          <p className="text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider">Em Progresso</p>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base font-sans font-black text-slate-800 dark:text-white leading-none">{inProgress}</span>
            <span className="text-[9px] text-slate-400">/ {totalCards - completed}</span>
          </div>
        </div>
      </div>

      <div id="stat-subtask-rate" className="p-3 rounded-lg border flex items-center gap-3 bg-slate-50/50 dark:bg-white/5 border-slate-200/40 dark:border-white/5">
        <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
          <Percent className="w-4.5 h-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider">Subtarefas</p>
          <div className="flex items-center gap-1 mt-0.5">
            <p className="text-base font-sans font-black text-slate-800 dark:text-white leading-none">{subtaskRate}%</p>
            <span className="text-[9px] text-slate-400">({completedSubtasks})</span>
          </div>
        </div>
      </div>

      <div id="stat-clients" className="p-3 rounded-lg border flex items-center gap-3 bg-slate-50/50 dark:bg-white/5 border-slate-200/40 dark:border-white/5">
        <div className="p-2 bg-sky-500/10 text-sky-500 rounded-lg">
          <Users className="w-4.5 h-4.5" />
        </div>
        <div>
          <p className="text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider">Clientes</p>
          <p className="text-base font-sans font-black text-slate-800 dark:text-white leading-none mt-0.5">{totalClients}</p>
        </div>
      </div>

      <div id="stat-urgencies" className="p-3 rounded-lg border flex items-center gap-3 col-span-2 md:col-span-1 bg-slate-50/50 dark:bg-white/5 border-slate-200/40 dark:border-white/5">
        <div className={`p-2 rounded-lg ${criticalDeadlines > 0 ? 'bg-red-500/10 text-red-500 dark:text-rose-450' : 'bg-slate-400/10 text-slate-450'}`}>
          <Calendar className="w-4.5 h-4.5" />
        </div>
        <div>
          <p className="text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider">Críticos</p>
          <p className={`text-base font-sans font-black leading-none mt-0.5 ${criticalDeadlines > 0 ? 'text-red-500 dark:text-rose-450' : 'text-slate-800 dark:text-white'}`}>
            {criticalDeadlines}
          </p>
        </div>
      </div>
    </div>
  );
}

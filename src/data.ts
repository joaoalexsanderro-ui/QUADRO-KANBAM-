import { Column, Card } from './types';

export const DEFAULT_COLUMNS: Column[] = [
  { id: 'todo', title: 'A Fazer' },
  { id: 'in_progress', title: 'Em Progresso' },
  { id: 'review', title: 'Em Revisão' },
  { id: 'done', title: 'Concluído' }
];

export const INITIAL_LABELS = [
  { name: 'Design', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { name: 'Marketing', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { name: 'Faturamento', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { name: 'Desenvolvimento', color: 'bg-sky-100 text-sky-700 border-sky-200' },
  { name: 'Urgente', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  { name: 'Reunião', color: 'bg-purple-100 text-purple-700 border-purple-200' }
];

export const INITIAL_CARDS: Card[] = [
  {
    id: 'card-1',
    title: 'Desenvolver Landing Page de Vendas',
    clientName: 'TechStart Inc',
    description: 'Criar uma landing page moderna em React e Tailwind para o lançamento do novo produto de SaaS corporativo. O layout deve conter seção de preços flexível, depoimentos de clientes e call-to-action visível.',
    subtasks: [
      { id: 'sub-1', title: 'Definir wireframe e seções da página', completed: true },
      { id: 'sub-2', title: 'Codificar layout responsivo com Tailwind', completed: false },
      { id: 'sub-3', title: 'Integrar formulário de captura de lead', completed: false },
      { id: 'sub-4', title: 'Otimizar SEO e velocidade de carregamento', completed: false }
    ],
    priority: 'high',
    dueDate: '2026-06-05',
    labels: ['Desenvolvimento', 'Design', 'Urgente'],
    createdAt: '2026-05-20T10:00:00.000Z',
    columnId: 'todo'
  },
  {
    id: 'card-2',
    title: 'Planejamento de Campanha de Tráfego Pago',
    clientName: 'Restaurante Sabor Real',
    description: 'Estruturar o funil de anúncios no Meta Ads e Google Ads com foco no público local do restaurante para aumentar as reservas nos fins de semana e pedidos de delivery durante a semana.',
    subtasks: [
      { id: 'sub-5', title: 'Selecionar criativos e fotos dos pratos', completed: true },
      { id: 'sub-6', title: 'Definir públicos de teste de interesses', completed: true },
      { id: 'sub-7', title: 'Escrever copies dos anúncios', completed: false }
    ],
    priority: 'medium',
    dueDate: '2026-05-28',
    labels: ['Marketing'],
    createdAt: '2026-05-22T14:30:00.000Z',
    columnId: 'in_progress'
  },
  {
    id: 'card-3',
    title: 'Revisão de Termos e Contrato de Assessoria',
    clientName: 'Mendonça Advogados',
    description: 'Analisar e ajustar as cláusulas de confidencialidade e prazos do novo contrato antes da assinatura pela diretoria de operações.',
    subtasks: [
      { id: 'sub-8', title: 'Revisar cláusula de rescisão contratual', completed: true },
      { id: 'sub-9', title: 'Coletar assinaturas digitais', completed: true }
    ],
    priority: 'low',
    dueDate: '2026-05-25',
    labels: ['Reunião', 'Urgente'],
    createdAt: '2026-05-18T09:15:00.000Z',
    columnId: 'review'
  },
  {
    id: 'card-4',
    title: 'Criação de Logotipo e Identidade Visual',
    clientName: 'Mendonça Advogados',
    description: 'Construir a marca secundária para a filial sul com guia de estilo, variação de paleta de cores e tipografia corporativa elegante.',
    subtasks: [
      { id: 'sub-10', title: 'Briefing inicial com as preferências', completed: true },
      { id: 'sub-11', title: 'Apresentar 3 alternativas conceituais', completed: true },
      { id: 'sub-12', title: 'Exportar arquivos finais em SVG/PNG', completed: true }
    ],
    priority: 'medium',
    dueDate: '2026-05-20',
    labels: ['Design'],
    createdAt: '2026-05-15T11:00:00.000Z',
    columnId: 'done'
  }
];

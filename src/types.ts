export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export type Priority = 'low' | 'medium' | 'high';

export interface Card {
  id: string;
  userId?: string;        // For multi-user database isolation
  title: string;
  clientName: string;
  clientId?: string;      // Link task directly to a Client
  description: string;
  subtasks: Subtask[];
  priority: Priority;
  dueDate?: string;
  labels: string[];
  createdAt: string;
  columnId: string;
  isPaused?: boolean;     // Pause capability
}

export interface Column {
  id: string;
  title: string;
  userId?: string;
}

export interface Client {
  id: string;
  userId?: string;        // Database link
  name: string;
  email: string;
  phone: string;
  projectName?: string;
  notes: string;
  createdAt: string;
}

export interface FilterState {
  search: string;
  clientName: string;
  priority: string;
}

export interface User {
  id: string;
  username: string;
  createdAt: string;
}

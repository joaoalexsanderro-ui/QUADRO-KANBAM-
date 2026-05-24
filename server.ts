import express from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

// Strict single-file Node JSON Database
interface DBStructure {
  users: Array<{ id: string; username: string; passwordHash: string; createdAt: string }>;
  cards: any[];
  columns: any[];
  clients: any[];
}

const DB_PATH = path.join(process.cwd(), 'db.json');

// Initialize local database with structure if not exists
function getDBState(): DBStructure {
  if (!fs.existsSync(DB_PATH)) {
    const initialState: DBStructure = {
      users: [],
      cards: [],
      columns: [],
      clients: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialState, null, 2), 'utf-8');
    return initialState;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    const emptyState: DBStructure = { users: [], cards: [], columns: [], clients: [] };
    fs.writeFileSync(DB_PATH, JSON.stringify(emptyState, null, 2), 'utf-8');
    return emptyState;
  }
}

function saveDBState(state: DBStructure) {
  fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), 'utf-8');
}

// In-memory sessions representation
const activeSessions: Record<string, string> = {}; // token -> userId

const app = express();
const PORT = 3000;

app.use(express.json());

// Auth Middleware
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    // Check if token in query string
    token = req.query.token as string;
  }

  if (!token) {
    return res.status(401).json({ error: 'Não autorizado. Token de sessão não fornecido.' });
  }

  const userId = activeSessions[token];
  if (!userId) {
    return res.status(401).json({ error: 'Sessão expirada ou inválida. Por favor, faça login novamente.' });
  }

  const db = getDBState();
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    return res.status(401).json({ error: 'Usuário não encontrado.' });
  }

  req.user = { id: user.id, username: user.username };
  req.token = token;
  next();
}

// SHA256 Password Hasher
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// Register a new user
app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password || username.trim() === '' || password.trim() === '') {
    return res.status(400).json({ error: 'Nome de usuário e senha são obrigatórios.' });
  }

  const db = getDBState();
  const lowerUsername = username.trim().toLowerCase();

  const userExists = db.users.some(u => u.username.toLowerCase() === lowerUsername);
  if (userExists) {
    return res.status(400).json({ error: 'Este nome de usuário já está sendo utilizado.' });
  }

  const newUser = {
    id: crypto.randomUUID(),
    username: username.trim(),
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);

  // Initialize columns for the user
  const userColumns = [
    { id: 'todo', title: 'A Fazer', userId: newUser.id },
    { id: 'in_progress', title: 'Em Progresso', userId: newUser.id },
    { id: 'review', title: 'Em Revisão', userId: newUser.id },
    { id: 'done', title: 'Concluído', userId: newUser.id }
  ];
  db.columns.push(...userColumns);

  saveDBState(db);

  // Auto-login after registration
  const token = crypto.randomBytes(32).toString('hex');
  activeSessions[token] = newUser.id;

  res.status(201).json({
    token,
    user: { id: newUser.id, username: newUser.username }
  });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Por favor, preencha nome de usuário e senha.' });
  }

  const db = getDBState();
  const user = db.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());

  if (!user || user.passwordHash !== hashPassword(password)) {
    return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  activeSessions[token] = user.id;

  res.json({
    token,
    user: { id: user.id, username: user.username }
  });
});

// Get currently authenticated user status
app.get('/api/auth/me', authenticateToken, (req: any, res) => {
  res.json({ user: req.user });
});

// Logout
app.post('/api/auth/logout', authenticateToken, (req: any, res) => {
  delete activeSessions[req.token];
  res.json({ success: true });
});

// ==========================================
// COLUMNS ENDPOINTS
// ==========================================

// Get user columns
app.get('/api/columns', authenticateToken, (req: any, res) => {
  const db = getDBState();
  const userCols = db.columns.filter(c => c.userId === req.user.id);
  res.json(userCols);
});

// Add custom column
app.post('/api/columns', authenticateToken, (req: any, res) => {
  const { title } = req.body;
  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'O título da lista é obrigatório.' });
  }

  const db = getDBState();
  const rawId = 'col-' + crypto.randomBytes(4).toString('hex');

  const newColumn = {
    id: rawId,
    title: title.trim(),
    userId: req.user.id
  };

  db.columns.push(newColumn);
  saveDBState(db);

  res.status(201).json(newColumn);
});

// Rename column
app.put('/api/columns/:id', authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const { title } = req.body;

  if (!title || title.trim() === '') {
    return res.status(400).json({ error: 'O título não pode ser vazio.' });
  }

  const db = getDBState();
  const colIndex = db.columns.findIndex(c => c.id === id && c.userId === req.user.id);
  
  if (colIndex === -1) {
    return res.status(404).json({ error: 'Coluna não encontrada.' });
  }

  db.columns[colIndex].title = title.trim();
  saveDBState(db);

  res.json(db.columns[colIndex]);
});

// Delete column
app.delete('/api/columns/:id', authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const db = getDBState();

  const isOwner = db.columns.some(c => c.id === id && c.userId === req.user.id);
  if (!isOwner) {
    return res.status(404).json({ error: 'Coluna não encontrada.' });
  }

  // Remove column
  db.columns = db.columns.filter(c => !(c.id === id && c.userId === req.user.id));

  // Re-map or delete cards that belonged to that column to 'todo'
  db.cards.forEach(card => {
    if (card.columnId === id && card.userId === req.user.id) {
      card.columnId = 'todo';
    }
  });

  saveDBState(db);
  res.json({ success: true });
});




// ==========================================
// CLIENTS ENDPOINTS
// ==========================================

// Get user clients
app.get('/api/clients', authenticateToken, (req: any, res) => {
  const db = getDBState();
  const userClients = db.clients.filter(c => c.userId === req.user.id);
  res.json(userClients);
});

// Add client
app.post('/api/clients', authenticateToken, (req: any, res) => {
  const { name, email, phone, projectName, notes } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'O nome do cliente é obrigatório.' });
  }

  const db = getDBState();
  const newClient = {
    id: crypto.randomUUID(),
    userId: req.user.id,
    name: name.trim(),
    email: (email || '').trim(),
    phone: (phone || '').trim(),
    projectName: (projectName || '').trim(),
    notes: (notes || '').trim(),
    createdAt: new Date().toISOString()
  };

  db.clients.push(newClient);
  saveDBState(db);

  res.status(201).json(newClient);
});

// Delete client
app.delete('/api/clients/:id', authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const db = getDBState();

  const isOwner = db.clients.some(c => c.id === id && c.userId === req.user.id);
  if (!isOwner) {
    return res.status(404).json({ error: 'Cliente não encontrado.' });
  }

  db.clients = db.clients.filter(c => !(c.id === id && c.userId === req.user.id));
  
  // Unlink cards that had this client
  db.cards.forEach(card => {
    if (card.clientId === id && card.userId === req.user.id) {
      card.clientId = undefined;
    }
  });

  saveDBState(db);
  res.json({ success: true });
});


// ==========================================
// CARDS (TASKS) ENDPOINTS
// ==========================================

// Get user cards
app.get('/api/cards', authenticateToken, (req: any, res) => {
  const db = getDBState();
  let userCards = db.cards.filter(c => c.userId === req.user.id);

  // AUTOMATIC CLASSIFICATION RULE:
  // "mostra as tarefas atrasadas no quadro atrasadas concluídas no quadro concluídas"
  // Let's sweep cards dynamically:
  // 1) If the task is completed (e.g. columnId is 'done'), make sure it is in 'done' column.
  // 2) If the task has a dueDate, it has passed, and columnId is NOT 'done', we can dynamically warn or handle.
  // We can let the frontend calculate the column mapping, or map columns dynamically.
  // Let's store the raw object and update it here or allow user to move / toggle dynamically. We support both.
  
  res.json(userCards);
});

// Create task card
app.post('/api/cards', authenticateToken, (req: any, res) => {
  const cardData = req.body;
  
  if (!cardData.title || cardData.title.trim() === '') {
    return res.status(400).json({ error: 'O título da tarefa é obrigatório.' });
  }

  const db = getDBState();
  const newCard = {
    ...cardData,
    id: crypto.randomUUID(),
    userId: req.user.id,
    subtasks: cardData.subtasks || [],
    labels: cardData.labels || [],
    createdAt: new Date().toISOString(),
    isPaused: !!cardData.isPaused
  };

  db.cards.push(newCard);
  saveDBState(db);

  res.status(201).json(newCard);
});

// Update task card
app.put('/api/cards/:id', authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const updatePayload = req.body;

  const db = getDBState();
  const cardIndex = db.cards.findIndex(c => c.id === id && c.userId === req.user.id);

  if (cardIndex === -1) {
    return res.status(404).json({ error: 'Cartão não encontrado.' });
  }

  // Edit card indices
  const currentCard = db.cards[cardIndex];
  db.cards[cardIndex] = {
    ...currentCard,
    title: updatePayload.title !== undefined ? updatePayload.title : currentCard.title,
    clientName: updatePayload.clientName !== undefined ? updatePayload.clientName : currentCard.clientName,
    clientId: updatePayload.clientId !== undefined ? updatePayload.clientId : currentCard.clientId,
    description: updatePayload.description !== undefined ? updatePayload.description : currentCard.description,
    subtasks: updatePayload.subtasks !== undefined ? updatePayload.subtasks : currentCard.subtasks,
    priority: updatePayload.priority !== undefined ? updatePayload.priority : currentCard.priority,
    dueDate: updatePayload.dueDate !== undefined ? updatePayload.dueDate : currentCard.dueDate,
    labels: updatePayload.labels !== undefined ? updatePayload.labels : currentCard.labels,
    columnId: updatePayload.columnId !== undefined ? updatePayload.columnId : currentCard.columnId,
    isPaused: updatePayload.isPaused !== undefined ? updatePayload.isPaused : currentCard.isPaused
  };

  saveDBState(db);
  res.json(db.cards[cardIndex]);
});

// Delete card
app.delete('/api/cards/:id', authenticateToken, (req: any, res) => {
  const { id } = req.params;
  const db = getDBState();

  const isOwner = db.cards.some(c => c.id === id && c.userId === req.user.id);
  if (!isOwner) {
    return res.status(404).json({ error: 'Cartão não encontrado.' });
  }

  db.cards = db.cards.filter(c => !(c.id === id && c.userId === req.user.id));
  saveDBState(db);

  res.json({ success: true });
});


// ==========================================
// STATIC AND VITE MIDDLEWARES
// ==========================================

async function startServer() {
  // Vite dev server mounting or static prod builds
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite development middleware mounted.');
  } else {
    // Production Mode serving compiled static assets from dist/ folder
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Production static files server configured.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Express Service listening on port ${PORT}`);
    console.log(`Mode state is: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();

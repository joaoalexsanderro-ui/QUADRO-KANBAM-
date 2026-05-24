import React, { useState, useEffect } from 'react';
import { Column, Card, Priority, Client } from './types';
import StatsBanner from './components/StatsBanner';
import BoardFilters from './components/BoardFilters';
import ColumnContainer from './components/ColumnContainer';
import TaskModal from './components/TaskModal';
import { auth, db, OperationType, handleFirestoreError } from './lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  query, 
  where 
} from 'firebase/firestore';

import { 
  Trello, 
  Plus, 
  RotateCcw, 
  AlertCircle,
  FolderLock,
  Sparkles,
  Layers,
  Lock,
  User,
  Users,
  Moon,
  Sun,
  LogOut,
  Mail,
  Phone,
  Briefcase,
  Trash2,
  PlusCircle,
  Download,
  X,
  FileText,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Auth state
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('kanban_token'));
  const [user, setUser] = useState<{ id: string; username: string } | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMessage, setAuthSuccessMessage] = useState<string | null>(null);
  
  // Auth form input state
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // App core states
  const [columns, setColumns] = useState<Column[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Theme support
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('kanban_theme');
    return saved ? saved === 'dark' : true;
  });

  // Collapsible Filters/Stats layout state
  const [showStatsFilters, setShowStatsFilters] = useState(false);

  // Client manager sidebar/modal state
  const [isClientManagerOpen, setIsClientManagerOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientProject, setNewClientProject] = useState('');
  const [newClientNotes, setNewClientNotes] = useState('');
  const [clientError, setClientError] = useState<string | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');

  // Cards Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | undefined>(undefined);
  const [defaultColumnForNewCard, setDefaultColumnForNewCard] = useState<string | undefined>(undefined);

  // Custom Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
  } | null>(null);

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar'
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm,
      confirmText,
      cancelText
    });
  };

  // Column creation inputs
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [isCreatingColumn, setIsCreatingColumn] = useState(false);

  // PWA Support state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  // Apply visual theme to document level for absolute Tailwind support
  useEffect(() => {
    localStorage.setItem('kanban_theme', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isDark]);

  // Auth bootstrap checking with Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setToken(firebaseUser.uid);
        setUser({
          id: firebaseUser.uid,
          username: firebaseUser.email || firebaseUser.uid
        });
      } else {
        localStorage.removeItem('kanban_token');
        setToken(null);
        setUser(null);
        setColumns([]);
        setCards([]);
        setClients([]);
      }
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load app data from Firestore when user is authenticated
  useEffect(() => {
    if (!user) return;

    async function loadBoardData() {
      setIsDataLoading(true);
      try {
        const currentUserId = user.id;

        // 1. Fetch & Seed Columns
        let colSnap;
        try {
          const colRef = collection(db, 'columns');
          const colQuery = query(colRef, where('userId', '==', currentUserId));
          colSnap = await getDocs(colQuery);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, 'columns');
          return;
        }
        let fetchedCols = colSnap.docs.map(doc => doc.data() as Column);
        
        if (fetchedCols.length === 0) {
          const standardColumns: Column[] = [
            { id: `${currentUserId}_todo`, title: 'A Fazer' },
            { id: `${currentUserId}_in_progress`, title: 'Em Progresso' },
            { id: `${currentUserId}_review`, title: 'Em Revisão' },
            { id: `${currentUserId}_done`, title: 'Concluído' }
          ];
          for (const docCol of standardColumns) {
            const colDataWithUser = { ...docCol, userId: currentUserId };
            try {
              await setDoc(doc(db, 'columns', docCol.id), colDataWithUser);
            } catch (err) {
              handleFirestoreError(err, OperationType.CREATE, `columns/${docCol.id}`);
            }
          }
          fetchedCols = standardColumns;
        }
        setColumns(fetchedCols);

        // 2. Fetch Cards
        let cardsSnap;
        try {
          const cardsRef = collection(db, 'cards');
          const cardsQuery = query(cardsRef, where('userId', '==', currentUserId));
          cardsSnap = await getDocs(cardsQuery);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, 'cards');
          return;
        }
        const fetchedCards = cardsSnap.docs.map(doc => doc.data() as Card);
        setCards(fetchedCards);

        // 3. Fetch Clients
        let clientsSnap;
        try {
          const clientsRef = collection(db, 'clients');
          const clientsQuery = query(clientsRef, where('userId', '==', currentUserId));
          clientsSnap = await getDocs(clientsQuery);
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, 'clients');
          return;
        }
        const fetchedClients = clientsSnap.docs.map(doc => doc.data() as Client);
        setClients(fetchedClients);

      } catch (err) {
        console.error('Falha ao carregar dados do Firebase', err);
      } finally {
        setIsDataLoading(false);
      }
    }

    loadBoardData();
  }, [user]);

  // Detect PWA Installation trigger
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Action: Trigger actual PWA mobile installation prompt
  const handleInstallAppClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA installation outcome state is: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  // Action: Reset user password in Firebase Auth via email link
  const handlePasswordReset = async () => {
    setAuthError(null);
    setAuthSuccessMessage(null);
    const email = usernameInput.trim();
    if (!email) {
      setAuthError('Por favor, digite seu e-mail no campo "Nome de Usuário" para que possamos enviar o link de redefinição.');
      return;
    }
    try {
      setIsAuthLoading(true);
      await sendPasswordResetEmail(auth, email);
      setAuthSuccessMessage(`E-mail de redefinição enviado para ${email}! Verifique sua caixa de entrada e filtro de spam.`);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-email') {
        setAuthError('O formato de e-mail fornecido é inválido.');
      } else if (err.code === 'auth/user-not-found') {
        setAuthError('Nenhum usuário correspondente a este e-mail foi encontrado em nosso sistema.');
      } else {
        setAuthError(err.message || 'Erro inesperado ao enviar e-mail de redefinição de senha.');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Action: Authenticate user login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMessage(null);
    
    const email = usernameInput.trim();
    const password = passwordInput.trim();

    if (!email || !password) {
      setAuthError('Preencha seu nome de usuário (e-mail) e chave de acesso!');
      return;
    }

    try {
      setIsAuthLoading(true);
      if (isRegistering) {
        if (password.length < 6) {
          setAuthError('A senha precisa ter pelo menos 6 caracteres.');
          setIsAuthLoading(false);
          return;
        }
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setUsernameInput('');
      setPasswordInput('');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setAuthError('E-mail ou senha incorretos. Se você já tem cadastro com este e-mail, por favor verifique os dados ou utilize o link "Esqueci minha senha" abaixo.');
      } else if (err.code === 'auth/email-already-in-use') {
        setAuthError('Este e-mail de usuário já está cadastrado. Se você não lembra sua senha, use a opção "Esqueci minha senha" abaixo para redefini-la.');
      } else if (err.code === 'auth/invalid-email') {
        setAuthError('O nome de usuário deve ser um e-mail válido (ex: seuemail@dominio.com).');
      } else if (err.code === 'auth/operation-not-allowed') {
        setAuthError('O provedor de login com E-mail/Senha está desabilitado no console do Firebase. Ative-o na aba Authentication -> Sign-in method.');
      } else {
        setAuthError(err.message || 'Erro ao realizar autenticação.');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Action: Sign Out from active account
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Logout failed', e);
    }
    localStorage.removeItem('kanban_token');
    setToken(null);
    setUser(null);
    setColumns([]);
    setCards([]);
    setClients([]);
  };



  // Action: Submit client creation form inside sliding list
  const handleAddClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);
    if (!newClientName.trim()) {
      setClientError('O nome do cliente é obrigatório!');
      return;
    }

    try {
      const clientId = crypto.randomUUID();
      const clientData: Client = {
        id: clientId,
        userId: user!.id,
        name: newClientName.trim(),
        email: newClientEmail.trim(),
        phone: newClientPhone.trim(),
        projectName: newClientProject.trim(),
        notes: newClientNotes.trim(),
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'clients', clientId), clientData).catch(err => 
        handleFirestoreError(err, OperationType.CREATE, `clients/${clientId}`)
      );

      setClients(prev => [...prev, clientData]);
      setNewClientName('');
      setNewClientEmail('');
      setNewClientPhone('');
      setNewClientProject('');
      setNewClientNotes('');
    } catch (err) {
      setClientError('Erro na sincronização de dados do cliente no Firebase.');
    }
  };

  // Action: Delete client from sliding list
  const handleDeleteClient = async (clientId: string, clientName: string) => {
    showConfirm(
      'Excluir Cliente',
      `Deseja excluir o cliente "${clientName}"? Os cartões associados a ele ficarão desvinculados. Esta ação não poderá ser desfeita.`,
      async () => {
        try {
          await deleteDoc(doc(db, 'clients', clientId)).catch(err => 
            handleFirestoreError(err, OperationType.DELETE, `clients/${clientId}`)
          );
          
          setClients(prev => prev.filter(c => c.id !== clientId));
          // Unlink in local state cards and update in Firestore
          setCards(prevCards => {
            const updated = prevCards.map(c => 
              c.clientId === clientId ? { ...c, clientId: undefined, clientName: '' } : c
            );
            prevCards.forEach(async (c) => {
              if (c.clientId === clientId) {
                await updateDoc(doc(db, 'cards', c.id), { clientId: null, clientName: '' }).catch(() => {});
              }
            });
            return updated;
          });
        } catch (err) {
          console.error('Falha ao apagar cliente', err);
        }
      },
      'Excluir',
      'Cancelar'
    );
  };

  // Action: Submit dynamic column creation to API
  const handleAddColumnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnTitle.trim() || !user) return;

    try {
      const columnId = `col_${crypto.randomUUID()}`;
      const columnData: Column = {
        id: columnId,
        title: newColumnTitle.trim(),
        userId: user.id
      };

      await setDoc(doc(db, 'columns', columnId), columnData).catch(err => 
        handleFirestoreError(err, OperationType.CREATE, `columns/${columnId}`)
      );

      setColumns(prev => [...prev, columnData]);
      setNewColumnTitle('');
      setIsCreatingColumn(false);
    } catch (err) {
      console.error('Falha ao adicionar lista', err);
    }
  };

  // Action: Rename custom columns in API
  const handleRenameColumn = async (columnId: string, newTitle: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'columns', columnId), { title: newTitle.trim() }).catch((err) => 
        handleFirestoreError(err, OperationType.UPDATE, `columns/${columnId}`)
      );
      setColumns(prev => prev.map(col => col.id === columnId ? { ...col, title: newTitle } : col));
    } catch (err) {
      console.error('Falha ao renomear lista', err);
    }
  };

  // Action: Delete custom columns in API
  const handleDeleteColumn = async (columnId: string) => {
    if (!user) return;
    const associatedCards = cards.filter(card => card.columnId === columnId);
    
    if (associatedCards.length > 0) {
      showConfirm(
        'Excluir Coluna Ativa',
        `Esta coluna contém ${associatedCards.length} cartão(ões). \nPara excluí-la, TODOS esses cartões serão excluídos permanentemente de seu painel.`,
        async () => {
          try {
            await deleteDoc(doc(db, 'columns', columnId)).catch((err) => 
              handleFirestoreError(err, OperationType.DELETE, `columns/${columnId}`)
            );
            
            // Delete associated cards from Firestore securely
            for (const card of associatedCards) {
              await deleteDoc(doc(db, 'cards', card.id)).catch((err) => 
                handleFirestoreError(err, OperationType.DELETE, `cards/${card.id}`)
              );
            }

            setColumns(prev => prev.filter(col => col.id !== columnId));
            setCards(prev => prev.filter(card => card.columnId !== columnId));
          } catch (err) {
            console.error('Erro de exclusão de servidor', err);
          }
        },
        'Excluir Tudo',
        'Voltar'
      );
    } else {
      showConfirm(
        'Excluir Coluna',
        'Deseja realmente excluir esta coluna?',
        async () => {
          try {
            await deleteDoc(doc(db, 'columns', columnId)).catch((err) => 
              handleFirestoreError(err, OperationType.DELETE, `columns/${columnId}`)
            );
            setColumns(prev => prev.filter(col => col.id !== columnId));
          } catch (err) {
            console.error('Erro de exclusão de servidor', err);
          }
        },
        'Excluir',
        'Voltar'
      );
    }
  };

  // Action: Save, Edit or Create task card in API backend
  const handleSaveCard = async (cardData: Omit<Card, 'id' | 'createdAt'> & { id?: string }) => {
    if (!user) return;

    // Resolve real client name matching selection details
    let actualClientName = cardData.clientName || '';
    if (cardData.clientId) {
      const parentClient = clients.find(c => c.id === cardData.clientId);
      if (parentClient) {
        actualClientName = parentClient.name;
      }
    }

    try {
      if (cardData.id) {
        // Edit Mode
        const payload = {
          ...cardData,
          clientName: actualClientName,
          userId: user.id
        };
        await setDoc(doc(db, 'cards', cardData.id), payload).catch((err) => 
          handleFirestoreError(err, OperationType.UPDATE, `cards/${cardData.id}`)
        );
        setCards(prev => prev.map(c => c.id === cardData.id ? (payload as Card) : c));
      } else {
        // Creation Mode
        const cardId = crypto.randomUUID();
        const payload: Card = {
          ...cardData,
          id: cardId,
          clientName: actualClientName,
          userId: user.id,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'cards', cardId), payload).catch((err) => 
          handleFirestoreError(err, OperationType.CREATE, `cards/${cardId}`)
        );
        setCards(prev => [...prev, payload]);
      }
    } catch (err) {
      console.error('Falha de sincronização de cartão', err);
    }
    setIsModalOpen(false);
  };

  // Action: Delete task card from DB
  const handleDeleteCard = async (cardId: string) => {
    if (!user) return;
    const cardToDelete = cards.find(c => c.id === cardId);
    const confirmMessage = cardToDelete 
      ? `Deseja realmente excluir o cartão "${cardToDelete.title}"?`
      : 'Deseja excluir este cartão?';
      
    showConfirm(
      'Excluir Cartão',
      confirmMessage,
      async () => {
        try {
          await deleteDoc(doc(db, 'cards', cardId)).catch((err) => 
            handleFirestoreError(err, OperationType.DELETE, `cards/${cardId}`)
          );
          setCards(prev => prev.filter(c => c.id !== cardId));
        } catch (err) {
          console.error('Erro de exclusão de cartão', err);
        }
      },
      'Excluir',
      'Voltar'
    );
  };

  // Action: Drag or move card inside column lane updates
  const handleMoveCardColumn = async (cardId: string, targetColumnId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'cards', cardId), { columnId: targetColumnId }).catch((err) => 
        handleFirestoreError(err, OperationType.UPDATE, `cards/${cardId}`)
      );
      setCards(prev => prev.map(c => c.id === cardId ? { ...c, columnId: targetColumnId } : c));
    } catch (err) {
      console.error('Falha ao mover coluna', err);
    }
  };

  // Action: Toggle Play / Pause state on Kanban task card
  const handleTogglePause = async (cardId: string) => {
    if (!user) return;
    const targetCard = cards.find(c => c.id === cardId);
    if (!targetCard) return;

    try {
      await updateDoc(doc(db, 'cards', cardId), { isPaused: !targetCard.isPaused }).catch((err) => 
        handleFirestoreError(err, OperationType.UPDATE, `cards/${cardId}`)
      );
      setCards(prev => prev.map(c => 
        c.id === cardId ? { ...c, isPaused: !c.isPaused } : c
      ));
    } catch (err) {
      console.error('Falha ao pausar/retomar tarefa', err);
    }
  };

  // Quick helper to filter cards based on user dashboard criteria
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedClient('');
    setSelectedPriority('');
  };

  // Shortcut add click handler per column
  const handleAddCardToSpecificColumn = (columnId: string) => {
    setDefaultColumnForNewCard(columnId);
    setEditingCard(undefined);
    setIsModalOpen(true);
  };

  // Open modal for generic add card
  const handleOpenAddModal = () => {
    setDefaultColumnForNewCard(undefined);
    setEditingCard(undefined);
    setIsModalOpen(true);
  };

  // Open modal for editing card
  const handleOpenEditModal = (card: Card) => {
    setEditingCard(card);
    setIsModalOpen(true);
  };

  // Clients options extracted from registered client list
  const clientsList = clients.map(c => c.name).sort();

  // Filter cards based on user search filters
  const filteredCards = cards.filter(card => {
    const matchesSearch = 
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.description && card.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (card.clientName && card.clientName.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesClient = 
      selectedClient === '' || 
      (card.clientName && card.clientName.trim().toLowerCase() === selectedClient.trim().toLowerCase());
      
    const matchesPriority = 
      selectedPriority === '' || 
      card.priority === selectedPriority;

    return matchesSearch && matchesClient && matchesPriority;
  });

  // Base checking loading dashboard screen
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0A0A0C] text-slate-800 dark:text-[#E4E4E7] font-sans">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <Trello className="w-12 h-12 text-blue-500 animate-spin" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">Verificando painel corporativo...</h2>
        </div>
      </div>
    );
  }

  // Not Authenticated View - Render magnificent secure Auth login panel
  if (!user) {
    return (
      <div className={`min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-[#09090B] text-slate-800 dark:text-[#E4E4E7] transition-colors duration-200`}>
        {/* Left column presentation block */}
        <div className="flex-1 bg-gradient-to-br from-blue-600 to-indigo-800 dark:from-slate-900 dark:to-indigo-950 p-8 md:p-16 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.3),transparent)]" />
          
          <div className="flex items-center gap-2.5 z-10">
            <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md">
              <Trello className="w-8 h-8 text-white" />
            </div>
            <span className="text-xl font-bold font-display tracking-tight">Focus Kanban</span>
          </div>

          <div className="my-16 z-10 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md mb-6 text-blue-200 border border-white/5">
              <Sparkles className="w-3.5 h-3.5" />
              Inspirado no Trello, feito para VPS
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-4">
              Gerencie suas demandas e clientes no mesmo lugar.
            </h1>
            <p className="text-lg text-blue-100 font-normal leading-relaxed">
              Crie listas de tarefas dinâmicas, vincule prazos rígidos, cadastre sua agenda de clientes, crie checklists detalhados e controle seu fluxo diário com facilidade. Sincronizado na nuvem para qualquer aparelho.
            </p>
          </div>

          <div className="z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center border-t border-white/10 pt-6 gap-3">
            <div className="flex items-center gap-5">
              <span className="text-xs font-semibold text-blue-200">✓ Multi-dispositivo</span>
              <span className="text-xs font-semibold text-blue-200">✓ Registro de Prazos</span>
              <span className="text-xs font-semibold text-blue-200">✓ PWA Instalável</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDark(!isDark)}
                className="p-2 cursor-pointer bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white"
                title="Trocar tema visual"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right column - Clean Authentication Card login */}
        <div className="w-full md:w-[480px] p-8 md:p-12 flex flex-col justify-center bg-white dark:bg-[#0F0F12] border-l border-slate-200 dark:border-[#1E1E22]">
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white mb-2">
              {isRegistering ? 'Criar Nova Conta' : 'Acessar Conta'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
              {isRegistering 
                ? 'Inscreva-se gratuitamente para salvar e acessar de qualquer aparelho.' 
                : 'Faça login com seu e-mail de usuário para acessar o quadro de trabalho.'}
            </p>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {authError && (
                <div className="p-3.5 bg-red-50 dark:bg-red-950/45 border border-red-200 dark:border-red-900/60 rounded-xl flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccessMessage && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/45 border border-emerald-200 dark:border-emerald-900/60 rounded-xl flex items-start gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500 animate-bounce" />
                  <span>{authSuccessMessage}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  E-mail de Usuário
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={usernameInput}
                    onChange={e => setUsernameInput(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-[#27272A] rounded-xl text-sm bg-slate-50 dark:bg-[#18181B] text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#52525B] focus:outline-hidden focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5 font-sans">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Senha de Acesso
                  </label>
                  {!isRegistering && (
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      className="text-xs text-blue-500 hover:text-blue-600 font-bold hover:underline cursor-pointer"
                    >
                      Esqueci a senha
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    placeholder={isRegistering ? "Mínimo 6 caracteres..." : "Sua senha secreta..."}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 dark:border-[#27272A] rounded-xl text-sm bg-slate-50 dark:bg-[#18181B] text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#52525B] focus:outline-hidden focus:ring-1 focus:ring-blue-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:scale-[1.01] active:scale-[0.99] cursor-pointer mt-2"
              >
                {isRegistering ? 'Cadastrar Minha Conta e Entrar' : 'Entrar no Sistema'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-[#27272A] text-center">
              <button
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setAuthError(null);
                }}
                className="text-xs text-blue-500 hover:text-blue-600 font-bold hover:underline cursor-pointer"
              >
                {isRegistering 
                  ? 'Já é cadastrado? Acesse sua conta existente' 
                  : 'Ainda não tem conta? Crie uma agora!'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Dashboard Render
  return (
    <div id="kanban-app-layout" className="h-screen overflow-hidden bg-[#0079BF] dark:bg-[#0f172a] text-slate-800 dark:text-[#E4E4E7] flex flex-col font-sans transition-colors duration-200">
      
      {/* Dynamic Navigation Trello Header bar */}
      <header id="app-nav-bar" className="flex-shrink-0 bg-[#005c91] dark:bg-[#070c19] text-white border-b border-black/10 py-2 px-4 md:px-6 sticky top-0 z-40 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="bg-white/10 p-1.5 text-white rounded-lg shadow-sm">
            <Trello className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-display font-black tracking-tight flex items-center gap-1.5 text-white">
              Focus Kanban
              <span className="text-[9px] bg-white/20 text-white leading-none px-2 py-0.5 rounded-full font-sans font-bold border border-white/10">
                VPS Sincronizado
              </span>
            </h1>
          </div>
        </div>

        {/* Header tools */}
        <div id="header-tools" className="flex items-center gap-2 text-xs flex-wrap">
          {/* PWA Install Promo button if available */}
          {showInstallBtn && (
            <button
              onClick={handleInstallAppClick}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-[#0079BF] hover:bg-white/20 border border-white/10 rounded-lg transition-all cursor-pointer"
              title="Instalar App em seu Celular ou Computador"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Instalar App</span>
            </button>
          )}

          {/* Manage Clients slider toggle button */}
          <button
            onClick={() => {
              setClientError(null);
              setIsClientManagerOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Meus Clientes ({clients.length})</span>
          </button>



          {/* Log Out button */}
          <button
            onClick={handleLogout}
            title="Sair da minha conta"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-red-500/80 hover:bg-red-600 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      {/* Trello Sub-Header board controls toolbar */}
      <div className="flex-shrink-0 bg-black/10 dark:bg-black/25 px-4 md:px-6 py-2 flex items-center justify-between gap-3 text-white border-b border-white/5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 bg-white/15 rounded-lg text-xs font-bold tracking-tight">
            📋 Projetos Ativos ({cards.length})
          </span>
          <span className="text-white/20 text-xs hidden sm:inline">|</span>
          
          {/* Collapsible Stats & Filters trigger */}
          <button
            onClick={() => setShowStatsFilters(!showStatsFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border
              ${showStatsFilters 
                ? 'bg-white text-[#0079BF] border-white shadow-sm' 
                : 'bg-white/10 hover:bg-white/15 border-white/10 text-white'}`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros e Estatísticas</span>
            {(searchQuery || selectedClient || selectedPriority) && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>
        </div>

        {/* Right sub-header actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Cartão</span>
          </button>

          <span className="text-white/20 text-xs text-light">|</span>

          {/* Theme switcher inside sub-header */}
          <button
            onClick={() => setIsDark(!isDark)}
            title="Trocar tema claro/escuro"
            className="p-1 px-2.5 cursor-pointer bg-white/10 hover:bg-white/15 border border-white/10 text-white rounded-lg transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-emerald-300" /> : <Moon className="w-4 h-4 text-slate-200" />}
          </button>
        </div>
      </div>

      {/* Main Container Workspace */}
      <main id="app-workspace" className="flex-1 p-4 md:px-6 overflow-hidden flex flex-col relative">
        
        {/* Collapsible drawer for Stats and Filters */}
        <AnimatePresence>
          {showStatsFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 16 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="overflow-hidden flex-shrink-0"
            >
              <div className="p-4 bg-white/95 dark:bg-[#121215]/95 rounded-xl border border-slate-200 dark:border-[#27272A] shadow-xl space-y-4">
                {/* Stats */}
                <StatsBanner cards={cards} />
                
                {/* Filters */}
                <BoardFilters
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedClient={selectedClient}
                  onClientChange={setSelectedClient}
                  selectedPriority={selectedPriority}
                  onPriorityChange={setSelectedPriority}
                  clientsList={clientsList}
                  clearFilters={handleClearFilters}
                  onAddCardClick={handleOpenAddModal}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sync notification block */}
        {isDataLoading && (
          <div className="absolute top-2.5 right-6 bg-slate-900/80 text-white rounded-lg px-3 py-1.5 text-xs font-bold animate-pulse flex items-center gap-1.5 z-30 border border-white/10">
            <RotateCcw className="w-3 h-3 animate-spin text-blue-400" />
            <span>Sincronizando com VPS...</span>
          </div>
        )}

        {/* Trello Board columns slider container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header metric for filters if active */}
          {filteredCards.length !== cards.length && (
            <div className="text-xs text-white bg-white/15 border border-white/10 py-1.5 px-3 rounded-lg mb-3 self-start font-medium backdrop-blur-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Filtro ativo: filtrando <b>{filteredCards.length}</b> de {cards.length} cartões totais.</span>
              <button onClick={handleClearFilters} className="underline hover:text-blue-200 font-bold ml-1.5">Limpar filtros</button>
            </div>
          )}

          {/* Kanban Lanes */}
          <div id="kanban-board-scroll" className="flex-1 flex gap-4 overflow-x-auto pb-4 select-none items-start">
            
            {columns.map(col => {
              const colCards = filteredCards.filter(card => card.columnId === col.id);
              return (
                <ColumnContainer
                  key={col.id}
                  column={col}
                  cards={colCards}
                  columnsList={columns}
                  onEditCard={handleOpenEditModal}
                  onDeleteCard={handleDeleteCard}
                  onMoveCardColumn={handleMoveCardColumn}
                  onRenameColumn={handleRenameColumn}
                  onDeleteColumn={handleDeleteColumn}
                  onAddCardToColumn={handleAddCardToSpecificColumn}
                  onTogglePause={handleTogglePause}
                />
              );
            })}

            {/* Dynamic "Add Column" Trello Box */}
            <div className="w-[280px] min-w-[280px] bg-white/20 dark:bg-[#121215]/50 hover:bg-white/25 border border-dashed border-white/30 dark:border-[#27272A] rounded-xl transition-all p-3 flex flex-col gap-2">
              {isCreatingColumn ? (
                <form onSubmit={handleAddColumnSubmit} className="space-y-3">
                  <input
                    type="text"
                    required
                    value={newColumnTitle}
                    onChange={e => setNewColumnTitle(e.target.value)}
                    placeholder="Título da lista..."
                    className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-[#27272A] bg-white dark:bg-[#18181B] text-slate-800 dark:text-[#E4E4E7] placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                    maxLength={24}
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingColumn(false);
                        setNewColumnTitle('');
                      }}
                      className="px-2 py-1 text-xs font-semibold text-white hover:text-slate-200 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg cursor-pointer shadow-xs"
                    >
                      Adicionar Lista
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsCreatingColumn(true)}
                  className="w-full h-10 text-xs font-black text-white hover:text-white flex items-center justify-center gap-1.5 rounded-lg cursor-pointer bg-white/10 hover:bg-white/20 transition-all border border-white/5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar lista</span>
                </button>
              )}
            </div>

          </div>
        </div>

      </main>

      {/* Elegant minimalist product footer */}
      <footer className="bg-white dark:bg-[#121215] border-t border-slate-200 dark:border-[#27272A] text-slate-400 dark:text-[#71717A] py-5 text-center mt-auto text-xs font-medium">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-3">
          <p>© {new Date().getFullYear()} Focus Kanban. Todos os dados salvos em VPS.</p>
          <div className="flex items-center gap-4 text-slate-500 dark:text-[#A1A1AA]">
            <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5 text-blue-500" /> Organização Ágil</span>
            <span className="text-slate-200 dark:text-[#27272A]">|</span>
            <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Alta Performance</span>
          </div>
        </div>
      </footer>

      {/* Unified Edit/Create Modal dialog helper */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCard(undefined);
          setDefaultColumnForNewCard(undefined);
        }}
        card={editingCard}
        columns={columns}
        currentColumnId={defaultColumnForNewCard}
        clients={clients}
        onSave={handleSaveCard}
      />

      {/* Magnificent Client Manager Sliding Side Modal */}
      <AnimatePresence>
        {isClientManagerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop cover overlay click triggers close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsClientManagerOpen(false)}
              className="absolute inset-0 bg-black cursor-pointer"
            />

            {/* Sliding Sidebar Body panel container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md h-full bg-white dark:bg-[#121215] border-l border-slate-250 dark:border-[#27272A] shadow-2l flex flex-col z-10"
            >
              {/* Header Title bar */}
              <div className="p-5 border-b border-slate-200 dark:border-[#27272A] flex items-center justify-between bg-slate-50 dark:bg-[#18181B]">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">Gerenciador de Clientes</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsClientManagerOpen(false)}
                  className="p-1 px-2 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#27272A] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Slider Content view split by client creation form & historic list */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                
                {/* 1) Add Client Form */}
                <div className="bg-slate-50 dark:bg-[#18181B] p-4 rounded-xl border border-slate-200 dark:border-[#27272A] space-y-3.5">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4 text-blue-500" />
                    <span>Cadastrar Novo Cliente</span>
                  </h4>

                  {clientError && (
                    <div className="p-2.5 bg-red-50 dark:bg-[#2D161B] text-xs text-red-650 dark:text-rose-400 border border-red-200 dark:border-red-950 rounded-lg">
                      {clientError}
                    </div>
                  )}

                  <form onSubmit={handleAddClientSubmit} className="space-y-3">
                    <div>
                      <input
                        type="text"
                        required
                        value={newClientName}
                        onChange={e => setNewClientName(e.target.value)}
                        placeholder="Nome do Cliente ou Razão Social *"
                        className="w-full px-3 py-2 border rounded-lg text-xs bg-white dark:bg-[#121215] border-slate-200 dark:border-[#27272A] text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#52525B] focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="email"
                        value={newClientEmail}
                        onChange={e => setNewClientEmail(e.target.value)}
                        placeholder="E-mail"
                        className="w-full px-3 py-2 border rounded-lg text-xs bg-white dark:bg-[#121215] border-slate-200 dark:border-[#27272A] text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#52525B] focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        value={newClientPhone}
                        onChange={e => setNewClientPhone(e.target.value)}
                        placeholder="Telefone"
                        className="w-full px-3 py-2 border rounded-lg text-xs bg-white dark:bg-[#121215] border-slate-200 dark:border-[#27272A] text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#52525B] focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        value={newClientProject}
                        onChange={e => setNewClientProject(e.target.value)}
                        placeholder="Nome do Projeto ou Contrato"
                        className="w-full px-3 py-2 border rounded-lg text-xs bg-white dark:bg-[#121215] border-slate-200 dark:border-[#27272A] text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#52525B] focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <textarea
                        rows={2}
                        value={newClientNotes}
                        onChange={e => setNewClientNotes(e.target.value)}
                        placeholder="Anotações internas sobre o faturamento ou combinados..."
                        className="w-full px-3 py-2 border rounded-lg text-xs bg-white dark:bg-[#121215] border-slate-200 dark:border-[#27272A] text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-[#52525B] focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Cadastrar Cliente
                    </button>
                  </form>
                </div>

                {/* 2) List Registered Clients and metrics */}
                <div className="space-y-3.5">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-[#71717A] uppercase tracking-wider">
                    Clientes Cadastrados ({clients.length})
                  </h4>

                  {clients.length > 0 ? (
                    <div className="space-y-3">
                      {clients.map(cli => {
                        const countTasks = cards.filter(c => c.clientId === cli.id).length;
                        return (
                          <div 
                            key={cli.id}
                            className="p-3.5 border rounded-xl flex flex-col bg-slate-50 dark:bg-[#18181B] border-slate-200 dark:border-[#27272A] hover:border-blue-300 dark:hover:border-slate-800 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div>
                                <h5 className="font-bold text-sm text-slate-850 dark:text-white leading-tight">
                                  {cli.name}
                                </h5>
                                {cli.projectName && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-1">
                                    <Briefcase className="w-3 h-3" />
                                    {cli.projectName}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteClient(cli.id, cli.name)}
                                className="p-1 px-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Contact info list */}
                            <div className="mt-3.5 space-y-1 text-[11px] text-slate-500 dark:text-[#81818B]">
                              {cli.email && (
                                <p className="flex items-center gap-1.5">
                                  <Mail className="w-3 h-3 shrink-0" />
                                  <span>{cli.email}</span>
                                </p>
                              )}
                              {cli.phone && (
                                <p className="flex items-center gap-1.5">
                                  <Phone className="w-3 h-3 shrink-0" />
                                  <span>{cli.phone}</span>
                                </p>
                              )}
                              {cli.notes && (
                                <p className="flex items-center gap-1.5 italic text-slate-405 mt-1 border-t border-slate-100 dark:border-[#202024] pt-1">
                                  <FileText className="w-3 h-3 shrink-0" />
                                  <span>{cli.notes}</span>
                                </p>
                              )}
                            </div>

                            {/* Filter quick actions */}
                            <div className="mt-3.5 pt-2.5 border-t border-slate-150 dark:border-[#202024] flex items-center justify-between">
                              <span className="text-[10px] text-slate-400 font-semibold bg-white dark:bg-[#121215] border border-slate-200 dark:border-[#27272A] px-2 py-0.5 rounded-md">
                                {countTasks} cartão(ões)
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedClient(cli.name);
                                  setIsClientManagerOpen(false);
                                  // Smooth scroll to top of board filters
                                  document.getElementById('board-filters')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                                className="text-[10px] text-blue-500 hover:text-blue-600 font-bold flex items-center gap-0.5 cursor-pointer"
                              >
                                <span>Ver Cartões</span>
                                <Plus className="w-3 h-3 rotate-45 shrink-0" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-50 dark:bg-[#18181B] rounded-xl border border-dashed border-slate-200 dark:border-[#27272A] text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 text-slate-350" />
                      <p className="text-xs">Nenhum cliente cadastrado.</p>
                      <p className="text-[10px] text-slate-400 mt-1">Insira os termos acima para comecar!</p>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern, sleek Custom Confirm Dialog */}
      <AnimatePresence>
        {confirmDialog && confirmDialog.isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDialog(prev => prev ? { ...prev, isOpen: false } : null)}
              className="absolute inset-0 bg-black cursor-pointer"
            />
            {/* Dialog Container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#1e222b] border border-slate-300/60 dark:border-[#2C3440] rounded-xl shadow-2xl p-5 z-10"
            >
              <h3 className="text-sm font-black text-[#172b4d] dark:text-white flex items-center gap-2 mb-2">
                <span className="text-rose-500">⚠️</span> {confirmDialog.title}
              </h3>
              <p className="text-xs text-[#5e6c84] dark:text-[#8B9AA7] leading-relaxed whitespace-pre-line mb-5">
                {confirmDialog.message}
              </p>
              <div className="flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(prev => prev ? { ...prev, isOpen: false } : null)}
                  className="px-3 py-2 font-bold text-slate-500 dark:text-slate-400 hover:text-[#172b4d] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-md transition-all cursor-pointer"
                >
                  {confirmDialog.cancelText || 'Cancelar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog(null);
                  }}
                  className="px-3.5 py-2 font-black text-white bg-rose-550 dark:bg-rose-600 hover:bg-rose-650 rounded-md shadow-sm transition-all cursor-pointer"
                >
                  {confirmDialog.confirmText || 'Confirmar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

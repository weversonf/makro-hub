import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db, auth, storage, googleProvider, getUserCollection, getUserDoc } from '../firebase';

const HubContext = createContext();

export const STAGES = [
  { id: 'afazer',    label: 'A Fazer',     color: 'var(--ax-text-muted)', tone: 'neutral' },
  { id: 'execucao',  label: 'Em Execução', color: 'var(--ax-viz-cyan)',   tone: 'info' },
  { id: 'espera',    label: 'Em Espera',   color: 'var(--ax-viz-amber)',  tone: 'warning' },
  { id: 'validando', label: 'Validando',   color: 'var(--ax-viz-violet)', tone: 'violet' },
  { id: 'concluido', label: 'Concluído',   color: 'var(--ax-viz-emerald)',tone: 'success' }
];

export const PRIOS = {
  baixa:   { label: 'Baixa',   color: 'var(--ax-text-subtle)' },
  media:   { label: 'Média',   color: 'var(--ax-warning-500)' },
  alta:    { label: 'Alta',    color: 'var(--ax-danger-500)' },
  urgente: { label: 'Urgente', color: 'var(--ax-danger-500)' }
};

export const CANAIS = [
  { id: 'ig',      label: 'Instagram', color: '#E1306C' },
  { id: 'fb',      label: 'Facebook',  color: '#1877F2' },
  { id: 'li',      label: 'LinkedIn',  color: '#0A66C2' },
  { id: 'site',    label: 'Site',      color: '#3B82F6' },
  { id: 'materia', label: 'Blog',      color: '#8B5CF6' }
];

export const DEFAULT_CATS = [
  { id: 1, nome: 'Editorial',      cor: '#3B82F6' },
  { id: 2, nome: 'Administrativo', cor: '#F59E0B' },
  { id: 3, nome: 'Design',         cor: '#8B5CF6' },
  { id: 4, nome: 'Cliente XYZ',    cor: '#0EA5C4' }
];

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addDaysISO(iso, days) {
  const d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function fmtDate(iso) {
  if (!iso) return '—';
  const p = String(iso).split('-');
  if (p.length !== 3) return iso;
  return `${p[2]}/${p[1]}`;
}

export function fmtDateFull(iso) {
  if (!iso) return '—';
  const p = String(iso).split('-');
  if (p.length !== 3) return iso;
  return `${p[2]}/${p[1]}/${p[0]}`;
}

export function isEditorialActivity(activity, categories = []) {
  if (!activity) return false;
  // 1. Categoria ID 1 (numérico ou string)
  if (String(activity.categoria) === '1') return true;
  // 2. Por nome da categoria (Editorial, Redes Sociais, Revista, etc.)
  if (categories && categories.length > 0) {
    const cat = categories.find((c) => String(c.id) === String(activity.categoria));
    if (cat && cat.nome) {
      const n = cat.nome.trim().toLowerCase();
      if (
        n === 'editorial' ||
        n.includes('editorial') ||
        n.includes('social') ||
        n.includes('rede') ||
        n.includes('revista') ||
        n.includes('instagram') ||
        n.includes('feed') ||
        n.includes('post')
      ) {
        return true;
      }
    }
  }
  // 3. Canais ou data de postagem explícita
  if (activity.canais && Array.isArray(activity.canais) && activity.canais.length > 0) return true;
  if (activity.dataPostagem) return true;
  if (activity.tipo === 'editorial' || activity.isEditorial) return true;
  return false;
}

export function HubProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activities, setActivities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [view, setView] = useState('dash');
  const [theme, setTheme] = useState(() => localStorage.getItem('ax:theme') || 'light');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('ax:accent') || '#1E856C');
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('ax:collapsed') === '1');

  // Filtros de Tarefas
  const [listMode, setListMode] = useState('table');
  const [listStage, setListStage] = useState('all');
  const [listCat, setListCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modais
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [taskModalInitialData, setTaskModalInitialData] = useState(null);

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editCategoryData, setEditCategoryData] = useState(null);

  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [toasts, setToasts] = useState([]);

  // Toast helper
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  // Confirm helper
  const showConfirm = useCallback((title, message, onConfirm) => {
    setConfirmModal({ open: true, title, message, onConfirm });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmModal((prev) => ({ ...prev, open: false, onConfirm: null }));
  }, []);

  // Theme & Accent effect
  useEffect(() => {
    document.documentElement.setAttribute('data-ax-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('ax:theme', theme);
    localStorage.setItem('hr-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty('--ax-accent', accentColor);
    localStorage.setItem('ax:accent', accentColor);
  }, [accentColor]);

  useEffect(() => {
    if (collapsed) {
      document.documentElement.setAttribute('data-ax-collapsed', '');
      document.documentElement.classList.add('sidebar-collapsed');
    } else {
      document.documentElement.removeAttribute('data-ax-collapsed');
      document.documentElement.classList.remove('sidebar-collapsed');
    }
    localStorage.setItem('ax:collapsed', collapsed ? '1' : '0');
    localStorage.setItem('hr-sidebar', collapsed ? 'collapsed' : 'expanded');
  }, [collapsed]);

  // Auth observer
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Firestore Sync
  useEffect(() => {
    if (!user) {
      setActivities([]);
      setCategories([]);
      return;
    }

    const unsubActs = getUserCollection('activities').onSnapshot((snap) => {
      const list = [];
      snap.forEach((doc) => {
        list.push({ ...doc.data(), _fbId: doc.id });
      });
      setActivities(list);
    }, (err) => {
      console.warn('[Firestore] Error snapshot activities:', err);
    });

    const unsubCats = getUserCollection('categories').onSnapshot((snap) => {
      const cats = [];
      snap.forEach((doc) => {
        cats.push({ ...doc.data(), _fbId: doc.id });
      });
      if (cats.length === 0) {
        // Inicializa categorias default
        Promise.all(DEFAULT_CATS.map((c) => getUserCollection('categories').add(c)));
      } else {
        setCategories(cats);
      }
    }, (err) => {
      console.warn('[Firestore] Error snapshot categories:', err);
    });

    return () => {
      unsubActs();
      unsubCats();
    };
  }, [user]);

  const [authError, setAuthError] = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Auth Actions
  const signInWithGoogle = async () => {
    try {
      setLoggingIn(true);
      setAuthError(null);
      await auth.signInWithPopup(googleProvider);
    } catch (e) {
      console.error('[Auth Error]', e);
      let msg = e.message;
      if (e.code === 'auth/unauthorized-domain') {
        msg = `O domínio "${window.location.hostname}" precisa ser adicionado aos "Domínios Autorizados" no Firebase Console.`;
      } else if (e.code === 'auth/popup-blocked') {
        msg = 'O pop-up de login foi bloqueado pelo seu navegador. Por favor, permita pop-ups para fazer login.';
      } else if (e.code === 'auth/popup-closed-by-user') {
        msg = 'A janela do Google foi fechada antes de concluir o login.';
      }
      setAuthError(msg);
      showToast(msg, 'error');
    } finally {
      setLoggingIn(false);
    }
  };

  const signOutUser = async () => {
    await auth.signOut();
    window.location.reload();
  };

  // Funções de Busca e Auxiliares
  const catOf = useCallback((id) => categories.find((c) => c.id === id) || null, [categories]);
  const stageOf = useCallback((id) => STAGES.find((s) => s.id === id) || STAGES[0], []);
  const getTask = useCallback((id) => activities.find((a) => a.id === id) || null, [activities]);

  const isOverdue = useCallback((a) => {
    return a.stage !== 'concluido' && a.dataVencimento && a.dataVencimento < todayISO();
  }, []);

  const isDueSoon = useCallback((a) => {
    if (a.stage === 'concluido' || !a.dataVencimento) return false;
    const today = todayISO();
    const limit = addDaysISO(today, 2);
    return a.dataVencimento >= today && a.dataVencimento <= limit;
  }, []);

  // CRUD Tarefas
  const openNewTask = useCallback((stageId = 'afazer', initialData = null) => {
    setEditTaskId(null);
    setTaskModalInitialData({ stage: stageId, ...initialData });
    setTaskModalOpen(true);
  }, []);

  const openEditTask = useCallback((id) => {
    setEditTaskId(id);
    setTaskModalInitialData(null);
    setTaskModalOpen(true);
  }, []);

  const closeTaskModal = useCallback(() => {
    setTaskModalOpen(false);
    setEditTaskId(null);
    setTaskModalInitialData(null);
  }, []);

  const saveTask = async (taskData) => {
    try {
      if (editTaskId) {
        const existing = getTask(editTaskId);
        if (existing?._fbId) {
          await getUserDoc('activities', existing._fbId).update(taskData);
          showToast('Tarefa atualizada com sucesso');
        }
      } else {
        const nextId = activities.length > 0 ? Math.max(...activities.map((a) => a.id || 0)) + 1 : 1;
        const newTask = {
          ...taskData,
          id: nextId,
          criadoEm: todayISO(),
          concluidoEm: taskData.stage === 'concluido' ? todayISO() : null
        };
        await getUserCollection('activities').add(newTask);
        showToast('Tarefa criada com sucesso');
      }
      closeTaskModal();
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar tarefa.', 'error');
    }
  };

  const deleteTask = useCallback((taskId) => {
    const t = getTask(taskId);
    if (!t) return;
    showConfirm('Excluir tarefa?', 'Essa ação removerá a tarefa definitivamente.', async () => {
      try {
        if (t._fbId) {
          await getUserDoc('activities', t._fbId).delete();
          showToast('Tarefa excluída');
          closeTaskModal();
        }
      } catch (e) {
        showToast('Erro ao excluir tarefa.', 'error');
      }
    });
  }, [getTask, showConfirm, closeTaskModal, showToast]);

  // Kanban Otimista com Rollback
  const moveTaskStage = async (taskId, newStage) => {
    const task = getTask(taskId);
    if (!task || task.stage === newStage) return;

    const oldStage = task.stage;
    const oldProgress = task.progress;
    const oldConcluidoEm = task.concluidoEm;

    // Atualização otimista imediata na UI
    const updatedProgress = newStage === 'concluido' ? 100 : (task.progress === 100 ? 90 : task.progress);
    const updatedConcluidoEm = newStage === 'concluido' ? todayISO() : null;

    setActivities((prev) =>
      prev.map((a) =>
        a.id === taskId
          ? { ...a, stage: newStage, progress: updatedProgress, concluidoEm: updatedConcluidoEm }
          : a
      )
    );
    showToast(`Movida para "${stageOf(newStage).label}"`);

    // Sincronização remota
    if (task._fbId) {
      try {
        await getUserDoc('activities', task._fbId).update({
          stage: newStage,
          progress: updatedProgress,
          concluidoEm: updatedConcluidoEm
        });
      } catch (err) {
        console.error('[Kanban] Erro ao sincronizar nova coluna:', err);
        // Rollback
        setActivities((prev) =>
          prev.map((a) =>
            a.id === taskId
              ? { ...a, stage: oldStage, progress: oldProgress, concluidoEm: oldConcluidoEm }
              : a
          )
        );
        showToast('Falha ao mover tarefa. Revertendo alteração.', 'error');
      }
    }
  };

  // Reagendamento inteligente de conteúdos editoriais não publicados para Seg/Qua/Sex a partir de 04/09
  const rescheduleUnpublishedEditorial = async () => {
    try {
      const pendingEditorial = activities
        .filter((a) => isEditorialActivity(a, categories) && a.stage !== 'concluido')
        .sort((x, y) => {
          const dx = x.dataPostagem || x.dataVencimento || '9999-99-99';
          const dy = y.dataPostagem || y.dataVencimento || '9999-99-99';
          return dx.localeCompare(dy);
        });

      if (pendingEditorial.length === 0) {
        showToast('Nenhum conteúdo editorial pendente para reagendar.', 'info');
        return { count: 0 };
      }

      // Gera sequência de datas (Segunda, Quarta e Sexta) iniciando em 2026-09-04 (Sexta)
      const dates = [];
      let cur = new Date('2026-09-04T12:00:00');
      while (dates.length < pendingEditorial.length) {
        const dow = cur.getDay(); // 1 = Seg, 3 = Qua, 5 = Sex
        if (dow === 1 || dow === 3 || dow === 5) {
          const y = cur.getFullYear();
          const m = String(cur.getMonth() + 1).padStart(2, '0');
          const d = String(cur.getDate()).padStart(2, '0');
          dates.push(`${y}-${m}-${d}`);
        }
        cur.setDate(cur.getDate() + 1);
      }

      // Atualização otimista imediata na interface
      setActivities((prev) =>
        prev.map((act) => {
          const idx = pendingEditorial.findIndex((p) => p.id === act.id);
          if (idx !== -1) {
            return {
              ...act,
              dataPostagem: dates[idx],
              dataVencimento: dates[idx]
            };
          }
          return act;
        })
      );

      // Atualização atômica em batch no Firestore
      const batch = db.batch();
      let hasBatch = false;

      for (let i = 0; i < pendingEditorial.length; i++) {
        const act = pendingEditorial[i];
        const newDate = dates[i];
        if (act._fbId) {
          const ref = getUserDoc('activities', act._fbId);
          batch.update(ref, {
            dataPostagem: newDate,
            dataVencimento: newDate
          });
          hasBatch = true;
        }
      }

      if (hasBatch) {
        await batch.commit();
      }

      showToast(`${pendingEditorial.length} conteúdos reagendados para Seg, Qua e Sex com sucesso!`);
      return { count: pendingEditorial.length, dates };
    } catch (err) {
      console.error('[Reschedule] Erro ao reagendar:', err);
      showToast('Erro ao reagendar conteúdos.', 'error');
      throw err;
    }
  };

  // CRUD Categorias
  const openNewCategory = useCallback(() => {
    setEditCategoryData(null);
    setCatModalOpen(true);
  }, []);

  const openEditCategory = useCallback((catId) => {
    const c = categories.find((x) => x.id === catId);
    if (c) {
      setEditCategoryData(c);
      setCatModalOpen(true);
    }
  }, [categories]);

  const closeCategoryModal = useCallback(() => {
    setCatModalOpen(false);
    setEditCategoryData(null);
  }, []);

  const saveCategory = async ({ id, nome, cor }) => {
    try {
      if (id) {
        const c = categories.find((x) => x.id === id);
        if (c?._fbId) {
          await getUserDoc('categories', c._fbId).update({ nome, cor });
          showToast('Categoria atualizada');
        }
      } else {
        const nextCatId = categories.length > 0 ? Math.max(...categories.map((c) => c.id || 0)) + 1 : 1;
        await getUserCollection('categories').add({ id: nextCatId, nome, cor });
        showToast('Categoria criada');
      }
      closeCategoryModal();
    } catch (e) {
      showToast('Erro ao salvar categoria.', 'error');
    }
  };

  const deleteCategory = useCallback((catId) => {
    const c = categories.find((x) => x.id === catId);
    if (!c || c.id === 1) return;
    showConfirm('Excluir categoria?', 'Tarefas dessa categoria ficarão sem categoria vinculada.', async () => {
      try {
        if (c._fbId) {
          await getUserDoc('categories', c._fbId).delete();
          showToast('Categoria removida');
          closeCategoryModal();
        }
      } catch (e) {
        showToast('Erro ao remover categoria.', 'error');
      }
    });
  }, [categories, showConfirm, closeCategoryModal, showToast]);

  // Exportações
  const exportCSV = useCallback(() => {
    if (!activities.length) {
      showToast('Nenhuma tarefa para exportar.', 'error');
      return;
    }
    const escapeCell = (val) => {
      if (val === null || val === undefined) return '""';
      let s = String(val);
      if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
        s = `"${s.replace(/"/g, '""')}"`;
      } else {
        s = `"${s}"`;
      }
      return s;
    };

    const headers = ['ID', 'Título', 'Categoria', 'Estágio', 'Prioridade', 'Progresso', 'Deadline', 'Data Postagem'];
    const rows = [headers.map(escapeCell).join(',')];

    activities.forEach((a, idx) => {
      const cat = catOf(a.categoria);
      const st = stageOf(a.stage);
      const pr = PRIOS[a.prioridade] || PRIOS.baixa;
      rows.push([
        escapeCell(a.id || idx + 1),
        escapeCell(a.titulo || ''),
        escapeCell(cat ? cat.nome : 'Sem categoria'),
        escapeCell(st ? st.label : a.stage),
        escapeCell(pr ? pr.label : 'Baixa'),
        escapeCell(`${a.progress || 0}%`),
        escapeCell(a.dataVencimento || ''),
        escapeCell(a.dataPostagem || '')
      ].join(','));
    });

    const csvContent = '\uFEFF' + rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio_tarefas_makro_${todayISO()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Relatório CSV exportado');
  }, [activities, catOf, stageOf, showToast]);

  const exportBackup = useCallback(() => {
    const payload = {
      app: 'Makro Hub React',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      activities,
      categories
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `makro_hub_backup_${todayISO()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Backup JSON exportado');
  }, [activities, categories, showToast]);

  const importBackup = useCallback((data) => {
    try {
      if (!data || !Array.isArray(data.activities) || !Array.isArray(data.categories)) {
        throw new Error('Formato inválido');
      }
      setActivities(data.activities);
      setCategories(data.categories);
      showToast('Backup restaurado localmente');
    } catch (e) {
      showToast('Arquivo de backup inválido.', 'error');
    }
  }, [showToast]);

  return (
    <HubContext.Provider
      value={{
        user,
        authLoading,
        signInWithGoogle,
        signOutUser,
        activities,
        categories,
        view,
        setView,
        theme,
        setTheme,
        accentColor,
        setAccentColor,
        collapsed,
        setCollapsed,
        listMode,
        setListMode,
        listStage,
        setListStage,
        listCat,
        setListCat,
        searchQuery,
        setSearchQuery,
        taskModalOpen,
        editTaskId,
        taskModalInitialData,
        openNewTask,
        openEditTask,
        closeTaskModal,
        saveTask,
        deleteTask,
        moveTaskStage,
        catModalOpen,
        editCategoryData,
        openNewCategory,
        openEditCategory,
        closeCategoryModal,
        saveCategory,
        deleteCategory,
        confirmModal,
        closeConfirm,
        showConfirm,
        toasts,
        showToast,
        catOf,
        stageOf,
        getTask,
        isOverdue,
        isDueSoon,
        exportCSV,
        exportBackup,
        importBackup,
        isEditorialActivity: (a) => isEditorialActivity(a, categories),
        rescheduleUnpublishedEditorial,
        authError,
        loggingIn
      }}
    >
      {children}
    </HubContext.Provider>
  );
}

export function useHub() {
  return useContext(HubContext);
}

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import firebase, { db, auth, storage, googleProvider, getUserCollection, getUserDoc, getSecondaryAuth } from '../firebase';

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

export const DEFAULT_PROJECTS = [
  { id: 'proj-1', nome: 'Expomaq & Eventos 2026', status: 'em-andamento', cor: '#1279FF', tags: ['Feiras', 'Eventos'], lider: 'Weverson Nascimento', responsavelEmail: 'weversonf@gmail.com' },
  { id: 'proj-2', nome: 'Endomarketing & SIPAT Makro', status: 'em-andamento', cor: '#10B981', tags: ['Endomarketing', 'SIPAT'], lider: 'Weverson Nascimento', responsavelEmail: 'weversonf@gmail.com' },
  { id: 'proj-3', nome: 'Projeto Super Heavy Lift (Frota Pesada)', status: 'em-andamento', cor: '#F59E0B', tags: ['Guindastes', 'Frota'], lider: 'Weverson Nascimento', responsavelEmail: 'weversonf@gmail.com' },
  { id: 'proj-4', nome: 'Redesign Portal & Mídia Kit 2026', status: 'planejamento', cor: '#8B5CF6', tags: ['Branding', 'Website'], lider: 'Weverson Nascimento', responsavelEmail: 'weversonf@gmail.com' }
];

export const MASTER_ADMIN_EMAIL = 'weversonf@gmail.com';

export const USER_ROLES = {
  admin_master: {
    id: 'admin_master',
    label: 'ADM Master',
    icon: '👑',
    color: '#F59E0B',
    badgeClass: 'bg-amber-500/15 text-amber-500 border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-400',
    description: 'Acesso total, gestão de equipe, pesquisa NPS e controle de níveis'
  },
  admin: {
    id: 'admin',
    label: 'Administrador',
    icon: '🛡️',
    color: '#3B82F6',
    badgeClass: 'bg-blue-500/15 text-blue-500 border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400',
    description: 'Gestão completa de tarefas, projetos, relatórios e pesquisa NPS'
  },
  colaborador: {
    id: 'colaborador',
    label: 'Colaborador',
    icon: '👤',
    color: '#10B981',
    badgeClass: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-400',
    description: 'Execução de demandas atribuídas e controle de ponto individual'
  },
  visualizador: {
    id: 'visualizador',
    label: 'Visualizador',
    icon: '👁️',
    color: '#64748B',
    badgeClass: 'bg-slate-500/15 text-slate-500 border-slate-500/30 dark:bg-slate-500/20 dark:text-slate-400',
    description: 'Acesso somente leitura a tarefas'
  }
};

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
  const [userProfile, setUserProfile] = useState(null);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [discoveredMasterUid, setDiscoveredMasterUid] = useState(null);

  const isMaster = Boolean(
    user?.email && user.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()
  );
  const userRole = isMaster ? 'admin_master' : (userProfile?.role || 'colaborador');
  const isAdmin = isMaster || userRole === 'admin';
  const userLevelInfo = USER_ROLES[userRole] || USER_ROLES.colaborador;

  // Descobre o UID do ADM Master no banco de dados para compartilhamento do Workspace
  useEffect(() => {
    if (!user) return;
    if (isMaster) {
      setDiscoveredMasterUid(user.uid);
      return;
    }
    db.collection('users')
      .where('email', '==', MASTER_ADMIN_EMAIL)
      .limit(1)
      .get()
      .then((snap) => {
        if (!snap.empty) {
          setDiscoveredMasterUid(snap.docs[0].id);
        }
      })
      .catch((err) => console.warn('[MasterUid lookup]', err));
  }, [user, isMaster]);

  const masterUid = isMaster
    ? user?.uid
    : (discoveredMasterUid || registeredUsers.find(
        (u) => u.email && u.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()
      )?.uid || null);

  const getSharedCollection = useCallback((colName) => {
    const targetUid = masterUid || (isMaster ? user?.uid : null);
    if (targetUid) {
      return db.collection('users').doc(targetUid).collection(colName);
    }
    // Fallback para a coleção raiz caso o masterUid ainda esteja em resolução
    return db.collection(colName);
  }, [masterUid, isMaster, user]);

  const getSharedDoc = useCallback((colName, docId) => {
    return getSharedCollection(colName).doc(docId);
  }, [getSharedCollection]);

  const [allActivities, setAllActivities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentView, setCurrentView] = useState('dash');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Atividades com filtro estrito de privacidade por papel de usuário:
  // - Administradores e ADM Master (isAdmin === true): visualizam todas as atividades da empresa
  // - Usuários comuns (colaborador / visualizador): visualizam EXCLUSIVAMENTE as atividades direcionadas a eles
  const activities = useMemo(() => {
    if (!user) return [];
    if (isAdmin) return allActivities;

    const userUid = String(user.uid || user.id || '').trim().toLowerCase();
    const userProfileId = String(userProfile?.id || userProfile?.uid || '').trim().toLowerCase();
    const userEmail = String(user.email || userProfile?.email || '').trim().toLowerCase();
    const userEmailPrefix = userEmail.includes('@') ? userEmail.split('@')[0].trim().toLowerCase() : '';
    const userDisplayName = String(userProfile?.displayName || userProfile?.nome || user.displayName || '').trim().toLowerCase();
    const nameParts = userDisplayName.split(/\s+/).filter((p) => p.length >= 2);

    return allActivities.filter((a) => {
      // 1. Pelo responsavelId ou id do usuário
      const respId = String(a.responsavelId || '').trim().toLowerCase();
      if (respId) {
        if (userUid && respId === userUid) return true;
        if (userProfileId && respId === userProfileId) return true;
      }

      // 2. Pelo responsavelEmail
      const respEmail = String(a.responsavelEmail || '').trim().toLowerCase();
      if (respEmail && userEmail && respEmail === userEmail) {
        return true;
      }

      // 3. Pelo nome do responsável
      const respName = String(a.responsavel || '').trim().toLowerCase();
      if (respName) {
        if (userDisplayName && (respName === userDisplayName || respName.includes(userDisplayName) || userDisplayName.includes(respName))) {
          return true;
        }
        if (userEmailPrefix && (respName === userEmailPrefix || respName.includes(userEmailPrefix) || userEmailPrefix.includes(respName))) {
          return true;
        }
        if (nameParts.length >= 2 && nameParts.every((part) => respName.includes(part))) {
          return true;
        }
      }

      return false;
    });
  }, [allActivities, user, userProfile, isAdmin]);

  // Views administrativas que exigem perfil de ADM ou ADM Master
  const adminOnlyViews = ['equipe', 'performance', 'nps', 'config', 'categorias'];

  // Redirecionamento e proteção de rota com base no nível de permissão
  useEffect(() => {
    if (!authLoading && user) {
      if (!isAdmin && adminOnlyViews.includes(currentView)) {
        setCurrentView('lista');
      }
    }
  }, [authLoading, user, isAdmin, currentView]);

  const setView = useCallback((newView) => {
    if (!isAdmin && adminOnlyViews.includes(newView)) {
      setCurrentView('lista');
      setMobileDrawerOpen(false);
      return;
    }
    setCurrentView(newView);
    setMobileDrawerOpen(false);
  }, [isAdmin]);
  const view = currentView;
  const [theme, setTheme] = useState(() => localStorage.getItem('hr-theme') || localStorage.getItem('ax:theme') || 'light');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('ax:accent') || '#1E856C');
  const [collapsed, setCollapsed] = useState(() => {
    const hrVal = localStorage.getItem('hr-sidebar');
    if (hrVal) return hrVal === 'collapsed';
    return localStorage.getItem('ax:collapsed') === '1';
  });

  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

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

  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const openNotifModal = useCallback(() => setNotifModalOpen(true), []);
  const closeNotifModal = useCallback(() => setNotifModalOpen(false), []);

  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });
  const [toasts, setToasts] = useState([]);
  const [mustChangePasswordPrompt, setMustChangePasswordPrompt] = useState(false);

  // Toast helper
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  // Confirm helper (suporta tanto showConfirm(title, message, onConfirm) quanto showConfirm({ title, message, onConfirm }))
  const showConfirm = useCallback((titleOrOpts, message, onConfirm) => {
    if (typeof titleOrOpts === 'object' && titleOrOpts !== null) {
      setConfirmModal({
        open: true,
        title: typeof titleOrOpts.title === 'string' ? titleOrOpts.title : 'Confirmação',
        message: typeof titleOrOpts.message === 'string' ? titleOrOpts.message : '',
        onConfirm: typeof titleOrOpts.onConfirm === 'function' ? titleOrOpts.onConfirm : null,
        confirmText: titleOrOpts.confirmText || 'Confirmar',
        confirmTone: titleOrOpts.confirmTone || 'danger'
      });
    } else {
      setConfirmModal({
        open: true,
        title: typeof titleOrOpts === 'string' ? titleOrOpts : 'Confirmação',
        message: typeof message === 'string' ? message : '',
        onConfirm: typeof onConfirm === 'function' ? onConfirm : null,
        confirmText: 'Confirmar',
        confirmTone: 'danger'
      });
    }
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmModal((prev) => ({ ...prev, open: false, onConfirm: null }));
  }, []);

  // Theme & Accent effect com sincronização em nuvem
  useEffect(() => {
    document.documentElement.setAttribute('data-ax-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('ax:theme', theme);
    localStorage.setItem('hr-theme', theme);

    if (user && user.uid) {
      const payload = {
        theme,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      getUserDoc('settings', 'preferences').set(payload, { merge: true }).catch(() => {});
      db.collection('users').doc(user.uid).set(payload, { merge: true }).catch(() => {});
    }
  }, [theme, user]);

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

  // Sincronização em tempo real das preferências do usuário (Tema PC <-> Mobile)
  useEffect(() => {
    if (!user || !user.uid) return;

    const unsubPrefs = getUserDoc('settings', 'preferences').onSnapshot((doc) => {
      if (doc.exists) {
        const data = doc.data();
        if (data && (data.theme === 'dark' || data.theme === 'light')) {
          setTheme((curr) => (curr !== data.theme ? data.theme : curr));
        }
      }
    }, (err) => {
      console.warn('[Firestore] Erro ao sincronizar preferências:', err);
    });

    return () => unsubPrefs();
  }, [user]);

  // Sincronização em tempo real dos usuários reais cadastrados e permissões
  useEffect(() => {
    if (!user || !user.uid) {
      setUserProfile(null);
      setRegisteredUsers([]);
      return;
    }

    const isCurrentMaster = user.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();

    // 1. Sincroniza e garante integridade do perfil do usuário logado no Firestore com os dados do Google Auth
    const userDocRef = db.collection('users').doc(user.uid);
    const unsubProfile = userDocRef.onSnapshot(async (doc) => {
      let data = doc.exists ? doc.data() : null;

      // Se o doc com docId === user.uid não existe, busca se há doc com o mesmo email para vincular permissões
      if (!data && user.email) {
        try {
          const emailSnap = await db.collection('users')
            .where('email', '==', user.email.toLowerCase())
            .limit(1)
            .get();
          if (!emailSnap.empty) {
            const oldDoc = emailSnap.docs[0];
            if (oldDoc.id !== user.uid) {
              const oldData = oldDoc.data();
              await userDocRef.set({
                ...oldData,
                uid: user.uid,
                id: user.uid,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
              }, { merge: true });
              await oldDoc.ref.delete().catch(() => {});
              data = { ...oldData, uid: user.uid, id: user.uid };
            }
          }
        } catch (migErr) {
          console.warn('[Profile Migration by Email]', migErr);
        }
      }

      if (!doc.exists && !data) {
        const initialProfile = {
          uid: user.uid,
          id: user.uid,
          email: user.email || (isCurrentMaster ? MASTER_ADMIN_EMAIL : ''),
          displayName: user.displayName || (isCurrentMaster ? 'Weverson Nascimento' : (user.email ? user.email.split('@')[0] : 'Colaborador')),
          nome: user.displayName || (isCurrentMaster ? 'Weverson Nascimento' : (user.email ? user.email.split('@')[0] : 'Colaborador')),
          photoURL: user.photoURL || '',
          foto: user.photoURL || '',
          role: isCurrentMaster ? 'admin_master' : 'colaborador',
          cargo: isCurrentMaster ? 'ADM Master & Coordenador' : 'Colaborador de Marketing',
          departamento: 'Marketing Central',
          ramal: isCurrentMaster ? '(85) 99924-1234' : '',
          online: true,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        userDocRef.set(initialProfile, { merge: true }).catch(console.warn);
        setUserProfile(initialProfile);
      } else {
        const currentData = data || {};
        const updates = {};

        if (user.email && !currentData.email) updates.email = user.email;
        if (user.displayName && !currentData.displayName && !currentData.nome) {
          updates.displayName = user.displayName;
          updates.nome = user.displayName;
        }
        if (user.photoURL && !currentData.photoURL && !currentData.foto) {
          updates.photoURL = user.photoURL;
          updates.foto = user.photoURL;
        }
        if (isCurrentMaster && currentData.role !== 'admin_master') {
          updates.role = 'admin_master';
        }

        if (Object.keys(updates).length > 0) {
          userDocRef.set(updates, { merge: true }).catch(console.warn);
        }
        setUserProfile({ ...currentData, ...updates });
      }

      // Verifica se o usuário autenticado por e-mail/senha precisa trocar a senha temporária no primeiro login
      const isPasswordUser = user.providerData?.some((p) => p.providerId === 'password');
      if (isPasswordUser && (data.mustChangePassword === true || data.precisaTrocarSenha === true)) {
        setMustChangePasswordPrompt(true);
      } else {
        setMustChangePasswordPrompt(false);
      }
    }, (err) => {
      console.warn('[Firestore] Erro ao sincronizar perfil do usuário:', err);
    });

    // 2. Sincroniza a lista completa de pessoas cadastradas no Makro Hub
    const unsubAllUsers = db.collection('users').onSnapshot((snap) => {
      const list = [];
      let selfFound = false;

      snap.forEach((d) => {
        const data = d.data();
        const isSelf = user && (d.id === user.uid || data.uid === user.uid);
        if (isSelf) selfFound = true;

        const email = data.email || (isSelf ? user.email : '') || '';
        const isThisMaster = isSelf ? isCurrentMaster : (email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase());

        const photo = (isSelf && user.photoURL) ? user.photoURL : (data.photoURL || data.foto || '');
        const name = (isSelf && user.displayName)
          ? user.displayName
          : (data.displayName || data.nome || (isThisMaster ? 'Weverson Nascimento' : (email ? email.split('@')[0] : 'Colaborador')));

        list.push({
          ...data,
          id: d.id,
          uid: d.id,
          nome: name,
          displayName: name,
          email: email || (isThisMaster ? (user.email || MASTER_ADMIN_EMAIL) : '—'),
          foto: photo,
          photoURL: photo,
          cargo: data.cargo || (isThisMaster ? 'ADM Master & Coordenador' : 'Colaborador de Marketing'),
          departamento: data.departamento || 'Marketing Central',
          ramal: data.ramal || (isThisMaster ? '(85) 99924-1234' : ''),
          role: isThisMaster ? 'admin_master' : (data.role || 'colaborador'),
          online: isSelf ? true : (data.online !== false)
        });
      });

      // Se o usuário logado ainda não constar na lista do snapshot, insere-o garantindo visualização imediata
      if (!selfFound && user) {
        list.unshift({
          id: user.uid,
          uid: user.uid,
          email: user.email || MASTER_ADMIN_EMAIL,
          nome: user.displayName || 'Weverson Nascimento',
          displayName: user.displayName || 'Weverson Nascimento',
          foto: user.photoURL || '',
          photoURL: user.photoURL || '',
          role: isCurrentMaster ? 'admin_master' : 'colaborador',
          cargo: isCurrentMaster ? 'ADM Master & Coordenador' : 'Colaborador de Marketing',
          departamento: 'Marketing Central',
          ramal: '(85) 99924-1234',
          online: true
        });
      }

      setRegisteredUsers(list);
    }, (err) => {
      console.warn('[Firestore] Erro ao carregar usuários:', err);
    });

    return () => {
      unsubProfile();
      unsubAllUsers();
    };
  }, [user]);

  // Firestore Sync com o Workspace Central (ADM Master & Colaboradores)
  useEffect(() => {
    if (!user) {
      setAllActivities([]);
      setCategories([]);
      setProjects([]);
      return;
    }

    const colActs = getSharedCollection('activities');
    const unsubActs = colActs.onSnapshot(async (snap) => {
      const list = [];
      const defaultRespName = 'Weverson Nascimento';
      const defaultRespEmail = MASTER_ADMIN_EMAIL;
      const defaultRespUid = 'master';

      snap.forEach((doc) => {
        const d = doc.data();
        let respEmail = d.responsavelEmail || '';
        let respId = d.responsavelId || '';
        let respName = d.responsavel || '';

        // Se respEmail não constar mas tiver responsavel, busca o email do colaborador em registeredUsers
        if (!respEmail && respName && registeredUsers && registeredUsers.length > 0) {
          const matched = registeredUsers.find((u) => {
            const uName = (u.displayName || u.nome || '').trim().toLowerCase();
            const rName = respName.trim().toLowerCase();
            return uName === rName || uName.includes(rName) || rName.includes(uName);
          });
          if (matched) {
            respEmail = matched.email || '';
            respId = respId || matched.id || matched.uid || '';
          }
        }

        list.push({
          ...d,
          _fbId: doc.id,
          responsavel: respName || (isMaster ? defaultRespName : ''),
          responsavelEmail: respEmail || (respName ? '' : (isMaster ? defaultRespEmail : '')),
          responsavelId: respId || (respName ? '' : (isMaster ? defaultRespUid : '')),
          responsavelFoto: d.responsavelFoto || ''
        });
      });

      // Se a coleção estiver vazia, verifica e migra/usa da coleção raiz de atividades
      if (list.length === 0) {
        try {
          const rootSnap = await db.collection('activities').get();
          if (!rootSnap.empty) {
            if (isMaster && user && user.uid) {
              const batch = db.batch();
              rootSnap.forEach((rDoc) => {
                const rData = rDoc.data();
                const userActRef = colActs.doc(rDoc.id);
                batch.set(userActRef, {
                  ...rData,
                  responsavel: rData.responsavel || defaultRespName,
                  responsavelEmail: rData.responsavelEmail || defaultRespEmail,
                  responsavelId: rData.responsavelId || defaultRespUid,
                  responsavelFoto: rData.responsavelFoto || ''
                }, { merge: true });
              });
              await batch.commit();
            } else {
              const fallbackList = [];
              rootSnap.forEach((rDoc) => {
                const rData = rDoc.data();
                fallbackList.push({
                  ...rData,
                  _fbId: rDoc.id
                });
              });
              if (fallbackList.length > 0) {
                setAllActivities(fallbackList);
                return;
              }
            }
          }
        } catch (mErr) {
          console.warn('[Activities Sync] Verificação da coleção raiz:', mErr);
        }
      }

      setAllActivities(list);
    }, (err) => {
      console.warn('[Firestore] Error snapshot activities:', err);
    });

    const colCats = getSharedCollection('categories');
    const unsubCats = colCats.onSnapshot(async (snap) => {
      const cats = [];
      snap.forEach((doc) => {
        cats.push({ ...doc.data(), _fbId: doc.id });
      });
      if (cats.length === 0) {
        try {
          const rootCats = await db.collection('categories').get();
          if (!rootCats.empty) {
            const rCats = [];
            rootCats.forEach((c) => rCats.push({ ...c.data(), _fbId: c.id }));
            setCategories(rCats);
            return;
          }
        } catch (cErr) {
          console.warn('[Categories] Root fallback:', cErr);
        }
        if (isMaster) {
          Promise.all(DEFAULT_CATS.map((c) => colCats.add(c)));
        } else {
          setCategories(DEFAULT_CATS);
        }
      } else {
        setCategories(cats);
      }
    }, (err) => {
      console.warn('[Firestore] Error snapshot categories:', err);
    });

    const colProjs = getSharedCollection('projects');
    const unsubProjs = colProjs.onSnapshot(async (snap) => {
      const projs = [];
      snap.forEach((doc) => {
        projs.push({ ...doc.data(), _fbId: doc.id });
      });
      if (projs.length === 0) {
        try {
          const rootProjs = await db.collection('projects').get();
          if (!rootProjs.empty) {
            const rProjs = [];
            rootProjs.forEach((p) => rProjs.push({ ...p.data(), _fbId: p.id }));
            setProjects(rProjs);
            return;
          }
        } catch (pErr) {
          console.warn('[Projects] Root fallback:', pErr);
        }
        if (isMaster) {
          Promise.all(DEFAULT_PROJECTS.map((p) => colProjs.add(p)));
        } else {
          setProjects(DEFAULT_PROJECTS);
        }
      } else {
        setProjects(projs);
      }
    }, (err) => {
      console.warn('[Firestore] Error snapshot projects:', err);
    });

    return () => {
      unsubActs();
      unsubCats();
      unsubProjs();
    };
  }, [user, getSharedCollection, isMaster, registeredUsers]);

  // Helpers de Projetos
  const createProject = useCallback(async (projectData) => {
    if (!projectData || !projectData.nome) return null;
    const cleanNome = projectData.nome.trim();
    if (!cleanNome) return null;

    const exists = projects.find((p) => p.nome && p.nome.toLowerCase() === cleanNome.toLowerCase());
    if (exists) return cleanNome;

    const docRef = getSharedCollection('projects').doc();
    const newProj = {
      nome: cleanNome,
      descricao: projectData.descricao || '',
      status: projectData.status || 'em-andamento',
      prazo: projectData.prazo || null,
      cor: projectData.cor || '#1279FF',
      tags: projectData.tags || ['Projeto'],
      lider: projectData.lider || user?.displayName || 'Weverson Nascimento',
      responsavelEmail: projectData.responsavelEmail || user?.email || MASTER_ADMIN_EMAIL,
      createdAt: new Date().toISOString()
    };
    const newProjWithFbId = { ...newProj, _fbId: docRef.id };

    // Atualização otimista imediata na UI
    setProjects((prev) => [...prev, newProjWithFbId]);

    docRef.set(newProj).catch((e) => {
      console.warn('Erro ao criar projeto:', e);
      setProjects((prev) => prev.filter((p) => p._fbId !== docRef.id));
    });
    return cleanNome;
  }, [projects, user]);

  const allProjectsList = useMemo(() => {
    const set = new Set();
    projects.forEach((p) => {
      if (p.nome && p.nome.trim()) set.add(p.nome.trim());
    });
    activities.forEach((a) => {
      if (a.projeto && a.projeto.trim()) set.add(a.projeto.trim());
    });
    if (set.size === 0) {
      DEFAULT_PROJECTS.forEach((p) => set.add(p.nome));
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [projects, activities]);

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

  const signInWithEmail = async (email, password) => {
    try {
      setLoggingIn(true);
      setAuthError(null);
      const cleanEmail = email?.trim().toLowerCase();
      await auth.signInWithEmailAndPassword(cleanEmail, password);
    } catch (e) {
      console.error('[Auth Error Email]', e);
      let msg = 'Erro ao realizar login.';
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        msg = 'E-mail ou senha incorretos. Verifique suas credenciais.';
      } else if (e.code === 'auth/invalid-email') {
        msg = 'O formato do e-mail digitado é inválido.';
      } else if (e.code === 'auth/user-disabled') {
        msg = 'Esta conta foi desativada pelo administrador.';
      } else if (e.code === 'auth/too-many-requests') {
        msg = 'Muitas tentativas sem sucesso. Tente novamente mais tarde.';
      } else {
        msg = e.message || msg;
      }
      setAuthError(msg);
      showToast(msg, 'error');
      throw e;
    } finally {
      setLoggingIn(false);
    }
  };

  const sendPasswordReset = async (email) => {
    try {
      const cleanEmail = email?.trim().toLowerCase();
      if (!cleanEmail) {
        showToast('Informe o seu e-mail para recuperar a senha.', 'error');
        return false;
      }
      await auth.sendPasswordResetEmail(cleanEmail);
      showToast('E-mail de redefinição de senha enviado com sucesso!', 'success');
      return true;
    } catch (e) {
      console.error('[Reset Password Error]', e);
      showToast('Erro ao enviar e-mail de redefinição. Verifique o endereço.', 'error');
      return false;
    }
  };

  const changePassword = async (newPassword) => {
    if (!auth.currentUser) {
      showToast('Nenhum usuário logado.', 'error');
      return false;
    }
    if (!newPassword || newPassword.length < 6) {
      showToast('A nova senha deve conter no mínimo 6 dígitos.', 'error');
      return false;
    }
    try {
      await auth.currentUser.updatePassword(newPassword);
      const uid = auth.currentUser.uid;
      await db.collection('users').doc(uid).set({
        mustChangePassword: false,
        precisaTrocarSenha: false,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      setMustChangePasswordPrompt(false);
      showToast('Senha alterada com sucesso! Bem-vindo ao Makro Hub.', 'success');
      return true;
    } catch (e) {
      console.error('[Change Password Error]', e);
      if (e.code === 'auth/requires-recent-login') {
        showToast('Por segurança, faça login novamente para alterar sua senha.', 'error');
      } else {
        showToast(`Erro ao alterar senha: ${e.message}`, 'error');
      }
      return false;
    }
  };

  const signOutUser = async () => {
    try {
      await auth.signOut();
      setUser(null);
      showToast('Sessão encerrada com sucesso.', 'info');
      setTimeout(() => {
        window.location.reload();
      }, 80);
    } catch (e) {
      console.error('[SignOut Error]', e);
      showToast('Erro ao encerrar sessão.', 'error');
    }
  };

  // Funções de Gestão de Usuários e Níveis (ADM Master)
  const updateUserRole = useCallback(async (userId, newRole) => {
    if (!isMaster) {
      showToast('Apenas o ADM Master pode alterar níveis de acesso.', 'error');
      return false;
    }
    const target = registeredUsers.find((u) => u.id === userId || u.uid === userId);
    if (target?.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase() && newRole !== 'admin_master') {
      showToast('O nível do ADM Master principal é permanente e não pode ser alterado.', 'error');
      return false;
    }
    try {
      await db.collection('users').doc(userId).set({
        role: newRole,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      showToast('Nível de acesso atualizado com sucesso!', 'success');
      return true;
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar nível de acesso.', 'error');
      return false;
    }
  }, [isMaster, registeredUsers, showToast]);

  const addTeamMember = useCallback(async (memberData) => {
    if (!isMaster && !isAdmin) {
      showToast('Você não tem permissão para cadastrar colaboradores.', 'error');
      return false;
    }
    try {
      const email = memberData.email?.trim().toLowerCase();
      if (!email) {
        showToast('Informe um e-mail válido.', 'error');
        return false;
      }
      const exists = registeredUsers.some((u) => u.email?.toLowerCase() === email);
      if (exists) {
        showToast('Este colaborador já está cadastrado.', 'error');
        return false;
      }

      const assignedRole = email === MASTER_ADMIN_EMAIL.toLowerCase() ? 'admin_master' : (memberData.role || 'colaborador');
      const tempPassword = memberData.senha?.trim();
      let createdUid = null;
      let existingAuth = false;

      if (tempPassword) {
        try {
          const secAuth = getSecondaryAuth();
          const userCred = await secAuth.createUserWithEmailAndPassword(email, tempPassword);
          createdUid = userCred.user.uid;
          await secAuth.signOut();
        } catch (authErr) {
          console.warn('[Secondary Auth]', authErr);
          if (authErr.code === 'auth/email-already-in-use') {
            existingAuth = true;
            try {
              await auth.sendPasswordResetEmail(email);
            } catch (rErr) {
              console.warn('[Auto Reset Error]', rErr);
            }
          } else {
            showToast(`Aviso de autenticação: ${authErr.message}`, 'warning');
          }
        }
      }

      // Procura se já existe documento para esse e-mail no Firestore para evitar órfãos
      const existingSnap = await db.collection('users').where('email', '==', email).limit(1).get();
      const docRef = !existingSnap.empty
        ? existingSnap.docs[0].ref
        : (createdUid ? db.collection('users').doc(createdUid) : db.collection('users').doc());
      const finalUid = createdUid || docRef.id;

      const newMember = {
        uid: finalUid,
        id: finalUid,
        email,
        nome: memberData.nome?.trim() || email.split('@')[0],
        displayName: memberData.nome?.trim() || email.split('@')[0],
        cargo: memberData.cargo?.trim() || 'Colaborador de Marketing',
        departamento: memberData.departamento?.trim() || 'Marketing Central',
        ramal: memberData.ramal?.trim() || '',
        foto: memberData.foto?.trim() || '',
        photoURL: memberData.foto?.trim() || '',
        role: assignedRole,
        mustChangePassword: Boolean(memberData.mustChangePassword ?? (tempPassword ? true : false)),
        online: false,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await docRef.set(newMember, { merge: true });

      if (existingAuth) {
        showToast(`Colaborador cadastrado! Como ${email} já existia no Firebase, enviamos um link para ele definir sua senha.`, 'info');
      } else {
        showToast('Colaborador cadastrado com sucesso!', 'success');
      }
      return true;
    } catch (err) {
      console.error(err);
      showToast('Erro ao cadastrar colaborador.', 'error');
      return false;
    }
  }, [isMaster, isAdmin, registeredUsers, showToast]);

  const updateTeamMember = useCallback(async (userId, memberData) => {
    if (!isMaster && !isAdmin) {
      showToast('Você não tem permissão para editar colaboradores.', 'error');
      return false;
    }
    try {
      const email = memberData.email?.trim().toLowerCase();
      const isTargetMaster = email === MASTER_ADMIN_EMAIL.toLowerCase() || userId === user?.uid;
      const assignedRole = isTargetMaster ? 'admin_master' : (memberData.role || 'colaborador');

      const tempPassword = memberData.senha?.trim();
      let sentReset = false;

      if (tempPassword && email) {
        try {
          const secAuth = getSecondaryAuth();
          await secAuth.createUserWithEmailAndPassword(email, tempPassword);
          await secAuth.signOut();
        } catch (authErr) {
          if (authErr.code === 'auth/email-already-in-use') {
            try {
              await auth.sendPasswordResetEmail(email);
              sentReset = true;
            } catch (e) {
              console.warn('[Secondary Auth Reset]', e);
            }
          } else {
            console.warn('[Secondary Auth Edit]', authErr);
          }
        }
      }

      const payload = {
        nome: memberData.nome?.trim() || '',
        displayName: memberData.nome?.trim() || '',
        cargo: memberData.cargo?.trim() || 'Colaborador',
        departamento: memberData.departamento?.trim() || 'Marketing Central',
        ramal: memberData.ramal?.trim() || '',
        foto: memberData.foto?.trim() || '',
        photoURL: memberData.foto?.trim() || '',
        role: assignedRole,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (tempPassword) {
        payload.mustChangePassword = Boolean(memberData.mustChangePassword ?? true);
      }

      await db.collection('users').doc(userId).set(payload, { merge: true });
      if (sentReset) {
        showToast(`Dados atualizados! Como ${email} já possuía cadastro, enviamos um link de redefinição de senha para ele.`, 'info');
      } else {
        showToast('Dados do colaborador atualizados com sucesso!', 'success');
      }
      return true;
    } catch (err) {
      console.error(err);
      showToast('Erro ao atualizar dados do colaborador.', 'error');
      return false;
    }
  }, [isMaster, isAdmin, user, showToast]);

  const deleteTeamMember = useCallback(async (userId, memberEmail) => {
    if (!isMaster) {
      showToast('Apenas o ADM Master pode remover colaboradores.', 'error');
      return false;
    }
    if (memberEmail?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
      showToast('O ADM Master principal não pode ser removido.', 'error');
      return false;
    }
    try {
      await db.collection('users').doc(userId).delete();
      showToast('Colaborador removido da equipe com sucesso.', 'success');
      return true;
    } catch (err) {
      console.error(err);
      showToast('Erro ao remover colaborador.', 'error');
      return false;
    }
  }, [isMaster, showToast]);

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

  const notifications = useMemo(() => {
    const list = [];
    activities.forEach((a) => {
      if (a.stage === 'concluido') return;
      const overdue = isOverdue(a);
      const dueSoon = isDueSoon(a);
      const isUrgent = a.prioridade === 'urgente' || a.prioridade === 'alta';

      if (overdue) {
        list.push({
          id: `overdue-${a.id}`,
          taskId: a.id,
          task: a,
          type: 'overdue',
          title: a.titulo,
          badge: 'Atrasada',
          tone: 'danger',
          desc: `Venceu em ${fmtDate(a.dataVencimento)}`,
          date: a.dataVencimento
        });
      } else if (dueSoon) {
        list.push({
          id: `duesoon-${a.id}`,
          taskId: a.id,
          task: a,
          type: 'duesoon',
          title: a.titulo,
          badge: 'Vencendo em breve',
          tone: 'warning',
          desc: `Prazo: ${fmtDate(a.dataVencimento)}`,
          date: a.dataVencimento
        });
      } else if (isUrgent) {
        list.push({
          id: `urgent-${a.id}`,
          taskId: a.id,
          task: a,
          type: 'urgent',
          title: a.titulo,
          badge: a.prioridade === 'urgente' ? 'Urgente' : 'Alta Prioridade',
          tone: 'danger',
          desc: `Prioridade ${a.prioridade === 'urgente' ? 'Urgente' : 'Alta'} pendente`,
          date: a.dataVencimento
        });
      }
    });

    return list.sort((x, y) => {
      if (x.type === 'overdue' && y.type !== 'overdue') return -1;
      if (y.type === 'overdue' && x.type !== 'overdue') return 1;
      return (x.date || '9999-99-99') < (y.date || '9999-99-99') ? -1 : 1;
    });
  }, [activities, isOverdue, isDueSoon]);

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

  const saveTask = (taskData) => {
    try {
      let respEmail = taskData.responsavelEmail || '';
      let respId = taskData.responsavelId || '';
      let respFoto = taskData.responsavelFoto || '';
      const respName = taskData.responsavel || (isMaster ? 'Weverson Nascimento' : (userProfile?.displayName || userProfile?.nome || user?.displayName || 'Colaborador'));

      if (!respEmail && respName && registeredUsers && registeredUsers.length > 0) {
        const match = registeredUsers.find((u) => {
          const uName = (u.displayName || u.nome || '').trim().toLowerCase();
          const rName = respName.trim().toLowerCase();
          return uName === rName || uName.includes(rName) || rName.includes(uName);
        });
        if (match) {
          respEmail = match.email || '';
          respId = respId || match.id || match.uid || '';
          respFoto = respFoto || match.photoURL || match.foto || '';
        }
      }

      const defaultResp = {
        responsavel: respName,
        responsavelEmail: respEmail || (taskData.responsavel ? '' : (isMaster ? MASTER_ADMIN_EMAIL : (userProfile?.email || user?.email || ''))),
        responsavelId: respId || (taskData.responsavel ? '' : (isMaster ? 'master' : (user?.uid || ''))),
        responsavelFoto: respFoto || (taskData.responsavel ? '' : (userProfile?.photoURL || userProfile?.foto || user?.photoURL || ''))
      };

      if (editTaskId) {
        const existing = getTask(editTaskId);
        if (existing) {
          const updatedTask = {
            ...existing,
            ...taskData,
            ...defaultResp,
            concluidoEm: taskData.stage === 'concluido' ? (existing.concluidoEm || todayISO()) : null
          };
          // Atualização otimista imediata na UI
          setAllActivities((prev) => prev.map((a) => (a.id === editTaskId ? updatedTask : a)));
          closeTaskModal();
          showToast('Tarefa atualizada com sucesso');

          if (existing._fbId) {
            getSharedDoc('activities', existing._fbId)
              .update({ ...taskData, ...defaultResp })
              .catch((err) => {
                console.error('[Firestore] Erro ao atualizar tarefa:', err);
                // Rollback
                setAllActivities((prev) => prev.map((a) => (a.id === editTaskId ? existing : a)));
                showToast('Erro ao sincronizar atualização com o servidor.', 'error');
              });
            db.collection('activities').doc(existing._fbId).set({ ...taskData, ...defaultResp }, { merge: true }).catch(() => {});
          }
        }
      } else {
        const nextId = allActivities.length > 0 ? Math.max(...allActivities.map((a) => a.id || 0)) + 1 : 1;
        const docRef = getSharedCollection('activities').doc();
        const newTask = {
          ...taskData,
          ...defaultResp,
          id: nextId,
          criadoEm: todayISO(),
          concluidoEm: taskData.stage === 'concluido' ? todayISO() : null
        };
        const newTaskWithFbId = {
          ...newTask,
          _fbId: docRef.id
        };

        // Atualização otimista imediata na UI
        setAllActivities((prev) => [...prev, newTaskWithFbId]);
        closeTaskModal();
        showToast('Tarefa criada com sucesso');

        docRef.set(newTask).then(() => {
          db.collection('activities').doc(docRef.id).set(newTask).catch(() => {});
        }).catch((err) => {
          console.error('[Firestore] Erro ao salvar nova tarefa:', err);
          // Rollback
          setAllActivities((prev) => prev.filter((a) => a._fbId !== docRef.id));
          showToast('Erro ao salvar tarefa no servidor.', 'error');
        });
      }
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar tarefa.', 'error');
    }
  };

  const deleteTask = useCallback((taskId) => {
    if (!isAdmin) {
      showToast('Apenas administradores podem excluir tarefas.', 'error');
      return;
    }
    const t = getTask(taskId);
    if (!t) return;
    showConfirm('Excluir tarefa?', 'Essa ação removerá a tarefa definitivamente.', () => {
      // Atualização otimista imediata na UI
      setAllActivities((prev) => prev.filter((a) => a.id !== taskId));
      closeTaskModal();
      showToast('Tarefa excluída');

      if (t._fbId) {
        getSharedDoc('activities', t._fbId)
          .delete()
          .catch((e) => {
            console.error('[Firestore] Erro ao excluir tarefa:', e);
            // Rollback
            setAllActivities((prev) => [...prev, t]);
            showToast('Erro ao excluir tarefa no servidor.', 'error');
          });
        db.collection('activities').doc(t._fbId).delete().catch(() => {});
      }
    });
  }, [isAdmin, getTask, showConfirm, closeTaskModal, showToast, getSharedDoc]);

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

    setAllActivities((prev) =>
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
        await getSharedDoc('activities', task._fbId).update({
          stage: newStage,
          progress: updatedProgress,
          concluidoEm: updatedConcluidoEm
        });
        db.collection('activities').doc(task._fbId).set({
          stage: newStage,
          progress: updatedProgress,
          concluidoEm: updatedConcluidoEm
        }, { merge: true }).catch(() => {});
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
          const ref = getSharedDoc('activities', act._fbId);
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

  const saveCategory = ({ id, nome, cor }) => {
    try {
      if (id) {
        const c = categories.find((x) => x.id === id);
        if (c) {
          // Atualização otimista imediata na UI
          setCategories((prev) => prev.map((x) => (x.id === id ? { ...x, nome, cor } : x)));
          closeCategoryModal();
          showToast('Categoria atualizada');

          if (c._fbId) {
            getSharedDoc('categories', c._fbId)
              .update({ nome, cor })
              .catch((e) => {
                console.error('[Firestore] Erro ao atualizar categoria:', e);
                setCategories((prev) => prev.map((x) => (x.id === id ? c : x)));
                showToast('Erro ao sincronizar categoria.', 'error');
              });
            db.collection('categories').doc(c._fbId).set({ nome, cor }, { merge: true }).catch(() => {});
          }
        }
      } else {
        const nextCatId = categories.length > 0 ? Math.max(...categories.map((c) => c.id || 0)) + 1 : 1;
        const docRef = getSharedCollection('categories').doc();
        const newCat = { id: nextCatId, nome, cor, _fbId: docRef.id };

        // Atualização otimista imediata na UI
        setCategories((prev) => [...prev, newCat]);
        closeCategoryModal();
        showToast('Categoria criada');

        docRef.set({ id: nextCatId, nome, cor }).then(() => {
          db.collection('categories').doc(docRef.id).set({ id: nextCatId, nome, cor }).catch(() => {});
        }).catch((e) => {
          console.error('[Firestore] Erro ao criar categoria:', e);
          setCategories((prev) => prev.filter((x) => x._fbId !== docRef.id));
          showToast('Erro ao salvar categoria no servidor.', 'error');
        });
      }
    } catch (e) {
      console.error(e);
      showToast('Erro ao salvar categoria.', 'error');
    }
  };

  const deleteCategory = useCallback((catId) => {
    if (!isAdmin) {
      showToast('Apenas administradores podem remover categorias.', 'error');
      return;
    }
    const c = categories.find((x) => x.id === catId);
    if (!c || c.id === 1) return;
    showConfirm('Excluir categoria?', 'Tarefas dessa categoria ficarão sem categoria vinculada.', () => {
      // Atualização otimista imediata na UI
      setCategories((prev) => prev.filter((x) => x.id !== catId));
      closeCategoryModal();
      showToast('Categoria removida');

      if (c._fbId) {
        getSharedDoc('categories', c._fbId)
          .delete()
          .catch((e) => {
            console.error('[Firestore] Erro ao remover categoria:', e);
            setCategories((prev) => [...prev, c]);
            showToast('Erro ao remover categoria no servidor.', 'error');
          });
        db.collection('categories').doc(c._fbId).delete().catch(() => {});
      }
    });
  }, [isAdmin, categories, showConfirm, closeCategoryModal, showToast, getSharedDoc]);

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
      setAllActivities(data.activities);
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
        allActivities,
        activities,
        categories,
        projects,
        setProjects,
        createProject,
        allProjectsList,
        view,
        setView,
        theme,
        setTheme,
        toggleTheme,
        accentColor,
        setAccentColor,
        collapsed,
        setCollapsed,
        toggleSidebar,
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
        notifModalOpen,
        setNotifModalOpen,
        openNotifModal,
        closeNotifModal,
        notifications,
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
        loggingIn,
        mobileDrawerOpen,
        setMobileDrawerOpen,
        registeredUsers,
        userProfile,
        userRole,
        isMaster,
        isAdmin,
        userLevelInfo,
        USER_ROLES,
        MASTER_ADMIN_EMAIL,
        updateUserRole,
        addTeamMember,
        updateTeamMember,
        deleteTeamMember,
        signInWithEmail,
        sendPasswordReset,
        changePassword,
        mustChangePasswordPrompt,
        setMustChangePasswordPrompt
      }}
    >
      {children}
    </HubContext.Provider>
  );
}

export function useHub() {
  return useContext(HubContext);
}

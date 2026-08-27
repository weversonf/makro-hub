/* ============================================================ */
/* FIREBASE INIT                                                */
/* ============================================================ */
var firebaseConfig = {
  apiKey: "AIzaSyCGemp_OA8savCmLZfX7Us0nmDpdbpv4N0",
  authDomain: "mytasks-saturday.firebaseapp.com",
  projectId: "mytasks-saturday",
  storageBucket: "mytasks-saturday.firebasestorage.app",
  messagingSenderId: "647554172397",
  appId: "1:647554172397:web:aac3ef00938ee7cd8f13e4"
};
var _db = null, _auth = null, _storage = null, _googleProvider = null;
var _firebaseReady = false;
var _authPersistenceReady = Promise.resolve();
var _activeUser = null;
var _firebaseProtocolOk = /^(https?:|chrome-extension:)$/.test(window.location.protocol);
if (_firebaseProtocolOk) {
  try {
    if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(firebaseConfig);
    _db = firebase.firestore();
    _auth = firebase.auth();
    _storage = firebase.storage();
    _googleProvider = new firebase.auth.GoogleAuthProvider();
    _authPersistenceReady = _auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(function (e) {
      console.warn('Persistência LOCAL indisponível; usando sessão em memória:', e);
      return _auth.setPersistence(firebase.auth.Auth.Persistence.NONE).catch(function (fallbackError) {
        console.warn('Persistência do Firebase indisponível:', fallbackError);
      });
    });
    _firebaseReady = true;
  } catch (err) {
    console.warn('Firebase init error:', err);
  }
} else {
  console.log('Modo local detectado: Firebase desativado.');
}

var fb = {
  db: _db,
  collection: function (_, path) { return _db.collection(path); },
  addDoc: function (collRef, data) { return collRef.add(data); },
  getDocs: function (collRef) { return collRef.get(); },
  updateDoc: function (docRef, data) { return docRef.update(data); },
  deleteDoc: function (docRef) { return docRef.delete(); },
  doc: function (_, path) { return _db.doc(path); },
  onSnapshot: function (ref, cb) { return ref.onSnapshot(cb); },
  query: function (ref) { return ref; },
  auth: _auth,
  googleProvider: _googleProvider
};

function userPath(path) {
  var currentUser = _activeUser || (_auth && _auth.currentUser);
  var uid = currentUser ? currentUser.uid : null;
  if (!uid || !_db) return fb.collection(fb.db, path);
  var ref = fb.db.collection('users').doc(uid);
  if (path) return ref.collection(path);
  return ref;
}
function userDoc(collectionName, docId) {
  return userPath(collectionName).doc(docId);
}

/* ============================================================ */
/* CONFIG / CONSTANTES                                          */
/* ============================================================ */
var THEME_KEY = 'ax:theme';

var STAGES = [
  { id: 'afazer',    label: 'A Fazer',     color: 'var(--ax-text-muted)', tone: 'neutral' },
  { id: 'execucao',  label: 'Em Execução', color: 'var(--ax-viz-cyan)',   tone: 'info' },
  { id: 'espera',    label: 'Em Espera',   color: 'var(--ax-viz-amber)',  tone: 'warning' },
  { id: 'validando', label: 'Validando',   color: 'var(--ax-viz-violet)', tone: 'violet' },
  { id: 'concluido', label: 'Concluído',   color: 'var(--ax-viz-emerald)',tone: 'success' }
];
var STAGE_IDS = STAGES.map(function (s) { return s.id; });

var PRIOS = {
  baixa:  { label: 'Baixa',  color: 'var(--ax-text-subtle)' },
  media:  { label: 'Média',  color: 'var(--ax-warning-500)' },
  alta:   { label: 'Alta',   color: 'var(--ax-danger-500)' },
  urgente:{ label: 'Urgente',color: 'var(--ax-danger-500)' }
};

var CANAIS = [
  { id: 'ig',     label: 'Instagram', color: '#E1306C' },
  { id: 'fb',     label: 'Facebook',  color: '#1877F2' },
  { id: 'li',     label: 'LinkedIn',  color: '#0A66C2' },
  { id: 'site',   label: 'Site',      color: '#3B82F6' },
  { id: 'materia',label: 'Blog',      color: '#8B5CF6' }
];

var SWATCHES = ['#0EA5C4', '#3B82F6', '#8B5CF6', '#E1306C', '#F59E0B', '#10B981', '#ED1C24', '#64748B'];

var DEFAULT_CATS = [
  { id: 1, nome: 'Editorial',      cor: '#3B82F6' },
  { id: 2, nome: 'Administrativo', cor: '#F59E0B' },
  { id: 3, nome: 'Design',         cor: '#8B5CF6' },
  { id: 4, nome: 'Cliente XYZ',    cor: '#0EA5C4' }
];

/* ============================================================ */
/* ESTADO                                                       */
/* ============================================================ */
var S = {
  activities: [],
  categories: [],
  nextId: 1,
  nextCatId: 1,
  view: 'dash',
  listStage: ['all'],
  listCat: 'all',
  listQ: '',
  listMode: 'table',
  showConcluidoKanban: false,
  listOverdueOnly: false,
  editId: null,
  draftChecklist: [],
  draftImages: [],
  tab: 'detalhes',
  _initDone: false
};
var dragId = null;
var dragOverCol = null;

/* ============================================================ */
/* FIREBASE SYNC                                                */
/* ============================================================ */
function initDefaultCategories() {
  var promises = [];
  for (var i = 0; i < DEFAULT_CATS.length; i++) {
    promises.push(fb.addDoc(userPath('categories'), DEFAULT_CATS[i]));
  }
  return Promise.all(promises);
}

function firebaseSync() {
  var actsLoaded = false, catsLoaded = false;
  function checkBoth() {
    if (actsLoaded && catsLoaded && !S._initDone) {
      S._initDone = true;
      if (S.categories.length === 0) {
        initDefaultCategories().then(function () { loadComplete(); });
      } else if (!S.categories.some(function (category) { return Number(category.id) === 1; })) {
        fb.addDoc(userPath('categories'), DEFAULT_CATS[0]).then(function (doc) {
          S.categories.push(Object.assign({}, DEFAULT_CATS[0], { _fbId: doc.id }));
          S.nextCatId = Math.max(S.nextCatId, 2);
          loadComplete();
        }).catch(function (error) {
          console.error('Não foi possível criar a categoria Editorial:', error);
          loadComplete();
        });
      } else {
        loadComplete();
      }
    }
  }
  fb.onSnapshot(userPath('activities'), function (actSnap) {
    S.activities = [];
    actSnap.forEach(function (d) {
      var a = d.data();
      a._fbId = d.id;
      S.activities.push(a);
    });
    if (S.activities.length) S.nextId = Math.max.apply(null, S.activities.map(function (a) { return a.id || 0; })) + 1;
    actsLoaded = true;
    checkBoth();
    if (S._initDone) { updateNavBadges(); if (S.view === 'dash') renderDashboard(); if (S.view === 'lista') renderLista(); if (S.view === 'editorial') renderCalendario(); if (S.view === 'categorias') renderCategorias(); }
  });

  fb.onSnapshot(userPath('categories'), function (catSnap) {
    S.categories = [];
    catSnap.forEach(function (d) {
      S.categories.push(Object.assign({}, d.data(), { _fbId: d.id }));
    });
    if (S.categories.length) {
      S.nextCatId = Math.max.apply(null, S.categories.map(function (c) { return c.id || 0; })) + 1;
    }
    catsLoaded = true;
    checkBoth();
    if (S._initDone) renderAllFilters();
  });

  /* safety: se Firebase travar, carrega fallback em 5s */
  setTimeout(function () {
    if (!S._initDone) {
      S._initDone = true;
      loadLocalFallbackSilent();
      loadComplete();
    }
  }, 5000);
}

function loadLocalFallbackSilent() {
  var LS_KEY = 'makro_tasks_cache';
  try {
    var raw = localStorage.getItem(LS_KEY);
    if (raw) {
      var d = JSON.parse(raw);
      if (d && Array.isArray(d.activities) && d.activities.length > 0) {
        S.activities = d.activities;
        S.categories = d.categories || [];
        S.nextId = d.nextId || 1;
        S.nextCatId = d.nextCatId || 1;
        return;
      }
    }
  } catch(e) {}
  /* seed mínimo */
  S.categories = [
    { id:1, nome:'Editorial', cor:'#3B82F6' },
    { id:2, nome:'Administrativo', cor:'#F59E0B' },
    { id:3, nome:'Design', cor:'#8B5CF6' }
  ];
  S.activities = [];
  S.nextId = 1; S.nextCatId = 10;
}

function loadComplete() {
  var loader = document.getElementById('ax-loader');
  setTimeout(function () { loader.classList.add('ax-loader--hidden'); }, 200);
  setTimeout(function () { loader.remove(); }, 1000);
  changeView('dash');
}

/* ============================================================ */
/* AUTH GATE                                                    */
/* ============================================================ */
function showAuthError(message) {
  var authError = document.getElementById('auth-error');
  if (!authError) return;
  authError.textContent = message || '';
  authError.classList.toggle('hidden', !message);
}

function showAppForUser(user) {
  if (!user) return;
  _activeUser = user;
  var authGate = document.getElementById('auth-gate');
  var authLoading = document.getElementById('auth-loading');
  var appView = document.getElementById('app-view');
  if (authLoading) authLoading.style.display = 'none';
  if (authGate) authGate.style.display = 'none';
  if (appView) {
    appView.classList.remove('hidden');
    appView.style.display = '';
  }
  showAuthError('');
  updateUserUI(user);
  if (!window._tarefasInit) {
    window._tarefasInit = true;
    firebaseSync();
  }
}

function showLogin(message) {
  var authGate = document.getElementById('auth-gate');
  var authLoading = document.getElementById('auth-loading');
  var authMain = document.getElementById('auth-main');
  var appView = document.getElementById('app-view');
  if (authLoading) authLoading.style.display = 'none';
  if (authGate) authGate.style.display = '';
  if (authMain) authMain.style.display = '';
  if (appView) {
    appView.classList.add('hidden');
    appView.style.display = 'none';
  }
  if (message) showAuthError(message);
}

function loginWithGoogle() {
  if (!_auth || !_googleProvider) {
    showAuthError('Firebase não está disponível. Abra o site usando http ou https.');
    return;
  }
  var btn = document.getElementById('btn-google-login');
  if (window._googleLoginInProgress) return;
  window._googleLoginInProgress = true;
  if (btn) {
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
    btn.style.opacity = '.65';
  }
  showAuthError('Abrindo o login do Google...');

  /* Importante: o popup precisa ser chamado diretamente dentro do clique.
     Se ficar depois de um .then(), o navegador pode bloqueá-lo por perder
     a ativação do usuário. */
  var signInPromise;
  try {
    signInPromise = _auth.signInWithPopup(_googleProvider);
  } catch (e) {
    signInPromise = Promise.reject(e);
  }
  Promise.resolve(signInPromise)
    .then(function (result) {
      if (result && result.user) showAppForUser(result.user);
    })
    .catch(function (e) {
      if (e && e.code === 'auth/popup-closed-by-user') {
        showAuthError('A janela de login foi fechada. Clique novamente para tentar.');
        return;
      }
      console.error('Google login error:', e);
      var message = e && e.message ? e.message : 'tente novamente.';
      if (e && e.code === 'auth/popup-blocked') {
        message = 'O navegador bloqueou a janela do Google. Permita pop-ups para este site e tente novamente.';
      }
      showLogin('Erro ao entrar com Google: ' + message);
    })
    .then(function () {
      window._googleLoginInProgress = false;
      if (btn) {
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
        btn.style.opacity = '';
      }
    });
}

function updateUserUI(user) {
  var avatar = document.getElementById('sidebar-avatar');
  var fbAvatar = document.getElementById('sidebar-avatar-fb');
  var nameEl = document.getElementById('sidebar-name');
  var emailEl = document.getElementById('sidebar-email');
  if (user) {
    nameEl.textContent = user.displayName || 'Usuário';
    emailEl.textContent = user.email || '';
    if (user.photoURL) {
      avatar.src = user.photoURL;
      avatar.style.display = '';
      fbAvatar.style.display = 'none';
    } else {
      avatar.style.display = 'none';
      fbAvatar.style.display = '';
      fbAvatar.textContent = initials(user.displayName || user.email || '??');
    }
  }
}

function signOut() {
  _activeUser = null;
  window._tarefasInit = false;
  S._initDone = false;
  S.activities = [];
  S.categories = [];
  if (_auth) _auth.signOut().catch(function (e) { console.warn('Logout:', e); });
}

function toggleMobileSidebar() {
  var sb = document.getElementById('ax-sidebar');
  var ov = document.getElementById('sidebar-overlay');
  sb.classList.toggle('ax-sidebar--open');
  if (ov) ov.style.display = sb.classList.contains('ax-sidebar--open') ? 'block' : 'none';
}
function closeMobileSidebar() {
  var sb = document.getElementById('ax-sidebar');
  var ov = document.getElementById('sidebar-overlay');
  if (sb) sb.classList.remove('ax-sidebar--open');
  if (ov) ov.style.display = 'none';
}

/* ============================================================ */
/* ÍCONES                                                       */
/* ============================================================ */
var ICONS = {
  calendar: '<path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12"/><path d="M16 3l0 4"/><path d="M8 3l0 4"/><path d="M4 11l16 0"/>',
  clock:   '<path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/><path d="M12 7l0 5l3 3"/>',
  check:   '<path d="M5 12l5 5l10 -10"/>',
  checklist: '<path d="M9.615 20h-2.615a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8"/><path d="M14 19l2 2l4 -4"/><path d="M9 8h4"/><path d="M9 12h2"/>',
  tag:     '<path d="M7 7m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M3 3l4 0l11 11a2 2 0 0 1 0 2.8l-3.2 3.2a2 2 0 0 1 -2.8 0l-11 -11l0 -6z"/>',
  folder:  '<path d="M3 6a2 2 0 0 1 2 -2h4l3 3h7a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z"/>',
  flag:    '<path d="M5 21l0 -17"/><path d="M5 8l15 0l-4 4l4 4l-15 0"/>',
  alert:   '<path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0"/><path d="M12 9v4"/><path d="M12 16h.01"/>',
  chart:   '<path d="M3 3l0 16a2 2 0 0 0 2 2h16"/><path d="M7 15l4 -4l4 2l5 -7"/>',
  list:    '<path d="M9 6l11 0"/><path d="M9 12l11 0"/><path d="M9 18l11 0"/><path d="M5 6l0 .01"/><path d="M5 12l0 .01"/><path d="M5 18l0 .01"/>',
  user:    '<path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0"/><path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4l0 1"/>',
  pencil:  '<path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5l-1 4z"/>',
  trash:   '<path d="M4 7l16 0"/><path d="M10 11l0 6"/><path d="M14 11l0 6"/><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"/><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"/>',
  send:    '<path d="M10 14l11 -11"/><path d="M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1z"/>',
  refresh: '<path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4"/><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"/>',
  spark:   '<path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3l5.8 1.9l-5.8 1.9a2 2 0 0 0 -1.3 1.3l-1.9 5.8l-1.9 -5.8a2 2 0 0 0 -1.3 -1.3l-5.8 -1.9l5.8 -1.9a2 2 0 0 0 1.3 -1.3z"/>'
};

function ico(name, size) {
  size = size || 18;
  return '<svg class="ax-icon" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
}

/* ============================================================ */
/* HELPERS                                                      */
/* ============================================================ */
function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function todayISO() {
  var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function addDaysISO(iso, days) {
  var d = new Date(iso + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
function fmtDate(iso) {
  if (!iso) return '—';
  var p = String(iso).split('-');
  if (p.length !== 3) return iso;
  return p[2] + '/' + p[1];
}
function isOverdue(a) {
  return a.stage !== 'concluido' && a.dataVencimento && a.dataVencimento < todayISO();
}
function catOf(id) {
  for (var i = 0; i < S.categories.length; i++) if (S.categories[i].id === id) return S.categories[i];
  return null;
}
function stageOf(id) {
  for (var i = 0; i < STAGES.length; i++) if (STAGES[i].id === id) return STAGES[i];
  return STAGES[0];
}
function toast(msg, type) {
  var c = document.getElementById('toast-container');
  var el = document.createElement('div');
  el.className = 'ax-toast ax-toast--' + (type || 'success');
  el.innerHTML = '<svg class="ax-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:' + ((type === 'error') ? 'var(--ax-danger-500)' : 'var(--ax-success-500)') + '">' + ((type === 'error') ? '<path d="M12 9v4"/><path d="M12 16h.01"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0"/>' : '<path d="M9 11l3 3l8 -8"/><path d="M20 12v6a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h9"/>') + '</svg>' + esc(msg);
  c.appendChild(el);
  setTimeout(function () { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; }, 2600);
  setTimeout(function () { el.remove(); }, 3000);
}
function relativeDue(iso) {
  if (!iso) return 'Sem prazo';
  var t = todayISO();
  if (iso < t) { var d = diffDays(t, iso); return 'Atrasada ' + d + 'd'; }
  if (iso === t) return 'Vence hoje';
  var dt = diffDays(iso, t);
  return 'Em ' + dt + 'd';
}
function diffDays(a, b) {
  var da = new Date(a + 'T12:00:00'), db = new Date(b + 'T12:00:00');
  return Math.round((da - db) / 86400000);
}
function initials(str) {
  var parts = String(str || '').trim().split(/\s+/);
  if (!parts[0]) return '?';
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

/* ============================================================ */
/* NAVEGAÇÃO                                                    */
/* ============================================================ */
var VIEW_META = {
  dash:       { title: 'Dashboard',          crumb: ['Projetos', 'Dashboard'] },
  lista:      { title: 'Tarefas',            crumb: ['Atividades', 'Lista de Tarefas'] },
  editorial:  { title: 'Calendário Editorial', crumb: ['Editorial', 'Calendário'] },
  'banco-horas': { title: 'Banco de Horas', crumb: ['Ferramentas', 'Banco de Horas'] },
  nps:        { title: 'Pesquisa NPS',       crumb: ['Ferramentas', 'NPS'] },
  categorias: { title: 'Categorias',         crumb: ['Gerenciar', 'Categorias'] },
  config:     { title: 'Configurações',      crumb: ['Gerenciar', 'Configurações'] }
};

function changeView(v) {
  closeTaskModal();
  S.view = v;
  var navs = document.querySelectorAll('.is-nav');
  for (var i = 0; i < navs.length; i++) {
    navs[i].classList.toggle('ax-nav__item--active', navs[i].getAttribute('data-view') === v);
  }
  var views = document.querySelectorAll('.ax-view');
  for (var j = 0; j < views.length; j++) {
    views[j].classList.toggle('is-active', views[j].id === 'view-' + v);
  }
  /* Mobile bottom nav */
  var mobItems = document.querySelectorAll('.mob-nav__item');
  for (var mi = 0; mi < mobItems.length; mi++) {
    mobItems[mi].classList.toggle('mob-nav__item--active', mobItems[mi].getAttribute('data-mob') === v);
  }
  /* FAB visível só em views relevantes */
  var fab = document.getElementById('btn-fab');
  if (fab) fab.style.display = (v === 'dash' || v === 'lista' || v === 'editorial') ? '' : 'none';
  /* Esconde containers React quando não em uso */
  var bh = document.getElementById('banco-horas-root');
  var np = document.getElementById('nps-root');
  var main = document.getElementById('ax-main');
  if (bh) bh.style.display = v === 'banco-horas' ? '' : 'none';
  if (np) np.style.display = v === 'nps' ? '' : 'none';
  if (main) main.style.display = (v === 'banco-horas' || v === 'nps') ? 'none' : '';
  updatePageHead();
  if (v === 'dash') renderDashboard();
  if (v === 'lista') renderLista();
  if (v === 'editorial') renderCalendario();
  if (v === 'banco-horas') renderBancoHoras();
  if (v === 'nps') renderNPS();
  if (v === 'categorias') renderCategorias();
  if (v === 'config') renderConfig();
  document.getElementById('ax-main').scrollTop = 0;
}

function updatePageHead() {
  var m = VIEW_META[S.view] || { title: '', crumb: [], subtitle: '' };
  document.getElementById('ph-title').textContent = m.title;

  var activeActivities = S.activities.filter(function (a) { return typeof isEditorialActivity === 'function' ? !isEditorialActivity(a) : a.categoria !== 1; });
  var total = activeActivities.length;
  var done = activeActivities.filter(function (a) { return a.stage === 'concluido'; }).length;
  var pend = total - done;
  var rate = total ? Math.round(done / total * 100) : 0;
  var sub = document.getElementById('ph-subtitle');
  if (S.view === 'dash') {
    sub.innerHTML = '<span class="ax-num">' + total + '</span> tarefas · <span class="ax-num">' + (total - done) + '</span> pendentes · <span class="ax-num">' + rate + '%</span> concluídas.';
  } else if (S.view === 'lista') {
    var nonEd = S.activities.filter(function (a) { return typeof isEditorialActivity === 'function' ? !isEditorialActivity(a) : a.categoria !== 1; });
    var f = filteredTasks().length;
    if (S.listOverdueOnly) {
      sub.innerHTML = '<span class="ax-num" style="color:var(--ax-danger-500)">' + f + '</span> tarefas atrasadas · <button class="ax-btn ax-btn--link ax-btn--sm" onclick="S.listOverdueOnly=false;renderAll();" style="font-size:var(--ax-text-xs);">limpar filtro</button>';
    } else {
      sub.innerHTML = '<span class="ax-num">' + f + '</span> exibidas de <span class="ax-num">' + nonEd.length + '</span> tarefas.';
    }
  } else if (S.view === 'editorial') {
    var ed = countCat(1);
    sub.innerHTML = '<span class="ax-num">' + ed + '</span> atividades · calendário de publicações.';
  } else if (S.view === 'categorias') {
    sub.innerHTML = '<span class="ax-num">' + S.categories.length + '</span> áreas · cores usadas em todo o painel.';
  } else {
    sub.textContent = '';
  }

  var actions = document.getElementById('ph-actions');
  var btn;
  if (S.view === 'dash') {
    actions.innerHTML = '<button class="ax-btn ax-btn--secondary ax-btn--pill" onclick="exportBackup()"><svg class="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15l0 -10"/><path d="M7 8l5 -5l5 5"/><path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1 -1v-3"/></svg><span class="ax-btn__label">Exportar</span></button>';
  } else if (S.view === 'lista') {
    actions.innerHTML = '';
  } else if (S.view === 'categorias') {
    actions.innerHTML = '<button class="ax-btn ax-btn--primary" onclick="openCategoryModal()"><svg class="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5l0 14"/><path d="M5 12l14 0"/></svg><span class="ax-btn__label">Nova categoria</span></button>';
  } else if (S.view === 'editorial') {
    actions.innerHTML = '<button class="ax-btn ax-btn--primary" onclick="openNewTask(\'afazer\', true)"><svg class="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5l0 14"/><path d="M5 12l14 0"/></svg><span class="ax-btn__label">Nova tarefa editorial</span></button>';
  } else {
    actions.innerHTML = '';
  }
}

function countStage(id) {
  var n = 0;
  for (var i = 0; i < S.activities.length; i++) if (S.activities[i].stage === id) n++;
  return n;
}
function countCat(id) {
  var n = 0;
  for (var i = 0; i < S.activities.length; i++) if (S.activities[i].categoria === id) n++;
  return n;
}
function getTask(id) {
  for (var i = 0; i < S.activities.length; i++) if (S.activities[i].id === id) return S.activities[i];
  return null;
}
function clone(a) { return JSON.parse(JSON.stringify(a)); }

/* ============================================================ */
/* DASHBOARD                                                    */
/* ============================================================ */
function renderDashboard() {
  var el = document.getElementById('dash-content');
  /* Exclui Editorial de todas as métricas do dashboard */
  var dashActs = S.activities.filter(function (a) { return typeof isEditorialActivity === 'function' ? !isEditorialActivity(a) : a.categoria !== 1; });
  var total = dashActs.length;
  var done = dashActs.filter(function (a) { return a.stage === 'concluido'; }).length;
  var exec = dashActs.filter(function (a) { return a.stage === 'execucao'; }).length;
  var rate = total ? Math.round(done / total * 100) : 0;
  var atrasadas = 0;
  for (var i = 0; i < dashActs.length; i++) if (isOverdue(dashActs[i])) atrasadas++;

  function stat(icon, iconColor, num, label, delta) {
    return '<div class="ax-card ax-col--3" role="region">' +
      '<div class="ax-card__body" style="display:flex;align-items:center;gap:var(--ax-space-4);">' +
        '<span class="ax-avatar ax-avatar--md ax-avatar--squircle" style="background:color-mix(in oklab,' + iconColor + ' 18%,transparent);color:' + iconColor + ';flex:none;"><svg class="ax-avatar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">' + icon + '</svg></span>' +
        '<div><div class="ax-num" style="font-family:var(--ax-font-display);font-size:var(--ax-text-xl);font-weight:700;color:var(--ax-text-strong);line-height:1.1;">' + num + '</div>' +
        '<div style="font-size:var(--ax-text-xs);color:var(--ax-text-muted);">' + label + '</div>' +
        (delta ? '<div style="font-size:var(--ax-text-2xs);color:var(--ax-text-subtle);margin-top:2px;">' + delta + '</div>' : '') +
      '</div></div></div>';
  }

  var kpis = stat(ICONS.list, 'var(--ax-viz-cyan)', total, 'Tarefas totais', 'ativas neste quadro') +
             stat(ICONS.spark, 'var(--ax-viz-amber)', exec, 'Em execução', 'em andamento agora') +
             stat('<path d="M9 11l3 3l8 -8"/>', 'var(--ax-viz-emerald)', done, 'Concluídas', 'tarefas fechadas') +
             stat(ICONS.chart, 'var(--ax-viz-violet)', rate + '%', 'Taxa de conclusão', atrasadas ? '<a href="javascript:void(0)" onclick="S.listOverdueOnly=true;changeView(\'lista\')" style="color:var(--ax-danger-500);text-decoration:underline;">' + atrasadas + ' atrasadas</a>' : 'tudo em dia ✓');

  /* throughput - por tipo de demanda (categoria) */
  var nonEdCats = S.categories.filter(function (c) { return c.id !== 1; });
  var maxCat = 1;
  for (var ct = 0; ct < nonEdCats.length; ct++) {
    var cid = nonEdCats[ct].id;
    var total = dashActs.filter(function (a) { return a.categoria === cid; }).length;
    maxCat = Math.max(maxCat, total);
  }

  var sparkHTML = '<div style="display:flex;flex-direction:column;gap:10px;">';
  for (var ct2 = 0; ct2 < nonEdCats.length; ct2++) {
    var catId = nonEdCats[ct2].id;
    var catTasks = dashActs.filter(function (a) { return a.categoria === catId; });
    var catDone = catTasks.filter(function (a) { return a.stage === 'concluido'; }).length;
    var catProgress = catTasks.length - catDone;
    var barW = maxCat > 0 ? Math.round(catTasks.length / maxCat * 100) : 0;
    var progressPct = catTasks.length > 0 ? Math.round(catProgress / catTasks.length * 100) : 0;

    sparkHTML += '<div style="display:flex;align-items:center;gap:10px;">' +
      '<span style="width:100px;font-size:var(--ax-text-xs);color:var(--ax-text-strong);font-weight:600;text-align:right;flex:none;" class="ax-text-truncate">' + esc(nonEdCats[ct2].nome) + '</span>' +
      '<div style="flex:1;height:22px;background:var(--ax-surface-subtle);border-radius:var(--ax-radius-sm);overflow:hidden;display:flex;">' +
        (catProgress > 0 ? '<div style="width:' + progressPct + '%;background:var(--ax-viz-amber);display:flex;align-items:center;justify-content:center;transition:width .4s var(--ax-ease-standard);min-width:' + (catProgress > 1 ? '0' : '8px') + ';">' + (progressPct >= 20 ? '<span style="font-family:var(--ax-font-mono);font-size:var(--ax-text-2xs);color:var(--ax-text-strong);font-weight:600;">' + catProgress + '</span>' : '') + '</div>' : '') +
        (catDone > 0 ? '<div style="flex:1;background:var(--ax-viz-emerald);display:flex;align-items:center;justify-content:center;transition:width .4s var(--ax-ease-standard);">' + (progressPct < 80 ? '<span style="font-family:var(--ax-font-mono);font-size:var(--ax-text-2xs);color:var(--ax-text-strong);font-weight:600;">' + catDone + '</span>' : '') + '</div>' : '') +
      '</div>' +
      '<span class="ax-num" style="width:40px;text-align:right;font-family:var(--ax-font-mono);font-size:var(--ax-text-xs);font-weight:700;color:var(--ax-text-muted);">' + catTasks.length + '</span>' +
      '</div>';
  }
  if (sparkHTML === '<div style="display:flex;flex-direction:column;gap:10px;">') {
    sparkHTML += '<div style="color:var(--ax-text-subtle);font-size:var(--ax-text-sm);padding:8px 0;">Sem dados de demanda.</div>';
  }
  sparkHTML += '</div>';

  var legend = '<div class="ax-legend"><span class="key"><span class="sw" style="background:var(--ax-viz-amber)"></span> Em andamento</span><span class="key"><span class="sw" style="background:var(--ax-viz-emerald)"></span> Concluídas</span></div>';

  /* status distribution */
  var statusData = [];
  for (var d = 0; d < STAGES.length; d++) {
    var c = dashActs.filter(function (a) { return a.stage === STAGES[d].id; }).length;
    statusData.push({ label: STAGES[d].label, color: STAGES[d].color, count: c, tone: STAGES[d].tone });
  }
  statusData = statusData.filter(function (x) { return x.count > 0; });
  if (statusData.length === 0) statusData = [{ label: 'Sem dados', color: 'var(--ax-text-subtle)', count: 1, tone: 'neutral' }];
  var totalStatus = statusData.reduce(function (s, x) { return s + x.count; }, 0);

  /* Doughnut chart SVG */
  var R = 70, C = 2 * Math.PI * R, gap = 3;
  var doughnutSvg = '<div style="position:relative;width:180px;height:180px;margin:0 auto 12px;"><svg viewBox="0 0 180 180" width="180" height="180" style="transform:rotate(-90deg)">';
  var currentAngle = 0;
  for (var ds = 0; ds < statusData.length; ds++) {
    var slice = statusData[ds];
    var portion = slice.count / totalStatus;
    var dashLen = portion * C - gap;
    var offset = C - currentAngle * C / (2 * Math.PI);
    doughnutSvg += '<circle cx="90" cy="90" r="' + R + '" fill="none" stroke="' + slice.color + '" stroke-width="24" stroke-dasharray="' + Math.max(0, dashLen) + ' ' + (C - dashLen) + '" stroke-dashoffset="' + offset + '" stroke-linecap="butt" opacity=".9"/>';
    currentAngle += portion * 2 * Math.PI;
  }
  doughnutSvg += '</svg><div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none;">' +
    '<span style="font-family:var(--ax-font-display);font-size:var(--ax-text-xl);font-weight:700;color:var(--ax-text-strong);">' + totalStatus + '</span>' +
    '<span style="font-size:var(--ax-text-2xs);color:var(--ax-text-subtle);">tarefas</span></div></div>';

  /* Legend below */
  var distHTML = '<div style="display:flex;flex-wrap:wrap;gap:6px 12px;justify-content:center;">';
  for (var d = 0; d < statusData.length; d++) {
    var sd = statusData[d];
    distHTML += '<span style="display:inline-flex;align-items:center;gap:5px;font-size:var(--ax-text-xs);color:var(--ax-text-muted);">' +
      '<span style="width:8px;height:8px;border-radius:2px;background:' + sd.color + ';flex:none;"></span>' +
      sd.label + ' <b class="ax-num" style="font-size:var(--ax-text-xs);color:var(--ax-text-strong);">' + sd.count + '</b></span>';
  }
  distHTML += '</div>';

  /* próximos vencimentos */
  var upcoming = dashActs.filter(function (a) { return a.stage !== 'concluido' && a.dataVencimento; })
    .sort(function (a, b) { return a.dataVencimento < b.dataVencimento ? -1 : 1; })
    .slice(0, 6);
  var upHTML = '<div class="ax-list ax-list--flush">';
  if (upcoming.length === 0) upHTML += '<div style="color:var(--ax-text-subtle);font-size:var(--ax-text-sm);padding:8px 0;">Nenhum prazo pendente. 🎉</div>';
  for (var u = 0; u < upcoming.length; u++) {
    var a = upcoming[u], sc = stageOf(a.stage);
    var overdue = isOverdue(a);
    upHTML += '<div class="ax-list__row" style="cursor:pointer" onclick="openEditTask(' + a.id + ')">' +
      '<span class="ax-list__leading"><span class="ax-avatar ax-avatar--xs ax-avatar--squircle" style="background:color-mix(in oklab,' + (catOf(a.categoria) && catOf(a.categoria).cor || 'var(--ax-text-muted)') + ' 20%,transparent);color:' + (catOf(a.categoria) ? catOf(a.categoria).cor : 'var(--ax-text-muted)') + ';font-weight:700;">' + esc(initials(a.titulo)) + '</span></span>' +
      '<span class="ax-list__content"><span class="ax-list__title">' + esc(a.titulo) + '</span>' +
      '<span class="ax-list__meta">' + esc(catOf(a.categoria) ? catOf(a.categoria).nome : 'Sem categoria') + ' · ' + fmtDate(a.dataVencimento) + '</span></span>' +
      '<span class="ax-list__trailing"><span class="ax-badge ax-badge--soft ax-badge--' + sc.tone + ' ax-badge--pill">' + esc(sc.label) + '</span>' +
      (overdue ? '<span class="ax-badge ax-badge--soft ax-badge--danger ax-badge--pill" style="font-family:var(--ax-font-mono)">Atrasada</span>' : '') +
      '</span></div>';
  }
  upHTML += '</div>';

  /* tarefas recentes */
  var recent = dashActs.slice().sort(function (x, y) { return (x.criadoEm || '') > (y.criadoEm || '') ? -1 : 1; }).slice(0, 5);
  var recHTML = '<div class="ax-table-wrap"><table class="ax-table ax-table--hover"><thead><tr>' +
    '<th class="ax-table__th">Tarefa</th><th class="ax-table__th">Estágio</th><th class="ax-table__th">Progresso</th><th class="ax-table__th ax-table__th--num">Venc.</th><th class="ax-table__th">Status</th></tr></thead><tbody>';
  for (var r = 0; r < recent.length; r++) {
    var ra = recent[r], rc = stageOf(ra.stage);
    recHTML += '<tr class="row-click" onclick="openEditTask(' + ra.id + ')">' +
      '<td><div style="display:flex;align-items:center;gap:10px;"><span class="ax-avatar ax-avatar--xs ax-avatar--squircle" style="background:color-mix(in oklab,' + (catOf(ra.categoria) && catOf(ra.categoria).cor || 'var(--ax-text-muted)') + ' 20%,transparent);color:' + (catOf(ra.categoria) ? catOf(ra.categoria).cor : 'var(--ax-text-muted)') + ';font-weight:700;">' + esc(initials(ra.titulo)) + '</span><div><div class="ax-strong" style="font-size:var(--ax-text-sm)">' + esc(ra.titulo) + '</div><div style="font-size:var(--ax-text-xs);color:var(--ax-text-subtle);">' + esc(catOf(ra.categoria) ? catOf(ra.categoria).nome : '') + '</div></div></div></td>' +
      '<td><span class="ax-badge ax-badge--soft ax-badge--' + rc.tone + ' ax-badge--pill"><span class="ax-badge__dot"></span>' + esc(rc.label) + '</span></td>' +
      '<td><div class="progress-inline" style="min-width:110px;"><div class="ax-progress ax-progress--sm" style="flex:1"><div class="ax-progress__track"><div class="ax-progress__fill" style="width:' + ra.progress + '%;background:' + progColor(ra.progress) + '"></div></div></div><span class="pct">' + ra.progress + '%</span></div></td>' +
      '<td class="ax-num" style="' + (isOverdue(ra) ? 'color:var(--ax-danger-500)' : '') + '">' + fmtDate(ra.dataVencimento) + '</td>' +
      '<td>' + (isOverdue(ra) ? '<span class="ax-badge ax-badge--soft ax-badge--danger ax-badge--sm ax-badge--pill">Atrasada</span>' : '<span class="ax-badge ax-badge--soft ax-badge--success ax-badge--sm ax-badge--pill">Em dia</span>') + '</td></tr>';
  }
  recHTML += '</tbody></table></div>';

  el.innerHTML =
    /* Row 1: KPIs */
    '<div class="ax-col--12" style="display:grid;grid-template-columns:repeat(12,1fr);gap:var(--ax-space-4);">' + kpis + '</div>' +

    /* Row 2: Throughput por demanda + Status doughnut */
    '<div class="ax-col--8">' +
      '<div class="ax-card" style="height:100%"><div class="ax-card__header"><div><h2 class="ax-card__title">Demandas por tipo</h2><p class="ax-card__subtitle">Em andamento vs concluídas</p></div>' + legend + '</div><div class="ax-card__body">' + sparkHTML + '</div></div>' +
    '</div>' +
    '<div class="ax-col--4">' +
      '<div class="ax-card" style="height:100%"><div class="ax-card__header"><div><h2 class="ax-card__title">Status do projeto</h2><p class="ax-card__subtitle">Distribuição por estágio</p></div></div><div class="ax-card__body">' + doughnutSvg + distHTML + '</div></div>' +
    '</div>' +

    /* Row 3: Tarefas recentes + Próximos vencimentos */
    '<div class="ax-col--6">' +
      '<div class="ax-card"><div class="ax-card__header"><div><h2 class="ax-card__title">Tarefas recentes</h2><p class="ax-card__subtitle">Últimas atividades registradas</p></div></div><div class="ax-card__body" style="padding-top:8px;">' + recHTML + '</div></div>' +
    '</div>' +
    '<div class="ax-col--6">' +
      '<div class="ax-card"><div class="ax-card__header"><div><h2 class="ax-card__title">Próximos vencimentos</h2><p class="ax-card__subtitle">Prazos mais próximos</p></div></div><div class="ax-card__body" style="padding-top:4px;">' + upHTML + '</div></div>' +
    '</div>';
  updateNavBadges();
}

function progColor(p) {
  if (p >= 100) return 'var(--ax-success-500)';
  if (p >= 60) return 'var(--ax-viz-cyan)';
  if (p >= 30) return 'var(--ax-viz-amber)';
  return 'var(--ax-danger-500)';
}

/* ============================================================ */
/* LISTA                                                        */
/* ============================================================ */
function filteredTasks() {
  var q = (S.listQ === '__semana__' || S.listQ === '__alta__' ? '' : (S.listQ || '')).toLowerCase();
  var out = [];
  for (var i = 0; i < S.activities.length; i++) {
    var a = S.activities[i];
    if ((typeof isEditorialActivity === 'function' ? isEditorialActivity(a) : a.categoria === 1)) continue; /* Editorial fica só no calendário editorial */
    if (S.listOverdueOnly && !isOverdue(a)) continue; /* Filtro de atrasadas */
    if (S.listQ === '__semana__' && (!a.dataVencimento || diffDays(todayISO(), a.dataVencimento) < 0 || diffDays(todayISO(), a.dataVencimento) > 7)) continue;
    if (S.listQ === '__alta__' && a.prioridade !== 'alta' && a.prioridade !== 'urgente') continue;
    if (S.listStage.indexOf('all') === -1 && S.listStage.indexOf(a.stage) === -1) continue;
    if (S.listCat !== 'all' && a.categoria !== S.listCat) continue;
    if (q) {
      var cat = catOf(a.categoria);
      var hay = (a.titulo + ' ' + (a.descricao || '') + ' ' + (cat ? cat.nome : '')).toLowerCase();
      if (hay.indexOf(q) === -1) continue;
    }
    out.push(a);
  }
  out.sort(function (x, y) {
    var ox = isOverdue(x) ? 1 : 0, oy = isOverdue(y) ? 1 : 0;
    if (ox !== oy) return oy - ox;
    return (x.dataVencimento || '9999-99-99') < (y.dataVencimento || '9999-99-99') ? -1 : 1;
  });
  return out;
}

function renderLista() {
  renderStagePills();
  renderCatPills();
  buildListBody();
}
function renderStagePills() {
  var trigger = document.getElementById('lista-stage-filter');
  var menu = document.getElementById('lista-stage-filter-menu');
  if (!trigger || !menu) return;
  if (!Array.isArray(S.listStage)) S.listStage = S.listStage && S.listStage !== 'all' ? [S.listStage] : ['all'];
  var allSelected = S.listStage.indexOf('all') !== -1;
  var labels = [];
  if (allSelected) labels.push('Todas as etapas');
  for (var i = 0; i < STAGES.length; i++) {
    if (!allSelected && S.listStage.indexOf(STAGES[i].id) !== -1) labels.push(STAGES[i].label);
  }
  trigger.textContent = labels.length > 1 ? labels.length + ' etapas selecionadas' : (labels[0] || 'Todas as etapas');
  trigger.setAttribute('aria-expanded', menu.hidden ? 'false' : 'true');
  var html = '<button type="button" class="ax-multi-select__option" role="option" aria-selected="' + (allSelected ? 'true' : 'false') + '" data-stage-value="all"><input type="checkbox" tabindex="-1"' + (allSelected ? ' checked' : '') + '><span>Todas as etapas (' + S.activities.length + ')</span></button>';
  for (var j = 0; j < STAGES.length; j++) {
    var selected = !allSelected && S.listStage.indexOf(STAGES[j].id) !== -1;
    html += '<button type="button" class="ax-multi-select__option" role="option" aria-selected="' + (selected ? 'true' : 'false') + '" data-stage-value="' + STAGES[j].id + '"><input type="checkbox" tabindex="-1"' + (selected ? ' checked' : '') + '><span>' + esc(STAGES[j].label) + ' (' + countStage(STAGES[j].id) + ')</span></button>';
  }
  menu.innerHTML = html;
  menu.querySelectorAll('[data-stage-value]').forEach(function (option) {
    option.addEventListener('click', function (event) {
      event.stopPropagation();
      var value = option.getAttribute('data-stage-value');
      if (value === 'all') {
        resetListStageFilter();
        return;
      }
      var next = S.listStage.indexOf('all') !== -1 ? [] : S.listStage.slice();
      var idx = next.indexOf(value);
      if (idx === -1) next.push(value); else next.splice(idx, 1);
      setListStage(next.length ? next : ['all']);
    });
  });
}
function toggleStageFilter(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  var trigger = document.getElementById('lista-stage-filter');
  var menu = document.getElementById('lista-stage-filter-menu');
  if (!trigger || !menu) return false;
  var shouldOpen = menu.hidden;
  if (shouldOpen) {
    renderStagePills();
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
  } else {
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  }
  return false;
}
function renderCatPills() {
  var el = document.getElementById('lista-cat-filter');
  if (!el) return;
  var html = '<option value="all"' + (S.listCat === 'all' ? ' selected' : '') + '>Todas as categorias</option>';
  for (var i = 0; i < S.categories.length; i++) {
    if (S.categories[i].id === 1) continue; /* Editorial não aparece em Tarefas */
    html += '<option value="' + S.categories[i].id + '"' + (S.listCat === S.categories[i].id ? ' selected' : '') + '>' + esc(S.categories[i].nome) + '</option>';
  }
  el.innerHTML = html;
}
function resetListStageFilter() {
  S.listStage = ['all'];
  /* "Todas as etapas" deve incluir também Concluído no modo cards. */
  S.showConcluidoKanban = true;
  renderLista();
  updateNavBadges();
  // Mantemos o menu aberto para feedback visual da seleção múltipla, 
  // a menos que o usuário clique fora.
}
function setListStage(s) {
  var next = Array.isArray(s) ? s.slice() : [s];
  next = next.filter(function (value, index) { return value && next.indexOf(value) === index; });
  if (next.indexOf('all') !== -1 || !next.length) {
    resetListStageFilter();
    return;
  }
  S.listStage = next;
  renderLista();
  updateNavBadges();
}
function setListCat(c) { S.listCat = c; renderLista(); updateNavBadges(); }
function setListMode(m) {
  S.listMode = m;
  var opts = document.querySelectorAll('[data-lis-view]');
  for (var i = 0; i < opts.length; i++) opts[i].classList.toggle('is-active', opts[i].getAttribute('data-lis-view') === m);
  buildListBody();
}
function buildListBody() {
  var body = document.getElementById('lista-body');
  var list = filteredTasks();
  var html = '';
  if (S.listMode === 'table') {
    html += '<section class="ax-card"><div class="ax-table-wrap"><table class="ax-table ax-table--hover"><thead><tr>' +
      '<th>Tarefa</th><th>Categoria</th><th>Estágio</th><th class="ax-num">Progresso</th><th class="ax-num">Checklist</th><th class="ax-num">Venc.</th><th>Prioridade</th><th style="width:70px"></th></tr></thead><tbody>';
    if (list.length === 0) {
      html += '<tr><td colspan="8"><div class="ax-empty"><div class="icwrap">' + ico('checklist', 26) + '</div><h3>Nada por aqui</h3><p>Ajuste os filtros ou crie uma nova tarefa.</p></div></td></tr>';
    }
    for (var i = 0; i < list.length; i++) {
      var a = list[i], st = stageOf(a.stage), cat = catOf(a.categoria);
      var prio = PRIOS[a.prioridade] || PRIOS.media;
      var totalCheck = (a.idCheck || []).length;
      var doCheck = totalCheck ? (a.idCheck.filter(function (c) { return c.done; }).length) : 0;
      html += '<tr class="row-click" onclick="openEditTask(' + a.id + ')"><td><div style="display:flex;align-items:center;gap:10px;">' +
        '<span class="ax-avatar ax-avatar--xs ax-avatar--squircle" style="background:color-mix(in oklab,' + (cat && cat.cor || 'var(--ax-text-muted)') + ' 20%,transparent);color:' + (cat ? cat.cor : 'var(--ax-text-muted)') + ';font-weight:700;">' + esc(initials(a.titulo)) + '</span>' +
        '<div><div class="ax-strong">' + esc(a.titulo) + '</div><div style="font-size:var(--ax-text-xs);color:var(--ax-text-subtle);max-width:320px;" class="ax-text-truncate">' + esc(a.descricao || '') + '</div></div></div></td>' +
        '<td><span class="ax-badge ax-badge--soft ax-badge--pill" style="--_b500:' + (cat ? cat.cor : 'var(--ax-text-muted)') + '"><span class="ax-badge__dot"></span>' + esc(cat ? cat.nome : '—') + '</span></td>' +
        '<td><span class="ax-badge ax-badge--soft ax-badge--' + st.tone + ' ax-badge--pill"><span class="ax-badge__dot"></span>' + esc(st.label) + '</span></td>' +
        '<td><div class="progress-inline" style="min-width:100px;"><div class="ax-progress ax-progress--sm" style="flex:1"><div class="ax-progress__track"><div class="ax-progress__fill" style="width:' + a.progress + '%;background:' + progColor(a.progress) + '"></div></div></div><span class="pct">' + a.progress + '%</span></div></td>' +
        '<td class="ax-num" style="color:var(--ax-text-muted)">' + doCheck + '/' + totalCheck + '</td>' +
        '<td class="ax-num"' + (isOverdue(a) ? ' style="color:var(--ax-danger-500);font-weight:600"' : '') + '>' + fmtDate(a.dataVencimento) + '</td>' +
        '<td><span class="ax-badge ax-badge--soft ax-badge--pill" style="--_b500:' + prio.color + '"' + ((a.prioridade === 'alta' || a.prioridade === 'urgente') ? ' title="Alta prioridade"' : '') + '>' + esc(prio.label) + '</span></td>' +
        '<td><div style="display:flex;gap:4px;justify-content:flex-end;">' +
        '<button class="ax-icon-btn" style="width:32px;height:32px;" onclick="event.stopPropagation();openEditTask(' + a.id + ')" title="Editar">' + ico('pencil', 16) + '</button>' +
        '<button class="ax-icon-btn" style="width:32px;height:32px;color:var(--ax-danger-500);" onclick="event.stopPropagation();confirmDeleteTask(' + a.id + ')" title="Excluir">' + ico('trash', 16) + '</button>' +
        '</div></td></tr>';
    }
    html += '</tbody></table></div></section>';
  } else {
    /* modo cards = quadro por estágio */
    var bcols = (S.listStage.indexOf('all') !== -1) ? STAGES : STAGES.filter(function (s) { return S.listStage.indexOf(s.id) !== -1; });
    /* Oculta Concluído por padrão */
    if (S.listStage.indexOf('all') !== -1 && !S.showConcluidoKanban) {
      bcols = bcols.filter(function (s) { return s.id !== 'concluido'; });
    }
    var anyCard = false;
    html += '<div class="ax-pl-board" style="width:100%;">';
    for (var bc = 0; bc < bcols.length; bc++) {
      var bcol = bcols[bc];
      var bcards = S.activities.filter(function (a) { return a.stage === bcol.id; });
      bcards = applyKanbanFilters(bcards);
      if (bcards.length) anyCard = true;
      var btotal = 0;
      bcards.forEach(function (a) {
        var progress = Number(a.progress);
        if (!isFinite(progress)) progress = 0;
        btotal += Math.max(0, Math.min(100, progress));
      });
      var bavg = bcards.length ? Math.round(btotal / bcards.length) : 0;
      html += '<section class="ax-pl-col' + (dragOverCol === bcol.id ? ' ax-pl-col--over' : '') + '" id="kc_' + bcol.id + '" role="region" aria-label="' + esc(bcol.label) + '" ' +
        'ondragover="event.preventDefault();dragOverCol=\'' + bcol.id + '\';this.classList.add(\'ax-pl-col--over\')" ' +
        'ondragleave="dragOverCol=null;this.classList.remove(\'ax-pl-col--over\')" ' +
        'ondrop="handleDrop(event,\'' + bcol.id + '\')">' +
        '<div class="ax-pl-col__head"><div class="ax-pl-col__title-row"><div class="ax-pl-col__title">' +
          '<span class="ax-pl-col__cap" style="background:' + bcol.color + '"></span>' +
          '<span class="ax-pl-col__name">' + esc(bcol.label) + '</span>' +
          '<span class="ax-badge ax-badge--neutral ax-badge--pill ax-num">' + bcards.length + '</span>' +
        '</div>' +
        '<button class="ax-btn ax-btn--ghost ax-btn--icon ax-btn--sm" onclick="openNewTask(\'' + bcol.id + '\')" aria-label="Adicionar em ' + esc(bcol.label) + '">' +
          '<svg class="ax-btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5l0 14"/><path d="M5 12l14 0"/></svg></button></div>' +
        '<div class="ax-pl-col__sub"><span class="ax-pl-col__count">média ' + bavg + '%</span><span class="ax-pl-col__prob">' + bcards.length + ' atividade(s)</span></div>' +
        '<div class="ax-progress ax-progress--xs" style="margin-top:8px;"><div class="ax-progress__track"><div class="ax-progress__fill" style="width:' + bavg + '%;background:' + bcol.color + '"></div></div></div>' +
        '</div><div class="ax-pl-col__body">';
      for (var bk = 0; bk < bcards.length; bk++) {
        html += renderKanbanCard(bcards[bk]);
      }
      if (bcards.length === 0) {
        html += '<div style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:22px 10px;text-align:center;color:var(--ax-text-subtle);font-size:var(--ax-text-xs);border:1px dashed var(--ax-border);border-radius:var(--ax-radius-md);"><span>Nenhuma tarefa</span><button type="button" class="ax-btn ax-btn--ghost ax-btn--sm" onclick="openNewTask(\'' + bcol.id + '\')">Adicionar</button></div>';
      }
      html += '<button type="button" class="ax-pl-add" onclick="openNewTask(\'' + bcol.id + '\')">' +
        '<svg class="ax-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M12 5l0 14"/><path d="M5 12l14 0"/></svg>Adicionar</button>' +
        '</div></section>';
    }

    /* Botão discreto para mostrar/ocultar Concluído */
    if (S.listStage.indexOf('all') !== -1) {
      var doneCount = S.activities.filter(function (a) { return a.categoria !== 1 && a.stage === 'concluido'; }).length;
      html += '<button class="ax-btn ax-btn--ghost ax-btn--sm ax-btn--pill" onclick="S.showConcluidoKanban=!S.showConcluidoKanban;buildListBody()" style="align-self:center;margin-top:8px;font-size:var(--ax-text-xs);color:var(--ax-text-subtle);">' +
        (S.showConcluidoKanban ? 'Ocultar concluídas' : 'Concluídas (' + doneCount + ')') +
        '</button>';
    }

    if (!anyCard && S.listStage.indexOf('all') !== -1) {
      html += '<div class="ax-card ax-col--12" style="align-self:flex-start;"><div class="ax-empty"><div class="icwrap">' + ico('checklist', 26) + '</div><h3>Nada por aqui</h3><p>Ajuste os filtros ou crie uma nova tarefa.</p></div></div>';
    }
    html += '</div>';
  }
  body.innerHTML = html;
}

/* ============================================================ */
/* KANBAN                                                       */
/* ============================================================ */
function applyKanbanFilters(arr) {
  var q = S.listQ.toLowerCase().trim();
  if (!q && S.listCat === 'all') return arr;
  return arr.filter(function (a) {
    if (S.listCat !== 'all' && a.categoria !== S.listCat) return false;
    if (q) {
      var cat = catOf(a.categoria);
      var hay = (a.titulo + ' ' + (a.descricao || '') + ' ' + (cat ? cat.nome : '')).toLowerCase();
      if (hay.indexOf(q) === -1) return false;
    }
    return true;
  });
}

function renderKanbanCard(a) {
  var cat = catOf(a.categoria);
  var st = stageOf(a.stage);
  var prio = PRIOS[a.prioridade] || PRIOS.media;
  var isHot = a.prioridade === 'alta' || a.prioridade === 'urgente';
  var tb = (a.idCheck || []).length;
  var db = tb ? a.idCheck.filter(function (c) { return c.done; }).length : 0;
  return '<article class="ax-pl-card" draggable="true" ' +
    'ondragstart="handleDragStart(event,' + a.id + ')" ' +
    'ondragend="handleDragEnd()" onclick="openEditTask(' + a.id + ')" ' +
    'tabindex="0" role="button" aria-label="' + esc(a.titulo) + '">' +
    '<div class="ax-pl-card__row"><p class="ax-pl-card__title">' + esc(a.titulo) + '</p>' +
    (isHot ? '<span class="ax-badge ax-badge--soft ax-badge--danger ax-badge--sm ax-badge--pill" style="flex:0 0 auto;" title="Alta prioridade">Hot</span>' : '') + '</div>' +
    '<div class="ax-pl-card__sub"><span class="ax-avatar ax-avatar--xs ax-avatar--squircle" style="background:color-mix(in oklab,' + (cat && cat.cor || 'var(--ax-text-muted)') + ' 20%,transparent);color:' + (cat ? cat.cor : 'var(--ax-text-muted)') + ';font-weight:700;">' + esc(initials(cat ? cat.nome : '?')) + '</span>' +
      '<span class="ax-text-truncate" style="font-size:var(--ax-text-xs);color:var(--ax-text-muted);">' + esc(cat ? cat.nome : 'Sem categoria') + '</span></div>' +
    '<div class="ax-pl-card__row"><span class="ax-num" style="font-family:var(--ax-font-mono);font-weight:600;color:var(--ax-text-strong);">' + a.progress + '%</span>' +
      '<span class="ax-pl-card__meta"' + (isOverdue(a) ? ' style="color:var(--ax-danger-500)"' : '') + '>' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="width:13px;height:13px;"><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2l0 -12"/><path d="M16 3l0 4"/><path d="M8 3l0 4"/><path d="M4 11l16 0"/></svg>' +
        '<span>' + fmtDate(a.dataVencimento) + '</span></span></div>' +
    '<div class="ax-pl-card__foot"><div class="ax-pl-card__foot-icons ax-num">' +
      (tb ? '<span class="ax-cluster" style="gap:3px;font-size:var(--ax-text-xs);">' + ico('checklist', 13) + '<span>' + db + '/' + tb + '</span></span>' : '') +
      (a.canais && a.canais.length ? '<span class="ax-cluster" style="gap:3px;font-size:var(--ax-text-xs);">' + ico('send', 13) + '<span>' + a.canais.length + '</span></span>' : '') +
    '</div>' +
    '<span class="ax-avatar ax-avatar--xs ax-avatar--squircle" style="background:color-mix(in oklab,' + prio.color + ' 20%,transparent);color:' + prio.color + ';font-weight:600;font-size:var(--ax-text-2xs);" title="Prioridade ' + esc(prio.label) + '">' + esc(prio.label[0]) + '</span></div>' +
    '</article>';
}

function handleDragStart(e, id) {
  dragId = id;
  var card = e.currentTarget;
  setTimeout(function () { card.classList.add('ax-pl-card--ghost'); }, 0);
  e.dataTransfer.effectAllowed = 'move';
  try { e.dataTransfer.setData('text/plain', String(id)); } catch (err) {}
}
function handleDragEnd() {
  dragId = null;
  var ghosts = document.querySelectorAll('.ax-pl-card--ghost');
  for (var i = 0; i < ghosts.length; i++) ghosts[i].classList.remove('ax-pl-card--ghost');
  var cols = document.querySelectorAll('.ax-pl-col--over');
  for (var j = 0; j < cols.length; j++) cols[j].classList.remove('ax-pl-col--over');
}

/* Custom confirm dialog */
var _confirmCallback = null;
function showConfirm(title, msg, cb) {
  document.getElementById('confirm-title').textContent = title;
  document.getElementById('confirm-msg').textContent = msg;
  document.getElementById('confirm-cancel').style.display = '';
  document.getElementById('confirm-ok').style.display = '';
  _confirmCallback = cb;
  document.getElementById('confirm-ok').onclick = function() {
    var callback = _confirmCallback;
    closeConfirm();
    if (callback) callback();
  };
  openOverlay('confirm-modal');
}
function closeConfirm() {
  closeOverlay('confirm-modal');
  _confirmCallback = null;
}

function handleDrop(e, colId) {
  e.preventDefault();
  handleDragEnd();
  if (dragId == null) return;
  var a = getTask(dragId);
  if (a && a.stage !== colId) {
    a.stage = colId;
    if (colId === 'concluido') { a.progress = 100; a.concluidoEm = todayISO(); }
    else if (a.progress === 100) { a.progress = 99; a.concluidoEm = null; }
    else if (a.concluidoEm) a.concluidoEm = null;
    if (a._fbId) fb.updateDoc(userDoc('activities', a._fbId), { stage: a.stage, progress: a.progress, concluidoEm: a.concluidoEm || null }).catch(function () {});
    persistLocalState();
    renderLista();
    toast('Movida para "' + stageOf(colId).label + '"');
  }
}

/* ============================================================ */
/* CATEGORIAS                                                   */
/* ============================================================ */
function renderCategorias() {
  var wrap = document.getElementById('cat-table-wrap');
  var html = '<table class="ax-table ax-table--hover"><thead><tr><th>Categoria</th><th>Cor</th><th class="ax-num">Tarefas</th><th style="width:96px"></th></tr></thead><tbody>';
  if (S.categories.length === 0) {
    html += '<tr><td colspan="4"><div style="color:var(--ax-text-subtle);font-size:var(--ax-text-sm);padding:12px 0;">Crie sua primeira categoria.</div></td></tr>';
  }
  for (var i = 0; i < S.categories.length; i++) {
    var c = S.categories[i];
    var n = countCat(c.id);
    html += '<tr><td><div style="display:flex;align-items:center;gap:10px;"><span class="ax-avatar ax-avatar--xs ax-avatar--squircle" style="background:color-mix(in oklab,' + c.cor + ' 20%,transparent);color:' + c.cor + ';font-weight:700;">' + esc(initials(c.nome)) + '</span><span class="ax-strong">' + esc(c.nome) + '</span></div></td>' +
      '<td><span class="ax-badge ax-badge--soft ax-badge--pill" style="--_b500:' + c.cor + '"><span class="ax-badge__dot"></span>' + esc(c.cor) + '</span></td>' +
      '<td class="ax-num">' + n + '</td>' +
      '<td><div style="display:flex;gap:4px;justify-content:flex-end;">' +
      '<button class="ax-icon-btn" style="width:32px;height:32px;" onclick="openCategoryModal(' + c.id + ')">' + ico('pencil', 16) + '</button>' +
      '<button class="ax-icon-btn" style="width:32px;height:32px;color:var(--ax-danger-500);" onclick="deleteCategory(' + c.id + ')">' + ico('trash', 16) + '</button>' +
      '</div></td></tr>';
  }
  html += '</tbody></table>';
  wrap.innerHTML = html;

  var dist = document.getElementById('cat-dist');
  var total = S.activities.length || 1;
  var dhtml = '';
  for (var d = 0; d < S.categories.length; d++) {
    var c2 = countCat(S.categories[d].id);
    var pct = Math.round(c2 / total * 100);
    dhtml += '<div class="ax-dist-row"><span class="name">' + esc(S.categories[d].nome) + '</span>' +
      '<span class="bar"><span class="fill" style="width:' + pct + '%;background:' + S.categories[d].cor + '"></span></span>' +
      '<span class="val">' + c2 + '</span></div>';
  }
  if (!dhtml) dhtml = '<div style="color:var(--ax-text-subtle);font-size:var(--ax-text-sm)">Sem categorias.</div>';
  dist.innerHTML = dhtml;
}

function openCategoryModal(id) {
  document.getElementById('cm-id').value = id || '';
  if (id) {
    var c = S.categories.filter(function (x) { return x.id === id; })[0];
    if (!c) return;
    document.getElementById('cm-title').textContent = 'Editar categoria';
    document.getElementById('cm-eyebrow').textContent = c.nome;
    document.getElementById('cm-nome').value = c.nome;
    document.getElementById('cm-cor').value = c.cor;
    document.getElementById('cm-delete').style.display = '';
  } else {
    document.getElementById('cm-title').textContent = 'Nova categoria';
    document.getElementById('cm-eyebrow').textContent = 'Categoria';
    document.getElementById('cm-nome').value = '';
    document.getElementById('cm-cor').value = SWATCHES[0];
    document.getElementById('cm-delete').style.display = 'none';
  }
  renderSwatches(document.getElementById('cm-cor').value);
  openOverlay('cat-modal');
}
function renderSwatches(active) {
  var el = document.getElementById('cm-swatches');
  var html = '';
  for (var i = 0; i < SWATCHES.length; i++) {
    html += '<button class="ax-btn ax-btn--ghost ax-btn--sm" style="padding:4px;width:34px;height:34px;" onclick="document.getElementById(\'cm-cor\').value=\'' + SWATCHES[i] + '\';renderSwatches(\'' + SWATCHES[i] + '\')"><span style="width:22px;height:22px;border-radius:7px;background:' + SWATCHES[i] + ';display:inline-block;' + (active === SWATCHES[i] ? 'outline:2px solid var(--ax-text-strong);outline-offset:2px;' : '') + '"></span></button>';
  }
  el.innerHTML = html;
}
function saveCategory() {
  var nome = document.getElementById('cm-nome').value.trim();
  var cor = document.getElementById('cm-cor').value;
  if (!nome) { toast('Informe um nome.', 'error'); return; }
  var id = Number(document.getElementById('cm-id').value);
  if (id === 1) {
    toast('A categoria Editorial é reservada e não pode ser alterada.', 'error');
    return;
  }
  if (id) {
    var c = S.categories.filter(function (x) { return x.id === id; })[0];
    if (c) { c.nome = nome; c.cor = cor; if (c._fbId) fb.updateDoc(userDoc('categories', c._fbId), { nome: nome, cor: cor }).catch(function () {}); }
  } else {
    var newCat = { id: S.nextCatId++, nome: nome, cor: cor };
    fb.addDoc(userPath('categories'), newCat).then(function (d) { newCat._fbId = d.id; }).catch(function () {});
    S.categories.push(newCat);
  }
  persistLocalState();
  closeOverlay('cat-modal');
  renderCategorias(); renderAllFilters();
  toast('Categoria salva');
}
function deleteCategory(id) {
  if (id === 1) {
    toast('A categoria Editorial é reservada e não pode ser excluída.', 'error');
    return;
  }
  var c = S.categories.filter(function (x) { return x.id === id; })[0];
  if (!c) return;
  showConfirm('Excluir categoria?', 'A categoria "' + c.nome + '" será removida. As tarefas associadas ficarão sem categoria.', function() {
    if (c._fbId) fb.deleteDoc(userDoc('categories', c._fbId)).catch(function () {});
    S.categories = S.categories.filter(function (x) { return x.id !== id; });
    S.activities.forEach(function (a) { if (a.categoria === id) a.categoria = null; });
    persistLocalState();
    renderCategorias(); renderAllFilters();
    toast('Categoria excluída');
  });
}
function closeCategoryModal() { closeOverlay('cat-modal'); }

/* ============================================================ */
/* MODAL TAREFA                                                 */
/* ============================================================ */
function openOverlay(id) {
  document.getElementById(id).classList.add('open');
}
function closeOverlay(id) {
  document.getElementById(id).classList.remove('open');
}

function openNewTask(stageId, editorial) {
  S.editId = null;
  S.draftChecklist = [];
  S.draftImages = [];
  document.getElementById('tm-eyebrow').textContent = 'Nova tarefa';
  document.getElementById('tm-hero').style.display = '';
  document.querySelector('#tm-hero .ax-hero__title-row').style.display = 'none';
  document.getElementById('tm-hero-meta').style.display = 'none';
  document.getElementById('tm-tabs').style.display = '';
  setTab('detalhes');
  document.getElementById('tm-delete').style.display = 'none';

  document.getElementById('tm-title').value = '';
  var newDesc = document.getElementById('tm-hero-desc');
  newDesc.value = '';
  newDesc.readOnly = true;
  document.getElementById('tmf-due').value = '';
  document.getElementById('tmf-post').value = '';
  /* prioridade padrão: baixa */
  S._heroPrio = 'baixa';
  updatePrioBadge();

  var catSel = document.getElementById('tmf-cat');
  catSel.innerHTML = '<option value="">Sem categoria</option>';
  var firstRegularCategory = null;
  for (var i = 0; i < S.categories.length; i++) {
    var category = S.categories[i];
    if (category.id === 1 && !editorial) continue;
    catSel.innerHTML += '<option value="' + category.id + '">' + esc(category.nome) + '</option>';
    if (!firstRegularCategory && category.id !== 1) firstRegularCategory = category.id;
  }
  if (editorial && S.categories.some(function (category) { return category.id === 1; })) catSel.value = '1';
  else if (firstRegularCategory !== null) catSel.value = String(firstRegularCategory);

  var stSel = document.getElementById('tmf-stage');
  stSel.innerHTML = '';
  for (var s = 0; s < STAGES.length; s++) stSel.innerHTML += '<option value="' + STAGES[s].id + '"' + (STAGES[s].id === (stageId || 'afazer') ? ' selected' : '') + '>' + esc(STAGES[s].label) + '</option>';

  setProgressStep(0);
  renderChecklistTMP();
  renderCanaisTMP([]);
  renderImagensTMP();
  updateCanaisTab();
  document.getElementById('tm-avatar').style.background = 'color-mix(in oklab,var(--ax-accent) 20%,transparent)';
  document.getElementById('tm-avatar').style.color = 'var(--ax-accent)';
  openOverlay('task-modal');
  setTimeout(function () { document.getElementById('tm-title').focus(); }, 80);
}

function openEditTask(id) {
  var a = getTask(id);
  if (!a) return;
  S.editId = id;
  S.draftChecklist = clone(a.idCheck || []);
  S.draftImages = clone(a.imagens || []);
  var cat = catOf(a.categoria);

  /* hero overview */
  document.getElementById('tm-hero').style.display = '';
  document.querySelector('#tm-hero .ax-hero__title-row').style.display = '';
  document.getElementById('tm-hero-meta').style.display = '';
  document.getElementById('tm-title').value = a.titulo;
  var editDesc = document.getElementById('tm-hero-desc');
  editDesc.value = a.descricao || '';
  editDesc.readOnly = true;
  var st = stageOf(a.stage);
  document.getElementById('tm-hero-stage').className = 'ax-badge ax-badge--soft ax-badge--' + st.tone + ' ax-badge--pill';
  document.getElementById('tm-hero-stage').innerHTML = '<span class="ax-badge__dot"></span>' + esc(st.label);
  var pr = PRIOS[a.prioridade] || PRIOS.baixa;
  var prEl = document.getElementById('tm-hero-prio');
  prEl.style.display = '';
  prEl.setAttribute('data-prio', a.prioridade || 'baixa');
  S._heroPrio = a.prioridade || 'baixa';
  updatePrioBadge();
  document.getElementById('tm-hero-meta').innerHTML =
    '<span class="item">' + ico('tag', 14) + '<span>' + esc(cat ? cat.nome : 'Sem categoria') + '</span></span>' +
    '<span class="item">' + ico('calendar', 14) + '<span>Venc. ' + fmtDate(a.dataVencimento) + '</span></span>' +
    '<span class="item">' + ico('clock', 14) + '<span>Criada ' + fmtDate(a.criadoEm) + '</span></span>' +
    (a.dataPostagem ? '<span class="item">' + ico('send', 14) + '<span>Post ' + fmtDate(a.dataPostagem) + '</span></span>' : '');

  document.getElementById('tm-title').value = a.titulo;
  document.getElementById('tm-hero-desc').value = a.descricao || '';
  document.getElementById('tmf-due').value = a.dataVencimento || '';
  document.getElementById('tmf-post').value = a.dataPostagem || '';
  /* prioridade via hero badge, não mais via select */

  var catSel = document.getElementById('tmf-cat');
  catSel.innerHTML = '<option value="">Sem categoria</option>';
  for (var i = 0; i < S.categories.length; i++) { if (S.categories[i].id === 1) continue; catSel.innerHTML += '<option value="' + S.categories[i].id + '">' + esc(S.categories[i].nome) + '</option>'; }
  catSel.value = a.categoria || '';

  var stSel = document.getElementById('tmf-stage');
  stSel.innerHTML = '';
  for (var s = 0; s < STAGES.length; s++) stSel.innerHTML += '<option value="' + STAGES[s].id + '"' + (STAGES[s].id === a.stage ? ' selected' : '') + '>' + esc(STAGES[s].label) + '</option>';

  var tmm = document.getElementById('tm-avatar');
  if (cat) { tmm.style.background = 'color-mix(in oklab,' + cat.cor + ' 20%,transparent)'; tmm.style.color = cat.cor; }

  document.getElementById('tm-eyebrow').textContent = cat ? cat.nome : 'Tarefa';
  document.getElementById('tm-tabs').style.display = '';
  setTab('detalhes');
  document.getElementById('tm-delete').style.display = '';

  setProgressStep(a.progress);
  renderChecklistTMP();
  renderCanaisTMP(a.canais || []);
  renderImagensTMP();
  updateCanaisTab();
  openOverlay('task-modal');
  setTimeout(function () { var titleInput = document.getElementById('tm-title'); titleInput.focus(); titleInput.select(); }, 80);
}

function updateCanaisTab() {
  updateModalForEditorial();
}

function updatePrioBadge() {
  var pr = PRIOS[S._heroPrio] || PRIOS.baixa;
  var el = document.getElementById('tm-hero-prio');
  if (!el) return;
  el.className = 'ax-badge ax-badge--soft ax-badge--pill';
  el.style.setProperty('--_b500', pr.color);
  el.style.cursor = 'pointer';
  el.style.userSelect = 'none';
  el.textContent = pr.label;
  el.setAttribute('data-prio', S._heroPrio || 'baixa');
  el.setAttribute('aria-label', 'Prioridade atual: ' + pr.label + '. Clique para alterar.');
  if (!document.getElementById('prio-drop')) el.setAttribute('aria-expanded', 'false');
}

function closePrioDropdown() {
  var drop = document.getElementById('prio-drop');
  var trigger = document.getElementById('tm-hero-prio');
  if (drop) drop.remove();
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
}

function togglePrioDropdown(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  var el = document.getElementById('tm-hero-prio');
  if (!el) return;
  var existing = document.getElementById('prio-drop');
  if (existing) { closePrioDropdown(); return; }

  var options = ['baixa', 'media', 'alta'];
  var drop = document.createElement('div');
  drop.id = 'prio-drop';
  drop.setAttribute('role', 'listbox');
  drop.setAttribute('aria-label', 'Selecionar prioridade');
  drop.style.cssText = 'position:absolute;top:calc(100% + 6px);left:0;z-index:100;background:var(--ax-surface-solid);border:1px solid var(--ax-border);border-radius:var(--ax-radius-md);box-shadow:var(--ax-shadow-lg);padding:4px;min-width:120px;';

  for (var i = 0; i < options.length; i++) {
    (function (key) {
      var p = PRIOS[key];
      var option = document.createElement('button');
      option.type = 'button';
      option.setAttribute('role', 'option');
      option.setAttribute('aria-selected', key === S._heroPrio ? 'true' : 'false');
      option.textContent = p.label;
      option.style.cssText = 'display:block;width:100%;text-align:left;padding:7px 10px;border:0;background:' + (key === S._heroPrio ? 'var(--ax-surface-subtle)' : 'transparent') + ';color:' + p.color + ';font-size:var(--ax-text-xs);font-weight:600;font-family:inherit;cursor:pointer;border-radius:var(--ax-radius-sm);';
      option.addEventListener('mouseenter', function () { option.style.background = 'var(--ax-surface-subtle)'; });
      option.addEventListener('mouseleave', function () { option.style.background = key === S._heroPrio ? 'var(--ax-surface-subtle)' : 'transparent'; });
      option.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        setHeroPrio(key);
        closePrioDropdown();
      });
      drop.appendChild(option);
    })(options[i]);
  }

  el.style.position = 'relative';
  el.insertAdjacentElement('afterend', drop);
  el.setAttribute('aria-expanded', 'true');
}

function setHeroPrio(p) {
  if (['baixa', 'media', 'alta'].indexOf(p) === -1) return;
  S._heroPrio = p;
  updatePrioBadge();
}

function enableTaskDescription(field) {
  if (!field) return;
  field.readOnly = false;
  field.focus();
}

function updateModalForEditorial() {
  var catId = Number(document.getElementById('tmf-cat').value);
  var isEditorial = catId === 1;
  var tabBtn = document.getElementById('tm-tab-canais');
  var tabChecklist = document.querySelector('[data-tm-tab="checklist"]');
  var tabImagens = document.getElementById('tm-tab-imagens');
  var descField = document.getElementById('tm-hero-desc');
  var descLabel = null;
  var charCount = document.getElementById('tm-char-count');
  var modal = document.querySelector('.ax-modal');

  if (isEditorial) {
    if (tabBtn) tabBtn.classList.remove('hidden');
    if (tabImagens) tabImagens.classList.remove('hidden');
    if (tabChecklist) tabChecklist.style.display = 'none';
    if (S.tab === 'checklist') setTab('detalhes');
    if (modal) modal.style.maxWidth = '820px';

    if (descField) {
      descField.style.minHeight = '260px';
      descField.style.fontSize = 'var(--ax-text-md)';
      descField.style.lineHeight = '1.7';
      descField.placeholder = 'Escreva o conteúdo, legenda ou texto da publicação…';
      descField.oninput = function() {
        var cc = document.getElementById('tm-char-count');
        if (cc) cc.textContent = descField.value.length + ' caracteres';
      };
    }
    if (descLabel) descLabel.textContent = 'Conteúdo / Legenda';

    if (!charCount && descField) {
      charCount = document.createElement('div');
      charCount.id = 'tm-char-count';
      charCount.style.cssText = 'font-size:var(--ax-text-2xs);color:var(--ax-text-subtle);text-align:right;margin-top:4px;font-family:var(--ax-font-mono);';
      descField.parentNode.appendChild(charCount);
    }
    if (charCount && descField) charCount.textContent = descField.value.length + ' caracteres';
  } else {
    if (tabBtn) tabBtn.classList.add('hidden');
    if (tabImagens) tabImagens.classList.remove('hidden');
    if (tabChecklist) tabChecklist.style.display = '';
    if (modal) modal.style.maxWidth = '720px';
    if (descField) {
      descField.style.minHeight = '84px';
      descField.style.fontSize = 'var(--ax-text-sm)';
      descField.style.lineHeight = '1.55';
      descField.placeholder = 'Detalhe o que precisa ser feito…';
      descField.oninput = null;
    }
    if (descLabel) descLabel.textContent = 'Descrição';
    if (charCount) charCount.textContent = '';
  }
}

function setTab(tab) {
  S.tab = tab;
  var tabs = document.querySelectorAll('[data-tm-tab]');
  for (var i = 0; i < tabs.length; i++) {
    var t = tabs[i];
    if (t.classList.contains('hidden')) continue;
    t.classList.toggle('is-active', t.getAttribute('data-tm-tab') === tab);
  }
  var panels = document.querySelectorAll('[data-tm-panel]');
  for (var j = 0; j < panels.length; j++) panels[j].style.display = panels[j].getAttribute('data-tm-panel') === tab ? '' : 'none';
}

function setProgressStep(val) {
  val = Math.max(0, Math.min(100, val));
  document.getElementById('tmf-progress-fill').style.width = val + '%';
  document.getElementById('tmf-progress-fill').style.background = progColor(val);
  document.getElementById('tmf-progress-label').textContent = val + '%';
  if (val >= 100) { document.getElementById('tmf-stage').value = 'concluido'; }
  else if (document.getElementById('tmf-stage').value === 'concluido') { document.getElementById('tmf-stage').value = 'execucao'; }
}

function progressClick(e) {
  var bar = document.getElementById('tmf-progress-bar');
  var rect = bar.getBoundingClientRect();
  var pct = Math.round((e.clientX - rect.left) / rect.width * 100);
  setProgressStep(pct);
}

function renderCanaisTMP(selected) {
  document.getElementById('tm-canais-count').textContent = selected.length;
  var postWrap = document.getElementById('tmf-post-wrap');
  if (postWrap) postWrap.style.display = selected.length > 0 ? '' : 'none';
  var grid = document.getElementById('tm-canais-grid');
  var html = '';
  for (var i = 0; i < CANAIS.length; i++) {
    var on = selected.indexOf(CANAIS[i].id) !== -1;
    html += '<button class="ax-chip' + (on ? ' ax-chip--on' : '') + '" data-can="' + CANAIS[i].id + '" onclick="toggleCanalTMP(this)" style="' + (on ? 'background:' + CANAIS[i].color + ';border-color:' + CANAIS[i].color + ';color:#fff;' : '--_c:' + CANAIS[i].color + '') + ' ' + (!on ? 'color:' + CANAIS[i].color + ';' : '') + '"><span class="dot" style="width:7px;height:7px;border-radius:50%;background:currentColor;display:inline-block"></span>' + esc(CANAIS[i].label) + '</button>';
  }
  grid.innerHTML = html;
}
function toggleCanalTMP(btn) {
  btn.classList.toggle('ax-chip--on');
  var sel = getSelectedCanais();
  var id = btn.getAttribute('data-can');
  var inList = sel.indexOf(id) !== -1;
  if (!btn.classList.contains('ax-chip--on') && inList) {
    sel = sel.filter(function (x) { return x !== id; });
  } else if (btn.classList.contains('ax-chip--on') && !inList) {
    sel.push(id);
  }
  var c = CANAIS.filter(function (x) { return x.id === id; })[0];
  if (btn.classList.contains('ax-chip--on')) {
    btn.style.background = c.color; btn.style.borderColor = c.color; btn.style.color = '#fff';
  } else {
    btn.style.background = ''; btn.style.borderColor = ''; btn.style.color = c.color;
  }
  /* Mostra data de postagem só se tiver canal selecionado */
  var postWrap = document.getElementById('tmf-post-wrap');
  if (postWrap) postWrap.style.display = getSelectedCanais().length > 0 ? '' : 'none';
}
function getSelectedCanais() {
  var chips = document.querySelectorAll('#tm-canais-grid .ax-chip');
  var sel = [];
  for (var i = 0; i < chips.length; i++) if (chips[i].classList.contains('ax-chip--on')) sel.push(chips[i].getAttribute('data-can'));
  return sel;
}

function renderChecklistTMP() {
  var body = document.getElementById('tm-checklist-body');
  var count = document.getElementById('tm-checklist-count');
  var done = S.draftChecklist.filter(function (c) { return c.done; }).length;
  count.textContent = done + '/' + S.draftChecklist.length;
  if (!S.draftChecklist.length) {
    body.innerHTML = '<div style="color:var(--ax-text-subtle);font-size:var(--ax-text-sm);padding:8px 0;">Nenhum item. Adicione abaixo.</div>';
    return;
  }
  var html = '';
  for (var i = 0; i < S.draftChecklist.length; i++) {
    var it = S.draftChecklist[i];
    html += '<div class="ax-check-item"><span class="ax-check' + (it.done ? ' ax-check--checked' : '') + '" onclick="toggleCheckTMP(' + i + ')">' +
      (it.done ? '<svg class="ax-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5l10 -10"/></svg>' : '') +
      '</span><span class="ax-check-item__text' + (it.done ? ' done' : '') + '" onclick="toggleCheckTMP(' + i + ')">' + esc(it.text) + '</span>' +
      '<button class="ax-check-item__del" onclick="removeCheckTMP(' + i + ')">' + ico('trash', 14) + '</button></div>';
  }
  body.innerHTML = html;
}
function addChecklistItem() {
  var input = document.getElementById('tm-checklist-input');
  var v = input.value.trim();
  if (!v) return;
  S.draftChecklist.push({ text: v, done: false });
  input.value = '';
  renderChecklistTMP();
}
function toggleCheckTMP(i) {
  S.draftChecklist[i].done = !S.draftChecklist[i].done;
  renderChecklistTMP();
}
function removeCheckTMP(i) {
  S.draftChecklist.splice(i, 1);
  renderChecklistTMP();
}

/* ============ IMAGENS ============ */
function renderImagensTMP() {
  var grid = document.getElementById('tm-imagens-grid');
  var count = document.getElementById('tm-imagens-count');
  count.textContent = S.draftImages.length;
  var html = '';
  for (var i = 0; i < S.draftImages.length; i++) {
    var img = S.draftImages[i];
    html += '<div style="position:relative;aspect-ratio:1;border-radius:var(--ax-radius-md);overflow:hidden;border:1px solid var(--ax-border);">' +
      '<img src="' + (img.url || '') + '" style="width:100%;height:100%;object-fit:cover;" alt="">' +
      '<button class="ax-btn ax-btn--ghost ax-btn--sm" onclick="removeImage(' + i + ')" style="position:absolute;top:4px;right:4px;width:24px;height:24px;padding:0;border-radius:50%;background:rgba(0,0,0,.5);color:#fff;font-size:14px;line-height:1;">×</button>' +
      '</div>';
  }
  grid.innerHTML = html;
}

function removeImage(i) {
  S.draftImages.splice(i, 1);
  renderImagensTMP();
}

function uploadImages(files) {
  if (!files || !files.length) return;
  var uid = _auth.currentUser ? _auth.currentUser.uid : 'local';
  var progress = document.getElementById('tm-upload-progress');
  var bar = document.getElementById('tm-upload-bar');
  var label = document.getElementById('tm-upload-label');

  for (var i = 0; i < files.length; i++) {
    (function(file) {
      if (file.size > 5 * 1024 * 1024) { toast('Imagem ' + file.name + ' muito grande (máx 5MB)', 'error'); return; }
      progress.style.display = '';
      bar.style.width = '0%';
      label.textContent = 'Enviando ' + file.name + '...';

      var ref = _storage.ref('task-images/' + uid + '/' + Date.now() + '_' + file.name);
      var task = ref.put(file);
      task.on('state_changed',
        function(snap) {
          var pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          bar.style.width = pct + '%';
        },
        function(err) { toast('Erro no upload: ' + err.message, 'error'); progress.style.display = 'none'; },
        function() {
          task.snapshot.ref.getDownloadURL().then(function(url) {
            S.draftImages.push({ name: file.name, url: url, path: ref.fullPath });
            renderImagensTMP();
            progress.style.display = 'none';
            toast('Imagem enviada: ' + file.name);
          });
        }
      );
    })(files[i]);
  }
}

function saveTask() {
  var titulo = document.getElementById('tm-title').value.trim();
  if (!titulo) { toast('Informe um título.', 'error'); return; }
  var data = {
    titulo: titulo,
    descricao: document.getElementById('tm-hero-desc').value.trim(),
    categoria: Number(document.getElementById('tmf-cat').value) || null,
    stage: document.getElementById('tmf-stage').value,
    prioridade: S._heroPrio || 'baixa',
    dataVencimento: document.getElementById('tmf-due').value || null,
    dataPostagem: document.getElementById('tmf-post').value || null,
    progress: parseInt(document.getElementById('tmf-progress-label').textContent, 10) || 0,
    idCheck: S.draftChecklist,
    imagens: S.draftImages,
    canais: getSelectedCanais(),
    tipo: Number(document.getElementById('tmf-cat').value) === 1 ? 'editorial' : 'demanda',
    campanha: document.getElementById('tmf-campanha') ? document.getElementById('tmf-campanha').value.trim() : '',
    formato: document.getElementById('tmf-formato') ? document.getElementById('tmf-formato').value.trim() : '',
    cta: document.getElementById('tmf-cta') ? document.getElementById('tmf-cta').value.trim() : '',
    link: document.getElementById('tmf-link') ? document.getElementById('tmf-link').value.trim() : '',
    responsavel: document.getElementById('tmf-responsavel') ? document.getElementById('tmf-responsavel').value.trim() : '',
    statusAprovacao: document.getElementById('tmf-aprovacao') ? document.getElementById('tmf-aprovacao').value : null,
    recorrencia: document.getElementById('tmf-recurrence') ? document.getElementById('tmf-recurrence').value : 'nenhuma',
    historico: S.editId && getTask(S.editId) ? clone(getTask(S.editId).historico || []) : [{ data: todayISO(), acao: 'Criada' }]
  };
  if (data.stage === 'concluido') data.progress = 100;
  if (data.progress >= 100 && data.stage !== 'concluido') data.stage = 'concluido';
  if (data.stage !== 'concluido' && data.progress >= 100) data.progress = 99;
  data.prioridade = PRIOS[data.prioridade] ? data.prioridade : 'baixa';

  if (S.editId) {
    var a = getTask(S.editId);
    if (a) {
      for (var k in data) a[k] = data[k];
      if (a.stage === 'concluido' && !a.concluidoEm) a.concluidoEm = todayISO();
      else if (a.stage !== 'concluido') a.concluidoEm = null;
      if (a._fbId) {
        data.concluidoEm = a.concluidoEm || null;
        fb.updateDoc(userDoc('activities', a._fbId), data).catch(function (e) { toast('Erro ao salvar no Firebase.', 'error'); });
      }
    }
    toast('Tarefa atualizada');
  } else {
    data.id = S.nextId++;
    data.criadoEm = todayISO();
    data.concluidoEm = null;
    if (data.stage === 'concluido') data.concluidoEm = todayISO();
    fb.addDoc(userPath('activities'), data).then(function (d) { data._fbId = d.id; }).catch(function (e) { toast('Erro ao salvar no Firebase.', 'error'); });
    S.activities.push(data);
    toast('Tarefa criada');
  }
  persistLocalState();
  closeOverlay('task-modal');
  if (S.view === 'lista') renderLista();
  else renderDashboard();
  updatePageHead();
}
function closeTaskModal() { closeOverlay('task-modal'); }
function confirmDeleteTask(id) {
  showConfirm('Excluir tarefa?', 'Tem certeza que deseja excluir esta tarefa?', function() {
    var a = getTask(id);
    if (a && a._fbId) fb.deleteDoc(userDoc('activities', a._fbId)).catch(function () {});
    S.activities = S.activities.filter(function (a) { return a.id !== id; });
    renderAll();
    toast('Tarefa excluída', 'error');
  });
}

/* ============================================================ */
/* CONFIG                                                       */
/* ============================================================ */
function renderConfig() {
  var th = document.documentElement.getAttribute('data-ax-theme');
  var L = document.getElementById('cfg-theme-light');
  var D = document.getElementById('cfg-theme-dark');
  L.classList.toggle('is-active', th !== 'dark');
  D.classList.toggle('is-active', th === 'dark');
  buildAccentSwatches();
  syncCfgUI();
}
function backupItems(items) {
  return (items || []).map(function (item) {
    var copy = {};
    for (var key in item) {
      if (key !== '_fbId' && Object.prototype.hasOwnProperty.call(item, key)) copy[key] = item[key];
    }
    return copy;
  });
}

function exportBackup() {
  var payload = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    activities: backupItems(S.activities),
    categories: backupItems(S.categories)
  };
  var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'makro_tarefas_backup_' + todayISO() + '.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  toast('Backup exportado com ' + S.activities.length + ' tarefa(s) e ' + S.categories.length + ' categoria(s)');
}

function normalizeBackupData(data) {
  if (!data || !Array.isArray(data.activities) || !Array.isArray(data.categories)) throw new Error('Formato de backup inválido.');

  var categories = [], usedCatIds = {}, nextCatId = 1;
  for (var i = 0; i < data.categories.length; i++) {
    var rawCat = data.categories[i];
    if (!rawCat || typeof rawCat !== 'object') continue;
    var cat = {};
    for (var catKey in rawCat) {
      if (catKey !== '_fbId' && Object.prototype.hasOwnProperty.call(rawCat, catKey)) cat[catKey] = rawCat[catKey];
    }
    var catId = Number(cat.id);
    if (!isFinite(catId) || catId <= 0 || usedCatIds[catId]) {
      while (usedCatIds[nextCatId]) nextCatId++;
      catId = nextCatId++;
    }
    usedCatIds[catId] = true;
    if (catId >= nextCatId) nextCatId = catId + 1;
    cat.id = catId;
    cat.nome = String(cat.nome || '').trim();
    if (!cat.nome) cat.nome = 'Categoria sem nome';
    cat.cor = /^#[0-9a-f]{6}$/i.test(String(cat.cor || '')) ? String(cat.cor) : SWATCHES[categories.length % SWATCHES.length];
    categories.push(cat);
  }

  var activities = [], usedActivityIds = {}, nextActivityId = 1;
  for (var j = 0; j < data.activities.length; j++) {
    var rawActivity = data.activities[j];
    if (!rawActivity || typeof rawActivity !== 'object') continue;
    var activity = {};
    for (var activityKey in rawActivity) {
      if (activityKey !== '_fbId' && Object.prototype.hasOwnProperty.call(rawActivity, activityKey)) activity[activityKey] = rawActivity[activityKey];
    }
    activity.titulo = String(activity.titulo || '').trim();
    if (!activity.titulo) continue;
    var activityId = Number(activity.id);
    if (!isFinite(activityId) || activityId <= 0 || usedActivityIds[activityId]) {
      while (usedActivityIds[nextActivityId]) nextActivityId++;
      activityId = nextActivityId++;
    }
    usedActivityIds[activityId] = true;
    if (activityId >= nextActivityId) nextActivityId = activityId + 1;
    activity.id = activityId;
    activity.categoria = activity.categoria === null || activity.categoria === '' || typeof activity.categoria === 'undefined' ? null : Number(activity.categoria);
    if (activity.categoria !== null && (!isFinite(activity.categoria) || !usedCatIds[activity.categoria])) activity.categoria = null;
    activity.stage = STAGES.some(function (stage) { return stage.id === activity.stage; }) ? activity.stage : 'afazer';
    activity.prioridade = PRIOS[activity.prioridade] ? activity.prioridade : 'baixa';
    activity.progress = Math.max(0, Math.min(100, Number(activity.progress) || 0));
    activity.canais = Array.isArray(activity.canais) ? activity.canais : [];
    activity.idCheck = Array.isArray(activity.idCheck) ? activity.idCheck : [];
    activity.imagens = Array.isArray(activity.imagens) ? activity.imagens : [];
    if (activity.stage === 'concluido') activity.progress = 100;
    activities.push(activity);
  }

  return { activities: activities, categories: categories, nextId: nextActivityId, nextCatId: nextCatId };
}

function saveLocalBackup(data) {
  try {
    localStorage.setItem('makro_tasks_local', JSON.stringify({
      activities: data.activities,
      categories: data.categories,
      nextId: data.nextId,
      nextCatId: data.nextCatId
    }));
  } catch (e) {
    throw new Error('Não foi possível gravar o backup local.');
  }
}

function replaceFirebaseCollection(path, items) {
  return fb.getDocs(userPath(path)).then(function (snapshot) {
    var deletions = [];
    snapshot.forEach(function (doc) { deletions.push(fb.deleteDoc(doc.ref)); });
    return Promise.all(deletions);
  }).then(function () {
    return Promise.all(items.map(function (item) {
      return fb.addDoc(userPath(path), item).then(function (doc) {
        return Object.assign({}, item, { _fbId: doc.id });
      });
    }));
  });
}

function persistLocalState() {
  if (!S._localFallback) return;
  try {
    saveLocalBackup({
      activities: S.activities,
      categories: S.categories,
      nextId: S.nextId,
      nextCatId: S.nextCatId
    });
  } catch (e) {
    console.error('Erro ao persistir dados locais:', e);
  }
}

function persistImportedBackup(data) {
  var currentUser = _activeUser || (_auth && _auth.currentUser);
  if (_firebaseReady && _db && currentUser) {
    return Promise.all([
      replaceFirebaseCollection('activities', data.activities),
      replaceFirebaseCollection('categories', data.categories)
    ]).then(function (result) {
      S.activities = result[0];
      S.categories = result[1];
      S.nextId = data.nextId;
      S.nextCatId = data.nextCatId;
    });
  }
  S.activities = data.activities;
  S.categories = data.categories;
  S.nextId = data.nextId;
  S.nextCatId = data.nextCatId;
  saveLocalBackup(data);
  return Promise.resolve();
}

function importBackup() {
  var input = document.getElementById('import-file');
  if (input) input.click();
}

/* ============================================================ */
/* TEMA                                                         */
/* ============================================================ */
function applyTheme(th, persist) {
  document.documentElement.setAttribute('data-ax-theme', th);
  if (persist) { try { localStorage.setItem('ax:theme', th); } catch (e) {} }
  updateThemeIcon(th);
  renderConfig();
  renderDashboard();
}
function toggleTheme() {
  var th = document.documentElement.getAttribute('data-ax-theme');
  applyTheme(th === 'dark' ? 'light' : 'dark', true);
  toast('Tema ' + (th === 'dark' ? 'claro' : 'escuro'));
}

function updateThemeIcon(th) {
  var icon = document.getElementById('icon-theme');
  if (!icon) return;
  var dark = th === 'dark';
  if (dark) {
    icon.innerHTML = '<path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 0 1 -8 0"/><path d="M3 12h1M12 3v1M20 12h1M12 20v1M5.6 5.6l.7.7M18.4 5.6l-.7.7M17.7 17.7l.7.7M6.3 17.7l-.7.7"/>';
  } else {
    icon.innerHTML = '<path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z"/>';
  }
}

/* ============================================================ */
/* BUSCA                                                        */
/* ============================================================ */
function handleHeaderSearch(v) {
  S.listQ = v;
  if (S.view !== 'lista') changeView('lista');
  else renderLista();
}

/* ============================================================ */
/* RENDER ALL                                                   */
/* ============================================================ */
function renderAllFilters() {
  if (S.view === 'lista') renderLista();
}
function renderAll() {
  if (S.view === 'dash') renderDashboard();
  if (S.view === 'lista') renderLista();
  if (S.view === 'editorial') renderCalendario();
  if (S.view === 'categorias') renderCategorias();
  updatePageHead();
  updateNavBadges();
}
function updateNavBadges() {
  var total = S.activities.filter(function (a) { return typeof isEditorialActivity === 'function' ? !isEditorialActivity(a) : a.categoria !== 1; }).length;
  var nonEd = total;
  var pend = nonEd - S.activities.filter(function (a) { return (typeof isEditorialActivity === 'function' ? !isEditorialActivity(a) : a.categoria !== 1) && a.stage === 'concluido'; }).length;
  document.getElementById('nav-badge-dash').textContent = total;
  document.getElementById('nav-badge-lista').textContent = nonEd;
  document.getElementById('nav-badge-editorial').textContent = countCat(1);
}

/* ============================================================ */
/* CUSTOMIZER                                                    */
/* ============================================================ */
var AX_SETTINGS_KEY = 'makro_tasks_cfg';
var ACCENTS = [
  { id:'verdigris', color:'#1E856C', label:'Verde' },
  { id:'cobalt',    color:'#5883dd', label:'Azul' },
  { id:'indigo',    color:'#807ad8', label:'Índigo' },
  { id:'amethyst',  color:'#a56ec7', label:'Ametista' },
  { id:'magenta',   color:'#cd5e9a', label:'Magenta' },
  { id:'terracotta',color:'#cd674f', label:'Terracota' },
  { id:'amber',     color:'#e0a53a', label:'Âmbar' },
  { id:'olive',     color:'#84a725', label:'Oliva' },
  { id:'forest',    color:'#36965c', label:'Floresta' },
  { id:'teal',      color:'#15a4b7', label:'Ciano' },
  { id:'slate',     color:'#72879d', label:'Ardósia' },
  { id:'graphite',  color:'#86857d', label:'Grafite' }
];
var AX_MAP = { theme:'data-ax-theme', accent:'data-ax-accent', sidebar:'data-ax-sidebar', header:'data-ax-header', page:'data-ax-page' };

function loadCfg() {
  try { var d = localStorage.getItem(AX_SETTINGS_KEY); return d ? JSON.parse(d) : {}; } catch(e) { return {}; }
}
function saveCfg(s) {
  try { localStorage.setItem(AX_SETTINGS_KEY, JSON.stringify(s)); } catch(e) {}
}

function applyAccent(accentId) {
  var a = ACCENTS.filter(function(x) { return x.id === accentId; })[0] || ACCENTS[0];
  var root = document.documentElement;
  root.style.setProperty('--ax-accent', a.color);
  root.style.setProperty('--ax-accent-strong', a.color);
  root.style.setProperty('--ax-focus-ring', a.color + '80');
  var s = loadCfg();
  s.accent = accentId;
  saveCfg(s);
}

window.setConfig = function(key, val) {
  var s = loadCfg();
  s[key] = val;
  saveCfg(s);
  if (key === 'theme') {
    document.documentElement.setAttribute('data-ax-theme', val);
    updateThemeIcon(val);
    renderDashboard();
    renderConfig();
  }
  if (key === 'accent') applyAccent(val);
  if (AX_MAP[key]) document.documentElement.setAttribute(AX_MAP[key], val);
  syncCfgUI();
};

window.resetConfig = function() {
  localStorage.removeItem(AX_SETTINGS_KEY);
  document.documentElement.removeAttribute('data-ax-theme');
  document.documentElement.removeAttribute('data-ax-accent');
  applyAccent('verdigris');
  var st = null;
  try { st = localStorage.getItem('ax:theme'); } catch(e) {}
  document.documentElement.setAttribute('data-ax-theme', st === 'dark' ? 'dark' : 'light');
  updateThemeIcon(st === 'dark' ? 'dark' : 'light');
  syncCfgUI();
  renderDashboard();
  toast('Preferências restauradas');
};

function syncCfgUI() {
  var s = loadCfg();
  var vals = { theme: s.theme || 'dark', accent: s.accent || 'verdigris' };
  var theme = document.getElementById('cfg-theme');
  if (theme) {
    theme.querySelectorAll('.ax-segmented__btn').forEach(function(b) {
      b.classList.toggle('is-active', b.getAttribute('data-val') === vals.theme);
    });
  }
  var accentGrid = document.getElementById('cfg-accent');
  if (accentGrid) {
    accentGrid.querySelectorAll('.ax-swatch').forEach(function(b) {
      b.classList.toggle('is-active', b.getAttribute('data-val') === vals.accent);
    });
  }
}

function buildAccentSwatches() {
  var grid = document.getElementById('cfg-accent');
  if (!grid) return;
  var html = '';
  for (var i = 0; i < ACCENTS.length; i++) {
    html += '<button type="button" class="ax-swatch" data-val="' + ACCENTS[i].id + '" style="--sw:' + ACCENTS[i].color + '" onclick="setConfig(\'accent\',\'' + ACCENTS[i].id + '\')" aria-label="' + ACCENTS[i].label + '" title="' + ACCENTS[i].label + '"><svg class="ax-swatch__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5l9 -9"/></svg></button>';
  }
  grid.innerHTML = html;
}

window.toggleCustomizer = function() {
  var c = document.getElementById('ax-customizer');
  if (!c) return;
  if (c.classList.contains('is-open')) { closeCustomizer(); return; }
  c.classList.add('is-open');
  c.setAttribute('aria-hidden', 'false');
};

window.closeCustomizer = function() {
  var c = document.getElementById('ax-customizer');
  if (c) { c.classList.remove('is-open'); c.setAttribute('aria-hidden', 'true'); }
};

function initConfig() {
  buildAccentSwatches();
  var s = loadCfg();
  if (s.accent) applyAccent(s.accent);
  syncCfgUI();
}

/* ============================================================ */
/* BANCO DE HORAS + NPS (React)                                 */
/* ============================================================ */
var _bhRendered = false, _npsRendered = false;

function renderBancoHoras() {
  if (!_bhRendered) {
    _bhRendered = true;
    var root = document.getElementById('banco-horas-root');
    if (root && window.React && window.ReactDOM) {
      ReactDOM.createRoot(root).render(React.createElement(BancoHorasApp));
    }
  }
}

function renderNPS() {
  if (!_npsRendered) {
    _npsRendered = true;
    var root = document.getElementById('nps-root');
    if (root && window.React && window.ReactDOM) {
      ReactDOM.createRoot(root).render(React.createElement(NPSApp));
    }
  }
}

/* ============================================================ */
/* EVENTOS + INIT                                               */
/* ============================================================ */
function loadLocalFallback() {
  var LS_KEY = 'makro_tasks_local';
  try {
    var raw = localStorage.getItem(LS_KEY);
    if (raw) {
      var d = JSON.parse(raw);
      if (d && Array.isArray(d.activities)) {
        S.activities = d.activities;
        S.categories = d.categories || [];
        S.nextId = d.nextId || 1;
        S.nextCatId = d.nextCatId || 1;
      }
    }
  } catch(e) {}
  if (S.activities.length === 0) {
    /* seed local */
    var cats = [
      { id:1, nome:'Editorial',cor:'#3B82F6' }, { id:2, nome:'Administrativo',cor:'#F59E0B' },
      { id:3, nome:'Design',cor:'#8B5CF6' }, { id:4, nome:'Cliente XYZ',cor:'#0EA5C4' }
    ];
    var t = todayISO();
    S.categories = cats;
    S.activities = [
      { id:1, titulo:'Revisar posts do LinkedIn', descricao:'Ajustar legendas e hashtags.', categoria:1, stage:'execucao', prioridade:'alta', dataVencimento:addDaysISO(t,1), dataPostagem:addDaysISO(t,2), progress:45, canais:['li'], criadoEm:addDaysISO(t,-3), idCheck:[{text:'Listar temas',done:true},{text:'Escrever legendas',done:true},{text:'Aprovar',done:false}] },
      { id:2, titulo:'Fechar nota fiscal', descricao:'Conferir valores do mês.', categoria:2, stage:'espera', prioridade:'media', dataVencimento:addDaysISO(t,4), progress:20, canais:[], criadoEm:addDaysISO(t,-7), idCheck:[] },
      { id:3, titulo:'Layout para stories', descricao:'3 opções de moldura.', categoria:3, stage:'validando', prioridade:'media', dataVencimento:addDaysISO(t,-1), progress:80, canais:['ig','fb'], criadoEm:addDaysISO(t,-6), idCheck:[{text:'Rascunho A',done:true},{text:'Rascunho B',done:true}] }
    ];
    S.nextId = 20; S.nextCatId = 10;
  }
  /* Persistência imediata + redundância no unload. */
  persistLocalState();
  window.addEventListener('beforeunload', function() {
    persistLocalState();
  });
  /* replace LS save behavior */
  var origToast = toast;
  S._localFallback = true;
  /* Monkey-patch writes to save to localStorage */
  var _originalFiltered = filteredTasks;
  loadComplete();
}

function init() {
  /* theme inicial */
  var st = null;
  try { st = localStorage.getItem('ax:theme'); } catch (e) {}
  applyTheme(st === 'dark' ? 'dark' : 'light', false);
  initConfig();

  /* bindings */
  document.querySelectorAll('.is-nav').forEach(function (b) {
    b.addEventListener('click', function () { changeView(b.getAttribute('data-view')); });
  });
  document.getElementById('btn-sidebar').addEventListener('click', function () {
    var D = document.documentElement;
    if (D.hasAttribute('data-ax-collapsed')) D.removeAttribute('data-ax-collapsed');
    else D.setAttribute('data-ax-collapsed', '');
    try { localStorage.setItem('ax:collapsed', D.hasAttribute('data-ax-collapsed') ? '1' : '0'); } catch (e) {}
  });

  document.getElementById('btn-fab').addEventListener('click', function () { openNewTask('afazer', S.view === 'editorial'); });
  document.getElementById('header-search').addEventListener('input', function (e) {
    handleHeaderSearch(e.target.value);
  });
  document.getElementById('lista-search').addEventListener('input', function (e) { S.listQ = e.target.value; buildListBody(); });

  document.addEventListener('click', function (event) {
    var wrap = document.getElementById('lista-stage-filter-wrap');
    var menu = document.getElementById('lista-stage-filter-menu');
    var trigger = document.getElementById('lista-stage-filter');
    if (!wrap || !menu || !trigger || wrap.contains(event.target)) return;
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  });
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    var menu = document.getElementById('lista-stage-filter-menu');
    var trigger = document.getElementById('lista-stage-filter');
    if (menu && trigger) { menu.hidden = true; trigger.setAttribute('aria-expanded', 'false'); }
  });
  document.getElementById('lista-cat-filter').addEventListener('change', function () { setListCat(Number(this.value) || 'all'); });
  document.getElementById('btn-export').addEventListener('click', exportBackup);
  document.getElementById('btn-import').addEventListener('click', importBackup);
  document.getElementById('import-file').addEventListener('change', function (e) {
    var input = e.target;
    var f = input.files && input.files[0];
    if (!f) return;
    var btn = document.getElementById('btn-import');
    if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); }
    var rd = new FileReader();
    rd.onerror = function () {
      if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); }
      input.value = '';
      toast('Não foi possível ler o arquivo.', 'error');
    };
    rd.onload = function () {
      try {
        var data = normalizeBackupData(JSON.parse(rd.result));
        var confirmed = window.confirm('A importação substituirá as tarefas e categorias atuais. Deseja continuar?');
        if (!confirmed) return;
        persistImportedBackup(data).then(function () {
          renderAll();
          renderAllFilters();
          toast('Backup importado e salvo com sucesso');
        }).catch(function (err) {
          console.error('Erro ao persistir backup:', err);
          toast('Não foi possível salvar o backup.', 'error');
        }).then(function () {
          if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); }
          input.value = '';
        });
      } catch (err) {
        console.error('Arquivo de backup inválido:', err);
        if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); }
        input.value = '';
        toast(err.message || 'Arquivo inválido.', 'error');
      }
    };
    rd.readAsText(f);
  });

  document.querySelectorAll('[data-lis-view]').forEach(function (b) {
    b.addEventListener('click', function () { setListMode(b.getAttribute('data-lis-view')); });
  });
  document.querySelectorAll('[data-tm-tab]').forEach(function (b) {
    b.addEventListener('click', function () { setTab(b.getAttribute('data-tm-tab')); });
  });
  document.getElementById('tm-checklist-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); addChecklistItem(); }
  });
  document.getElementById('tmf-stage').addEventListener('change', function () {
    if (this.value === 'concluido') setProgressStep(100);
  });
  document.getElementById('tmf-cat').addEventListener('change', function () {
    updateCanaisTab();
  });

  /* Imagens upload */
  var imgDrop = document.getElementById('tm-imagens-drop');
  var imgInput = document.getElementById('tm-imagens-input');
  if (imgDrop) {
    imgDrop.addEventListener('click', function () { imgInput.click(); });
    imgDrop.addEventListener('dragover', function (e) { e.preventDefault(); imgDrop.style.borderColor = 'var(--ax-accent)'; });
    imgDrop.addEventListener('dragleave', function () { imgDrop.style.borderColor = ''; });
    imgDrop.addEventListener('drop', function (e) { e.preventDefault(); imgDrop.style.borderColor = ''; uploadImages(e.dataTransfer.files); });
  }
  if (imgInput) {
    imgInput.addEventListener('change', function () { uploadImages(this.files); this.value = ''; });
  }
  document.querySelectorAll('.ax-overlay').forEach(function (ov) {
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.classList.remove('open'); });
  });
  /* Fechar o dropdown de prioridade ao clicar fora. */
  document.addEventListener('click', function(e) {
    var drop = document.getElementById('prio-drop');
    if (drop && !e.target.closest('#tm-hero-prio') && !e.target.closest('#prio-drop')) closePrioDropdown();
  });

  document.getElementById('cfg-theme-light').addEventListener('click', function () { applyTheme('light', true); });
  document.getElementById('cfg-theme-dark').addEventListener('click', function () { applyTheme('dark', true); });

  /* atalhos */
  document.addEventListener('keydown', function (e) {
    /* Esc fecha modals */
    if (e.key === 'Escape') {
      if (document.getElementById('prio-drop')) { closePrioDropdown(); e.preventDefault(); return; }
      var taskModal = document.getElementById('task-modal');
      var catModal = document.getElementById('cat-modal');
      var confirmModal = document.getElementById('confirm-modal');
      var customizer = document.getElementById('ax-customizer');
      if (customizer && customizer.classList.contains('is-open')) { closeCustomizer(); return; }
      if (confirmModal && confirmModal.classList.contains('open')) { closeConfirm(); return; }
      if (taskModal && taskModal.classList.contains('open')) { closeTaskModal(); return; }
      if (catModal && catModal.classList.contains('open')) { closeCategoryModal(); return; }
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
        e.target.blur(); return;
      }
      return;
    }
    /* Ctrl+Enter salva tarefa */
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      var tm = document.getElementById('task-modal');
      if (tm && tm.classList.contains('open')) { e.preventDefault(); saveTask(); return; }
    }
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
      return;
    }
    if (e.key === '/') { e.preventDefault(); document.getElementById('header-search').focus(); }
    else if (e.key.toLowerCase() === 'n') openNewTask();
    else if (e.key.toLowerCase() === 't') toggleTheme();
    else if (e.key === '[') document.getElementById('btn-sidebar').click();
  });

  /* auth gate */
  var authGate = document.getElementById('auth-gate');
  var authLoading = document.getElementById('auth-loading');
  var authMain = document.getElementById('auth-main');
  var appView = document.getElementById('app-view');
  if (!_auth || !_firebaseReady) {
    if (window.location.protocol === 'file:') {
      if (authLoading) authLoading.style.display = 'none';
      if (authGate) authGate.style.display = 'none';
      if (appView) {
        appView.classList.remove('hidden');
        appView.style.display = '';
      }
      if (!window._tarefasInit) {
        window._tarefasInit = true;
        loadLocalFallback();
      }
    } else {
      showLogin('Não foi possível inicializar o Firebase. Recarregue a página.');
    }
  } else {
    _auth.onAuthStateChanged(function (user) {
      if (user) showAppForUser(user);
      else if (!_activeUser && !window._googleLoginInProgress) showLogin();
    }, function (error) {
      console.error('Firebase auth state error:', error);
      if (!_activeUser) showLogin('Erro ao verificar sua sessão: ' + (error.message || 'tente novamente.'));
    });
  }
}

document.addEventListener('DOMContentLoaded', init);

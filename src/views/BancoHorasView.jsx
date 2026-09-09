import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useHub, fmtDateFull, USER_ROLES } from '../context/HubContext';
import { db } from '../firebase';
import {
  Clock,
  Flame,
  Gift,
  Edit2,
  Trash2,
  Trophy,
  Users,
  User,
  Calendar,
  CheckCircle2,
  Download,
  Plus,
  ArrowRight,
  Briefcase,
  Save,
  LogIn,
  LogOut,
  RefreshCw,
  CalendarDays
} from 'lucide-react';

const BH_LEVELS = [
  { name: 'Estagiário', minXP: 0, icon: '🌱' },
  { name: 'Júnior', minXP: 50, icon: '🔵' },
  { name: 'Pleno', minXP: 150, icon: '⚡' },
  { name: 'Sênior', minXP: 300, icon: '🔥' },
  { name: 'Lead', minXP: 500, icon: '💎' },
  { name: 'Manager', minXP: 800, icon: '👑' },
  { name: 'Diretor', minXP: 1200, icon: '🏆' }
];

const BH_DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const BH_DIAS_COMPLETO = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

function getInitials(name = '') {
  const p = name.trim().split(/\s+/);
  if (p.length === 0 || !p[0]) return 'M';
  if (p.length === 1) return p[0].substring(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function parseTime(t) {
  if (!t || typeof t !== 'string' || !t.includes(':')) return 0;
  const parts = t.split(':').map(Number);
  return (parts[0] || 0) + (parts[1] || 0) / 60;
}

function fmtTime(dec) {
  const s = dec < 0 ? '-' : '';
  const a = Math.abs(dec);
  const hrs = Math.floor(a);
  const mins = Math.round((a - hrs) * 60);
  return `${s}${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export default function BancoHorasView() {
  const {
    user,
    registeredUsers,
    isAdmin,
    isMaster,
    showToast,
    showConfirm,
    MASTER_ADMIN_EMAIL
  } = useHub();

  // Seleção de Usuário: ADM Master pode selecionar qualquer membro; Colaborador fica travado no próprio
  const [selectedUserId, setSelectedUserId] = useState(() => user?.uid || null);

  const isViewingSelf = !selectedUserId || (user?.uid && selectedUserId === user.uid);

  useEffect(() => {
    if (!selectedUserId && user?.uid) {
      setSelectedUserId(user.uid);
    }
  }, [user, selectedUserId]);

  useEffect(() => {
    if (!isAdmin && user?.uid && selectedUserId !== user.uid) {
      setSelectedUserId(user.uid);
    }
  }, [isAdmin, user, selectedUserId]);

  const teamOptions = useMemo(() => {
    let list = Array.isArray(registeredUsers) && registeredUsers.length > 0
      ? [...registeredUsers]
      : [];

    if (list.length === 0 && user) {
      list.push({
        id: user.uid,
        uid: user.uid,
        nome: user.displayName || 'Weverson Nascimento',
        displayName: user.displayName || 'Weverson Nascimento',
        email: user.email || MASTER_ADMIN_EMAIL,
        cargo: isMaster ? 'ADM Master & Coordenador' : 'Colaborador',
        role: isMaster ? 'admin_master' : 'colaborador'
      });
    }

    return list.sort((a, b) => {
      const aIsSelf = (a.uid === user?.uid || a.id === user?.uid);
      const bIsSelf = (b.uid === user?.uid || b.id === user?.uid);
      if (aIsSelf) return -1;
      if (bIsSelf) return 1;
      return (a.nome || a.displayName || '').localeCompare(b.nome || b.displayName || '', 'pt-BR');
    });
  }, [registeredUsers, user, isMaster, MASTER_ADMIN_EMAIL]);

  const selectedUserObj = useMemo(() => {
    if (!selectedUserId) return user;
    const found = teamOptions.find((u) => u.uid === selectedUserId || u.id === selectedUserId);
    if (found) return found;
    if (user && (user.uid === selectedUserId || user.id === selectedUserId)) return user;
    return {
      uid: selectedUserId,
      id: selectedUserId,
      nome: 'Colaborador',
      displayName: 'Colaborador',
      email: '—',
      cargo: 'Colaborador de Marketing',
      foto: '',
      photoURL: '',
      role: 'colaborador'
    };
  }, [selectedUserId, teamOptions, user]);

  const defaultConfig = {
    salario: 0,
    entrada: '07:50',
    saida: '17:38',
    horasAlmoco: 1,
    diasSemana: [1, 2, 3, 4, 5],
    saldoInicialMin: 0
  };

  const [config, setConfig] = useState(defaultConfig);
  const [registros, setRegistros] = useState([]);
  const [manualRecords, setManualRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [bhTab, setBhTab] = useState('ponto');

  const [filterMonth, setFilterMonth] = useState(() =>
    new Date().toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase()
  );

  const [pontoDate, setPontoDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [pontoEntrada, setPontoEntrada] = useState('');
  const [pontoSaida, setPontoSaida] = useState('');

  const [manualRef, setManualRef] = useState('');
  const [manualHrs, setManualHrs] = useState('');
  const [manualTipo, setManualTipo] = useState('negativo');
  const [manualMotivo, setManualMotivo] = useState('');

  // Relógio ao vivo
  const [liveTime, setLiveTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setLiveTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Referência Firestore do usuário atualmente inspecionado
  const targetUserRef = useMemo(() => {
    if (!selectedUserId) return null;
    return db.collection('users').doc(selectedUserId);
  }, [selectedUserId]);

  // Sincronização em tempo real dos dados do usuário selecionado
  useEffect(() => {
    if (!targetUserRef) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    const unsubConfig = targetUserRef.collection('config').doc('main').onSnapshot((cfg) => {
      if (cfg.exists) {
        const data = cfg.data() || {};
        setConfig({
          ...defaultConfig,
          ...data,
          diasSemana: Array.isArray(data.diasSemana) ? data.diasSemana : defaultConfig.diasSemana
        });
      } else {
        setConfig(defaultConfig);
      }
    }, (err) => console.warn('[Ponto Config]', err));

    const unsubRegs = targetUserRef.collection('registros').orderBy('date', 'desc').onSnapshot((snap) => {
      setRegistros(snap.docs.map((d) => ({ ...d.data(), id: d.id, date: d.data().date || d.id })));
    }, (err) => console.warn('[Ponto Registros]', err));

    const unsubManual = targetUserRef.collection('manual').onSnapshot((snap) => {
      setManualRecords(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
      setLoading(false);
      clearTimeout(safetyTimer);
    }, (e) => {
      console.warn('[Ponto Manual]', e);
      setLoading(false);
      clearTimeout(safetyTimer);
    });

    return () => {
      clearTimeout(safetyTimer);
      unsubConfig();
      unsubRegs();
      unsubManual();
    };
  }, [selectedUserId, targetUserRef]);

  const expectedHours = useMemo(() => {
    const w = parseTime(config.saida) - parseTime(config.entrada) - (config.horasAlmoco || 0);
    return w > 0 ? w : 8.8;
  }, [config]);

  const isWorkDay = useCallback((d) => {
    if (!d) return false;
    const dt = new Date(d + 'T12:00:00');
    if (isNaN(dt.getTime())) return false;
    const dias = Array.isArray(config?.diasSemana) ? config.diasSemana : [1, 2, 3, 4, 5];
    return dias.includes(dt.getDay());
  }, [config?.diasSemana]);

  const getMonthKey = useCallback((d) => {
    if (!d) return '';
    const dt = new Date(d + 'T12:00:00');
    if (isNaN(dt.getTime())) return '';
    return dt.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase();
  }, []);

  const allMonths = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) =>
      new Date(new Date().getFullYear(), i, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase()
    );
  }, []);

  const stats = useMemo(() => {
    const si = (config?.saldoInicialMin || 0) / 60;
    let tb = si, xp = 0, tp = Array.isArray(registros) ? registros.length : 0, st = 0, cs = 0;

    (Array.isArray(registros) ? registros : [])
      .slice()
      .sort((a, b) => String(a?.date || '').localeCompare(String(b?.date || '')))
      .forEach((r) => {
        if (r?.entrada && r?.saida && isWorkDay(r.date)) {
          const w = parseTime(r.saida) - parseTime(r.entrada) - (config?.horasAlmoco || 0);
          const d = w - expectedHours;
          tb += d;
          if (d > 0) { cs++; xp += Math.round(d * 10); } else { cs = 0; }
          if (cs > st) st = cs;
        }
      });

    (Array.isArray(manualRecords) ? manualRecords : []).forEach((r) => {
      const dec = Number(r?.decimal) || parseTime(r?.hrsStr);
      tb += r?.tipo === 'positivo' ? dec : -dec;
      xp += r?.tipo === 'positivo' ? Math.round(dec * 5) : 0;
    });

    xp += tp * 5;
    const lv = BH_LEVELS.slice().reverse().find((l) => xp >= l.minXP) || BH_LEVELS[0];
    const nl = BH_LEVELS[BH_LEVELS.indexOf(lv) + 1];
    const xpP = nl ? ((xp - lv.minXP) / (nl.minXP - lv.minXP)) * 100 : 100;
    const dpf = expectedHours > 0 ? Math.ceil(expectedHours) : 8;
    const fp = tb >= dpf ? Math.floor(tb / dpf) : 0;
    const hpp = tb >= 0 ? dpf - (tb % dpf) : dpf + tb;

    return { totalBalance: tb, totalXP: xp, totalPontos: tp, streak: st, currentStreak: cs, level: lv, nextLevel: nl, xpProgress: xpP, folgasPossiveis: fp, horasParaProxFolga: hpp };
  }, [registros, manualRecords, config, expectedHours, isWorkDay]);

  const filteredTime = useMemo(() => {
    if (!Array.isArray(registros)) return [];
    return registros
      .filter((r) => r?.date && getMonthKey(r.date) === filterMonth)
      .sort((a, b) => String(b?.date || '').localeCompare(String(a?.date || '')));
  }, [registros, filterMonth, getMonthKey]);

  const filteredManual = useMemo(() => {
    if (!Array.isArray(manualRecords)) return [];
    return manualRecords.filter((r) => r?.ref === filterMonth);
  }, [manualRecords, filterMonth]);

  const monthBalance = useMemo(() => {
    let b = 0;
    filteredTime.forEach((r) => {
      if (r?.entrada && r?.saida && isWorkDay(r.date)) {
        b += (parseTime(r.saida) - parseTime(r.entrada) - (config?.horasAlmoco || 0)) - expectedHours;
      }
    });
    filteredManual.forEach((r) => {
      const dec = Number(r?.decimal) || parseTime(r?.hrsStr);
      b += r?.tipo === 'positivo' ? dec : -dec;
    });
    return b;
  }, [filteredTime, filteredManual, config, expectedHours, isWorkDay]);

  // Registro de Hoje
  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayRecord = useMemo(() => {
    return registros.find((r) => r.date === todayISO) || null;
  }, [registros, todayISO]);

  // Ação Rápida: Bater Entrada ou Saída com a hora atual
  const handleQuickPunch = async (tipo) => {
    if (!targetUserRef) return;
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const existing = registros.find((r) => r.date === today) || {};
    const entrada = tipo === 'entrada' ? timeStr : (existing.entrada || '');
    const saida = tipo === 'saida' ? timeStr : (existing.saida || '');

    const w = entrada && saida ? parseTime(saida) - parseTime(entrada) - (config.horasAlmoco || 0) : 0;
    const d = w - expectedHours;
    const ss = (d >= 0 ? '+' : '-') + fmtTime(Math.abs(d));

    const rec = {
      date: today,
      entrada,
      saida,
      saldo: (entrada && saida) ? ss : '--',
      updatedAt: now.toISOString(),
      updatedBy: user?.displayName || user?.email || 'Sistema'
    };

    try {
      await targetUserRef.collection('registros').doc(today).set(rec, { merge: true });
      showToast?.(`${tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso às ${timeStr}!`, 'success');
      if (pontoDate === today) {
        if (tipo === 'entrada') setPontoEntrada(timeStr);
        if (tipo === 'saida') setPontoSaida(timeStr);
      }
    } catch (err) {
      console.error('[QuickPunch]', err);
      showToast?.('Erro ao registrar ponto: ' + err.message, 'error');
    }
  };

  const handleSavePonto = async () => {
    if (!pontoDate || !targetUserRef) return;
    const w = pontoEntrada && pontoSaida ? parseTime(pontoSaida) - parseTime(pontoEntrada) - (config.horasAlmoco || 0) : 0;
    const d = w - expectedHours;
    const ss = (d >= 0 ? '+' : '-') + fmtTime(Math.abs(d));
    const rec = {
      date: pontoDate,
      entrada: pontoEntrada || '',
      saida: pontoSaida || '',
      saldo: (pontoEntrada && pontoSaida) ? ss : '--',
      updatedAt: new Date().toISOString(),
      updatedBy: user?.displayName || user?.email || 'Sistema'
    };

    try {
      await targetUserRef.collection('registros').doc(pontoDate).set(rec, { merge: true });
      showToast?.('Registro de ponto salvo com sucesso!', 'success');
      setPontoEntrada('');
      setPontoSaida('');
      setPontoDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      console.error('[SavePonto]', err);
      showToast?.('Erro ao salvar ponto: ' + err.message, 'error');
    }
  };

  const handleEditPonto = (r) => {
    setPontoDate(r.date);
    setPontoEntrada(r.entrada || '');
    setPontoSaida(r.saida || '');
    setBhTab('ponto');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePonto = (param) => {
    if (!targetUserRef) {
      showToast?.('Usuário não selecionado ou sessão não iniciada.', 'warning');
      return;
    }

    const docId = typeof param === 'string' ? param : (param?.id || param?.date);
    const dateLabel = typeof param === 'string' ? param : (param?.date || param?.id || '');

    if (!docId) {
      showToast?.('Identificador de registro não encontrado.', 'warning');
      return;
    }

    const doDelete = async () => {
      try {
        await targetUserRef.collection('registros').doc(docId).delete();
        if (typeof param === 'object' && param?.date && param.date !== docId) {
          await targetUserRef.collection('registros').doc(param.date).delete().catch(() => {});
        }
        showToast?.('Registro de ponto removido com sucesso.', 'info');
      } catch (err) {
        console.error('[DeletePonto]', err);
        showToast?.('Erro ao excluir registro: ' + err.message, 'error');
      }
    };

    const formattedDate = fmtDateFull(dateLabel);
    const promptMessage = `Deseja realmente excluir o ponto do dia ${formattedDate}?`;

    if (showConfirm) {
      showConfirm({
        title: 'Excluir Ponto',
        message: promptMessage,
        confirmText: 'Excluir',
        confirmTone: 'danger',
        onConfirm: doDelete
      });
    } else if (window.confirm(promptMessage)) {
      doDelete();
    }
  };

  const handleSaveManual = async () => {
    if (!manualRef || !manualHrs || !targetUserRef) {
      showToast?.('Preencha o mês de referência e a quantidade de horas.', 'warning');
      return;
    }
    const rec = {
      id: Date.now(),
      ref: manualRef,
      hrsStr: manualHrs,
      tipo: manualTipo,
      motivo: manualMotivo || 'Ajuste manual',
      decimal: parseTime(manualHrs),
      createdAt: new Date().toISOString(),
      createdBy: user?.displayName || user?.email || 'Sistema'
    };

    try {
      await targetUserRef.collection('manual').doc(String(rec.id)).set(rec);
      showToast?.('Lançamento manual registrado no Banco!', 'success');
      setManualRef('');
      setManualHrs('');
      setManualMotivo('');
      setManualTipo('negativo');
    } catch (err) {
      showToast?.('Erro ao lançar horas: ' + err.message, 'error');
    }
  };

  const handleDeleteManual = (param) => {
    if (!targetUserRef) {
      showToast?.('Usuário não selecionado ou sessão não iniciada.', 'warning');
      return;
    }

    const docId = typeof param === 'object' && param !== null ? (param.id || param.docId) : param;
    if (!docId) {
      showToast?.('Identificador de lançamento não encontrado.', 'warning');
      return;
    }

    const doDelete = async () => {
      try {
        await targetUserRef.collection('manual').doc(String(docId)).delete();
        showToast?.('Lançamento manual excluído com sucesso.', 'info');
      } catch (err) {
        console.error('[DeleteManual]', err);
        showToast?.('Erro ao excluir lançamento: ' + err.message, 'error');
      }
    };

    const promptMessage = 'Deseja excluir este lançamento de horas do banco?';

    if (showConfirm) {
      showConfirm({
        title: 'Excluir Lançamento',
        message: promptMessage,
        confirmText: 'Excluir',
        confirmTone: 'danger',
        onConfirm: doDelete
      });
    } else if (window.confirm(promptMessage)) {
      doDelete();
    }
  };

  const handleSaveConfig = async () => {
    if (!targetUserRef) return;
    setSavingConfig(true);
    try {
      await targetUserRef.collection('config').doc('main').set(config, { merge: true });
      showToast?.('Jornada de trabalho atualizada com sucesso!', 'success');
    } catch (err) {
      showToast?.('Erro ao salvar jornada: ' + err.message, 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleExportCSV = () => {
    if (registros.length === 0) {
      showToast?.('Não há registros para exportar.', 'warning');
      return;
    }
    const headers = ['Data', 'Dia', 'Entrada', 'Saida', 'Saldo'];
    const rows = registros.map((r) => {
      const d = new Date(r.date + 'T12:00:00');
      return [
        r.date,
        BH_DIAS[d.getDay()] || '',
        r.entrada || '',
        r.saida || '',
        r.saldo || ''
      ];
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const userNameSanitized = (selectedUserObj?.nome || selectedUserObj?.displayName || 'colaborador').replace(/\s+/g, '_');
    link.setAttribute('download', `folha_ponto_${userNameSanitized}_${filterMonth.replace('/', '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast?.('Folha de ponto exportada em CSV com sucesso!', 'success');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[320px] text-center gap-3">
        <RefreshCw size={28} className="animate-spin text-[var(--color-primary)] opacity-70" />
        <p className="text-xs text-[var(--color-muted)] font-medium">Carregando dados do ponto...</p>
      </div>
    );
  }

  const tabButtons = [
    { id: 'ponto', label: isViewingSelf ? 'Meu Ponto' : 'Bater / Ajustar Ponto', icon: Clock },
    ...(isAdmin ? [{ id: 'equipe', label: 'Equipe Makro', icon: Users }] : []),
    { id: 'dashboard', label: 'Visão Geral & XP', icon: Trophy },
    { id: 'banco', label: 'Banco de Horas', icon: CalendarDays },
    { id: 'ajustes', label: 'Jornada & Config', icon: Briefcase }
  ];

  const userRoleKey = selectedUserObj?.role || (selectedUserObj?.email === MASTER_ADMIN_EMAIL ? 'admin_master' : 'colaborador');
  const roleConfig = (USER_ROLES && USER_ROLES[userRoleKey]) || (USER_ROLES && USER_ROLES.colaborador) || {
    badgeClass: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
    icon: '👤',
    label: 'Colaborador',
    description: 'Colaborador Makro'
  };

  return (
    <div className="space-y-6 pb-12">
      {/* SELETOR DE COLABORADOR / BANNER DE CONTEXTO */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Card do Usuário Selecionado */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative flex-shrink-0">
              {selectedUserObj?.photoURL || selectedUserObj?.foto ? (
                <img
                  src={selectedUserObj.photoURL || selectedUserObj.foto}
                  alt={selectedUserObj.nome || 'Avatar'}
                  className="w-12 h-12 rounded-full object-cover border-2 border-[var(--color-border)] shadow-xs"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] text-white font-bold text-sm flex items-center justify-center shadow-xs">
                  {getInitials(selectedUserObj?.nome || selectedUserObj?.displayName || selectedUserObj?.email || 'M')}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[var(--color-surface)]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-[var(--color-heading)] truncate">
                  {selectedUserObj?.nome || selectedUserObj?.displayName || 'Colaborador Makro'}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${roleConfig.badgeClass}`}
                  title={roleConfig.description}
                >
                  <span>{roleConfig.icon}</span>
                  <span>{roleConfig.label}</span>
                </span>
                {isViewingSelf ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[var(--color-primary-light)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                    Seu Perfil
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                    Inspecionando Equipe
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--color-muted)] truncate mt-0.5">
                {selectedUserObj?.cargo || 'Colaborador de Marketing'} • {selectedUserObj?.email || '—'}
              </p>
            </div>
          </div>

          {/* Controles de Seleção (Exclusivo para Super ADM / Admin) */}
          {isAdmin && (
            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <div className="relative min-w-[220px]">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] mb-1">
                  Selecionar Colaborador
                </label>
                <div className="relative">
                  <select
                    value={selectedUserId || ''}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full h-9 pl-8 pr-8 text-xs font-semibold rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-heading)] focus:outline-hidden focus:border-[var(--color-primary)] transition appearance-none cursor-pointer"
                  >
                    {teamOptions.map((m) => (
                      <option key={m.uid || m.id} value={m.uid || m.id}>
                        {m.nome || m.displayName || m.email} {m.uid === user?.uid ? '(Você)' : ''}
                      </option>
                    ))}
                  </select>
                  <Users size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)] pointer-events-none" />
                </div>
              </div>

              {!isViewingSelf && (
                <button
                  type="button"
                  onClick={() => setSelectedUserId(user?.uid)}
                  className="mt-4 sm:mt-0 self-end h-9 px-3 rounded-lg text-xs font-semibold bg-[var(--color-bg)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-heading)] transition flex items-center gap-1.5 whitespace-nowrap"
                  title="Voltar para seu próprio cartão de ponto"
                >
                  <User size={14} className="text-[var(--color-primary)]" />
                  <span>Meu Ponto</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* NAVEGAÇÃO ENTRE ABAS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[var(--color-border)]">
        {tabButtons.map((t) => {
          const Icon = t.icon;
          const isActive = bhTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setBhTab(t.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-[var(--color-primary)] text-white shadow-xs'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-surface)]'
              }`}
            >
              <Icon size={15} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ABA 1: BATER / AJUSTAR PONTO */}
      {bhTab === 'ponto' && (
        <div className="space-y-6">
          {/* CARTÃO DE PONTO AO VIVO (PUNCH CLOCK) */}
          <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-hover)] border border-[var(--color-border)] shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Relógio Digital */}
              <div>
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)] mb-1">
                  <Clock size={14} />
                  <span>Controle em Tempo Real</span>
                </div>
                <div className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-[var(--color-heading)]">
                  {liveTime}
                </div>
                <p className="text-xs text-[var(--color-muted)] mt-1 font-medium capitalize">
                  {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>

              {/* Botões de Ação Imediata */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleQuickPunch('entrada')}
                  className="flex-1 sm:flex-initial h-12 px-5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white shadow-xs transition flex items-center justify-center gap-2"
                >
                  <LogIn size={16} />
                  <span>Bater Entrada</span>
                  {todayRecord?.entrada && (
                    <span className="ml-1 text-[10px] bg-emerald-800/60 px-1.5 py-0.5 rounded font-mono">
                      {todayRecord.entrada}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickPunch('saida')}
                  className="flex-1 sm:flex-initial h-12 px-5 rounded-xl text-xs font-bold bg-[var(--color-primary)] hover:brightness-110 active:scale-[0.98] text-white shadow-xs transition flex items-center justify-center gap-2"
                >
                  <LogOut size={16} />
                  <span>Bater Saída</span>
                  {todayRecord?.saida && (
                    <span className="ml-1 text-[10px] bg-black/20 px-1.5 py-0.5 rounded font-mono">
                      {todayRecord.saida}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Status do Dia Atual */}
            <div className="mt-5 pt-4 border-t border-[var(--color-border)] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-muted)] block">Entrada Hoje</span>
                <span className="text-sm font-bold font-mono text-[var(--color-heading)] mt-0.5 block">
                  {todayRecord?.entrada || '--:--'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-muted)] block">Almoço Previsto</span>
                <span className="text-sm font-bold font-mono text-[var(--color-heading)] mt-0.5 block">
                  {config.horasAlmoco}h
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-muted)] block">Saída Hoje</span>
                <span className="text-sm font-bold font-mono text-[var(--color-heading)] mt-0.5 block">
                  {todayRecord?.saida || '--:--'}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-muted)] block">Saldo Hoje</span>
                <span
                  className="text-sm font-bold font-mono mt-0.5 block"
                  style={{
                    color: typeof todayRecord?.saldo === 'string' && todayRecord.saldo.startsWith('+')
                      ? 'var(--color-success)'
                      : (typeof todayRecord?.saldo === 'string' && todayRecord.saldo.startsWith('-') ? 'var(--color-danger)' : 'var(--color-muted)')
                  }}
                >
                  {todayRecord?.saldo || '--'}
                </span>
              </div>
            </div>
          </div>

          {/* FILTRO DE MÊS & RESUMO MENSAL */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
              {allMonths.map((m) => (
                <button
                  key={m}
                  onClick={() => setFilterMonth(m)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase whitespace-nowrap transition ${
                    filterMonth === m
                      ? 'bg-[var(--color-heading)] text-[var(--color-bg)] shadow-xs'
                      : 'bg-[var(--color-surface)] text-[var(--color-muted)] hover:text-[var(--color-heading)] border border-[var(--color-border)]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="h-9 px-3 rounded-lg text-xs font-semibold bg-[var(--color-surface)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] text-[var(--color-heading)] transition flex items-center gap-1.5 shadow-xs"
                title="Exportar folha de ponto em formato CSV"
              >
                <Download size={14} />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* BANNER DO SALDO DO MÊS */}
          <div
            className="p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            style={{
              backgroundColor: monthBalance >= 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              borderColor: monthBalance >= 0 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'
            }}
          >
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                Balanço de Horas ({filterMonth})
              </span>
              <div
                className="text-3xl font-black mt-1 font-mono tracking-tight"
                style={{ color: monthBalance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}
              >
                {(monthBalance >= 0 ? '+' : '') + fmtTime(monthBalance)}
              </div>
              <p className="text-xs text-[var(--color-muted)] mt-1">
                Base calculada sobre jornada padrão de {expectedHours.toFixed(2)}h úteis/dia.
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="p-3 rounded-xl bg-[var(--color-surface)]/80 border border-[var(--color-border)] text-center min-w-[110px]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-muted)] block">Dias Registrados</span>
                <span className="text-base font-bold text-[var(--color-heading)] block mt-0.5">
                  {filteredTime.length}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[var(--color-surface)]/80 border border-[var(--color-border)] text-center min-w-[110px]">
                <span className="text-[10px] uppercase font-bold text-[var(--color-muted)] block">Ajustes Manuais</span>
                <span className="text-base font-bold text-[var(--color-heading)] block mt-0.5">
                  {filteredManual.length}
                </span>
              </div>
            </div>
          </div>

          {/* FORMULÁRIO DE REGISTRO / AJUSTE MANUAL */}
          <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-1.5">
                <Edit2 size={14} />
                <span>Lançar ou Ajustar Registro de Ponto</span>
              </span>
              <span className="text-[11px] text-[var(--color-muted)]">
                Para: <strong className="text-[var(--color-heading)]">{selectedUserObj?.nome || selectedUserObj?.displayName}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[var(--color-muted)] mb-1">Data</label>
                <input
                  type="date"
                  value={pontoDate}
                  onChange={(e) => setPontoDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg text-xs font-semibold bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-heading)] focus:outline-hidden focus:border-[var(--color-primary)] transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold uppercase text-[var(--color-muted)]">Entrada</label>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      setPontoEntrada(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
                    }}
                    className="text-[10px] text-[var(--color-primary)] hover:underline font-bold"
                  >
                    Agora
                  </button>
                </div>
                <input
                  type="time"
                  value={pontoEntrada}
                  onChange={(e) => setPontoEntrada(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg text-xs font-semibold font-mono bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-heading)] focus:outline-hidden focus:border-[var(--color-primary)] transition text-center"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold uppercase text-[var(--color-muted)]">Saída</label>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      setPontoSaida(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`);
                    }}
                    className="text-[10px] text-[var(--color-primary)] hover:underline font-bold"
                  >
                    Agora
                  </button>
                </div>
                <input
                  type="time"
                  value={pontoSaida}
                  onChange={(e) => setPontoSaida(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg text-xs font-semibold font-mono bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-heading)] focus:outline-hidden focus:border-[var(--color-primary)] transition text-center"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSavePonto}
              className="mt-3.5 w-full h-10 rounded-lg text-xs font-bold bg-[var(--color-primary)] hover:brightness-110 active:scale-[0.99] text-white transition flex items-center justify-center gap-2 shadow-xs"
            >
              <Save size={15} />
              <span>Salvar Registro de Ponto</span>
            </button>
          </div>

          {/* TABELA DE REGISTROS MENSAIS */}
          <div className="rounded-2xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-heading)]">
                Espelho de Ponto • {filterMonth}
              </h3>
              <span className="text-xs text-[var(--color-muted)] font-medium">
                {filteredTime.length} registro(s) encontrado(s)
              </span>
            </div>

            {filteredTime.length === 0 ? (
              <div className="p-8 text-center text-[var(--color-muted)]">
                <Calendar size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">Nenhum ponto registrado no mês de {filterMonth}.</p>
                <p className="text-[11px] opacity-70 mt-0.5">Utilize os botões de ponto rápido acima para iniciar.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                    <tr>
                      <th className="p-3.5">Data / Dia</th>
                      <th className="p-3.5 text-center">Entrada</th>
                      <th className="p-3.5 text-center">Saída</th>
                      <th className="p-3.5 text-center">Carga Diária</th>
                      <th className="p-3.5 text-center">Saldo</th>
                      <th className="p-3.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {filteredTime.map((r) => {
                      const d = new Date(r.date + 'T12:00:00');
                      const isPos = typeof r?.saldo === 'string' && r.saldo.startsWith('+');
                      const isNeg = typeof r?.saldo === 'string' && r.saldo.startsWith('-');
                      const dayIdx = isNaN(d.getDay()) ? 0 : d.getDay();
                      const dayName = BH_DIAS[dayIdx] || '';
                      const dayComplete = BH_DIAS_COMPLETO[dayIdx] || '';
                      const dateDisplay = !isNaN(d.getDate())
                        ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
                        : (r.date || '--/--');

                      return (
                        <tr key={r.date || r.id} className="hover:bg-[var(--color-surface-hover)] transition">
                          <td className="p-3.5 font-medium text-[var(--color-heading)]">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">
                                {dateDisplay}
                              </span>
                              <span className="text-[11px] text-[var(--color-muted)]" title={dayComplete}>
                                ({dayName})
                              </span>
                              {r.date === todayISO && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                                  Hoje
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5 text-center font-mono font-semibold text-[var(--color-heading)]">
                            {r.entrada || '--:--'}
                          </td>
                          <td className="p-3.5 text-center font-mono font-semibold text-[var(--color-heading)]">
                            {r.saida || '--:--'}
                          </td>
                          <td className="p-3.5 text-center font-mono text-[var(--color-muted)]">
                            {r.entrada && r.saida
                              ? fmtTime(parseTime(r.saida) - parseTime(r.entrada) - (config.horasAlmoco || 0))
                              : '--:--'}
                          </td>
                          <td className="p-3.5 text-center font-mono font-bold">
                            <span
                              className="px-2 py-0.5 rounded-md text-xs inline-block"
                              style={{
                                color: isPos ? 'var(--color-success)' : (isNeg ? 'var(--color-danger)' : 'var(--color-muted)'),
                                backgroundColor: isPos ? 'rgba(16, 185, 129, 0.1)' : (isNeg ? 'rgba(239, 68, 68, 0.1)' : 'transparent')
                              }}
                            >
                              {r.saldo || '--'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEditPonto(r)}
                                className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-bg)] transition"
                                title="Editar Ponto"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePonto(r)}
                                className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-red-500 hover:bg-[var(--color-bg)] transition"
                                title="Excluir Ponto"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 2: EQUIPE MAKRO (EXCLUSIVO SUPER ADM / ADMIN) */}
      {isAdmin && bhTab === 'equipe' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
            <h3 className="text-sm font-bold text-[var(--color-heading)] flex items-center gap-2">
              <Users size={16} className="text-[var(--color-primary)]" />
              <span>Painel de Membros da Equipe Makro</span>
            </h3>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              Selecione qualquer colaborador abaixo para inspecionar ou gerenciar individualmente seu espelho de ponto e banco de horas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {teamOptions.map((member) => {
              const memUid = member.uid || member.id;
              const isSelected = selectedUserId === memUid;
              const mRole = member.role || (member.email === MASTER_ADMIN_EMAIL ? 'admin_master' : 'colaborador');
              const mRoleConfig = USER_ROLES[mRole] || USER_ROLES.colaborador;

              return (
                <div
                  key={memUid}
                  className={`p-4 rounded-2xl bg-[var(--color-surface)] border transition flex flex-col justify-between ${
                    isSelected
                      ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20 shadow-sm'
                      : 'border-[var(--color-border)] hover:border-[var(--color-muted)]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      {member.photoURL || member.foto ? (
                        <img
                          src={member.photoURL || member.foto}
                          alt=""
                          className="w-11 h-11 rounded-full object-cover border border-[var(--color-border)]"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-[var(--color-primary)] text-white font-bold text-xs flex items-center justify-center">
                          {getInitials(member.nome || member.displayName || member.email)}
                        </div>
                      )}
                      {isSelected && (
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[var(--color-primary)] border-2 border-[var(--color-surface)] flex items-center justify-center text-white text-[8px]">
                          ✓
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-bold text-[var(--color-heading)] truncate">
                          {member.nome || member.displayName || member.email}
                        </p>
                        {memUid === user?.uid && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                            Você
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--color-muted)] truncate mt-0.5">{member.email}</p>
                      <div className="mt-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${mRoleConfig.badgeClass}`}
                        >
                          <span>{mRoleConfig.icon}</span>
                          <span>{mRoleConfig.label}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
                    <span className="text-[11px] text-[var(--color-muted)]">
                      {isSelected ? 'Em visualização' : 'Ponto Individual'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUserId(memUid);
                        setBhTab('ponto');
                      }}
                      className={`h-7 px-3 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                        isSelected
                          ? 'bg-[var(--color-primary)] text-white'
                          : 'bg-[var(--color-bg)] hover:bg-[var(--color-surface-hover)] text-[var(--color-heading)] border border-[var(--color-border)]'
                      }`}
                    >
                      <span>{isSelected ? 'Ver Ponto' : 'Acessar'}</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 3: DASHBOARD & GAMIFICAÇÃO */}
      {bhTab === 'dashboard' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Saldo Acumulado */}
            <div className="p-4 sm:p-5 rounded-2xl text-center bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] block mb-1">
                Saldo Acumulado Geral
              </span>
              <div
                className="text-2xl sm:text-3xl font-black font-mono"
                style={{ color: stats.totalBalance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}
              >
                {(stats.totalBalance >= 0 ? '+' : '') + fmtTime(stats.totalBalance)}
              </div>
              <span className="text-[11px] text-[var(--color-muted)] mt-1 block">
                Total consolidado no banco
              </span>
            </div>

            {/* Sequência / Streak */}
            <div className="p-4 sm:p-5 rounded-2xl text-center bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] block mb-1">
                Sequência Pontual
              </span>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <Flame size={24} className="text-amber-500 fill-amber-500" />
                <span className="text-2xl sm:text-3xl font-black text-amber-500 font-mono">
                  {stats.currentStreak} dias
                </span>
              </div>
              <span className="text-[11px] text-[var(--color-muted)] mt-1 block">
                Recorde: {stats.streak} dias consecutivos
              </span>
            </div>

            {/* Folgas Possíveis */}
            <div className="p-4 sm:p-5 rounded-2xl text-center bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] block mb-1">
                Folgas Compensatórias
              </span>
              <div className="flex items-center justify-center gap-1.5 mt-0.5">
                <Gift size={24} className="text-violet-500" />
                <span className="text-2xl sm:text-3xl font-black text-violet-500 font-mono">
                  {stats.folgasPossiveis}
                </span>
              </div>
              <span className="text-[11px] text-[var(--color-muted)] mt-1 block">
                Faltam {fmtTime(stats.horasParaProxFolga)} para a próxima
              </span>
            </div>
          </div>

          {/* Gamificação de XP */}
          <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-amber-500" />
                <span className="text-xs font-bold text-[var(--color-heading)]">
                  Nível de Pontualidade: {stats.level.icon} {stats.level.name}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-[var(--color-primary)]">
                {stats.totalXP} XP
              </span>
            </div>

            <div className="h-2.5 rounded-full overflow-hidden bg-[var(--color-bg)] border border-[var(--color-border)]">
              <div
                className="h-full rounded-full transition-all bg-gradient-to-r from-[var(--color-primary)] to-amber-500"
                style={{ width: `${Math.min(stats.xpProgress, 100)}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[10px] text-[var(--color-muted)] mt-2 font-medium">
              <span>{stats.level.minXP} XP</span>
              <span>{stats.nextLevel ? `Próximo: ${stats.nextLevel.name} (${stats.nextLevel.minXP} XP)` : 'Nível Máximo Alcançado!'}</span>
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: BANCO DE HORAS & AJUSTES MANUAIS */}
      {bhTab === 'banco' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] mb-3 flex items-center gap-2">
              <Plus size={14} />
              <span>Novo Lançamento no Banco de Horas</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-[var(--color-muted)] mb-1">Mês de Referência</label>
                <select
                  value={manualRef}
                  onChange={(e) => setManualRef(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg text-xs font-semibold bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-heading)] focus:outline-hidden focus:border-[var(--color-primary)] transition"
                >
                  <option value="">Selecione o Mês...</option>
                  {allMonths.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[var(--color-muted)] mb-1">Quantidade (Horas:Minutos)</label>
                <input
                  type="time"
                  value={manualHrs}
                  onChange={(e) => setManualHrs(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg text-xs font-semibold font-mono bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-heading)] focus:outline-hidden focus:border-[var(--color-primary)] transition text-center"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-[var(--color-muted)] mb-1">Natureza do Lançamento</label>
                <select
                  value={manualTipo}
                  onChange={(e) => setManualTipo(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg text-xs font-semibold bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-heading)] focus:outline-hidden focus:border-[var(--color-primary)] transition"
                >
                  <option value="negativo">- Compensação / Folga (Débito)</option>
                  <option value="positivo">+ Hora Extra / Bônus (Crédito)</option>
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-[10px] font-bold uppercase text-[var(--color-muted)] mb-1">Motivo / Justificativa</label>
              <input
                type="text"
                placeholder="Ex: Folga compensatória de feriado trabalhado, autorizada pela coordenação."
                value={manualMotivo}
                onChange={(e) => setManualMotivo(e.target.value)}
                className="w-full h-10 px-3 rounded-lg text-xs font-semibold bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-heading)] focus:outline-hidden focus:border-[var(--color-primary)] transition"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveManual}
              className="w-full h-10 rounded-lg text-xs font-bold bg-[var(--color-primary)] hover:brightness-110 active:scale-[0.99] text-white transition flex items-center justify-center gap-2 shadow-xs"
            >
              <Save size={15} />
              <span>Registrar no Banco de Horas</span>
            </button>
          </div>

          {/* Histórico de Lançamentos Manuais */}
          <div className="rounded-2xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs">
            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-heading)]">
                Histórico de Ajustes & Folgas
              </h3>
              <span className="text-xs text-[var(--color-muted)] font-medium">
                {manualRecords.length} lançamento(s)
              </span>
            </div>

            {manualRecords.length === 0 ? (
              <div className="p-8 text-center text-[var(--color-muted)]">
                <CalendarDays size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">Nenhum lançamento manual registrado até o momento.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)] bg-[var(--color-bg)] border-b border-[var(--color-border)]">
                    <tr>
                      <th className="p-3.5">Mês Ref.</th>
                      <th className="p-3.5 text-center">Horas</th>
                      <th className="p-3.5 text-center">Tipo</th>
                      <th className="p-3.5">Motivo</th>
                      <th className="p-3.5 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {manualRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-[var(--color-surface-hover)] transition">
                        <td className="p-3.5 font-bold text-[var(--color-heading)]">{r.ref}</td>
                        <td className="p-3.5 text-center font-mono font-semibold">{r.hrsStr}</td>
                        <td className="p-3.5 text-center font-bold">
                          <span
                            className="px-2 py-0.5 rounded-md text-xs inline-block"
                            style={{
                              color: r.tipo === 'positivo' ? 'var(--color-success)' : 'var(--color-danger)',
                              backgroundColor: r.tipo === 'positivo' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                            }}
                          >
                            {r.tipo === 'positivo' ? '+ Crédito' : '- Débito'}
                          </span>
                        </td>
                        <td className="p-3.5 text-[var(--color-muted)]">{r.motivo || '—'}</td>
                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteManual(r)}
                            className="p-1.5 rounded-lg text-[var(--color-muted)] hover:text-red-500 hover:bg-[var(--color-bg)] transition"
                            title="Excluir Lançamento"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA 5: JORNADA DE TRABALHO & CONFIGURAÇÕES */}
      {bhTab === 'ajustes' && (
        <div className="p-5 sm:p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
            <div>
              <h3 className="text-sm font-bold text-[var(--color-heading)] flex items-center gap-2">
                <Briefcase size={16} className="text-[var(--color-primary)]" />
                <span>Configuração de Jornada de Trabalho</span>
              </h3>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                Defina os horários contratuais e dias de expediente para cálculo automático de horas.
              </p>
            </div>
            <span className="text-[11px] text-[var(--color-muted)] font-medium">
              Colaborador: <strong className="text-[var(--color-heading)]">{selectedUserObj?.nome || selectedUserObj?.displayName}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-[var(--color-muted)] mb-1.5">
                Horário de Entrada Padrão
              </label>
              <input
                type="time"
                value={config.entrada}
                onChange={(e) => setConfig({ ...config, entrada: e.target.value })}
                className="w-full h-10 px-3 rounded-lg text-xs font-semibold font-mono bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-heading)] focus:outline-hidden focus:border-[var(--color-primary)] transition text-center"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-[var(--color-muted)] mb-1.5">
                Horário de Saída Padrão
              </label>
              <input
                type="time"
                value={config.saida}
                onChange={(e) => setConfig({ ...config, saida: e.target.value })}
                className="w-full h-10 px-3 rounded-lg text-xs font-semibold font-mono bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-heading)] focus:outline-hidden focus:border-[var(--color-primary)] transition text-center"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-[var(--color-muted)] mb-1.5">
                Intervalo de Almoço (Horas)
              </label>
              <input
                type="number"
                min="0"
                max="3"
                step="0.5"
                value={config.horasAlmoco}
                onChange={(e) => setConfig({ ...config, horasAlmoco: Number(e.target.value) })}
                className="w-full h-10 px-3 rounded-lg text-xs font-semibold bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-heading)] focus:outline-hidden focus:border-[var(--color-primary)] transition text-center"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-[var(--color-muted)] mb-1.5">
                Saldo Inicial (Horas)
              </label>
              <input
                type="number"
                step="0.5"
                value={(config.saldoInicialMin || 0) / 60}
                onChange={(e) => setConfig({ ...config, saldoInicialMin: Number(e.target.value) * 60 })}
                className="w-full h-10 px-3 rounded-lg text-xs font-semibold bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-heading)] focus:outline-hidden focus:border-[var(--color-primary)] transition text-center"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-[var(--color-muted)] mb-2">
              Dias Úteis de Trabalho
            </label>
            <div className="flex gap-2 flex-wrap">
              {BH_DIAS.map((d, i) => {
                const activeDias = Array.isArray(config?.diasSemana) ? config.diasSemana : [1, 2, 3, 4, 5];
                const on = activeDias.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      const nd = on ? activeDias.filter((x) => x !== i) : [...activeDias, i];
                      setConfig({ ...config, diasSemana: nd });
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                      on
                        ? 'bg-[var(--color-primary)] text-white shadow-xs'
                        : 'bg-[var(--color-bg)] text-[var(--color-muted)] hover:text-[var(--color-heading)] border border-[var(--color-border)]'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="h-10 px-6 rounded-lg text-xs font-bold bg-[var(--color-primary)] hover:brightness-110 active:scale-[0.99] text-white transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              <Save size={15} />
              <span>{savingConfig ? 'Salvando...' : 'Salvar Configuração de Jornada'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

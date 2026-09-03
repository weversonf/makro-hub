import React, { useState, useEffect, useMemo } from 'react';
import { db, auth, googleProvider } from '../firebase';
import { LayoutGrid, Clock, Flame, Gift, Edit2, Trash2, Trophy } from 'lucide-react';

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

function parseTime(t) {
  if (!t || !t.includes(':')) return 0;
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
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

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
  const [bhTab, setBhTab] = useState('dashboard');

  const [filterMonth, setFilterMonth] = useState(() =>
    new Date().toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase()
  );

  const [pontoDate, setPontoDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [pontoEntrada, setPontoEntrada] = useState('');
  const [pontoSaida, setPontoSaida] = useState('');

  const [manualRef, setManualRef] = useState('');
  const [manualHrs, setManualHrs] = useState('');
  const [manualTipo, setManualTipo] = useState('negativo');

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  const getUserRef = () => (user ? db.collection('users').doc(user.uid) : null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const ref = getUserRef();
    if (!ref) return;

    ref.collection('config').doc('main').get().then((cfg) => {
      if (cfg.exists) setConfig({ ...defaultConfig, ...cfg.data() });
    }).catch(console.error);

    ref.collection('registros').orderBy('date', 'desc').get().then((reg) => {
      setRegistros(reg.docs.map((d) => ({ ...d.data(), id: d.id })));
    }).catch(console.error);

    ref.collection('manual').get().then((man) => {
      setManualRecords(man.docs.map((d) => ({ ...d.data(), id: d.id })));
      setLoading(false);
    }).catch((e) => {
      console.error(e);
      setLoading(false);
    });
  }, [user]);

  useEffect(() => {
    if (!loading && user && getUserRef()) {
      getUserRef().collection('config').doc('main').set(config).catch(console.warn);
    }
  }, [config, loading, user]);

  const expectedHours = parseTime(config.saida) - parseTime(config.entrada) - (config.horasAlmoco || 0);

  const isWorkDay = (d) => {
    const dt = new Date(d + 'T12:00:00');
    return config.diasSemana.includes(dt.getDay());
  };

  const getMonthKey = (d) => {
    const dt = new Date(d + 'T12:00:00');
    return dt.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase();
  };

  const allMonths = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) =>
      new Date(new Date().getFullYear(), i, 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).toUpperCase()
    );
  }, []);

  const stats = useMemo(() => {
    const si = (config.saldoInicialMin || 0) / 60;
    let tb = si, xp = 0, tp = registros.length, st = 0, cs = 0;

    registros.slice().sort((a, b) => a.date.localeCompare(b.date)).forEach((r) => {
      if (r.entrada && r.saida && isWorkDay(r.date)) {
        const w = parseTime(r.saida) - parseTime(r.entrada) - (config.horasAlmoco || 0);
        const d = w - expectedHours;
        tb += d;
        if (d > 0) { cs++; xp += Math.round(d * 10); } else { cs = 0; }
        if (cs > st) st = cs;
      }
    });

    manualRecords.forEach((r) => {
      tb += r.tipo === 'positivo' ? r.decimal : -r.decimal;
      xp += r.tipo === 'positivo' ? Math.round(r.decimal * 5) : 0;
    });

    xp += tp * 5;
    const lv = BH_LEVELS.slice().reverse().find((l) => xp >= l.minXP) || BH_LEVELS[0];
    const nl = BH_LEVELS[BH_LEVELS.indexOf(lv) + 1];
    const xpP = nl ? ((xp - lv.minXP) / (nl.minXP - lv.minXP)) * 100 : 100;
    const dpf = expectedHours > 0 ? Math.ceil(expectedHours) : 8;
    const fp = tb >= dpf ? Math.floor(tb / dpf) : 0;
    const hpp = tb >= 0 ? dpf - (tb % dpf) : dpf + tb;

    return { totalBalance: tb, totalXP: xp, totalPontos: tp, streak: st, currentStreak: cs, level: lv, nextLevel: nl, xpProgress: xpP, folgasPossiveis: fp, horasParaProxFolga: hpp };
  }, [registros, manualRecords, config]);

  const filteredTime = useMemo(() => {
    return registros.filter((r) => getMonthKey(r.date) === filterMonth).sort((a, b) => b.date.localeCompare(a.date));
  }, [registros, filterMonth]);

  const filteredManual = useMemo(() => {
    return manualRecords.filter((r) => r.ref === filterMonth);
  }, [manualRecords, filterMonth]);

  const monthBalance = useMemo(() => {
    let b = 0;
    filteredTime.forEach((r) => {
      if (r.entrada && r.saida && isWorkDay(r.date)) {
        b += (parseTime(r.saida) - parseTime(r.entrada) - (config.horasAlmoco || 0)) - expectedHours;
      }
    });
    filteredManual.forEach((r) => {
      b += r.tipo === 'positivo' ? r.decimal : -r.decimal;
    });
    return b;
  }, [filteredTime, filteredManual, config]);

  const handleSavePonto = () => {
    if (!pontoDate || !getUserRef()) return;
    const w = pontoEntrada && pontoSaida ? parseTime(pontoSaida) - parseTime(pontoEntrada) - (config.horasAlmoco || 0) : 0;
    const d = w - expectedHours;
    const ss = (d >= 0 ? '+' : '-') + fmtTime(Math.abs(d));
    const rec = { date: pontoDate, entrada: pontoEntrada, saida: pontoSaida, saldo: ss };
    const ex = registros.find((r) => r.date === pontoDate);
    setRegistros(ex ? registros.map((r) => (r.date === pontoDate ? rec : r)) : [...registros, rec]);
    getUserRef().collection('registros').doc(pontoDate).set(rec, { merge: true });
    setPontoEntrada('');
    setPontoSaida('');
    setPontoDate(new Date().toISOString().split('T')[0]);
  };

  const handleEditPonto = (r) => {
    setPontoDate(r.date);
    setPontoEntrada(r.entrada || '');
    setPontoSaida(r.saida || '');
  };

  const handleDeletePonto = (d) => {
    if (confirm('Excluir este registro de ponto?')) {
      setRegistros(registros.filter((r) => r.date !== d));
      getUserRef()?.collection('registros').doc(d).delete();
    }
  };

  const handleSaveManual = () => {
    if (!manualRef || !manualHrs || !getUserRef()) return;
    const rec = { id: Date.now(), ref: manualRef, hrsStr: manualHrs, tipo: manualTipo, decimal: parseTime(manualHrs) };
    setManualRecords([...manualRecords, rec]);
    getUserRef().collection('manual').doc(String(rec.id)).set(rec);
    setManualRef('');
    setManualHrs('');
    setManualTipo('negativo');
  };

  const handleDeleteManual = (id) => {
    if (confirm('Excluir este lançamento manual?')) {
      setManualRecords(manualRecords.filter((r) => r.id !== id));
      getUserRef()?.collection('manual').doc(String(id)).delete();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-2xl animate-pulse">⏳</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-[var(--ax-text)]">
          <Clock size={40} className="mx-auto mb-3 text-[var(--ax-accent)]" />
          <p className="text-sm opacity-60 mb-4">Faça login para acessar o Banco de Horas</p>
          <button
            onClick={() => auth.signInWithPopup(googleProvider)}
            className="ax-btn ax-btn--primary"
          >
            Entrar com Google
          </button>
        </div>
      </div>
    );
  }

  const tabButtons = [
    { id: 'dashboard', label: 'Home' },
    { id: 'ponto', label: 'Ponto' },
    { id: 'historico', label: 'Histórico' },
    { id: 'banco', label: 'Banco' },
    { id: 'ajustes', label: 'Ajustes' }
  ];

  return (
    <div className="space-y-4 text-[var(--ax-text)]">
      {/* Abas */}
      <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1">
        {tabButtons.map((t) => (
          <button
            key={t.id}
            onClick={() => setBhTab(t.id)}
            className={`px-3 py-1.5 rounded-lg font-bold uppercase whitespace-nowrap transition ${
              bhTab === t.id ? 'bg-[var(--ax-accent)] text-white' : 'opacity-50 hover:opacity-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* DASHBOARD TAB */}
      {bhTab === 'dashboard' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl text-center bg-[var(--ax-surface)] border border-[var(--ax-border)]">
              <div className="text-[10px] uppercase opacity-40 mb-1">Saldo Total</div>
              <div
                className="text-xl font-black"
                style={{ color: stats.totalBalance >= 0 ? 'var(--ax-viz-emerald)' : 'var(--ax-danger-500)' }}
              >
                {(stats.totalBalance >= 0 ? '+' : '') + fmtTime(stats.totalBalance)}
              </div>
            </div>

            <div className="p-4 rounded-2xl text-center bg-[var(--ax-surface)] border border-[var(--ax-border)]">
              <div className="text-[10px] uppercase opacity-40 mb-1">Sequência</div>
              <div className="flex items-center justify-center gap-1">
                <Flame size={18} className="text-[var(--ax-viz-amber)]" />
                <span className="text-xl font-black text-[var(--ax-viz-amber)]">{stats.currentStreak}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl text-center bg-[var(--ax-surface)] border border-[var(--ax-border)]">
              <div className="text-[10px] uppercase opacity-40 mb-1">Folgas</div>
              <div className="flex items-center justify-center gap-1">
                <Gift size={18} className="text-[var(--ax-viz-violet)]" />
                <span className="text-xl font-black text-[var(--ax-viz-violet)]">{stats.folgasPossiveis}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--ax-surface)] border border-[var(--ax-border)]">
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={16} className="text-[var(--ax-viz-violet)]" />
              <span className="text-xs font-bold opacity-70">
                {stats.level.icon} {stats.level.name} | {stats.totalXP} XP
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-[var(--ax-surface-subtle)]">
              <div
                className="h-full rounded-full transition-all bg-[var(--ax-viz-violet)]"
                style={{ width: `${Math.min(stats.xpProgress, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* PONTO TAB */}
      {bhTab === 'ponto' && (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {allMonths.map((m) => (
              <button
                key={m}
                onClick={() => setFilterMonth(m)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap transition ${
                  filterMonth === m ? 'bg-[var(--ax-surface-subtle)] text-[var(--ax-text-strong)]' : 'text-[var(--ax-text-muted)]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <div
            className="p-4 rounded-2xl border"
            style={{
              background: monthBalance >= 0 ? 'color-mix(in oklab,var(--ax-viz-emerald) 10%,transparent)' : 'color-mix(in oklab,var(--ax-danger-500) 10%,transparent)',
              borderColor: monthBalance >= 0 ? 'color-mix(in oklab,var(--ax-viz-emerald) 20%,transparent)' : 'color-mix(in oklab,var(--ax-danger-500) 20%,transparent)'
            }}
          >
            <div className="text-[10px] uppercase opacity-50">Saldo do Mês ({filterMonth})</div>
            <div
              className="text-2xl font-black mt-1"
              style={{ color: monthBalance >= 0 ? 'var(--ax-viz-emerald)' : 'var(--ax-danger-500)' }}
            >
              {(monthBalance >= 0 ? '+' : '') + fmtTime(monthBalance)}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[var(--ax-surface)] border border-[var(--ax-border)]">
            <div className="text-[10px] font-bold uppercase opacity-50 mb-3">Registrar Ponto</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
              <input
                type="date"
                value={pontoDate}
                onChange={(e) => setPontoDate(e.target.value)}
                className="ax-input text-xs font-bold"
              />
              <input
                type="time"
                value={pontoEntrada}
                onChange={(e) => setPontoEntrada(e.target.value)}
                placeholder="Entrada"
                className="ax-input text-xs font-bold text-center"
              />
              <input
                type="time"
                value={pontoSaida}
                onChange={(e) => setPontoSaida(e.target.value)}
                placeholder="Saída"
                className="ax-input text-xs font-bold text-center"
              />
            </div>
            <button
              onClick={handleSavePonto}
              className="ax-btn ax-btn--primary w-full text-xs"
            >
              Salvar Ponto
            </button>
          </div>

          <div className="rounded-2xl overflow-hidden bg-[var(--ax-surface)] border border-[var(--ax-border)]">
            <table className="w-full text-sm">
              <thead className="text-[10px] font-bold uppercase opacity-40 bg-[var(--ax-surface-subtle)]">
                <tr>
                  <th className="p-3 text-left">Data</th>
                  <th className="p-3 text-center">Entrada</th>
                  <th className="p-3 text-center">Saída</th>
                  <th className="p-3 text-center">Saldo</th>
                  <th className="p-3 text-right" />
                </tr>
              </thead>
              <tbody>
                {filteredTime.map((r) => {
                  const d = new Date(r.date + 'T12:00:00');
                  const isPos = r.saldo && r.saldo.startsWith('+');
                  return (
                    <tr key={r.date} className="border-t border-[var(--ax-border)]">
                      <td className="p-3 font-bold">
                        {String(d.getDate()).padStart(2, '0')}{' '}
                        <span className="text-[10px] opacity-40 font-normal">{BH_DIAS[d.getDay()]}</span>
                      </td>
                      <td className="p-3 text-center font-mono text-xs">{r.entrada || '--:--'}</td>
                      <td className="p-3 text-center font-mono text-xs">{r.saida || '--:--'}</td>
                      <td
                        className="p-3 text-center font-bold text-xs"
                        style={{ color: isPos ? 'var(--ax-viz-emerald)' : 'var(--ax-danger-500)' }}
                      >
                        {r.saldo || '--'}
                      </td>
                      <td className="p-3 text-right">
                        <button onClick={() => handleEditPonto(r)} className="opacity-50 hover:opacity-100 mr-2">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDeletePonto(r.date)} className="opacity-50 hover:opacity-100 text-[var(--ax-danger-500)]">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BANCO TAB */}
      {bhTab === 'banco' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[var(--ax-surface)] border border-[var(--ax-border)]">
            <div className="text-[10px] font-bold uppercase opacity-50 mb-3">Lançamento Manual de Horas</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
              <select
                value={manualRef}
                onChange={(e) => setManualRef(e.target.value)}
                className="ax-select text-xs font-bold"
              >
                <option value="">Mês ref.</option>
                {allMonths.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                type="time"
                value={manualHrs}
                onChange={(e) => setManualHrs(e.target.value)}
                className="ax-input text-xs font-bold text-center"
              />
              <select
                value={manualTipo}
                onChange={(e) => setManualTipo(e.target.value)}
                className="ax-select text-xs font-bold"
              >
                <option value="positivo">+ Positivo (Crédito)</option>
                <option value="negativo">- Negativo (Compensação)</option>
              </select>
            </div>
            <button onClick={handleSaveManual} className="ax-btn ax-btn--primary w-full text-xs">
              Lançar no Banco
            </button>
          </div>

          {manualRecords.length > 0 && (
            <div className="rounded-2xl overflow-hidden bg-[var(--ax-surface)] border border-[var(--ax-border)]">
              <table className="w-full text-sm">
                <thead className="text-[10px] font-bold uppercase opacity-40 bg-[var(--ax-surface-subtle)]">
                  <tr>
                    <th className="p-3 text-left">Mês</th>
                    <th className="p-3 text-center">Horas</th>
                    <th className="p-3 text-center">Tipo</th>
                    <th className="p-3 text-right" />
                  </tr>
                </thead>
                <tbody>
                  {manualRecords.map((r) => (
                    <tr key={r.id} className="border-t border-[var(--ax-border)]">
                      <td className="p-3 font-bold text-xs">{r.ref}</td>
                      <td className="p-3 text-center font-mono text-xs">{r.hrsStr}</td>
                      <td
                        className="p-3 text-center text-xs font-bold"
                        style={{ color: r.tipo === 'positivo' ? 'var(--ax-viz-emerald)' : 'var(--ax-danger-500)' }}
                      >
                        {r.tipo === 'positivo' ? '+ Crédito' : '- Débito'}
                      </td>
                      <td className="p-3 text-right">
                        <button onClick={() => handleDeleteManual(r.id)} className="text-[var(--ax-danger-500)] opacity-50 hover:opacity-100">
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
      )}

      {/* AJUSTES TAB */}
      {bhTab === 'ajustes' && (
        <div className="p-4 rounded-2xl bg-[var(--ax-surface)] border border-[var(--ax-border)] space-y-3">
          <div className="text-[10px] font-bold uppercase opacity-50 mb-3">Jornada Padrão de Trabalho</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase opacity-40 block mb-1">Entrada</label>
              <input
                type="time"
                value={config.entrada}
                onChange={(e) => setConfig({ ...config, entrada: e.target.value })}
                className="ax-input text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase opacity-40 block mb-1">Saída</label>
              <input
                type="time"
                value={config.saida}
                onChange={(e) => setConfig({ ...config, saida: e.target.value })}
                className="ax-input text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase opacity-40 block mb-1">Almoço (horas)</label>
              <input
                type="number"
                min="0"
                max="3"
                step="0.5"
                value={config.horasAlmoco}
                onChange={(e) => setConfig({ ...config, horasAlmoco: Number(e.target.value) })}
                className="ax-input text-xs font-bold"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase opacity-40 block mb-1">Saldo Inicial (horas)</label>
              <input
                type="number"
                step="0.5"
                value={config.saldoInicialMin / 60}
                onChange={(e) => setConfig({ ...config, saldoInicialMin: Number(e.target.value) * 60 })}
                className="ax-input text-xs font-bold"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="text-[10px] uppercase opacity-40 block mb-1">Dias Úteis</label>
            <div className="flex gap-2 flex-wrap">
              {BH_DIAS.map((d, i) => {
                const on = config.diasSemana.includes(i);
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      const nd = on ? config.diasSemana.filter((x) => x !== i) : [...config.diasSemana, i];
                      setConfig({ ...config, diasSemana: nd });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      on ? 'bg-[var(--ax-accent)] text-white' : 'bg-[var(--ax-surface-subtle)] text-[var(--ax-text-muted)]'
                    }`}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

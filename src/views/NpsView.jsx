import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine
} from 'recharts';
import { Download, Search, AlertCircle } from 'lucide-react';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw68DmuS_sDfZ2ozpG5bX3JQITYO2_nFdXwe9lPFD7rPE0wfxpSjV6uvxmsp0fOyHH1/exec';
const COLORS = { critica: '#EF4136', aperfeicoamento: '#FDB913', qualidade: '#56C174', excelencia: '#00A650' };

function getNPSColor(score) {
  if (score >= 75) return COLORS.excelencia;
  if (score >= 50) return COLORS.qualidade;
  if (score >= 0) return COLORS.aperfeicoamento;
  return COLORS.critica;
}

function getNPSZone(score) {
  if (score >= 75) return { label: 'Excelência' };
  if (score >= 50) return { label: 'Qualidade' };
  if (score >= 0) return { label: 'Aperfeiçoamento' };
  return { label: 'Crítico' };
}

const MONTH_ORDER = { Jan: 1, Fev: 2, Mar: 3, Abr: 4, Mai: 5, Jun: 6, Jul: 7, Ago: 8, Set: 9, Out: 10, Nov: 11, Dez: 12 };

function sortMonthsChronologically(months) {
  return months.slice().sort((a, b) => {
    const [mA, yA] = a.split(' ');
    const [mB, yB] = b.split(' ');
    const fyA = parseInt(yA, 10) > 50 ? 1900 + parseInt(yA, 10) : 2000 + parseInt(yA, 10);
    const fyB = parseInt(yB, 10) > 50 ? 1900 + parseInt(yB, 10) : 2000 + parseInt(yB, 10);
    return fyA !== fyB ? fyA - fyB : (MONTH_ORDER[mA] || 0) - (MONTH_ORDER[mB] || 0);
  });
}

function calcNPS(rows) {
  const total = rows.length;
  if (!total) return { nps: 0, p: 0, det: 0, neutros: 0, total: 0 };
  const p = rows.filter((x) => x.nota >= 9).length;
  const det = rows.filter((x) => x.nota <= 6).length;
  return {
    total,
    p,
    det,
    neutros: total - p - det,
    nps: Math.round(((p - det) / total) * 100)
  };
}

function CustomBarTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const zone = getNPSZone(d.score);
  const color = getNPSColor(d.score);

  return (
    <div className="rounded-2xl p-4 text-xs shadow-2xl min-w-[160px] bg-[var(--ax-surface)] border border-[var(--ax-border)] text-[var(--ax-text)]">
      <p className="font-black mb-2 uppercase">{d.mes}</p>
      <p className="font-black text-2xl mb-1" style={{ color }}>{d.score}</p>
      <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ color, background: `${color}20` }}>
        {zone.label}
      </span>
      <div className="mt-3 space-y-1 text-[10px] opacity-70">
        <p>▲ {d.p} promotores</p>
        <p>◆ {d.neutros} neutros</p>
        <p>▼ {d.det} detratores</p>
        <p className="pt-1 mt-1 border-t border-[var(--ax-border)]">Σ {d.total} respostas</p>
      </div>
    </div>
  );
}

function PromoterBar({ p, neutros, det, total }) {
  if (!total) return null;
  const pw = ((p / total) * 100).toFixed(1);
  const nw = ((neutros / total) * 100).toFixed(1);
  const dw = ((det / total) * 100).toFixed(1);

  return (
    <div className="rounded-[24px] p-5 bg-[var(--ax-surface-subtle)] border border-[var(--ax-border)]">
      <h4 className="text-[10px] font-black uppercase opacity-40 mb-3 tracking-widest">Distribuição das Respostas</h4>
      <div className="flex h-5 rounded-full overflow-hidden gap-0.5">
        {p > 0 && <div style={{ width: `${pw}%`, background: COLORS.excelencia }} className="transition-all duration-700 rounded-l-full" />}
        {neutros > 0 && <div style={{ width: `${nw}%`, background: COLORS.aperfeicoamento }} className="transition-all duration-700" />}
        {det > 0 && <div style={{ width: `${dw}%`, background: COLORS.critica }} className="transition-all duration-700 rounded-r-full" />}
      </div>
      <div className="flex justify-between mt-2 text-[9px] font-black uppercase">
        <span style={{ color: COLORS.excelencia }}>▲ {pw}% Promotores</span>
        <span style={{ color: COLORS.aperfeicoamento }}>◆ {nw}% Neutros</span>
        <span style={{ color: COLORS.critica }}>▼ {dw}% Detratores</span>
      </div>
    </div>
  );
}

function HorizontalNPSChart({ data, dimension, label }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const items = useMemo(() => {
    const keys = Array.from(new Set(data.map((d) => d[dimension]))).filter(Boolean);
    return keys
      .map((k) => {
        const rows = data.filter((d) => d[dimension] === k);
        return { name: k, ...calcNPS(rows) };
      })
      .sort((a, b) => b.nps - a.nps);
  }, [data, dimension]);

  if (!items.length) return null;
  const INITIAL_COUNT = 5;
  const hasMore = items.length > INITIAL_COUNT;
  const displayedItems = isExpanded ? items : items.slice(0, INITIAL_COUNT);

  return (
    <div className="rounded-[30px] p-6 flex flex-col h-full bg-[var(--ax-surface-subtle)] border border-[var(--ax-border)]">
      <h4 className="text-[10px] font-black uppercase opacity-40 mb-4 tracking-widest flex-shrink-0">NPS por {label}</h4>
      <div className="space-y-3 flex-1">
        {displayedItems.map((item, i) => {
          const zone = getNPSZone(item.nps);
          const color = getNPSColor(item.nps);
          const barW = Math.max(4, ((item.nps + 100) / 200) * 100);

          return (
            <div key={i}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold uppercase truncate max-w-[60%]" title={item.name}>
                  {item.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ color, background: `${color}20` }}>
                    {zone.label}
                  </span>
                  <span className="text-sm font-black" style={{ color }}>{item.nps}</span>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-[var(--ax-surface-subtle)]">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${barW}%`, background: color }} />
              </div>
              <div className="flex gap-3 mt-1 text-[9px] opacity-40 font-bold">
                <span>▲ {item.p} prom.</span>
                <span>◆ {item.neutros} neut.</span>
                <span>▼ {item.det} detr.</span>
                <span>Σ {item.total}</span>
              </div>
            </div>
          );
        })}
      </div>
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 pt-4 w-full flex items-center justify-center gap-2 text-xs font-semibold opacity-60 hover:opacity-100 rounded-xl transition border-t border-[var(--ax-border)] text-[var(--ax-accent)]"
        >
          {isExpanded ? 'Ver menos' : `Ver mais (${items.length - INITIAL_COUNT})`}
        </button>
      )}
    </div>
  );
}

export default function NpsView() {
  const [view, setView] = useState('loading');
  const [rawData, setRawData] = useState([]);
  const [contractsList, setContractsList] = useState([]);
  const [filters, setFilters] = useState({ mes: 'Ano 26', unidade: 'Todas', estrategico: 'Todos', empresa: 'MKE', cliente: 'Todos', contrato: 'Todos', verNA: false });
  const [selectedMonthInChart, setSelectedMonthInChart] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [errorMsg, setErrorMsg] = useState('');

  const PAGE_SIZE = 10;

  const getCategory = (d) => {
    const colClass = `${d.classificacao || ''}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
    if (colClass === 'WIND') return 'Wind';
    if (colClass === 'PETRORECONCAVO' || colClass === 'PETRO' || colClass === 'POTIGUAR') return 'Petroreconcavo';
    if (colClass === 'VALE') return 'Vale';
    if (colClass === 'ARCELORMITTAL') return 'ArcelorMittal';
    return 'Outros';
  };

  const data = useMemo(() => {
    const contratoLookup = {};
    contractsList.forEach((c) => {
      if (c.numero && c.exibicao) contratoLookup[String(c.numero).trim()] = c.exibicao;
    });
    const VALID_MONTH_REGEX = /^(Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez)\s\d{2}(\s-\sN\/A)?$/i;
    return rawData
      .filter((d) => d.mes && VALID_MONTH_REGEX.test(d.mes))
      .map((d) => {
        let u = d.unidade || '';
        if (u.toUpperCase() === 'WIND') u = 'Wind';
        const numKey = String(d.numContrato || d.contrato || '').trim();
        const contratoExibicao = contratoLookup[numKey] || d.contrato || numKey;
        const cliente = (d.cliente || '').toString().normalize('NFC').trim().replace(/\s+/g, ' ');
        return { ...d, unidade: u, contratoExibicao, cliente };
      })
      .filter((d) => d.unidade && d.unidade.toUpperCase() !== 'SEMINOVOS');
  }, [rawData, contractsList]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${SCRIPT_URL}?action=login&user=weverson&pass=Wf023240`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((res) => {
        if (cancelled) return;
        if (res.result === 'success') {
          setRawData(res.metrics?.baseDados || []);
          setContractsList(res.metrics?.listaContratos || []);
          setErrorMsg('');
        } else {
          setErrorMsg('Acesso restrito à planilha Google.');
        }
        setView('dashboard');
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('NPS API Offline:', err);
        setErrorMsg('API offline — exibindo dados locais');
        setView('dashboard');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const filtered = data.filter((d) => {
      const isNA = d.mes.includes(' - N/A');
      const cleanMes = d.mes.replace(' - N/A', '');
      if (isNA && !filters.verNA) return false;

      let matchMes = false;
      if (selectedMonthInChart) {
        matchMes = cleanMes === selectedMonthInChart.replace(' - N/A', '');
      } else {
        if (filters.mes === 'Todos') matchMes = true;
        else if (filters.mes.startsWith('Ano ')) {
          const y = filters.mes.replace('Ano ', '');
          matchMes = cleanMes.endsWith(y);
        } else {
          matchMes = cleanMes === filters.mes;
        }
      }

      const matchEstrategico = filters.estrategico === 'Todos' || getCategory(d) === filters.estrategico;
      const matchEmpresa = filters.empresa === 'Todas' || d.empresa === filters.empresa;
      return (
        matchMes &&
        matchEstrategico &&
        matchEmpresa &&
        (filters.unidade === 'Todas' || d.unidade === filters.unidade) &&
        (filters.cliente === 'Todos' || d.cliente === filters.cliente) &&
        (filters.contrato === 'Todos' || d.contratoExibicao === filters.contrato)
      );
    });

    return { ...calcNPS(filtered), filtered };
  }, [data, filters, selectedMonthInChart]);

  const monthlyNpsData = useMemo(() => {
    const base = data.filter((d) => {
      const isNA = d.mes.includes(' - N/A');
      if (isNA && !filters.verNA) return false;
      const matchEstrategico = filters.estrategico === 'Todos' || getCategory(d) === filters.estrategico;
      const matchEmpresa = filters.empresa === 'Todas' || d.empresa === filters.empresa;
      return (
        matchEstrategico &&
        matchEmpresa &&
        (filters.unidade === 'Todas' || d.unidade === filters.unidade) &&
        (filters.cliente === 'Todos' || d.cliente === filters.cliente) &&
        (filters.contrato === 'Todos' || d.contratoExibicao === filters.contrato)
      );
    });

    let monthsToShow = Array.from(new Set(base.map((r) => r.mes.replace(' - N/A', '')))).filter(Boolean);
    if (filters.mes !== 'Todos') {
      if (filters.mes.startsWith('Ano ')) {
        const y = filters.mes.replace('Ano ', '');
        monthsToShow = monthsToShow.filter((m) => m.endsWith(y));
      } else {
        monthsToShow = monthsToShow.filter((m) => m === filters.mes);
      }
    }

    return sortMonthsChronologically(monthsToShow).map((m) => {
      const rows = base.filter((x) => x.mes.replace(' - N/A', '') === m);
      const res = calcNPS(rows);
      return { mes: m, score: res.nps, p: res.p, det: res.det, neutros: res.neutros, total: res.total };
    });
  }, [data, filters]);

  const tableData = useMemo(() => {
    const reversed = stats.filtered.slice().reverse();
    if (!searchText.trim()) return reversed;
    const q = searchText.toLowerCase();
    return reversed.filter(
      (r) =>
        (r.cliente || '').toLowerCase().includes(q) ||
        (r.contratoExibicao || '').toLowerCase().includes(q) ||
        (r.feedback || '').toLowerCase().includes(q) ||
        String(r.nota).includes(q)
    );
  }, [stats.filtered, searchText]);

  const totalPages = Math.max(1, Math.ceil(tableData.length / PAGE_SIZE));
  const pagedData = tableData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleBarClick = (d) => {
    if (d?.activePayload?.[0]?.payload) {
      const m = d.activePayload[0].payload.mes;
      setSelectedMonthInChart((prev) => (prev === m ? null : m));
    }
  };

  const handleExportCSV = () => {
    const escCSV = (v) => {
      let s = String(v || '');
      if (s.includes(',') || s.includes('"') || s.includes('\n')) s = `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const csvRows = [
      ['Mês', 'Contrato', 'Cliente', 'Unidade', 'Nota', 'Feedback', 'Data Resposta'].map(escCSV).join(','),
      ...stats.filtered.map((d) =>
        [d.mes, d.contratoExibicao, d.cliente, d.unidade, d.nota, d.feedback, d.data].map(escCSV).join(',')
      )
    ];
    const blob = new Blob(['\uFEFF' + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Export_NPS_Makro.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (view === 'loading') {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin border-[var(--ax-accent)]" />
      </div>
    );
  }

  const zone = getNPSZone(stats.nps);

  return (
    <div className="space-y-6 text-[var(--ax-text)]">
      {errorMsg && (
        <div className="rounded-2xl p-4 flex items-center gap-3 bg-[var(--ax-danger-soft)] border border-[var(--ax-danger-500)]/30">
          <AlertCircle size={18} className="text-[var(--ax-danger-500)] shrink-0" />
          <span className="text-xs font-bold text-[var(--ax-danger-500)]">{errorMsg}</span>
        </div>
      )}

      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--ax-text-strong)]">Pesquisa NPS</h2>
          <p className="text-xs opacity-50">Métricas de satisfação dos clientes Makro Engenharia</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="ax-btn ax-btn--secondary ax-btn--sm"
        >
          <Download size={15} /> Exportar CSV NPS
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl text-center bg-[var(--ax-surface)] border border-[var(--ax-border)]">
          <div className="text-[10px] uppercase opacity-40 mb-1">Total Respostas</div>
          <div className="text-2xl font-black">{stats.total}</div>
        </div>
        <div className="p-4 rounded-2xl text-center bg-[var(--ax-surface)] border border-[var(--ax-border)]">
          <div className="text-[10px] uppercase opacity-40 mb-1">Promotores</div>
          <div className="text-2xl font-black" style={{ color: COLORS.excelencia }}>{stats.p}</div>
        </div>
        <div className="p-4 rounded-2xl text-center bg-[var(--ax-surface)] border border-[var(--ax-border)]">
          <div className="text-[10px] uppercase opacity-40 mb-1">Neutros</div>
          <div className="text-2xl font-black" style={{ color: COLORS.aperfeicoamento }}>{stats.neutros}</div>
        </div>
        <div className="p-4 rounded-2xl text-center bg-[var(--ax-surface)] border border-[var(--ax-border)]">
          <div className="text-[10px] uppercase opacity-40 mb-1">Detratores</div>
          <div className="text-2xl font-black" style={{ color: COLORS.critica }}>{stats.det}</div>
        </div>
        <div className="p-4 rounded-2xl text-center bg-[var(--ax-surface)] border border-[var(--ax-border)] col-span-2 md:col-span-1">
          <div className="text-[10px] uppercase opacity-40 mb-1">Score NPS</div>
          <div className="text-2xl font-black" style={{ color: getNPSColor(stats.nps) }}>{stats.nps}</div>
          <span className="text-[9px] font-bold" style={{ color: getNPSColor(stats.nps) }}>{zone.label}</span>
        </div>
      </div>

      {/* Barra de Distribuição */}
      <PromoterBar p={stats.p} neutros={stats.neutros} det={stats.det} total={stats.total} />

      {/* Gráfico Histórico */}
      <div className="p-6 rounded-[28px] bg-[var(--ax-surface)] border border-[var(--ax-border)]">
        <h3 className="text-xs font-bold uppercase tracking-wider opacity-50 mb-4">Série Histórica NPS</h3>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyNpsData} onClick={handleBarClick} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--ax-border)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: 'var(--ax-text-muted)', fontSize: 10 }} />
              <YAxis domain={[-100, 100]} tick={{ fill: 'var(--ax-text-muted)', fontSize: 10 }} />
              <Tooltip content={<CustomBarTooltip />} />
              <ReferenceLine y={0} stroke="var(--ax-border-strong)" />
              <ReferenceLine y={50} stroke={COLORS.qualidade} strokeDasharray="2 2" />
              <ReferenceLine y={75} stroke={COLORS.excelencia} strokeDasharray="2 2" />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {monthlyNpsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getNPSColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dimensões */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HorizontalNPSChart data={stats.filtered} dimension="cliente" label="Cliente" />
        <HorizontalNPSChart data={stats.filtered} dimension="unidade" label="Unidade" />
      </div>

      {/* Tabela de Respostas */}
      <div className="p-6 rounded-[28px] bg-[var(--ax-surface)] border border-[var(--ax-border)]">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider opacity-50">
            Respostas Recentes ({tableData.length})
          </h3>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ax-text-subtle)]" />
            <input
              type="text"
              placeholder="Buscar por cliente, contrato..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="ax-input text-xs pl-8 w-60"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="uppercase opacity-40 text-[10px] text-left bg-[var(--ax-surface-subtle)]">
              <tr>
                <th className="p-3">Cliente</th>
                <th className="p-3">Contrato</th>
                <th className="p-3">Unidade</th>
                <th className="p-3 text-center">Nota</th>
                <th className="p-3">Feedback</th>
                <th className="p-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {pagedData.map((row, idx) => {
                const c = row.nota >= 9 ? COLORS.excelencia : row.nota >= 7 ? COLORS.aperfeicoamento : COLORS.critica;
                return (
                  <tr key={idx} className="border-t border-[var(--ax-border)]">
                    <td className="p-3 font-bold truncate max-w-[160px]" title={row.cliente}>
                      {row.cliente}
                    </td>
                    <td className="p-3 font-mono opacity-70">{row.contratoExibicao || '--'}</td>
                    <td className="p-3 opacity-70">{row.unidade}</td>
                    <td className="p-3 text-center font-black">
                      <span className="px-2 py-0.5 rounded-full text-[10px]" style={{ background: `${c}20`, color: c }}>
                        {row.nota}
                      </span>
                    </td>
                    <td className="p-3 opacity-80 max-w-[280px] truncate" title={row.feedback}>
                      {row.feedback || '--'}
                    </td>
                    <td className="p-3 opacity-50 font-mono text-[10px]">{row.data || '--'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4 text-xs">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg opacity-60 hover:opacity-100 disabled:opacity-20"
            >
              Anterior
            </button>
            <span className="opacity-50">Página {currentPage} de {totalPages}</span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg opacity-60 hover:opacity-100 disabled:opacity-20"
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

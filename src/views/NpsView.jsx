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
import { Download, Search, AlertCircle, Filter, RotateCcw, X } from 'lucide-react';

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

  // 1. Normalização de Unidade (Ignora N/A e unifica sinônimos)
  const normalizeUnidade = (rawU) => {
    if (!rawU) return null;
    const clean = String(rawU).trim().toUpperCase();
    // Ignore os "N/A" tire da conta:
    if (
      clean === '#N/A' ||
      clean === 'N/A' ||
      clean === 'NA' ||
      clean === 'SEM UNIDADE' ||
      clean === 'SEMINOVOS' ||
      clean === 'NULL' ||
      clean === 'UNDEFINED'
    ) {
      return null;
    }
    // AMP + PC + PECEM são a mesma coisa (deixe como AMP)
    if (clean === 'AMP' || clean === 'PC' || clean === 'PECEM' || clean === 'PECÉM') {
      return 'AMP';
    }
    // PE + PERNAMBUCO são a mesma coisa (deixe como PE)
    if (clean === 'PE' || clean === 'PERNAMBUCO') {
      return 'PE';
    }
    // RN + RIO GRANDE DO NORTE
    if (clean === 'RN' || clean === 'RIO GRANDE DO NORTE') {
      return 'RN';
    }
    // MA + MARANHÃO
    if (clean === 'MA' || clean === 'MARANHAO' || clean === 'MARANHÃO') {
      return 'MA';
    }
    if (clean === 'WIND') {
      return 'Wind';
    }
    return String(rawU).trim();
  };

  // 2. Resolução do Nome do Cliente (Apenas nomes, nunca números)
  const resolveClienteNome = (d, contractsMap) => {
    const numKey = String(d.numContrato || d.contrato || '').trim();
    const c = contractsMap[numKey];

    // 2.1 Se listaContratos tem o nome do cliente válido
    if (c?.cliente && !/^\d+$/.test(c.cliente.trim()) && c.cliente.trim().toUpperCase() !== '#N/A') {
      return c.cliente.trim();
    }

    // 2.2 Extrair do nomeContrato (ex.: "VALE - CONSOLIDADO CKS" -> "Vale")
    const nomeContrato = String(d.nomeContrato || '').trim();
    if (nomeContrato && !/^\d+$/.test(nomeContrato) && nomeContrato.toUpperCase() !== '#N/A') {
      const parts = nomeContrato.split(/\s*-\s*/);
      const candidate = parts[0].trim();
      if (candidate && !/^\d+$/.test(candidate) && candidate.toUpperCase() !== '#N/A') {
        return candidate;
      }
      if (parts[1] && !/^\d+$/.test(parts[1].trim()) && parts[1].trim().toUpperCase() !== '#N/A') {
        return parts[1].trim();
      }
      return nomeContrato;
    }

    // 2.3 Da exibição da lista de contratos
    if (c?.exibicao && !/^\d+$/.test(c.exibicao.trim()) && c.exibicao.trim().toUpperCase() !== '#N/A') {
      const parts = c.exibicao.split(/\s*-\s*/);
      return parts[0].trim();
    }

    // 2.4 Se d.cliente não for um número puro
    const rawCli = String(d.cliente || '').trim();
    if (rawCli && !/^\d+$/.test(rawCli) && rawCli.toUpperCase() !== '#N/A' && rawCli.toUpperCase() !== 'N/A') {
      return rawCli;
    }

    // 2.5 Fallback por classificação estratégica
    if (d.classificacao && d.classificacao.trim() && d.classificacao.toUpperCase() !== '#N/A') {
      return d.classificacao.trim();
    }

    return 'Outros';
  };

  // 3. Resolução do Contrato (Número + Nome do Cliente, ex.: "6545 - Vale CKS")
  const resolveContratoExibicao = (d, contractsMap, clientName) => {
    const num = String(d.numContrato || d.contrato || '').trim();
    const c = contractsMap[num];
    const exib = (c?.exibicao ? c.exibicao.trim() : '') || String(d.nomeContrato || '').trim();

    if (num && exib) {
      if (exib.startsWith(num)) {
        return exib;
      }
      return `${num} - ${exib}`;
    }

    if (num && clientName && clientName !== 'Outros') {
      return `${num} - ${clientName}`;
    }

    if (num) {
      return num;
    }

    return exib || 'Sem Contrato';
  };

  const data = useMemo(() => {
    const contractsMap = {};
    contractsList.forEach((c) => {
      if (c.numero) {
        contractsMap[String(c.numero).trim()] = c;
      }
    });

    const VALID_MONTH_REGEX = /^(Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez)\s\d{2}(\s-\sN\/A)?$/i;

    const list = [];
    for (const d of rawData) {
      if (!d.mes || !VALID_MONTH_REGEX.test(d.mes)) continue;

      // Unidade: Ignora os "N/A" e tira da conta
      const u = normalizeUnidade(d.unidade);
      if (!u) continue; // Tirado da conta!

      // Cliente: Nome do cliente, nunca o número
      const cliente = resolveClienteNome(d, contractsMap);

      // Contrato: Número do contrato + Nome do cliente
      const contratoExibicao = resolveContratoExibicao(d, contractsMap, cliente);

      list.push({
        ...d,
        unidade: u,
        cliente,
        contratoExibicao
      });
    }

    return list;
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

  // Listas de Opções Únicas para os Filtros
  const uniqueMonths = useMemo(() => {
    const years = ['Ano 26', 'Ano 25', 'Ano 24', 'Todos'];
    const months = Array.from(new Set(data.map((d) => d.mes.replace(' - N/A', '')))).filter(Boolean);
    return [...years, ...sortMonthsChronologically(months).reverse()];
  }, [data]);

  const uniqueEmpresas = useMemo(() => {
    const list = Array.from(new Set(data.map((d) => d.empresa))).filter(Boolean).sort();
    return ['Todas', ...list];
  }, [data]);

  const uniqueUnidades = useMemo(() => {
    const list = Array.from(new Set(data.map((d) => d.unidade)))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, 'pt-BR'));
    return ['Todas', ...list];
  }, [data]);

  const uniqueEstrategicos = useMemo(() => {
    return ['Todos', 'Wind', 'Petroreconcavo', 'Vale', 'ArcelorMittal', 'Outros'];
  }, []);

  const uniqueClientes = useMemo(() => {
    const list = Array.from(new Set(data.map((d) => d.cliente)))
      .filter((cli) => cli && cli !== 'Outros' && !/^\d+$/.test(cli) && cli.toUpperCase() !== '#N/A')
      .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
    return ['Todos', ...list];
  }, [data]);

  const uniqueContratos = useMemo(() => {
    const list = Array.from(new Set(data.map((d) => d.contratoExibicao)))
      .filter((ctr) => ctr && ctr !== 'Sem Contrato' && ctr.toUpperCase() !== '#N/A')
      .sort((a, b) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }));
    return ['Todos', ...list];
  }, [data]);

  const handleResetFilters = () => {
    setFilters({ mes: 'Ano 26', unidade: 'Todas', estrategico: 'Todos', empresa: 'MKE', cliente: 'Todos', contrato: 'Todos', verNA: false });
    setSelectedMonthInChart(null);
    setSearchText('');
  };

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

      {/* Barra de Filtros Completa do NPS */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center font-bold text-sm">
              <Filter size={16} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-heading)]">Filtros de Pesquisa NPS</h3>
              <p className="text-[11px] text-[var(--color-muted)]">Refine por período, empresa, unidade, cliente ou contrato</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Toggle Ver N/A */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[var(--color-heading)] select-none">
              <input
                type="checkbox"
                checked={filters.verNA}
                onChange={(e) => setFilters((prev) => ({ ...prev, verNA: e.target.checked }))}
                className="w-4 h-4 rounded text-[var(--color-primary)] accent-[var(--color-primary)] cursor-pointer"
              />
              <span>Incluir N/A</span>
            </label>

            {/* Reset Filters */}
            <button
              type="button"
              className="text-xs text-[var(--color-primary)] hover:underline font-semibold flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[var(--color-surface-subtle)] transition"
              onClick={handleResetFilters}
              title="Restaurar filtros padrão"
            >
              <RotateCcw size={13} />
              <span>Limpar Filtros</span>
            </button>
          </div>
        </div>

        {/* Grid de Seletores */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Mês / Ano */}
          <div>
            <label className="text-[11px] font-bold text-[var(--color-muted)] block mb-1">Período / Ano</label>
            <select
              className="w-full text-xs h-9 px-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-subtle)] text-[var(--color-heading)] font-semibold outline-none focus:border-[var(--color-primary)]"
              value={filters.mes}
              onChange={(e) => {
                setSelectedMonthInChart(null);
                setFilters((prev) => ({ ...prev, mes: e.target.value }));
              }}
            >
              {uniqueMonths.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* 2. Empresa */}
          <div>
            <label className="text-[11px] font-bold text-[var(--color-muted)] block mb-1">Empresa</label>
            <select
              className="w-full text-xs h-9 px-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-subtle)] text-[var(--color-heading)] font-semibold outline-none focus:border-[var(--color-primary)]"
              value={filters.empresa}
              onChange={(e) => setFilters((prev) => ({ ...prev, empresa: e.target.value }))}
            >
              {uniqueEmpresas.map((emp) => (
                <option key={emp} value={emp}>{emp}</option>
              ))}
            </select>
          </div>

          {/* 3. Unidade */}
          <div>
            <label className="text-[11px] font-bold text-[var(--color-muted)] block mb-1">Unidade</label>
            <select
              className="w-full text-xs h-9 px-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-subtle)] text-[var(--color-heading)] font-semibold outline-none focus:border-[var(--color-primary)]"
              value={filters.unidade}
              onChange={(e) => setFilters((prev) => ({ ...prev, unidade: e.target.value }))}
            >
              {uniqueUnidades.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* 4. Estratégico */}
          <div>
            <label className="text-[11px] font-bold text-[var(--color-muted)] block mb-1">Estratégico</label>
            <select
              className="w-full text-xs h-9 px-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-subtle)] text-[var(--color-heading)] font-semibold outline-none focus:border-[var(--color-primary)]"
              value={filters.estrategico}
              onChange={(e) => setFilters((prev) => ({ ...prev, estrategico: e.target.value }))}
            >
              {uniqueEstrategicos.map((est) => (
                <option key={est} value={est}>{est}</option>
              ))}
            </select>
          </div>

          {/* 5. Cliente */}
          <div>
            <label className="text-[11px] font-bold text-[var(--color-muted)] block mb-1">Cliente</label>
            <select
              className="w-full text-xs h-9 px-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-subtle)] text-[var(--color-heading)] font-semibold outline-none focus:border-[var(--color-primary)] truncate"
              value={filters.cliente}
              onChange={(e) => setFilters((prev) => ({ ...prev, cliente: e.target.value }))}
            >
              {uniqueClientes.map((cli) => (
                <option key={cli} value={cli}>{cli}</option>
              ))}
            </select>
          </div>

          {/* 6. Contrato */}
          <div>
            <label className="text-[11px] font-bold text-[var(--color-muted)] block mb-1">Contrato</label>
            <select
              className="w-full text-xs h-9 px-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-subtle)] text-[var(--color-heading)] font-semibold outline-none focus:border-[var(--color-primary)] truncate"
              value={filters.contrato}
              onChange={(e) => setFilters((prev) => ({ ...prev, contrato: e.target.value }))}
            >
              {uniqueContratos.map((ctr) => (
                <option key={ctr} value={ctr}>{ctr}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Notificação se houver mês selecionado via clique no gráfico */}
        {selectedMonthInChart && (
          <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-xs text-[var(--color-primary)] bg-[var(--color-primary-soft)] px-3 py-2 rounded-xl">
            <span className="font-semibold">
              🔍 Filtrando pelo gráfico no mês: <strong>{selectedMonthInChart}</strong>
            </span>
            <button
              type="button"
              className="font-bold hover:underline flex items-center gap-1"
              onClick={() => setSelectedMonthInChart(null)}
            >
              <X size={14} />
              <span>Remover filtro de mês</span>
            </button>
          </div>
        )}
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

/* ============ NPS DASHBOARD (completo - igual Makro Hub) ============ */
const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine, LabelList, ComposedChart, Line, Legend } = window.Recharts || {};

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw68DmuS_sDfZ2ozpG5bX3JQITYO2_nFdXwe9lPFD7rPE0wfxpSjV6uvxmsp0fOyHH1/exec';
const COLORS = { critica: '#EF4136', aperfeicoamento: '#FDB913', qualidade: '#56C174', excelencia: '#00A650' };

const getNPSColor = (score) => { if (score >= 75) return COLORS.excelencia; if (score >= 50) return COLORS.qualidade; if (score >= 0) return COLORS.aperfeicoamento; return COLORS.critica; };
const getNPSZone = (score) => { if (score >= 75) return { label: 'Excelência', cls: 'text-green-400' }; if (score >= 50) return { label: 'Qualidade', cls: 'text-blue-400' }; if (score >= 0) return { label: 'Aperfeiçoamento', cls: 'text-yellow-400' }; return { label: 'Crítico', cls: 'text-red-400' }; };

const MONTH_ORDER = { 'Jan':1,'Fev':2,'Mar':3,'Abr':4,'Mai':5,'Jun':6,'Jul':7,'Ago':8,'Set':9,'Out':10,'Nov':11,'Dez':12 };
const sortMonthsChronologically = (months) => [...months].sort((a, b) => { const [mA, yA] = a.split(' '); const [mB, yB] = b.split(' '); const fyA = parseInt(yA) > 50 ? 1900+parseInt(yA) : 2000+parseInt(yA); const fyB = parseInt(yB) > 50 ? 1900+parseInt(yB) : 2000+parseInt(yB); return fyA !== fyB ? fyA - fyB : (MONTH_ORDER[mA]||0) - (MONTH_ORDER[mB]||0); });
const groupMonthsByYear = (months) => { const grouped = {}; months.forEach(m => { const [, y] = m.split(' '); const fy = parseInt(y) > 50 ? 1900+parseInt(y) : 2000+parseInt(y); if (!grouped[fy]) grouped[fy] = []; grouped[fy].push(m); }); return grouped; };
const calcNPS = (rows) => { const total = rows.length; if (!total) return { nps: 0, p: 0, det: 0, neutros: 0, total: 0 }; const p = rows.filter(x => x.nota >= 9).length; const det = rows.filter(x => x.nota <= 6).length; return { total, p, det, neutros: total-p-det, nps: Math.round(((p-det)/total)*100) }; };

const Icon = ({ name, size = 18, className = "" }) => {
  const ref = React.useRef(null);
  React.useEffect(() => { if (window.lucide && ref.current) { ref.current.innerHTML = ''; const i = document.createElement('i'); i.setAttribute('data-lucide', name.replace(/([a-z])([A-Z])/g,'$1-$2').toLowerCase()); ref.current.appendChild(i); window.lucide.createIcons({ attrs:{ width:size, height:size, class:className, 'stroke-width':2 } }); } }, [name, size, className]);
  return React.createElement('span', { ref, className: "inline-flex items-center justify-center leading-none" });
};

const TrendBadge = ({ current, previous }) => { if (previous === null || previous === undefined) return null; const diff = current - previous; if (diff > 0) return <span className="text-xs font-black ml-2" style={{color:COLORS.excelencia}}>↑ +{diff} vs mês ant.</span>; if (diff < 0) return <span className="text-xs font-black ml-2" style={{color:COLORS.critica}}>↓ {diff} vs mês ant.</span>; return <span className="text-xs font-black ml-2 opacity-30">→ Estável</span>; };

const CustomBarTooltip = ({ active, payload }) => { if (!active || !payload?.length) return null; const d = payload[0].payload; const zone = getNPSZone(d.score); return ( <div className="rounded-2xl p-4 text-xs shadow-2xl min-w-[160px]" style={{background:'var(--ax-surface)',border:'1px solid var(--ax-border)',color:'var(--ax-text)'}}> <p className="font-black mb-2 uppercase">{d.mes}</p> <p className="font-black text-2xl mb-1" style={{ color: getNPSColor(d.score) }}>{d.score}</p> <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{color:getNPSColor(d.score),background:getNPSColor(d.score)+'20'}}>{zone.label}</span> <div className="mt-3 space-y-1 text-[10px] opacity-70"> <p>▲ {d.p} promotores</p> <p>◆ {d.neutros} neutros</p> <p>▼ {d.det} detratores</p> <p className="pt-1 mt-1" style={{borderTop:'1px solid var(--ax-border)'}}>Σ {d.total} respostas</p> </div> </div> ); };

const PromoterBar = ({ p, neutros, det, total }) => { if (!total) return null; const pw = ((p / total) * 100).toFixed(1); const nw = ((neutros / total) * 100).toFixed(1); const dw = ((det / total) * 100).toFixed(1); return ( <div className="rounded-[24px] p-5" style={{background:'var(--ax-surface-subtle)',border:'1px solid var(--ax-border)'}}> <h4 className="text-[10px] font-black uppercase opacity-40 mb-3 tracking-widest">Distribuição das Respostas</h4> <div className="flex h-5 rounded-full overflow-hidden gap-0.5"> {p > 0 && <div style={{ width:`${pw}%`, background: COLORS.excelencia }} className="transition-all duration-700 rounded-l-full"/>} {neutros > 0 && <div style={{ width:`${nw}%`, background: COLORS.aperfeicoamento }} className="transition-all duration-700"/>} {det > 0 && <div style={{ width:`${dw}%`, background: COLORS.critica }} className="transition-all duration-700 rounded-r-full"/>} </div> <div className="flex justify-between mt-2 text-[9px] font-black uppercase"> <span style={{ color: COLORS.excelencia }}>▲ {pw}% Promotores</span> <span style={{ color: COLORS.aperfeicoamento }}>◆ {nw}% Neutros</span> <span style={{ color: COLORS.critica }}>▼ {dw}% Detratores</span> </div> </div> ); };

const HorizontalNPSChart = ({ data, dimension, label }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const items = React.useMemo(() => { const keys = [...new Set(data.map(d => d[dimension]))].filter(Boolean); return keys.map(k => { const rows = data.filter(d => d[dimension] === k); return { name: k, ...calcNPS(rows) }; }).sort((a,b) => b.nps - a.nps); }, [data, dimension]);
  if (!items.length) return null;
  const INITIAL_COUNT = 5;
  const hasMore = items.length > INITIAL_COUNT;
  const displayedItems = isExpanded ? items : items.slice(0, INITIAL_COUNT);
  return (
    <div className="rounded-[30px] p-6 flex flex-col h-full" style={{background:'var(--ax-surface-subtle)',border:'1px solid var(--ax-border)'}}>
      <h4 className="text-[10px] font-black uppercase opacity-40 mb-4 tracking-widest flex-shrink-0">NPS por {label}</h4>
      <div className="space-y-3 flex-1">
        {displayedItems.map((item, i) => { const zone = getNPSZone(item.nps); const barW = Math.max(4, ((item.nps + 100) / 200) * 100); return (
          <div key={i} style={{animation: `fadeup .3s ${i*30}ms both`}}>
            <div className="flex justify-between items-center mb-1"><span className="text-xs font-bold uppercase truncate max-w-[60%]" title={item.name}>{item.name}</span><div className="flex items-center gap-2"><span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{color:getNPSColor(item.nps),background:getNPSColor(item.nps)+'20'}}>{zone.label}</span><span className="text-sm font-black" style={{ color: getNPSColor(item.nps) }}>{item.nps}</span></div></div>
            <div className="h-2 rounded-full overflow-hidden" style={{background:'var(--ax-surface-subtle)'}}><div className="h-full rounded-full transition-all duration-700" style={{ width: `${barW}%`, background: getNPSColor(item.nps) }}/></div>
            <div className="flex gap-3 mt-1 text-[9px] opacity-40 font-bold"><span>▲ {item.p} prom.</span><span>◆ {item.neutros} neut.</span><span>▼ {item.det} detr.</span><span>Σ {item.total}</span></div>
          </div>
        ); })}
      </div>
      {hasMore && <button onClick={() => setIsExpanded(!isExpanded)} className="mt-4 pt-4 w-full flex items-center justify-center gap-2 text-xs font-semibold opacity-40 hover:opacity-100 rounded-xl transition-all" style={{borderTop:'1px solid var(--ax-border)',color:'var(--ax-accent)'}}>{isExpanded ? 'Ver menos' : `Ver mais (${items.length - INITIAL_COUNT})`} <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={isExpanded?'M18 15l-6-6-6 6':'M6 9l6 6 6-6'}/></svg></button>}
    </div>
  );
};

function NPSApp() {
  const [view, setView] = React.useState('loading');
  const [rawData, setRawData] = React.useState([]);
  const [contractsList, setContractsList] = React.useState([]);
  const [filters, setFilters] = React.useState({ mes:'Ano 26', unidade:'Todas', estrategico:'Todos', empresa:'MKE', cliente:'Todos', contrato:'Todos', verNA: false });
  const [selectedMonthInChart, setSelectedMonthInChart] = React.useState(null);
  const [exportMenuOpen, setExportMenuOpen] = React.useState(false);
  const [searchText, setSearchText] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [errorMsg, setErrorMsg] = React.useState('');
  const PAGE_SIZE = 10;

  const getCategory = (d) => {
    const padronizar = (str) => (str || '').toString().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
    const colClass = padronizar(d.classificacao);
    if (colClass === 'WIND') return 'Wind';
    if (colClass === 'PETRORECONCAVO' || colClass === 'PETRO' || colClass === 'POTIGUAR') return 'Petroreconcavo';
    if (colClass === 'VALE') return 'Vale';
    if (colClass === 'ARCELORMITTAL') return 'ArcelorMittal';
    return 'Outros';
  };

  const data = React.useMemo(() => {
    const contratoLookup = {};
    contractsList.forEach(c => { if (c.numero && c.exibicao) contratoLookup[String(c.numero).trim()] = c.exibicao; });
    const VALID_MONTH_REGEX = /^(Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez)\s\d{2}(\s-\sN\/A)?$/i;
    return rawData.filter(d => d.mes && VALID_MONTH_REGEX.test(d.mes)).map(d => {
      let u = d.unidade || ""; if (u.toUpperCase() === "WIND") u = "Wind";
      const numKey = String(d.numContrato || d.contrato || '').trim();
      const contratoExibicao = contratoLookup[numKey] || d.contrato || numKey;
      const cliente = (d.cliente || '').toString().normalize('NFC').trim().replace(/\s+/g, ' ');
      return { ...d, unidade: u, contratoExibicao, cliente };
    }).filter(d => d.unidade && d.unidade.toUpperCase() !== "SEMINOVOS");
  }, [rawData, contractsList]);

  React.useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      fetch(`${SCRIPT_URL}?action=login&user=weverson&pass=Wf023240`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(res => {
        if (cancelled) return;
        if (res.result === "success") {
          setRawData(res.metrics?.baseDados || []);
          setContractsList(res.metrics?.listaContratos || []);
          setErrorMsg('');
        } else { setErrorMsg('Login negado pela API.'); }
        setView('dashboard');
      })
      .catch(err => { if (cancelled) return; console.error('NPS Fetch Error:', err); setErrorMsg('API indisponível — usando dados offline'); setView('dashboard'); });
    }, 500);

    /* Força resolução após 10s se API não responder */
    var forceTimer = setTimeout(() => {
      if (cancelled) return;
      setErrorMsg('API não respondeu — usando dados offline');
      setView('dashboard');
    }, 10000);

    return () => { cancelled = true; clearTimeout(timeout); clearTimeout(forceTimer); };
  }, []);

  React.useEffect(() => { setSelectedMonthInChart(null); }, [filters.mes]);
  React.useEffect(() => { setCurrentPage(1); }, [filters, searchText, selectedMonthInChart]);

  const stats = React.useMemo(() => {
    const VALID_MONTH_REGEX = /^(Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez)\s\d{2}(\s-\sN\/A)?$/i;
    const filtered = data.filter(d => {
      const isNA = d.mes.includes(' - N/A'); const cleanMes = d.mes.replace(' - N/A', '');
      if (isNA && !filters.verNA) return false;
      let matchMes = false;
      if (selectedMonthInChart) matchMes = cleanMes === selectedMonthInChart.replace(' - N/A', '');
      else { if (filters.mes === 'Todos') matchMes = true; else if (filters.mes.startsWith('Ano ')) { const y = filters.mes.replace('Ano ',''); matchMes = cleanMes.endsWith(y); } else matchMes = cleanMes === filters.mes; }
      const matchEstrategico = filters.estrategico === 'Todos' || getCategory(d) === filters.estrategico;
      const matchEmpresa = filters.empresa === 'Todas' || d.empresa === filters.empresa;
      return matchMes && matchEstrategico && matchEmpresa && (filters.unidade === 'Todas' || d.unidade === filters.unidade) && (filters.cliente === 'Todos' || d.cliente === filters.cliente) && (filters.contrato === 'Todos' || d.contratoExibicao === filters.contrato);
    });
    const { total, p, det, neutros, nps } = calcNPS(filtered);
    return { total, p, det, neutros, nps, filtered };
  }, [data, filters, selectedMonthInChart]);

  const monthlyNpsData = React.useMemo(() => {
    const VALID_MONTH_REGEX = /^(Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez)\s\d{2}(\s-\sN\/A)?$/i;
    const baseFilteredData = data.filter(d => {
      const isNA = d.mes.includes(' - N/A'); if (isNA && !filters.verNA) return false;
      const matchEstrategico = filters.estrategico === 'Todos' || getCategory(d) === filters.estrategico;
      const matchEmpresa = filters.empresa === 'Todas' || d.empresa === filters.empresa;
      return matchEstrategico && matchEmpresa && (filters.unidade === 'Todas' || d.unidade === filters.unidade) && (filters.cliente === 'Todos' || d.cliente === filters.cliente) && (filters.contrato === 'Todos' || d.contratoExibicao === filters.contrato);
    });
    let monthsToShow = [...new Set(baseFilteredData.map(r => r.mes.replace(' - N/A', '')))].filter(Boolean);
    if (filters.mes !== 'Todos') { if (filters.mes.startsWith('Ano ')) { const y = filters.mes.replace('Ano ',''); monthsToShow = monthsToShow.filter(m => m.endsWith(y)); } else monthsToShow = monthsToShow.filter(m => m === filters.mes); }
    return sortMonthsChronologically(monthsToShow).map(m => { const rows = baseFilteredData.filter(x => x.mes.replace(' - N/A', '') === m); const { nps, p, det, neutros, total } = calcNPS(rows); return { mes:m, score:nps, p, det, neutros, total }; });
  }, [data, filters]);

  const tableData = React.useMemo(() => { const reversed = stats.filtered.slice().reverse(); if (!searchText.trim()) return reversed; const q = searchText.toLowerCase(); return reversed.filter(r => (r.cliente || '').toLowerCase().includes(q) || (r.contratoExibicao || '').toLowerCase().includes(q) || (r.feedback || '').toLowerCase().includes(q) || String(r.nota).includes(q)); }, [stats.filtered, searchText]);
  const totalPages = Math.max(1, Math.ceil(tableData.length / PAGE_SIZE)); const pagedData = tableData.slice((currentPage-1)*PAGE_SIZE, currentPage*PAGE_SIZE);

  const handleBarClick = (d) => { if (d?.activePayload?.[0]?.payload?.mes) { const m = d.activePayload[0].payload.mes; setSelectedMonthInChart(prev => prev === m ? null : m); } };
  const handleExport = (type) => { setExportMenuOpen(false); const dataToExport = type === 'all' ? data : stats.filtered; var escCSV = function(v) { var s = String(v||''); if (s.indexOf(',')!==-1 || s.indexOf('"')!==-1 || s.indexOf('\n')!==-1) s = '"' + s.replace(/"/g,'""') + '"'; return s; }; const csvRows = [['Mês','Contrato','Cliente','Unidade','Nota','Feedback','Data Resposta'], ...dataToExport.map(d => [d.mes, d.contratoExibicao, d.cliente, d.unidade, d.nota, d.feedback, d.data])]; const uri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.map(e => e.map(escCSV).join(",")).join("\n")); const link = document.createElement("a"); link.setAttribute("href", uri); link.setAttribute("download", "Export_NPS_Makro.csv"); link.click(); };

  if (view === 'loading') return <div className="flex h-full items-center justify-center pt-20"><div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{borderColor:'var(--ax-accent)',borderTopColor:'transparent'}}></div></div>;

  return (
    <div className="pb-20" style={{color:'var(--ax-text)'}}>
      <div className="space-y-8">
        {errorMsg && (
          <div className="rounded-2xl p-4 flex items-center gap-3" style={{background:'var(--ax-danger-soft)',border:'1px solid color-mix(in oklab,var(--ax-danger-500) 30%,transparent)'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ax-danger-500)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span className="text-xs font-bold" style={{color:'var(--ax-danger-500)'}}>{errorMsg}</span>
          </div>
        )}
        <div className="flex justify-between items-center">
          <div><h2 className="text-2xl font-extrabold tracking-tight" style={{color:'var(--ax-text-strong)'}}>Dashboard NPS</h2></div>
          <div className="flex gap-2">
            <div className="relative">
              <button onClick={() => setExportMenuOpen(!exportMenuOpen)} className="p-3 rounded-2xl font-bold text-xs transition-all" style={{background:'color-mix(in oklab,var(--ax-viz-emerald) 10%,transparent)',color:'var(--ax-viz-emerald)',border:'1px solid color-mix(in oklab,var(--ax-viz-emerald) 20%,transparent)'}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </button>
              {exportMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl shadow-2xl z-50 overflow-hidden" style={{background:'var(--ax-surface)',border:'1px solid var(--ax-border)'}}>
                  <button onClick={() => handleExport('filtered')} className="w-full text-left p-4 text-[10px] font-bold uppercase hover:opacity-80 transition flex items-center gap-2" style={{borderBottom:'1px solid var(--ax-border)'}}>Exportar Filtrado</button>
                  <button onClick={() => handleExport('all')} className="w-full text-left p-4 text-[10px] font-bold uppercase hover:opacity-80 transition flex items-center gap-2">Exportar Tudo</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FILTROS */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-6 rounded-[30px]" style={{background:'var(--ax-surface-subtle)',border:'1px solid var(--ax-border)'}}>
          <div>
            <div className="flex justify-between items-center ml-2 mb-1">
              <label className="text-[10px] font-bold opacity-30 uppercase">Mês</label>
              <label className="flex items-center gap-1.5 cursor-pointer group">
                <input type="checkbox" checked={filters.verNA} onChange={e => setFilters({...filters, verNA: e.target.checked})} className="w-3 h-3 rounded cursor-pointer"/>
                <span className="text-[8px] font-black opacity-30 group-hover:opacity-60 transition-opacity uppercase tracking-tighter">Incluir N/A</span>
              </label>
            </div>
            <select className="w-full p-3 rounded-xl outline-none text-xs cursor-pointer" style={{background:'var(--ax-surface)',border:'1px solid var(--ax-border)',color:'var(--ax-text)'}} value={filters.mes} onChange={e=>setFilters({...filters, mes:e.target.value})}>
              <option value="Todos">Todos os Períodos</option>
              {Object.entries(groupMonthsByYear(sortMonthsChronologically([...new Set(data.map(d=>d.mes.replace(' - N/A', '')))].filter(Boolean)))).map(([y,ms])=>(
                <optgroup key={y} label={y}><option value={`Ano ${y.slice(-2)}`}>Todo o Ano {y}</option>{ms.map(m=><option key={m} value={m}>{m}</option>)}</optgroup>
              ))}
            </select>
          </div>
          <div><label className="text-[10px] font-bold opacity-30 uppercase ml-2 mb-1 block">Unidade</label><select className="w-full p-3 rounded-xl outline-none text-xs cursor-pointer" style={{background:'var(--ax-surface)',border:'1px solid var(--ax-border)',color:'var(--ax-text)'}} value={filters.unidade} onChange={e=>setFilters({...filters, unidade:e.target.value, estrategico:'Todos', cliente:'Todos', contrato:'Todos'})}><option value="Todas">Todas</option>{[...new Set(data.map(d=>d.unidade))].filter(v => v && v !== "Não Definida").sort().map(v=><option key={v} value={v}>{v}</option>)}</select></div>
          <div><label className="text-[10px] font-bold opacity-30 uppercase ml-2 mb-1 block" style={{color:'var(--ax-viz-cyan)'}}>Estratégico</label><select className="w-full p-3 rounded-xl outline-none text-xs cursor-pointer" style={{background:'var(--ax-surface)',border:'1px solid var(--ax-border)',color:'var(--ax-text)'}} value={filters.estrategico} onChange={e=>setFilters({...filters, estrategico:e.target.value, cliente:'Todos', contrato:'Todos'})}><option value="Todos">Todos</option><option value="ArcelorMittal">ArcelorMittal</option><option value="Vale">Vale</option><option value="Petroreconcavo">Petroreconcavo</option><option value="Wind">Wind</option><option value="Outros">Outros</option></select></div>
          <div><label className="text-[10px] font-bold opacity-30 uppercase ml-2 mb-1 block" style={{color:'var(--ax-viz-violet)'}}>Empresa</label><select className="w-full p-3 rounded-xl outline-none text-xs cursor-pointer" style={{background:'var(--ax-surface)',border:'1px solid var(--ax-border)',color:'var(--ax-text)'}} value={filters.empresa} onChange={e=>setFilters({...filters, empresa:e.target.value, cliente:'Todos', contrato:'Todos'})}><option value="Todas">MKE + MKT</option><option value="MKE">MKE (Engenharia)</option><option value="MKT">MKT (Transportes)</option></select></div>
          <div><label className="text-[10px] font-bold opacity-30 uppercase ml-2 mb-1 block">Cliente</label><select className="w-full p-3 rounded-xl outline-none text-xs cursor-pointer" style={{background:'var(--ax-surface)',border:'1px solid var(--ax-border)',color:'var(--ax-text)'}} value={filters.cliente} onChange={e=>setFilters({...filters, cliente:e.target.value, contrato:'Todos'})}><option value="Todos">Todos</option>{[...new Set(data.filter(d => (filters.unidade==='Todas' || d.unidade===filters.unidade) && (filters.estrategico==='Todos' || getCategory(d)===filters.estrategico) && (filters.empresa==='Todas' || d.empresa===filters.empresa)).map(d=>d.cliente))].filter(Boolean).sort().map(v=><option key={v} value={v}>{v}</option>)}</select></div>
          <div><label className="text-[10px] font-bold opacity-30 uppercase ml-2 mb-1 block">Contrato</label><select className="w-full p-3 rounded-xl outline-none text-xs cursor-pointer" style={{background:'var(--ax-surface)',border:'1px solid var(--ax-border)',color:'var(--ax-text)'}} value={filters.contrato} onChange={e=>setFilters({...filters, contrato:e.target.value})}><option value="Todos">Todos</option>{[...new Set(data.filter(d => (filters.unidade==='Todas' || d.unidade===filters.unidade) && (filters.estrategico==='Todos' || getCategory(d)===filters.estrategico) && (filters.empresa==='Todas' || d.empresa===filters.empresa) && (filters.cliente==='Todos' || d.cliente===filters.cliente)).map(d=>d.contratoExibicao))].filter(Boolean).sort().map(v=><option key={v} value={v}>{v}</option>)}</select></div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[{l:'Total Respostas',v:stats.total,c:'var(--ax-text)'},{l:'Promotores',v:stats.p,c:COLORS.excelencia},{l:'Neutros',v:stats.neutros,c:COLORS.aperfeicoamento},{l:'Detratores',v:stats.det,c:COLORS.critica},{l:'NPS Score',v:stats.nps,c:getNPSColor(stats.nps),h:true}].map((s,i)=>(
            <div key={i} className="p-6 rounded-3xl border text-center" style={{background:s.h?'var(--ax-surface-subtle)':'var(--ax-surface)',borderColor:s.h?'var(--ax-border-strong)':'var(--ax-border)'}}>
              <span className="text-[10px] font-bold opacity-40 uppercase block mb-1">{s.l}</span><span className="text-3xl font-black" style={{color:s.c}}>{s.v}</span>
              {s.h && <div className="mt-2"><span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{color:getNPSColor(stats.nps),background:getNPSColor(stats.nps)+'20'}}>{getNPSZone(stats.nps).label}</span></div>}
            </div>
          ))}
        </div>

        <PromoterBar p={stats.p} neutros={stats.neutros} det={stats.det} total={stats.total}/>

        {/* CHART */}
        <div className="p-8 rounded-[40px]" style={{minHeight:520,background:'var(--ax-surface-subtle)',border:'1px solid var(--ax-border)'}}>
          <div className="mb-4 flex justify-between items-center flex-wrap gap-2">
            <div><h4 className="text-xs font-bold uppercase opacity-40">Série Histórica NPS</h4>{!selectedMonthInChart && <p className="text-[10px] opacity-30 mt-1">Clique na barra para filtrar</p>}{selectedMonthInChart && <p className="text-[10px] font-bold mt-1" style={{color:'var(--ax-danger-500)'}}>Filtrando: <strong>{selectedMonthInChart}</strong></p>}</div>
            <div className="flex gap-4 flex-wrap">{[{c:COLORS.excelencia,l:'EXCELÊNCIA ≥75'},{c:COLORS.qualidade,l:'QUALIDADE ≥50'},{c:COLORS.aperfeicoamento,l:'APERFEIÇOAMENTO ≥0'},{c:COLORS.critica,l:'CRÍTICO <0'}].map(({c,l})=><div key={l} className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{background:c}}/><span className="text-[8px] font-bold opacity-40">{l}</span></div>)}</div>
          </div>
          {monthlyNpsData.length > 0 && window.Recharts && (
            <ResponsiveContainer width="100%" height="85%">
              <ComposedChart key={JSON.stringify(filters)} data={monthlyNpsData} onClick={handleBarClick} style={{cursor:'pointer'}}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ax-border)"/>
                <XAxis dataKey="mes" stroke="var(--ax-text-subtle)" fontSize={10}/>
                <YAxis yAxisId="left" stroke="var(--ax-text-subtle)" fontSize={10} label={{value:'Respostas',angle:-90,position:'insideLeft',style:{fontSize:10,fill:'var(--ax-text-subtle)'}}}/>
                <YAxis yAxisId="right" orientation="right" stroke="var(--ax-accent)" fontSize={10} domain={[-100,100]} label={{value:'NPS Score',angle:90,position:'insideRight',style:{fontSize:10,fill:'var(--ax-accent)'}}}/>
                <Tooltip content={<CustomBarTooltip/>} cursor={{fill:'var(--ax-surface-subtle)'}}/>
                <Legend wrapperStyle={{fontSize:11,color:'var(--ax-text-muted)'}}/>
                <Bar yAxisId="left" dataKey="p" name="Promotores" stackId="a" fill={COLORS.excelencia} radius={[0,0,0,0]}/>
                <Bar yAxisId="left" dataKey="neutros" name="Neutros" stackId="a" fill={COLORS.aperfeicoamento}/>
                <Bar yAxisId="left" dataKey="det" name="Detratores" stackId="a" fill={COLORS.critica} radius={[8,8,0,0]}/>
                <Line yAxisId="right" type="monotone" dataKey="score" name="NPS" stroke="var(--ax-accent)" strokeWidth={3} dot={{fill:'var(--ax-accent)',r:4}} activeDot={{r:6}}>
                  <LabelList dataKey="score" position="top" fill="var(--ax-accent)" fontSize={10} fontWeight="bold"/>
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          )}
          {(!monthlyNpsData.length || !window.Recharts) && <div className="flex items-center justify-center h-full opacity-30 text-sm">Sem dados de gráfico</div>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <HorizontalNPSChart data={stats.filtered} dimension="cliente" label="Cliente"/>
          <HorizontalNPSChart data={stats.filtered} dimension="unidade" label="Unidade"/>
        </div>

        {/* TABELA */}
        <div className="rounded-[40px] overflow-hidden" style={{background:'var(--ax-surface-subtle)',border:'1px solid var(--ax-border)'}}>
          <div className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-3" style={{borderBottom:'1px solid var(--ax-border)'}}>
            <div><h4 className="text-xs font-bold uppercase opacity-40">Respostas Recentes</h4><span className="text-[10px] font-bold opacity-30">{tableData.length} registros</span></div>
            <div className="relative">
              <input value={searchText} onChange={e=>setSearchText(e.target.value)} placeholder="Buscar..." className="rounded-xl pl-8 pr-4 py-2 text-xs outline-none w-64 transition-all" style={{background:'var(--ax-surface)',border:'1px solid var(--ax-border)',color:'var(--ax-text)'}}/>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead><tr className="font-bold uppercase tracking-widest" style={{background:'var(--ax-surface-subtle)'}}><th className="p-5">Mês</th><th className="p-5">Contrato</th><th className="p-5">Cliente</th><th className="p-5 text-center">Nota</th><th className="p-5">Zona</th><th className="p-5">Comentário</th></tr></thead>
              <tbody>
                {pagedData.length === 0 && <tr><td colSpan="6" className="p-10 text-center opacity-30 text-xs font-bold uppercase">Nenhum registro</td></tr>}
                {pagedData.map((r, i) => { const zone = getNPSZone(r.nota); return (
                  <tr key={i} className="transition-all" style={{borderBottom:'1px solid var(--ax-border)'}}>
                    <td className="p-5 opacity-40">{r.mes}</td>
                    <td className="p-5 font-bold" style={{color:'var(--ax-accent)'}}>{r.contratoExibicao}</td>
                    <td className="p-5 uppercase">{r.cliente}</td>
                    <td className="p-5 text-center"><span className="px-3 py-1 rounded-full text-[10px] font-bold" style={{ background: getNPSColor(r.nota) + '20', color: getNPSColor(r.nota) }}>{r.nota}</span></td>
                    <td className="p-5"><span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{color:getNPSColor(r.nota),background:getNPSColor(r.nota)+'20'}}>{zone.label}</span></td>
                    <td className="p-5 opacity-60 max-w-xs truncate">{r.feedback || 'Sem comentário'}</td>
                  </tr>
                ); })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4" style={{borderTop:'1px solid var(--ax-border)'}}>
              <span className="text-[10px] font-bold opacity-30">Página {currentPage} de {totalPages}</span>
              <div className="flex gap-1">
                <button disabled={currentPage===1} onClick={()=>setCurrentPage(1)} className="px-3 py-1 rounded-lg text-[10px] font-bold transition disabled:opacity-20" style={{background:'var(--ax-surface-subtle)',color:'var(--ax-text)'}}>«</button>
                <button disabled={currentPage===1} onClick={()=>setCurrentPage(p=>p-1)} className="px-3 py-1 rounded-lg text-[10px] font-bold transition disabled:opacity-20" style={{background:'var(--ax-surface-subtle)',color:'var(--ax-text)'}}>‹</button>
                {Array.from({length:Math.min(5,totalPages)},(_,i) => { let p=currentPage-2+i; if(p<1)p=i+1; if(p>totalPages)p=totalPages-(4-i); if(p<1||p>totalPages)return null; return <button key={p} onClick={()=>setCurrentPage(p)} className="px-3 py-1 rounded-lg text-[10px] font-bold transition" style={currentPage===p?{background:'var(--ax-accent)',color:'var(--ax-on-accent)'}:{background:'var(--ax-surface-subtle)',color:'var(--ax-text)'}}>{p}</button>; })}
                <button disabled={currentPage===totalPages} onClick={()=>setCurrentPage(p=>p+1)} className="px-3 py-1 rounded-lg text-[10px] font-bold transition disabled:opacity-20" style={{background:'var(--ax-surface-subtle)',color:'var(--ax-text)'}}>›</button>
                <button disabled={currentPage===totalPages} onClick={()=>setCurrentPage(totalPages)} className="px-3 py-1 rounded-lg text-[10px] font-bold transition disabled:opacity-20" style={{background:'var(--ax-surface-subtle)',color:'var(--ax-text)'}}>»</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

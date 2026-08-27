/* ============ BANCO DE HORAS (completo - igual Makro Hub) ============ */
const { useState, useEffect, useMemo } = React;
const bhDb = window.fb ? window.fb.db : _db;
const bhAuth = _auth;
const bhProvider = _googleProvider;

const BH_ICONS = {
  dashboard: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  clock: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  fire: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>,
  gift: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  edit: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  zap: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  trophy: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
};

const BH_LEVELS = [
  { name: 'Estagiario', minXP: 0, icon: '🌱' },
  { name: 'Junior', minXP: 50, icon: '🔵' },
  { name: 'Pleno', minXP: 150, icon: '⚡' },
  { name: 'Senior', minXP: 300, icon: '🔥' },
  { name: 'Lead', minXP: 500, icon: '💎' },
  { name: 'Manager', minXP: 800, icon: '👑' },
  { name: 'Diretor', minXP: 1200, icon: '🏆' },
];

const BH_ACHIEVEMENTS = [
  { id: 'first_ponto', name: 'Primeiro Ponto', icon: '⏰', check: (s) => s.totalPontos >= 1 },
  { id: 'week_streak', name: 'Sequencia de 5', icon: '🔥', check: (s) => s.streak >= 5 },
  { id: 'balance_10', name: 'Saldo +10h', icon: '⭐', check: (s) => s.totalBalance >= 10 },
  { id: 'balance_44', name: 'Dia de Folga!', icon: '🎉', check: (s) => s.totalBalance >= 44 },
];

const BH_DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sab'];

function BancoHorasApp() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const defaultConfig = { salario: 0, entrada: '07:50', saida: '17:38', horasAlmoco: 1, diasSemana: [1,2,3,4,5], saldoInicialMin: 0 };
  const [config, setConfig] = useState(defaultConfig);
  const [registros, setRegistros] = useState([]);
  const [manualRecords, setManualRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bhTab, setBhTab] = useState('dashboard');
  const [filterMonth, setFilterMonth] = useState(() => new Date().toLocaleDateString('pt-BR',{month:'short',year:'2-digit'}).toUpperCase());
  const [pontoDate, setPontoDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [pontoEntrada, setPontoEntrada] = useState('');
  const [pontoSaida, setPontoSaida] = useState('');
  const [manualRef, setManualRef] = useState('');
  const [manualHrs, setManualHrs] = useState('');
  const [manualTipo, setManualTipo] = useState('negativo');

  useEffect(() => {
    if (!bhAuth) { setAuthLoading(false); setLoading(false); return; }
    const unsub = bhAuth.onAuthStateChanged(u => { setUser(u); setAuthLoading(false); });
    return unsub;
  }, []);

  const getUserRef = () => user ? bhDb.collection('users').doc(user.uid) : null;

  useEffect(() => {
    if(!user) { setLoading(false); return; }
    const load = async () => {
      try {
        const ref = getUserRef();
        const cfg = await ref.collection('config').doc('main').get();
        if(cfg.exists) setConfig({...defaultConfig, ...cfg.data()});
        const reg = await ref.collection('registros').orderBy('date','desc').get();
        setRegistros(reg.docs.map(d => ({...d.data(), id: d.id})));
        const man = await ref.collection('manual').get();
        setManualRecords(man.docs.map(d => ({...d.data(), id: d.id})));
      } catch(e) { console.error(e); }
      setLoading(false);
    };
    load();
  }, [user]);

  useEffect(() => { if(!loading && user && getUserRef()) getUserRef().collection('config').doc('main').set(config); }, [config, loading, user]);

  const parseTime = t => { if(!t||!t.includes(':')) return 0; const [h,m] = t.split(':').map(Number); return (h||0)+((m||0)/60); };
  const fmtTime = dec => { const s=dec<0?'-':''; const a=Math.abs(dec); const h=Math.floor(a); const m=Math.round((a-h)*60); return `${s}${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`; };
  const expectedHours = parseTime(config.saida) - parseTime(config.entrada) - (config.horasAlmoco||0);
  const isWorkDay = d => { const dt = new Date(d+'T12:00:00'); return config.diasSemana.includes(dt.getDay()); };
  const getMonthKey = d => { const dt = new Date(d+'T12:00:00'); return dt.toLocaleDateString('pt-BR',{month:'short',year:'2-digit'}).toUpperCase(); };
  const allMonths = useMemo(() => Array.from({length:12},(_,i) => new Date(new Date().getFullYear(),i,1).toLocaleDateString('pt-BR',{month:'short',year:'2-digit'}).toUpperCase()),[]);

  const stats = useMemo(() => {
    const si = (config.saldoInicialMin||0)/60;
    let tb=si, xp=0, tp=registros.length, tm=manualRecords.length, st=0, cs=0, pw=0, ee=null;
    [...registros].sort((a,b)=>a.date.localeCompare(b.date)).forEach(r => {
      if(r.entrada&&r.saida&&isWorkDay(r.date)) {
        const w=parseTime(r.saida)-parseTime(r.entrada)-(config.horasAlmoco||0), d=w-expectedHours;
        tb+=d; if(d>0){cs++;xp+=Math.round(d*10)}else cs=0; if(cs>st)st=cs; if(w>=expectedHours)pw++; if(!ee||r.entrada<ee)ee=r.entrada;
      }
    });
    manualRecords.forEach(r => { tb+=r.tipo==='positivo'?r.decimal:-r.decimal; xp+=r.tipo==='positivo'?Math.round(r.decimal*5):0; });
    xp+=tp*5;
    const lv=[...BH_LEVELS].reverse().find(l=>xp>=l.minXP)||BH_LEVELS[0];
    const nl=BH_LEVELS[BH_LEVELS.indexOf(lv)+1];
    const xpP=nl?((xp-lv.minXP)/(nl.minXP-lv.minXP))*100:100;
    const dpf=expectedHours>0?Math.ceil(expectedHours):8;
    const fp=tb>=dpf?Math.floor(tb/dpf):0;
    const hpp=tb>=0?dpf-(tb%dpf):dpf+tb;
    return {totalBalance:tb,totalXP:xp,totalPontos:tp,streak:st,currentStreak:cs,level:lv,nextLevel:nl,xpProgress:xpP,folgasPossiveis:fp,horasParaProxFolga:hpp,diasParaFolga:dpf};
  },[registros,manualRecords,config]);

  const filteredTime = useMemo(() => registros.filter(r=>getMonthKey(r.date)===filterMonth).sort((a,b)=>b.date.localeCompare(a.date)),[registros,filterMonth]);
  const filteredManual = useMemo(() => manualRecords.filter(r=>r.ref===filterMonth),[manualRecords,filterMonth]);
  const monthBalance = useMemo(() => {
    let b=0;
    filteredTime.forEach(r=>{if(r.entrada&&r.saida&&isWorkDay(r.date))b+=(parseTime(r.saida)-parseTime(r.entrada)-(config.horasAlmoco||0))-expectedHours});
    filteredManual.forEach(r=>{b+=r.tipo==='positivo'?r.decimal:-r.decimal});
    return b;
  },[filteredTime,filteredManual,config]);

  const handleSavePonto = () => {
    if(!pontoDate||!getUserRef()) return;
    const w=(pontoEntrada&&pontoSaida)?parseTime(pontoSaida)-parseTime(pontoEntrada)-(config.horasAlmoco||0):0;
    const d=w-expectedHours, ss=`${d>=0?'+':'-'}${fmtTime(Math.abs(d))}`;
    const rec={date:pontoDate,entrada:pontoEntrada,saida:pontoSaida,saldo:ss};
    const ex=registros.find(r=>r.date===pontoDate);
    setRegistros(ex?registros.map(r=>r.date===pontoDate?rec:r):[...registros,rec]);
    getUserRef().collection('registros').doc(pontoDate).set(rec,{merge:true});
    setPontoEntrada('');setPontoSaida('');setPontoDate(new Date().toISOString().split('T')[0]);
  };
  const handleEditPonto = r => { setPontoDate(r.date); setPontoEntrada(r.entrada); setPontoSaida(r.saida); };
  const handleDeletePonto = d => { if(confirm('Excluir?')){setRegistros(registros.filter(r=>r.date!==d));getUserRef().collection('registros').doc(d).delete();} };
  const handleSaveManual = () => {
    if(!manualRef||!manualHrs||!getUserRef()) return;
    const rec={id:Date.now(),ref:manualRef,hrsStr:manualHrs,tipo:manualTipo,decimal:parseTime(manualHrs)};
    setManualRecords([...manualRecords,rec]);
    getUserRef().collection('manual').doc(String(rec.id)).set(rec);
    setManualRef('');setManualHrs('');setManualTipo('negativo');
  };
  const handleDeleteManual = id => { if(confirm('Excluir?')){setManualRecords(manualRecords.filter(r=>r.id!==id));getUserRef().collection('manual').doc(String(id)).delete();} };

  if(authLoading) return <div className="flex items-center justify-center h-64"><div className="text-2xl animate-pulse">⏳</div></div>;
  if(!user && bhAuth) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center" style={{color:'var(--ax-text)'}}>
        <div className="text-4xl mb-3">⏱️</div>
        <p className="text-sm opacity-50 mb-4">Faça login para acessar o Banco de Horas</p>
        <button onClick={()=>bhAuth.signInWithPopup(bhProvider)} className="px-6 py-3 rounded-xl text-sm font-bold text-white transition" style={{background:'var(--ax-accent)'}}>Entrar com Google</button>
      </div>
    </div>
  );
  if(!user && !bhAuth) {
    // Fallback local
    return <BancoHorasLocal />;
  }
  if(loading) return <div className="flex items-center justify-center h-64"><div className="text-2xl animate-pulse">⏳</div></div>;

  const tips = [];
  if(stats.folgasPossiveis>=1) tips.push({icon:'🎉',text:`Saldo para ${stats.folgasPossiveis} folga(s)!`});
  if(stats.totalBalance>0&&stats.horasParaProxFolga<=4) tips.push({icon:'🎯',text:`Faltam ${fmtTime(stats.horasParaProxFolga)} para 1 folga!`});
  if(stats.streak>=3) tips.push({icon:'🔥',text:`${stats.streak} dias positivos!`});
  if(stats.totalBalance<-5) tips.push({icon:'⚡',text:`Saldo ${fmtTime(stats.totalBalance)}. Repor horas!`});
  if(!tips.length) tips.push({icon:'✨',text:'Tudo certo!'});

  return (
    <div className="space-y-4" style={{color:'var(--ax-text)'}}>
      <div className="flex items-center gap-1 text-xs overflow-x-auto pb-1">
        {[{id:'dashboard',label:'Home'},{id:'ponto',label:'Ponto'},{id:'historico',label:'Histórico'},{id:'banco',label:'Banco'},{id:'ajustes',label:'Ajustes'}].map(t => (
          <button key={t.id} onClick={()=>setBhTab(t.id)} className={`px-3 py-1.5 rounded-lg font-bold uppercase whitespace-nowrap transition ${bhTab===t.id?'text-white':'opacity-50 hover:opacity-80'}`} style={bhTab===t.id?{background:'var(--ax-accent)'}:{}}>{t.label}</button>
        ))}
      </div>

      {bhTab==='dashboard' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl text-center" style={{background:'var(--ax-surface)',border:'1px solid var(--ax-border)'}}>
              <div className="text-[10px] uppercase opacity-40 mb-1">Saldo</div>
              <div className="text-xl font-black" style={{color:stats.totalBalance>=0?'var(--ax-viz-emerald)':'var(--ax-danger-500)'}}>{stats.totalBalance>=0?'+':''}{fmtTime(stats.totalBalance)}</div>
            </div>
            <div className="p-4 rounded-2xl text-center" style={{background:'var(--ax-surface)',border:'1px solid var(--ax-border)'}}>
              <div className="text-[10px] uppercase opacity-40 mb-1">Sequência</div>
              <div className="flex items-center justify-center gap-1">{BH_ICONS.fire}<span className="text-xl font-black" style={{color:'var(--ax-viz-amber)'}}>{stats.currentStreak}</span></div>
            </div>
            <div className="p-4 rounded-2xl text-center" style={{background:'var(--ax-surface)',border:'1px solid var(--ax-border)'}}>
              <div className="text-[10px] uppercase opacity-40 mb-1">Folgas</div>
              <div className="flex items-center justify-center gap-1">{BH_ICONS.gift}<span className="text-xl font-black" style={{color:'var(--ax-viz-violet)'}}>{stats.folgasPossiveis}</span></div>
            </div>
          </div>
          <div className="p-4 rounded-2xl" style={{background:'var(--ax-surface)',border:'1px solid var(--ax-border)'}}>
            <div className="flex items-center gap-2 mb-2">{BH_ICONS.trophy}<span className="text-xs font-bold opacity-50">{stats.level.icon} {stats.level.name} | {stats.totalXP} XP</span></div>
            <div className="h-2 rounded-full overflow-hidden" style={{background:'var(--ax-surface-subtle)'}}><div className="h-full rounded-full transition-all" style={{width:`${Math.min(stats.xpProgress,100)}%`,background:'var(--ax-viz-violet)'}}></div></div>
          </div>
          {tips.map((t,i) => <div key={i} className="p-3 rounded-xl flex items-center gap-2" style={{background:'var(--ax-surface)',border:'1px solid var(--ax-border)'}}><span>{t.icon}</span><span className="text-sm">{t.text}</span></div>)}
        </div>
      )}

      {bhTab==='ponto' && (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">{allMonths.map(m=><button key={m} onClick={()=>setFilterMonth(m)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap transition" style={filterMonth===m?{background:'var(--ax-surface-subtle)',color:'var(--ax-text-strong)'}:{color:'var(--ax-text-muted)'}}>{m}</button>)}</div>
          <div className="p-4 rounded-2xl" style={{background:monthBalance>=0?'color-mix(in oklab,var(--ax-viz-emerald) 10%,transparent)':'color-mix(in oklab,var(--ax-danger-500) 10%,transparent)',border:monthBalance>=0?'1px solid color-mix(in oklab,var(--ax-viz-emerald) 20%,transparent)':'1px solid color-mix(in oklab,var(--ax-danger-500) 20%,transparent)'}}>
            <div className="text-[10px] uppercase opacity-50">Saldo do Mês</div>
            <div className="text-2xl font-black" style={{color:monthBalance>=0?'var(--ax-viz-emerald)':'var(--ax-danger-500)'}}>{monthBalance>=0?'+':''}{fmtTime(monthBalance)}</div>
          </div>
          <div className="p-4 rounded-2xl" style={{background:'var(--ax-surface)',border:'1px solid var(--ax-border)'}}>
            <div className="text-[10px] font-bold uppercase opacity-50 mb-3">Registrar Ponto</div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <input type="date" value={pontoDate} onChange={e=>setPontoDate(e.target.value)} className="p-2.5 rounded-xl text-xs font-bold outline-none" style={{background:'var(--ax-surface-subtle)',border:'1px solid var(--ax-border)',color:'var(--ax-text)'}} />
              <input type="time" value={pontoEntrada} onChange={e=>setPontoEntrada(e.target.value)} className="p-2.5 rounded-xl text-xs font-bold text-center outline-none" style={{background:'var(--ax-surface-subtle)',border:'1px solid var(--ax-border)',color:'var(--ax-text)'}} />
              <input type="time" value={pontoSaida} onChange={e=>setPontoSaida(e.target.value)} className="p-2.5 rounded-xl text-xs font-bold text-center outline-none" style={{background:'var(--ax-surface-subtle)',border:'1px solid var(--ax-border)',color:'var(--ax-text)'}} />
            </div>
            <button onClick={handleSavePonto} className="w-full py-3 rounded-xl text-xs font-bold text-white uppercase transition" style={{background:'var(--ax-accent)'}}>Salvar</button>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{background:'var(--ax-surface)',border:'1px solid var(--ax-border)'}}>
            <table className="w-full text-sm">
              <thead className="text-[10px] font-bold uppercase opacity-40" style={{background:'var(--ax-surface-subtle)'}}><tr><th className="p-3 text-left">Data</th><th className="p-3">Ent</th><th className="p-3">Sai</th><th className="p-3">Saldo</th><th className="p-3"></th></tr></thead>
              <tbody>
                {filteredTime.map(r => {
                  const d=new Date(r.date+'T12:00:00');
                  return <tr key={r.date} className="border-t" style={{borderColor:'var(--ax-border)'}}>
                    <td className="p-3 font-bold">{d.getDate().toString().padStart(2,'0')} <span className="text-[10px] opacity-40">{BH_DIAS[d.getDay()]}</span></td>
                    <td className="p-3 text-center font-mono text-xs">{r.entrada||'--:--'}</td>
                    <td className="p-3 text-center font-mono text-xs">{r.saida||'--:--'}</td>
                    <td className="p-3 text-center font-bold text-xs" style={{color:r.saldo?.startsWith('+')?'var(--ax-viz-emerald)':'var(--ax-danger-500)'}}>{r.saldo||'--'}</td>
                    <td className="p-3 flex gap-1">
                      <button onClick={()=>handleEditPonto(r)} className="opacity-50 hover:opacity-100">{BH_ICONS.edit}</button>
                      <button onClick={()=>handleDeletePonto(r.date)} style={{color:'var(--ax-danger-500)'}} className="opacity-50 hover:opacity-100">{BH_ICONS.trash}</button>
                    </td>
                  </tr>;
                })}
                {!filteredTime.length && <tr><td colSpan="5" className="p-6 text-center text-xs opacity-30">Nenhum registro</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {bhTab==='historico' && (
        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-1">{allMonths.map(m=><button key={m} onClick={()=>setFilterMonth(m)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap transition" style={filterMonth===m?{background:'var(--ax-surface-subtle)',color:'var(--ax-text-strong)'}:{color:'var(--ax-text-muted)'}}>{m}</button>)}</div>
          <div className="p-4 rounded-2xl" style={{background:monthBalance>=0?'color-mix(in oklab,var(--ax-viz-emerald) 10%,transparent)':'color-mix(in oklab,var(--ax-danger-500) 10%,transparent)'}}>
            <div className="text-[10px] uppercase opacity-50">Histórico - {filterMonth}</div>
            <div className="text-2xl font-black mt-1" style={{color:monthBalance>=0?'var(--ax-viz-emerald)':'var(--ax-danger-500)'}}>{monthBalance>=0?'+':''}{fmtTime(monthBalance)}</div>
            <div className="text-[10px] opacity-30 mt-1">{filteredTime.length} registros</div>
          </div>
          <div className="rounded-2xl overflow-hidden" style={{background:'var(--ax-surface)',border:'1px solid var(--ax-border)'}}>
            <table className="w-full text-sm">
              <thead className="text-[10px] font-bold uppercase opacity-40" style={{background:'var(--ax-surface-subtle)'}}><tr><th className="p-3 text-left">Data</th><th className="p-3">Ent</th><th className="p-3">Sai</th><th className="p-3">Saldo</th></tr></thead>
              <tbody>
                {filteredTime.map(r => {
                  const w=(r.entrada&&r.saida)?parseTime(r.saida)-parseTime(r.entrada)-(config.horasAlmoco||0):0;
                  const sd=w-expectedHours;
                  const d=new Date(r.date+'T12:00:00');
                  return <tr key={r.date} className="border-t" style={{borderColor:'var(--ax-border)'}}>
                    <td className="p-3 font-bold">{d.getDate().toString().padStart(2,'0')}/{String(d.getMonth()+1).padStart(2,'0')} <span className="text-[10px] opacity-40">{BH_DIAS[d.getDay()]}</span></td>
                    <td className="p-3 text-center font-mono text-xs">{r.entrada||'--'}</td>
                    <td className="p-3 text-center font-mono text-xs">{r.saida||'--'}</td>
                    <td className="p-3 text-center font-bold text-xs" style={{color:sd>=0?'var(--ax-viz-emerald)':'var(--ax-danger-500)'}}>{sd>=0?'+':''}{fmtTime(sd)}</td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {bhTab==='banco' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl" style={{background:'var(--ax-surface)',border:'1px solid var(--ax-border)'}}>
            <div className="text-[10px] font-bold uppercase opacity-50 mb-3">Lançamento Manual</div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <select value={manualRef} onChange={e=>setManualRef(e.target.value)} className="p-2.5 rounded-xl text-xs font-bold outline-none" style={{background:'var(--ax-surface-subtle)',border:'1px solid var(--ax-border)',color:'var(--ax-text)'}}>
                <option value="">Mês ref.</option>
                {allMonths.map(m=><option key={m} value={m}>{m}</option>)}
              </select>
              <input type="time" value={manualHrs} onChange={e=>setManualHrs(e.target.value)} className="p-2.5 rounded-xl text-xs font-bold text-center outline-none" style={{background:'var(--ax-surface-subtle)',border:'1px solid var(--ax-border)',color:'var(--ax-text)'}} />
              <select value={manualTipo} onChange={e=>setManualTipo(e.target.value)} className="p-2.5 rounded-xl text-xs font-bold outline-none" style={{background:'var(--ax-surface-subtle)',border:'1px solid var(--ax-border)',color:'var(--ax-text)'}}>
                <option value="positivo">+ Positivo</option>
                <option value="negativo">- Negativo</option>
              </select>
            </div>
            <button onClick={handleSaveManual} className="w-full py-3 rounded-xl text-xs font-bold text-white uppercase transition" style={{background:'var(--ax-accent)'}}>Lançar</button>
          </div>
          {manualRecords.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{background:'var(--ax-surface)',border:'1px solid var(--ax-border)'}}>
              <table className="w-full text-sm">
                <thead className="text-[10px] font-bold uppercase opacity-40" style={{background:'var(--ax-surface-subtle)'}}><tr><th className="p-3">Mês</th><th className="p-3">Horas</th><th className="p-3">Tipo</th><th className="p-3"></th></tr></thead>
                <tbody>
                  {manualRecords.map(r => (
                    <tr key={r.id} className="border-t" style={{borderColor:'var(--ax-border)'}}>
                      <td className="p-3 font-bold text-xs">{r.ref}</td>
                      <td className="p-3 text-center font-mono text-xs">{r.hrsStr}</td>
                      <td className="p-3 text-center text-xs font-bold" style={{color:r.tipo==='positivo'?'var(--ax-viz-emerald)':'var(--ax-danger-500)'}}>{r.tipo==='positivo'?'+':'-'}</td>
                      <td className="p-3"><button onClick={()=>handleDeleteManual(r.id)} style={{color:'var(--ax-danger-500)'}} className="opacity-50 hover:opacity-100">{BH_ICONS.trash}</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {bhTab==='ajustes' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl" style={{background:'var(--ax-surface)',border:'1px solid var(--ax-border)'}}>
            <div className="text-[10px] font-bold uppercase opacity-50 mb-3">Jornada de Trabalho</div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-[10px] uppercase opacity-40 block mb-1">Entrada</label><input type="time" value={config.entrada} onChange={e=>setConfig({...config, entrada:e.target.value})} className="p-2.5 rounded-xl w-full text-xs font-bold outline-none" style={{background:'var(--ax-surface-subtle)',border:'1px solid var(--ax-border)',color:'var(--ax-text)'}} /></div>
              <div><label className="text-[10px] uppercase opacity-40 block mb-1">Saída</label><input type="time" value={config.saida} onChange={e=>setConfig({...config, saida:e.target.value})} className="p-2.5 rounded-xl w-full text-xs font-bold outline-none" style={{background:'var(--ax-surface-subtle)',border:'1px solid var(--ax-border)',color:'var(--ax-text)'}} /></div>
              <div><label className="text-[10px] uppercase opacity-40 block mb-1">Almoço (h)</label><input type="number" min="0" max="3" step="0.5" value={config.horasAlmoco} onChange={e=>setConfig({...config, horasAlmoco:Number(e.target.value)})} className="p-2.5 rounded-xl w-full text-xs font-bold outline-none" style={{background:'var(--ax-surface-subtle)',border:'1px solid var(--ax-border)',color:'var(--ax-text)'}} /></div>
              <div><label className="text-[10px] uppercase opacity-40 block mb-1">Saldo Inicial (h)</label><input type="number" step="0.5" value={config.saldoInicialMin/60} onChange={e=>setConfig({...config, saldoInicialMin:Number(e.target.value)*60})} className="p-2.5 rounded-xl w-full text-xs font-bold outline-none" style={{background:'var(--ax-surface-subtle)',border:'1px solid var(--ax-border)',color:'var(--ax-text)'}} /></div>
            </div>
            <div className="mt-3">
              <label className="text-[10px] uppercase opacity-40 block mb-1">Dias de Trabalho</label>
              <div className="flex gap-2 flex-wrap">
                {BH_DIAS.map((d,i) => <button key={i} onClick={()=>{const nd=config.diasSemana.includes(i)?config.diasSemana.filter(x=>x!==i):[...config.diasSemana,i];setConfig({...config, diasSemana:nd});}} className="px-3 py-1.5 rounded-lg text-xs font-bold transition" style={config.diasSemana.includes(i)?{background:'var(--ax-accent)',color:'var(--ax-on-accent)'}:{background:'var(--ax-surface-subtle)',color:'var(--ax-text-muted)'}}>{d}</button>)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* Fallback local quando Firebase não está disponível */
function BancoHorasLocal() {
  const { useState, useMemo } = React;
  const [regs, setRegs] = useState(() => { try { return JSON.parse(localStorage.getItem('makro_bh_local')||'[]'); } catch(e) { return []; } });
  const [cfg, setCfg] = useState(() => { try { return JSON.parse(localStorage.getItem('makro_bh_cfg')||'{"entrada":"08:00","saida":"17:00","almoco":1,"dias":[1,2,3,4,5],"saldoInicial":0}'); } catch(e) { return {entrada:'08:00',saida:'17:00',almoco:1,dias:[1,2,3,4,5],saldoInicial:0}; } });
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [ent, setEnt] = useState('');
  const [sai, setSai] = useState('');

  const save = (r,c) => { localStorage.setItem('makro_bh_local',JSON.stringify(r)); localStorage.setItem('makro_bh_cfg',JSON.stringify(c)); };

  const parseT = t => { if(!t||!t.includes(':'))return 0; const [h,m]=t.split(':').map(Number); return h+m/60; };
  const fmtT = dec => { const s=dec<0?'-':''; const a=Math.abs(dec); const h=Math.floor(a); const m=Math.round((a-h)*60); return s+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0'); };
  const expH = parseT(cfg.saida)-parseT(cfg.entrada)-cfg.almoco;
  const stats = useMemo(() => { let s=cfg.saldoInicial,seq=0,mx=0,cs=0; [...regs].sort((a,b)=>a.data.localeCompare(b.data)).forEach(r=>{if(r.ent&&r.sai){const d=parseT(r.sai)-parseT(r.ent)-cfg.almoco-expH; s+=d; if(d>0){cs++;if(cs>mx)mx=cs}else cs=0;}}); const f=expH>0?Math.floor(Math.max(0,s)/expH):0; return {saldo:s,seq:cs,maxSeq:mx,folgas:f}; },[regs,cfg]);

  return (
    <div className="space-y-4" style={{color:'var(--ax-text)'}}>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl text-center" style={{background:'var(--ax-surface)',border:'1px solid var(--ax-border)'}}><div className="text-[10px] uppercase opacity-40">Saldo</div><div className="text-xl font-black" style={{color:stats.saldo>=0?'var(--ax-viz-emerald)':'var(--ax-danger-500)'}}>{(stats.saldo>=0?'+':'')+fmtT(stats.saldo)}</div></div>
        <div className="p-4 rounded-2xl text-center" style={{background:'var(--ax-surface)',border:'1px solid var(--ax-border)'}}><div className="text-[10px] uppercase opacity-40">Folgas</div><div className="text-xl font-black" style={{color:'var(--ax-viz-violet)'}}>{stats.folgas}</div></div>
      </div>
      <div className="p-4 rounded-2xl" style={{background:'var(--ax-surface)',border:'1px solid var(--ax-border)'}}>
        <div className="text-[10px] font-bold uppercase opacity-50 mb-3">Registrar Ponto (Local)</div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <input type="date" value={data} onChange={e=>setData(e.target.value)} className="p-2.5 rounded-xl text-xs font-bold outline-none" style={{background:'var(--ax-surface-subtle)',border:'1px solid var(--ax-border)',color:'var(--ax-text)'}} />
          <input type="time" value={ent} onChange={e=>setEnt(e.target.value)} className="p-2.5 rounded-xl text-xs font-bold outline-none" style={{background:'var(--ax-surface-subtle)',border:'1px solid var(--ax-border)',color:'var(--ax-text)'}} />
          <input type="time" value={sai} onChange={e=>setSai(e.target.value)} className="p-2.5 rounded-xl text-xs font-bold outline-none" style={{background:'var(--ax-surface-subtle)',border:'1px solid var(--ax-border)',color:'var(--ax-text)'}} />
        </div>
        <button onClick={()=>{if(!data)return; const n=[...regs,{data,ent,sai}]; setRegs(n); save(n,cfg); setEnt('');setSai('');}} className="w-full py-3 rounded-xl text-xs font-bold text-white uppercase" style={{background:'var(--ax-accent)'}}>Salvar</button>
      </div>
      <div style={{background:'var(--ax-surface)',border:'1px solid var(--ax-border)',borderRadius:'var(--ax-radius-lg)',overflow:'hidden'}}>
        <table className="w-full text-sm"><thead style={{background:'var(--ax-surface-subtle)'}} className="text-[10px] font-bold uppercase opacity-40"><tr><th className="p-3 text-left">Data</th><th className="p-3">Ent</th><th className="p-3">Sai</th><th className="p-3">Saldo</th><th></th></tr></thead>
          <tbody>{[...regs].reverse().slice(0,15).map((r,i)=>{const d=new Date(r.data+'T12:00:00');const sd=(r.ent&&r.sai)?parseT(r.sai)-parseT(r.ent)-cfg.almoco-expH:0;return <tr key={i} className="border-t" style={{borderColor:'var(--ax-border)'}}><td className="p-3 font-bold">{d.getDate().toString().padStart(2,'0')}/{String(d.getMonth()+1).padStart(2,'0')}</td><td className="p-3 text-center font-mono text-xs">{r.ent||'--'}</td><td className="p-3 text-center font-mono text-xs">{r.sai||'--'}</td><td className="p-3 text-center font-bold text-xs" style={{color:sd>=0?'var(--ax-viz-emerald)':'var(--ax-danger-500)'}}>{(sd>=0?'+':'')+fmtT(sd)}</td><td className="p-3"><button onClick={()=>{const nr=regs.filter((_,j)=>j!==regs.length-1-i);setRegs(nr);save(nr,cfg);}} style={{color:'var(--ax-danger-500)',opacity:.5}}>🗑</button></td></tr>;})}</tbody></table>
      </div>
    </div>
  );
}

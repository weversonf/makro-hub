import React, { useState } from 'react';
import { useHub, todayISO, fmtDate } from '../context/HubContext';
import { ChevronLeft, ChevronRight, Plus, Send } from 'lucide-react';

const CAL_MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const CAL_DOW_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const CAL_DOW_MINI = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function CalendarioView() {
  const { activities, allActivities, openNewTask, openEditTask, stageOf, isEditorialActivity, isComemorativa, catOf } = useHub();
  const [calDate, setCalDate] = useState(new Date());
  const [calMode, setCalMode] = useState('month'); // 'month' | 'week'
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'postado' | 'em_andamento' | 'afazer' | 'comemorativa' | 'agendadas' | 'publicadas'

  const y = calDate.getFullYear();
  const m = calDate.getMonth();
  const today = todayISO();

  const editorialTasks = (allActivities && allActivities.length > 0 ? allActivities : activities).filter((a) => isEditorialActivity(a));

  const isComemorativaTask = (t) => {
    if (!t) return false;
    if (isComemorativa && isComemorativa(t)) return true;
    if (t.tipo === 'comemorativa' || t.tipo === 'data_comemorativa' || t.isComemorativa) return true;
    if (t.tipoPublicacao === 'comemorativa' || t.tipoPublicacao === 'data_comemorativa') return true;
    const cat = catOf?.(t.categoria);
    if (cat && cat.nome && cat.nome.toLowerCase().includes('comemorat')) return true;
    if (typeof t.categoria === 'string' && t.categoria.toLowerCase().includes('comemorat')) return true;
    return false;
  };

  // Cor do evento por status ou tipo:
  // - Data Comemorativa = roxo (#8B5CF6)
  // - Concluído / Postado = verde (var(--ax-viz-emerald))
  // - Em andamento (execução, espera, validando) = amarelo (var(--ax-viz-amber))
  // - A fazer = cinza (var(--ax-text-muted))
  const calEventColor = (ev) => {
    if (isComemorativaTask(ev)) return '#8B5CF6';
    const stage = typeof ev === 'string' ? ev : ev?.stage;
    if (stage === 'concluido') return 'var(--ax-viz-emerald)';
    if (stage === 'afazer') return 'var(--ax-text-muted)';
    return 'var(--ax-viz-amber)';
  };

  // Contadores globais das publicações para os botões de filtro
  const pubCount = editorialTasks.filter((a) => a.stage === 'concluido').length;
  const pendCount = editorialTasks.filter((a) => a.stage !== 'concluido').length;
  const emAndamentoCount = editorialTasks.filter((a) => a.stage !== 'concluido' && a.stage !== 'afazer').length;
  const afazerCount = editorialTasks.filter((a) => a.stage === 'afazer').length;
  const comemCount = editorialTasks.filter((a) => isComemorativaTask(a)).length;

  // Filtragem interativa
  const filteredEditorialTasks = editorialTasks.filter((t) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'postado' || activeFilter === 'publicadas') return t.stage === 'concluido';
    if (activeFilter === 'em_andamento') return t.stage !== 'concluido' && t.stage !== 'afazer';
    if (activeFilter === 'afazer') return t.stage === 'afazer';
    if (activeFilter === 'comemorativa') return isComemorativaTask(t);
    if (activeFilter === 'agendadas') return t.stage !== 'concluido';
    return true;
  });

  // Mapeamento por data
  const dayMap = {};
  filteredEditorialTasks.forEach((t) => {
    const k = t.dataPostagem || t.dataVencimento;
    if (k) {
      if (!dayMap[k]) dayMap[k] = [];
      dayMap[k].push(t);
    }
  });

  const calPrev = () => {
    setCalDate((prev) => {
      const d = new Date(prev);
      if (calMode === 'month') d.setMonth(d.getMonth() - 1);
      else d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const calNext = () => {
    setCalDate((prev) => {
      const d = new Date(prev);
      if (calMode === 'month') d.setMonth(d.getMonth() + 1);
      else d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const calToday = () => setCalDate(new Date());

  const handleOpenNewAtDate = (dateStr) => {
    const isComem = activeFilter === 'comemorativa';
    openNewTask('afazer', {
      categoria: 1, // Editorial
      tipo: isComem ? 'comemorativa' : 'padrao',
      isComemorativa: isComem,
      dataVencimento: dateStr,
      dataPostagem: dateStr
    });
  };

  // Helper de cálculo de semana
  const getWeekRange = (refDate) => {
    const d = new Date(refDate);
    const day = d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const f = (dt) => `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`;
    return { start, end, label: `${f(start)} - ${f(end)} (${CAL_MONTHS[refDate.getMonth()]} ${refDate.getFullYear()})` };
  };

  // Render Grid Mensal
  const renderMonthlyGrid = () => {
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const prevDays = new Date(y, m, 0).getDate();
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

    const prevM = m === 0 ? 11 : m - 1;
    const prevY = m === 0 ? y - 1 : y;
    const nextM = m === 11 ? 0 : m + 1;
    const nextY = m === 11 ? y + 1 : y;

    const cells = [];
    let day = 1;

    for (let row = 0; row < totalCells / 7; row++) {
      for (let col = 0; col < 7; col++) {
        const cellNum = row * 7 + col + 1;

        const isWeekend = col === 0 || col === 6;

        if (cellNum <= firstDay) {
          const pDay = prevDays - firstDay + cellNum;
          const pDate = `${prevY}-${String(prevM + 1).padStart(2, '0')}-${String(pDay).padStart(2, '0')}`;
          const evts = dayMap[pDate] || [];

          cells.push(
            <button
              key={`prev-${pDay}`}
              type="button"
              className={`ax-cal-cell ${isWeekend ? 'ax-cal-cell--weekend' : ''}`}
              onClick={() => handleOpenNewAtDate(pDate)}
            >
              <span className="ax-cal-cell__n ax-cal-cell__n--muted ax-num">{pDay}</span>
              {evts.slice(0, 2).map((ev) => (
                <span
                  key={ev.id}
                  className="ax-cal-event"
                  style={{ '--c': calEventColor(ev) }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditTask(ev.id);
                  }}
                  title={ev.titulo}
                >
                  {ev.titulo}
                </span>
              ))}
            </button>
          );
        } else if (day > daysInMonth) {
          const nDay = day - daysInMonth;
          const nDate = `${nextY}-${String(nextM + 1).padStart(2, '0')}-${String(nDay).padStart(2, '0')}`;
          const evts = dayMap[nDate] || [];

          cells.push(
            <button
              key={`next-${nDay}`}
              type="button"
              className={`ax-cal-cell ${isWeekend ? 'ax-cal-cell--weekend' : ''}`}
              onClick={() => handleOpenNewAtDate(nDate)}
            >
              <span className="ax-cal-cell__n ax-cal-cell__n--muted ax-num">{nDay}</span>
              {evts.slice(0, 2).map((ev) => (
                <span
                  key={ev.id}
                  className="ax-cal-event"
                  style={{ '--c': calEventColor(ev) }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditTask(ev.id);
                  }}
                  title={ev.titulo}
                >
                  {ev.titulo}
                </span>
              ))}
            </button>
          );
          day++;
        } else {
          const dDate = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const isToday = dDate === today;
          const evts = dayMap[dDate] || [];

          cells.push(
            <button
              key={`day-${day}`}
              type="button"
              className={`ax-cal-cell ${isToday ? 'ax-cal-cell--today' : ''} ${isWeekend ? 'ax-cal-cell--weekend' : ''}`}
              onClick={() => handleOpenNewAtDate(dDate)}
            >
              <span className={`ax-cal-cell__n ax-num ${isToday ? 'ax-cal-cell__n--today' : ''}`}>{day}</span>
              {evts.slice(0, 3).map((ev) => (
                <span
                  key={ev.id}
                  className="ax-cal-event"
                  style={{ '--c': calEventColor(ev) }}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditTask(ev.id);
                  }}
                  title={ev.titulo}
                >
                  {ev.titulo}
                </span>
              ))}
              {evts.length > 3 && <span className="ax-cal-more">+{evts.length - 3} mais</span>}
            </button>
          );
          day++;
        }
      }
    }
    return cells;
  };

  // Render Grade Semanal 7 Dias
  const renderWeeklyGrid = () => {
    const range = getWeekRange(calDate);
    const curr = new Date(range.start);
    const cols = [];

    for (let d = 0; d < 7; d++) {
      const cy = curr.getFullYear();
      const cm = curr.getMonth() + 1;
      const cday = curr.getDate();
      const dateISO = `${cy}-${String(cm).padStart(2, '0')}-${String(cday).padStart(2, '0')}`;
      const isToday = dateISO === today;
      const evts = dayMap[dateISO] || [];

      cols.push(
        <div
          key={dateISO}
          className="ax-cal-week-col"
          onClick={() => handleOpenNewAtDate(dateISO)}
        >
          <div className={`ax-cal-week-col__head ${isToday ? 'is-today' : ''}`}>
            <span className="text-xs font-bold" style={{ color: isToday ? 'var(--ax-accent)' : 'inherit' }}>
              {CAL_DOW_SHORT[d]}
            </span>
            <span className={`ax-num ${isToday ? 'ax-cal-cell__n--today' : ''}`}>{cday}</span>
          </div>

          <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto min-h-[80px]">
            {evts.length === 0 ? (
              <div className="text-[11px] text-[var(--ax-text-subtle)] text-center py-4">Sem posts</div>
            ) : (
              evts.map((ev) => {
                const st = stageOf(ev.stage);
                return (
                  <div
                    key={ev.id}
                    className="ax-card ax-card--interactive p-2.5 bg-[var(--ax-surface-solid)]"
                    style={{ borderInlineStart: `3px solid ${calEventColor(ev)}` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditTask(ev.id);
                    }}
                  >
                    <div className="text-xs font-bold text-[var(--ax-text-strong)] line-clamp-2 leading-tight">
                      {ev.titulo}
                    </div>
                    <div className="flex items-center justify-between gap-1 mt-1.5">
                      <span className={`ax-badge ax-badge--soft ax-badge--${isComemorativaTask(ev) ? 'violet' : st.tone} ax-badge--sm ax-badge--pill`}>
                        {isComemorativaTask(ev) ? 'Data Comemorativa' : st.label}
                      </span>
                      <span className="ax-num text-[11px] font-semibold text-[var(--ax-text-muted)]">
                        {ev.progress || 0}%
                      </span>
                    </div>
                    {ev.canais && ev.canais.length > 0 && (
                      <div className="text-[10px] text-[var(--ax-accent)] font-bold uppercase mt-1">
                        {ev.canais.join(', ')}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <button
            type="button"
            className="ax-btn ax-btn--ghost ax-btn--sm w-full text-xs gap-1"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenNewAtDate(dateISO);
            }}
          >
            <Plus size={13} /> Post
          </button>
        </div>
      );

      curr.setDate(curr.getDate() + 1);
    }
    return cols;
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      <div className="ax-card w-full">
        <div className="ax-card__header flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="ax-card__title text-base sm:text-lg">
              {calMode === 'month' ? `${CAL_MONTHS[m]} ${y}` : getWeekRange(calDate).label}
            </h2>
            <div className="flex items-center gap-1 sm:hidden">
              <button className="ax-btn ax-btn--secondary ax-btn--sm px-2" onClick={calPrev} title="Mês Anterior">
                <ChevronLeft size={16} />
              </button>
              <button className="ax-btn ax-btn--secondary ax-btn--sm px-2.5" onClick={calToday}>
                Hoje
              </button>
              <button className="ax-btn ax-btn--secondary ax-btn--sm px-2" onClick={calNext} title="Próximo Mês">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2">
            <div className="ax-segment">
              <button
                className={`ax-segment__option ${calMode === 'month' ? 'is-active' : ''}`}
                onClick={() => setCalMode('month')}
              >
                Mensal
              </button>
              <button
                className={`ax-segment__option ${calMode === 'week' ? 'is-active' : ''}`}
                onClick={() => setCalMode('week')}
              >
                Semanal
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-1.5">
              <button className="ax-btn ax-btn--secondary ax-btn--sm" onClick={calPrev} title="Anterior">
                <ChevronLeft size={16} />
              </button>
              <button className="ax-btn ax-btn--secondary ax-btn--sm" onClick={calToday}>
                Hoje
              </button>
              <button className="ax-btn ax-btn--secondary ax-btn--sm" onClick={calNext} title="Próximo">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Barra Interativa de Filtros e Legenda */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2 text-xs border-b border-[var(--ax-border)] bg-[var(--ax-surface-1)]">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Todos */}
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition border cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-[var(--ax-surface-2)] text-[var(--ax-text-strong)] border-[var(--ax-border-strong)] shadow-xs'
                  : 'bg-transparent text-[var(--ax-text-muted)] border-transparent hover:bg-[var(--ax-surface-subtle)] hover:text-[var(--ax-text-strong)]'
              }`}
              title="Exibir todas as publicações"
            >
              Todos
              <span className="ax-num text-[10px] opacity-75">({editorialTasks.length})</span>
            </button>

            {/* Postado / OK */}
            <button
              type="button"
              onClick={() => setActiveFilter(activeFilter === 'postado' ? 'all' : 'postado')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition border cursor-pointer ${
                activeFilter === 'postado'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/30'
                  : activeFilter !== 'all'
                  ? 'opacity-50 bg-transparent text-[var(--ax-text-muted)] border-transparent hover:opacity-100 hover:bg-[var(--ax-surface-subtle)]'
                  : 'bg-[var(--ax-surface-subtle)] text-[var(--ax-text-strong)] border-[var(--ax-border)] hover:border-emerald-500/40'
              }`}
              title="Filtrar por Postado / OK"
            >
              <i className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ background: 'var(--ax-viz-emerald)' }} />
              <span>Postado / OK</span>
              <span className="ax-num text-[10px] opacity-75">({pubCount})</span>
            </button>

            {/* Em andamento */}
            <button
              type="button"
              onClick={() => setActiveFilter(activeFilter === 'em_andamento' ? 'all' : 'em_andamento')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition border cursor-pointer ${
                activeFilter === 'em_andamento'
                  ? 'bg-amber-500/15 text-amber-400 border-amber-500/50 shadow-xs ring-1 ring-amber-500/30'
                  : activeFilter !== 'all'
                  ? 'opacity-50 bg-transparent text-[var(--ax-text-muted)] border-transparent hover:opacity-100 hover:bg-[var(--ax-surface-subtle)]'
                  : 'bg-[var(--ax-surface-subtle)] text-[var(--ax-text-strong)] border-[var(--ax-border)] hover:border-amber-500/40'
              }`}
              title="Filtrar por Em andamento"
            >
              <i className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ background: 'var(--ax-viz-amber)' }} />
              <span>Em andamento</span>
              <span className="ax-num text-[10px] opacity-75">({emAndamentoCount})</span>
            </button>

            {/* A fazer */}
            <button
              type="button"
              onClick={() => setActiveFilter(activeFilter === 'afazer' ? 'all' : 'afazer')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition border cursor-pointer ${
                activeFilter === 'afazer'
                  ? 'bg-neutral-500/20 text-[var(--ax-text-strong)] border-neutral-400/50 shadow-xs ring-1 ring-neutral-400/30'
                  : activeFilter !== 'all'
                  ? 'opacity-50 bg-transparent text-[var(--ax-text-muted)] border-transparent hover:opacity-100 hover:bg-[var(--ax-surface-subtle)]'
                  : 'bg-[var(--ax-surface-subtle)] text-[var(--ax-text-strong)] border-[var(--ax-border)] hover:border-neutral-400/40'
              }`}
              title="Filtrar por A fazer"
            >
              <i className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ background: 'var(--ax-text-muted)' }} />
              <span>A fazer</span>
              <span className="ax-num text-[10px] opacity-75">({afazerCount})</span>
            </button>

            {/* Data Comemorativa */}
            <button
              type="button"
              onClick={() => setActiveFilter(activeFilter === 'comemorativa' ? 'all' : 'comemorativa')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition border cursor-pointer ${
                activeFilter === 'comemorativa'
                  ? 'bg-[#8B5CF6]/20 text-[#A78BFA] border-[#8B5CF6]/60 shadow-xs ring-1 ring-[#8B5CF6]/50'
                  : activeFilter !== 'all'
                  ? 'opacity-50 bg-transparent text-[var(--ax-text-muted)] border-transparent hover:opacity-100 hover:bg-[var(--ax-surface-subtle)]'
                  : 'bg-[var(--ax-surface-subtle)] text-[var(--ax-text-strong)] border-[var(--ax-border)] hover:border-[#8B5CF6]/40'
              }`}
              title="Filtrar por Data Comemorativa"
            >
              <i className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ background: '#8B5CF6' }} />
              <span>Data Comemorativa</span>
              <span className="ax-num text-[10px] opacity-75">({comemCount})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setActiveFilter(activeFilter === 'agendadas' ? 'all' : 'agendadas')}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                activeFilter === 'agendadas'
                  ? 'bg-cyan-500/15 border-cyan-500/50 text-[var(--ax-text-strong)] shadow-xs ring-1 ring-cyan-500/30'
                  : activeFilter !== 'all'
                  ? 'opacity-60 bg-[var(--ax-surface-subtle)] border-[var(--ax-border)] text-[var(--ax-text-muted)] hover:opacity-100'
                  : 'bg-[var(--ax-surface-subtle)] border-[var(--ax-border)] text-[var(--ax-text-muted)] hover:border-cyan-500/40'
              }`}
              title="Filtrar publicações pendentes / agendadas"
            >
              Agendadas: <strong className="text-[var(--ax-viz-cyan)] ax-num">{pendCount}</strong>
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter(activeFilter === 'publicadas' ? 'all' : 'publicadas')}
              className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                activeFilter === 'publicadas'
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-[var(--ax-text-strong)] shadow-xs ring-1 ring-emerald-500/30'
                  : activeFilter !== 'all'
                  ? 'opacity-60 bg-[var(--ax-surface-subtle)] border-[var(--ax-border)] text-[var(--ax-text-muted)] hover:opacity-100'
                  : 'bg-[var(--ax-surface-subtle)] border-[var(--ax-border)] text-[var(--ax-text-muted)] hover:border-emerald-500/40'
              }`}
              title="Filtrar publicações postadas / concluídas"
            >
              Publicadas: <strong className="text-[var(--ax-viz-emerald)] ax-num">{pubCount}</strong>
            </button>
          </div>
        </div>

        <div className="ax-card__body p-3">
          {calMode === 'month' ? (
            <div>
              <div className="grid grid-cols-7 border-b border-[var(--ax-border)]">
                {CAL_DOW_SHORT.map((dow, i) => (
                  <div
                    key={dow}
                    className={`p-2 text-[11px] font-semibold tracking-wider uppercase text-[var(--ax-text-subtle)] text-center bg-[var(--ax-surface-subtle)] ${
                      i < 6 ? 'border-r border-[var(--ax-border)]' : ''
                    }`}
                  >
                    {dow}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">{renderMonthlyGrid()}</div>
            </div>
          ) : (
            <div className="ax-cal-week">{renderWeeklyGrid()}</div>
          )}
        </div>
      </div>
    </div>
  );
}

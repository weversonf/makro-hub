import React, { useState } from 'react';
import { useHub, todayISO, fmtDate } from '../context/HubContext';
import { ChevronLeft, ChevronRight, Plus, Send } from 'lucide-react';

const CAL_MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const CAL_DOW_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const CAL_DOW_MINI = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export default function CalendarioView() {
  const { activities, openNewTask, openEditTask, stageOf, isEditorialActivity, rescheduleUnpublishedEditorial } = useHub();
  const [calDate, setCalDate] = useState(new Date());
  const [calMode, setCalMode] = useState('month'); // 'month' | 'week'
  const [rescheduling, setRescheduling] = useState(false);

  const y = calDate.getFullYear();
  const m = calDate.getMonth();
  const today = todayISO();

  const editorialTasks = activities.filter((a) => isEditorialActivity(a));

  // Mapeamento por data
  const dayMap = {};
  editorialTasks.forEach((t) => {
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
    openNewTask('afazer', {
      categoria: 1, // Editorial
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
                  style={{ '--c': ev.stage === 'concluido' ? 'var(--ax-viz-emerald)' : 'var(--ax-accent)' }}
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
                  style={{ '--c': ev.stage === 'concluido' ? 'var(--ax-viz-emerald)' : 'var(--ax-accent)' }}
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
                  style={{ '--c': ev.stage === 'concluido' ? 'var(--ax-viz-emerald)' : 'var(--ax-accent)' }}
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
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditTask(ev.id);
                    }}
                  >
                    <div className="text-xs font-bold text-[var(--ax-text-strong)] line-clamp-2 leading-tight">
                      {ev.titulo}
                    </div>
                    <div className="flex items-center justify-between gap-1 mt-1.5">
                      <span className={`ax-badge ax-badge--soft ax-badge--${st.tone} ax-badge--sm ax-badge--pill`}>
                        {st.label}
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

  // Próximas publicações
  const upcomingPosts = editorialTasks
    .filter((a) => {
      const k = a.dataPostagem || a.dataVencimento;
      return k && k >= today && a.stage !== 'concluido';
    })
    .sort((x, y) => {
      const kx = x.dataPostagem || x.dataVencimento;
      const ky = y.dataPostagem || y.dataVencimento;
      return kx < ky ? -1 : 1;
    })
    .slice(0, 5);

  const pubCount = editorialTasks.filter((a) => a.stage === 'concluido').length;
  const pendCount = editorialTasks.length - pubCount;

  const handleReschedule = async () => {
    try {
      setRescheduling(true);
      await rescheduleUnpublishedEditorial();
    } catch (e) {
      console.error(e);
    } finally {
      setRescheduling(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Banner de Reagendamento Editorial Inteligente (3x/semana: Seg, Qua e Sex) */}
      {pendCount > 0 && (
        <div className="p-4 rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-primary-soft)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <i className="ph ph-calendar-check text-2xl" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-heading)] flex items-center gap-2">
                <span>Planejamento Editorial:</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--color-surface)] text-[var(--color-primary)] border border-[var(--color-border)]">
                  {pendCount} conteúdos não publicados
                </span>
              </h3>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                Reorganizar automaticamente em 3 publicações por semana (<strong>Segunda, Quarta e Sexta</strong> a partir de <strong>04/09</strong>).
              </p>
            </div>
          </div>

          <button
            type="button"
            className="hr-btn hr-btn--primary text-xs h-9 px-4 flex-shrink-0 font-semibold shadow-md hover:scale-[1.02] transition"
            onClick={handleReschedule}
            disabled={rescheduling}
          >
            <i className={`ph ${rescheduling ? 'ph-spinner-gap animate-spin' : 'ph-magic-wand'} text-base`} />
            <span>{rescheduling ? 'Reagendando...' : 'Reagendar para Seg / Qua / Sex'}</span>
          </button>
        </div>
      )}

      <div className="ax-dash-grid">
        <div className="ax-col--9">
          <div className="ax-card">
            <div className="ax-card__header flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
              <h2 className="ax-card__title">
                {calMode === 'month' ? `${CAL_MONTHS[m]} ${y}` : getWeekRange(calDate).label}
              </h2>
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
                  Semanal / Planejamento
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button className="ax-btn ax-btn--secondary ax-btn--sm" onClick={calPrev}>
                <ChevronLeft size={16} />
              </button>
              <button className="ax-btn ax-btn--secondary ax-btn--sm" onClick={calToday}>
                Hoje
              </button>
              <button className="ax-btn ax-btn--secondary ax-btn--sm" onClick={calNext}>
                <ChevronRight size={16} />
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

      {/* Sidebar do Calendário */}
      <div className="ax-col--3 flex flex-col gap-4">
        {/* Próximas Publicações */}
        <div className="ax-card">
          <div className="ax-card__header">
            <h3 className="ax-card__title text-sm">Próximas Publicações</h3>
          </div>
          <div className="ax-card__body p-3 flex flex-col gap-2">
            {upcomingPosts.length === 0 ? (
              <p className="text-xs text-[var(--ax-text-subtle)] py-2">Nenhuma publicação agendada.</p>
            ) : (
              upcomingPosts.map((a) => {
                const pDate = a.dataPostagem || a.dataVencimento;
                const st = stageOf(a.stage);
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-[var(--ax-surface-subtle)] cursor-pointer transition"
                    onClick={() => openEditTask(a.id)}
                  >
                    <span className="ax-avatar ax-avatar--xs ax-avatar--squircle text-[9px] font-bold bg-[var(--ax-surface-2)] text-[var(--ax-accent)]">
                      {a.dataPostagem ? 'POST' : 'VENC'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-[var(--ax-text-strong)] truncate">{a.titulo}</div>
                      <div className="text-[10px] text-[var(--ax-text-subtle)]">
                        {fmtDate(pDate)} · {st.label}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Contadores */}
        <div className="ax-card">
          <div className="ax-card__body flex justify-around text-center py-4">
            <div>
              <div className="text-[10px] uppercase text-[var(--ax-text-subtle)]">Agendadas</div>
              <div className="ax-num text-xl font-bold text-[var(--ax-viz-cyan)] mt-0.5">{pendCount}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-[var(--ax-text-subtle)]">Publicadas</div>
              <div className="ax-num text-xl font-bold text-[var(--ax-viz-emerald)] mt-0.5">{pubCount}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}

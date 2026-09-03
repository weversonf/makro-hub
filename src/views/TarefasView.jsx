import React, { useState } from 'react';
import { useHub, STAGES, PRIOS, fmtDate } from '../context/HubContext';
import { Search, Table as TableIcon, Kanban as KanbanIcon, Plus, Edit2, Calendar, CheckSquare, Send, Link, AlertTriangle } from 'lucide-react';

export default function TarefasView() {
  const {
    activities,
    categories,
    catOf,
    stageOf,
    openNewTask,
    openEditTask,
    moveTaskStage,
    isOverdue,
    isDueSoon,
    listMode,
    setListMode,
    listStage,
    setListStage,
    listCat,
    setListCat,
    searchQuery,
    setSearchQuery,
    isEditorialActivity
  } = useHub();

  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  // Filtragem (Demandas editoriais, posts de redes e revistas ficam exclusivamente no Calendário)
  const q = searchQuery.toLowerCase().trim();
  const tasks = activities
    .filter((a) => !isEditorialActivity(a))
    .filter((a) => {
      if (listStage !== 'all' && a.stage !== listStage) return false;
      if (listCat !== 'all' && String(a.categoria) !== String(listCat)) return false;
      if (q) {
        const cat = catOf(a.categoria);
        const hay = `${a.titulo} ${a.descricao || ''} ${a.projeto || ''} ${cat ? cat.nome : ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    })
    .sort((x, y) => {
      const ox = isOverdue(x) ? 1 : 0;
      const oy = isOverdue(y) ? 1 : 0;
      if (ox !== oy) return oy - ox;
      return (x.dataVencimento || '9999-99-99') < (y.dataVencimento || '9999-99-99') ? -1 : 1;
    });

  const progColor = (p) => {
    if (p >= 100) return 'var(--ax-viz-emerald)';
    if (p >= 60) return 'var(--ax-accent)';
    if (p >= 30) return 'var(--ax-viz-amber)';
    return 'var(--ax-danger-500)';
  };

  const initials = (name) => {
    if (!name) return '?';
    const p = name.trim().split(/\s+/);
    if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  };

  // Drag and drop handlers
  const handleDragStart = (e, id) => {
    setDraggedTaskId(id);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(id));
    } catch (err) {}
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colId) setDragOverCol(colId);
  };

  const handleDrop = (e, colId) => {
    e.preventDefault();
    if (draggedTaskId != null) {
      moveTaskStage(draggedTaskId, colId);
    }
    handleDragEnd();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de Filtros Responsiva */}
      <div className="ax-card">
        <div className="ax-card__body flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          {/* Linha 1 no Mobile: Busca e Alternador Tabela / Kanban */}
          <div className="flex items-center gap-2 flex-1">
            <div className="ax-header__search flex-1 min-w-0">
              <Search className="ax-icon" size={17} />
              <input
                type="search"
                placeholder="Filtrar tarefas…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="ax-segment shrink-0">
              <button
                type="button"
                className={`ax-segment__option ${listMode === 'table' ? 'is-active' : ''}`}
                onClick={() => setListMode('table')}
                title="Visualização em Tabela"
              >
                <TableIcon size={15} />
                <span className="hidden sm:inline">Tabela</span>
              </button>
              <button
                type="button"
                className={`ax-segment__option ${listMode === 'kanban' ? 'is-active' : ''}`}
                onClick={() => setListMode('kanban')}
                title="Visualização em Kanban"
              >
                <KanbanIcon size={15} />
                <span className="hidden sm:inline">Kanban</span>
              </button>
            </div>
          </div>

          {/* Linha 2 no Mobile: Dropdowns lado a lado (50% cada) */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="ax-select-wrap flex-1 sm:w-40">
              <select
                className="ax-select w-full appearance-none"
                value={listStage}
                onChange={(e) => setListStage(e.target.value)}
              >
                <option value="all">Todos os estágios</option>
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="ax-select-wrap flex-1 sm:w-44">
              <select
                className="ax-select w-full appearance-none"
                value={listCat}
                onChange={(e) => setListCat(e.target.value)}
              >
                <option value="all">Todas as categorias</option>
                {categories
                  .filter((c) => String(c.id) !== '1' && !c.nome?.toLowerCase().includes('editorial'))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela View */}
      {listMode === 'table' && (
        <div className="ax-card">
          <div className="ax-card__body p-0">
            {tasks.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center gap-3">
                <CheckSquare size={32} className="text-[var(--ax-text-subtle)]" />
                <h3 className="font-bold text-sm text-[var(--ax-text-strong)]">Nenhuma tarefa encontrada</h3>
                <p className="text-xs text-[var(--ax-text-subtle)]">Ajuste os filtros ou crie uma nova tarefa.</p>
                <button className="ax-btn ax-btn--primary ax-btn--sm ax-btn--pill" onClick={() => openNewTask()}>
                  <Plus size={15} /> Nova tarefa
                </button>
              </div>
            ) : (
              <div className="ax-table-wrap">
                <table className="ax-table ax-table--hover">
                  <thead>
                    <tr>
                      <th>Tarefa</th>
                      <th>Categoria</th>
                      <th>Estágio</th>
                      <th>Progresso</th>
                      <th>Checklist</th>
                      <th>Deadline</th>
                      <th>Prioridade</th>
                      <th style={{ width: '80px' }} />
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((a) => {
                      const cat = catOf(a.categoria);
                      const st = stageOf(a.stage);
                      const prio = PRIOS[a.prioridade] || PRIOS.baixa;
                      const totCheck = (a.idCheck || []).length;
                      const doCheck = totCheck ? a.idCheck.filter((c) => c.done).length : 0;
                      const overdue = isOverdue(a);
                      const dueSoon = isDueSoon(a);

                      return (
                        <tr key={a.id} className="row-click" onClick={() => openEditTask(a.id)}>
                          <td>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-xs text-[var(--ax-text-strong)]">{a.titulo}</span>
                              {a.projeto && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-primary-soft)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                                  📁 {a.projeto}
                                </span>
                              )}
                            </div>
                            {a.descricao && (
                              <div className="text-[11px] text-[var(--ax-text-subtle)] max-w-xs truncate">{a.descricao}</div>
                            )}
                          </td>
                          <td>
                            <span
                              className="ax-badge ax-badge--soft ax-badge--pill"
                              style={{ '--_b500': cat ? cat.cor : 'var(--ax-text-muted)' }}
                            >
                              <span className="ax-badge__dot" />
                              {cat ? cat.nome : 'Sem categoria'}
                            </span>
                          </td>
                          <td>
                            <span className={`ax-badge ax-badge--soft ax-badge--${st.tone} ax-badge--pill`}>
                              <span className="ax-badge__dot" />
                              {st.label}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-2 min-w-[100px]">
                              <div className="ax-progress ax-progress--sm flex-1">
                                <div className="ax-progress__track">
                                  <div className="ax-progress__fill" style={{ width: `${a.progress}%`, background: progColor(a.progress) }} />
                                </div>
                              </div>
                              <span className="ax-num text-xs text-[var(--ax-text-muted)]">{a.progress}%</span>
                            </div>
                          </td>
                          <td className="ax-num text-xs text-[var(--ax-text-muted)]">
                            {doCheck}/{totCheck}
                          </td>
                          <td
                            className="ax-num text-xs font-semibold"
                            style={{
                              color: overdue ? 'var(--ax-danger-500)' : dueSoon ? 'var(--ax-warning-500)' : 'inherit'
                            }}
                          >
                            {fmtDate(a.dataVencimento)}
                            {overdue && (
                              <span className="ax-badge ax-badge--soft ax-badge--danger ax-badge--sm ax-badge--pill ml-1.5">
                                Atrasada
                              </span>
                            )}
                            {dueSoon && (
                              <span className="ax-badge ax-badge--soft ax-badge--warning ax-badge--sm ax-badge--pill ml-1.5">
                                48h
                              </span>
                            )}
                          </td>
                          <td>
                            <span
                              className="ax-badge ax-badge--soft ax-badge--pill"
                              style={{ '--_b500': prio.color }}
                            >
                              {prio.label}
                            </span>
                          </td>
                          <td>
                            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                              <button
                                className="ax-icon-btn w-8 h-8"
                                onClick={() => openEditTask(a.id)}
                                title="Editar"
                              >
                                <Edit2 size={14} />
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

      {/* Kanban View com Drag and Drop e Atualização Otimista */}
      {listMode === 'kanban' && (
        <div className="ax-pl-board">
          {STAGES.map((st) => {
            const colTasks = tasks.filter((a) => a.stage === st.id);
            const isOver = dragOverCol === st.id;

            return (
              <div
                key={st.id}
                className={`ax-pl-col ${isOver ? 'ax-pl-col--over' : ''}`}
                onDragOver={(e) => handleDragOver(e, st.id)}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={(e) => handleDrop(e, st.id)}
              >
                <div className="ax-pl-col__head">
                  <div className="ax-pl-col__title-row">
                    <div className="ax-pl-col__title">
                      <span className="ax-pl-col__cap" style={{ background: st.color }} />
                      <span className="ax-pl-col__name">{st.label}</span>
                    </div>
                    <span className="ax-pl-col__count">{colTasks.length}</span>
                  </div>
                </div>

                <div className="ax-pl-col__body">
                  {colTasks.map((a) => {
                    const cat = catOf(a.categoria);
                    const prio = PRIOS[a.prioridade] || PRIOS.baixa;
                    const isHot = a.prioridade === 'alta' || a.prioridade === 'urgente';
                    const tb = (a.idCheck || []).length;
                    const db = tb ? a.idCheck.filter((c) => c.done).length : 0;
                    const overdue = isOverdue(a);
                    const dueSoon = isDueSoon(a);
                    const isGhost = draggedTaskId === a.id;

                    const borderStyle = overdue
                      ? { borderColor: 'var(--ax-danger-500)', boxShadow: '0 0 0 1px var(--ax-danger-500)' }
                      : dueSoon
                      ? { borderColor: 'var(--ax-warning-500)', boxShadow: '0 0 0 1px var(--ax-warning-500)' }
                      : {};

                    return (
                      <article
                        key={a.id}
                        className={`ax-pl-card ${isGhost ? 'ax-pl-card--ghost' : ''}`}
                        style={borderStyle}
                        draggable
                        onDragStart={(e) => handleDragStart(e, a.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => openEditTask(a.id)}
                      >
                        <div className="ax-pl-card__row">
                          <p className="ax-pl-card__title">{a.titulo}</p>
                          {isHot && (
                            <span className="ax-badge ax-badge--soft ax-badge--danger ax-badge--sm ax-badge--pill shrink-0">
                              Hot
                            </span>
                          )}
                        </div>

                        <div className="ax-pl-card__sub">
                          <span
                            className="ax-avatar ax-avatar--xs ax-avatar--squircle"
                            style={{
                              background: `color-mix(in oklab, ${cat?.cor || 'var(--ax-text-muted)'} 20%, transparent)`,
                              color: cat?.cor || 'var(--ax-text-muted)',
                              fontWeight: 700
                            }}
                          >
                            {initials(cat?.nome || '?')}
                          </span>
                          <span className="ax-text-truncate text-xs text-[var(--ax-text-muted)]">
                            {cat ? cat.nome : 'Sem categoria'}
                          </span>
                        </div>

                        {a.projeto && (
                          <div className="mb-2">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-primary-soft)] text-[var(--color-primary)] border border-[var(--color-primary)]/20 inline-block truncate max-w-full">
                              📁 {a.projeto}
                            </span>
                          </div>
                        )}

                        <div className="ax-pl-card__row">
                          <span className="ax-num text-xs font-bold text-[var(--ax-text-strong)]">{a.progress}%</span>
                          <span
                            className="ax-pl-card__meta text-xs"
                            style={{
                              color: overdue ? 'var(--ax-danger-500)' : dueSoon ? 'var(--ax-warning-500)' : 'inherit',
                              fontWeight: overdue || dueSoon ? 600 : 'normal'
                            }}
                          >
                            <Calendar size={13} />
                            <span>{fmtDate(a.dataVencimento)}</span>
                            {overdue && <span className="ax-badge ax-badge--soft ax-badge--danger ax-badge--sm ax-badge--pill">Atrasada</span>}
                            {dueSoon && <span className="ax-badge ax-badge--soft ax-badge--warning ax-badge--sm ax-badge--pill">48h</span>}
                          </span>
                        </div>

                        {/* Badges de canais de divulgação */}
                        {a.canais && a.canais.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {a.canais.slice(0, 3).map((cn) => {
                              const norm = cn.toLowerCase().replace(/[^a-z]/g, '');
                              const tagClass = ['instagram', 'linkedin', 'youtube', 'whatsapp', 'site', 'blog', 'email', 'endomarketing'].includes(norm)
                                ? `ax-channel-tag--${norm}`
                                : 'ax-channel-tag--default';
                              return (
                                <span key={cn} className={`ax-channel-tag ${tagClass}`}>
                                  {cn}
                                </span>
                              );
                            })}
                            {a.canais.length > 3 && (
                              <span className="ax-channel-tag ax-channel-tag--default">+{a.canais.length - 3}</span>
                            )}
                          </div>
                        )}

                        <div className="ax-pl-card__foot">
                          <div className="ax-pl-card__foot-icons text-xs flex items-center gap-2 text-[var(--ax-text-subtle)]">
                            {tb > 0 && (
                              <span className="flex items-center gap-1">
                                <CheckSquare size={13} />
                                <span>{db}/{tb}</span>
                              </span>
                            )}
                            {a.supportLinks && a.supportLinks.length > 0 && (
                              <span className="flex items-center gap-1">
                                <Link size={13} />
                                <span>{a.supportLinks.length}</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {isHot && <span className="ax-pulse-dot" style={{ background: prio.color }} />}
                            <span
                              className="ax-avatar ax-avatar--xs ax-avatar--squircle text-[10px] font-bold"
                              style={{
                                background: `color-mix(in oklab, ${prio.color} 20%, transparent)`,
                                color: prio.color
                              }}
                              title={`Prioridade ${prio.label}`}
                            >
                              {prio.label[0]}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <button
                  className="ax-pl-add mt-2 text-xs"
                  onClick={() => openNewTask(st.id)}
                >
                  <Plus size={14} /> Adicionar
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

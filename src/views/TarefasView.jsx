import React, { useState, useRef, useEffect } from 'react';
import { useHub, STAGES, PRIOS, fmtDate } from '../context/HubContext';
import {
  Search,
  Table as TableIcon,
  Kanban as KanbanIcon,
  Plus,
  Edit2,
  Calendar,
  CheckSquare,
  Send,
  Link,
  AlertTriangle,
  ChevronDown,
  Check,
  Eye,
  EyeOff,
  CheckCircle2
} from 'lucide-react';

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

  // Multi-select de estágios e controle da coluna de Concluídos no Kanban
  const [selectedStages, setSelectedStages] = useState([]);
  const [stageDropdownOpen, setStageDropdownOpen] = useState(false);
  const [showCompletedCol, setShowCompletedCol] = useState(false);
  const stageRef = useRef(null);

  // Fecha dropdown de estágios ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (stageRef.current && !stageRef.current.contains(e.target)) {
        setStageDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleStageFilter = (id) => {
    setSelectedStages((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const selectAllStages = () => {
    setSelectedStages([]);
  };

  const stageFilterText = () => {
    if (selectedStages.length === 0) return 'Todos os estágios';
    if (selectedStages.length === 1) {
      const found = STAGES.find((s) => s.id === selectedStages[0]);
      return found ? found.label : '1 estágio';
    }
    return `${selectedStages.length} estágios`;
  };

  // Filtragem (Demandas editoriais, posts de redes e revistas ficam exclusivamente no Calendário)
  const q = searchQuery.toLowerCase().trim();
  const tasks = activities
    .filter((a) => !isEditorialActivity(a))
    .filter((a) => {
      if (selectedStages.length > 0 && !selectedStages.includes(a.stage)) return false;
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

  const totalConcludedCount = activities.filter((a) => !isEditorialActivity(a) && a.stage === 'concluido').length;

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de Filtros Responsiva */}
      <div className="ax-card">
        <div className="ax-card__body flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          {/* Linha 1 no Mobile: Busca, Alternador Tabela / Kanban e Botão Concluídos */}
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

            {/* Botão de Toggle da Coluna Concluídos no Kanban */}
            {listMode === 'kanban' && (
              <button
                type="button"
                onClick={() => setShowCompletedCol((prev) => !prev)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 transition shrink-0 ${
                  showCompletedCol
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : 'border-[var(--ax-border)] bg-[var(--ax-surface)] text-[var(--ax-text-muted)] hover:text-[var(--ax-text-strong)]'
                }`}
                title={showCompletedCol ? 'Ocultar coluna de concluídos' : 'Mostrar coluna de concluídos'}
              >
                {showCompletedCol ? <EyeOff size={14} /> : <Eye size={14} />}
                <span className="hidden md:inline">{showCompletedCol ? 'Ocultar Concluídos' : 'Concluídos'}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[var(--ax-surface-subtle)]">
                  {totalConcludedCount}
                </span>
              </button>
            )}
          </div>

          {/* Linha 2 no Mobile: Dropdowns lado a lado (50% cada) */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Multi-Select de Estágios */}
            <div className="relative flex-1 sm:w-48" ref={stageRef}>
              <button
                type="button"
                className="ax-select w-full flex items-center justify-between text-xs px-3 h-[42px] rounded-xl border border-[var(--ax-border)] bg-[var(--ax-surface)] text-[var(--ax-text-strong)] cursor-pointer text-left transition"
                onClick={() => setStageDropdownOpen((prev) => !prev)}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {selectedStages.length === 1 && (
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: STAGES.find((s) => s.id === selectedStages[0])?.color }}
                    />
                  )}
                  <span className="truncate font-medium">{stageFilterText()}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-1">
                  {selectedStages.length > 1 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                      {selectedStages.length}
                    </span>
                  )}
                  <ChevronDown
                    size={14}
                    className={`text-[var(--ax-text-subtle)] transition-transform duration-200 ${
                      stageDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </button>

              {stageDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-60 p-2 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-2xl z-50 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      selectAllStages();
                      setStageDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                      selectedStages.length === 0
                        ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold'
                        : 'text-[var(--color-heading)] hover:bg-[var(--color-subtle)]'
                    }`}
                  >
                    <span>Todos os estágios</span>
                    {selectedStages.length === 0 && <Check size={14} />}
                  </button>

                  <div className="h-px bg-[var(--color-border)] my-1" />

                  <div className="space-y-0.5">
                    {STAGES.map((s) => {
                      const isChecked = selectedStages.includes(s.id);
                      const count = activities.filter((a) => !isEditorialActivity(a) && a.stage === s.id).length;
                      return (
                        <label
                          key={s.id}
                          className="flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs text-[var(--color-heading)] hover:bg-[var(--color-subtle)] cursor-pointer select-none transition"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleStageFilter(s.id)}
                              className="w-3.5 h-3.5 rounded text-[var(--color-primary)] accent-[var(--color-primary)] cursor-pointer"
                            />
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                            <span className={`truncate ${isChecked ? 'font-bold text-[var(--color-primary)]' : ''}`}>
                              {s.label}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-[var(--color-muted)]">{count}</span>
                        </label>
                      );
                    })}
                  </div>

                  {selectedStages.length > 0 && (
                    <div className="pt-2 border-t border-[var(--color-border)] flex justify-between items-center px-1">
                      <button
                        type="button"
                        className="text-[11px] text-[var(--color-muted)] hover:text-[var(--color-danger)] font-medium"
                        onClick={selectAllStages}
                      >
                        Limpar
                      </button>
                      <button
                        type="button"
                        className="text-[11px] text-[var(--color-primary)] font-bold hover:underline"
                        onClick={() => setStageDropdownOpen(false)}
                      >
                        Concluir
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Select de Categoria */}
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
            const isConcluido = st.id === 'concluido';
            if (isConcluido && !showCompletedCol) {
              return null;
            }
            if (selectedStages.length > 0 && !selectedStages.includes(st.id)) {
              return null;
            }

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
                    <div className="flex items-center gap-1.5">
                      <span className="ax-pl-col__count">{colTasks.length}</span>
                      {isConcluido && (
                        <button
                          type="button"
                          className="w-5 h-5 rounded flex items-center justify-center text-[var(--ax-text-subtle)] hover:text-[var(--ax-text-strong)] hover:bg-[var(--ax-surface-subtle)] transition cursor-pointer"
                          onClick={() => setShowCompletedCol(false)}
                          title="Ocultar coluna Concluído"
                        >
                          <EyeOff size={13} />
                        </button>
                      )}
                    </div>
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

          {/* Coluna Concluído Recolhida (Oculta por padrão, abre ao clicar) */}
          {!showCompletedCol && (!selectedStages.length || selectedStages.includes('concluido')) && (
            <div
              onClick={() => setShowCompletedCol(true)}
              onDragOver={(e) => handleDragOver(e, 'concluido')}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={(e) => handleDrop(e, 'concluido')}
              className={`flex flex-col items-center justify-start py-5 px-2 rounded-2xl border-2 border-dashed transition select-none w-14 shrink-0 min-h-[380px] cursor-pointer group ${
                dragOverCol === 'concluido'
                  ? 'border-emerald-500 bg-emerald-500/15 shadow-lg scale-105'
                  : 'border-[var(--ax-border)] hover:border-emerald-500/60 bg-[var(--ax-surface-subtle)]/40 hover:bg-emerald-500/5'
              }`}
              title="Clique para abrir a coluna de tarefas Concluídas (ou arraste uma tarefa para cá)"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                <CheckCircle2 size={18} />
              </div>
              <span className="text-[11px] font-bold [writing-mode:vertical-rl] rotate-180 uppercase tracking-widest text-[var(--ax-text-muted)] group-hover:text-emerald-500 transition py-2">
                Concluídos ({activities.filter((a) => !isEditorialActivity(a) && a.stage === 'concluido').length})
              </span>
              <div className="mt-auto text-[var(--ax-text-subtle)] group-hover:text-emerald-500 flex flex-col items-center gap-1 transition">
                <Eye size={15} />
                <span className="text-[9px] font-semibold [writing-mode:vertical-rl] rotate-180">Expandir</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

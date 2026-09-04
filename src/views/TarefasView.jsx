import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  CheckCircle2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  X
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
  const [catDropdownOpen, setCatDropdownOpen] = useState(false);
  const [showCompletedCol, setShowCompletedCol] = useState(false);
  const stageRef = useRef(null);
  const catRef = useRef(null);

  // Ordenação das colunas da tabela
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  const handleSort = (field) => {
    if (sortField !== field) {
      setSortField(field);
      // Para progresso, prioridade e checklist, primeiro clique é desc (maior pro menor)
      if (field === 'progress' || field === 'prioridade' || field === 'checklist') {
        setSortDirection('desc');
      } else {
        setSortDirection('asc');
      }
    } else {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        // Terceiro clique reseta para o padrão
        setSortField(null);
        setSortDirection('asc');
      }
    }
  };

  const renderSortIndicator = (field) => {
    const isActive = sortField === field;
    if (!isActive) {
      return (
        <ArrowUpDown
          size={12}
          className="text-[var(--ax-text-subtle)] opacity-40 group-hover:opacity-100 transition shrink-0 ml-1"
        />
      );
    }
    if (sortDirection === 'asc') {
      return <ArrowUp size={13} className="text-[var(--color-primary)] shrink-0 ml-1 animate-in fade-in" />;
    }
    return <ArrowDown size={13} className="text-[var(--color-primary)] shrink-0 ml-1 animate-in fade-in" />;
  };

  // Filtros dinâmicos estilo Excel por coluna
  const [colFilters, setColFilters] = useState({
    categoria: [],
    stage: [],
    prioridade: [],
    progress: [],
    checklist: [],
    deadline: [],
    titulo: ''
  });
  const [activeFilterMenu, setActiveFilterMenu] = useState(null);
  const filterMenuRef = useRef(null);

  const toggleColFilterValue = (column, val) => {
    setColFilters((prev) => {
      const current = prev[column] || [];
      const updated = current.includes(val)
        ? current.filter((x) => x !== val)
        : [...current, val];
      return { ...prev, [column]: updated };
    });
  };

  const clearColFilter = (column) => {
    setColFilters((prev) => ({
      ...prev,
      [column]: column === 'titulo' ? '' : []
    }));
  };

  const clearAllColFilters = () => {
    setColFilters({
      categoria: [],
      stage: [],
      prioridade: [],
      progress: [],
      checklist: [],
      deadline: [],
      titulo: ''
    });
  };

  const activeColFilterCount = useMemo(() => {
    let count = 0;
    if (colFilters.categoria.length > 0) count++;
    if (colFilters.stage.length > 0) count++;
    if (colFilters.prioridade.length > 0) count++;
    if (colFilters.progress.length > 0) count++;
    if (colFilters.checklist?.length > 0) count++;
    if (colFilters.deadline.length > 0) count++;
    if (colFilters.titulo.trim().length > 0) count++;
    return count;
  }, [colFilters]);

  const isColFiltered = (column) => {
    if (column === 'titulo') return Boolean(colFilters.titulo && colFilters.titulo.trim().length > 0);
    if (column === 'dataVencimento') return Boolean(colFilters.deadline && colFilters.deadline.length > 0);
    return Boolean(colFilters[column] && colFilters[column].length > 0);
  };

  // Fecha dropdowns de estágios, categorias e menu Excel de coluna ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (stageRef.current && !stageRef.current.contains(e.target)) {
        setStageDropdownOpen(false);
      }
      if (catRef.current && !catRef.current.contains(e.target)) {
        setCatDropdownOpen(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target)) {
        setActiveFilterMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableCategories = useMemo(() => {
    return categories.filter((c) => String(c.id) !== '1' && !c.nome?.toLowerCase().includes('editorial'));
  }, [categories]);

  const selectedCategoryObj = useMemo(() => {
    if (listCat === 'all') return null;
    return categories.find((c) => String(c.id) === String(listCat));
  }, [categories, listCat]);

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

  // Filtragem dinâmica multi-coluna estilo Excel para a tabela
  const filteredTableTasks = useMemo(() => {
    return tasks.filter((a) => {
      // Filtro de Tarefa / Texto
      if (colFilters.titulo.trim()) {
        const term = colFilters.titulo.toLowerCase().trim();
        const str = `${a.titulo} ${a.descricao || ''} ${a.projeto || ''}`.toLowerCase();
        if (!str.includes(term)) return false;
      }

      // Filtro de Categoria
      if (colFilters.categoria.length > 0) {
        if (!colFilters.categoria.includes(String(a.categoria))) return false;
      }

      // Filtro de Estágio
      if (colFilters.stage.length > 0) {
        if (!colFilters.stage.includes(a.stage)) return false;
      }

      // Filtro de Progresso
      if (colFilters.progress.length > 0) {
        const p = Number(a.progress) || 0;
        const match = colFilters.progress.some((range) => {
          if (range === '100') return p === 100;
          if (range === '50-99') return p >= 50 && p < 100;
          if (range === '1-49') return p >= 1 && p < 50;
          if (range === '0') return p === 0;
          return false;
        });
        if (!match) return false;
      }

      // Filtro de Checklist
      if (colFilters.checklist && colFilters.checklist.length > 0) {
        const tot = (a.idCheck || []).length;
        const done = tot ? a.idCheck.filter((c) => c.done).length : 0;
        const match = colFilters.checklist.some((type) => {
          if (type === 'completed') return tot > 0 && done === tot;
          if (type === 'pending') return tot > 0 && done < tot;
          if (type === 'none') return tot === 0;
          return false;
        });
        if (!match) return false;
      }

      // Filtro de Deadline
      if (colFilters.deadline.length > 0) {
        const overdue = isOverdue(a);
        const dueSoon = isDueSoon(a);
        const hasDate = Boolean(a.dataVencimento);
        const match = colFilters.deadline.some((dType) => {
          if (dType === 'overdue') return overdue;
          if (dType === 'dueSoon') return dueSoon && !overdue;
          if (dType === 'future') return hasDate && !overdue && !dueSoon;
          if (dType === 'none') return !hasDate;
          return false;
        });
        if (!match) return false;
      }

      // Filtro de Prioridade
      if (colFilters.prioridade.length > 0) {
        if (!colFilters.prioridade.includes(a.prioridade)) return false;
      }

      return true;
    });
  }, [tasks, colFilters, isOverdue, isDueSoon]);

  const displayedTableTasks = useMemo(() => {
    if (!sortField) return filteredTableTasks;

    return [...filteredTableTasks].sort((a, b) => {
      let comp = 0;
      switch (sortField) {
        case 'titulo':
          comp = (a.titulo || '').localeCompare(b.titulo || '', 'pt-BR', { sensitivity: 'base' });
          break;

        case 'categoria': {
          const catA = catOf(a.categoria)?.nome || '';
          const catB = catOf(b.categoria)?.nome || '';
          comp = catA.localeCompare(catB, 'pt-BR', { sensitivity: 'base' });
          break;
        }

        case 'stage': {
          const stageOrder = { afazer: 1, andamento: 2, espera: 3, validando: 4, concluido: 5 };
          const sA = stageOrder[a.stage] || 99;
          const sB = stageOrder[b.stage] || 99;
          comp = sA - sB;
          break;
        }

        case 'progress': {
          const pA = Number(a.progress) || 0;
          const pB = Number(b.progress) || 0;
          comp = pA - pB;
          break;
        }

        case 'checklist': {
          const totA = (a.idCheck || []).length;
          const doneA = totA ? a.idCheck.filter((c) => c.done).length : 0;
          const ratioA = totA > 0 ? doneA / totA : 0;

          const totB = (b.idCheck || []).length;
          const doneB = totB ? b.idCheck.filter((c) => c.done).length : 0;
          const ratioB = totB > 0 ? doneB / totB : 0;

          comp = ratioA !== ratioB ? ratioA - ratioB : doneA - doneB;
          break;
        }

        case 'dataVencimento': {
          const dA = a.dataVencimento || '9999-99-99';
          const dB = b.dataVencimento || '9999-99-99';
          comp = dA.localeCompare(dB);
          break;
        }

        case 'prioridade': {
          const prioOrder = { alta: 3, media: 2, baixa: 1 };
          const prA = prioOrder[a.prioridade] || 0;
          const prB = prioOrder[b.prioridade] || 0;
          comp = prA - prB;
          break;
        }

        default:
          comp = 0;
      }

      return sortDirection === 'desc' ? -comp : comp;
    });
  }, [filteredTableTasks, sortField, sortDirection, catOf]);

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

  const renderFilterContent = (colKey) => {
    switch (colKey) {
      case 'titulo':
        return (
          <div className="flex flex-col gap-2">
            <div className="relative">
              <input
                type="text"
                value={colFilters.titulo}
                onChange={(e) => setColFilters((prev) => ({ ...prev, titulo: e.target.value }))}
                placeholder="Filtrar por nome ou projeto..."
                className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-subtle)] focus:outline-none focus:border-[var(--color-primary)] pr-7"
                autoFocus
              />
              {colFilters.titulo && (
                <button
                  type="button"
                  onClick={() => clearColFilter('titulo')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--ax-text-muted)] hover:text-[var(--ax-text-strong)] cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <span className="text-[11px] text-[var(--ax-text-subtle)]">
              Digite qualquer parte do título ou projeto.
            </span>
          </div>
        );

      case 'categoria':
        return (
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
            {availableCategories.map((c) => {
              const isChecked = colFilters.categoria.includes(String(c.id));
              const count = tasks.filter((t) => String(t.categoria) === String(c.id)).length;
              return (
                <label
                  key={c.id}
                  className="flex items-center gap-2 p-1.5 rounded-lg text-xs hover:bg-[var(--ax-surface-subtle)] cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleColFilterValue('categoria', String(c.id))}
                    className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                  />
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: c.cor || 'var(--color-primary)' }}
                  />
                  <span className="flex-1 truncate text-[var(--ax-text-strong)]">{c.nome}</span>
                  <span className="text-[10px] font-mono text-[var(--ax-text-muted)]">({count})</span>
                </label>
              );
            })}
          </div>
        );

      case 'stage':
        return (
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
            {STAGES.map((s) => {
              const isChecked = colFilters.stage.includes(s.id);
              const count = tasks.filter((t) => t.stage === s.id).length;
              return (
                <label
                  key={s.id}
                  className="flex items-center gap-2 p-1.5 rounded-lg text-xs hover:bg-[var(--ax-surface-subtle)] cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleColFilterValue('stage', s.id)}
                    className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                  />
                  <span className={`ax-badge ax-badge--soft ax-badge--${s.tone} ax-badge--xs ax-badge--pill`}>
                    <span className="ax-badge__dot" />
                    {s.label}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--ax-text-muted)] ml-auto">({count})</span>
                </label>
              );
            })}
          </div>
        );

      case 'progress':
        return (
          <div className="flex flex-col gap-1">
            {[
              { id: '100', label: '100% (Concluído)', test: (p) => p === 100 },
              { id: '50-99', label: '50% a 99% (Avançado)', test: (p) => p >= 50 && p < 100 },
              { id: '1-49', label: '1% a 49% (Inicial)', test: (p) => p >= 1 && p < 50 },
              { id: '0', label: '0% (Não iniciado)', test: (p) => p === 0 }
            ].map((item) => {
              const isChecked = colFilters.progress.includes(item.id);
              const count = tasks.filter((t) => item.test(Number(t.progress) || 0)).length;
              return (
                <label
                  key={item.id}
                  className="flex items-center gap-2 p-1.5 rounded-lg text-xs hover:bg-[var(--ax-surface-subtle)] cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleColFilterValue('progress', item.id)}
                    className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                  />
                  <span className="flex-1 text-[var(--ax-text-strong)]">{item.label}</span>
                  <span className="text-[10px] font-mono text-[var(--ax-text-muted)]">({count})</span>
                </label>
              );
            })}
          </div>
        );

      case 'checklist':
        return (
          <div className="flex flex-col gap-1">
            {[
              {
                id: 'completed',
                label: 'Todos concluídos',
                test: (t) => (t.idCheck || []).length > 0 && (t.idCheck || []).every((c) => c.done)
              },
              {
                id: 'pending',
                label: 'Com itens pendentes',
                test: (t) => (t.idCheck || []).length > 0 && (t.idCheck || []).some((c) => !c.done)
              },
              {
                id: 'none',
                label: 'Sem checklist',
                test: (t) => !(t.idCheck || []).length
              }
            ].map((item) => {
              const isChecked = (colFilters.checklist || []).includes(item.id);
              const count = tasks.filter(item.test).length;
              return (
                <label
                  key={item.id}
                  className="flex items-center gap-2 p-1.5 rounded-lg text-xs hover:bg-[var(--ax-surface-subtle)] cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleColFilterValue('checklist', item.id)}
                    className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                  />
                  <span className="flex-1 text-[var(--ax-text-strong)]">{item.label}</span>
                  <span className="text-[10px] font-mono text-[var(--ax-text-muted)]">({count})</span>
                </label>
              );
            })}
          </div>
        );

      case 'dataVencimento':
        return (
          <div className="flex flex-col gap-1">
            {[
              {
                id: 'overdue',
                label: 'Atrasadas',
                tone: 'danger',
                test: (t) => isOverdue(t)
              },
              {
                id: 'dueSoon',
                label: 'Próximas (48h)',
                tone: 'warning',
                test: (t) => isDueSoon(t) && !isOverdue(t)
              },
              {
                id: 'future',
                label: 'No prazo / Futuras',
                test: (t) => Boolean(t.dataVencimento) && !isOverdue(t) && !isDueSoon(t)
              },
              {
                id: 'none',
                label: 'Sem prazo definido',
                test: (t) => !t.dataVencimento
              }
            ].map((item) => {
              const isChecked = colFilters.deadline.includes(item.id);
              const count = tasks.filter(item.test).length;
              return (
                <label
                  key={item.id}
                  className="flex items-center gap-2 p-1.5 rounded-lg text-xs hover:bg-[var(--ax-surface-subtle)] cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleColFilterValue('deadline', item.id)}
                    className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                  />
                  <span className="flex-1 text-[var(--ax-text-strong)] flex items-center gap-1.5">
                    {item.tone ? (
                      <span className={`ax-badge ax-badge--soft ax-badge--${item.tone} ax-badge--xs ax-badge--pill`}>
                        {item.label}
                      </span>
                    ) : (
                      <span>{item.label}</span>
                    )}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--ax-text-muted)]">({count})</span>
                </label>
              );
            })}
          </div>
        );

      case 'prioridade':
        return (
          <div className="flex flex-col gap-1">
            {Object.entries(PRIOS).map(([key, val]) => {
              const isChecked = colFilters.prioridade.includes(key);
              const count = tasks.filter((t) => t.prioridade === key).length;
              return (
                <label
                  key={key}
                  className="flex items-center gap-2 p-1.5 rounded-lg text-xs hover:bg-[var(--ax-surface-subtle)] cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleColFilterValue('prioridade', key)}
                    className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)] cursor-pointer"
                  />
                  <span
                    className="ax-badge ax-badge--soft ax-badge--xs ax-badge--pill"
                    style={{ '--_b500': val.color }}
                  >
                    {val.label}
                  </span>
                  <span className="text-[10px] font-mono text-[var(--ax-text-muted)] ml-auto">({count})</span>
                </label>
              );
            })}
          </div>
        );

      default:
        return null;
    }
  };

  const renderExcelFilterMenu = (colKey) => {
    if (activeFilterMenu !== colKey) return null;

    const alignClass =
      colKey === 'titulo'
        ? 'left-0'
        : colKey === 'dataVencimento' || colKey === 'prioridade'
        ? 'right-0'
        : 'left-1/2 -translate-x-1/2';

    const filterTargetKey = colKey === 'dataVencimento' ? 'deadline' : colKey;

    return (
      <div
        ref={filterMenuRef}
        className={`absolute top-full mt-2 w-72 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl p-3 z-50 text-left normal-case tracking-normal ${alignClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Classificação rápida */}
        <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ax-text-muted)] mb-2">
          Classificação rápida
        </div>

        <div className="flex flex-col gap-1">
          {/* Menor para maior / A-Z */}
          <button
            type="button"
            onClick={() => {
              setSortField(colKey);
              setSortDirection('asc');
            }}
            className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              sortField === colKey && sortDirection === 'asc'
                ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold'
                : 'text-[var(--ax-text-strong)] hover:bg-[var(--ax-surface-subtle)]'
            }`}
          >
            <ArrowUp size={13} className={sortField === colKey && sortDirection === 'asc' ? 'text-[var(--color-primary)]' : 'text-[var(--ax-text-muted)]'} />
            <span>
              {colKey === 'titulo' || colKey === 'categoria'
                ? 'Classificar de A a Z'
                : colKey === 'stage'
                ? 'Do início ao fim (A Fazer → Concluído)'
                : colKey === 'progress'
                ? 'Do menor para o maior (0% → 100%)'
                : colKey === 'checklist'
                ? 'Menos itens concluídos'
                : colKey === 'dataVencimento'
                ? 'Mais próximas / urgentes'
                : 'Da menor para a maior (Baixa → Alta)'}
            </span>
            {sortField === colKey && sortDirection === 'asc' && <Check size={13} className="ml-auto text-[var(--color-primary)]" />}
          </button>

          {/* Maior para menor / Z-A */}
          <button
            type="button"
            onClick={() => {
              setSortField(colKey);
              setSortDirection('desc');
            }}
            className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              sortField === colKey && sortDirection === 'desc'
                ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold'
                : 'text-[var(--ax-text-strong)] hover:bg-[var(--ax-surface-subtle)]'
            }`}
          >
            <ArrowDown size={13} className={sortField === colKey && sortDirection === 'desc' ? 'text-[var(--color-primary)]' : 'text-[var(--ax-text-muted)]'} />
            <span>
              {colKey === 'titulo' || colKey === 'categoria'
                ? 'Classificar de Z a A'
                : colKey === 'stage'
                ? 'Do fim ao início (Concluído → A Fazer)'
                : colKey === 'progress'
                ? 'Do maior para o menor (100% → 0%)'
                : colKey === 'checklist'
                ? 'Mais itens concluídos'
                : colKey === 'dataVencimento'
                ? 'Mais distantes / futuras'
                : 'Da maior para a menor (Alta → Baixa)'}
            </span>
            {sortField === colKey && sortDirection === 'desc' && <Check size={13} className="ml-auto text-[var(--color-primary)]" />}
          </button>
        </div>

        <div className="my-2.5 border-t border-[var(--color-border)]" />

        {/* Multi-filtros da coluna */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ax-text-muted)]">
            Filtrar valores
          </span>
          {isColFiltered(colKey) && (
            <button
              type="button"
              onClick={() => clearColFilter(filterTargetKey)}
              className="text-[10px] text-[var(--color-primary)] font-bold hover:underline cursor-pointer"
            >
              Limpar filtro
            </button>
          )}
        </div>

        {renderFilterContent(colKey)}

        {/* Rodapé do Menu */}
        <div className="mt-3 pt-2 border-t border-[var(--color-border)] flex items-center justify-end">
          <button
            type="button"
            onClick={() => setActiveFilterMenu(null)}
            className="text-xs px-3 py-1 rounded-lg bg-[var(--color-primary)] text-white font-semibold hover:opacity-90 transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de Filtros Responsiva */}
      <div className="ax-card !overflow-visible relative z-30">
        <div className="ax-card__body flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 !overflow-visible">
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
          <div className="flex items-center gap-2 w-full sm:w-auto relative z-30">
            {/* Multi-Select de Estágios */}
            <div className="relative flex-1 sm:w-48 z-40" ref={stageRef}>
              <button
                type="button"
                className={`ax-select w-full flex items-center justify-between text-xs px-3 h-[42px] rounded-xl border bg-[var(--ax-surface)] text-[var(--ax-text-strong)] cursor-pointer text-left transition ${
                  stageDropdownOpen ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/25' : 'border-[var(--ax-border)]'
                }`}
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
                <div className="absolute left-0 top-full mt-1.5 w-60 p-2 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[0_12px_40px_rgba(0,0,0,0.35)] z-[100] space-y-1">
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

            {/* Dropdown Customizado de Categoria */}
            <div className="relative flex-1 sm:w-48 z-40" ref={catRef}>
              <button
                type="button"
                className={`ax-select w-full flex items-center justify-between text-xs px-3 h-[42px] rounded-xl border bg-[var(--ax-surface)] text-[var(--ax-text-strong)] cursor-pointer text-left transition ${
                  catDropdownOpen
                    ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/25'
                    : 'border-[var(--ax-border)]'
                }`}
                onClick={() => setCatDropdownOpen((prev) => !prev)}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {selectedCategoryObj ? (
                    <>
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: selectedCategoryObj.cor || 'var(--color-primary)' }}
                      />
                      <span className="truncate font-medium">{selectedCategoryObj.nome}</span>
                    </>
                  ) : (
                    <span className="truncate font-medium">Todas as categorias</span>
                  )}
                </div>

                <ChevronDown
                  size={14}
                  className={`text-[var(--ax-text-subtle)] transition-transform duration-200 shrink-0 ml-1 ${
                    catDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {catDropdownOpen && (
                <div className="absolute right-0 sm:left-0 top-full mt-1.5 w-60 p-2 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[0_12px_40px_rgba(0,0,0,0.35)] z-[100] space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setListCat('all');
                      setCatDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                      listCat === 'all'
                        ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold'
                        : 'text-[var(--color-heading)] hover:bg-[var(--color-subtle)]'
                    }`}
                  >
                    <span>Todas as categorias</span>
                    {listCat === 'all' && <Check size={14} />}
                  </button>

                  <div className="h-px bg-[var(--color-border)] my-1" />

                  <div className="space-y-0.5 max-h-60 overflow-y-auto">
                    {availableCategories.map((c) => {
                      const isSelected = String(listCat) === String(c.id);
                      const count = activities.filter(
                        (a) => !isEditorialActivity(a) && String(a.categoria) === String(c.id)
                      ).length;

                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setListCat(c.id);
                            setCatDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition cursor-pointer select-none ${
                            isSelected
                              ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold'
                              : 'text-[var(--color-heading)] hover:bg-[var(--color-subtle)]'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ background: c.cor || 'var(--color-primary)' }}
                            />
                            <span className="truncate">{c.nome}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-mono text-[var(--color-muted)]">{count}</span>
                            {isSelected && <Check size={14} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabela View */}
      {listMode === 'table' && (
        <div className="ax-card !overflow-visible relative z-20">
          <div className="ax-card__body p-0 !overflow-visible">
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
              <div className="ax-table-wrap min-h-[420px] pb-12">
                {/* Barra de Filtros Ativos e Ordenação */}
                {(activeColFilterCount > 0 || sortField) && (
                  <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-primary-soft)]/20 text-xs">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[var(--ax-text-muted)] font-semibold flex items-center gap-1 mr-1">
                        <Filter size={13} className="text-[var(--color-primary)]" />
                        <span>Filtros e ordenação:</span>
                      </span>

                      {/* Pill de Ordenação */}
                      {sortField && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--ax-text-strong)] text-[11px] font-medium shadow-xs">
                          <span className="text-[var(--ax-text-muted)]">Ordenação:</span>
                          <strong>
                            {sortField === 'progress' && 'Progresso'}
                            {sortField === 'titulo' && 'Tarefa'}
                            {sortField === 'categoria' && 'Categoria'}
                            {sortField === 'stage' && 'Estágio'}
                            {sortField === 'checklist' && 'Checklist'}
                            {sortField === 'dataVencimento' && 'Deadline'}
                            {sortField === 'prioridade' && 'Prioridade'}
                          </strong>
                          <span>({sortDirection === 'desc' ? 'Maior p/ menor' : 'Menor p/ maior / A-Z'})</span>
                          <button
                            type="button"
                            onClick={() => setSortField(null)}
                            className="text-[var(--ax-text-muted)] hover:text-[var(--ax-danger-500)] ml-0.5 cursor-pointer"
                            title="Remover ordenação"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      )}

                      {/* Pill de Tarefa */}
                      {colFilters.titulo.trim() && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--ax-text-strong)] text-[11px] font-medium shadow-xs">
                          <span className="text-[var(--ax-text-muted)]">Tarefa:</span>
                          <span className="truncate max-w-[120px]">"{colFilters.titulo}"</span>
                          <button
                            type="button"
                            onClick={() => clearColFilter('titulo')}
                            className="text-[var(--ax-text-muted)] hover:text-[var(--ax-danger-500)] ml-0.5 cursor-pointer"
                            title="Remover filtro de tarefa"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      )}

                      {/* Pill de Categoria */}
                      {colFilters.categoria.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--ax-text-strong)] text-[11px] font-medium shadow-xs">
                          <span className="text-[var(--ax-text-muted)]">Categoria:</span>
                          <span>{colFilters.categoria.map((id) => catOf(id)?.nome || id).join(', ')}</span>
                          <button
                            type="button"
                            onClick={() => clearColFilter('categoria')}
                            className="text-[var(--ax-text-muted)] hover:text-[var(--ax-danger-500)] ml-0.5 cursor-pointer"
                            title="Remover filtro de categoria"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      )}

                      {/* Pill de Estágio */}
                      {colFilters.stage.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--ax-text-strong)] text-[11px] font-medium shadow-xs">
                          <span className="text-[var(--ax-text-muted)]">Estágio:</span>
                          <span>{colFilters.stage.map((s) => stageOf(s)?.label || s).join(', ')}</span>
                          <button
                            type="button"
                            onClick={() => clearColFilter('stage')}
                            className="text-[var(--ax-text-muted)] hover:text-[var(--ax-danger-500)] ml-0.5 cursor-pointer"
                            title="Remover filtro de estágio"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      )}

                      {/* Pill de Progresso */}
                      {colFilters.progress.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--ax-text-strong)] text-[11px] font-medium shadow-xs">
                          <span className="text-[var(--ax-text-muted)]">Progresso:</span>
                          <span>{colFilters.progress.map((p) => p === '100' ? '100%' : p === '50-99' ? '50-99%' : p === '1-49' ? '1-49%' : '0%').join(', ')}</span>
                          <button
                            type="button"
                            onClick={() => clearColFilter('progress')}
                            className="text-[var(--ax-text-muted)] hover:text-[var(--ax-danger-500)] ml-0.5 cursor-pointer"
                            title="Remover filtro de progresso"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      )}

                      {/* Pill de Checklist */}
                      {colFilters.checklist?.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--ax-text-strong)] text-[11px] font-medium shadow-xs">
                          <span className="text-[var(--ax-text-muted)]">Checklist:</span>
                          <span>{colFilters.checklist.map((c) => c === 'completed' ? 'Concluídos' : c === 'pending' ? 'Pendentes' : 'Sem checklist').join(', ')}</span>
                          <button
                            type="button"
                            onClick={() => clearColFilter('checklist')}
                            className="text-[var(--ax-text-muted)] hover:text-[var(--ax-danger-500)] ml-0.5 cursor-pointer"
                            title="Remover filtro de checklist"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      )}

                      {/* Pill de Deadline */}
                      {colFilters.deadline.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--ax-text-strong)] text-[11px] font-medium shadow-xs">
                          <span className="text-[var(--ax-text-muted)]">Deadline:</span>
                          <span>{colFilters.deadline.map((d) => d === 'overdue' ? 'Atrasadas' : d === 'dueSoon' ? '48h' : d === 'future' ? 'No prazo' : 'Sem data').join(', ')}</span>
                          <button
                            type="button"
                            onClick={() => clearColFilter('deadline')}
                            className="text-[var(--ax-text-muted)] hover:text-[var(--ax-danger-500)] ml-0.5 cursor-pointer"
                            title="Remover filtro de deadline"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      )}

                      {/* Pill de Prioridade */}
                      {colFilters.prioridade.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--ax-text-strong)] text-[11px] font-medium shadow-xs">
                          <span className="text-[var(--ax-text-muted)]">Prioridade:</span>
                          <span>{colFilters.prioridade.map((p) => PRIOS[p]?.label || p).join(', ')}</span>
                          <button
                            type="button"
                            onClick={() => clearColFilter('prioridade')}
                            className="text-[var(--ax-text-muted)] hover:text-[var(--ax-danger-500)] ml-0.5 cursor-pointer"
                            title="Remover filtro de prioridade"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-[var(--ax-text-muted)]">
                        Exibindo <strong>{displayedTableTasks.length}</strong> de <strong>{tasks.length}</strong> tarefas
                      </span>
                      {activeColFilterCount > 0 && (
                        <button
                          type="button"
                          onClick={clearAllColFilters}
                          className="text-[11px] font-bold text-[var(--color-primary)] hover:underline flex items-center gap-0.5 cursor-pointer ml-1"
                        >
                          <X size={12} /> Limpar filtros
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <table className="ax-table ax-table--hover">
                  <thead className="relative z-20">
                    <tr>
                      {/* Tarefa */}
                      <th className="text-left relative select-none">
                        <div className="flex items-center justify-start gap-1.5">
                          <div
                            className="flex items-center gap-1 cursor-pointer hover:text-[var(--color-primary)] transition"
                            onClick={() => handleSort('titulo')}
                            title="Ordenar por Tarefa (A-Z / Z-A)"
                          >
                            <span className={sortField === 'titulo' ? 'text-[var(--color-primary)] font-bold' : ''}>
                              Tarefa
                            </span>
                            {renderSortIndicator('titulo')}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFilterMenu(activeFilterMenu === 'titulo' ? null : 'titulo');
                            }}
                            className={`p-1 rounded-md transition cursor-pointer ${
                              isColFiltered('titulo')
                                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                                : 'text-[var(--ax-text-subtle)] hover:bg-[var(--ax-surface-subtle)] hover:text-[var(--ax-text-strong)]'
                            }`}
                            title="Filtrar por Tarefa"
                          >
                            <Filter size={11} className={isColFiltered('titulo') ? 'fill-white' : ''} />
                          </button>
                        </div>
                        {renderExcelFilterMenu('titulo')}
                      </th>

                      {/* Categoria */}
                      <th className="text-center relative select-none">
                        <div className="flex items-center justify-center gap-1.5">
                          <div
                            className="flex items-center gap-1 cursor-pointer hover:text-[var(--color-primary)] transition"
                            onClick={() => handleSort('categoria')}
                            title="Ordenar por Categoria (A-Z / Z-A)"
                          >
                            <span className={sortField === 'categoria' ? 'text-[var(--color-primary)] font-bold' : ''}>
                              Categoria
                            </span>
                            {renderSortIndicator('categoria')}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFilterMenu(activeFilterMenu === 'categoria' ? null : 'categoria');
                            }}
                            className={`p-1 rounded-md transition cursor-pointer ${
                              isColFiltered('categoria')
                                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                                : 'text-[var(--ax-text-subtle)] hover:bg-[var(--ax-surface-subtle)] hover:text-[var(--ax-text-strong)]'
                            }`}
                            title="Filtrar por Categoria"
                          >
                            <Filter size={11} className={isColFiltered('categoria') ? 'fill-white' : ''} />
                          </button>
                        </div>
                        {renderExcelFilterMenu('categoria')}
                      </th>

                      {/* Estágio */}
                      <th className="text-center relative select-none">
                        <div className="flex items-center justify-center gap-1.5">
                          <div
                            className="flex items-center gap-1 cursor-pointer hover:text-[var(--color-primary)] transition"
                            onClick={() => handleSort('stage')}
                            title="Ordenar por Estágio do fluxo"
                          >
                            <span className={sortField === 'stage' ? 'text-[var(--color-primary)] font-bold' : ''}>
                              Estágio
                            </span>
                            {renderSortIndicator('stage')}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFilterMenu(activeFilterMenu === 'stage' ? null : 'stage');
                            }}
                            className={`p-1 rounded-md transition cursor-pointer ${
                              isColFiltered('stage')
                                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                                : 'text-[var(--ax-text-subtle)] hover:bg-[var(--ax-surface-subtle)] hover:text-[var(--ax-text-strong)]'
                            }`}
                            title="Filtrar por Estágio"
                          >
                            <Filter size={11} className={isColFiltered('stage') ? 'fill-white' : ''} />
                          </button>
                        </div>
                        {renderExcelFilterMenu('stage')}
                      </th>

                      {/* Progresso */}
                      <th className="text-center relative select-none">
                        <div className="flex items-center justify-center gap-1.5">
                          <div
                            className="flex items-center gap-1 cursor-pointer hover:text-[var(--color-primary)] transition"
                            onClick={() => handleSort('progress')}
                            title="Ordenar por Progresso (Maior para menor / Menor para maior)"
                          >
                            <span className={sortField === 'progress' ? 'text-[var(--color-primary)] font-bold' : ''}>
                              Progresso
                            </span>
                            {renderSortIndicator('progress')}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFilterMenu(activeFilterMenu === 'progress' ? null : 'progress');
                            }}
                            className={`p-1 rounded-md transition cursor-pointer ${
                              isColFiltered('progress')
                                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                                : 'text-[var(--ax-text-subtle)] hover:bg-[var(--ax-surface-subtle)] hover:text-[var(--ax-text-strong)]'
                            }`}
                            title="Filtrar por Progresso"
                          >
                            <Filter size={11} className={isColFiltered('progress') ? 'fill-white' : ''} />
                          </button>
                        </div>
                        {renderExcelFilterMenu('progress')}
                      </th>

                      {/* Checklist */}
                      <th className="text-center relative select-none">
                        <div className="flex items-center justify-center gap-1.5">
                          <div
                            className="flex items-center gap-1 cursor-pointer hover:text-[var(--color-primary)] transition"
                            onClick={() => handleSort('checklist')}
                            title="Ordenar por Checklist concluído"
                          >
                            <span className={sortField === 'checklist' ? 'text-[var(--color-primary)] font-bold' : ''}>
                              Checklist
                            </span>
                            {renderSortIndicator('checklist')}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFilterMenu(activeFilterMenu === 'checklist' ? null : 'checklist');
                            }}
                            className={`p-1 rounded-md transition cursor-pointer ${
                              isColFiltered('checklist')
                                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                                : 'text-[var(--ax-text-subtle)] hover:bg-[var(--ax-surface-subtle)] hover:text-[var(--ax-text-strong)]'
                            }`}
                            title="Filtrar por Checklist"
                          >
                            <Filter size={11} className={isColFiltered('checklist') ? 'fill-white' : ''} />
                          </button>
                        </div>
                        {renderExcelFilterMenu('checklist')}
                      </th>

                      {/* Deadline */}
                      <th className="text-center relative select-none">
                        <div className="flex items-center justify-center gap-1.5">
                          <div
                            className="flex items-center gap-1 cursor-pointer hover:text-[var(--color-primary)] transition"
                            onClick={() => handleSort('dataVencimento')}
                            title="Ordenar por Prazo / Deadline"
                          >
                            <span className={sortField === 'dataVencimento' ? 'text-[var(--color-primary)] font-bold' : ''}>
                              Deadline
                            </span>
                            {renderSortIndicator('dataVencimento')}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFilterMenu(activeFilterMenu === 'dataVencimento' ? null : 'dataVencimento');
                            }}
                            className={`p-1 rounded-md transition cursor-pointer ${
                              isColFiltered('dataVencimento')
                                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                                : 'text-[var(--ax-text-subtle)] hover:bg-[var(--ax-surface-subtle)] hover:text-[var(--ax-text-strong)]'
                            }`}
                            title="Filtrar por Deadline"
                          >
                            <Filter size={11} className={isColFiltered('dataVencimento') ? 'fill-white' : ''} />
                          </button>
                        </div>
                        {renderExcelFilterMenu('dataVencimento')}
                      </th>

                      {/* Prioridade */}
                      <th className="text-center relative select-none">
                        <div className="flex items-center justify-center gap-1.5">
                          <div
                            className="flex items-center gap-1 cursor-pointer hover:text-[var(--color-primary)] transition"
                            onClick={() => handleSort('prioridade')}
                            title="Ordenar por Prioridade (Maior para menor / Menor para maior)"
                          >
                            <span className={sortField === 'prioridade' ? 'text-[var(--color-primary)] font-bold' : ''}>
                              Prioridade
                            </span>
                            {renderSortIndicator('prioridade')}
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFilterMenu(activeFilterMenu === 'prioridade' ? null : 'prioridade');
                            }}
                            className={`p-1 rounded-md transition cursor-pointer ${
                              isColFiltered('prioridade')
                                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                                : 'text-[var(--ax-text-subtle)] hover:bg-[var(--ax-surface-subtle)] hover:text-[var(--ax-text-strong)]'
                            }`}
                            title="Filtrar por Prioridade"
                          >
                            <Filter size={11} className={isColFiltered('prioridade') ? 'fill-white' : ''} />
                          </button>
                        </div>
                        {renderExcelFilterMenu('prioridade')}
                      </th>

                      {/* Ações */}
                      <th className="text-center" style={{ width: '80px' }} />
                    </tr>
                  </thead>
                  <tbody>
                    {displayedTableTasks.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-xs text-[var(--ax-text-subtle)]">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Filter size={24} className="text-[var(--ax-text-muted)] opacity-50" />
                            <span className="font-semibold text-[var(--ax-text-strong)]">
                              Nenhuma tarefa corresponde aos filtros selecionados.
                            </span>
                            <span className="text-[11px] text-[var(--ax-text-subtle)]">
                              Ajuste os filtros nas colunas ou clique no botão abaixo para redefini-los.
                            </span>
                            <button
                              type="button"
                              onClick={clearAllColFilters}
                              className="mt-2 ax-btn ax-btn--secondary ax-btn--sm ax-btn--pill cursor-pointer"
                            >
                              <X size={14} /> Limpar todos os filtros das colunas
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      displayedTableTasks.map((a) => {
                        const cat = catOf(a.categoria);
                        const st = stageOf(a.stage);
                        const prio = PRIOS[a.prioridade] || PRIOS.baixa;
                        const totCheck = (a.idCheck || []).length;
                        const doCheck = totCheck ? a.idCheck.filter((c) => c.done).length : 0;
                        const overdue = isOverdue(a);
                        const dueSoon = isDueSoon(a);

                        return (
                          <tr key={a.id} className="row-click" onClick={() => openEditTask(a.id)}>
                            <td className="text-left">
                              <div className="flex flex-col items-start justify-center gap-1 text-left">
                                <div className="flex items-center gap-1.5 flex-wrap text-left">
                                  <span className="font-semibold text-xs text-[var(--ax-text-strong)]">{a.titulo}</span>
                                  {a.projeto && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-primary-soft)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                                      📁 {a.projeto}
                                    </span>
                                  )}
                                </div>
                                {a.descricao && (
                                  <div className="text-[11px] text-[var(--ax-text-subtle)] max-w-xs truncate text-left">
                                    {a.descricao}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="text-center">
                              <span
                                className="ax-badge ax-badge--soft ax-badge--pill inline-flex items-center justify-center mx-auto"
                                style={{ '--_b500': cat ? cat.cor : 'var(--ax-text-muted)' }}
                              >
                                <span className="ax-badge__dot" />
                                {cat ? cat.nome : 'Sem categoria'}
                              </span>
                            </td>
                            <td className="text-center">
                              <span className={`ax-badge ax-badge--soft ax-badge--${st.tone} ax-badge--pill inline-flex items-center justify-center mx-auto`}>
                                <span className="ax-badge__dot" />
                                {st.label}
                              </span>
                            </td>
                            <td className="text-center">
                              <div className="flex items-center justify-center gap-2 max-w-[130px] mx-auto">
                                <div className="ax-progress ax-progress--sm flex-1">
                                  <div className="ax-progress__track">
                                    <div className="ax-progress__fill" style={{ width: `${a.progress}%`, background: progColor(a.progress) }} />
                                  </div>
                                </div>
                                <span className="ax-num text-xs text-[var(--ax-text-muted)] w-8 text-right">{a.progress}%</span>
                              </div>
                            </td>
                            <td className="ax-num text-xs text-[var(--ax-text-muted)] text-center">
                              {doCheck}/{totCheck}
                            </td>
                            <td
                              className="ax-num text-xs font-semibold text-center"
                              style={{
                                color: overdue ? 'var(--ax-danger-500)' : dueSoon ? 'var(--ax-warning-500)' : 'inherit'
                              }}
                            >
                              <div className="flex items-center justify-center gap-1.5 flex-wrap">
                                <span>{fmtDate(a.dataVencimento)}</span>
                                {overdue && (
                                  <span className="ax-badge ax-badge--soft ax-badge--danger ax-badge--sm ax-badge--pill">
                                    Atrasada
                                  </span>
                                )}
                                {dueSoon && (
                                  <span className="ax-badge ax-badge--soft ax-badge--warning ax-badge--sm ax-badge--pill">
                                    48h
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="text-center">
                              <span
                                className="ax-badge ax-badge--soft ax-badge--pill inline-flex items-center justify-center mx-auto"
                                style={{ '--_b500': prio.color }}
                              >
                                {prio.label}
                              </span>
                            </td>
                            <td className="text-center">
                              <div className="flex justify-center" onClick={(e) => e.stopPropagation()}>
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
                      })
                    )}
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

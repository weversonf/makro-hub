import React, { useState, useEffect } from 'react';
import { useHub, STAGES, PRIOS, CANAIS, fmtDate, isEditorialActivity } from '../../context/HubContext';
import { storage, auth } from '../../firebase';
import { X, Trash2, ExternalLink, UploadCloud, Tag, Calendar, Send, Plus, Copy, Check, FolderKanban } from 'lucide-react';
import HrivoDatePicker from '../common/HrivoDatePicker';

export default function TaskModal() {
  const {
    taskModalOpen,
    editTaskId,
    taskModalInitialData,
    closeTaskModal,
    saveTask,
    deleteTask,
    categories,
    catOf,
    stageOf,
    getTask,
    showToast,
    projects,
    createProject,
    allProjectsList
  } = useHub();

  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [isProjeto, setIsProjeto] = useState(false);
  const [projeto, setProjeto] = useState('');
  const [isCreatingNewProject, setIsCreatingNewProject] = useState(false);
  const [stage, setStage] = useState('afazer');
  const [prioridade, setPrioridade] = useState('baixa');
  const [dataVencimento, setDataVencimento] = useState('');
  const [dataPostagem, setDataPostagem] = useState('');
  const [progress, setProgress] = useState(0);
  const [syncChecklist, setSyncChecklist] = useState(false);
  const [checklist, setChecklist] = useState([]);
  const [checkInput, setCheckInput] = useState('');
  const [canais, setCanais] = useState([]);
  const [imagens, setImagens] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [supportLinks, setSupportLinks] = useState([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!taskModalOpen) return;

    if (editTaskId) {
      const task = getTask(editTaskId);
      if (task) {
        setTitulo(task.titulo || '');
        setDescricao(task.descricao || '');
        setCategoria(task.categoria || '');
        setStage(task.stage || 'afazer');
        setPrioridade(task.prioridade || 'baixa');
        setDataVencimento(task.dataVencimento || '');
        setDataPostagem(task.dataPostagem || '');
        setProgress(task.progress || 0);
        setSyncChecklist(!!task.syncChecklist);
        setChecklist(task.idCheck ? JSON.parse(JSON.stringify(task.idCheck)) : []);
        setCanais(task.canais ? [...task.canais] : []);
        setImagens(task.imagens ? JSON.parse(JSON.stringify(task.imagens)) : []);
        setSupportLinks(task.supportLinks ? JSON.parse(JSON.stringify(task.supportLinks)) : []);
        setIsProjeto(Boolean(task.isProjeto || task.projeto));
        setProjeto(task.projeto || '');
        setIsCreatingNewProject(false);
      }
    } else {
      // Nova tarefa / publicação
      setTitulo('');
      setDescricao('');
      const defaultCat = taskModalInitialData?.categoria || (categories[0]?.id === 1 && categories.length > 1 ? categories[1].id : categories[0]?.id || '');
      setCategoria(defaultCat);
      setStage(taskModalInitialData?.stage || 'afazer');
      setPrioridade('baixa');
      setDataVencimento(taskModalInitialData?.dataVencimento || '');
      setDataPostagem(taskModalInitialData?.dataPostagem || '');
      setProgress(0);
      setSyncChecklist(false);
      setChecklist([]);
      setCanais([]);
      setImagens([]);
      setSupportLinks([]);
      setIsProjeto(Boolean(taskModalInitialData?.isProjeto || taskModalInitialData?.projeto));
      setProjeto(taskModalInitialData?.projeto || '');
      setIsCreatingNewProject(false);
    }
    setCheckInput('');
    setLinkUrl('');
    setLinkLabel('');
    setCopied(false);
    setIsSaving(false);
  }, [taskModalOpen, editTaskId, taskModalInitialData, categories, getTask]);

  if (!taskModalOpen) return null;

  const currentTaskMock = { categoria, canais, dataPostagem };
  const isEditorial = isEditorialActivity(currentTaskMock, categories);
  const currentCat = catOf(categoria);
  const currentStage = stageOf(stage);
  const currentPrio = PRIOS[prioridade] || PRIOS.baixa;

  // Atualização de Checklist & Progresso
  const updateChecklistProgress = (newChecklist) => {
    if (syncChecklist && newChecklist.length > 0) {
      const done = newChecklist.filter((c) => c.done).length;
      const pct = Math.round((done / newChecklist.length) * 100);
      setProgress(pct);
      if (pct >= 100) setStage('concluido');
      else if (stage === 'concluido') setStage('execucao');
    }
  };

  const handleToggleSync = (e) => {
    const active = e.target.checked;
    setSyncChecklist(active);
    if (active && checklist.length > 0) {
      const done = checklist.filter((c) => c.done).length;
      const pct = Math.round((done / checklist.length) * 100);
      setProgress(pct);
      if (pct >= 100) setStage('concluido');
    }
  };

  const handleManualProgress = (val) => {
    setProgress(val);
    setSyncChecklist(false);
    if (val >= 100) setStage('concluido');
    else if (stage === 'concluido') setStage('execucao');
  };

  const addChecklistItem = () => {
    const text = checkInput.trim();
    if (!text) return;
    const next = [...checklist, { text, done: false }];
    setChecklist(next);
    setCheckInput('');
    updateChecklistProgress(next);
  };

  const toggleCheck = (idx) => {
    const next = checklist.map((item, i) => (i === idx ? { ...item, done: !item.done } : item));
    setChecklist(next);
    updateChecklistProgress(next);
  };

  const removeCheck = (idx) => {
    const next = checklist.filter((_, i) => i !== idx);
    setChecklist(next);
    updateChecklistProgress(next);
  };

  const addLink = () => {
    let url = linkUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    setSupportLinks([...supportLinks, { url, label: linkLabel.trim() || url }]);
    setLinkUrl('');
    setLinkLabel('');
  };

  const removeLink = (idx) => {
    setSupportLinks(supportLinks.filter((_, i) => i !== idx));
  };

  const toggleCanal = (cid) => {
    setCanais((prev) => (prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid]));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const uid = auth.currentUser?.uid || 'local';

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        showToast(`Imagem ${file.name} muito grande (máx 5MB)`, 'error');
        return;
      }
      setUploading(true);
      const ref = storage.ref(`task-images/${uid}/${Date.now()}_${file.name}`);
      const uploadTask = ref.put(file);

      uploadTask.on(
        'state_changed',
        (snap) => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          setUploadProgress(pct);
        },
        (err) => {
          showToast(`Erro no upload: ${err.message}`, 'error');
          setUploading(false);
        },
        async () => {
          const url = await uploadTask.snapshot.ref.getDownloadURL();
          setImagens((prev) => [...prev, { name: file.name, url, path: ref.fullPath }]);
          setUploading(false);
          showToast(`Imagem enviada: ${file.name}`);
        }
      );
    });
  };

  const removeImage = (idx) => {
    setImagens(imagens.filter((_, i) => i !== idx));
  };

  const copyCaption = () => {
    if (!descricao) return;
    navigator.clipboard.writeText(descricao);
    setCopied(true);
    showToast('Legenda copiada com sucesso!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (isSaving) return;
    if (!titulo.trim()) {
      showToast('Informe um título para a tarefa.', 'error');
      return;
    }

    setIsSaving(true);

    const cleanProjeto = isProjeto && projeto ? projeto.trim() : '';

    const payload = {
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      categoria: Number(categoria) || categoria || null,
      isProjeto: Boolean(cleanProjeto),
      projeto: cleanProjeto || null,
      stage,
      prioridade,
      dataVencimento: dataVencimento || null,
      dataPostagem: dataPostagem || null,
      progress,
      syncChecklist,
      idCheck: checklist,
      canais,
      imagens,
      supportLinks
    };

    if (cleanProjeto) {
      createProject({ nome: cleanProjeto });
    }

    if (stage === 'concluido') payload.progress = 100;
    saveTask(payload);
  };

  const charCount = descricao.length;
  const wordCount = descricao.trim() ? descricao.trim().split(/\s+/).length : 0;
  const doneCount = checklist.filter((c) => c.done).length;

  return (
    <div className="ax-overlay open" onClick={closeTaskModal}>
      <div
        className="ax-modal"
        style={{
          maxWidth: '1100px',
          width: '100%',
          maxHeight: '94vh',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)'
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        {/* Cabeçalho do Modal (Clean e Objetivo) */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs"
              style={{
                background: currentCat ? `color-mix(in srgb, ${currentCat.cor} 18%, transparent)` : 'var(--color-primary-soft)',
                color: currentCat ? currentCat.cor : 'var(--color-primary)'
              }}
            >
              <Tag size={15} />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)] truncate max-w-[120px] sm:max-w-none">
              {currentCat ? currentCat.nome : isEditorial ? 'Editorial' : 'Geral'}
            </span>
            <span className="text-xs text-[var(--color-border-strong)]">·</span>
            <span className="text-xs font-mono text-[var(--color-muted)]">
              {editTaskId ? `#${editTaskId}` : 'Nova Demanda'}
            </span>
          </div>

          <button
            type="button"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-muted)] hover:text-white hover:bg-white/10 transition"
            onClick={closeTaskModal}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* CORPO EM 2 COLUNAS: ESQUERDA (Propriedades) | DIREITA (Conteúdo/Texto) */}
        <div className="flex-1 overflow-y-auto lg:overflow-hidden p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 bg-[var(--color-surface)]">
          {/* ============================================================ */}
          {/* COLUNA ESQUERDA: PROPRIEDADES PRINCIPAIS (col-span-5)        */}
          {/* ============================================================ */}
          <div className="lg:col-span-5 flex flex-col gap-4 overflow-y-visible lg:overflow-y-auto pr-0 lg:pr-1">
            {/* Lado a Lado: Status / Estágio e Prioridade (Ganho de espaço) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
              {/* Estágio / Status */}
              <div>
                <label className="text-xs font-bold text-[var(--color-heading)] block mb-1.5">
                  Status / Estágio
                </label>
                <div className="space-y-1">
                  <div className="grid grid-cols-3 gap-1">
                    {STAGES.slice(0, 3).map((s) => {
                      const active = stage === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          className={`text-[11px] py-1.5 px-1 rounded-lg font-medium border text-center transition truncate ${
                            active
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold'
                              : 'border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-subtle)]'
                          }`}
                          onClick={() => {
                            setStage(s.id);
                            if (s.id === 'concluido') setProgress(100);
                          }}
                          title={s.label}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {STAGES.slice(3, 5).map((s) => {
                      const active = stage === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          className={`text-[11px] py-1.5 px-1 rounded-lg font-medium border text-center transition truncate ${
                            active
                              ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold'
                              : 'border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-subtle)]'
                          }`}
                          onClick={() => {
                            setStage(s.id);
                            if (s.id === 'concluido') setProgress(100);
                          }}
                          title={s.label}
                        >
                          {s.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Prioridade */}
              <div>
                <label className="text-xs font-bold text-[var(--color-heading)] block mb-1.5">
                  Prioridade
                </label>
                <div className="grid grid-cols-2 gap-1">
                  {Object.keys(PRIOS).map((pk) => {
                    const active = prioridade === pk;
                    const p = PRIOS[pk];
                    return (
                      <button
                        key={pk}
                        type="button"
                        className={`text-[11px] py-1.5 px-1.5 rounded-lg font-medium border text-center transition truncate ${
                          active
                            ? 'border-current font-bold'
                            : 'border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-subtle)]'
                        }`}
                        style={{
                          color: active ? p.color : undefined,
                          backgroundColor: active ? `color-mix(in srgb, ${p.color} 15%, transparent)` : undefined
                        }}
                        onClick={() => setPrioridade(pk)}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Datas: Postagem e Vencimento */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[var(--color-heading)] block mb-1 flex items-center gap-1">
                  <Send size={12} className="text-[var(--color-primary)]" />
                  <span>{isEditorial ? 'Data do Post' : 'Data Início'}</span>
                </label>
                <HrivoDatePicker
                  value={dataPostagem}
                  onChange={setDataPostagem}
                  placeholder="dd/mm/aaaa"
                  icon={<Send size={12} className="text-[var(--color-primary)]" />}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--color-heading)] block mb-1 flex items-center gap-1">
                  <Calendar size={12} className="text-[var(--color-muted)]" />
                  <span>Prazo / Deadline</span>
                </label>
                <HrivoDatePicker
                  value={dataVencimento}
                  onChange={setDataVencimento}
                  placeholder="dd/mm/aaaa"
                  icon={<Calendar size={12} className="text-[var(--color-muted)]" />}
                />
              </div>
            </div>

            {/* Categoria */}
            <div>
              <label className="text-xs font-bold text-[var(--color-heading)] block mb-1">
                Categoria
              </label>
              <select
                className="w-full h-9 px-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-subtle)] text-xs text-[var(--color-heading)] focus:border-[var(--color-primary)] outline-none"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                <option value="">Sem categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Vínculo com Projeto */}
            <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-subtle)] space-y-2.5">
              <label className="flex items-center justify-between cursor-pointer select-none">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center font-bold text-xs">
                    <FolderKanban size={13} />
                  </span>
                  <div>
                    <span className="text-xs font-bold text-[var(--color-heading)] block">Vincular a um Projeto?</span>
                    <span className="text-[10px] text-[var(--color-muted)]">Esta tarefa faz parte de um projeto específico</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isProjeto}
                  onChange={(e) => {
                    setIsProjeto(e.target.checked);
                    if (!e.target.checked) setProjeto('');
                  }}
                  className="w-4 h-4 rounded text-[var(--color-primary)] accent-[var(--color-primary)] cursor-pointer"
                />
              </label>

              {/* Se marcar, aparece para selecionar ou criar */}
              {isProjeto && (
                <div className="pt-2 border-t border-[var(--color-border)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[var(--color-heading)]">Projeto</span>
                    {isCreatingNewProject ? (
                      <button
                        type="button"
                        className="text-[10px] text-[var(--color-primary)] hover:underline font-semibold"
                        onClick={() => setIsCreatingNewProject(false)}
                      >
                        Selecionar existente
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="text-[10px] text-[var(--color-primary)] hover:underline font-semibold flex items-center gap-1"
                        onClick={() => {
                          setIsCreatingNewProject(true);
                          setProjeto('');
                        }}
                      >
                        <Plus size={11} /> Novo Projeto
                      </button>
                    )}
                  </div>

                  {isCreatingNewProject ? (
                    <input
                      type="text"
                      value={projeto}
                      onChange={(e) => setProjeto(e.target.value)}
                      placeholder="Nome do novo projeto..."
                      className="w-full h-8 px-2.5 rounded-lg border border-[var(--color-primary)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] outline-none"
                      autoFocus
                    />
                  ) : (
                    <select
                      value={projeto}
                      onChange={(e) => {
                        if (e.target.value === '__NEW__') {
                          setIsCreatingNewProject(true);
                          setProjeto('');
                        } else {
                          setProjeto(e.target.value);
                        }
                      }}
                      className="w-full h-8 px-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)]"
                    >
                      <option value="">Selecione um projeto cadastrado...</option>
                      {allProjectsList.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                      <option value="__NEW__">+ Criar novo projeto...</option>
                    </select>
                  )}
                </div>
              )}
            </div>

            {/* Canais de Publicação (se editorial) */}
            {(isEditorial || canais.length > 0) && (
              <div>
                <label className="text-xs font-bold text-[var(--color-heading)] block mb-1.5">
                  Canais de Divulgação
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CANAIS.map((c) => {
                    const on = canais.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCanal(c.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-all"
                        style={{
                          background: on ? c.color : 'transparent',
                          borderColor: on ? c.color : 'var(--color-border)',
                          color: on ? '#FFFFFF' : c.color
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {c.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Progresso & Checklist Rápido */}
            <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-subtle)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[var(--color-heading)]">
                  Checklist ({doneCount}/{checklist.length})
                </span>
                <span className="text-xs font-mono font-bold text-[var(--color-primary)]">
                  {progress}%
                </span>
              </div>

              {/* Barra de Progresso */}
              <div className="w-full h-1.5 rounded-full bg-[var(--color-surface)] overflow-hidden mb-2.5">
                <div
                  className="h-full rounded-full bg-[var(--color-primary)] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Lista dos itens do checklist */}
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {checklist.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs p-1 rounded hover:bg-[var(--color-surface)] transition"
                  >
                    <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => toggleCheck(idx)}
                        className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-0"
                      />
                      <span className={`truncate ${item.done ? 'line-through text-[var(--color-muted)]' : 'text-[var(--color-heading)]'}`}>
                        {item.text}
                      </span>
                    </label>
                    <button
                      type="button"
                      className="text-[var(--color-muted)] hover:text-[var(--color-danger)] p-0.5 ml-1"
                      onClick={() => removeCheck(idx)}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Adicionar item */}
              <div className="flex gap-1.5 mt-2">
                <input
                  className="flex-1 h-7 px-2 text-xs rounded border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-heading)] outline-none"
                  placeholder="Novo item..."
                  value={checkInput}
                  onChange={(e) => setCheckInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addChecklistItem();
                    }
                  }}
                />
                <button
                  type="button"
                  className="h-7 px-2 rounded bg-[var(--color-primary)] text-white text-xs font-semibold"
                  onClick={addChecklistItem}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Imagens Anexadas */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[var(--color-heading)]">
                  Mídias / Imagens ({imagens.length})
                </label>
                <label className="text-[11px] font-semibold text-[var(--color-primary)] hover:underline cursor-pointer flex items-center gap-1">
                  <UploadCloud size={13} />
                  <span>{uploading ? `${uploadProgress}%` : '+ Anexar'}</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>

              {imagens.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {imagens.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-[var(--color-border)] group">
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        onClick={() => removeImage(i)}
                      >
                        <X size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* COLUNA DIREITA: TÍTULO & CONTEÚDO / LEGENDA (col-span-7)     */}
          {/* ============================================================ */}
          <div className="lg:col-span-7 flex flex-col gap-3 h-full border-t lg:border-t-0 lg:border-l border-[var(--color-border)] pt-5 lg:pt-0 lg:pl-6 overflow-y-visible lg:overflow-y-auto">
            {/* Título da Tarefa / Headline Principal */}
            <div>
              <label className="text-xs font-bold text-[var(--color-heading)] block mb-1">
                {isEditorial ? 'Título do Post / Tema' : 'Título da Tarefa'}
              </label>
              <input
                className="w-full text-base font-bold text-[var(--color-heading)] px-3.5 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-subtle)] focus:border-[var(--color-primary)] outline-none transition"
                placeholder="Ex.: A verdadeira força está na capacidade de atender a qualquer desafio..."
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                autoFocus
              />
            </div>

            {/* Caixa Ampla de Conteúdo / Legenda / Descrição */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[var(--color-heading)]">
                  {isEditorial ? 'Conteúdo / Legenda da Publicação' : 'Descrição / Detalhes'}
                </label>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-[var(--color-muted)] font-mono">
                    {charCount} carac. · {wordCount} palavras
                  </span>
                  {descricao && (
                    <button
                      type="button"
                      className="text-xs text-[var(--color-primary)] hover:underline font-semibold flex items-center gap-1"
                      onClick={copyCaption}
                    >
                      {copied ? <Check size={13} className="text-[var(--color-success)]" /> : <Copy size={13} />}
                      <span>{copied ? 'Copiado!' : 'Copiar Texto'}</span>
                    </button>
                  )}
                </div>
              </div>

              <textarea
                className="flex-1 w-full min-h-[300px] p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-subtle)] text-sm leading-relaxed text-[var(--color-heading)] focus:border-[var(--color-primary)] outline-none resize-none font-sans"
                placeholder={isEditorial ? 'Escreva a copy completa, hashtags e detalhes da publicação…' : 'Detalhe os requisitos, observações e briefing desta entrega…'}
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>

            {/* Links de Apoio & Referências */}
            <div className="pt-2 border-t border-[var(--color-border-subtle)]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-[var(--color-heading)]">
                  Links de Apoio ({supportLinks.length})
                </span>
              </div>

              {/* Input rápido de link */}
              <div className="flex gap-2 mb-2">
                <input
                  className="flex-1 h-7 px-2.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-subtle)] text-[var(--color-heading)] outline-none"
                  placeholder="Rótulo (ex: Figma, Drive)"
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                />
                <input
                  className="flex-2 h-7 px-2.5 text-xs rounded-lg border border-[var(--color-border)] bg-[var(--color-subtle)] text-[var(--color-heading)] outline-none"
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
                <button
                  type="button"
                  className="h-7 px-2.5 rounded-lg bg-[var(--color-subtle)] border border-[var(--color-border)] text-xs font-semibold hover:bg-[var(--color-border)] transition"
                  onClick={addLink}
                >
                  <Plus size={13} />
                </button>
              </div>

              {/* Pílulas de links */}
              {supportLinks.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                  {supportLinks.map((l, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[var(--color-subtle)] border border-[var(--color-border)] text-xs text-[var(--color-heading)]"
                    >
                      <ExternalLink size={12} className="text-[var(--color-primary)]" />
                      <a href={l.url} target="_blank" rel="noopener noreferrer" className="hover:underline font-medium">
                        {l.label || l.url}
                      </a>
                      <button type="button" className="text-[var(--color-muted)] hover:text-[var(--color-danger)] ml-0.5" onClick={() => removeLink(i)}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RODAPÉ FIXO DO MODAL */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] sticky bottom-0 z-20">
          {editTaskId ? (
            <button
              type="button"
              className="text-xs text-[var(--color-danger)] hover:underline flex items-center gap-1 font-semibold"
              onClick={() => deleteTask(editTaskId)}
            >
              <Trash2 size={15} />
              <span className="hidden sm:inline">Excluir Tarefa</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="hr-btn hr-btn--secondary text-xs h-9 px-4"
              onClick={closeTaskModal}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="hr-btn hr-btn--primary text-xs h-9 px-5 font-bold shadow-md flex items-center gap-2"
              onClick={handleSubmit}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                  <span>Salvando...</span>
                </>
              ) : (
                'Salvar Alterações'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

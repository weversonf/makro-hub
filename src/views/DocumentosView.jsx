import React, { useState, useEffect, useRef } from 'react';
import { useHub } from '../context/HubContext';
import firebase, { storage } from '../firebase';

export const DEFAULT_DOCS = [
  {
    titulo: 'Logotipo Oficial Makro (Horizontal Colorido)',
    categoria: 'logos',
    tipo: 'PNG / Alta Resolução',
    tamanho: '1.2 MB',
    data: '2026-08-10',
    url: 'https://makroengenharia.com.br/wp-content/uploads/2023/03/logo-1.png',
    icone: 'ph-image'
  },
  {
    titulo: 'Ícone Estrela Makro Vermelha (Símbolo Oficial)',
    categoria: 'logos',
    tipo: 'PNG Transparente',
    tamanho: '450 KB',
    data: '2026-08-15',
    url: 'https://makroengenharia.com.br/wp-content/uploads/2026/08/ICONE-ESTRELA-LOGO-MAKRO-VERMELHA.png',
    icone: 'ph-star'
  },
  {
    titulo: 'Manual de Identidade Visual Makro 2026',
    categoria: 'manuais',
    tipo: 'PDF / Guia Completo',
    tamanho: '8.4 MB',
    data: '2026-05-20',
    url: 'https://makroengenharia.com.br/wp-content/uploads/2023/03/logo-1.png',
    icone: 'ph-file-pdf'
  },
  {
    titulo: 'Apresentação Institucional Corporativa Makro Engenharia',
    categoria: 'apresentacoes',
    tipo: 'PPTX & PDF',
    tamanho: '14.2 MB',
    data: '2026-07-01',
    url: 'https://makroengenharia.com.br/wp-content/uploads/2023/03/logo-1.png',
    icone: 'ph-presentation-chart'
  },
  {
    titulo: 'Catálogo Oficial de Guindastes e Linhas de Eixo',
    categoria: 'apresentacoes',
    tipo: 'PDF Comercial',
    tamanho: '22.0 MB',
    data: '2026-06-15',
    url: 'https://makroengenharia.com.br/wp-content/uploads/2023/03/logo-1.png',
    icone: 'ph-truck'
  },
  {
    titulo: 'Template de Assinatura de E-mail Makro',
    categoria: 'templates',
    tipo: 'HTML / Imagens',
    tamanho: '320 KB',
    data: '2026-01-10',
    url: 'https://makroengenharia.com.br/wp-content/uploads/2023/03/logo-1.png',
    icone: 'ph-envelope-simple'
  },
  {
    titulo: 'Modelos de Post & Carrossel para LinkedIn',
    categoria: 'templates',
    tipo: 'Figma & Canva Pack',
    tamanho: 'Link Cloud',
    data: '2026-08-01',
    url: 'https://www.linkedin.com/company/makro-engenharia/',
    icone: 'ph-paint-brush'
  }
];

const CATEGORIAS = [
  { id: 'all', label: 'Todos os Recursos' },
  { id: 'logos', label: 'Logos & Marca' },
  { id: 'manuais', label: 'Manuais & Diretrizes' },
  { id: 'apresentacoes', label: 'Apresentações & Catálogos' },
  { id: 'templates', label: 'Templates & Modelos' },
  { id: 'outros', label: 'Outros Arquivos' }
];

const ICON_OPTIONS = [
  { id: 'ph-image', label: 'Imagem / Logo' },
  { id: 'ph-star', label: 'Estrela / Símbolo' },
  { id: 'ph-file-pdf', label: 'PDF / Manual' },
  { id: 'ph-presentation-chart', label: 'Slides / Apresentação' },
  { id: 'ph-truck', label: 'Maquinário / Frota' },
  { id: 'ph-envelope-simple', label: 'E-mail / Assinatura' },
  { id: 'ph-paint-brush', label: 'Design / Modelo' },
  { id: 'ph-file-archive', label: 'Arquivo ZIP / Pacote' },
  { id: 'ph-video', label: 'Vídeo Institucional' },
  { id: 'ph-files', label: 'Documento Geral' }
];

export default function DocumentosView() {
  const { isAdmin, isMaster, getSharedCollection, showToast, showConfirm } = useHub();

  // Regra de Permissão: Apenas ADM ou ADM Master podem incluir, editar ou excluir
  const canManageDocs = Boolean(isMaster || isAdmin);

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Estados do Modal de Criação / Edição
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const initialFormState = {
    titulo: '',
    categoria: 'logos',
    tipo: 'PNG / Alta Resolução',
    tamanho: '1.0 MB',
    url: '',
    icone: 'ph-image',
    descricao: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  // Snapshot em tempo real do Firestore
  useEffect(() => {
    if (!getSharedCollection) return;
    const colRef = getSharedCollection('documents');

    const unsubscribe = colRef.onSnapshot(
      (snapshot) => {
        const list = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });

        // Se o banco estiver vazio e for um administrador, faz o seed dos arquivos oficiais
        if (list.length === 0 && canManageDocs) {
          const batch = firebase.firestore().batch();
          DEFAULT_DOCS.forEach((d) => {
            const newDocRef = colRef.doc();
            batch.set(newDocRef, {
              ...d,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
          });
          batch.commit().catch((err) => console.warn('[Seed Docs Error]', err));
        } else if (list.length > 0) {
          // Ordena por data decrescente
          list.sort((a, b) => (b.data || '').localeCompare(a.data || ''));
          setDocs(list);
        } else {
          setDocs(DEFAULT_DOCS);
        }
        setLoading(false);
      },
      (error) => {
        console.warn('[Firestore] Error snapshot documents:', error);
        setDocs(DEFAULT_DOCS);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [getSharedCollection, canManageDocs]);

  // Filtros
  const filteredDocs = docs.filter((doc) => {
    const matchesCat = activeCategory === 'all' || doc.categoria === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      doc.titulo?.toLowerCase().includes(q) ||
      doc.tipo?.toLowerCase().includes(q) ||
      doc.categoria?.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const handleCopy = (url, name) => {
    if (url && url !== '#') {
      navigator.clipboard.writeText(url);
      showToast(`Link de "${name}" copiado para a área de transferência!`);
    } else {
      showToast(`Link indisponível no momento.`, 'info');
    }
  };

  // Abertura de Modal para Inclusão
  const handleOpenCreateModal = () => {
    if (!canManageDocs) {
      showToast('Apenas administradores e o ADM Master podem incluir novos arquivos.', 'error');
      return;
    }
    setEditingDocId(null);
    setFormData(initialFormState);
    setModalOpen(true);
  };

  // Abertura de Modal para Edição
  const handleOpenEditModal = (doc) => {
    if (!canManageDocs) {
      showToast('Apenas administradores e o ADM Master podem editar arquivos.', 'error');
      return;
    }
    setEditingDocId(doc.id);
    setFormData({
      titulo: doc.titulo || '',
      categoria: doc.categoria || 'logos',
      tipo: doc.tipo || 'Arquivo',
      tamanho: doc.tamanho || '1.0 MB',
      url: doc.url || '',
      icone: doc.icone || 'ph-image',
      descricao: doc.descricao || ''
    });
    setModalOpen(true);
  };

  // Upload direto para o Firebase Storage
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!canManageDocs) {
      showToast('Permissão negada para upload de arquivos.', 'error');
      return;
    }

    // Limite de 60 MB
    if (file.size > 60 * 1024 * 1024) {
      showToast('O arquivo excede o limite máximo permitido de 60 MB.', 'error');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `documents/${Date.now()}_${cleanName}`;
      const uploadTask = storage.ref(storagePath).put(file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          setUploadProgress(progress);
        },
        (error) => {
          console.error('[Storage Upload Error]', error);
          showToast('Erro ao enviar arquivo para a nuvem.', 'error');
          setUploading(false);
        },
        async () => {
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
          const ext = file.name.split('.').pop().toUpperCase();
          const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
          const sizeStr = file.size < 1024 * 1024 ? `${Math.round(file.size / 1024)} KB` : `${sizeMB} MB`;

          let defaultIcon = 'ph-file';
          if (['PNG', 'JPG', 'JPEG', 'SVG', 'WEBP'].includes(ext)) defaultIcon = 'ph-image';
          else if (['PDF'].includes(ext)) defaultIcon = 'ph-file-pdf';
          else if (['PPT', 'PPTX', 'KEY'].includes(ext)) defaultIcon = 'ph-presentation-chart';
          else if (['ZIP', 'RAR', '7Z'].includes(ext)) defaultIcon = 'ph-file-archive';

          setFormData((prev) => ({
            ...prev,
            url: downloadURL,
            tamanho: sizeStr,
            tipo: `${ext} / Arquivo`,
            icone: prev.icone === 'ph-image' ? defaultIcon : prev.icone,
            titulo: prev.titulo || file.name.replace(/\.[^/.]+$/, '')
          }));

          setUploading(false);
          showToast('Upload concluído com sucesso!');
        }
      );
    } catch (err) {
      console.error('[Upload Exception]', err);
      showToast('Falha no upload do arquivo.', 'error');
      setUploading(false);
    }
  };

  // Salvar Documento (Criar ou Atualizar)
  const handleSubmitDoc = async (e) => {
    e.preventDefault();

    if (!canManageDocs) {
      showToast('Apenas administradores e o ADM Master têm permissão para salvar arquivos.', 'error');
      return;
    }

    if (!formData.titulo.trim()) {
      showToast('Informe o título do arquivo/recurso.', 'error');
      return;
    }

    if (!formData.url.trim()) {
      showToast('Informe o link do arquivo ou faça o upload.', 'error');
      return;
    }

    try {
      const colRef = getSharedCollection('documents');
      const today = new Date().toISOString().split('T')[0];

      const payload = {
        titulo: formData.titulo.trim(),
        categoria: formData.categoria || 'logos',
        tipo: formData.tipo.trim() || 'Recurso Oficial',
        tamanho: formData.tamanho.trim() || 'Link Nuvem',
        data: today,
        url: formData.url.trim(),
        icone: formData.icone || 'ph-file',
        descricao: formData.descricao.trim(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (editingDocId) {
        await colRef.doc(editingDocId).set(payload, { merge: true });
        showToast('Documento atualizado com sucesso!');
      } else {
        payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await colRef.add(payload);
        showToast('Novo documento adicionado ao acervo!');
      }

      setModalOpen(false);
    } catch (err) {
      console.error('[Submit Doc Error]', err);
      showToast('Erro ao salvar o documento.', 'error');
    }
  };

  // Excluir Documento
  const handleDeleteDoc = (docItem) => {
    if (!canManageDocs) {
      showToast('Apenas administradores e o ADM Master podem excluir arquivos.', 'error');
      return;
    }

    showConfirm({
      title: 'Excluir Arquivo do Acervo',
      message: `Tem certeza que deseja excluir "${docItem.titulo}"? Esta ação removerá o arquivo para toda a equipe.`,
      confirmText: 'Excluir Arquivo',
      confirmTone: 'danger',
      onConfirm: async () => {
        try {
          const colRef = getSharedCollection('documents');
          await colRef.doc(docItem.id).delete();
          showToast('Arquivo excluído com sucesso.');
        } catch (err) {
          console.error('[Delete Doc Error]', err);
          showToast('Erro ao excluir o documento.', 'error');
        }
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Banner / Cabeçalho da Seção */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--color-border)]">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-[var(--color-heading)]">Documentos & Mídia Kit</h2>
            {!canManageDocs ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <i className="ph ph-download-simple" />
                Consulta & Download
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <i className="ph ph-shield-check" />
                Gestão Total (ADM)
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--color-muted)] mt-1 max-w-2xl">
            Central oficial de manuais, logotipos em alta definição, apresentações comerciais e modelos de marca Makro Engenharia.
          </p>
        </div>

        {/* Ações do Topo */}
        <div className="flex items-center gap-3">
          {/* Busca Rápida */}
          <div className="relative flex items-center">
            <i className="ph ph-magnifying-glass absolute left-3 text-[var(--color-muted)] text-sm" />
            <input
              type="text"
              placeholder="Buscar no acervo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 pr-3 text-xs rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-heading)] placeholder:text-[var(--color-muted)] outline-none focus:border-[var(--color-primary)] w-44 sm:w-56 transition"
            />
          </div>

          {/* Botão de Adição: Apenas para ADM e ADM Master */}
          {canManageDocs && (
            <button
              type="button"
              className="hr-btn hr-btn--primary h-9 px-3.5 text-xs flex items-center gap-2 font-semibold shadow-sm"
              onClick={handleOpenCreateModal}
            >
              <i className="ph ph-plus-circle text-base" />
              <span>Novo Documento</span>
            </button>
          )}
        </div>
      </div>

      {/* Categorias / Filtros Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIAS.map((cat) => {
          const count =
            cat.id === 'all'
              ? docs.length
              : docs.filter((d) => d.categoria === cat.id).length;

          return (
            <button
              key={cat.id}
              type="button"
              className={`hr-btn text-xs h-8 px-3 rounded-xl flex items-center gap-2 transition flex-shrink-0 ${
                activeCategory === cat.id ? 'hr-btn--primary font-semibold' : 'hr-btn--secondary'
              }`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  activeCategory === cat.id
                    ? 'bg-white/20 text-white'
                    : 'bg-[var(--color-subtle)] text-[var(--color-muted)]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid de Documentos */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--color-muted)] gap-3">
          <i className="ph ph-spinner-gap animate-spin text-3xl text-[var(--color-primary)]" />
          <span className="text-xs">Carregando acervo de documentos…</span>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-[var(--color-border)] rounded-2xl p-8">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-subtle)] flex items-center justify-center text-[var(--color-muted)] mb-3">
            <i className="ph ph-folder-notch-open text-2xl" />
          </div>
          <h3 className="text-sm font-bold text-[var(--color-heading)]">Nenhum documento encontrado</h3>
          <p className="text-xs text-[var(--color-muted)] mt-1 max-w-sm">
            {searchQuery
              ? 'Tente ajustar sua busca ou selecionar outra categoria.'
              : 'Nenhum documento disponível nesta categoria no momento.'}
          </p>
          {canManageDocs && (
            <button
              type="button"
              className="hr-btn hr-btn--primary text-xs h-8 px-4 mt-4 flex items-center gap-2"
              onClick={handleOpenCreateModal}
            >
              <i className="ph ph-plus" />
              <span>Incluir Primeiro Documento</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="hr-card flex flex-col justify-between hover:border-[var(--color-primary-soft)] transition group relative"
            >
              <div>
                {/* Cabeçalho do Card */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center flex-shrink-0 shadow-xs">
                    <i className={`ph ${doc.icone || 'ph-file'} text-2xl`} />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-subtle)] text-[var(--color-muted)] border border-[var(--color-border)]">
                      {doc.tipo || 'Arquivo'}
                    </span>

                    {/* Ações de Edição e Exclusão (Exclusivo ADM / ADM Master) */}
                    {canManageDocs && (
                      <div className="flex items-center gap-1 ml-1 opacity-80 group-hover:opacity-100 transition">
                        <button
                          type="button"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-subtle)] transition"
                          title="Editar Documento"
                          onClick={() => handleOpenEditModal(doc)}
                        >
                          <i className="ph ph-pencil-simple text-sm" />
                        </button>
                        <button
                          type="button"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:text-red-500 hover:bg-red-500/10 transition"
                          title="Excluir Documento"
                          onClick={() => handleDeleteDoc(doc)}
                        >
                          <i className="ph ph-trash text-sm" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Conteúdo */}
                <h3 className="text-sm font-bold text-[var(--color-heading)] line-clamp-2 leading-snug mb-1.5" title={doc.titulo}>
                  {doc.titulo}
                </h3>
                {doc.descricao && (
                  <p className="text-xs text-[var(--color-muted)] line-clamp-2 mb-2">
                    {doc.descricao}
                  </p>
                )}
                <p className="text-[11px] text-[var(--color-muted)] flex items-center gap-2 mt-auto">
                  <span>Tamanho: <strong className="font-mono text-[var(--color-heading)]">{doc.tamanho || '—'}</strong></span>
                  <span>·</span>
                  <span>Atualizado: {doc.data || '—'}</span>
                </p>
              </div>

              {/* Ações no Rodapé do Card (Disponíveis para Todos os Usuários) */}
              <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="hr-btn hr-btn--secondary text-xs h-8 flex-1 flex items-center justify-center gap-1.5"
                  onClick={() => handleCopy(doc.url, doc.titulo)}
                  title="Copiar Link Direto"
                >
                  <i className="ph ph-copy text-sm" />
                  <span>Copiar Link</span>
                </button>

                <a
                  href={doc.url && doc.url !== '#' ? doc.url : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={doc.titulo}
                  className={`hr-btn hr-btn--primary text-xs h-8 px-3.5 flex items-center justify-center gap-1.5 ${
                    !doc.url || doc.url === '#' ? 'opacity-50 pointer-events-none' : ''
                  }`}
                  title="Baixar / Abrir Arquivo"
                >
                  <i className="ph ph-download-simple text-sm" />
                  <span>Baixar</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Inclusão e Edição (Apenas Acessível por ADM / Master) */}
      {modalOpen && canManageDocs && (
        <div className="ax-overlay open" onClick={() => !uploading && setModalOpen(false)}>
          <div
            className="ax-modal ax-modal--md max-w-lg w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-6 relative"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-border)] mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                  {editingDocId ? 'Editar Documento' : 'Novo Recurso'}
                </span>
                <h3 className="text-base font-bold text-[var(--color-heading)] mt-0.5">
                  {editingDocId ? 'Atualizar Documento Oficial' : 'Adicionar ao Mídia Kit Makro'}
                </h3>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-subtle)] transition"
                onClick={() => !uploading && setModalOpen(false)}
                disabled={uploading}
              >
                <i className="ph ph-x text-lg" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitDoc} className="flex flex-col gap-4">
              {/* Título */}
              <div>
                <label className="block text-xs font-bold text-[var(--color-heading)] mb-1">
                  Título do Documento ou Recurso *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Manual de Aplicação da Marca 2026"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] transition"
                />
              </div>

              {/* Categoria & Formato */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-heading)] mb-1">
                    Categoria
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] transition"
                  >
                    <option value="logos">Logos & Marca</option>
                    <option value="manuais">Manuais & Diretrizes</option>
                    <option value="apresentacoes">Apresentações & Catálogos</option>
                    <option value="templates">Templates & Modelos</option>
                    <option value="outros">Outros Arquivos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-heading)] mb-1">
                    Formato / Tipo
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: PDF, PNG, PPTX, Figma"
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] transition"
                  />
                </div>
              </div>

              {/* Upload ou Link de Arquivo */}
              <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-subtle)] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--color-heading)] flex items-center gap-1.5">
                    <i className="ph ph-cloud-arrow-up text-sm text-[var(--color-primary)]" />
                    Arquivo ou Link Oficial
                  </label>
                  {uploading && (
                    <span className="text-[11px] font-bold text-[var(--color-primary)] animate-pulse">
                      Enviando… {uploadProgress}%
                    </span>
                  )}
                </div>

                {/* Upload Button */}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <button
                    type="button"
                    className="hr-btn hr-btn--secondary text-xs h-8 px-3 flex items-center gap-1.5 font-medium"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <i className="ph ph-upload-simple" />
                    <span>Upload do Computador</span>
                  </button>
                  <span className="text-[11px] text-[var(--color-muted)]">ou insira link externo abaixo</span>
                </div>

                {/* Input de URL */}
                <div>
                  <input
                    type="url"
                    required
                    placeholder="https://drive.google.com/... ou link do arquivo"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] transition font-mono"
                  />
                </div>
              </div>

              {/* Tamanho & Ícone Representativo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-heading)] mb-1">
                    Tamanho Estimado
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 2.5 MB, Link Nuvem"
                    value={formData.tamanho}
                    onChange={(e) => setFormData({ ...formData, tamanho: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-heading)] mb-1">
                    Ícone Representativo
                  </label>
                  <select
                    value={formData.icone}
                    onChange={(e) => setFormData({ ...formData, icone: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] transition"
                  >
                    {ICON_OPTIONS.map((ico) => (
                      <option key={ico.id} value={ico.id}>
                        {ico.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Observações / Descrição */}
              <div>
                <label className="block text-xs font-bold text-[var(--color-heading)] mb-1">
                  Descrição ou Orientações de Uso (Opcional)
                </label>
                <textarea
                  rows="2"
                  placeholder="Instruções para a equipe de marketing ou parceiros externos…"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] transition resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)] mt-2">
                <button
                  type="button"
                  className="hr-btn hr-btn--secondary text-xs h-9 px-4"
                  onClick={() => setModalOpen(false)}
                  disabled={uploading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="hr-btn hr-btn--primary text-xs h-9 px-4 flex items-center gap-1.5 font-semibold"
                  disabled={uploading}
                >
                  <i className="ph ph-floppy-disk text-base" />
                  <span>{editingDocId ? 'Atualizar Documento' : 'Salvar no Acervo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

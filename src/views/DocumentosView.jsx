import React, { useState } from 'react';
import { useHub } from '../context/HubContext';

export default function DocumentosView() {
  const { showToast } = useHub();

  const [activeCategory, setActiveCategory] = useState('all');

  const docs = [
    {
      id: 1,
      titulo: 'Logotipo Oficial Makro (Horizontal Colorido)',
      categoria: 'logos',
      tipo: 'PNG / Alta Resolução',
      tamanho: '1.2 MB',
      data: '2026-08-10',
      url: 'https://makroengenharia.com.br/wp-content/uploads/2023/03/logo-1.png',
      icone: 'ph-image'
    },
    {
      id: 2,
      titulo: 'Ícone Estrela Makro Vermelha (Símbolo Oficial)',
      categoria: 'logos',
      tipo: 'PNG Transparente',
      tamanho: '450 KB',
      data: '2026-08-15',
      url: 'https://makroengenharia.com.br/wp-content/uploads/2026/08/ICONE-ESTRELA-LOGO-MAKRO-VERMELHA.png',
      icone: 'ph-star'
    },
    {
      id: 3,
      titulo: 'Manual de Identidade Visual Makro 2026',
      categoria: 'manuais',
      tipo: 'PDF / Guia Completo',
      tamanho: '8.4 MB',
      data: '2026-05-20',
      url: '#',
      icone: 'ph-file-pdf'
    },
    {
      id: 4,
      titulo: 'Apresentação Institucional Corporativa Makro Engenharia',
      categoria: 'apresentacoes',
      tipo: 'PPTX & PDF',
      tamanho: '14.2 MB',
      data: '2026-07-01',
      url: '#',
      icone: 'ph-presentation-chart'
    },
    {
      id: 5,
      titulo: 'Catálogo Oficial de Guindastes e Linhas de Eixo',
      categoria: 'apresentacoes',
      tipo: 'PDF Comercial',
      tamanho: '22.0 MB',
      data: '2026-06-15',
      url: '#',
      icone: 'ph-truck'
    },
    {
      id: 6,
      titulo: 'Template de Assinatura de E-mail Makro',
      categoria: 'templates',
      tipo: 'HTML / Imagens',
      tamanho: '320 KB',
      data: '2026-01-10',
      url: '#',
      icone: 'ph-envelope-simple'
    },
    {
      id: 7,
      titulo: 'Modelos de Post & Carrossel para LinkedIn',
      categoria: 'templates',
      tipo: 'Figma & Canva Pack',
      tamanho: 'Link Cloud',
      data: '2026-08-01',
      url: '#',
      icone: 'ph-paint-brush'
    }
  ];

  const filteredDocs = activeCategory === 'all' ? docs : docs.filter((d) => d.categoria === activeCategory);

  const handleCopy = (url, name) => {
    if (url && url !== '#') {
      navigator.clipboard.writeText(url);
      showToast(`Link de "${name}" copiado!`);
    } else {
      showToast(`Documento "${name}" pronto para download.`);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--color-border)]">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-heading)]">Documentos & Mídia Kit</h2>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            Logos em alta resolução, manuais de marca, apresentações comerciais e modelos oficiais da Makro
          </p>
        </div>

        {/* Categorias de filtro */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'all', label: 'Todos' },
            { id: 'logos', label: 'Logos & Marca' },
            { id: 'manuais', label: 'Manuais' },
            { id: 'apresentacoes', label: 'Apresentações' },
            { id: 'templates', label: 'Templates' }
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`hr-btn text-xs h-8 px-3 ${activeCategory === cat.id ? 'hr-btn--primary' : 'hr-btn--secondary'}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Arquivos e Recursos */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredDocs.map((doc) => (
          <div key={doc.id} className="hr-card flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
                  <i className={`ph ${doc.icone} text-2xl`} />
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-subtle)] text-[var(--color-muted)] border border-[var(--color-border)]">
                  {doc.tipo}
                </span>
              </div>

              <h3 className="text-sm font-bold text-[var(--color-heading)] mb-1">
                {doc.titulo}
              </h3>
              <p className="text-xs text-[var(--color-muted)]">
                Tamanho: <span className="font-mono text-[var(--color-heading)]">{doc.tamanho}</span> · Atualizado: {doc.data}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)] flex items-center justify-between gap-2">
              <button
                type="button"
                className="hr-btn hr-btn--secondary text-xs h-8 flex-1"
                onClick={() => handleCopy(doc.url, doc.titulo)}
              >
                <i className="ph ph-copy" />
                <span>Copiar Link</span>
              </button>
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hr-btn hr-btn--primary text-xs h-8 px-3"
                title="Abrir / Download"
              >
                <i className="ph ph-arrow-square-out text-base" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

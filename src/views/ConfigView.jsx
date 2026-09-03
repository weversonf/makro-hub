import React, { useRef, useState } from 'react';
import { useHub } from '../context/HubContext';

const ACCENTS = [
  { id: 'blue',      color: '#1279FF', label: 'Azul Hrivo' },
  { id: 'crimson',   color: '#ED1C24', label: 'Vermelho Makro' },
  { id: 'emerald',   color: '#10B981', label: 'Esmeralda' },
  { id: 'purple',    color: '#8B5CF6', label: 'Roxo' },
  { id: 'amber',     color: '#F59E0B', label: 'Âmbar' },
  { id: 'cyan',      color: '#06B6D4', label: 'Ciano' }
];

export default function ConfigView() {
  const {
    theme,
    setTheme,
    accentColor,
    setAccentColor,
    exportCSV,
    exportBackup,
    importBackup,
    categories,
    activities,
    openNewCategory,
    openEditCategory
  } = useHub();

  const [activeTab, setActiveTab] = useState('categorias');
  const fileInputRef = useRef(null);

  const countCat = (id) => activities.filter((a) => a.categoria === id).length;

  const initials = (name) => {
    if (!name) return '?';
    const p = name.trim().split(/\s+/);
    if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result);
        importBackup(json);
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header com Abas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--color-border)]">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-heading)]">Configurações do Sistema</h2>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            Gerencie categorias de marketing, preferências visuais e dados do Hub Makro
          </p>
        </div>

        {/* Abas */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className={`hr-btn text-xs h-8 px-3 ${activeTab === 'categorias' ? 'hr-btn--primary' : 'hr-btn--secondary'}`}
            onClick={() => setActiveTab('categorias')}
          >
            <i className="ph ph-folder-notch-open text-base" />
            <span>Categorias ({categories.length})</span>
          </button>

          <button
            type="button"
            className={`hr-btn text-xs h-8 px-3 ${activeTab === 'aparencia' ? 'hr-btn--primary' : 'hr-btn--secondary'}`}
            onClick={() => setActiveTab('aparencia')}
          >
            <i className="ph ph-palette text-base" />
            <span>Aparência</span>
          </button>

          <button
            type="button"
            className={`hr-btn text-xs h-8 px-3 ${activeTab === 'dados' ? 'hr-btn--primary' : 'hr-btn--secondary'}`}
            onClick={() => setActiveTab('dados')}
          >
            <i className="ph ph-database text-base" />
            <span>Dados & Backup</span>
          </button>
        </div>
      </div>

      {/* CONTEÚDO DA ABA: CATEGORIAS */}
      {activeTab === 'categorias' && (
        <div className="hr-card flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--color-border-subtle)]">
            <div>
              <h3 className="text-base font-bold text-[var(--color-heading)]">
                Categorias de Marketing
              </h3>
              <p className="text-xs text-[var(--color-muted)] mt-0.5">
                Organize suas entregas por áreas temáticas, mídias e projetos
              </p>
            </div>

            <button
              type="button"
              className="hr-btn hr-btn--primary text-xs h-8 px-3"
              onClick={openNewCategory}
            >
              <i className="ph ph-plus text-base" />
              <span>Nova Categoria</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="hr-table">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Cor / Identificador</th>
                  <th>Tarefas Vinculadas</th>
                  <th className="text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-[var(--color-subtle)] transition">
                    <td>
                      <div className="flex items-center gap-3">
                        <span
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0"
                          style={{
                            background: `color-mix(in srgb, ${c.cor} 18%, transparent)`,
                            color: c.cor
                          }}
                        >
                          {initials(c.nome)}
                        </span>
                        <span className="font-semibold text-xs text-[var(--color-heading)]">
                          {c.nome}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-[var(--color-text)]">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.cor }} />
                        {c.cor}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-[var(--color-subtle)] text-[var(--color-text)] border border-[var(--color-border)]">
                        {countCat(c.id)} atividades
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="hr-icon-btn w-8 h-8 inline-flex items-center justify-center text-[var(--color-muted)] hover:text-white"
                        onClick={() => openEditCategory(c.id)}
                        title="Editar Categoria"
                      >
                        <i className="ph ph-pencil-simple text-base" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA: APARÊNCIA */}
      {activeTab === 'aparencia' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="hr-card flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-[var(--color-heading)] mb-1">
                Modo de Exibição
              </h3>
              <p className="text-xs text-[var(--color-muted)] mb-4">
                Alterne entre os modos claro e escuro de alta visibilidade
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${
                    theme === 'light'
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                      : 'border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-subtle)]'
                  }`}
                  onClick={() => setTheme('light')}
                >
                  <i className="ph ph-sun text-2xl" />
                  <span className="text-xs font-semibold">Modo Claro</span>
                </button>

                <button
                  type="button"
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${
                    theme === 'dark'
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                      : 'border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-subtle)]'
                  }`}
                  onClick={() => setTheme('dark')}
                >
                  <i className="ph ph-moon text-2xl" />
                  <span className="text-xs font-semibold">Modo Escuro</span>
                </button>
              </div>
            </div>
          </div>

          <div className="hr-card flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-[var(--color-heading)] mb-1">
                Cor de Destaque
              </h3>
              <p className="text-xs text-[var(--color-muted)] mb-4">
                Personalize os tons de acento de botões e destaques do sistema
              </p>

              <div className="flex flex-wrap items-center gap-3">
                {ACCENTS.map((ac) => {
                  const active = accentColor.toLowerCase() === ac.color.toLowerCase();
                  return (
                    <button
                      key={ac.id}
                      type="button"
                      className="w-9 h-9 rounded-xl cursor-pointer transition-transform hover:scale-105 flex items-center justify-center"
                      style={{
                        background: ac.color,
                        boxShadow: active ? `0 0 0 3px var(--color-surface), 0 0 0 5px ${ac.color}` : 'none'
                      }}
                      onClick={() => setAccentColor(ac.color)}
                      title={ac.label}
                    >
                      {active && <i className="ph ph-check text-white text-base" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTEÚDO DA ABA: DADOS & BACKUP */}
      {activeTab === 'dados' && (
        <div className="hr-card flex flex-col gap-4">
          <div>
            <h3 className="text-base font-bold text-[var(--color-heading)] mb-1">
              Exportação e Backups de Segurança
            </h3>
            <p className="text-xs text-[var(--color-muted)] mb-4">
              Exporte seus dados em planilhas ou faça backups estruturados em JSON
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                className="hr-btn hr-btn--secondary justify-start p-3 h-auto flex-col items-start gap-2 text-left"
                onClick={exportCSV}
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center">
                  <i className="ph ph-file-csv text-xl" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--color-heading)]">Exportar Planilha</p>
                  <p className="text-[11px] text-[var(--color-muted)] mt-0.5">Baixar arquivo .CSV de tarefas</p>
                </div>
              </button>

              <button
                type="button"
                className="hr-btn hr-btn--secondary justify-start p-3 h-auto flex-col items-start gap-2 text-left"
                onClick={exportBackup}
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--color-success-soft)] text-[var(--color-success)] flex items-center justify-center">
                  <i className="ph ph-download-simple text-xl" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--color-heading)]">Backup Completo</p>
                  <p className="text-[11px] text-[var(--color-muted)] mt-0.5">Baixar snapshot de todas as coleções</p>
                </div>
              </button>

              <button
                type="button"
                className="hr-btn hr-btn--secondary justify-start p-3 h-auto flex-col items-start gap-2 text-left"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-8 h-8 rounded-lg bg-[var(--color-warning-soft)] text-[var(--color-warning)] flex items-center justify-center">
                  <i className="ph ph-upload-simple text-xl" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--color-heading)]">Restaurar Backup</p>
                  <p className="text-[11px] text-[var(--color-muted)] mt-0.5">Carregar arquivo .JSON salvo</p>
                </div>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

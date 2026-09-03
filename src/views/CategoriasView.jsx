import React from 'react';
import { useHub } from '../context/HubContext';
import { Plus, Edit2 } from 'lucide-react';

export default function CategoriasView() {
  const { categories, activities, openNewCategory, openEditCategory } = useHub();

  const countCat = (id) => activities.filter((a) => a.categoria === id).length;

  const initials = (name) => {
    if (!name) return '?';
    const p = name.trim().split(/\s+/);
    if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
    return (p[0][0] + p[p.length - 1][0]).toUpperCase();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[var(--ax-text-strong)]">Categorias</h2>
          <p className="text-xs text-[var(--ax-text-subtle)]">Organize suas atividades em áreas e projetos</p>
        </div>
        <button className="ax-btn ax-btn--primary ax-btn--pill" onClick={openNewCategory}>
          <Plus size={15} /> Nova categoria
        </button>
      </div>

      <div className="ax-card">
        <div className="ax-card__body p-0">
          <div className="ax-table-wrap">
            <table className="ax-table ax-table--hover">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Cor</th>
                  <th className="ax-num">Tarefas</th>
                  <th style={{ width: '80px' }} />
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <span
                          className="ax-avatar ax-avatar--xs ax-avatar--squircle font-bold text-xs"
                          style={{
                            background: `color-mix(in oklab, ${c.cor} 20%, transparent)`,
                            color: c.cor
                          }}
                        >
                          {initials(c.nome)}
                        </span>
                        <span className="font-semibold text-xs text-[var(--ax-text-strong)]">{c.nome}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        className="ax-badge ax-badge--soft ax-badge--pill text-xs"
                        style={{ '--_b500': c.cor }}
                      >
                        <span className="ax-badge__dot" />
                        {c.cor}
                      </span>
                    </td>
                    <td className="ax-num text-xs">{countCat(c.id)}</td>
                    <td>
                      <div className="flex justify-end">
                        <button
                          className="ax-icon-btn w-8 h-8"
                          onClick={() => openEditCategory(c.id)}
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

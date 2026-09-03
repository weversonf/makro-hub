import React, { useState, useEffect } from 'react';
import { useHub } from '../../context/HubContext';
import { X } from 'lucide-react';

export default function CategoryModal() {
  const { catModalOpen, editCategoryData, closeCategoryModal, saveCategory, deleteCategory, showToast } = useHub();
  const [nome, setNome] = useState('');
  const [cor, setCor] = useState('#0EA5C4');

  useEffect(() => {
    if (editCategoryData) {
      setNome(editCategoryData.nome || '');
      setCor(editCategoryData.cor || '#0EA5C4');
    } else {
      setNome('');
      setCor('#0EA5C4');
    }
  }, [editCategoryData, catModalOpen]);

  if (!catModalOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome.trim()) {
      showToast('Informe o nome da categoria.', 'error');
      return;
    }
    saveCategory({
      id: editCategoryData?.id,
      nome: nome.trim(),
      cor
    });
  };

  return (
    <div className="ax-overlay open" onClick={closeCategoryModal}>
      <div className="ax-modal ax-modal--sm" onClick={(e) => e.stopPropagation()} role="dialog">
        <div className="ax-modal__head">
          <div className="ax-modal__head-main">
            <div className="ax-modal__eyebrow">Categoria</div>
            <div className="ax-modal__title">{editCategoryData ? 'Editar Categoria' : 'Nova Categoria'}</div>
          </div>
          <button className="ax-icon-btn" onClick={closeCategoryModal} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="ax-modal__body">
            <div className="ax-field">
              <label className="ax-label">Nome da Categoria</label>
              <input
                className="ax-input"
                placeholder="Ex.: Marketing Institucional, Eventos…"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                autoFocus
              />
            </div>

            <div className="ax-field">
              <label className="ax-label">Cor da Categoria</label>
              <input
                type="color"
                className="w-14 h-11 rounded-xl border border-[var(--ax-border)] bg-[var(--ax-surface)] cursor-pointer p-1"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
              />
            </div>
          </div>

          <div className="ax-modal__foot">
            {editCategoryData && editCategoryData.id !== 1 && (
              <button
                type="button"
                className="ax-btn ax-btn--ghost-danger"
                onClick={() => deleteCategory(editCategoryData.id)}
              >
                Excluir
              </button>
            )}
            <span className="ax-header__spacer" />
            <button type="button" className="ax-btn ax-btn--ghost" onClick={closeCategoryModal}>
              Cancelar
            </button>
            <button type="submit" className="ax-btn ax-btn--primary">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

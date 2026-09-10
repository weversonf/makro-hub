import React, { useState, useMemo } from 'react';
import { useHub } from '../context/HubContext';
import { X, UserPlus, Trash2, ShieldCheck, Mail, Phone, Crown, CheckCircle2, Pencil, KeyRound, Copy, Check, Eye, EyeOff } from 'lucide-react';

export default function EquipeView() {
  const {
    activities,
    registeredUsers,
    user,
    isMaster,
    isAdmin,
    USER_ROLES,
    MASTER_ADMIN_EMAIL,
    updateUserRole,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    showConfirm,
    showToast
  } = useHub();

  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [editingUserId, setEditingUserId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cargo: '',
    departamento: 'Marketing Central',
    ramal: '',
    foto: '',
    role: 'colaborador',
    senha: '',
    mustChangePassword: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lista dinâmica de membros cadastrados reais
  const teamList = useMemo(() => {
    let list = Array.isArray(registeredUsers) && registeredUsers.length > 0
      ? [...registeredUsers]
      : [];

    const isCurrentMaster = (user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) || isMaster;

    // Se a lista do Firestore ainda não tiver carregado ou estiver vazia, garantir que o usuário atual apareça
    if (list.length === 0 && user) {
      list.push({
        id: user.uid || 'master',
        uid: user.uid || 'master',
        nome: user.displayName || 'Weverson Nascimento',
        displayName: user.displayName || 'Weverson Nascimento',
        email: user.email || MASTER_ADMIN_EMAIL,
        cargo: isCurrentMaster ? 'ADM Master & Coordenador' : 'Colaborador',
        departamento: 'Marketing Central',
        ramal: isCurrentMaster ? '(85) 99924-1234' : '',
        foto: user.photoURL || '',
        photoURL: user.photoURL || '',
        role: isCurrentMaster ? 'admin_master' : 'colaborador',
        online: true
      });
    }

    // Normalizar dados, garantindo que o usuário logado / ADM Master sempre tenha foto e nome atualizados do Google Auth
    return list.map((m) => {
      const isSelf = user && ((m.id && m.id === user.uid) || (m.uid && m.uid === user.uid) || (m.email && m.email.toLowerCase() === (user.email || '').toLowerCase()));
      const isMasterUser = isSelf ? isCurrentMaster : (m.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase());

      const photo = (isSelf && user?.photoURL) ? user.photoURL : (m.foto || m.photoURL || (isMasterUser ? (user?.photoURL || '') : ''));
      const name = (isSelf && user?.displayName) ? user.displayName : (m.nome || m.displayName || (isMasterUser ? (user?.displayName || 'Weverson Nascimento') : (m.email?.split('@')[0] || 'Colaborador')));
      const email = (isSelf && user?.email) ? user.email : (m.email || (isMasterUser ? (user?.email || MASTER_ADMIN_EMAIL) : '—'));

      return {
        ...m,
        id: m.id || m.uid || (isSelf ? user.uid : 'member'),
        uid: m.uid || m.id || (isSelf ? user.uid : 'member'),
        foto: photo,
        photoURL: photo,
        nome: name,
        displayName: name,
        email: email,
        cargo: m.cargo || (isMasterUser ? 'ADM Master & Coordenador' : 'Colaborador de Marketing'),
        departamento: m.departamento || 'Marketing Central',
        ramal: m.ramal || (isMasterUser ? '(85) 99924-1234' : ''),
        role: isMasterUser ? 'admin_master' : (m.role || 'colaborador'),
        online: isSelf ? true : (m.online !== false)
      };
    });
  }, [registeredUsers, user, MASTER_ADMIN_EMAIL, isMaster]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pwd = 'Mk#';
    for (let i = 0; i < 6; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({
      ...prev,
      senha: pwd,
      mustChangePassword: true
    }));
    setShowPassword(true);
    showToast('Senha provisória gerada! Copie-a para enviar ao colaborador.', 'info');
  };

  const handleCopyPassword = () => {
    if (!formData.senha) return;
    navigator.clipboard.writeText(formData.senha);
    setCopiedPassword(true);
    showToast('Senha copiada para a área de transferência!', 'success');
    setTimeout(() => setCopiedPassword(false), 2500);
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingUserId(null);
    setFormData({
      nome: '',
      email: '',
      cargo: '',
      departamento: 'Marketing Central',
      ramal: '',
      foto: '',
      role: 'colaborador',
      senha: '',
      mustChangePassword: true
    });
    setShowPassword(false);
    setCopiedPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (member) => {
    setModalMode('edit');
    setEditingUserId(member.id || member.uid);
    setFormData({
      nome: member.nome || member.displayName || '',
      email: member.email || '',
      cargo: member.cargo || '',
      departamento: member.departamento || 'Marketing Central',
      ramal: member.ramal || '',
      foto: member.foto || member.photoURL || '',
      role: member.role || 'colaborador',
      senha: '',
      mustChangePassword: member.mustChangePassword ?? true
    });
    setShowPassword(false);
    setCopiedPassword(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      showToast('Por favor, informe o nome do colaborador.', 'error');
      return;
    }
    if (!formData.email.trim()) {
      showToast('Por favor, informe o e-mail do colaborador.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'add') {
        const success = await addTeamMember(formData);
        if (success) setIsModalOpen(false);
      } else {
        const success = await updateTeamMember(editingUserId, formData);
        if (success) setIsModalOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (userId, newRole, memberEmail) => {
    if (memberEmail?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
      showToast('O nível do ADM Master principal é fixo e permanente.', 'error');
      return;
    }
    await updateUserRole(userId, newRole);
  };

  const handleDeleteMember = (member) => {
    if (member.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
      showToast('O ADM Master principal não pode ser removido da equipe.', 'error');
      return;
    }

    showConfirm(
      'Remover colaborador?',
      `Tem certeza que deseja remover ${member.nome || member.displayName || member.email} da equipe?`,
      () => deleteTeamMember(member.id || member.uid, member.email)
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--color-border)]">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-heading)] flex items-center gap-2">
            Equipe do Marketing
          </h2>
          <p className="text-xs text-[var(--color-muted)] mt-0.5">
            Colaboradores, níveis de acesso, papéis e contatos oficiais
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center gap-1.5">
            <i className="ph ph-users text-sm" />
            <span>
              {teamList.length} {teamList.length === 1 ? 'colaborador cadastrado' : 'colaboradores cadastrados'}
            </span>
          </span>

          {(isMaster || isAdmin) && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="hr-btn hr-btn--primary text-xs h-8 px-3 flex items-center gap-1.5 shadow-sm hover:scale-[1.02] transition"
            >
              <UserPlus size={15} />
              <span>Adicionar Colaborador</span>
            </button>
          )}
        </div>
      </div>

      {/* Banner Explicativo de Níveis de Usuário */}
      <div className="hr-card p-4 sm:p-5 border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={18} className="text-[var(--color-primary)]" />
          <h3 className="text-sm font-bold text-[var(--color-heading)]">
            Níveis de Usuário & Permissões do Sistema
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.values(USER_ROLES).map((role) => (
            <div
              key={role.id}
              className="p-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-subtle)]/60 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-base">{role.icon}</span>
                  <span className="text-xs font-bold text-[var(--color-heading)]">
                    {role.label}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--color-muted)] leading-relaxed">
                  {role.description}
                </p>
              </div>
              {role.id === 'admin_master' && (
                <span className="mt-2 text-[10px] font-semibold text-amber-500 block truncate">
                  Master: {MASTER_ADMIN_EMAIL}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Grid de Membros */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {teamList.map((m) => {
          const isMasterUser = m.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase() || (user && (m.id === user.uid || m.uid === user.uid));
          const roleInfo = USER_ROLES[m.role] || USER_ROLES.colaborador;
          const memberPhoto = (isMasterUser && user?.photoURL) ? user.photoURL : (m.foto || m.photoURL || '');
          const memberName = (isMasterUser && user?.displayName)
            ? user.displayName
            : (m.nome || m.displayName || (isMasterUser ? 'Weverson Nascimento' : (m.email?.split('@')[0] || 'Colaborador')));
          const memberCargo = m.cargo || (isMasterUser ? 'ADM Master & Coordenador' : 'Colaborador');
          const memberDepto = m.departamento || 'Marketing Central';
          const memberEmail = (isMasterUser && user?.email) ? user.email : (m.email || (isMasterUser ? MASTER_ADMIN_EMAIL : '—'));
          const memberRamal = m.ramal || (isMasterUser ? '(85) 99924-1234' : '');

          const assignedCount = (activities || []).filter((a) => {
            if (a.responsavelId && (m.id || m.uid)) {
              return a.responsavelId === (m.id || m.uid);
            }
            if (a.responsavelEmail && m.email) {
              return a.responsavelEmail.toLowerCase() === m.email.toLowerCase();
            }
            return isMasterUser;
          }).length;

          return (
            <div
              key={m.id || m.uid || m.email}
              className="hr-card flex flex-col justify-between p-4 sm:p-5 border border-[var(--color-border)] hover:border-[var(--color-border-strong)] transition-all shadow-sm"
            >
              <div>
                {/* Topo do Card: Foto, Nome e Badge */}
                <div className="flex items-start gap-3.5 mb-3.5">
                  <div className="relative flex-shrink-0">
                    {memberPhoto ? (
                      <img
                        src={memberPhoto}
                        alt={memberName}
                        className="w-13 h-13 rounded-full object-cover border-2 border-[var(--color-border)] shadow-sm"
                        style={{ width: '52px', height: '52px' }}
                      />
                    ) : (
                      <div
                        className="rounded-full border-2 border-[var(--color-border)] flex items-center justify-center font-bold text-sm bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-sm"
                        style={{ width: '52px', height: '52px' }}
                      >
                        {memberName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span
                      className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-[var(--color-surface)] ${
                        m.online !== false ? 'bg-[var(--color-success)]' : 'bg-[var(--color-muted)]'
                      }`}
                      title={m.online !== false ? 'Online / Ativo' : 'Ausente'}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <h3 className="text-sm font-bold text-[var(--color-heading)] truncate" title={memberName}>
                        {memberName}
                      </h3>
                      {isMasterUser && (
                        <span title="ADM Master Principal" className="flex-shrink-0 text-amber-500">
                          <Crown size={15} />
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md border ${roleInfo.badgeClass}`}
                      >
                        <span>{roleInfo.icon}</span>
                        <span>{roleInfo.label}</span>
                      </span>

                      <span
                        className="inline-flex items-center text-[10px] font-semibold text-[var(--color-primary)] bg-[var(--color-primary-soft)] px-2 py-0.5 rounded border border-[var(--color-primary)]/20"
                        title={`${assignedCount} demandas sob responsabilidade`}
                      >
                        {assignedCount} {assignedCount === 1 ? 'demanda' : 'demandas'}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--color-text-secondary)] font-medium mt-1 truncate">
                      {memberCargo}
                    </p>
                    <p className="text-[11px] text-[var(--color-muted)] truncate">
                      {memberDepto}
                    </p>
                  </div>
                </div>

                {/* Contatos */}
                <div className="space-y-1.5 text-xs text-[var(--color-text-secondary)] pt-3 border-t border-[var(--color-border-subtle)]">
                  <div className="flex items-center gap-2 truncate">
                    <Mail size={14} className="text-[var(--color-muted)] flex-shrink-0" />
                    <span className="truncate" title={memberEmail}>{memberEmail}</span>
                  </div>
                  {memberRamal ? (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-[var(--color-muted)] flex-shrink-0" />
                      <span>{memberRamal}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Rodapé do Card: Controle de Nível e Ações */}
              <div className="mt-4 pt-3 border-t border-[var(--color-border-subtle)] flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] font-semibold text-[var(--color-muted)]">
                    Nível de Acesso:
                  </span>
                  <div className="flex items-center gap-1.5">
                    {isMasterUser ? (
                      <span className="text-[11px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        Permanente (Master)
                      </span>
                    ) : isMaster ? (
                      <select
                        value={m.role || 'colaborador'}
                        onChange={(e) => handleRoleChange(m.id || m.uid, e.target.value, m.email)}
                        className="text-xs py-1 px-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] cursor-pointer"
                      >
                        <option value="admin_master">👑 ADM Master</option>
                        <option value="admin">🛡️ Administrador</option>
                        <option value="colaborador">👤 Colaborador</option>
                        <option value="visualizador">👁️ Visualizador</option>
                      </select>
                    ) : (
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${roleInfo.badgeClass}`}>
                        {roleInfo.label}
                      </span>
                    )}

                    {(isMaster || isAdmin) && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(m)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] transition"
                        title="Editar dados e senha do colaborador"
                      >
                        <Pencil size={14} />
                      </button>
                    )}

                    {isMaster && !isMasterUser && (
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(m)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)] transition"
                        title="Remover colaborador"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-[var(--color-muted)] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
                    Ativo no Makro Hub
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Cadastro / Edição de Colaborador */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={handleCloseModal}
        >
          <div
            className="w-full max-w-lg overflow-hidden border border-[var(--color-border-strong)] bg-[var(--color-surface)] rounded-2xl shadow-2xl max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
          >
            {/* Header do Modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center">
                  {modalMode === 'add' ? <UserPlus size={18} /> : <Pencil size={18} />}
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-heading)]">
                    {modalMode === 'add' ? 'Adicionar Colaborador à Equipe' : 'Editar Colaborador'}
                  </h3>
                  <p className="text-[11px] text-[var(--color-muted)]">
                    {modalMode === 'add' ? 'Defina os dados, nível de acesso e senha temporária' : 'Atualize os dados, contatos ou redefina a senha de acesso'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-muted)] hover:text-[var(--color-heading)] hover:bg-[var(--color-subtle)] transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Formulário com Scroll Interno */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-[var(--color-heading)] mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  placeholder="Ex: Beatriz Vasconcelos"
                  className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-heading)] mb-1">
                  E-mail do Colaborador *
                </label>
                <input
                  type="email"
                  required
                  disabled={modalMode === 'edit'}
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="colaborador@makroengenharia.com.br"
                  className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] transition disabled:opacity-60 disabled:cursor-not-allowed"
                />
                {modalMode === 'edit' && (
                  <span className="text-[10px] text-[var(--color-muted)] mt-0.5 block">
                    O e-mail de acesso é o identificador único da conta e não pode ser alterado diretamente.
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-heading)] mb-1">
                    Cargo
                  </label>
                  <input
                    type="text"
                    value={formData.cargo}
                    onChange={(e) => handleInputChange('cargo', e.target.value)}
                    placeholder="Ex: Designer Gráfico"
                    className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-heading)] mb-1">
                    Departamento
                  </label>
                  <input
                    type="text"
                    value={formData.departamento}
                    onChange={(e) => handleInputChange('departamento', e.target.value)}
                    placeholder="Marketing Central"
                    className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-heading)] mb-1">
                    Telefone / Ramal
                  </label>
                  <input
                    type="text"
                    value={formData.ramal}
                    onChange={(e) => handleInputChange('ramal', e.target.value)}
                    placeholder="Deixe em branco ou (85) 99812-4567"
                    className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[var(--color-heading)] mb-1">
                    Nível de Acesso (Papel)
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] transition cursor-pointer"
                  >
                    <option value="colaborador">👤 Colaborador (Padrão)</option>
                    <option value="admin">🛡️ Administrador</option>
                    <option value="admin_master">👑 ADM Master</option>
                    <option value="visualizador">👁️ Visualizador</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--color-heading)] mb-1">
                  URL da Foto (Opcional)
                </label>
                <input
                  type="url"
                  value={formData.foto}
                  onChange={(e) => handleInputChange('foto', e.target.value)}
                  placeholder="https://..."
                  className="w-full h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] transition"
                />
              </div>

              {/* Seção de Senha Automática e Acesso por E-mail */}
              <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-subtle)]/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <KeyRound size={15} className="text-[var(--color-primary)]" />
                    <span className="text-xs font-bold text-[var(--color-heading)]">
                      Acesso ao Sistema & Senha
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    ⚡ Gerar Senha Automática
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[var(--color-muted)] mb-1">
                    {modalMode === 'add' ? 'Senha Provisória do Usuário' : 'Nova Senha Provisória (Opcional)'}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.senha}
                        onChange={(e) => handleInputChange('senha', e.target.value)}
                        placeholder={modalMode === 'add' ? 'Clique em "Gerar Senha Automática" ou digite' : 'Deixe em branco para manter a senha atual'}
                        className="w-full h-9 px-3 pr-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-mono text-[var(--color-heading)] outline-none focus:border-[var(--color-primary)] transition"
                      />
                      {formData.senha ? (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 top-2 text-[var(--color-muted)] hover:text-[var(--color-heading)]"
                          title={showPassword ? 'Ocultar' : 'Mostrar'}
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      ) : null}
                    </div>

                    {formData.senha ? (
                      <button
                        type="button"
                        onClick={handleCopyPassword}
                        className="h-9 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-bold text-[var(--color-heading)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] flex items-center gap-1.5 transition flex-shrink-0"
                        title="Copiar senha gerada"
                      >
                        {copiedPassword ? <Check size={14} className="text-[var(--color-success)]" /> : <Copy size={14} />}
                        <span>{copiedPassword ? 'Copiada!' : 'Copiar'}</span>
                      </button>
                    ) : null}
                  </div>
                </div>

                {formData.senha ? (
                  <label className="flex items-center gap-2 text-[11px] font-medium text-[var(--color-heading)] cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={formData.mustChangePassword}
                      onChange={(e) => handleInputChange('mustChangePassword', e.target.checked)}
                      className="rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-0"
                    />
                    <span>Exigir troca obrigatória de senha no primeiro login</span>
                  </label>
                ) : null}

                <p className="text-[10px] text-[var(--color-muted)] leading-relaxed">
                  Colaboradores que acessarem com <strong>"Entrar com Google"</strong> entram diretamente via conta corporativa. A senha acima é utilizada para autenticação direta por e-mail e senha.
                </p>
              </div>

              {/* Botões do Modal */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="hr-btn hr-btn--secondary text-xs h-9 px-4"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="hr-btn hr-btn--primary text-xs h-9 px-4 flex items-center gap-1.5"
                >
                  <CheckCircle2 size={15} />
                  <span>{isSubmitting ? (modalMode === 'add' ? 'Cadastrando...' : 'Salvando...') : (modalMode === 'add' ? 'Cadastrar Colaborador' : 'Salvar Alterações')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

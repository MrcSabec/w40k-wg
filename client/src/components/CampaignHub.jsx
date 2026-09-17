import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useSocket } from '../context/SocketContext';
import { Shield, Skull, Crown, Plus, Ticket, Users, Swords, User, Edit3, Check, ArrowRight, BookOpen, LogOut } from 'lucide-react';
import { apiUrl } from '../config';

export default function CampaignHub({ onSelectCampaign }) {
  const { user, updateUserName, logout, authHeaders } = useUser();
  const { setActiveCampaign } = useSocket();

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // User Profile Name Edit
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Create Form
  const [newCampName, setNewCampName] = useState('');
  const [newCampTier, setNewCampTier] = useState(2);
  const [newCampFramework, setNewCampFramework] = useState('');
  const [newCampDesc, setNewCampDesc] = useState('');
  const [createError, setCreateError] = useState('');

  // Join Form
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [joinError, setJoinError] = useState('');

  // Fetch campaigns
  const fetchCampaigns = () => {
    if (!user) return;
    setLoading(true);
    fetch(apiUrl('/api/campaigns'), { headers: authHeaders })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCampaigns(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCampaigns();
  }, [user]);

  // Handle Save User Name
  const handleSaveName = () => {
    if (tempName.trim()) {
      updateUserName(tempName);
    }
    setIsEditingName(false);
  };

  // Handle Create Campaign (Flow 1 -> GM)
  const handleCreateCampaign = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!newCampName.trim()) {
      setCreateError('O nome da campanha é obrigatório.');
      return;
    }

    try {
      const res = await fetch(apiUrl('/api/campaigns'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: newCampName.trim(),
          tier: newCampTier,
          framework: newCampFramework.trim(),
          description: newCampDesc.trim()
        })
      });

      if (res.ok) {
        const created = await res.json();
        setShowCreateModal(false);
        setNewCampName('');
        setNewCampFramework('');
        setNewCampDesc('');
        // Select and enter directly as GM
        setActiveCampaign(created);
        if (onSelectCampaign) onSelectCampaign(created);
      } else {
        const errData = await res.json();
        setCreateError(errData.error || 'Erro ao criar campanha.');
      }
    } catch (err) {
      setCreateError('Falha de conexão com o servidor.');
    }
  };

  // Handle Join Campaign (Flow 2 -> Player)
  const handleJoinCampaign = async (e) => {
    e.preventDefault();
    setJoinError('');
    if (!inviteCodeInput.trim()) {
      setJoinError('Por favor, informe o código de convite.');
      return;
    }

    try {
      const res = await fetch(apiUrl('/api/campaigns/join'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ invite_code: inviteCodeInput.trim() })
      });

      if (res.ok) {
        const joined = await res.json();
        setShowJoinModal(false);
        setInviteCodeInput('');
        // Select and enter directly as Player
        setActiveCampaign(joined);
        if (onSelectCampaign) onSelectCampaign(joined);
      } else {
        const errData = await res.json();
        setJoinError(errData.error || 'Código de convite inválido.');
      }
    } catch (err) {
      setJoinError('Falha de conexão com o servidor.');
    }
  };

  const handleEnterCampaign = (camp) => {
    setActiveCampaign(camp);
    if (onSelectCampaign) onSelectCampaign(camp);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Top Banner & User Profile */}
      <div className="bg-gradient-to-r from-grim-950 via-grim-900 to-grim-950 border border-gothic-gold/40 rounded-2xl p-6 shadow-2xl gothic-panel-gold gothic-corners">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gothic-gold via-amber-600 to-gothic-goldDark flex items-center justify-center shadow-lg border border-amber-300/60 shrink-0">
              <Skull className="w-8 h-8 text-grim-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-tech text-gothic-gold tracking-widest uppercase">
                  SANCTUM IMPERIALIS // CENTRAL DE CAMPANHAS
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-gothic font-black text-grim-100 tracking-wide">
                Warhammer 40k: Wrath & Glory
              </h1>
              
              {/* User Identity Indicator */}
              <div className="flex items-center gap-2 mt-1 text-xs text-grim-400">
                <User className="w-3.5 h-3.5 text-gothic-gold" />
                <span>Identidade:</span>
                {isEditingName ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={tempName}
                      onChange={e => setTempName(e.target.value)}
                      className="bg-grim-950 border border-gothic-gold rounded px-2 py-0.5 text-xs text-white outline-none"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-1 bg-gothic-gold text-grim-950 rounded hover:bg-amber-400"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 font-bold text-grim-200">
                    <span className="text-gothic-gold">{user?.name || 'Carregando...'}</span>
                    <button
                      title="Editar Nome"
                      onClick={() => { setTempName(user?.name || ''); setIsEditingName(true); }}
                      className="text-grim-500 hover:text-white transition"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                    <span className="text-grim-600">|</span>
                    <button
                      type="button"
                      onClick={logout}
                      title="Sair / Trocar de Conta"
                      className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-200 transition underline underline-offset-2 ml-1"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Desconectar</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TWO MAIN ACTIONS */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Create Campaign -> GM */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-gothic-gold to-amber-500 hover:from-amber-400 hover:to-gothic-gold text-grim-950 font-gothic font-black text-xs uppercase tracking-wider shadow-lg shadow-gothic-gold/20 active:scale-95 transition"
            >
              <Plus className="w-4 h-4 text-grim-950 stroke-[3]" />
              <span>Criar Nova Campanha</span>
            </button>

            {/* Join Campaign -> Player */}
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-grim-900 hover:bg-grim-850 border border-gothic-gold/50 text-gothic-gold hover:text-amber-300 font-gothic font-bold text-xs uppercase tracking-wider shadow active:scale-95 transition"
            >
              <Ticket className="w-4 h-4 text-gothic-gold" />
              <span>Entrar em uma Campanha</span>
            </button>
          </div>

        </div>
      </div>

      {/* Campaigns List Dashboard */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gothic-gold" />
            <h2 className="text-lg font-gothic font-bold text-grim-100 uppercase tracking-wider">
              Minhas Campanhas ({campaigns.length})
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-grim-500 font-tech animate-pulse">
            Consultando registros no banco de dados do Sanctum...
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-grim-900 border border-grim-800 rounded-xl p-12 text-center gothic-panel">
            <Shield className="w-12 h-12 text-grim-600 mx-auto mb-3" />
            <h3 className="text-xl font-gothic font-bold text-gothic-gold">Você ainda não participa de nenhuma campanha</h3>
            <p className="text-sm text-grim-400 mt-1 max-w-md mx-auto">
              Comece criando sua própria saga como <strong>Mestre (GM)</strong> ou peça o código de convite ao seu Mestre para entrar como <strong>Jogador (Player)</strong>.
            </p>
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-gothic-gold text-grim-950 font-gothic font-bold text-xs uppercase rounded shadow"
              >
                Criar Campanha
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                className="px-4 py-2 bg-grim-950 border border-grim-700 text-grim-300 font-gothic font-bold text-xs uppercase rounded hover:border-gothic-gold"
              >
                Entrar com Código
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {campaigns.map(camp => {
              const isGM = camp.role === 'gm';

              return (
                <div
                  key={camp.id}
                  className="bg-grim-900 border border-grim-800 hover:border-gothic-gold/60 rounded-xl p-5 shadow-lg transition duration-200 flex flex-col justify-between gothic-corners group"
                >
                  <div>
                    {/* Role Badge & Tier */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[10px] uppercase font-gothic font-black px-2.5 py-0.5 rounded border tracking-wider shadow ${
                        isGM 
                          ? 'bg-gradient-to-r from-amber-950 to-purple-950 border-amber-400 text-amber-300' 
                          : 'bg-gradient-to-r from-blue-950 to-slate-900 border-blue-400 text-blue-300'
                      }`}>
                        {isGM ? '👑 MESTRE (GM)' : '🛡️ JOGADOR (PLAYER)'}
                      </span>
                      <span className="text-[11px] font-tech text-grim-400 font-bold">
                        TIER {camp.tier}
                      </span>
                    </div>

                    {/* Campaign Title */}
                    <h3 className="font-gothic font-bold text-lg text-grim-100 group-hover:text-gothic-gold transition">
                      {camp.name}
                    </h3>
                    <p className="text-xs text-grim-400 mt-1 line-clamp-2">
                      {camp.framework || camp.description || 'Sem descrição cadastrada.'}
                    </p>

                    {/* Info Pills */}
                    <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-tech text-grim-400 bg-grim-950 p-2.5 rounded border border-grim-800">
                      <div>
                        <span className="block text-[9px] uppercase text-grim-500">Membros</span>
                        <span className="font-bold text-grim-200">{camp.members_count} conectados</span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase text-grim-500">Personagens</span>
                        <span className="font-bold text-grim-200">{camp.characters_count} fichas</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-5 pt-3 border-t border-grim-800 flex items-center justify-between">
                    <span className="text-[10px] text-grim-500 font-tech">
                      CÓDIGO: <strong className="text-gothic-gold">{camp.invite_code}</strong>
                    </span>

                    <button
                      onClick={() => handleEnterCampaign(camp)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-gothic-gold/20 hover:bg-gothic-gold text-gothic-gold hover:text-grim-950 font-gothic font-bold text-xs uppercase tracking-wider border border-gothic-gold/50 transition active:scale-95"
                    >
                      <span>Acessar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: CRIAR NOVA CAMPANHA (GM) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-grim-900 border-2 border-gothic-gold rounded-xl p-6 max-w-lg w-full gothic-corners shadow-2xl">
            <div className="flex items-center justify-between border-b border-grim-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-gothic-gold" />
                <h3 className="font-gothic font-bold text-lg text-gothic-gold uppercase tracking-wide">
                  Criar Nova Campanha (Mestre)
                </h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-grim-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            {createError && (
              <div className="mb-4 p-2.5 bg-rose-950/60 border border-rose-600 rounded text-rose-300 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-xs uppercase text-grim-400 font-semibold mb-1">
                  Nome da Campanha *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: O Expurgo de Gilead, Cruzada Indomitus..."
                  value={newCampName}
                  onChange={e => setNewCampName(e.target.value)}
                  className="w-full bg-grim-950 border border-grim-700 focus:border-gothic-gold rounded px-3 py-2 text-sm text-grim-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase text-grim-400 font-semibold mb-1">
                  Grau da Campanha (Tier 1 a 4)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map(t => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setNewCampTier(t)}
                      className={`py-2 rounded font-tech font-bold text-xs uppercase border transition ${
                        newCampTier === t 
                          ? 'bg-gothic-gold text-grim-950 border-amber-300 shadow' 
                          : 'bg-grim-950 text-grim-400 border-grim-800 hover:border-grim-700'
                      }`}
                    >
                      Tier {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase text-grim-400 font-semibold mb-1">
                  Framework (Estrutura da Aliança)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Agentes do Trono convocados para purgar cultistas no submundo..."
                  value={newCampFramework}
                  onChange={e => setNewCampFramework(e.target.value)}
                  className="w-full bg-grim-950 border border-grim-700 focus:border-gothic-gold rounded px-3 py-2 text-sm text-grim-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase text-grim-400 font-semibold mb-1">
                  Descrição & Sinopse
                </label>
                <textarea
                  rows="2"
                  placeholder="Detalhes sobre os perigos locais, planetas ou naves..."
                  value={newCampDesc}
                  onChange={e => setNewCampDesc(e.target.value)}
                  className="w-full bg-grim-950 border border-grim-700 focus:border-gothic-gold rounded px-3 py-2 text-sm text-grim-100 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs text-grim-400 hover:text-white rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gothic-gold hover:bg-amber-400 text-grim-950 font-gothic font-bold text-xs uppercase tracking-wider rounded shadow transition"
                >
                  Iniciar Campanha (GM)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ENTRAR EM UMA CAMPANHA (PLAYER) */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-grim-900 border-2 border-gothic-gold rounded-xl p-6 max-w-md w-full gothic-corners shadow-2xl">
            <div className="flex items-center justify-between border-b border-grim-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-gothic-gold" />
                <h3 className="font-gothic font-bold text-lg text-gothic-gold uppercase tracking-wide">
                  Entrar em uma Campanha
                </h3>
              </div>
              <button onClick={() => setShowJoinModal(false)} className="text-grim-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            {joinError && (
              <div className="mb-4 p-2.5 bg-rose-950/60 border border-rose-600 rounded text-rose-300 text-xs">
                {joinError}
              </div>
            )}

            <form onSubmit={handleJoinCampaign} className="space-y-4">
              <div>
                <label className="block text-xs uppercase text-grim-400 font-semibold mb-1">
                  Código de Convite da Campanha *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: WG-7K9A2X"
                  value={inviteCodeInput}
                  onChange={e => setInviteCodeInput(e.target.value.toUpperCase())}
                  className="w-full bg-grim-950 border border-grim-700 focus:border-gothic-gold rounded px-3 py-2 text-base text-center font-tech font-bold text-gothic-gold tracking-widest uppercase outline-none"
                />
                <p className="text-[11px] text-grim-500 mt-1 text-center">
                  Peça o código gerado ao Mestre da sua mesa.
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="px-4 py-2 text-xs text-grim-400 hover:text-white rounded"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gothic-gold hover:bg-amber-400 text-grim-950 font-gothic font-bold text-xs uppercase tracking-wider rounded shadow transition"
                >
                  Confirmar e Entrar (Jogador)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

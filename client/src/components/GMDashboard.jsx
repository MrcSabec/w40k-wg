import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Shield, Skull, Crown, Flame, Plus, Minus, Users, Swords, AlertTriangle, Heart, Zap, Sparkles, RefreshCw } from 'lucide-react';
import { apiUrl } from '../config';

export default function GMDashboard({ onOpenRoller }) {
  const {
    activeCampaign,
    currentCampaignId,
    campaignMeta,
    updateMeta,
    characters,
    updateCharacterStatus,
    rollMob,
    refreshCharacters
  } = useSocket();

  const campaignId = activeCampaign?.id || currentCampaignId;
  const ruin = activeCampaign?.ruin ?? campaignMeta?.ruin ?? 0;
  const glory = activeCampaign?.glory ?? campaignMeta?.glory ?? 0;

  const [mobs, setMobs] = useState([]);
  const [showAddMob, setShowAddMob] = useState(false);
  const [newMobName, setNewMobName] = useState('');
  const [newMobCount, setNewMobCount] = useState(10);
  const [newMobAttr, setNewMobAttr] = useState(3);
  const [newMobSkill, setNewMobSkill] = useState(2);
  const [newMobNotes, setNewMobNotes] = useState('');

  // Fetch mobs for campaign
  const fetchMobs = () => {
    if (!campaignId) return;
    fetch(apiUrl(`/api/mobs/campaign/${campaignId}`))
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMobs(data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchMobs();
  }, [campaignId]);

  // Create new mob
  const handleCreateMob = async (e) => {
    e.preventDefault();
    if (!newMobName.trim()) return;

    try {
      const res = await fetch(apiUrl('/api/mobs'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          name: newMobName,
          creature_count: newMobCount,
          base_attribute: newMobAttr,
          base_skill: newMobSkill,
          notes: newMobNotes
        })
      });
      if (res.ok) {
        setNewMobName('');
        setShowAddMob(false);
        fetchMobs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Update mob count (e.g. casualties taken)
  const handleUpdateMobCount = async (mob, delta) => {
    const newCount = Math.max(0, mob.creature_count + delta);
    try {
      await fetch(apiUrl(`/api/mobs/${mob.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creature_count: newCount })
      });
      fetchMobs();
    } catch (err) {
      console.error(err);
    }
  };

  // Roll mob attack
  const handleRollMobAttack = (mob) => {
    rollMob({
      mobId: mob.id,
      mobName: mob.name,
      creatureCount: mob.creature_count,
      baseAttribute: mob.base_attribute,
      baseSkill: mob.base_skill,
      dn: 3 // Standard combat DN
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Top Banner / Campaign Status */}
      <div className="bg-gradient-to-r from-grim-900 via-grim-850 to-grim-900 border border-gothic-gold/30 rounded-xl p-6 shadow-grim relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-gothic-gold" />
              <h2 className="text-2xl font-gothic font-bold text-gothic-gold tracking-wide uppercase">
                Painel de Comando do Mestre (GM)
              </h2>
            </div>
            <p className="text-sm text-grim-400 mt-1 max-w-2xl">
              Monitore a saúde dos acólitos em tempo real, manipule a economia de Ruína e Glória, e resolva ataques devastadores de Hordas com a mecânica oficial de Wrath & Glory.
            </p>
          </div>

          {/* Quick Metacurrency Control Card */}
          <div className="flex items-center gap-6 bg-grim-950 p-4 rounded-lg border border-grim-800">
            {/* Ruin */}
            <div className="text-center">
              <span className="text-xs uppercase text-gothic-warpLight font-semibold flex items-center justify-center gap-1">
                <Skull className="w-3.5 h-3.5" /> Ruína
              </span>
              <div className="font-tech text-3xl font-black text-purple-400 my-1">
                {ruin}
              </div>
              <div className="flex items-center justify-center gap-1">
                <button
                  onClick={() => updateMeta(Math.max(0, ruin - 1), glory)}
                  className="px-2 py-0.5 bg-grim-800 hover:bg-grim-700 text-xs text-grim-300 rounded border border-grim-700"
                >
                  -1
                </button>
                <button
                  onClick={() => updateMeta(ruin + 1, glory)}
                  className="px-2 py-0.5 bg-purple-900/60 hover:bg-purple-800 text-xs text-purple-200 rounded border border-purple-700"
                >
                  +1
                </button>
              </div>
            </div>

            <div className="w-px h-12 bg-grim-800" />

            {/* Glory */}
            <div className="text-center">
              <span className="text-xs uppercase text-gothic-gold font-semibold flex items-center justify-center gap-1">
                <Crown className="w-3.5 h-3.5" /> Glória
              </span>
              <div className="font-tech text-3xl font-black text-amber-400 my-1">
                {glory}
              </div>
              <div className="flex items-center justify-center gap-1">
                <button
                  onClick={() => updateMeta(ruin, Math.max(0, glory - 1))}
                  className="px-2 py-0.5 bg-grim-800 hover:bg-grim-700 text-xs text-grim-300 rounded border border-grim-700"
                >
                  -1
                </button>
                <button
                  onClick={() => updateMeta(ruin, glory + 1)}
                  className="px-2 py-0.5 bg-amber-900/60 hover:bg-amber-800 text-xs text-amber-200 rounded border border-amber-700"
                >
                  +1
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Party Overview (Wounds & Shock live progress bars) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gothic-gold" />
            <h3 className="text-lg font-gothic font-bold text-grim-100 uppercase tracking-wider">
              Status da Mesa (Personagens)
            </h3>
          </div>
          <button
            onClick={refreshCharacters}
            className="flex items-center gap-1 text-xs text-grim-400 hover:text-gothic-gold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Sincronizar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {characters.map(char => {
            const woundsPct = Math.min(100, Math.round((char.wounds_current / char.wounds_max) * 100));
            const shockPct = Math.min(100, Math.round((char.shock_current / char.shock_max) * 100));
            const isDying = char.wounds_current <= 0;
            const isExhausted = char.shock_current <= 0;

            return (
              <div 
                key={char.id}
                className="bg-grim-900 border border-grim-700/80 rounded-xl p-5 shadow-lg relative overflow-hidden gothic-corners"
              >
                {/* Character Header */}
                <div className="flex items-start justify-between border-b border-grim-800 pb-3 mb-4">
                  <div>
                    <h4 className="font-gothic font-bold text-base text-grim-100 tracking-wide">
                      {char.name}
                    </h4>
                    <p className="text-xs text-gothic-gold font-tech">
                      {char.archetype} ({char.faction})
                    </p>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-grim-800 border border-grim-700 rounded text-grim-300">
                    Tier {char.tier}
                  </span>
                </div>

                {/* Status Bars */}
                <div className="space-y-4">
                  
                  {/* WOUNDS */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="flex items-center gap-1 font-semibold uppercase text-grim-300">
                        <Heart className="w-3.5 h-3.5 text-rose-500" /> Ferimentos (Wounds)
                      </span>
                      <span className="font-tech text-sm font-bold text-grim-200">
                        {char.wounds_current} / {char.wounds_max}
                      </span>
                    </div>
                    {/* Progress Track */}
                    <div className="h-3 w-full bg-grim-950 rounded-full overflow-hidden border border-grim-800 p-0.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          woundsPct > 50 ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' :
                          woundsPct > 25 ? 'bg-gradient-to-r from-amber-600 to-amber-400' :
                          'bg-gradient-to-r from-red-700 to-rose-500'
                        }`}
                        style={{ width: `${woundsPct}%` }}
                      />
                    </div>
                    {/* Controls */}
                    <div className="flex items-center justify-between mt-1 text-[11px] text-grim-400">
                      <span>{isDying ? <span className="text-red-400 font-bold uppercase animate-pulse">MORRENDO!</span> : `${woundsPct}% Restante`}</span>
                      <div className="flex items-center gap-1">
                        <button
                          title="Causar Ferimento"
                          onClick={() => updateCharacterStatus({
                            characterId: char.id,
                            wounds_current: Math.max(0, char.wounds_current - 1)
                          })}
                          className="px-1.5 py-0.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded border border-rose-800"
                        >
                          -1 Dano
                        </button>
                        <button
                          title="Curar Ferimento"
                          onClick={() => updateCharacterStatus({
                            characterId: char.id,
                            wounds_current: Math.min(char.wounds_max, char.wounds_current + 1)
                          })}
                          className="px-1.5 py-0.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded border border-emerald-800"
                        >
                          +1 Cura
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* SHOCK */}
                  <div>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="flex items-center gap-1 font-semibold uppercase text-grim-300">
                        <Zap className="w-3.5 h-3.5 text-cyan-400" /> Choque (Shock)
                      </span>
                      <span className="font-tech text-sm font-bold text-grim-200">
                        {char.shock_current} / {char.shock_max}
                      </span>
                    </div>
                    {/* Progress Track */}
                    <div className="h-3 w-full bg-grim-950 rounded-full overflow-hidden border border-grim-800 p-0.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          shockPct > 50 ? 'bg-gradient-to-r from-cyan-600 to-cyan-400' :
                          shockPct > 25 ? 'bg-gradient-to-r from-purple-600 to-purple-400' :
                          'bg-gradient-to-r from-red-700 to-red-500'
                        }`}
                        style={{ width: `${shockPct}%` }}
                      />
                    </div>
                    {/* Controls */}
                    <div className="flex items-center justify-between mt-1 text-[11px] text-grim-400">
                      <span>{isExhausted ? <span className="text-amber-400 font-bold uppercase animate-pulse">EXAUSTO!</span> : `${shockPct}% Mental`}</span>
                      <div className="flex items-center gap-1">
                        <button
                          title="Causar Choque"
                          onClick={() => updateCharacterStatus({
                            characterId: char.id,
                            shock_current: Math.max(0, char.shock_current - 1)
                          })}
                          className="px-1.5 py-0.5 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 rounded border border-cyan-800"
                        >
                          -1 Choque
                        </button>
                        <button
                          title="Recuperar Choque"
                          onClick={() => updateCharacterStatus({
                            characterId: char.id,
                            shock_current: Math.min(char.shock_max, char.shock_current + 1)
                          })}
                          className="px-1.5 py-0.5 bg-grim-800 hover:bg-grim-700 text-grim-300 rounded border border-grim-700"
                        >
                          +1 Alívio
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Derived Quick Specs */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-grim-800 text-center">
                    <div className="bg-grim-950 p-1.5 rounded border border-grim-800">
                      <span className="block text-[9px] uppercase text-grim-500 font-bold">Defesa</span>
                      <span className="font-tech text-sm font-bold text-gothic-gold">{char.defence}</span>
                    </div>
                    <div className="bg-grim-950 p-1.5 rounded border border-grim-800">
                      <span className="block text-[9px] uppercase text-grim-500 font-bold">Resiliência</span>
                      <span className="font-tech text-sm font-bold text-grim-200">{char.resilience}</span>
                    </div>
                    <div className="bg-grim-950 p-1.5 rounded border border-grim-800">
                      <span className="block text-[9px] uppercase text-grim-500 font-bold">Ira (Wrath)</span>
                      <span className="font-tech text-sm font-bold text-amber-400">{char.wrath_points}</span>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Horde / Mob Management Panel */}
      <div className="bg-grim-900 border border-grim-700 rounded-xl p-6 shadow-xl gothic-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-grim-800 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-red-500" />
              <h3 className="text-xl font-gothic font-bold text-red-400 uppercase tracking-wider">
                Painel de Hordas & Criaturas (Mobs)
              </h3>
            </div>
            <p className="text-xs text-grim-400 mt-0.5">
              Regra Oficial W&G: O ataque da horda ganha <strong className="text-amber-300">+1 Dado Bônus</strong> para cada criatura no Mob, limitado à <strong className="text-amber-300">metade do total</strong> da horda.
            </p>
          </div>

          <button
            onClick={() => setShowAddMob(!showAddMob)}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-950 hover:bg-red-900 border border-red-700 text-red-200 text-xs font-bold uppercase rounded shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Horda</span>
          </button>
        </div>

        {/* Add Mob Form */}
        {showAddMob && (
          <form onSubmit={handleCreateMob} className="mb-6 bg-grim-950 p-4 rounded-lg border border-red-900/50 animate-fadeIn">
            <h4 className="text-sm font-gothic font-bold text-red-300 uppercase mb-3">
              Cadastrar Nova Horda na Campanha
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] uppercase text-grim-400 font-semibold mb-1">Nome da Horda</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Horda de Cultistas Hereges"
                  value={newMobName}
                  onChange={e => setNewMobName(e.target.value)}
                  className="w-full bg-grim-900 border border-grim-700 rounded px-3 py-1.5 text-xs text-grim-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase text-grim-400 font-semibold mb-1">Total de Criaturas</label>
                <input
                  type="number"
                  min="2"
                  value={newMobCount}
                  onChange={e => setNewMobCount(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-grim-900 border border-grim-700 rounded px-3 py-1.5 text-xs text-grim-100 outline-none font-tech"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase text-grim-400 font-semibold mb-1">Atributo Base (FOR/AGI)</label>
                <input
                  type="number"
                  min="1"
                  value={newMobAttr}
                  onChange={e => setNewMobAttr(Number(e.target.value))}
                  className="w-full bg-grim-900 border border-grim-700 rounded px-3 py-1.5 text-xs text-grim-100 outline-none font-tech"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
              <div>
                <label className="block text-[11px] uppercase text-grim-400 font-semibold mb-1">Perícia Base</label>
                <input
                  type="number"
                  min="0"
                  value={newMobSkill}
                  onChange={e => setNewMobSkill(Number(e.target.value))}
                  className="w-full bg-grim-900 border border-grim-700 rounded px-3 py-1.5 text-xs text-grim-100 outline-none font-tech"
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-[11px] uppercase text-grim-400 font-semibold mb-1">Anotações Táticas / Armas</label>
                <input
                  type="text"
                  placeholder="Ex: Armados com autoguns e facas enferrujadas..."
                  value={newMobNotes}
                  onChange={e => setNewMobNotes(e.target.value)}
                  className="w-full bg-grim-900 border border-grim-700 rounded px-3 py-1.5 text-xs text-grim-100 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddMob(false)}
                className="px-3 py-1 text-xs text-grim-400 hover:text-white rounded"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1 bg-red-800 hover:bg-red-700 text-white font-bold text-xs uppercase rounded shadow"
              >
                Criar Horda
              </button>
            </div>
          </form>
        )}

        {/* Mob Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mobs.map(mob => {
            const hordeBonus = Math.floor(mob.creature_count / 2);
            const totalAttackPool = mob.base_attribute + mob.base_skill + hordeBonus;

            return (
              <div 
                key={mob.id}
                className="bg-grim-950 p-4 rounded-lg border border-red-950/80 hover:border-red-800/80 transition shadow relative"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-gothic font-bold text-base text-red-300">
                      {mob.name}
                    </h4>
                    <p className="text-[11px] text-grim-400">
                      {mob.notes || 'Horda de infantaria.'}
                    </p>
                  </div>
                  {/* Creature count badge with controls */}
                  <div className="flex items-center gap-1 bg-grim-900 px-2 py-1 rounded border border-grim-800">
                    <button
                      title="Baixa na Horda (-1 criatura)"
                      onClick={() => handleUpdateMobCount(mob, -1)}
                      className="p-0.5 hover:bg-grim-800 text-red-400 rounded"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-tech text-sm font-bold text-grim-100 min-w-[32px] text-center">
                      {mob.creature_count} <span className="text-[9px] text-grim-500 font-normal">UN</span>
                    </span>
                    <button
                      title="Reforço na Horda (+1 criatura)"
                      onClick={() => handleUpdateMobCount(mob, 1)}
                      className="p-0.5 hover:bg-grim-800 text-emerald-400 rounded"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Stat breakdown */}
                <div className="grid grid-cols-3 gap-2 text-center bg-grim-900/60 p-2 rounded mb-3 text-xs">
                  <div>
                    <span className="block text-[9px] uppercase text-grim-500">Base</span>
                    <span className="font-tech font-bold text-grim-300">{mob.base_attribute + mob.base_skill}d6</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase text-amber-400 font-bold">Bônus Horda</span>
                    <span className="font-tech font-bold text-amber-400">+{hordeBonus}d6</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase text-red-400 font-bold">Total Parada</span>
                    <span className="font-tech font-black text-red-400 text-sm">{totalAttackPool}d6</span>
                  </div>
                </div>

                {/* Roll attack action */}
                <button
                  onClick={() => handleRollMobAttack(mob)}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-amber-200 font-gothic font-bold text-xs uppercase tracking-wider rounded border border-red-600/60 shadow active:scale-98 transition"
                >
                  <Swords className="w-4 h-4 text-amber-300" />
                  <span>Rolar Ataque da Horda ({totalAttackPool}d6)</span>
                </button>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}

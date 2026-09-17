import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { useUser } from '../context/UserContext';
import { apiUrl } from '../config';
import {
  ATTRIBUTES,
  SKILLS,
  TIER_XP_BUDGET,
  SPECIES_LIST,
  ARCHETYPES,
  getAttributeTotalCost,
  getSkillTotalCost,
  calculateDerivedStats
} from '../utils/wgRules';
import { UserPlus, Shield, CheckCircle2, AlertTriangle, ChevronRight, ChevronLeft, Plus, Minus, Swords, Heart, Zap, Sparkles } from 'lucide-react';

export default function CharacterCreator({ onCreated }) {
  const { activeCampaign, currentCampaignId, refreshCharacters } = useSocket();
  const { authHeaders } = useUser();
  const campaignId = activeCampaign?.id || currentCampaignId;

  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [tier, setTier] = useState(2);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('Humano');
  const [faction, setFaction] = useState('Adepta Sororitas');
  const [archetype, setArchetype] = useState('Irmã de Batalha (Sister of Battle)');
  const [keywords, setKeywords] = useState('IMPERIUM, HUMANO');
  const [notes, setNotes] = useState('');

  // Attributes (base minimum 1)
  const [attributes, setAttributes] = useState({
    strength: 2,
    toughness: 2,
    agility: 2,
    initiative: 2,
    willpower: 2,
    intellect: 2,
    fellowship: 2
  });

  // Skills (base minimum 0)
  const [skills, setSkills] = useState({
    athletics: 1, awareness: 1, ballistic_skill: 2, cunning: 0,
    deception: 0, insight: 1, intimidation: 1, investigation: 0,
    leadership: 1, medicae: 0, persuasion: 1, pilot: 0,
    psychic_mastery: 0, scholar: 1, stealth: 0, survival: 0,
    tech: 0, weapon_skill: 2
  });

  const [armourBonus, setArmourBonus] = useState(3);
  const [weaponsList, setWeaponsList] = useState([
    { name: 'Rifle Laser Padrão (Lasgun)', damage: '7+1ED', ap: '0', range: '24m', traits: 'Confiável' },
    { name: 'Faca de Combate', damage: '4+1ED', ap: '0', range: 'Corpo a Corpo', traits: 'Leve' }
  ]);

  // Compute Total XP Spent
  const xpBudget = TIER_XP_BUDGET[tier] || 200;

  let attrXpSpent = 0;
  for (const attr of ATTRIBUTES) {
    attrXpSpent += getAttributeTotalCost(attributes[attr.key] || 1);
  }

  let skillXpSpent = 0;
  for (const skill of SKILLS) {
    skillXpSpent += getSkillTotalCost(skills[skill.key] || 0);
  }

  // Selected species base cost
  const selectedSpeciesObj = SPECIES_LIST.find(s => s.name === species);
  const speciesCost = selectedSpeciesObj ? selectedSpeciesObj.baseCost : 0;

  const totalXpSpent = attrXpSpent + skillXpSpent + speciesCost;
  const isOverBudget = totalXpSpent > xpBudget;
  const xpRemaining = xpBudget - totalXpSpent;

  // Derived Stats Calculation
  const derived = calculateDerivedStats(tier, attributes, armourBonus);

  // Archetype change helper
  const handleSelectArchetype = (arch) => {
    setArchetype(arch.name);
    setFaction(arch.faction);
    setSpecies(arch.species);
    setTier(arch.tier);
  };

  // Attribute change
  const handleAttrChange = (key, delta) => {
    const current = attributes[key] || 1;
    const nextVal = Math.max(1, Math.min(12, current + delta));
    setAttributes(prev => ({ ...prev, [key]: nextVal }));
  };

  // Skill change
  const handleSkillChange = (key, delta) => {
    const current = skills[key] || 0;
    const nextVal = Math.max(0, Math.min(8, current + delta));
    setSkills(prev => ({ ...prev, [key]: nextVal }));
  };

  // Submit
  const handleFinalizeCharacter = async () => {
    if (!name.trim()) {
      alert('Por favor, defina um nome para o personagem no Passo 1.');
      setCurrentStep(1);
      return;
    }

    if (isOverBudget) {
      alert(`Você ultrapassou o orçamento de XP do Tier ${tier}! Ajuste atributos ou perícias para ficar até ${xpBudget} XP.`);
      return;
    }

    const payload = {
      campaign_id: campaignId,
      name,
      species,
      faction,
      archetype,
      tier,
      rank: 1,
      ...attributes,
      skills,
      armour_bonus: armourBonus,
      speed: selectedSpeciesObj ? selectedSpeciesObj.speed : 6,
      keywords,
      wargear: weaponsList,
      notes
    };

    try {
      const res = await fetch(apiUrl('/api/characters'), {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        refreshCharacters();
        if (onCreated) onCreated();
      } else {
        const err = await res.json();
        alert('Erro ao criar personagem: ' + err.error);
      }
    } catch (err) {
      console.error(err);
      alert('Falha na comunicação com o servidor.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      
      {/* Step Indicator Header */}
      <div className="bg-grim-900 border border-gothic-gold/40 rounded-xl p-5 shadow-lg gothic-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-grim-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-gothic-gold" />
            <h2 className="text-xl font-gothic font-bold text-gothic-gold uppercase tracking-wider">
              Criador de Personagem (Passo a Passo)
            </h2>
          </div>

          {/* XP Tracker Badge */}
          <div className={`px-4 py-2 rounded-lg border flex items-center gap-3 ${
            isOverBudget 
              ? 'bg-rose-950/80 border-rose-500 text-rose-300' 
              : 'bg-grim-950 border-amber-500/50 text-amber-300'
          }`}>
            <div>
              <span className="block text-[10px] uppercase font-tech tracking-wider text-grim-400">
                Orçamento de XP (Tier {tier})
              </span>
              <div className="font-tech text-lg font-black">
                {totalXpSpent} / {xpBudget} XP{' '}
                <span className="text-xs font-normal text-grim-400">
                  ({xpRemaining >= 0 ? `${xpRemaining} livres` : `${Math.abs(xpRemaining)} excedidos!`})
                </span>
              </div>
            </div>
            {isOverBudget && <AlertTriangle className="w-5 h-5 text-rose-500 animate-bounce" />}
          </div>
        </div>

        {/* Steps Breadcrumb */}
        <div className="flex items-center justify-between text-xs font-gothic font-semibold uppercase tracking-wider overflow-x-auto gap-2">
          {[
            { num: 1, title: 'Conceito & Tier' },
            { num: 2, title: 'Arquétipo & Espécie' },
            { num: 3, title: 'Atributos' },
            { num: 4, title: 'Perícias' },
            { num: 5, title: 'Revisão & Derivados' }
          ].map(s => (
            <button
              key={s.num}
              onClick={() => setCurrentStep(s.num)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded transition whitespace-nowrap ${
                currentStep === s.num 
                  ? 'bg-gothic-gold text-grim-950 font-bold shadow' 
                  : 'text-grim-400 hover:text-white bg-grim-950 border border-grim-800'
              }`}
            >
              <span>{s.num}.</span>
              <span>{s.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* STEP 1: Concept & Tier */}
      {currentStep === 1 && (
        <div className="bg-grim-900 border border-grim-800 rounded-xl p-6 shadow space-y-5 animate-fadeIn">
          <h3 className="text-base font-gothic font-bold text-gothic-gold uppercase tracking-wider">
            Passo 1: Grau de Poder (Tier) & Identidade
          </h3>

          {/* Tier Selection Cards */}
          <div>
            <label className="block text-xs uppercase text-grim-400 font-semibold mb-2">
              Escolha o Tier da Campanha (Limite de XP)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[
                { t: 1, xp: 100, label: 'Tier 1: Sobrevivência', sub: 'Acólitos, Guardas, Escória' },
                { t: 2, xp: 200, label: 'Tier 2: Veteranos', sub: 'Irmãs de Batalha, Scouts, Skitarii' },
                { t: 3, xp: 300, label: 'Tier 3: Lendas Menores', sub: 'Space Marines, Comissários, Nobz' },
                { t: 4, xp: 400, label: 'Tier 4: Heróis Épicos', sub: 'Primaris Astartes, Inquisidores' },
              ].map(item => (
                <div
                  key={item.t}
                  onClick={() => setTier(item.t)}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    tier === item.t 
                      ? 'bg-gradient-to-br from-amber-950/60 to-grim-950 border-gothic-gold shadow-[0_0_12px_rgba(203,163,56,0.3)]' 
                      : 'bg-grim-950 border-grim-800 hover:border-grim-700'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-gothic font-bold text-sm text-grim-100">{item.label}</span>
                    <span className="font-tech text-xs font-bold text-gothic-gold">{item.xp} XP</span>
                  </div>
                  <p className="text-[11px] text-grim-400">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Character Name & Keywords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase text-grim-400 font-semibold mb-1">
                Nome do Personagem *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Irmã Vaelith, Sargento Thorne..."
                className="w-full bg-grim-950 border border-grim-700 focus:border-gothic-gold rounded px-3 py-2 text-sm text-grim-100 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs uppercase text-grim-400 font-semibold mb-1">
                Palavras-Chave (Keywords)
              </label>
              <input
                type="text"
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                placeholder="Ex: IMPERIUM, HUMANO, ADEPTUS ASTARTES"
                className="w-full bg-grim-950 border border-grim-700 focus:border-gothic-gold rounded px-3 py-2 text-sm text-grim-100 outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Species & Archetypes */}
      {currentStep === 2 && (
        <div className="bg-grim-900 border border-grim-800 rounded-xl p-6 shadow space-y-6 animate-fadeIn">
          <h3 className="text-base font-gothic font-bold text-gothic-gold uppercase tracking-wider">
            Passo 2: Arquétipo & Espécie
          </h3>

          {/* Archetypes for current Tier */}
          <div>
            <label className="block text-xs uppercase text-grim-400 font-semibold mb-2">
              Arquétipos Recomendados para Tier {tier}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
              {ARCHETYPES.filter(a => a.tier <= tier).map(a => (
                <div
                  key={a.name}
                  onClick={() => handleSelectArchetype(a)}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    archetype === a.name 
                      ? 'bg-gradient-to-r from-amber-950/60 to-grim-950 border-gothic-gold shadow' 
                      : 'bg-grim-950 border-grim-800 hover:border-grim-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-gothic font-bold text-sm text-grim-100">{a.name}</span>
                    <span className="text-[10px] uppercase font-bold text-amber-400 px-1.5 py-0.5 bg-grim-900 rounded border border-grim-800">
                      Tier {a.tier}
                    </span>
                  </div>
                  <div className="text-[11px] text-gothic-gold font-tech mt-0.5">{a.faction} • {a.species}</div>
                  <p className="text-xs text-grim-400 mt-1">{a.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Species */}
          <div>
            <label className="block text-xs uppercase text-grim-400 font-semibold mb-2">
              Espécie (Custo de XP)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {SPECIES_LIST.map(s => (
                <div
                  key={s.name}
                  onClick={() => setSpecies(s.name)}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    species === s.name 
                      ? 'bg-amber-950/40 border-gothic-gold' 
                      : 'bg-grim-950 border-grim-800 hover:border-grim-700'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-gothic font-bold text-sm text-grim-100">{s.name}</span>
                    <span className="font-tech text-xs text-gothic-gold">
                      {s.baseCost > 0 ? `${s.baseCost} XP` : 'Grátis'}
                    </span>
                  </div>
                  <p className="text-[11px] text-grim-400 mt-1">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Attributes Distribution */}
      {currentStep === 3 && (
        <div className="bg-grim-900 border border-grim-800 rounded-xl p-6 shadow space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-gothic font-bold text-gothic-gold uppercase tracking-wider">
              Passo 3: Distribuição de Atributos Principais
            </h3>
            <span className="text-xs font-tech text-grim-400">
              XP Gasto em Atributos: <strong className="text-amber-300">{attrXpSpent} XP</strong>
            </span>
          </div>
          <p className="text-xs text-grim-400">
            O custo por nível sobe progressivamente conforme as tabelas oficiais (Nível 2: 4 XP, Nível 3: +6 XP, Nível 4: +10 XP, etc.).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ATTRIBUTES.map(attr => {
              const val = attributes[attr.key] || 1;
              const cost = getAttributeTotalCost(val);
              return (
                <div key={attr.key} className="bg-grim-950 p-3 rounded-lg border border-grim-800 flex items-center justify-between">
                  <div>
                    <span className="font-gothic font-bold text-sm text-grim-200">
                      {attr.name} ({attr.short})
                    </span>
                    <p className="text-[10px] text-grim-500">{attr.desc}</p>
                    <span className="text-[10px] text-amber-400/80 font-tech">Custo: {cost} XP</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAttrChange(attr.key, -1)}
                      className="w-7 h-7 flex items-center justify-center bg-grim-800 hover:bg-grim-700 text-grim-200 rounded border border-grim-700"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-tech text-lg font-bold text-gothic-gold min-w-[28px] text-center">
                      {val}
                    </span>
                    <button
                      onClick={() => handleAttrChange(attr.key, 1)}
                      className="w-7 h-7 flex items-center justify-center bg-grim-800 hover:bg-grim-700 text-grim-200 rounded border border-grim-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 4: Skills Distribution */}
      {currentStep === 4 && (
        <div className="bg-grim-900 border border-grim-800 rounded-xl p-6 shadow space-y-4 animate-fadeIn">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-gothic font-bold text-gothic-gold uppercase tracking-wider">
              Passo 4: Treinamento de Perícias (0 a 8)
            </h3>
            <span className="text-xs font-tech text-grim-400">
              XP Gasto em Perícias: <strong className="text-amber-300">{skillXpSpent} XP</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
            {SKILLS.map(skill => {
              const val = skills[skill.key] || 0;
              const cost = getSkillTotalCost(val);
              const attrVal = attributes[skill.attribute] || 1;
              const pool = attrVal + val;

              return (
                <div key={skill.key} className="bg-grim-950 p-2.5 rounded-lg border border-grim-800 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-xs text-grim-200">{skill.name}</span>
                      <span className="text-[9px] text-grim-500 uppercase font-tech">[{skill.attrShort}]</span>
                    </div>
                    <span className="text-[10px] text-amber-400/80 font-tech">
                      Parada: {pool}d6 ({cost} XP)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleSkillChange(skill.key, -1)}
                      className="w-6 h-6 flex items-center justify-center bg-grim-800 hover:bg-grim-700 text-grim-200 rounded text-xs"
                    >
                      -
                    </button>
                    <span className="font-tech text-base font-bold text-grim-100 min-w-[20px] text-center">
                      {val}
                    </span>
                    <button
                      onClick={() => handleSkillChange(skill.key, 1)}
                      className="w-6 h-6 flex items-center justify-center bg-grim-800 hover:bg-grim-700 text-grim-200 rounded text-xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 5: Review & Finalize */}
      {currentStep === 5 && (
        <div className="bg-grim-900 border border-grim-800 rounded-xl p-6 shadow space-y-6 animate-fadeIn">
          <h3 className="text-base font-gothic font-bold text-gothic-gold uppercase tracking-wider">
            Passo 5: Resumo e Consagração da Ficha
          </h3>

          {/* Derived Stats Calculation Output */}
          <div>
            <span className="block text-xs uppercase tracking-wider text-grim-400 font-semibold mb-2">
              Status Derivados Automáticos:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-grim-950 p-3 rounded-lg border border-red-900/40">
                <span className="text-[10px] uppercase text-rose-400 font-bold block">Ferimentos Máximos</span>
                <span className="font-tech text-2xl font-black text-white">{derived.wounds_max}</span>
                <span className="text-[9px] text-grim-500 block">(Tier {tier} * 2) + RES {attributes.toughness}</span>
              </div>
              <div className="bg-grim-950 p-3 rounded-lg border border-cyan-900/40">
                <span className="text-[10px] uppercase text-cyan-400 font-bold block">Choque Máximo</span>
                <span className="font-tech text-2xl font-black text-white">{derived.shock_max}</span>
                <span className="text-[9px] text-grim-500 block">Tier {tier} + VON {attributes.willpower}</span>
              </div>
              <div className="bg-grim-950 p-3 rounded-lg border border-grim-800">
                <span className="text-[10px] uppercase text-grim-400 font-bold block">Defesa</span>
                <span className="font-tech text-2xl font-black text-gothic-gold">{derived.defence}</span>
                <span className="text-[9px] text-grim-500 block">Iniciativa {attributes.initiative} - 1</span>
              </div>
              <div className="bg-grim-950 p-3 rounded-lg border border-grim-800">
                <span className="text-[10px] uppercase text-grim-400 font-bold block">Resiliência</span>
                <span className="font-tech text-2xl font-black text-grim-200">{derived.resilience}</span>
                <span className="text-[9px] text-grim-500 block">RES {attributes.toughness} + 1 + Armadura {armourBonus}</span>
              </div>
            </div>
          </div>

          {/* Armour and Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase text-grim-400 font-semibold mb-1">
                Bônus da Armadura
              </label>
              <input
                type="number"
                min="0"
                value={armourBonus}
                onChange={e => setArmourBonus(Number(e.target.value))}
                className="w-full bg-grim-950 border border-grim-700 rounded px-3 py-1.5 text-sm text-grim-100 font-tech"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs uppercase text-grim-400 font-semibold mb-1">
                Anotações Narrativas / Histórico
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ex: Sobrevivente da Batalha de Avachrus..."
                className="w-full bg-grim-950 border border-grim-700 rounded px-3 py-1.5 text-sm text-grim-100"
              />
            </div>
          </div>

          {/* Validation Warning */}
          {isOverBudget ? (
            <div className="bg-rose-950/60 border border-rose-600 rounded-lg p-3 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>
                Atenção: O personagem ultrapassa o limite de gastos de XP em <strong>{Math.abs(xpRemaining)} XP</strong>. Reduza alguns atributos ou perícias antes de consagrar.
              </span>
            </div>
          ) : (
            <div className="bg-emerald-950/60 border border-emerald-600 rounded-lg p-3 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                Ficha em conformidade com as regras do Tier {tier}! XP restante: {xpRemaining} XP.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center pt-2">
        <button
          disabled={currentStep === 1}
          onClick={() => setCurrentStep(prev => prev - 1)}
          className="flex items-center gap-1 px-4 py-2 bg-grim-900 hover:bg-grim-800 text-grim-300 rounded border border-grim-700 disabled:opacity-30 text-xs font-bold uppercase transition"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>

        {currentStep < 5 ? (
          <button
            onClick={() => setCurrentStep(prev => prev + 1)}
            className="flex items-center gap-1 px-6 py-2 bg-gothic-gold hover:bg-amber-400 text-grim-950 rounded font-gothic font-bold text-xs uppercase tracking-wider shadow transition"
          >
            Avançar <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleFinalizeCharacter}
            disabled={isOverBudget}
            className="flex items-center gap-2 px-8 py-2.5 bg-gradient-to-r from-gothic-gold to-amber-500 hover:from-amber-400 hover:to-gothic-gold text-grim-950 rounded font-gothic font-black text-sm uppercase tracking-widest shadow-lg shadow-gothic-gold/30 disabled:opacity-40 transition active:scale-95"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Consagrar Personagem no Sanctum</span>
          </button>
        )}
      </div>

    </div>
  );
}

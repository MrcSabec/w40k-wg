import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { ATTRIBUTES, SKILLS } from '../utils/wgRules';
import { Shield, Heart, Zap, Flame, Dices, Crosshair, Swords, Award, BookOpen, User, Tag } from 'lucide-react';

export default function CharacterSheet({ onOpenRoller }) {
  const { characters, updateCharacterStatus } = useSocket();
  const [selectedCharId, setSelectedCharId] = useState(characters[0]?.id || null);

  const character = characters.find(c => c.id === selectedCharId) || characters[0];

  if (!character) {
    return (
      <div className="bg-grim-900 border border-grim-800 rounded-xl p-12 text-center gothic-panel">
        <User className="w-12 h-12 text-grim-600 mx-auto mb-3" />
        <h3 className="text-xl font-gothic font-bold text-gothic-gold">Nenhum Personagem Encontrado</h3>
        <p className="text-sm text-grim-400 mt-1">Crie um novo personagem usando a aba "Criador de Fichas".</p>
      </div>
    );
  }

  const skills = character.skills || {};
  const wargear = Array.isArray(character.wargear) ? character.wargear : [];
  const talents = Array.isArray(character.talents) ? character.talents : [];

  // Handler to roll an attribute directly
  const handleRollAttribute = (attr) => {
    const val = character[attr.key] || 1;
    onOpenRoller({
      poolSize: val,
      label: `Teste de ${attr.name} (${attr.short})`,
      attributeName: attr.name,
      skillName: ''
    });
  };

  // Handler to roll a skill (Attribute + Skill)
  const handleRollSkill = (skill) => {
    const attrVal = character[skill.attribute] || 1;
    const skillVal = skills[skill.key] || 0;
    const totalPool = attrVal + skillVal;

    onOpenRoller({
      poolSize: totalPool,
      label: `Teste de ${skill.name} [${skill.attrShort} ${attrVal} + Perícia ${skillVal}]`,
      attributeName: skill.attribute,
      skillName: skill.name
    });
  };

  // Handler to roll weapon attack
  const handleRollWeapon = (item) => {
    const isRanged = item.range && item.range.toLowerCase().includes('m');
    const skillKey = isRanged ? 'ballistic_skill' : 'weapon_skill';
    const attrKey = isRanged ? 'agility' : 'initiative';
    
    const attrVal = character[attrKey] || 1;
    const skillVal = skills[skillKey] || 0;
    const totalPool = attrVal + skillVal;

    onOpenRoller({
      poolSize: totalPool,
      label: `Ataque: ${item.name} (${isRanged ? 'Balístico' : 'Corpo a Corpo'}) - Dano: ${item.damage}`,
      attributeName: attrKey,
      skillName: skillKey
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Character Switcher & Quick Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-grim-900 border border-grim-800 rounded-xl p-4 shadow">
        <div className="flex items-center gap-3">
          <label className="text-xs uppercase text-grim-400 font-tech">Dataslate Ativo:</label>
          <select
            value={character.id}
            onChange={e => setSelectedCharId(Number(e.target.value))}
            className="bg-grim-950 border border-gothic-gold/50 rounded px-3 py-1.5 text-sm font-gothic font-bold text-gothic-gold outline-none"
          >
            {characters.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} — {c.archetype} (Tier {c.tier})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 text-xs font-tech text-grim-400">
          <div>
            <span className="text-grim-500">EXPERIÊNCIA:</span>{' '}
            <span className="text-gothic-gold font-bold">{character.xp_spent} / {character.xp_total} XP</span>
          </div>
          <div className="w-px h-4 bg-grim-700" />
          <div>
            <span className="text-grim-500">RANK:</span>{' '}
            <span className="text-white font-bold">{character.rank}</span>
          </div>
        </div>
      </div>

      {/* Main Dataslate Sheet */}
      <div className="bg-grim-900 border-2 border-gothic-gold/40 rounded-xl p-6 shadow-2xl gothic-panel-gold gothic-corners relative">
        
        {/* Header: Identity & Archetype */}
        <div className="border-b border-grim-800 pb-5 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-tech text-gothic-gold tracking-widest uppercase">
                DATASLATE OFICIAL DO IMPERIUM // SANCTUM CLASSIFIED
              </span>
              <h2 className="text-3xl font-gothic font-black text-grim-100 tracking-wide mt-0.5">
                {character.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-semibold">
                <span className="px-2.5 py-1 bg-grim-950 border border-amber-500/40 text-amber-300 rounded">
                  {character.archetype}
                </span>
                <span className="px-2.5 py-1 bg-grim-950 border border-grim-700 text-grim-300 rounded">
                  {character.species}
                </span>
                <span className="px-2.5 py-1 bg-grim-950 border border-grim-700 text-grim-300 rounded">
                  {character.faction}
                </span>
                <span className="px-2.5 py-1 bg-red-950 border border-red-700 text-red-300 rounded">
                  Tier {character.tier}
                </span>
              </div>
            </div>

            {/* Metacurrency Individual: Wrath Points */}
            <div className="bg-grim-950 p-4 rounded-lg border border-amber-500/30 flex items-center gap-4">
              <div className="flex items-center gap-2 text-amber-400">
                <Flame className="w-6 h-6 text-red-500" />
                <div>
                  <span className="block text-[10px] uppercase font-gothic font-bold text-grim-400">Pontos de Ira (Wrath)</span>
                  <span className="font-tech text-2xl font-black text-amber-300">{character.wrath_points}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  title="Gastar Ponto de Ira"
                  onClick={() => updateCharacterStatus({ characterId: character.id, wrath_points: Math.max(0, character.wrath_points - 1) })}
                  className="px-2 py-0.5 bg-grim-800 hover:bg-grim-700 text-xs text-grim-300 rounded border border-grim-700"
                >
                  -1
                </button>
                <button
                  title="Adicionar Ponto de Ira"
                  onClick={() => updateCharacterStatus({ characterId: character.id, wrath_points: character.wrath_points + 1 })}
                  className="px-2 py-0.5 bg-amber-900/60 hover:bg-amber-800 text-xs text-amber-200 rounded border border-amber-700"
                >
                  +1
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* COMBAT VITALS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-8">
          
          {/* WOUNDS */}
          <div className="bg-grim-950 p-3 rounded-lg border border-red-900/60 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-500" /> Ferimentos
            </span>
            <div className="font-tech text-2xl font-black text-grim-100 my-1">
              {character.wounds_current} <span className="text-sm text-grim-500">/ {character.wounds_max}</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <button
                onClick={() => updateCharacterStatus({ characterId: character.id, wounds_current: Math.max(0, character.wounds_current - 1) })}
                className="flex-1 py-0.5 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded text-xs"
              >
                -1
              </button>
              <button
                onClick={() => updateCharacterStatus({ characterId: character.id, wounds_current: Math.min(character.wounds_max, character.wounds_current + 1) })}
                className="flex-1 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded text-xs"
              >
                +1
              </button>
            </div>
          </div>

          {/* SHOCK */}
          <div className="bg-grim-950 p-3 rounded-lg border border-cyan-900/60 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-cyan-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-400" /> Choque
            </span>
            <div className="font-tech text-2xl font-black text-grim-100 my-1">
              {character.shock_current} <span className="text-sm text-grim-500">/ {character.shock_max}</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <button
                onClick={() => updateCharacterStatus({ characterId: character.id, shock_current: Math.max(0, character.shock_current - 1) })}
                className="flex-1 py-0.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 rounded text-xs"
              >
                -1
              </button>
              <button
                onClick={() => updateCharacterStatus({ characterId: character.id, shock_current: Math.min(character.shock_max, character.shock_current + 1) })}
                className="flex-1 py-0.5 bg-grim-800 hover:bg-grim-700 text-grim-300 rounded text-xs"
              >
                +1
              </button>
            </div>
          </div>

          {/* DEFENCE */}
          <div className="bg-grim-950 p-3 rounded-lg border border-grim-800 text-center flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold text-grim-400">Defesa (INI - 1)</span>
            <div className="font-tech text-2xl font-black text-gothic-gold mt-1">
              {character.defence}
            </div>
            <span className="text-[9px] text-grim-500">DN para acertar</span>
          </div>

          {/* RESILIENCE */}
          <div className="bg-grim-950 p-3 rounded-lg border border-grim-800 text-center flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold text-grim-400">Resiliência</span>
            <div className="font-tech text-2xl font-black text-grim-200 mt-1">
              {character.resilience}
            </div>
            <span className="text-[9px] text-grim-500">Armadura: +{character.armour_bonus}</span>
          </div>

          {/* DETERMINATION */}
          <div className="bg-grim-950 p-3 rounded-lg border border-grim-800 text-center flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold text-grim-400">Determinação</span>
            <div className="font-tech text-2xl font-black text-grim-200 mt-1">
              {character.determination}
            </div>
            <span className="text-[9px] text-grim-500">Resiste a dano</span>
          </div>

          {/* SPEED */}
          <div className="bg-grim-950 p-3 rounded-lg border border-grim-800 text-center flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold text-grim-400">Velocidade</span>
            <div className="font-tech text-2xl font-black text-grim-200 mt-1">
              {character.speed}m
            </div>
            <span className="text-[9px] text-grim-500">Por turno</span>
          </div>

        </div>

        {/* SECTION: ATTRIBUTES GRID (Click to roll) */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm uppercase font-gothic font-bold text-gothic-gold tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-gothic-gold" /> Atributos Principais (Clique para Rolar)
            </h3>
            <span className="text-[11px] text-grim-500 font-tech">DADO DE IRA ATIVO AUTOMATICAMENTE</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {ATTRIBUTES.map(attr => {
              const val = character[attr.key] || 1;
              return (
                <button
                  key={attr.key}
                  onClick={() => handleRollAttribute(attr)}
                  className="group bg-grim-950 hover:bg-grim-800/80 border border-grim-800 hover:border-gothic-gold/70 rounded-lg p-3 text-center transition-all duration-200 shadow hover:shadow-gothic-gold/20 flex flex-col items-center justify-between"
                >
                  <span className="text-[11px] font-bold text-grim-400 group-hover:text-gothic-gold transition uppercase">
                    {attr.name}
                  </span>
                  <span className="font-tech text-2xl font-black text-grim-100 group-hover:text-white my-1">
                    {val}
                  </span>
                  <span className="text-[9px] text-grim-500 uppercase tracking-tighter">
                    {val}d6
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION: SKILLS LIST (Click to roll pool: Attr + Skill) */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm uppercase font-gothic font-bold text-gothic-gold tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gothic-gold" /> Perícias Treinadas (Atributo + Perícia)
            </h3>
            <span className="text-[11px] text-grim-500 font-tech">CLIQUE PARA ROLAR PARADA COMPLETA</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {SKILLS.map(skill => {
              const skillVal = skills[skill.key] || 0;
              const attrVal = character[skill.attribute] || 1;
              const totalPool = attrVal + skillVal;

              return (
                <button
                  key={skill.key}
                  onClick={() => handleRollSkill(skill)}
                  className="group flex items-center justify-between bg-grim-950 hover:bg-grim-800 border border-grim-800 hover:border-gothic-gold/60 rounded-lg px-3 py-2 text-left transition shadow hover:shadow-gothic-gold/15"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-grim-200 group-hover:text-gothic-gold transition">
                        {skill.name}
                      </span>
                      <span className="text-[9px] uppercase px-1 py-0.2 bg-grim-900 border border-grim-700 text-grim-400 rounded font-tech">
                        {skill.attrShort}
                      </span>
                    </div>
                    <span className="text-[10px] text-grim-500">
                      Nível: {skillVal} (Atributo: {attrVal})
                    </span>
                  </div>

                  <div className="flex items-center gap-1 bg-grim-900 group-hover:bg-gothic-gold/20 px-2 py-1 rounded border border-grim-800 group-hover:border-gothic-gold/40 transition">
                    <Dices className="w-3.5 h-3.5 text-gothic-gold" />
                    <span className="font-tech text-sm font-bold text-gothic-gold">
                      {totalPool}d6
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION: WARGEAR & WEAPONS */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm uppercase font-gothic font-bold text-red-400 tracking-wider flex items-center gap-2">
              <Swords className="w-4 h-4 text-red-400" /> Equipamento & Armas de Combate
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {wargear.map((item, idx) => (
              <div 
                key={idx}
                className="bg-grim-950 border border-grim-800 rounded-lg p-3 flex items-center justify-between gap-4 hover:border-grim-700 transition"
              >
                <div>
                  <h4 className="font-gothic font-bold text-xs text-grim-200">
                    {item.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-grim-400 font-tech">
                    {item.damage && <span>Dano: <strong className="text-red-400">{item.damage}</strong></span>}
                    {item.ap && <span>AP: {item.ap}</span>}
                    {item.range && <span>Alcance: {item.range}</span>}
                    {item.armour && <span>Armadura: +{item.armour}</span>}
                    {item.traits && <span className="text-grim-500 italic">[{item.traits}]</span>}
                  </div>
                </div>

                {item.damage && (
                  <button
                    onClick={() => handleRollWeapon(item)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-950 hover:bg-red-900 border border-red-700 text-amber-200 text-xs font-bold font-gothic uppercase rounded shadow transition"
                  >
                    <Crosshair className="w-3.5 h-3.5 text-amber-300" />
                    <span>Atacar</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SECTION: KEYWORDS & NOTES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-grim-800">
          <div>
            <span className="text-[10px] uppercase font-bold text-grim-400 tracking-wider flex items-center gap-1 mb-2">
              <Tag className="w-3 h-3 text-gothic-gold" /> Palavras-Chave (Keywords)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(character.keywords || '').split(',').map((kw, i) => kw.trim() && (
                <span key={i} className="text-[10px] font-tech font-bold uppercase px-2 py-0.5 bg-grim-950 border border-grim-800 text-amber-300/90 rounded">
                  {kw.trim()}
                </span>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold text-grim-400 tracking-wider block mb-1">
              Anotações do Personagem
            </span>
            <p className="text-xs text-grim-400 bg-grim-950 p-2.5 rounded border border-grim-800 italic">
              {character.notes || 'Nenhuma anotação adicional registrada no dataslate.'}
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}

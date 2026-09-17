// Warhammer 40,000: Wrath & Glory (2nd Edition) Rules Definition

export const ATTRIBUTES = [
  { key: 'strength', name: 'Força', nameEn: 'Strength', short: 'FOR', desc: 'Poder físico puro, capacidade de carga e dano desarmado/melee.' },
  { key: 'toughness', name: 'Resistência', nameEn: 'Toughness', short: 'RES', desc: 'Resistência física, saúde, imunidade e absorção de dano.' },
  { key: 'agility', name: 'Agilidade', nameEn: 'Agility', short: 'AGI', desc: 'Destreza corporal, reflexos rápidos, mira com armas de tiro e equilíbrio.' },
  { key: 'initiative', name: 'Iniciativa', nameEn: 'Initiative', short: 'INI', desc: 'Velocidade de reação e esquiva ativa no combate corporal.' },
  { key: 'willpower', name: 'Força de Vontade', nameEn: 'Willpower', short: 'VON', desc: 'Determinação mental, canalização psíquica e resistência à Corrupção.' },
  { key: 'intellect', name: 'Intelecto', nameEn: 'Intellect', short: 'INT', desc: 'Capacidade dedutiva, conhecimento técnico, medicina e erudição.' },
  { key: 'fellowship', name: 'Companheirismo', nameEn: 'Fellowship', short: 'COM', desc: 'Carisma, persuasão, liderança, lábia e interação social.' },
];

export const SKILLS = [
  { key: 'athletics', name: 'Atletismo', nameEn: 'Athletics', attribute: 'strength', attrShort: 'FOR', desc: 'Correr, escalar, saltar e nadar sob estresse.' },
  { key: 'awareness', name: 'Percepção', nameEn: 'Awareness', attribute: 'intellect', attrShort: 'INT', desc: 'Notar emboscadas, pistas visuais, ruídos e cheiros.' },
  { key: 'ballistic_skill', name: 'Habilidade Balística', nameEn: 'Ballistic Skill', attribute: 'agility', attrShort: 'AGI', desc: 'Disparar qualquer tipo de arma de projétil, laser ou plasma.' },
  { key: 'cunning', name: 'Astúcia', nameEn: 'Cunning', attribute: 'fellowship', attrShort: 'COM', desc: 'Sabedoria das ruas, blefar e entender traições.' },
  { key: 'deception', name: 'Enganação', nameEn: 'Deception', attribute: 'fellowship', attrShort: 'COM', desc: 'Mentir, disfarçar intenções e trapacear.' },
  { key: 'insight', name: 'Intuição', nameEn: 'Insight', attribute: 'fellowship', attrShort: 'COM', desc: 'Ler as emoções e intenções dos outros.' },
  { key: 'intimidation', name: 'Intimidação', nameEn: 'Intimidation', attribute: 'willpower', attrShort: 'VON', desc: 'Coagir física ou psicologicamente.' },
  { key: 'investigation', name: 'Investigação', nameEn: 'Investigation', attribute: 'intellect', attrShort: 'INT', desc: 'Procurar pistas forenses, documentos e segredos.' },
  { key: 'leadership', name: 'Liderança', nameEn: 'Leadership', attribute: 'willpower', attrShort: 'VON', desc: 'Comandar tropas, manter a moral e coordenar ordens.' },
  { key: 'medicae', name: 'Medicina (Medicae)', nameEn: 'Medicae', attribute: 'intellect', attrShort: 'INT', desc: 'Tratar ferimentos, estancar sangramentos e cirurgias.' },
  { key: 'persuasion', name: 'Persuasão', nameEn: 'Persuasion', attribute: 'fellowship', attrShort: 'COM', desc: 'Convencer outros de boa-fé através de diplomacia.' },
  { key: 'pilot', name: 'Pilotagem', nameEn: 'Pilot', attribute: 'agility', attrShort: 'AGI', desc: 'Operar veículos terrestres, aéreos ou naves espaciais.' },
  { key: 'psychic_mastery', name: 'Maestria Psíquica', nameEn: 'Psychic Mastery', attribute: 'willpower', attrShort: 'VON', desc: 'Canalizar o poder bruto e perigoso da Dobra (Warp).' },
  { key: 'scholar', name: 'Erudição', nameEn: 'Scholar', attribute: 'intellect', attrShort: 'INT', desc: 'Conhecimento histórico, teologia imperial, xeno-biologia.' },
  { key: 'stealth', name: 'Furtividade', nameEn: 'Stealth', attribute: 'agility', attrShort: 'AGI', desc: 'Mover-se silenciosamente e esconder-se nas sombras.' },
  { key: 'survival', name: 'Sobrevivência', nameEn: 'Survival', attribute: 'willpower', attrShort: 'VON', desc: 'Rastrear, suportar climas extremos e achar suprimentos.' },
  { key: 'tech', name: 'Tecnologia (Tech)', nameEn: 'Tech', attribute: 'intellect', attrShort: 'INT', desc: 'Acalmar os Espíritos-da-Máquina, consertar armas e hackear.' },
  { key: 'weapon_skill', name: 'Habilidade de Combate', nameEn: 'Weapon Skill', attribute: 'initiative', attrShort: 'INI', desc: 'Lutar corpo a corpo com espadas, machados ou punhos.' },
];

export const TIER_XP_BUDGET = {
  1: 100,
  2: 200,
  3: 300,
  4: 400
};

export const ATTRIBUTE_COSTS = {
  1: 0, 2: 4, 3: 6, 4: 10, 5: 15, 6: 20, 7: 25, 8: 30, 9: 35, 10: 40, 11: 45, 12: 50
};

export function getAttributeTotalCost(rating) {
  let total = 0;
  for (let i = 2; i <= rating; i++) {
    total += ATTRIBUTE_COSTS[i] || (i * 5);
  }
  return total;
}

export const SKILL_COSTS = {
  0: 0, 1: 2, 2: 4, 3: 6, 4: 8, 5: 10, 6: 12, 7: 14, 8: 16
};

export function getSkillTotalCost(rating) {
  let total = 0;
  for (let i = 1; i <= rating; i++) {
    total += SKILL_COSTS[i] || (i * 2);
  }
  return total;
}

export function calculateDerivedStats(tier, attributes, armourBonus = 0) {
  const t = Number(tier) || 1;
  const toughness = Number(attributes.toughness) || 1;
  const willpower = Number(attributes.willpower) || 1;
  const initiative = Number(attributes.initiative) || 1;
  const armour = Number(armourBonus) || 0;

  return {
    wounds_max: (t * 2) + toughness,
    shock_max: t + willpower,
    defence: Math.max(1, initiative - 1),
    resilience: toughness + 1 + armour,
    determination: toughness,
    speed: 6
  };
}

export const SPECIES_LIST = [
  { name: 'Humano', desc: 'Resilientes, adaptáveis e a espinha dorsal do Imperium.', baseCost: 0, speed: 6 },
  { name: 'Adeptus Astartes', desc: 'Anjos da Morte, guerreiros geneticamente modificados do Imperador.', baseCost: 50, speed: 7 },
  { name: 'Primaris Astartes', desc: 'Guerreiros Astartes superiores aprimorados por Belisarius Cawl.', baseCost: 100, speed: 7 },
  { name: 'Ciborgue / Skitarii', desc: 'Humanos aumentados pela glória mecânica do Adeptus Mechanicus.', baseCost: 20, speed: 6 },
  { name: 'Aeldari', desc: 'Espécie alienígena antiga de reflexos sobrenaturais e conexão psíquica.', baseCost: 20, speed: 8 },
  { name: 'Ork', desc: 'Brutais guerreiros fúngicos verdes movidos pela alegria da guerra (WAAAGH!).', baseCost: 20, speed: 6 },
];

export const ARCHETYPES = [
  { tier: 1, name: 'Guarda Imperial (Imperial Guardsman)', faction: 'Astra Militarum', species: 'Humano', desc: 'O soldado de infantaria leal armado com Lasgun e fé.' },
  { tier: 1, name: 'Acólito Inquisitorial', faction: 'A Inquisição', species: 'Humano', desc: 'Investigador júnior a serviço de um Inquisidor.' },
  { tier: 1, name: 'Escória da Colmeia (Ganger)', faction: 'A Escória', species: 'Humano', desc: 'Sobrevivente implacável das profundezas da colmeia.' },
  { tier: 2, name: 'Irmã de Batalha (Sister of Battle)', faction: 'Adepta Sororitas', species: 'Humano', desc: 'Guerreira sagrada com Armadura de Poder e Bolter.' },
  { tier: 2, name: 'Space Marine Scout', faction: 'Adeptus Astartes', species: 'Adeptus Astartes', desc: 'Infiltrador e atirador furtivo dos capítulos Astartes.' },
  { tier: 2, name: 'Skitarius Ranger', faction: 'Adeptus Mechanicus', species: 'Ciborgue / Skitarii', desc: 'Caçador incansável com sensores termais e mosquete galvânico.' },
  { tier: 2, name: 'Psíquico Sancionado', faction: 'Adeptus Astra Telepathica', species: 'Humano', desc: 'Mago imperial que canaliza o Warp sob vigilância.' },
  { tier: 2, name: 'Ork Boy', faction: 'Orks', species: 'Ork', desc: 'Guerreiro xenos com Choppa e Slugga procurando uma boa briga.' },
  { tier: 3, name: 'Space Marine Tático', faction: 'Adeptus Astartes', species: 'Adeptus Astartes', desc: 'Lenda viva em combate vestindo Power Armour Mk X/VII.' },
  { tier: 3, name: 'Comissário Imperial', faction: 'Astra Militarum', species: 'Humano', desc: 'Oficial impiedoso de moral inabalável que executa covardes.' },
  { tier: 3, name: 'Tech-Priest Enginseer', faction: 'Adeptus Mechanicus', species: 'Ciborgue / Skitarii', desc: 'Sacerdote que comunga com as máquinas e tanques de guerra.' },
  { tier: 4, name: 'Space Marine Primaris Intercessor', faction: 'Adeptus Astartes', species: 'Primaris Astartes', desc: 'O ápice da engenharia bélica da humanidade com Rifle Bolt.' },
  { tier: 4, name: 'Inquisidor do Ordo', faction: 'A Inquisição', species: 'Humano', desc: 'Autoridade suprema capaz de ordenar o Exterminatus de planetas.' }
];

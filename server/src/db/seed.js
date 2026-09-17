const db = require('./database');
const { calculateDerivedStats, getAttributeTotalCost, getSkillTotalCost } = require('../utils/rules');

function seedDatabase() {
  const campaignCount = db.prepare('SELECT COUNT(*) as count FROM campaigns').get().count;
  if (campaignCount > 0) {
    return; // Already seeded
  }

  console.log('Seeding initial campaign and data for Warhammer 40,000: Wrath & Glory...');

  // 1. Create Default Campaign: O Expurgo de Gilead (Tier 2)
  const insertCampaign = db.prepare(`
    INSERT INTO campaigns (name, tier, ruin, glory, description, framework)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const campaignResult = insertCampaign.run(
    'O Expurgo de Gilead',
    2,
    3, // Ruin inicial
    2, // Glory inicial
    'Uma campanha nas profundezas do Sistema Gilead, assolado pela Grande Fenda (Cicatrix Maledictum) e infestações do Caos.',
    'Agentes do Trono convocados para expurgar células hereges no sub-mundo da Colmeia Avachrus.'
  );

  const campaignId = campaignResult.lastInsertRowid;

  // 2. Insert Sample Characters
  const insertChar = db.prepare(`
    INSERT INTO characters (
      campaign_id, name, species, faction, archetype, tier, rank, xp_total, xp_spent,
      strength, toughness, agility, initiative, willpower, intellect, fellowship,
      skills, wounds_current, wounds_max, shock_current, shock_max, wrath_points,
      armour_bonus, speed, determination, defence, resilience,
      keywords, wargear, talents, notes
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?
    )
  `);

  // Character 1: Irmã Vael (Sister of Battle - Tier 2)
  const sisterSkills = {
    athletics: 2, awareness: 3, ballistic_skill: 4, cunning: 0,
    deception: 0, insight: 2, intimidation: 3, investigation: 1,
    leadership: 3, medicae: 1, persuasion: 2, pilot: 0,
    psychic_mastery: 0, scholar: 3, stealth: 0, survival: 1,
    tech: 0, weapon_skill: 3
  };
  const sisterAttrs = { strength: 3, toughness: 3, agility: 3, initiative: 4, willpower: 4, intellect: 3, fellowship: 3 };
  const sisterDerived = calculateDerivedStats(2, sisterAttrs, 5); // Power Armour (+5)

  insertChar.run(
    campaignId, 'Irmã Vaelith', 'Humano', 'Adepta Sororitas', 'Irmã de Batalha (Sister of Battle)',
    2, 1, 200, 185,
    sisterAttrs.strength, sisterAttrs.toughness, sisterAttrs.agility, sisterAttrs.initiative,
    sisterAttrs.willpower, sisterAttrs.intellect, sisterAttrs.fellowship,
    JSON.stringify(sisterSkills),
    sisterDerived.wounds_max, sisterDerived.wounds_max,
    sisterDerived.shock_max, sisterDerived.shock_max,
    2, 5, 6, sisterDerived.determination, sisterDerived.defence, sisterDerived.resilience,
    'IMPERIUM, ADEPTA SORORITAS, ORDO HERETICUS, HUMANO',
    JSON.stringify([
      { name: 'Bolter Padrão Godwyn-De’az', damage: '10+1ED', ap: '-1', range: '24m', traits: 'Brutal, Rapid Fire (2)' },
      { name: 'Espada Serra (Chainsword)', damage: '5+1ED', ap: '0', range: 'Corpo a Corpo', traits: 'Brutal, Parry' },
      { name: 'Armadura de Poder Sororitas', armour: 5, traits: 'Comms, Selada contra vácuo' }
    ]),
    JSON.stringify([
      { name: 'Pureza de Fé', desc: 'Pode canalizar Fé para negar poderes de feiticeiros e demônios.' }
    ]),
    'Fervorosa defensora da palavra do Imperador-Deus. Não tolera heresias na colmeia.'
  );

  // Character 2: Irmão Kaelen (Space Marine Scout - Tier 2)
  const scoutSkills = {
    athletics: 3, awareness: 4, ballistic_skill: 4, cunning: 2,
    deception: 1, insight: 2, intimidation: 2, investigation: 2,
    leadership: 1, medicae: 1, persuasion: 0, pilot: 1,
    psychic_mastery: 0, scholar: 1, stealth: 4, survival: 3,
    tech: 1, weapon_skill: 3
  };
  const scoutAttrs = { strength: 4, toughness: 4, agility: 4, initiative: 3, willpower: 3, intellect: 3, fellowship: 2 };
  const scoutDerived = calculateDerivedStats(2, scoutAttrs, 3); // Scout Armour (+3)

  insertChar.run(
    campaignId, 'Irmão Kaelen', 'Adeptus Astartes', 'Adeptus Astartes', 'Space Marine Scout',
    2, 1, 200, 190,
    scoutAttrs.strength, scoutAttrs.toughness, scoutAttrs.agility, scoutAttrs.initiative,
    scoutAttrs.willpower, scoutAttrs.intellect, scoutAttrs.fellowship,
    JSON.stringify(scoutSkills),
    scoutDerived.wounds_max - 2, scoutDerived.wounds_max, // Levou 2 ferimentos
    scoutDerived.shock_max, scoutDerived.shock_max,
    2, 3, 7, scoutDerived.determination, scoutDerived.defence, scoutDerived.resilience,
    'IMPERIUM, ADEPTUS ASTARTES, CAPÍTULO ABSOLVED, MARINES',
    JSON.stringify([
      { name: 'Rifle de Precisão Astartes (Sniper Rifle)', damage: '10+1ED', ap: '-2', range: '36m', traits: 'Sniper (2), Silencioso' },
      { name: 'Faca de Combate Astartes', damage: '5+2ED', ap: '0', range: 'Corpo a Corpo', traits: 'Rápida' },
      { name: 'Armadura de Escoteiro (Scout Armour)', armour: 3, traits: 'Camuflagem urbana' }
    ]),
    JSON.stringify([
      { name: 'Astartes Physiology', desc: 'Resistente a venenos, vácuo e ferimentos mortais.' }
    ]),
    'Batedor experiente das ruínas industriais do Distrito 47.'
  );

  // Character 3: Skitarius V-7 (Adeptus Mechanicus - Tier 2)
  const skitariusSkills = {
    athletics: 2, awareness: 4, ballistic_skill: 4, cunning: 1,
    deception: 0, insight: 1, intimidation: 2, investigation: 3,
    leadership: 1, medicae: 2, persuasion: 0, pilot: 2,
    psychic_mastery: 0, scholar: 3, stealth: 2, survival: 1,
    tech: 5, weapon_skill: 2
  };
  const skitariusAttrs = { strength: 3, toughness: 4, agility: 3, initiative: 3, willpower: 3, intellect: 4, fellowship: 1 };
  const skitariusDerived = calculateDerivedStats(2, skitariusAttrs, 4);

  insertChar.run(
    campaignId, 'Skitarius D-781', 'Humano Aumentado', 'Adeptus Mechanicus', 'Skitarius Ranger',
    2, 1, 200, 195,
    skitariusAttrs.strength, skitariusAttrs.toughness, skitariusAttrs.agility, skitariusAttrs.initiative,
    skitariusAttrs.willpower, skitariusAttrs.intellect, skitariusAttrs.fellowship,
    JSON.stringify(skitariusSkills),
    skitariusDerived.wounds_max, skitariusDerived.wounds_max,
    skitariusDerived.shock_max - 1, skitariusDerived.shock_max,
    2, 4, 6, skitariusDerived.determination, skitariusDerived.defence, skitariusDerived.resilience,
    'IMPERIUM, ADEPTUS MECHANICUS, SKITARII, CYBORG',
    JSON.stringify([
      { name: 'Mosquete Galvânico (Galvanic Rifle)', damage: '10+1ED', ap: '-1', range: '30m', traits: 'Ranged, Armour Piercing' },
      { name: 'Armadura Skitarii de Carapaça', armour: 4, traits: 'Resistente a radiação' }
    ]),
    JSON.stringify([
      { name: 'Cânticos do Omnissiah', desc: 'Conecta-se ao fluxo de dados dos sacerdotes para bônus balísticos.' }
    ]),
    'Autômato devoto da máquina com sensores termais de longo alcance.'
  );

  // 3. Insert Mobs/Hordes for GM
  const insertMob = db.prepare(`
    INSERT INTO mobs (campaign_id, name, creature_count, base_attribute, base_skill, damage_rating, armour_bonus, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertMob.run(
    campaignId,
    'Horda de Cultistas Hereges',
    12, // 12 cultistas
    3,  // Agilidade/Força
    2,  // Ballistic Skill
    7,  // Dano base
    1,  // Armadura improvisada
    'Fanáticos armados com pistolas automáticas e facas enferrujadas. +6 dados bônus pelo mob.'
  );

  insertMob.run(
    campaignId,
    'Bando de Poxwalkers Contaminados',
    8, // 8 poxwalkers
    3, // Força
    2, // Weapon Skill
    8, // Dano
    2, // Carne pútrida
    'Zumbis de Nurgle lentos e letais no combate corpo a corpo. Transmitem podridão.'
  );

  // 4. Initial System Message in Chat
  const insertMsg = db.prepare(`
    INSERT INTO messages_rolls (campaign_id, sender_name, is_gm, message_type, content, roll_data)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertMsg.run(
    campaignId,
    'Cogitador Central',
    1,
    'system',
    'Servidor do Sanctum Inicializado. O Imperador Protege.',
    null
  );

  console.log('Database seeded successfully.');
}

module.exports = seedDatabase;

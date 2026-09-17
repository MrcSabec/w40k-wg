// Wrath & Glory 2nd Edition Rules Engine

// XP Costs for Attributes (Cost to raise from previous level)
const ATTRIBUTE_COSTS = {
  1: 0,
  2: 4,
  3: 6,
  4: 10,
  5: 15,
  6: 20,
  7: 25,
  8: 30,
  9: 35,
  10: 40,
  11: 45,
  12: 50
};

// Cumulative XP for an attribute rating
function getAttributeTotalCost(rating) {
  let total = 0;
  for (let i = 2; i <= rating; i++) {
    total += ATTRIBUTE_COSTS[i] || (i * 5);
  }
  return total;
}

// XP Costs for Skills (Cost to raise from previous level)
const SKILL_COSTS = {
  0: 0,
  1: 2,
  2: 4,
  3: 6,
  4: 8,
  5: 10,
  6: 12,
  7: 14,
  8: 16
};

// Cumulative XP for a skill rating
function getSkillTotalCost(rating) {
  let total = 0;
  for (let i = 1; i <= rating; i++) {
    total += SKILL_COSTS[i] || (i * 2);
  }
  return total;
}

// Base XP budget by Campaign Tier
const TIER_XP_BUDGET = {
  1: 100,
  2: 200,
  3: 300,
  4: 400
};

// Calculate Derived Combat Stats
function calculateDerivedStats(tier, attributes, armourBonus = 0) {
  const toughness = Number(attributes.toughness) || 1;
  const willpower = Number(attributes.willpower) || 1;
  const initiative = Number(attributes.initiative) || 1;
  const strength = Number(attributes.strength) || 1;
  const agility = Number(attributes.agility) || 1;
  const armour = Number(armourBonus) || 0;
  const t = Number(tier) || 1;

  // Max Wounds: (Tier * 2) + Toughness
  const wounds_max = (t * 2) + toughness;

  // Max Shock: Tier + Willpower
  const shock_max = t + willpower;

  // Defence: Initiative - 1 (min 1)
  const defence = Math.max(1, initiative - 1);

  // Resilience: Toughness + 1 + Armour Bonus
  const resilience = toughness + 1 + armour;

  // Determination: equal to Toughness
  const determination = toughness;

  // Base Speed: typically 6 for humans/standard
  const speed = 6;

  return {
    wounds_max,
    shock_max,
    defence,
    resilience,
    determination,
    speed
  };
}

// Roll D6 Dice Pool with Wrath Die
function rollDicePool({ poolSize, bonusDice = 0, dn = 0, label = 'Teste' }) {
  const totalDice = Math.max(1, Number(poolSize) + Number(bonusDice));
  const regularDiceCount = Math.max(0, totalDice - 1);

  // The first die is always the Wrath Die
  const wrathRoll = Math.floor(Math.random() * 6) + 1;
  
  const regularRolls = [];
  for (let i = 0; i < regularDiceCount; i++) {
    regularRolls.push(Math.floor(Math.random() * 6) + 1);
  }

  // Calculate icons
  // 1-3 = 0 icons
  // 4-5 = 1 icon
  // 6 = 2 icons (Exalted Icon)
  function countIcons(val) {
    if (val === 6) return 2;
    if (val >= 4) return 1;
    return 0;
  }

  let totalIcons = countIcons(wrathRoll);
  let exaltedIcons = wrathRoll === 6 ? 1 : 0;
  let regularIcons = wrathRoll >= 4 && wrathRoll < 6 ? 1 : 0;

  for (const r of regularRolls) {
    totalIcons += countIcons(r);
    if (r === 6) exaltedIcons++;
    else if (r >= 4) regularIcons++;
  }

  const hasWrathCrit = wrathRoll === 6;
  const hasComplication = wrathRoll === 1;

  const success = dn > 0 ? totalIcons >= dn : true;
  const shiftedIcons = (dn > 0 && totalIcons > dn) ? totalIcons - dn : 0;

  return {
    label,
    totalDice,
    wrathDie: wrathRoll,
    regularDice: regularRolls,
    allDice: [wrathRoll, ...regularRolls],
    totalIcons,
    regularIcons,
    exaltedIcons,
    hasWrathCrit,
    hasComplication,
    dn: Number(dn) || 0,
    success,
    shiftedIcons
  };
}

// Horde / Mob Attack Roll
// Wrath & Glory rule: Mob attack gets +1 bonus die per creature in mob,
// capped at half the mob count: Math.floor(creatureCount / 2).
function rollMobAttack({ creatureCount, baseAttribute, baseSkill, dn = 0, mobName = 'Horda' }) {
  const count = Math.max(1, Number(creatureCount));
  const attr = Number(baseAttribute) || 3;
  const skill = Number(baseSkill) || 2;
  const hordeBonusDice = Math.floor(count / 2);
  const totalPool = attr + skill + hordeBonusDice;

  const rollResult = rollDicePool({
    poolSize: attr + skill,
    bonusDice: hordeBonusDice,
    dn,
    label: `Ataque de Horda: ${mobName} (${count} membros)`
  });

  return {
    ...rollResult,
    isHorde: true,
    creatureCount: count,
    hordeBonusDice,
    basePool: attr + skill
  };
}

module.exports = {
  ATTRIBUTE_COSTS,
  getAttributeTotalCost,
  SKILL_COSTS,
  getSkillTotalCost,
  TIER_XP_BUDGET,
  calculateDerivedStats,
  rollDicePool,
  rollMobAttack
};

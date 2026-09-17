const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateUser, getMemberRole } = require('../middlewares/auth');
const { calculateDerivedStats, getAttributeTotalCost, getSkillTotalCost, TIER_XP_BUDGET } = require('../utils/rules');

// Helper to compute XP spent from attributes & skills
function computeXPSpent(attributes, skills) {
  let spent = 0;
  for (const attr of ['strength', 'toughness', 'agility', 'initiative', 'willpower', 'intellect', 'fellowship']) {
    spent += getAttributeTotalCost(Number(attributes[attr]) || 1);
  }
  if (skills && typeof skills === 'object') {
    for (const skillVal of Object.values(skills)) {
      spent += getSkillTotalCost(Number(skillVal) || 0);
    }
  }
  return spent;
}

// GET all characters in campaign
router.get('/campaign/:campaignId', authenticateUser, (req, res) => {
  try {
    const role = getMemberRole(req.user.id, req.params.campaignId);
    if (!role) return res.status(403).json({ error: 'Acesso negado à campanha' });

    const characters = db.prepare(`
      SELECT c.*, u.name as owner_name 
      FROM characters c
      LEFT JOIN users u ON u.id = c.user_id
      WHERE c.campaign_id = ? 
      ORDER BY c.id ASC
    `).all(req.params.campaignId);
    
    const parsed = characters.map(char => ({
      ...char,
      is_owner: char.user_id === req.user.id,
      can_edit: role === 'gm' || char.user_id === req.user.id,
      skills: typeof char.skills === 'string' ? JSON.parse(char.skills || '{}') : char.skills,
      wargear: typeof char.wargear === 'string' ? JSON.parse(char.wargear || '[]') : char.wargear,
      talents: typeof char.talents === 'string' ? JSON.parse(char.talents || '[]') : char.talents,
    }));
    
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single character
router.get('/:id', authenticateUser, (req, res) => {
  try {
    const char = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    if (!char) return res.status(404).json({ error: 'Personagem não encontrado' });

    const role = getMemberRole(req.user.id, char.campaign_id);
    if (!role) return res.status(403).json({ error: 'Acesso negado' });

    char.is_owner = char.user_id === req.user.id;
    char.can_edit = role === 'gm' || char.user_id === req.user.id;
    char.skills = typeof char.skills === 'string' ? JSON.parse(char.skills || '{}') : char.skills;
    char.wargear = typeof char.wargear === 'string' ? JSON.parse(char.wargear || '[]') : char.wargear;
    char.talents = typeof char.talents === 'string' ? JSON.parse(char.talents || '[]') : char.talents;

    res.json(char);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create character
router.post('/', authenticateUser, (req, res) => {
  try {
    const {
      campaign_id, name, species, faction, archetype, tier = 1, rank = 1,
      strength = 1, toughness = 1, agility = 1, initiative = 1,
      willpower = 1, intellect = 1, fellowship = 1,
      skills = {}, armour_bonus = 0, speed = 6,
      keywords = '', wargear = [], talents = [], notes = '', avatar_url = ''
    } = req.body;

    if (!campaign_id || !name) {
      return res.status(400).json({ error: 'ID da campanha e Nome do personagem são obrigatórios' });
    }

    const role = getMemberRole(req.user.id, campaign_id);
    if (!role) return res.status(403).json({ error: 'Você não é membro desta campanha' });

    // Fetch campaign tier if not specified
    const campaign = db.prepare('SELECT tier FROM campaigns WHERE id = ?').get(campaign_id);
    const t = Number(tier) || (campaign ? campaign.tier : 1);

    const attrs = {
      strength: Number(strength) || 1,
      toughness: Number(toughness) || 1,
      agility: Number(agility) || 1,
      initiative: Number(initiative) || 1,
      willpower: Number(willpower) || 1,
      intellect: Number(intellect) || 1,
      fellowship: Number(fellowship) || 1
    };

    const derived = calculateDerivedStats(t, attrs, armour_bonus);
    const xp_total = TIER_XP_BUDGET[t] || 100;
    const xp_spent = computeXPSpent(attrs, skills);

    const insert = db.prepare(`
      INSERT INTO characters (
        campaign_id, user_id, name, species, faction, archetype, tier, rank, xp_total, xp_spent,
        strength, toughness, agility, initiative, willpower, intellect, fellowship,
        skills, wounds_current, wounds_max, shock_current, shock_max, wrath_points,
        armour_bonus, speed, determination, defence, resilience,
        keywords, wargear, talents, notes, avatar_url
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    const result = insert.run(
      campaign_id, req.user.id, name, species || 'Humano', faction || 'Imperium', archetype || 'Guerreiro',
      t, Number(rank) || 1, xp_total, xp_spent,
      attrs.strength, attrs.toughness, attrs.agility, attrs.initiative,
      attrs.willpower, attrs.intellect, attrs.fellowship,
      JSON.stringify(skills),
      derived.wounds_max, derived.wounds_max,
      derived.shock_max, derived.shock_max,
      2,
      Number(armour_bonus) || 0,
      Number(speed) || derived.speed,
      derived.determination,
      derived.defence,
      derived.resilience,
      keywords,
      JSON.stringify(wargear),
      JSON.stringify(talents),
      notes,
      avatar_url
    );

    const newChar = db.prepare('SELECT * FROM characters WHERE id = ?').get(result.lastInsertRowid);
    newChar.skills = JSON.parse(newChar.skills || '{}');
    newChar.wargear = JSON.parse(newChar.wargear || '[]');
    newChar.talents = JSON.parse(newChar.talents || '[]');
    newChar.is_owner = true;
    newChar.can_edit = true;

    res.status(201).json(newChar);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH status (wounds, shock, wrath) - Owner or GM
router.patch('/:id/status', authenticateUser, (req, res) => {
  try {
    const char = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    if (!char) return res.status(404).json({ error: 'Personagem não encontrado' });

    const role = getMemberRole(req.user.id, char.campaign_id);
    const isOwner = char.user_id === req.user.id;
    if (role !== 'gm' && !isOwner) {
      return res.status(403).json({ error: 'Apenas o Mestre ou o criador da ficha podem atualizar os status' });
    }

    const { wounds_current, shock_current, wrath_points } = req.body;
    const newWounds = wounds_current !== undefined ? Math.max(0, Math.min(char.wounds_max, Number(wounds_current))) : char.wounds_current;
    const newShock = shock_current !== undefined ? Math.max(0, Math.min(char.shock_max, Number(shock_current))) : char.shock_current;
    const newWrath = wrath_points !== undefined ? Math.max(0, Number(wrath_points)) : char.wrath_points;

    db.prepare('UPDATE characters SET wounds_current = ?, shock_current = ?, wrath_points = ? WHERE id = ?')
      .run(newWounds, newShock, newWrath, req.params.id);

    const updated = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    updated.skills = JSON.parse(updated.skills || '{}');
    updated.wargear = JSON.parse(updated.wargear || '[]');
    updated.talents = JSON.parse(updated.talents || '[]');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update character (evolution / editing) - Owner or GM
router.put('/:id', authenticateUser, (req, res) => {
  try {
    const char = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    if (!char) return res.status(404).json({ error: 'Personagem não encontrado' });

    const role = getMemberRole(req.user.id, char.campaign_id);
    const isOwner = char.user_id === req.user.id;
    if (role !== 'gm' && !isOwner) {
      return res.status(403).json({ error: 'Apenas o Mestre ou o dono da ficha podem editá-la' });
    }

    const body = req.body;
    const t = Number(body.tier) || char.tier;
    const attrs = {
      strength: Number(body.strength) || char.strength,
      toughness: Number(body.toughness) || char.toughness,
      agility: Number(body.agility) || char.agility,
      initiative: Number(body.initiative) || char.initiative,
      willpower: Number(body.willpower) || char.willpower,
      intellect: Number(body.intellect) || char.intellect,
      fellowship: Number(body.fellowship) || char.fellowship
    };

    const armour_bonus = body.armour_bonus !== undefined ? Number(body.armour_bonus) : char.armour_bonus;
    const derived = calculateDerivedStats(t, attrs, armour_bonus);
    const skills = body.skills || JSON.parse(char.skills || '{}');
    const xp_spent = computeXPSpent(attrs, skills);

    db.prepare(`
      UPDATE characters SET
        name = ?, species = ?, faction = ?, archetype = ?, tier = ?, rank = ?,
        xp_total = ?, xp_spent = ?,
        strength = ?, toughness = ?, agility = ?, initiative = ?,
        willpower = ?, intellect = ?, fellowship = ?,
        skills = ?, wounds_max = ?, shock_max = ?,
        armour_bonus = ?, speed = ?, determination = ?, defence = ?, resilience = ?,
        keywords = ?, wargear = ?, talents = ?, notes = ?, avatar_url = ?
      WHERE id = ?
    `).run(
      body.name || char.name,
      body.species || char.species,
      body.faction || char.faction,
      body.archetype || char.archetype,
      t,
      Number(body.rank) || char.rank,
      body.xp_total !== undefined ? Number(body.xp_total) : (TIER_XP_BUDGET[t] || char.xp_total),
      xp_spent,
      attrs.strength, attrs.toughness, attrs.agility, attrs.initiative,
      attrs.willpower, attrs.intellect, attrs.fellowship,
      JSON.stringify(skills),
      derived.wounds_max,
      derived.shock_max,
      armour_bonus,
      Number(body.speed) || char.speed,
      derived.determination,
      derived.defence,
      derived.resilience,
      body.keywords !== undefined ? body.keywords : char.keywords,
      JSON.stringify(body.wargear || JSON.parse(char.wargear || '[]')),
      JSON.stringify(body.talents || JSON.parse(char.talents || '[]')),
      body.notes !== undefined ? body.notes : char.notes,
      body.avatar_url !== undefined ? body.avatar_url : char.avatar_url,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    updated.skills = JSON.parse(updated.skills || '{}');
    updated.wargear = JSON.parse(updated.wargear || '[]');
    updated.talents = JSON.parse(updated.talents || '[]');

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE character - Owner or GM
router.delete('/:id', authenticateUser, (req, res) => {
  try {
    const char = db.prepare('SELECT * FROM characters WHERE id = ?').get(req.params.id);
    if (!char) return res.status(404).json({ error: 'Personagem não encontrado' });

    const role = getMemberRole(req.user.id, char.campaign_id);
    const isOwner = char.user_id === req.user.id;
    if (role !== 'gm' && !isOwner) {
      return res.status(403).json({ error: 'Sem permissão para deletar este personagem' });
    }

    db.prepare('DELETE FROM characters WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

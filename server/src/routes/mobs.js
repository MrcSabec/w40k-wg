const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateUser, getMemberRole } = require('../middlewares/auth');

// GET mobs by campaign ID
router.get('/campaign/:campaignId', authenticateUser, (req, res) => {
  try {
    const role = getMemberRole(req.user.id, req.params.campaignId);
    if (!role) return res.status(403).json({ error: 'Acesso negado à campanha' });

    const mobs = db.prepare('SELECT * FROM mobs WHERE campaign_id = ? ORDER BY id ASC').all(req.params.campaignId);
    res.json(mobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create mob (GM only)
router.post('/', authenticateUser, (req, res) => {
  try {
    const { campaign_id, name, creature_count = 5, base_attribute = 3, base_skill = 2, damage_rating = 7, armour_bonus = 0, notes = '' } = req.body;
    if (!campaign_id || !name) {
      return res.status(400).json({ error: 'campaign_id e nome são obrigatórios' });
    }

    const role = getMemberRole(req.user.id, campaign_id);
    if (role !== 'gm') {
      return res.status(403).json({ error: 'Apenas o Mestre pode criar Hordas' });
    }

    const insert = db.prepare(`
      INSERT INTO mobs (campaign_id, name, creature_count, base_attribute, base_skill, damage_rating, armour_bonus, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insert.run(
      campaign_id, name,
      Math.max(1, Number(creature_count)),
      Number(base_attribute) || 3,
      Number(base_skill) || 2,
      Number(damage_rating) || 7,
      Number(armour_bonus) || 0,
      notes
    );

    const newMob = db.prepare('SELECT * FROM mobs WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newMob);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update mob (GM only)
router.put('/:id', authenticateUser, (req, res) => {
  try {
    const mob = db.prepare('SELECT * FROM mobs WHERE id = ?').get(req.params.id);
    if (!mob) return res.status(404).json({ error: 'Horda não encontrada' });

    const role = getMemberRole(req.user.id, mob.campaign_id);
    if (role !== 'gm') {
      return res.status(403).json({ error: 'Apenas o Mestre pode alterar Hordas' });
    }

    const { name, creature_count, base_attribute, base_skill, damage_rating, armour_bonus, notes } = req.body;

    db.prepare(`
      UPDATE mobs SET
        name = ?, creature_count = ?, base_attribute = ?, base_skill = ?, damage_rating = ?, armour_bonus = ?, notes = ?
      WHERE id = ?
    `).run(
      name || mob.name,
      creature_count !== undefined ? Math.max(0, Number(creature_count)) : mob.creature_count,
      base_attribute !== undefined ? Number(base_attribute) : mob.base_attribute,
      base_skill !== undefined ? Number(base_skill) : mob.base_skill,
      damage_rating !== undefined ? Number(damage_rating) : mob.damage_rating,
      armour_bonus !== undefined ? Number(armour_bonus) : mob.armour_bonus,
      notes !== undefined ? notes : mob.notes,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM mobs WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE mob (GM only)
router.delete('/:id', authenticateUser, (req, res) => {
  try {
    const mob = db.prepare('SELECT * FROM mobs WHERE id = ?').get(req.params.id);
    if (!mob) return res.status(404).json({ error: 'Horda não encontrada' });

    const role = getMemberRole(req.user.id, mob.campaign_id);
    if (role !== 'gm') {
      return res.status(403).json({ error: 'Apenas o Mestre pode remover Hordas' });
    }

    db.prepare('DELETE FROM mobs WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

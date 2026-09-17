const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateUser, generateInviteCode, getMemberRole } = require('../middlewares/auth');

// GET all campaigns where current user is a member
router.get('/', authenticateUser, (req, res) => {
  try {
    const campaigns = db.prepare(`
      SELECT 
        c.id, c.name, c.tier, c.glory, c.description, c.framework, c.invite_code, c.created_at,
        cm.role,
        CASE WHEN cm.role = 'gm' THEN c.ruin ELSE NULL END as ruin,
        (SELECT COUNT(*) FROM campaign_members WHERE campaign_id = c.id) as members_count,
        (SELECT COUNT(*) FROM characters WHERE campaign_id = c.id) as characters_count
      FROM campaigns c
      JOIN campaign_members cm ON cm.campaign_id = c.id
      WHERE cm.user_id = ?
      ORDER BY c.created_at DESC
    `).all(req.user.id);

    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET campaign by ID with role-based visibility filter
router.get('/:id', authenticateUser, (req, res) => {
  try {
    const role = getMemberRole(req.user.id, req.params.id);
    if (!role) {
      return res.status(403).json({ error: 'Você não é participante desta campanha' });
    }

    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });

    // CRITICAL: Strict Visibility Restriction
    // If role is 'player', RUIN is completely wiped/nulled from payload!
    if (role === 'player') {
      campaign.ruin = null;
    }

    campaign.role = role;
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create campaign (Flow 1: User automatically becomes GM)
router.post('/', authenticateUser, (req, res) => {
  try {
    const { name, tier = 1, description = '', framework = '' } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nome da campanha é obrigatório' });
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let exists = db.prepare('SELECT id FROM campaigns WHERE invite_code = ?').get(inviteCode);
    while (exists) {
      inviteCode = generateInviteCode();
      exists = db.prepare('SELECT id FROM campaigns WHERE invite_code = ?').get(inviteCode);
    }

    const insertCampaign = db.prepare(`
      INSERT INTO campaigns (name, tier, invite_code, ruin, glory, description, framework, creator_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Initial Ruin starts at 2 or 3, Glory starts at 0 or 2
    const result = insertCampaign.run(
      name.trim(),
      Number(tier) || 1,
      inviteCode,
      2, // Starting Ruin for GM
      0, // Starting Glory
      description,
      framework,
      req.user.id
    );

    const campaignId = result.lastInsertRowid;

    // Automatically bind creator as GM in campaign_members
    db.prepare(`
      INSERT INTO campaign_members (campaign_id, user_id, role)
      VALUES (?, ?, 'gm')
    `).run(campaignId, req.user.id);

    const newCampaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);
    newCampaign.role = 'gm';

    res.status(201).json(newCampaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST join campaign via invite code (Flow 2: User automatically becomes Player)
router.post('/join', authenticateUser, (req, res) => {
  try {
    const { invite_code } = req.body;
    if (!invite_code || !invite_code.trim()) {
      return res.status(400).json({ error: 'Código de convite obrigatório' });
    }

    const cleanCode = invite_code.trim().toUpperCase();
    const campaign = db.prepare('SELECT * FROM campaigns WHERE invite_code = ?').get(cleanCode);

    if (!campaign) {
      return res.status(404).json({ error: 'Código de convite inválido ou campanha não encontrada' });
    }

    // Check if user is already a member
    const existingMember = db.prepare('SELECT role FROM campaign_members WHERE campaign_id = ? AND user_id = ?').get(campaign.id, req.user.id);

    if (!existingMember) {
      // Register user with PLAYER role
      db.prepare(`
        INSERT INTO campaign_members (campaign_id, user_id, role)
        VALUES (?, ?, 'player')
      `).run(campaign.id, req.user.id);
      campaign.role = 'player';
    } else {
      campaign.role = existingMember.role;
    }

    // Remove Ruin if player
    if (campaign.role === 'player') {
      campaign.ruin = null;
    }

    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update Ruin & Glory (GM only)
router.put('/:id/meta', authenticateUser, (req, res) => {
  try {
    const role = getMemberRole(req.user.id, req.params.id);
    if (role !== 'gm') {
      return res.status(403).json({ error: 'Apenas o Mestre pode manipular a reserva de Ruína/Glória' });
    }

    const { ruin, glory } = req.body;
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campanha não encontrada' });

    const newRuin = ruin !== undefined ? Math.max(0, Number(ruin)) : campaign.ruin;
    const newGlory = glory !== undefined ? Math.max(0, Number(glory)) : campaign.glory;

    db.prepare('UPDATE campaigns SET ruin = ?, glory = ? WHERE id = ?').run(newRuin, newGlory, req.params.id);
    const updated = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id);
    updated.role = 'gm';

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE campaign (GM only)
router.delete('/:id', authenticateUser, (req, res) => {
  try {
    const role = getMemberRole(req.user.id, req.params.id);
    if (role !== 'gm') {
      return res.status(403).json({ error: 'Apenas o Mestre pode encerrar a campanha' });
    }

    db.prepare('DELETE FROM campaigns WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

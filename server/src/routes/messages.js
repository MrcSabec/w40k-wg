const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { authenticateUser, getMemberRole } = require('../middlewares/auth');

// GET message history by campaign ID with whisper privacy filtering
router.get('/campaign/:campaignId', authenticateUser, (req, res) => {
  try {
    const role = getMemberRole(req.user.id, req.params.campaignId);
    if (!role) return res.status(403).json({ error: 'Acesso negado à campanha' });

    const limit = Math.min(100, Number(req.query.limit) || 50);

    // Filter whispers: public messages OR messages where user is sender or recipient
    const messages = db.prepare(`
      SELECT 
        m.*,
        u_rec.name as recipient_name
      FROM messages_rolls m
      LEFT JOIN users u_rec ON u_rec.id = m.recipient_id
      WHERE m.campaign_id = ? 
        AND (
          m.recipient_id IS NULL 
          OR m.sender_id = ? 
          OR m.recipient_id = ?
        )
      ORDER BY m.id DESC 
      LIMIT ?
    `).all(req.params.campaignId, req.user.id, req.user.id, limit);

    const parsed = messages.reverse().map(msg => ({
      ...msg,
      is_whisper: msg.recipient_id !== null,
      roll_data: msg.roll_data ? JSON.parse(msg.roll_data) : null
    }));

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE clear history (GM only)
router.delete('/campaign/:campaignId', authenticateUser, (req, res) => {
  try {
    const role = getMemberRole(req.user.id, req.params.campaignId);
    if (role !== 'gm') return res.status(403).json({ error: 'Apenas o Mestre pode limpar o histórico' });

    db.prepare('DELETE FROM messages_rolls WHERE campaign_id = ?').run(req.params.campaignId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

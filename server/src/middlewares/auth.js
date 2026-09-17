const db = require('../db/database');
const crypto = require('crypto');

// Middleware to authenticate user via x-user-token header
function authenticateUser(req, res, next) {
  const token = req.headers['x-user-token'] || req.query.token;

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }

  try {
    let user = db.prepare('SELECT * FROM users WHERE token = ?').get(token);
    
    if (!user) {
      return res.status(401).json({ error: 'Token de autenticação inválido ou expirado' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Erro de autenticação: ' + err.message });
  }
}

// Helper to get role in campaign
function getMemberRole(userId, campaignId) {
  const member = db.prepare('SELECT role FROM campaign_members WHERE user_id = ? AND campaign_id = ?').get(userId, campaignId);
  return member ? member.role : null;
}

// Middleware to verify campaign membership & attach role
function requireCampaignMember(req, res, next) {
  const campaignId = req.params.campaignId || req.params.id || req.body.campaign_id;
  if (!campaignId) {
    return res.status(400).json({ error: 'ID da campanha obrigatório' });
  }

  const role = getMemberRole(req.user.id, campaignId);
  if (!role) {
    return res.status(403).json({ error: 'Você não é membro desta campanha' });
  }

  req.campaignRole = role;
  next();
}

// Middleware to require GM role
function requireGM(req, res, next) {
  if (req.campaignRole !== 'gm') {
    return res.status(403).json({ error: 'Acesso negado: Requer privilégios de Mestre (GM)' });
  }
  next();
}

// Generate unique readable invite code: WG-XXXXXX
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'WG-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

module.exports = {
  authenticateUser,
  getMemberRole,
  requireCampaignMember,
  requireGM,
  generateInviteCode
};

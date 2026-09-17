const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db/database');
const { authenticateUser } = require('../middlewares/auth');

// Hash password with salt using native node:crypto
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

// POST /api/users/auth - Hybrid Login & Auto-Registration
router.post('/auth', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Nome de usuário é obrigatório.' });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ error: 'Senha é obrigatória.' });
    }

    const rawUsername = username.trim();
    const cleanUsername = rawUsername.toLowerCase();
    const cleanPassword = password.trim();

    // Check if user already exists
    const existingUser = db.prepare('SELECT * FROM users WHERE LOWER(username) = ? OR LOWER(name) = ?')
      .get(cleanUsername, cleanUsername);

    if (!existingUser) {
      // FLOW A: User does NOT exist -> AUTO-REGISTER
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(cleanPassword, salt);
      const token = crypto.randomUUID();

      const insert = db.prepare(`
        INSERT INTO users (username, name, password_hash, salt, token)
        VALUES (?, ?, ?, ?, ?)
      `);
      const result = insert.run(cleanUsername, rawUsername, passwordHash, salt, token);

      const newUser = db.prepare('SELECT id, username, name, token FROM users WHERE id = ?').get(result.lastInsertRowid);
      return res.status(201).json({
        ...newUser,
        isNew: true,
        message: 'Usuário consagrado e registrado com sucesso!'
      });
    }

    // FLOW B: User DOES exist -> VALIDATE PASSWORD
    if (existingUser.password_hash && existingUser.salt) {
      const computedHash = hashPassword(cleanPassword, existingUser.salt);
      if (computedHash !== existingUser.password_hash) {
        return res.status(401).json({
          error: `Senha incorreta para o usuário "${rawUsername}". Por favor, insira a senha correta cadastrada.`
        });
      }
    } else {
      // Legacy user without password -> set password on first login
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = hashPassword(cleanPassword, salt);
      db.prepare('UPDATE users SET username = ?, password_hash = ?, salt = ? WHERE id = ?')
        .run(cleanUsername, passwordHash, salt, existingUser.id);
    }

    // Login successful
    return res.json({
      id: existingUser.id,
      username: existingUser.username || cleanUsername,
      name: existingUser.name,
      token: existingUser.token,
      isNew: false,
      message: 'Acesso autorizado ao Sanctum.'
    });

  } catch (err) {
    res.status(500).json({ error: 'Erro no servidor de autenticação: ' + err.message });
  }
});

// GET /api/users/me - Current user session validation
router.get('/me', authenticateUser, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username || req.user.name,
    name: req.user.name,
    token: req.user.token
  });
});

// PUT /api/users/profile - Update display name
router.put('/profile', authenticateUser, (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Nome inválido' });

    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), req.user.id);
    const updated = db.prepare('SELECT id, username, name, token FROM users WHERE id = ?').get(req.user.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/campaign/:campaignId - Members of campaign (for whispers & role management)
router.get('/campaign/:campaignId', authenticateUser, (req, res) => {
  try {
    const members = db.prepare(`
      SELECT u.id, u.username, u.name, cm.role, cm.joined_at
      FROM campaign_members cm
      JOIN users u ON u.id = cm.user_id
      WHERE cm.campaign_id = ?
      ORDER BY cm.role DESC, u.name ASC
    `).all(req.params.campaignId);

    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

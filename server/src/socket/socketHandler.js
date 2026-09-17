const db = require('../db/database');
const { rollDicePool, rollMobAttack } = require('../utils/rules');

function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    // Join campaign room with user token authentication
    socket.on('join_campaign', ({ campaignId, token }) => {
      if (!campaignId || !token) return;

      const user = db.prepare('SELECT * FROM users WHERE token = ?').get(token);
      if (!user) return;

      const member = db.prepare('SELECT role FROM campaign_members WHERE user_id = ? AND campaign_id = ?').get(user.id, campaignId);
      if (!member) return;

      const role = member.role; // 'gm' or 'player'
      const mainRoom = `campaign-${campaignId}`;
      const userRoom = `user-${user.id}`;
      const gmRoom = `campaign-${campaignId}-gm`;

      socket.join(mainRoom);
      socket.join(userRoom);
      if (role === 'gm') {
        socket.join(gmRoom);
      }

      socket.data = {
        campaignId,
        user,
        role
      };

      console.log(`[Socket] ${user.name} (${role.toUpperCase()}) conectou na campanha ${campaignId}`);

      // Notify others in room
      socket.to(mainRoom).emit('user_joined', {
        userId: user.id,
        userName: user.name,
        role
      });
    });

    // Send chat or private whisper
    socket.on('send_chat', ({ campaignId, content, recipientId = null }) => {
      if (!campaignId || !content || !socket.data?.user) return;

      const user = socket.data.user;
      const role = socket.data.role;
      const isWhisper = Boolean(recipientId);
      const messageType = isWhisper ? 'whisper' : 'chat';

      const insert = db.prepare(`
        INSERT INTO messages_rolls (campaign_id, sender_id, sender_name, sender_role, recipient_id, message_type, content, roll_data)
        VALUES (?, ?, ?, ?, ?, ?, ?, NULL)
      `);
      const res = insert.run(campaignId, user.id, user.name, role, recipientId, messageType, content);

      const savedMsg = db.prepare(`
        SELECT m.*, u.name as recipient_name 
        FROM messages_rolls m
        LEFT JOIN users u ON u.id = m.recipient_id
        WHERE m.id = ?
      `).get(res.lastInsertRowid);
      savedMsg.is_whisper = isWhisper;

      if (isWhisper) {
        // Deliver ONLY to sender and recipient
        io.to(`user-${user.id}`).emit('new_message', savedMsg);
        io.to(`user-${recipientId}`).emit('new_message', savedMsg);
      } else {
        // Public message in campaign
        io.to(`campaign-${campaignId}`).emit('new_message', savedMsg);
      }
    });

    // Roll Dice Pool (with Wrath Die engine)
    socket.on('roll_dice', ({ campaignId, poolSize, bonusDice = 0, dn = 0, label = 'Teste', attributeName = '', skillName = '' }) => {
      if (!campaignId || !socket.data?.user) return;

      const user = socket.data.user;
      const role = socket.data.role;
      const mainRoom = `campaign-${campaignId}`;
      const gmRoom = `campaign-${campaignId}-gm`;

      const rollResult = rollDicePool({
        poolSize: Number(poolSize) || 1,
        bonusDice: Number(bonusDice) || 0,
        dn: Number(dn) || 0,
        label
      });

      rollResult.attributeName = attributeName;
      rollResult.skillName = skillName;
      rollResult.senderName = user.name;
      rollResult.senderRole = role;

      // Handle Wrath Die triggers
      let gloryChanged = false;
      let ruinChanged = false;
      const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);

      if (campaign) {
        let newGlory = campaign.glory;
        let newRuin = campaign.ruin;

        if (rollResult.hasWrathCrit) {
          newGlory = campaign.glory + 1;
          gloryChanged = true;
        }
        if (rollResult.hasComplication) {
          newRuin = campaign.ruin + 1;
          ruinChanged = true;
        }

        if (gloryChanged || ruinChanged) {
          db.prepare('UPDATE campaigns SET ruin = ?, glory = ? WHERE id = ?').run(newRuin, newGlory, campaignId);
          
          // Emit Glory to EVERYONE
          io.to(mainRoom).emit('meta_updated', { glory: newGlory });
          // Emit Ruin ONLY to GM Room!
          io.to(gmRoom).emit('meta_updated', { ruin: newRuin, glory: newGlory });
        }
      }

      // Persist roll
      const insert = db.prepare(`
        INSERT INTO messages_rolls (campaign_id, sender_id, sender_name, sender_role, recipient_id, message_type, content, roll_data)
        VALUES (?, ?, ?, ?, NULL, 'roll', ?, ?)
      `);

      const content = `${user.name} rolou ${label}: ${rollResult.totalIcons} Ícones ${rollResult.hasWrathCrit ? '⚡ [CRÍTICO DE IRA +1 GLÓRIA]' : ''} ${rollResult.hasComplication ? '💀 [COMPLICAÇÃO +1 RUÍNA]' : ''}`;
      const res = insert.run(campaignId, user.id, user.name, role, content, JSON.stringify(rollResult));

      const savedMsg = db.prepare('SELECT * FROM messages_rolls WHERE id = ?').get(res.lastInsertRowid);
      savedMsg.roll_data = rollResult;
      savedMsg.is_whisper = false;

      io.to(mainRoom).emit('new_roll', savedMsg);
      io.to(mainRoom).emit('new_message', savedMsg);
    });

    // Roll Horde (GM only)
    socket.on('roll_mob', ({ campaignId, mobId, mobName, creatureCount, baseAttribute, baseSkill, dn = 0 }) => {
      if (!campaignId || socket.data?.role !== 'gm') return;

      const user = socket.data.user;
      const mainRoom = `campaign-${campaignId}`;

      const mobRoll = rollMobAttack({
        creatureCount,
        baseAttribute,
        baseSkill,
        dn,
        mobName: mobName || 'Horda'
      });

      mobRoll.mobId = mobId;
      mobRoll.senderName = user.name;
      mobRoll.senderRole = 'gm';

      const insert = db.prepare(`
        INSERT INTO messages_rolls (campaign_id, sender_id, sender_name, sender_role, recipient_id, message_type, content, roll_data)
        VALUES (?, ?, ?, 'gm', NULL, 'horde_roll', ?, ?)
      `);

      const content = `Ataque de Horda [${mobName} - ${creatureCount} criaturas (+${mobRoll.hordeBonusDice} dados)]: ${mobRoll.totalIcons} Ícones`;
      const res = insert.run(campaignId, user.id, user.name, content, JSON.stringify(mobRoll));

      const savedMsg = db.prepare('SELECT * FROM messages_rolls WHERE id = ?').get(res.lastInsertRowid);
      savedMsg.roll_data = mobRoll;
      savedMsg.is_whisper = false;

      io.to(mainRoom).emit('new_roll', savedMsg);
      io.to(mainRoom).emit('new_message', savedMsg);
    });

    // Update Meta (GM only)
    socket.on('update_meta', ({ campaignId, ruin, glory }) => {
      if (!campaignId || socket.data?.role !== 'gm') return;

      const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(campaignId);
      if (!campaign) return;

      const newRuin = ruin !== undefined ? Math.max(0, Number(ruin)) : campaign.ruin;
      const newGlory = glory !== undefined ? Math.max(0, Number(glory)) : campaign.glory;

      db.prepare('UPDATE campaigns SET ruin = ?, glory = ? WHERE id = ?').run(newRuin, newGlory, campaignId);

      // Glory to everyone
      io.to(`campaign-${campaignId}`).emit('meta_updated', { glory: newGlory });
      // Ruin ONLY to GM!
      io.to(`campaign-${campaignId}-gm`).emit('meta_updated', { ruin: newRuin, glory: newGlory });
    });

    // Update Character Status (Owner or GM)
    socket.on('update_character_status', ({ characterId, campaignId, wounds_current, shock_current, wrath_points }) => {
      if (!characterId) return;
      const char = db.prepare('SELECT * FROM characters WHERE id = ?').get(characterId);
      if (!char) return;

      const role = socket.data?.role;
      const isOwner = char.user_id === socket.data?.user?.id;
      if (role !== 'gm' && !isOwner) return;

      const newWounds = wounds_current !== undefined ? Math.max(0, Math.min(char.wounds_max, Number(wounds_current))) : char.wounds_current;
      const newShock = shock_current !== undefined ? Math.max(0, Math.min(char.shock_max, Number(shock_current))) : char.shock_current;
      const newWrath = wrath_points !== undefined ? Math.max(0, Number(wrath_points)) : char.wrath_points;

      db.prepare('UPDATE characters SET wounds_current = ?, shock_current = ?, wrath_points = ? WHERE id = ?')
        .run(newWounds, newShock, newWrath, characterId);

      const updated = db.prepare(`
        SELECT c.*, u.name as owner_name 
        FROM characters c
        LEFT JOIN users u ON u.id = c.user_id
        WHERE c.id = ?
      `).get(characterId);

      updated.skills = JSON.parse(updated.skills || '{}');
      updated.wargear = JSON.parse(updated.wargear || '[]');
      updated.talents = JSON.parse(updated.talents || '[]');

      const targetCampaign = campaignId || char.campaign_id;
      io.to(`campaign-${targetCampaign}`).emit('character_updated', updated);
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });
}

module.exports = registerSocketHandlers;

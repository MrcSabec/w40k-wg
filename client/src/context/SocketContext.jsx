import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import { useUser } from './UserContext';
import { SOCKET_SERVER_URL, apiUrl } from '../config';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, authHeaders } = useUser();

  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [latestRoll, setLatestRoll] = useState(null);

  // Initialize Socket connection
  useEffect(() => {
    const s = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
    });

    s.on('connect', () => {
      console.log('Socket conectado:', s.id);
      setConnected(true);
    });

    s.on('disconnect', () => {
      console.log('Socket desconectado');
      setConnected(false);
    });

    s.on('meta_updated', (data) => {
      setActiveCampaign(prev => {
        if (!prev) return null;
        return {
          ...prev,
          glory: data.glory !== undefined ? data.glory : prev.glory,
          ruin: prev.role === 'gm' && data.ruin !== undefined ? data.ruin : prev.ruin
        };
      });
    });

    s.on('character_updated', (updatedChar) => {
      setCharacters(prev => prev.map(c => c.id === updatedChar.id ? updatedChar : c));
    });

    s.on('new_roll', (msg) => {
      setLatestRoll(msg);
      if (msg.roll_data?.hasWrathCrit) {
        try {
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#cba338', '#f1cc64', '#dc2626']
          });
        } catch (e) {
          // ignore confetti errors in restricted browser contexts
        }
      }
    });

    s.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  // When activeCampaign or user changes, join campaign room and load data
  useEffect(() => {
    if (!socket || !user || !activeCampaign) return;

    socket.emit('join_campaign', {
      campaignId: activeCampaign.id,
      token: user.token
    });

    // Refresh campaign metadata
    fetch(apiUrl(`/api/campaigns/${activeCampaign.id}`), { headers: authHeaders })
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setActiveCampaign(data);
        }
      })
      .catch(console.error);

    // Refresh characters
    fetch(apiUrl(`/api/characters/campaign/${activeCampaign.id}`), { headers: authHeaders })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCharacters(data);
      })
      .catch(console.error);

    // Refresh campaign members (for whispers)
    fetch(apiUrl(`/api/users/campaign/${activeCampaign.id}`), { headers: authHeaders })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMembers(data);
      })
      .catch(console.error);

    // Refresh chat messages
    fetch(apiUrl(`/api/messages/campaign/${activeCampaign.id}?limit=50`), { headers: authHeaders })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(console.error);

  }, [socket, user?.token, activeCampaign?.id]);

  // Actions
  const rollDice = ({ poolSize, bonusDice = 0, dn = 0, label, attributeName, skillName }) => {
    if (!socket || !activeCampaign) return;
    socket.emit('roll_dice', {
      campaignId: activeCampaign.id,
      poolSize,
      bonusDice,
      dn,
      label,
      attributeName,
      skillName
    });
  };

  const rollMob = ({ mobId, mobName, creatureCount, baseAttribute, baseSkill, dn }) => {
    if (!socket || !activeCampaign || activeCampaign.role !== 'gm') return;
    socket.emit('roll_mob', {
      campaignId: activeCampaign.id,
      mobId,
      mobName,
      creatureCount,
      baseAttribute,
      baseSkill,
      dn
    });
  };

  const updateMeta = (ruin, glory) => {
    if (!socket || !activeCampaign || activeCampaign.role !== 'gm') return;
    socket.emit('update_meta', {
      campaignId: activeCampaign.id,
      ruin,
      glory
    });
  };

  const updateCharacterStatus = ({ characterId, wounds_current, shock_current, wrath_points }) => {
    if (!socket || !activeCampaign) return;
    socket.emit('update_character_status', {
      characterId,
      campaignId: activeCampaign.id,
      wounds_current,
      shock_current,
      wrath_points
    });
  };

  const sendChat = (content, recipientId = null) => {
    if (!socket || !activeCampaign || !content.trim()) return;
    socket.emit('send_chat', {
      campaignId: activeCampaign.id,
      content,
      recipientId
    });
  };

  const refreshCharacters = () => {
    if (!activeCampaign) return;
    fetch(apiUrl(`/api/characters/campaign/${activeCampaign.id}`), { headers: authHeaders })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCharacters(data);
      })
      .catch(console.error);
  };

  // Backwards-compatible aliases so old components never crash on undefined
  const currentCampaignId = activeCampaign?.id || null;
  const campaignMeta = {
    ruin: activeCampaign?.role === 'gm' ? (activeCampaign?.ruin || 0) : null,
    glory: activeCampaign?.glory || 0
  };
  const isGM = activeCampaign?.role === 'gm';
  const userRole = activeCampaign?.role || 'player';
  const playerName = user?.name || 'Jogador';

  return (
    <SocketContext.Provider value={{
      socket,
      connected,
      activeCampaign,
      setActiveCampaign,
      currentCampaignId,
      campaignMeta,
      isGM,
      userRole,
      playerName,
      characters,
      setCharacters,
      members,
      messages,
      latestRoll,
      rollDice,
      rollMob,
      updateMeta,
      updateCharacterStatus,
      sendChat,
      refreshCharacters
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useSocket deve ser usado dentro de um SocketProvider');
  }
  return ctx;
}

import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Skull, Flame, Crown, Shield, Dices, Radio, Plus, Minus, Users, FileText, UserPlus, MessageSquare } from 'lucide-react';
import { apiUrl } from '../config';

export default function Navbar({ activeTab, setActiveTab, onOpenRoller }) {
  const {
    connected,
    currentCampaignId,
    setCurrentCampaignId,
    campaignMeta,
    updateMeta,
    userRole,
    setUserRole,
    playerName,
    setPlayerName
  } = useSocket();

  const [campaigns, setCampaigns] = useState([]);

  // Fetch campaigns for switcher
  useEffect(() => {
    fetch(apiUrl('/api/campaigns'))
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCampaigns(data);
      })
      .catch(console.error);
  }, [currentCampaignId]);

  return (
    <header className="sticky top-0 z-40 bg-grim-950/95 border-b border-gothic-gold/40 backdrop-blur-md shadow-grim">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & System Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-gradient-to-br from-gothic-gold to-gothic-goldDark flex items-center justify-center shadow-lg border border-amber-300/40">
              <Skull className="w-6 h-6 text-grim-950" />
            </div>
            <div>
              <h1 className="font-gothic font-bold text-base sm:text-lg text-gothic-gold tracking-wider uppercase leading-none">
                Wrath & Glory
              </h1>
              <span className="text-[10px] text-grim-400 font-tech tracking-widest uppercase">
                VTT & Gerenciador 2ª Edição
              </span>
            </div>
          </div>

          {/* Real-time Metacurrencies (Ruin & Glory) */}
          <div className="hidden md:flex items-center gap-4 bg-grim-900/80 px-4 py-1.5 rounded-lg border border-grim-700">
            {/* Ruin (GM Pool) */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-gothic-warpLight">
                <Skull className="w-4 h-4 text-gothic-warpLight" />
                <span className="text-xs uppercase font-gothic font-bold tracking-wider">Ruína:</span>
                <span className="font-tech text-lg font-black text-white px-1.5 py-0.5 rounded bg-purple-950 border border-purple-800/80 min-w-[28px] text-center">
                  {campaignMeta.ruin}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <button 
                  title="Adicionar Ruína"
                  onClick={() => updateMeta(campaignMeta.ruin + 1, campaignMeta.glory)}
                  className="p-0.5 hover:bg-grim-800 text-grim-400 hover:text-white rounded transition"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button 
                  title="Gastar Ruína"
                  onClick={() => updateMeta(Math.max(0, campaignMeta.ruin - 1), campaignMeta.glory)}
                  className="p-0.5 hover:bg-grim-800 text-grim-400 hover:text-white rounded transition"
                >
                  <Minus className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="w-px h-6 bg-grim-700" />

            {/* Glory (Party Pool) */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-gothic-gold">
                <Crown className="w-4 h-4 text-gothic-gold" />
                <span className="text-xs uppercase font-gothic font-bold tracking-wider">Glória:</span>
                <span className="font-tech text-lg font-black text-grim-950 px-1.5 py-0.5 rounded bg-gothic-gold border border-amber-300 min-w-[28px] text-center">
                  {campaignMeta.glory}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <button 
                  title="Adicionar Glória"
                  onClick={() => updateMeta(campaignMeta.ruin, campaignMeta.glory + 1)}
                  className="p-0.5 hover:bg-grim-800 text-grim-400 hover:text-white rounded transition"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button 
                  title="Gastar Glória"
                  onClick={() => updateMeta(campaignMeta.ruin, Math.max(0, campaignMeta.glory - 1))}
                  className="p-0.5 hover:bg-grim-800 text-grim-400 hover:text-white rounded transition"
                >
                  <Minus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions & Role Switcher */}
          <div className="flex items-center gap-3">
            {/* Quick Roll Button */}
            <button
              onClick={() => onOpenRoller()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-900/80 hover:bg-red-800 border border-red-600/80 text-amber-200 text-xs font-bold font-gothic uppercase tracking-wider shadow hover:shadow-red-900/50 transition active:scale-95"
            >
              <Dices className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">Rolar Dados</span>
            </button>

            {/* Role Select */}
            <div className="flex items-center bg-grim-900 rounded border border-grim-700 p-0.5 text-xs">
              <button
                onClick={() => { setUserRole('gm'); setPlayerName('Mestre (GM)'); }}
                className={`px-2.5 py-1 rounded font-semibold uppercase tracking-wider transition ${
                  userRole === 'gm' ? 'bg-gothic-gold text-grim-950 shadow' : 'text-grim-400 hover:text-white'
                }`}
              >
                Mestre
              </button>
              <button
                onClick={() => { setUserRole('player'); setPlayerName('Jogador'); }}
                className={`px-2.5 py-1 rounded font-semibold uppercase tracking-wider transition ${
                  userRole === 'player' ? 'bg-gothic-gold text-grim-950 shadow' : 'text-grim-400 hover:text-white'
                }`}
              >
                Jogador
              </button>
            </div>

            {/* Connection Indicator */}
            <div 
              title={connected ? "Conectado ao Servidor VTT" : "Desconectado do Servidor"}
              className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 animate-pulse'}`}
            />
          </div>

        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-t border-grim-800/80 py-2 overflow-x-auto text-xs uppercase font-gothic font-bold tracking-wider">
          <button
            onClick={() => setActiveTab('gm')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition ${
              activeTab === 'gm' 
                ? 'bg-gothic-gold/20 text-gothic-gold border border-gothic-gold/50 shadow' 
                : 'text-grim-400 hover:text-grim-200 hover:bg-grim-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Painel do Mestre (GM)</span>
          </button>

          <button
            onClick={() => setActiveTab('sheet')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition ${
              activeTab === 'sheet' 
                ? 'bg-gothic-gold/20 text-gothic-gold border border-gothic-gold/50 shadow' 
                : 'text-grim-400 hover:text-grim-200 hover:bg-grim-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Ficha de Personagem</span>
          </button>

          <button
            onClick={() => setActiveTab('creator')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition ${
              activeTab === 'creator' 
                ? 'bg-gothic-gold/20 text-gothic-gold border border-gothic-gold/50 shadow' 
                : 'text-grim-400 hover:text-grim-200 hover:bg-grim-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Criador de Fichas (XP)</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded transition ${
              activeTab === 'chat' 
                ? 'bg-gothic-gold/20 text-gothic-gold border border-gothic-gold/50 shadow' 
                : 'text-grim-400 hover:text-grim-200 hover:bg-grim-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat & Rolagens</span>
          </button>

          {/* Campaign Selector on right */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] text-grim-500 font-tech">CAMPANHA:</span>
            <select
              value={currentCampaignId}
              onChange={e => setCurrentCampaignId(Number(e.target.value))}
              className="bg-grim-900 border border-grim-700 rounded px-2 py-1 text-xs text-gothic-gold font-bold outline-none"
            >
              {campaigns.map(c => (
                <option key={c.id} value={c.id}>
                  Tier {c.tier} - {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>
    </header>
  );
}

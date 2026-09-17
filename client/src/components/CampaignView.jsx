import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import { Shield, Skull, Crown, Copy, Check, ArrowLeft, Dices, Users, FileText, UserPlus, MessageSquare, Swords } from 'lucide-react';
import GMDashboard from './GMDashboard';
import CharacterSheet from './CharacterSheet';
import CharacterCreator from './CharacterCreator';
import ChatLog from './ChatLog';

export default function CampaignView({ onBackToHub, onOpenRoller }) {
  const { activeCampaign, updateMeta, characters } = useSocket();

  const isGM = activeCampaign?.role === 'gm';

  // Navigation tab inside campaign
  const [activeTab, setActiveTab] = useState(isGM ? 'gm_dashboard' : 'my_sheet');
  const [copiedCode, setCopiedCode] = useState(false);

  // Copy invite code helper
  const handleCopyCode = () => {
    if (activeCampaign?.invite_code) {
      navigator.clipboard.writeText(activeCampaign.invite_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  // Find player's own character if player
  const myCharacter = characters.find(c => c.is_owner);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Campaign Header & Role Bar */}
      <div className="bg-grim-950 border border-gothic-gold/40 rounded-2xl p-5 shadow-2xl gothic-panel-gold">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Back & Campaign Info */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToHub}
              title="Voltar ao Hub de Campanhas"
              className="p-2 bg-grim-900 hover:bg-grim-800 text-gothic-gold rounded-lg border border-grim-700 transition active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase font-gothic font-black px-2.5 py-0.5 rounded border tracking-wider ${
                  isGM 
                    ? 'bg-purple-950/80 border-purple-500 text-purple-300' 
                    : 'bg-blue-950/80 border-blue-500 text-blue-300'
                }`}>
                  {isGM ? '👑 VOCÊ É O MESTRE (GM)' : '🛡️ VOCÊ É JOGADOR'}
                </span>
                <span className="text-[10px] uppercase font-tech text-grim-400 font-bold">
                  TIER {activeCampaign?.tier}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-gothic font-black text-grim-100 mt-0.5">
                {activeCampaign?.name}
              </h1>
            </div>
          </div>

          {/* Invite Code & Metacurrencies */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            
            {/* Invite Code Widget */}
            <div className="flex items-center gap-2 bg-grim-900 px-3 py-1.5 rounded-lg border border-grim-700">
              <div>
                <span className="block text-[9px] uppercase font-tech text-grim-500">Código de Convite</span>
                <span className="font-tech text-sm font-black text-gothic-gold tracking-wider">
                  {activeCampaign?.invite_code}
                </span>
              </div>
              <button
                onClick={handleCopyCode}
                title="Copiar Código de Convite para Enviar a Jogadores"
                className="p-1.5 hover:bg-grim-800 text-grim-300 hover:text-white rounded transition"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-gothic-gold" />}
              </button>
            </div>

            {/* Metacurrency: RUIN (Visible EXCLUSIVELY to GM!) */}
            {isGM && (
              <div className="flex items-center gap-2 bg-purple-950/40 border border-purple-800/80 px-3 py-1.5 rounded-lg">
                <div className="flex items-center gap-1.5 text-gothic-warpLight">
                  <Skull className="w-4 h-4 text-gothic-warpLight" />
                  <span className="text-xs uppercase font-gothic font-bold">Ruína:</span>
                  <span className="font-tech text-lg font-black text-white px-1.5 py-0.2 rounded bg-purple-950 border border-purple-700 min-w-[26px] text-center">
                    {activeCampaign?.ruin || 0}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <button 
                    title="Adicionar Ruína"
                    onClick={() => updateMeta((activeCampaign?.ruin || 0) + 1, activeCampaign?.glory || 0)}
                    className="text-[10px] px-1 bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded"
                  >
                    +
                  </button>
                  <button 
                    title="Gastar Ruína"
                    onClick={() => updateMeta(Math.max(0, (activeCampaign?.ruin || 0) - 1), activeCampaign?.glory || 0)}
                    className="text-[10px] px-1 bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded"
                  >
                    -
                  </button>
                </div>
              </div>
            )}

            {/* Metacurrency: GLORY (Visible to BOTH GM and Player) */}
            <div className="flex items-center gap-2 bg-amber-950/40 border border-amber-500/50 px-3 py-1.5 rounded-lg">
              <div className="flex items-center gap-1.5 text-gothic-gold">
                <Crown className="w-4 h-4 text-gothic-gold" />
                <span className="text-xs uppercase font-gothic font-bold">Glória:</span>
                <span className="font-tech text-lg font-black text-grim-950 px-1.5 py-0.2 rounded bg-gothic-gold border border-amber-300 min-w-[26px] text-center">
                  {activeCampaign?.glory || 0}
                </span>
              </div>
              {/* GM can manipulate Glory */}
              {isGM && (
                <div className="flex flex-col gap-0.5">
                  <button 
                    title="Adicionar Glória"
                    onClick={() => updateMeta(activeCampaign?.ruin || 0, (activeCampaign?.glory || 0) + 1)}
                    className="text-[10px] px-1 bg-amber-900/60 hover:bg-amber-800 text-amber-200 rounded"
                  >
                    +
                  </button>
                  <button 
                    title="Gastar Glória"
                    onClick={() => updateMeta(activeCampaign?.ruin || 0, Math.max(0, (activeCampaign?.glory || 0) - 1))}
                    className="text-[10px] px-1 bg-amber-900/60 hover:bg-amber-800 text-amber-200 rounded"
                  >
                    -
                  </button>
                </div>
              )}
            </div>

            {/* Quick Roll Button */}
            <button
              onClick={() => onOpenRoller()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-900/90 hover:bg-red-800 border border-red-600 text-amber-200 text-xs font-gothic font-bold uppercase tracking-wider shadow transition active:scale-95"
            >
              <Dices className="w-4 h-4 text-amber-300" />
              <span>Rolar</span>
            </button>

          </div>

        </div>

        {/* Campaign Navigation Tabs (Segregated by Role) */}
        <div className="flex items-center gap-2 border-t border-grim-800/80 pt-3 mt-4 overflow-x-auto text-xs uppercase font-gothic font-bold tracking-wider">
          
          {/* GM TABS */}
          {isGM && (
            <>
              <button
                onClick={() => setActiveTab('gm_dashboard')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded transition ${
                  activeTab === 'gm_dashboard' 
                    ? 'bg-gothic-gold text-grim-950 shadow font-bold' 
                    : 'text-grim-400 hover:text-white bg-grim-900'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Painel do Mestre</span>
              </button>

              <button
                onClick={() => setActiveTab('all_sheets')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded transition ${
                  activeTab === 'all_sheets' 
                    ? 'bg-gothic-gold text-grim-950 shadow font-bold' 
                    : 'text-grim-400 hover:text-white bg-grim-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Fichas dos Jogadores ({characters.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded transition ${
                  activeTab === 'chat' 
                    ? 'bg-gothic-gold text-grim-950 shadow font-bold' 
                    : 'text-grim-400 hover:text-white bg-grim-900'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat & Sussurros</span>
              </button>
            </>
          )}

          {/* PLAYER TABS */}
          {!isGM && (
            <>
              <button
                onClick={() => setActiveTab('my_sheet')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded transition ${
                  activeTab === 'my_sheet' 
                    ? 'bg-gothic-gold text-grim-950 shadow font-bold' 
                    : 'text-grim-400 hover:text-white bg-grim-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Minha Ficha</span>
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded transition ${
                  activeTab === 'chat' 
                    ? 'bg-gothic-gold text-grim-950 shadow font-bold' 
                    : 'text-grim-400 hover:text-white bg-grim-900'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat & Rolagens</span>
              </button>
            </>
          )}

        </div>

      </div>

      {/* RENDER ACTIVE TAB CONTENT */}
      <div>
        {/* GM: Dashboard */}
        {isGM && activeTab === 'gm_dashboard' && (
          <GMDashboard onOpenRoller={onOpenRoller} />
        )}

        {/* GM: View/Edit All Player Sheets */}
        {isGM && activeTab === 'all_sheets' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-grim-900 p-3 rounded-lg border border-grim-800">
              <span className="text-xs text-grim-400 font-tech">
                Como Mestre (GM), você possui permissão total de visualização e edição sobre todas as fichas.
              </span>
            </div>
            <CharacterSheet onOpenRoller={onOpenRoller} />
          </div>
        )}

        {/* PLAYER: My Character Sheet or Creator Wizard */}
        {!isGM && activeTab === 'my_sheet' && (
          <div>
            {myCharacter ? (
              <div className="space-y-4">
                <CharacterSheet onOpenRoller={onOpenRoller} />
              </div>
            ) : (
              <div className="bg-grim-900 border border-grim-800 rounded-xl p-8 text-center gothic-panel space-y-4">
                <Shield className="w-12 h-12 text-gothic-gold mx-auto" />
                <h3 className="text-xl font-gothic font-bold text-gothic-gold">
                  Você ainda não possui uma Ficha nesta Campanha
                </h3>
                <p className="text-xs text-grim-400 max-w-md mx-auto">
                  Crie seu acólito agora mesmo com o criador passo a passo, respeitando o limite de XP do <strong>Tier {activeCampaign?.tier}</strong> da campanha.
                </p>
                <div className="pt-2">
                  <CharacterCreator onCreated={() => setActiveTab('my_sheet')} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* CHAT TAB (BOTH ROLES) */}
        {activeTab === 'chat' && (
          <ChatLog />
        )}
      </div>

    </div>
  );
}

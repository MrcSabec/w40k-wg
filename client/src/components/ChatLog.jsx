import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useUser } from '../context/UserContext';
import DiceDisplay from './DiceDisplay';
import { Send, MessageSquare, Dices, Skull, Flame, Lock, Users, Swords } from 'lucide-react';

export default function ChatLog() {
  const { messages, sendChat, activeCampaign, members } = useSocket();
  const { user } = useUser();

  const [inputText, setInputText] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'rolls', 'chat', 'whispers'
  const [recipientId, setRecipientId] = useState(''); // '' = public; or userId for whisper

  const messagesEndRef = useRef(null);

  const isGM = activeCampaign?.role === 'gm';

  // Find GM user in members list (for players to whisper)
  const gmMember = members.find(m => m.role === 'gm');
  // List players in members list (for GM to whisper)
  const playerMembers = members.filter(m => m.role === 'player' && m.id !== user?.id);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const targetId = recipientId ? Number(recipientId) : null;
    sendChat(inputText, targetId);
    setInputText('');
  };

  const filteredMessages = messages.filter(msg => {
    if (filter === 'rolls') return msg.message_type === 'roll' || msg.message_type === 'horde_roll';
    if (filter === 'chat') return msg.message_type === 'chat' || msg.message_type === 'system';
    if (filter === 'whispers') return msg.is_whisper;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto bg-grim-900 border border-grim-700/80 rounded-xl shadow-2xl flex flex-col h-[750px] gothic-panel overflow-hidden animate-fadeIn">
      
      {/* Header & Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-grim-800 bg-grim-950">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gothic-gold" />
          <h2 className="font-gothic font-bold text-base text-gothic-gold uppercase tracking-wider">
            Feed de Comunicações & Rolagens
          </h2>
        </div>

        <div className="flex items-center gap-1 bg-grim-900 p-0.5 rounded border border-grim-800 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded transition ${filter === 'all' ? 'bg-gothic-gold text-grim-950 font-bold' : 'text-grim-400 hover:text-white'}`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilter('rolls')}
            className={`px-2.5 py-1 rounded transition ${filter === 'rolls' ? 'bg-gothic-gold text-grim-950 font-bold' : 'text-grim-400 hover:text-white'}`}
          >
            Rolagens
          </button>
          <button
            onClick={() => setFilter('chat')}
            className={`px-2.5 py-1 rounded transition ${filter === 'chat' ? 'bg-gothic-gold text-grim-950 font-bold' : 'text-grim-400 hover:text-white'}`}
          >
            Mensagens
          </button>
          <button
            onClick={() => setFilter('whispers')}
            className={`px-2.5 py-1 rounded transition ${filter === 'whispers' ? 'bg-purple-900 text-purple-200 font-bold' : 'text-grim-400 hover:text-white'}`}
          >
            Sussurros
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 dataslate-screen">
        {filteredMessages.map((msg, idx) => {
          const roll = msg.roll_data;
          const isRoll = msg.message_type === 'roll' || msg.message_type === 'horde_roll';
          const isWhisper = msg.is_whisper;

          // Roll message
          if (isRoll && roll) {
            return (
              <div 
                key={msg.id || idx}
                className={`p-4 rounded-xl border relative shadow-lg ${
                  roll.hasWrathCrit 
                    ? 'bg-gradient-to-r from-red-950/70 via-amber-950/60 to-grim-950 border-amber-400/80 shadow-[0_0_15px_rgba(203,163,56,0.2)]'
                    : roll.hasComplication
                    ? 'bg-gradient-to-r from-red-950/80 via-rose-950/60 to-grim-950 border-red-500/80 shadow-[0_0_15px_rgba(220,38,38,0.2)]'
                    : 'bg-grim-950 border-grim-800'
                }`}
              >
                {/* Sender & Timestamp */}
                <div className="flex items-center justify-between border-b border-grim-800/80 pb-2 mb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-gothic font-bold text-gothic-gold">
                      {msg.sender_name}
                    </span>
                    <span className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold ${
                      msg.sender_role === 'gm' ? 'bg-purple-950 border border-purple-800 text-purple-300' : 'bg-amber-950 border border-amber-800 text-amber-300'
                    }`}>
                      {msg.sender_role === 'gm' ? 'Mestre' : 'Acólito'}
                    </span>
                  </div>
                  <span className="text-[10px] text-grim-500 font-tech">
                    {msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : 'Agora'}
                  </span>
                </div>

                {/* Roll Title & Outcome */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <h4 className="font-gothic font-bold text-sm text-grim-100 flex items-center gap-1.5">
                      {roll.isHorde ? <Swords className="w-4 h-4 text-red-400" /> : <Dices className="w-4 h-4 text-gothic-gold" />}
                      {roll.label}
                    </h4>
                    {roll.isHorde && (
                      <p className="text-[11px] text-red-300/80">
                        {roll.creatureCount} membros (+{roll.hordeBonusDice} dados bônus por horda)
                      </p>
                    )}
                  </div>

                  {/* Icons tally */}
                  <div className="flex items-center gap-2">
                    <div className="font-tech text-xl font-black text-gothic-gold bg-grim-900 px-3 py-1 rounded border border-grim-700">
                      {roll.totalIcons} Ícones
                    </div>
                    {roll.dn > 0 && (
                      <span className={`text-xs uppercase font-bold px-2 py-1 rounded border ${
                        roll.success ? 'bg-emerald-950 text-emerald-300 border-emerald-700' : 'bg-rose-950 text-rose-300 border-rose-700'
                      }`}>
                        {roll.success ? 'Sucesso' : 'Falha'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Special Wrath Banners in Chat */}
                {roll.hasWrathCrit && (
                  <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-amber-900/60 to-red-900/60 border border-amber-400 rounded text-xs text-amber-200 font-bold mb-3">
                    <Flame className="w-4 h-4 text-amber-300 shrink-0 animate-bounce" />
                    <span>CRÍTICO DE IRA! O Dado de Ira rolou 6 (+1 Glória para a mesa!)</span>
                  </div>
                )}

                {roll.hasComplication && (
                  <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-red-950/80 to-rose-950/80 border border-red-500 rounded text-xs text-red-300 font-bold mb-3">
                    <Skull className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
                    <span>COMPLICAÇÃO! O Dado de Ira rolou 1 (+1 Ruína para o Mestre!)</span>
                  </div>
                )}

                {/* Dice breakdown */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <DiceDisplay value={roll.wrathDie} isWrath={true} size="md" />
                  {roll.regularDice && roll.regularDice.map((d, i) => (
                    <DiceDisplay key={i} value={d} isWrath={false} size="md" />
                  ))}
                </div>
              </div>
            );
          }

          // Plain Chat or Whisper Message
          return (
            <div 
              key={msg.id || idx}
              className={`p-3 rounded-lg border text-xs ${
                isWhisper
                  ? 'bg-purple-950/40 border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                  : msg.sender_role === 'gm'
                  ? 'bg-purple-950/20 border-purple-800/40' 
                  : msg.message_type === 'system'
                  ? 'bg-grim-950 border-gothic-gold/40 text-gothic-gold font-tech'
                  : 'bg-grim-950 border-grim-800'
              }`}
            >
              <div className="flex items-center justify-between mb-1 text-[11px]">
                <div className="flex items-center gap-1.5 font-bold">
                  {isWhisper ? (
                    <div className="flex items-center gap-1.5 text-purple-300">
                      <Lock className="w-3.5 h-3.5 text-purple-400" />
                      <span>
                        [Sussurro] {msg.sender_id === user?.id ? `Para ${msg.recipient_name || 'Destinatário'}` : `De ${msg.sender_name}`}
                      </span>
                    </div>
                  ) : (
                    <span className={msg.sender_role === 'gm' ? 'text-purple-400' : 'text-gothic-gold'}>
                      {msg.sender_name}
                    </span>
                  )}

                  {!isWhisper && msg.sender_role === 'gm' && (
                    <span className="text-[9px] uppercase text-purple-400 font-tech">[GM]</span>
                  )}
                </div>

                <span className="text-[10px] text-grim-500 font-tech">
                  {msg.created_at ? new Date(msg.created_at).toLocaleTimeString() : 'Agora'}
                </span>
              </div>

              <p className="text-grim-200 leading-relaxed font-body">
                {msg.content}
              </p>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form with Whisper Channel Selector */}
      <form onSubmit={handleSend} className="p-3 bg-grim-950 border-t border-grim-800 space-y-2">
        {/* Recipient Channel Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-grim-500 font-tech uppercase text-[10px] flex items-center gap-1">
            <Lock className="w-3 h-3 text-gothic-gold" /> Canal de Envio:
          </span>
          
          <select
            value={recipientId}
            onChange={e => setRecipientId(e.target.value)}
            className="bg-grim-900 border border-grim-700 text-grim-200 text-xs rounded px-2 py-1 outline-none font-gothic"
          >
            <option value="">📢 Mesa Geral (Todos)</option>
            
            {/* If GM: can whisper to any player */}
            {isGM && playerMembers.map(player => (
              <option key={player.id} value={player.id}>
                🔒 Sussurrar para: {player.name}
              </option>
            ))}

            {/* If Player: can whisper directly to GM */}
            {!isGM && gmMember && (
              <option value={gmMember.id}>
                🔒 Canal Direto com o Mestre ({gmMember.name})
              </option>
            )}
          </select>
        </div>

        {/* Input & Send Button */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={
              recipientId 
                ? `Enviar sussurro confidencial...` 
                : `Transmitir para a mesa inteira...`
            }
            className={`flex-1 bg-grim-900 border rounded px-3 py-2 text-xs text-grim-100 outline-none font-body ${
              recipientId ? 'border-purple-500/80 focus:border-purple-400' : 'border-grim-700 focus:border-gothic-gold'
            }`}
          />
          <button
            type="submit"
            className={`p-2 rounded shadow transition active:scale-95 text-grim-950 ${
              recipientId ? 'bg-purple-500 hover:bg-purple-400' : 'bg-gothic-gold hover:bg-amber-400'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

    </div>
  );
}

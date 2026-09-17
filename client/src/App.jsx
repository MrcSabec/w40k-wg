import React, { useState } from 'react';
import { UserProvider, useUser } from './context/UserContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import Login from './components/Login';
import CampaignHub from './components/CampaignHub';
import CampaignView from './components/CampaignView';
import DiceRollerModal from './components/DiceRollerModal';
import { Skull, LogOut, User as UserIcon, ShieldAlert } from 'lucide-react';

function MainRouter() {
  const { user, loading, logout } = useUser();
  const { activeCampaign, setActiveCampaign, connected } = useSocket();

  const [isRollerOpen, setIsRollerOpen] = useState(false);
  const [rollerData, setRollerData] = useState({
    poolSize: 5,
    bonusDice: 0,
    dn: 3,
    label: 'Teste Geral'
  });

  const handleOpenRoller = (data = {}) => {
    setRollerData(prev => ({
      ...prev,
      ...data
    }));
    setIsRollerOpen(true);
  };

  const handleLogout = () => {
    setActiveCampaign(null);
    logout();
  };

  // 1. Initial Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-grim-950 text-grim-200 flex flex-col items-center justify-center font-tech space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gothic-gold to-amber-700 flex items-center justify-center animate-pulse border border-amber-300">
          <Skull className="w-8 h-8 text-grim-950 animate-spin" style={{ animationDuration: '3s' }} />
        </div>
        <p className="text-xs uppercase tracking-widest text-gothic-gold">
          Consultando Arquivos do Trono Dourado...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated Screen -> Mandatory Login / Auto-Registration
  if (!user) {
    return (
      <div className="min-h-screen bg-grim-950 text-grim-200 flex flex-col font-body selection:bg-gothic-gold selection:text-grim-950">
        <main className="flex-1 flex items-center justify-center">
          <Login />
        </main>
        <footer className="border-t border-grim-800/80 bg-grim-950 py-3 text-center text-xs text-grim-500 font-tech">
          <p>WARHAMMER 40,000: WRATH & GLORY — AUTENTICAÇÃO HÍBRIDA MULTI-TAB</p>
        </footer>
      </div>
    );
  }

  // 3. Authenticated Application
  return (
    <div className="min-h-screen bg-grim-950 text-grim-200 flex flex-col font-body selection:bg-gothic-gold selection:text-grim-950">
      
      {/* Top Application Bar with Persistent User Identity & Logout */}
      <header className="border-b border-grim-800 bg-grim-950/90 backdrop-blur sticky top-0 z-40 px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gothic-gold/20 border border-gothic-gold/50 flex items-center justify-center">
              <Skull className="w-4 h-4 text-gothic-gold" />
            </div>
            <div>
              <span className="text-xs font-gothic font-black text-grim-100 tracking-wider block">
                WRATH & GLORY VTT
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-tech text-grim-500 uppercase">
                  {connected ? '🟢 Conectado ao Vox' : '🔴 Reconectando...'}
                </span>
                {activeCampaign && (
                  <span className="text-[9px] font-tech text-gothic-gold">
                    // {activeCampaign.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* User Status & Fast Switch */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-grim-900 border border-grim-800 text-xs">
              <UserIcon className="w-3.5 h-3.5 text-gothic-gold" />
              <span className="text-grim-400 font-tech text-[10px] uppercase">Usuário:</span>
              <span className="font-bold text-grim-200">{user.name || user.username}</span>
            </div>

            <button
              onClick={handleLogout}
              title="Encerrar sessão ou trocar de usuário"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300 hover:text-rose-100 text-xs font-tech uppercase tracking-wider transition active:scale-95 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desconectar</span>
            </button>
          </div>

        </div>
      </header>

      {/* Dynamic Content: Hub vs Campaign View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!activeCampaign ? (
          <CampaignHub onSelectCampaign={(camp) => setActiveCampaign(camp)} />
        ) : (
          <CampaignView 
            onBackToHub={() => setActiveCampaign(null)} 
            onOpenRoller={handleOpenRoller} 
          />
        )}
      </main>

      {/* Global Dice Roller Modal */}
      <DiceRollerModal 
        isOpen={isRollerOpen} 
        onClose={() => setIsRollerOpen(false)} 
        initialData={rollerData} 
      />

      {/* Atmospheric Imperial Footer */}
      <footer className="border-t border-grim-800/80 bg-grim-950 py-4 text-center text-xs text-grim-500 font-tech">
        <p>
          WARHAMMER 40,000: WRATH & GLORY — VTT VIRTUAL TABLETOP & CAMPAIGN ENGINE
        </p>
        <p className="text-[10px] text-grim-600 mt-0.5">
          "No milênio sombrio do futuro distante, há apenas a guerra." // SESSÃO ISOLADA MULTI-USER
        </p>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <SocketProvider>
        <MainRouter />
      </SocketProvider>
    </UserProvider>
  );
}

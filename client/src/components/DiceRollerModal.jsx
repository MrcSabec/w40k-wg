import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import DiceDisplay from './DiceDisplay';
import { Dices, Skull, Flame, Sparkles, X, Plus, Minus, ShieldAlert } from 'lucide-react';

export default function DiceRollerModal({ isOpen, onClose, initialData = {} }) {
  const { rollDice, latestRoll } = useSocket();

  const [label, setLabel] = useState(initialData.label || 'Teste Geral');
  const [basePool, setBasePool] = useState(initialData.poolSize || 4);
  const [bonusDice, setBonusDice] = useState(0);
  const [dn, setDn] = useState(initialData.dn || 0);
  const [isRolling, setIsRolling] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);

  // Update form when initialData changes
  useEffect(() => {
    if (initialData.poolSize !== undefined) {
      setBasePool(initialData.poolSize);
      setLabel(initialData.label || 'Teste');
      setBonusDice(initialData.bonusDice || 0);
      setDn(initialData.dn || 0);
      setCurrentResult(null);
    }
  }, [initialData, isOpen]);

  // When a new roll arrives for us, display it
  useEffect(() => {
    if (latestRoll && latestRoll.roll_data) {
      setCurrentResult(latestRoll.roll_data);
      setIsRolling(false);
    }
  }, [latestRoll]);

  if (!isOpen) return null;

  const totalPool = Math.max(1, Number(basePool) + Number(bonusDice));

  const handleRoll = () => {
    setIsRolling(true);
    rollDice({
      poolSize: basePool,
      bonusDice,
      dn,
      label,
      attributeName: initialData.attributeName || '',
      skillName: initialData.skillName || ''
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-grim-900 border-2 border-gothic-gold/50 rounded-xl shadow-2xl p-6 gothic-corners overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-grim-700 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Dices className="w-6 h-6 text-gothic-gold animate-spin-slow" />
            <h2 className="text-xl font-gothic font-bold text-gothic-gold tracking-wide uppercase">
              Motor de Rolagem (Wrath & Glory)
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-grim-400 hover:text-white p-1 hover:bg-grim-800 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configuration Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 bg-grim-950/70 p-4 rounded-lg border border-grim-800">
          {/* Label */}
          <div className="sm:col-span-3">
            <label className="block text-xs uppercase tracking-wider text-grim-400 font-semibold mb-1">
              Motivo / Nome da Rolagem
            </label>
            <input 
              type="text" 
              value={label} 
              onChange={e => setLabel(e.target.value)}
              className="w-full bg-grim-900 border border-grim-700 focus:border-gothic-gold rounded px-3 py-1.5 text-sm text-grim-100 outline-none"
              placeholder="Ex: Disparo de Bolter, Atletismo, Determinação..."
            />
          </div>

          {/* Base Pool */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-grim-400 font-semibold mb-1">
              Parada Base (Atributo + Perícia)
            </label>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setBasePool(prev => Math.max(1, prev - 1))}
                className="w-8 h-8 flex items-center justify-center bg-grim-800 hover:bg-grim-700 border border-grim-600 rounded text-grim-200"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="flex-1 text-center font-tech text-lg font-bold text-gothic-gold bg-grim-900 py-1 rounded border border-grim-700">
                {basePool}
              </span>
              <button 
                onClick={() => setBasePool(prev => prev + 1)}
                className="w-8 h-8 flex items-center justify-center bg-grim-800 hover:bg-grim-700 border border-grim-600 rounded text-grim-200"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Bonus Dice */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-grim-400 font-semibold mb-1">
              Dados Bônus (+/-)
            </label>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setBonusDice(prev => prev - 1)}
                className="w-8 h-8 flex items-center justify-center bg-grim-800 hover:bg-grim-700 border border-grim-600 rounded text-grim-200"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className={`flex-1 text-center font-tech text-lg font-bold py-1 rounded border border-grim-700 ${bonusDice >= 0 ? 'text-emerald-400' : 'text-rose-400'} bg-grim-900`}>
                {bonusDice >= 0 ? `+${bonusDice}` : bonusDice}
              </span>
              <button 
                onClick={() => setBonusDice(prev => prev + 1)}
                className="w-8 h-8 flex items-center justify-center bg-grim-800 hover:bg-grim-700 border border-grim-600 rounded text-grim-200"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* DN Target */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-grim-400 font-semibold mb-1">
              Dificuldade (DN)
            </label>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setDn(prev => Math.max(0, prev - 1))}
                className="w-8 h-8 flex items-center justify-center bg-grim-800 hover:bg-grim-700 border border-grim-600 rounded text-grim-200"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="flex-1 text-center font-tech text-lg font-bold text-grim-100 bg-grim-900 py-1 rounded border border-grim-700">
                {dn === 0 ? 'Livre' : `DN ${dn}`}
              </span>
              <button 
                onClick={() => setDn(prev => prev + 1)}
                className="w-8 h-8 flex items-center justify-center bg-grim-800 hover:bg-grim-700 border border-grim-600 rounded text-grim-200"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleRoll}
            disabled={isRolling}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-3 font-gothic font-bold text-base text-grim-950 uppercase tracking-widest bg-gradient-to-r from-gothic-gold via-amber-400 to-gothic-gold hover:from-amber-400 hover:to-gothic-gold rounded shadow-lg hover:shadow-gothic-gold/40 active:scale-95 transition-all disabled:opacity-50"
          >
            <Dices className="w-5 h-5 text-grim-950" />
            <span>Rolar {totalPool}d6 (Inclui 1 Dado de Ira)</span>
          </button>
        </div>

        {/* Active Roll Result Display */}
        {currentResult && (
          <div className="mt-4 border-t border-grim-800 pt-4 animate-fadeIn">
            {/* Wrath Banners */}
            {currentResult.hasWrathCrit && (
              <div className="mb-4 bg-gradient-to-r from-red-950 via-amber-950 to-red-950 border-2 border-amber-400 rounded-lg p-3 text-center pulse-glory">
                <div className="flex items-center justify-center gap-2 text-amber-300 font-gothic font-bold text-lg">
                  <Flame className="w-6 h-6 animate-bounce text-amber-400" />
                  <span>CRÍTICO DE IRA! (+1 PONTO DE GLÓRIA PARA A PARTY)</span>
                  <Sparkles className="w-6 h-6 animate-bounce text-amber-400" />
                </div>
                <p className="text-xs text-amber-200/80 mt-1">
                  O Dado de Ira rolou 6! Concedeu 2 Ícones e adicionou +1 Glória à reserva da campanha.
                </p>
              </div>
            )}

            {currentResult.hasComplication && (
              <div className="mb-4 bg-gradient-to-r from-red-950 via-rose-950 to-red-950 border-2 border-red-500 rounded-lg p-3 text-center pulse-wrath">
                <div className="flex items-center justify-center gap-2 text-red-400 font-gothic font-bold text-lg">
                  <Skull className="w-6 h-6 animate-pulse text-red-400" />
                  <span>COMPLICAÇÃO DO DADO DE IRA! (+1 RUÍNA PARA O MESTRE)</span>
                  <ShieldAlert className="w-6 h-6 text-red-400" />
                </div>
                <p className="text-xs text-red-300/80 mt-1">
                  O Dado de Ira rolou 1! Uma reviravolta perigosa ocorreu e o Mestre recebeu +1 Ruína.
                </p>
              </div>
            )}

            {/* Icons Summary */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-grim-950 p-4 rounded-lg border border-grim-800 mb-4">
              <div>
                <span className="text-xs uppercase text-grim-400 tracking-wider">Resultado da Ação</span>
                <div className="flex items-baseline gap-2">
                  <span className="font-tech text-3xl font-black text-gothic-gold">
                    {currentResult.totalIcons} Ícones
                  </span>
                  {currentResult.exaltedIcons > 0 && (
                    <span className="text-xs text-amber-300 font-semibold">
                      ({currentResult.exaltedIcons} Exaltados)
                    </span>
                  )}
                </div>
              </div>

              {currentResult.dn > 0 && (
                <div className="text-right">
                  <span className="text-xs uppercase text-grim-400 tracking-wider">Alvo: DN {currentResult.dn}</span>
                  <div>
                    {currentResult.success ? (
                      <span className="inline-block px-3 py-1 bg-emerald-950 border border-emerald-500 text-emerald-300 font-bold uppercase rounded text-sm tracking-wider">
                        SUCESSO {currentResult.shiftedIcons > 0 ? `(+${currentResult.shiftedIcons} Deslocados)` : ''}
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 bg-rose-950 border border-rose-500 text-rose-300 font-bold uppercase rounded text-sm tracking-wider">
                        FALHA NO TESTE
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Individual Dice Rendering */}
            <div className="bg-grim-950/80 p-4 rounded-lg border border-grim-800/80">
              <span className="block text-xs uppercase tracking-wider text-grim-400 font-semibold mb-3">
                Dados Rolados (D6):
              </span>
              <div className="flex flex-wrap gap-3 items-center justify-center">
                {/* Wrath Die */}
                <DiceDisplay value={currentResult.wrathDie} isWrath={true} size="lg" />

                {/* Regular Dice */}
                {currentResult.regularDice && currentResult.regularDice.map((val, idx) => (
                  <DiceDisplay key={idx} value={val} isWrath={false} size="lg" />
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

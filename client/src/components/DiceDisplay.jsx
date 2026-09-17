import React from 'react';
import { Skull, Flame, Sparkles } from 'lucide-react';

export default function DiceDisplay({ value, isWrath = false, size = 'md' }) {
  // Dot layout for standard D6
  const renderPips = (val) => {
    const dotClasses = isWrath ? "bg-amber-300" : "bg-grim-100";
    
    // SVG or Flex representation of dots
    switch (val) {
      case 1:
        return (
          <div className="flex items-center justify-center w-full h-full">
            {isWrath ? <Skull className="w-5 h-5 text-amber-200 animate-pulse" /> : <div className={`w-2.5 h-2.5 rounded-full ${dotClasses}`} />}
          </div>
        );
      case 2:
        return (
          <div className="flex justify-between w-full h-full p-1.5">
            <div className={`w-2 h-2 rounded-full self-start ${dotClasses}`} />
            <div className={`w-2 h-2 rounded-full self-end ${dotClasses}`} />
          </div>
        );
      case 3:
        return (
          <div className="flex justify-between w-full h-full p-1.5">
            <div className={`w-2 h-2 rounded-full self-start ${dotClasses}`} />
            <div className={`w-2 h-2 rounded-full self-center ${dotClasses}`} />
            <div className={`w-2 h-2 rounded-full self-end ${dotClasses}`} />
          </div>
        );
      case 4:
        return (
          <div className="grid grid-cols-2 gap-1.5 p-1.5 w-full h-full place-items-center">
            <div className={`w-2 h-2 rounded-full ${dotClasses}`} />
            <div className={`w-2 h-2 rounded-full ${dotClasses}`} />
            <div className={`w-2 h-2 rounded-full ${dotClasses}`} />
            <div className={`w-2 h-2 rounded-full ${dotClasses}`} />
          </div>
        );
      case 5:
        return (
          <div className="relative w-full h-full p-1.5">
            <div className={`absolute top-1.5 left-1.5 w-2 h-2 rounded-full ${dotClasses}`} />
            <div className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${dotClasses}`} />
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${dotClasses}`} />
            <div className={`absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full ${dotClasses}`} />
            <div className={`absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full ${dotClasses}`} />
          </div>
        );
      case 6:
        return (
          <div className="relative w-full h-full p-1">
            {isWrath ? (
              <div className="flex flex-col items-center justify-center h-full text-amber-200">
                <Flame className="w-5 h-5 text-amber-300 animate-bounce" />
                <span className="text-[9px] font-black uppercase tracking-tighter text-amber-300">IRA 6</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1 w-full h-full place-items-center">
                <div className={`w-1.5 h-1.5 rounded-full ${dotClasses}`} />
                <div className={`w-1.5 h-1.5 rounded-full ${dotClasses}`} />
                <div className={`w-1.5 h-1.5 rounded-full ${dotClasses}`} />
                <div className={`w-1.5 h-1.5 rounded-full ${dotClasses}`} />
                <div className={`w-1.5 h-1.5 rounded-full ${dotClasses}`} />
                <div className={`w-1.5 h-1.5 rounded-full ${dotClasses}`} />
              </div>
            )}
          </div>
        );
      default:
        return <span>{val}</span>;
    }
  };

  // Icon badge calculation
  let iconLabel = '0';
  let badgeColor = 'bg-zinc-800 text-zinc-400 border-zinc-700';

  if (value === 6) {
    iconLabel = '2 (Exaltado)';
    badgeColor = isWrath ? 'bg-amber-500 text-black font-bold border-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'bg-gothic-gold text-grim-950 font-bold border-gothic-goldLight';
  } else if (value >= 4) {
    iconLabel = '1 Ícone';
    badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-700';
  } else {
    iconLabel = 'Falha';
    badgeColor = 'bg-rose-950/40 text-rose-400/80 border-rose-900/50';
  }

  const dimensionClass = size === 'lg' ? 'w-14 h-14' : 'w-11 h-11';

  return (
    <div className="flex flex-col items-center gap-1 group">
      {/* Die Container */}
      <div 
        className={`
          ${dimensionClass} rounded-lg relative transition-all duration-300 select-none shadow-md
          flex items-center justify-center border-2
          ${isWrath 
            ? 'bg-gradient-to-br from-red-700 via-red-900 to-black border-amber-400 shadow-[0_0_15px_rgba(220,38,38,0.7)] ring-1 ring-amber-400/50' 
            : 'bg-gradient-to-br from-grim-800 to-grim-950 border-grim-600 group-hover:border-gothic-gold/60'
          }
        `}
      >
        {renderPips(value)}

        {/* Wrath Tag badge */}
        {isWrath && (
          <div className="absolute -top-2.5 bg-red-600 text-amber-200 text-[8px] font-black uppercase px-1.5 py-0.2 rounded border border-amber-400/80 shadow">
            IRA
          </div>
        )}
      </div>

      {/* Result Badge */}
      <span className={`text-[10px] px-1.5 py-0.5 rounded border leading-none tracking-tight ${badgeColor}`}>
        {iconLabel}
      </span>
    </div>
  );
}

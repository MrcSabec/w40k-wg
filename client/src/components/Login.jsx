import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { Skull, KeyRound, User, Lock, AlertTriangle, ArrowRight, ShieldCheck, Sparkles, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login } = useUser();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessInfo('');

    if (!username.trim()) {
      setError('Por favor, informe seu Nome de Usuário.');
      return;
    }
    if (!password.trim()) {
      setError('Por favor, informe sua Senha.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(username.trim(), password.trim());
      if (res.isNew) {
        setSuccessInfo(`Usuário "${res.username}" consagrado e registrado com sucesso!`);
      }
    } catch (err) {
      setError(err.message || 'Falha ao autenticar. Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  };

  // Quick select for easy multi-tab testing
  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-8 animate-fadeIn">
      
      {/* Sanctum Login Card */}
      <div className="max-w-md w-full bg-gradient-to-b from-grim-900 via-grim-950 to-black border-2 border-gothic-gold/50 rounded-2xl p-7 shadow-2xl gothic-panel-gold gothic-corners relative overflow-hidden">
        
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-gothic-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-crimson-red/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-gothic-gold via-amber-600 to-gothic-goldDark flex items-center justify-center shadow-lg border border-amber-300/60">
            <Skull className="w-9 h-9 text-grim-950" />
          </div>
          <span className="text-[10px] font-tech text-gothic-gold tracking-[0.25em] uppercase block">
            SANCTUM IMPERIALIS // AUTENTICAÇÃO
          </span>
          <h1 className="text-2xl font-gothic font-black text-grim-100 mt-1 tracking-wide">
            Warhammer 40,000
          </h1>
          <p className="text-xs text-grim-400 font-tech mt-0.5 tracking-wider">
            WRATH & GLORY — TERMINAL DE ACESSO
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-5 p-3.5 bg-rose-950/80 border border-rose-600 rounded-xl text-rose-200 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        {/* Success Notice */}
        {successInfo && (
          <div className="mb-5 p-3.5 bg-emerald-950/80 border border-emerald-500 rounded-xl text-emerald-200 text-xs flex items-start gap-2.5 animate-fadeIn">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{successInfo}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-gothic font-bold uppercase tracking-wider text-grim-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-gothic-gold" />
              <span>Nome de Usuário</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoFocus
                placeholder="Ex: Mestre, Jogador_1, Inquisidor..."
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-grim-950/90 border border-grim-700 focus:border-gothic-gold rounded-xl px-3.5 py-2.5 text-sm text-grim-100 placeholder-grim-600 outline-none transition shadow-inner font-body"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-gothic font-bold uppercase tracking-wider text-grim-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-gothic-gold" />
              <span>Senha</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Digite sua senha..."
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-grim-950/90 border border-grim-700 focus:border-gothic-gold rounded-xl px-3.5 py-2.5 pr-10 text-sm text-grim-100 placeholder-grim-600 outline-none transition shadow-inner font-body"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-grim-500 hover:text-grim-300 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-gothic-gold via-amber-500 to-gothic-gold hover:from-amber-400 hover:to-gothic-gold text-grim-950 font-gothic font-black text-xs uppercase tracking-widest shadow-xl shadow-gothic-gold/20 active:scale-[0.98] transition duration-150 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="font-tech">CONSAGRANDO ACESSO...</span>
            ) : (
              <>
                <span>Entrar no Sanctum</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </>
            )}
          </button>
        </form>

        {/* Hybrid Auth Explanation Box */}
        <div className="mt-5 p-3 rounded-xl bg-grim-950/80 border border-grim-800 text-[11px] text-grim-400 space-y-1">
          <div className="flex items-center gap-1.5 text-gothic-gold font-bold uppercase tracking-wider text-[10px]">
            <Sparkles className="w-3 h-3" />
            <span>Autenticação Híbrida Unificada</span>
          </div>
          <p className="leading-snug">
            • <strong>Novo usuário?</strong> O registro é automático ao enviar o formulário pela primeira vez.
          </p>
          <p className="leading-snug">
            • <strong>Já cadastrado?</strong> A senha fornecida será validada com criptografia.
          </p>
        </div>

        {/* Quick Testing Badges for Simultaneous Role Testing */}
        <div className="mt-4 pt-3 border-t border-grim-800/80">
          <span className="block text-[10px] uppercase font-tech text-grim-500 tracking-wider text-center mb-2">
            Sugestões de teste simultâneo (Clique para preencher):
          </span>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleQuickFill('Mestre', '123456')}
              className="px-2.5 py-1 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 text-[11px] font-tech hover:border-amber-400 transition"
            >
              👑 Mestre (123456)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('Jogador_1', '123456')}
              className="px-2.5 py-1 rounded bg-blue-950/60 border border-blue-500/40 text-blue-300 text-[11px] font-tech hover:border-blue-400 transition"
            >
              🛡️ Jogador_1 (123456)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('Jogador_2', '123456')}
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[11px] font-tech hover:border-slate-500 transition"
            >
              🛡️ Jogador_2 (123456)
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}

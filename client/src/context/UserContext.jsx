import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiUrl } from '../config';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  // Try to restore saved user from localStorage strictly using authenticated token
  const getSavedUser = () => {
    try {
      const authToken = localStorage.getItem('wg_auth_token');
      const savedData = localStorage.getItem('wg_user_data');

      // Only accept properly authenticated sessions
      if (authToken && savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed && parsed.token === authToken && parsed.id) {
          return parsed;
        }
      }

      // Purge any lingering legacy guest tokens so first access ALWAYS lands on Login
      localStorage.removeItem('wg_user_token');
      localStorage.removeItem('wg_user_name');
    } catch (e) {
      console.warn('Erro ao restaurar sessão:', e);
    }
    return null;
  };

  const [user, setUser] = useState(getSavedUser);
  const [loading, setLoading] = useState(Boolean(getSavedUser()));

async function parseResponseSafe(res) {
  const text = await res.text();
  if (!text || !text.trim()) {
    if (res.status === 405) {
      throw new Error(
        'A requisição atingiu a Vercel em vez do seu back-end (HTTP 405). ' +
        'Por favor, defina a URL do seu servidor no Render no botão "Configurar Servidor" abaixo.'
      );
    }
    return {};
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    if (text.includes('<!DOCTYPE html>') || text.includes('<html')) {
      throw new Error(
        'O front-end recebeu uma página HTML em vez de JSON. ' +
        'Certifique-se de que a URL do Render está correta e que o servidor está rodando (Online).'
      );
    }
    throw new Error(`Resposta inválida do servidor (HTTP ${res.status}): ${text.slice(0, 120)}`);
  }
}

  // Verify session on mount with backend if we had a saved user
  useEffect(() => {
    const checkSession = async () => {
      const currentToken = localStorage.getItem('wg_auth_token');
      if (!currentToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(apiUrl('/api/users/me'), {
          headers: {
            'Content-Type': 'application/json',
            'x-user-token': currentToken
          }
        });

        if (res.ok) {
          const freshData = await parseResponseSafe(res);
          setUser(freshData);
          localStorage.setItem('wg_user_data', JSON.stringify(freshData));
          localStorage.setItem('wg_auth_token', freshData.token);
        } else {
          // Token invalid or 401
          console.warn('Sessão expirada ou banco reiniciado. Redirecionando para login...');
          logout();
        }
      } catch (err) {
        console.warn('Falha na verificação de sessão (offline/iniciando):', err.message);
      } finally {
        setLoading(false);
      }
    };

    if (getSavedUser()) {
      checkSession();
    } else {
      setLoading(false);
    }
  }, []);

  // Hybrid Login & Auto-Registration
  const login = async (username, password) => {
    let res;
    try {
      res = await fetch(apiUrl('/api/users/auth'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
    } catch (networkErr) {
      throw new Error(`Não foi possível conectar ao servidor (${apiUrl('/')}): ${networkErr.message}. O servidor no Render pode estar iniciando (aguarde cerca de 30-50 segundos no plano gratuito).`);
    }

    const data = await parseResponseSafe(res);
    if (!res.ok) {
      throw new Error(data.error || `Erro ${res.status}: ${res.statusText || 'Falha ao autenticar'}`);
    }

    // Persist session
    localStorage.setItem('wg_auth_token', data.token);
    localStorage.setItem('wg_user_data', JSON.stringify(data));
    // Also sync legacy keys for backward compatibility with existing components
    localStorage.setItem('wg_user_token', data.token);
    localStorage.setItem('wg_user_name', data.name);
    
    setUser(data);
    return data;
  };

  // Logout - completely wipe local session state
  const logout = () => {
    localStorage.removeItem('wg_auth_token');
    localStorage.removeItem('wg_user_data');
    localStorage.removeItem('wg_user_token');
    localStorage.removeItem('wg_user_name');
    setUser(null);
  };

  // Update profile display name
  const updateUserName = async (newName) => {
    if (!newName || !newName.trim() || !user) return;
    const finalName = newName.trim();
    const updated = { ...user, name: finalName };
    setUser(updated);
    localStorage.setItem('wg_user_name', finalName);
    localStorage.setItem('wg_user_data', JSON.stringify(updated));

    try {
      await fetch(apiUrl('/api/users/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-token': user.token
        },
        body: JSON.stringify({ name: finalName })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const authHeaders = {
    'Content-Type': 'application/json',
    ...(user?.token ? { 'x-user-token': user.token } : {})
  };

  return (
    <UserContext.Provider value={{ user, loading, login, logout, updateUserName, authHeaders }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser deve ser usado dentro de um UserProvider');
  }
  return ctx;
}

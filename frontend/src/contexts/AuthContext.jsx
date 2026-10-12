/**
 * Path: frontend/src/contexts/AuthContext.jsx
 * Responsibility: Keep the signed-in user in memory and restore sessions from HTTP-only cookies.
 * Integration: /api/auth/me, login/register/logout and all protected layouts.
 */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api.js';
const AuthContext = createContext(null);
export const roleHome = (role) => role === 'OWNER' ? '/owner' : role === 'CASHIER' ? '/cashier/orders' : '/customer/menu';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    api.me().then((account) => { if (active) setUser(account); }).catch(() => { if (active) setUser(null); }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  const value = useMemo(() => ({
    user, ready,
    async login(body) { const account = await api.login(body); setUser(account); return account; },
    async register(body) { const account = await api.register(body); setUser(account); return account; },
    async logout() { await api.logout(); setUser(null); },
    async updateName(displayName) { const account = await api.updateProfile({ displayName }); setUser(account); return account; },
  }), [user, ready]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

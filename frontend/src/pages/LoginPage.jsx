/**
 * Path: frontend/src/pages/LoginPage.jsx
 * Responsibility: Shared sign-in for demo owner, cashier and self-registered customers.
 * Integration: AuthContext and role-based return navigation.
 */
import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, roleHome } from '../contexts/AuthContext.jsx';
import { ErrorMessage } from '../components/Feedback.jsx';
export function safeNext(next, role) {
  if (role !== 'CUSTOMER') return roleHome(role);
  return typeof next === 'string' && /^\/customer\/(cart|orders|profile|menu)(?:\/|$)/.test(next) ? next : '/customer/menu';
}
export default function LoginPage() {
  const { user, login } = useAuth(); const navigate = useNavigate(); const [params] = useSearchParams();
  const [identifier, setIdentifier] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={safeNext(params.get('next'), user.role)} replace/>;
  async function submit(e) { e.preventDefault(); setBusy(true); setError(''); try { const signed = await login({ identifier, password }); navigate(safeNext(params.get('next'), signed.role), { replace: true }); } catch (err) { setError(err.message); } finally { setBusy(false); } }
  return <main className="flex min-h-screen items-center justify-center bg-[#f7f8f6] px-4 py-10"><section className="panel w-full max-w-md space-y-5"><div><p className="eyebrow">Restaurant OS</p><h1 className="page-title">Sign in</h1><p className="page-subtitle">Owner, cashier and customers use the same login.</p></div><ErrorMessage message={error}/><form className="space-y-4" onSubmit={submit}><label className="field-label">Email or 10-digit mobile<input className="field-input" autoComplete="username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required/></label><label className="field-label">Password<input type="password" className="field-input" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required/></label><button disabled={busy} className="btn-primary w-full justify-center">{busy ? 'Signing in…' : 'Sign in'}</button></form><div className="border-t border-slate-100 pt-4 text-sm"><p>New customer? <Link className="font-semibold text-emerald-800" to={`/signup?next=${encodeURIComponent(params.get('next') || '/customer/cart')}`}>Create an account</Link></p><p className="mt-3"><Link className="text-emerald-800" to="/customer/menu">Browse menu without signing in →</Link></p></div><p className="text-xs text-slate-500">Demo accounts are documented in README. No real email or mobile verification is performed.</p></section></main>;
}

/**
 * Path: frontend/src/pages/CustomerProfilePage.jsx
 * Responsibility: Editable customer name, recorded spending and personal order totals.
 * Integration: /api/customer/stats and PATCH /api/auth/profile.
 */
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { api, currency } from '../services/api.js';
import { ErrorMessage, Loading } from '../components/Feedback.jsx';
export default function CustomerProfilePage() {
  const { user, updateName } = useAuth(); const [name, setName] = useState(user?.displayName || '');
  const [stats, setStats] = useState(null); const [error, setError] = useState(''); const [saved, setSaved] = useState(false); const [busy, setBusy] = useState(false);
  useEffect(() => { let live = true; api.customerStats().then((data) => { if (live) setStats(data); }).catch((e) => { if (live) setError(e.message); }); return () => { live = false; }; }, []);
  async function save(e) { e.preventDefault(); setBusy(true); setError(''); setSaved(false); try { await updateName(name); setSaved(true); } catch (err) { setError(err.message); } finally { setBusy(false); } }
  return <section className="space-y-6"><header><p className="eyebrow">Personal account</p><h1 className="page-title">My profile</h1><p className="page-subtitle">Your demo account details and ordering summary.</p></header><ErrorMessage message={error}/><div className="grid gap-5 lg:grid-cols-2"><section className="panel"><h2 className="section-title">Account details</h2><form className="mt-5 space-y-4" onSubmit={save}><label className="field-label">Full name<input className="field-input" maxLength={80} required value={name} onChange={(e) => { setSaved(false); setName(e.target.value); }}/></label><label className="field-label">Login identifier<input className="field-input bg-slate-50" value={user.identifier} readOnly/></label><p className="text-xs text-slate-500">Email/phone verification is disabled for this demo. Your identifier is not editable.</p><button disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Save name'}</button>{saved ? <p className="success-note mt-3">Profile updated.</p> : null}</form></section><section className="panel"><h2 className="section-title">My activity</h2>{!stats && !error ? <Loading/> : stats ? <dl className="mt-5 space-y-4">{[['Total orders', stats.totalOrders], ['Paid orders', stats.paidOrders], ['Total recorded paid', currency(stats.totalPaidPaise)], ['Of which demo UPI', currency(stats.demoPaidPaise)]].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 text-sm"><dt className="text-slate-600">{label}</dt><dd className="font-bold">{value}</dd></div>)}</dl> : null}<p className="mt-4 text-xs text-slate-500">Demo UPI payments are simulations; totals are not proof of money received.</p></section></div></section>;
}

/**
 * Path: frontend/src/pages/CustomerCartPage.jsx
 * Responsibility: Validate cart, require login before checkout and place owned MongoDB orders.
 * Integration: public menu, customer checkout endpoint and CartContext.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { api, currency } from '../services/api.js';
import { useCart } from '../contexts/CartContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { EmptyState, ErrorMessage, Loading } from '../components/Feedback.jsx';
export default function CustomerCartPage() {
  const cart = useCart(); const { user } = useAuth(); const navigate = useNavigate();
  const [menu, setMenu] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const [type, setType] = useState('TAKEAWAY'); const [tableNumber, setTableNumber] = useState(''); const [paymentIntent, setPaymentIntent] = useState('DEMO_UPI');
  useEffect(() => { let active = true; api.menu().then((data) => { if (active) setMenu(data); }).catch((e) => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  const lines = useMemo(() => cart.lines.map((line) => ({ ...line, item: menu.find((item) => item._id === line.menuItemId && item.isAvailable) })).filter((line) => line.item), [cart.lines, menu]);
  const removedCount = cart.lines.length - lines.length;
  const total = lines.reduce((sum, line) => sum + line.item.pricePaise * line.quantity, 0);
  async function submit(event) {
    event.preventDefault(); setError('');
    if (!user) { navigate('/login?next=%2Fcustomer%2Fcart'); return; }
    if (user.role !== 'CUSTOMER') { setError('Staff accounts must use the staff order workspace.'); return; }
    if (!lines.length || removedCount) { setError('Remove unavailable items before checkout.'); return; }
    setBusy(true);
    try {
      let checkoutKey;
      try { checkoutKey = sessionStorage.getItem('restaurant_pending_checkout'); } catch { /* Ignore disabled storage. */ }
      if (!checkoutKey) { checkoutKey = crypto.randomUUID(); try { sessionStorage.setItem('restaurant_pending_checkout', checkoutKey); } catch { /* no-op */ } }
      const order = await api.customerCheckout({ checkoutKey, type, tableNumber, paymentIntent, items: lines.map(({ menuItemId, quantity }) => ({ menuItemId, quantity })) });
      cart.clear(); try { sessionStorage.removeItem('restaurant_pending_checkout'); } catch { /* no-op */ }
      navigate('/customer/orders', { state: { newOrderId: order._id } });
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  }
  return <section className="space-y-6"><header><p className="eyebrow">Customer checkout</p><h1 className="page-title">Your cart</h1><p className="page-subtitle">Prices are reconfirmed by the server when you place an order.</p></header><ErrorMessage message={error}/>{loading ? <Loading/> : cart.lines.length === 0 ? <EmptyState title="Cart is empty" detail="Choose something tasty to get started." action={<Link to="/customer/menu" className="btn-primary">Browse menu</Link>}/> : <form onSubmit={submit} className="grid items-start gap-5 lg:grid-cols-[1.2fr_0.8fr]"><section className="panel space-y-4"><h2 className="section-title">Items</h2>{cart.lines.map((line) => { const item = menu.find((i) => i._id === line.menuItemId && i.isAvailable); return <div key={line.menuItemId} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 py-3"><div className="min-w-0"><strong>{item?.name || line.name}</strong><p className="text-sm text-slate-500">{item ? currency(item.pricePaise) : 'No longer available'}</p></div><div className="flex items-center gap-2"><button type="button" aria-label="Decrease quantity" className="icon-button" onClick={() => cart.quantity(line.menuItemId, line.quantity - 1)}><Minus size={15}/></button><span className="w-6 text-center font-semibold">{line.quantity}</span><button type="button" aria-label="Increase quantity" className="icon-button" onClick={() => cart.quantity(line.menuItemId, line.quantity + 1)}><Plus size={15}/></button><button type="button" aria-label="Remove item" className="icon-button text-red-700" onClick={() => cart.remove(line.menuItemId)}><Trash2 size={16}/></button></div></div>; })}{removedCount ? <p className="text-sm font-semibold text-red-700">Some items became unavailable. Remove them to continue.</p> : null}</section><aside className="panel space-y-4"><h2 className="section-title">Checkout details</h2><label className="field-label">Order type<select className="field-input" value={type} onChange={(e) => setType(e.target.value)}><option value="TAKEAWAY">Takeaway</option><option value="DINE_IN">Dine-in</option></select></label>{type === 'DINE_IN' ? <label className="field-label">Table number<input className="field-input" required maxLength={12} value={tableNumber} onChange={(e) => setTableNumber(e.target.value)}/></label> : null}<label className="field-label">Payment preference<select className="field-input" value={paymentIntent} onChange={(e) => setPaymentIntent(e.target.value)}><option value="DEMO_UPI">Demo UPI — simulated, no real money</option><option value="CASH">Cash — pay cashier in person</option></select></label><p className="border-t border-slate-100 pt-3 text-lg font-bold">Subtotal: {currency(total)}</p><p className="text-xs text-slate-500">No tax or discount on customer self-checkout. Cash orders stay unpaid until the cashier confirms collection.</p>{!user ? <p className="text-sm font-semibold text-emerald-800">Sign in or create an account before placing the order.</p> : null}<button type="submit" disabled={busy || !lines.length || removedCount > 0} className="btn-primary w-full justify-center">{busy ? 'Saving order…' : user ? 'Place order' : 'Continue to sign in'}</button></aside></form>}</section>;
}

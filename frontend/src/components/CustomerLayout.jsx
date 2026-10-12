/**
 * Path: frontend/src/components/CustomerLayout.jsx
 * Responsibility: Public menu shell with cart, customer profile, orders and sign-in links.
 * Integration: AuthContext, CartContext and React Router Outlet.
 */
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, ShoppingBag, UtensilsCrossed, UserRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { useCart } from '../contexts/CartContext.jsx';
const navClass = ({ isActive }) => `rounded-md px-3 py-2 text-sm font-semibold ${isActive ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-100'}`;
export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  async function signOut() { try { await logout(); navigate('/customer/menu'); } catch (e) { window.alert(e.message); } }
  return <div className="min-h-screen bg-[#f7f8f6]"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-7"><Link to="/customer/menu" className="flex items-center gap-2 text-lg font-extrabold text-emerald-900"><UtensilsCrossed size={23}/> Restaurant OS <span className="text-xs font-medium text-slate-500">Menu & ordering</span></Link><nav className="flex flex-wrap items-center gap-1"><NavLink to="/customer/menu" className={navClass}>Menu</NavLink><NavLink to="/customer/cart" className={navClass}><ShoppingBag size={15} className="mr-1 inline"/>Cart ({count})</NavLink>{user?.role === 'CUSTOMER' ? <><NavLink to="/customer/orders" className={navClass}>My orders</NavLink><NavLink to="/customer/profile" className={navClass}><UserRound size={14} className="mr-1 inline"/>Profile</NavLink><button type="button" className="btn-outline" onClick={signOut}><LogOut size={15}/>Logout</button></> : user ? <Link to={user.role === 'OWNER' ? '/owner' : '/cashier/orders'} className="btn-outline">Staff workspace</Link> : <Link to="/login?next=%2Fcustomer%2Fcart" className="btn-outline">Sign in</Link>}</nav></div></header><main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-7"><Outlet/></main><footer className="mx-auto max-w-6xl px-4 pb-8 text-xs text-slate-500">Assessment demo · UPI payments are simulated. Cash payments require cashier confirmation.</footer></div>;
}

/**
 * Path: frontend/src/components/WorkspaceLayout.jsx
 * Responsibility: Show distinct owner/cashier navigation and their identity/logout controls.
 * Integration: React Router Outlet, AuthContext and existing staff screens.
 */
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Plus,
  ReceiptText,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.jsx";
export function staffBase(role) {
  return role === "OWNER" ? "/owner" : "/cashier";
}
export function useStaffBase() {
  return staffBase(useAuth().user?.role);
}
const navClass = ({ isActive }) =>
  `flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg px-3 text-sm font-medium ${
    isActive
      ? "bg-emerald-50 text-emerald-800"
      : "text-slate-600 hover:bg-slate-100"
  }`;

export default function WorkspaceLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const owner = user?.role === "OWNER";
  const base = staffBase(user?.role);
  const links = owner
    ? [
        { to: base, label: "Dashboard", icon: LayoutDashboard, end: true },
        { to: `${base}/menu`, label: "Menu", icon: UtensilsCrossed },
        { to: `${base}/orders`, label: "Orders", icon: ClipboardList },
        { to: `${base}/bills`, label: "Bills", icon: ReceiptText },
        { to: `${base}/reports`, label: "Reports", icon: BarChart3 },
      ]
    : [
        { to: `${base}/orders`, label: "Orders", icon: ClipboardList },
        { to: `${base}/bills`, label: "Paid bills", icon: ReceiptText },
      ];
  async function signOut() {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      window.alert(error.message);
    }
  }
  return (
    <div className="min-h-screen bg-[#f7f8f6] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col lg:flex-row">
        <aside className="shrink-0 border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-2 px-4 py-4 lg:px-5 lg:py-7">
            <NavLink
              to={base}
              className="flex items-center gap-2 text-lg font-extrabold tracking-tight"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-800 text-white">
                <UtensilsCrossed size={19} />
              </span>
              Restaurant OS
            </NavLink>
            <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-700">
              {owner ? "Owner" : "Cashier"}
            </span>
          </div>
          <nav
            aria-label="Staff navigation"
            className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-4"
          >
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={navClass}>
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 lg:mt-5 lg:flex-col lg:items-stretch">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{user.displayName}</p>
              <p className="truncate text-xs text-slate-500">
                {user.identifier}
              </p>
            </div>
            <button type="button" onClick={signOut} className="btn-outline">
              <LogOut size={15} /> Logout
            </button>
          </div>
          <div className="hidden px-4 pt-5 lg:block">
            <NavLink
              to={`${base}/orders/new`}
              className="btn-primary w-full justify-center"
            >
              <Plus size={17} /> New order
            </NavLink>
          </div>
        </aside>
        <main className="min-w-0 flex-1 px-4 pb-16 pt-6 sm:px-7 lg:px-10 lg:pt-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

/**
 * Path: frontend/src/pages/DashboardPage.jsx
 * Responsibility: Show live open orders, menu availability and today's paid sales.
 * Integration: /api/dashboard/overview includes Part 2 sales totals and Part 1 operation counters.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardList, IndianRupee, Plus, ReceiptText, Utensils } from 'lucide-react';
import { useStaffBase } from '../components/WorkspaceLayout.jsx';
import { api, currency, shortDate } from '../services/api.js';
import { EmptyState, ErrorMessage, Loading } from '../components/Feedback.jsx';

export default function DashboardPage() {
  const base = useStaffBase();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api.overview().then((result) => { if (active) setData(result); }).catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);

  return <section className="space-y-7">
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="eyebrow">Restaurant operations</p><h1 className="page-title">Dashboard</h1><p className="page-subtitle">Owner overview: customers, live orders and recorded sales. Demo UPI excluded from recorded receipts.</p></div>
      <Link className="btn-primary" to={`${base}/orders/new`}><Plus size={17}/> New order</Link>
    </header>
    <ErrorMessage message={error} />
    {!data && !error ? <Loading /> : null}
    {data ? <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {[
          { label: 'Open orders', value: data.openOrders, icon: ClipboardList },
          { label: 'Registered customers', value: data.customerCount, icon: ClipboardList },
          { label: 'Open order value', value: currency(data.openOrderValuePaise), icon: IndianRupee },
          { label: 'Menu available', value: `${data.availableItems} / ${data.menuItems}`, icon: Utensils },
          { label: 'Open takeaway', value: data.takeawayOrders, icon: ClipboardList },
          { label: 'Paid bills today', value: data.todayPaidOrders, icon: ReceiptText },
          { label: 'Recorded today (excl. demo UPI)', value: currency(data.todayRecordedSalesPaise), icon: IndianRupee },
        ].map(({ label, value, icon: Icon }) => <div key={label} className="border-b-2 border-emerald-700 bg-white px-5 py-5 shadow-sm"><div className="mb-4 flex items-center justify-between gap-2 text-sm text-slate-500"><span>{label}</span><Icon size={19} className="shrink-0"/></div><p className="break-words text-2xl font-bold tracking-tight">{value}</p></div>)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <section className="panel">
          <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="section-title">Recent open orders</h2><p className="text-sm text-slate-500">Finish an order to issue a paid receipt</p></div><Link to={`${base}/orders`} className="text-sm font-semibold text-emerald-800 hover:underline">View all</Link></div>
          {data.recentOrders.length ? <div className="divide-y divide-slate-100">{data.recentOrders.map((order) => <div key={order._id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-semibold">{order.orderNumber}</p><p className="mt-1 text-xs text-slate-500">{order.type === 'DINE_IN' ? `Table ${order.tableNumber}` : 'Takeaway'} · {shortDate(order.createdAt)}</p></div><div className="flex items-center gap-3 text-sm"><strong>{currency(order.subtotalPaise)}</strong>{order.source === 'CUSTOMER' && order.paymentIntent === 'DEMO_UPI' ? <span className="text-xs text-amber-700">Awaiting demo UPI</span> : <Link to={`${base}/orders/${order._id}/bill`} className="font-semibold text-emerald-800 hover:underline">Bill <ArrowRight size={15} className="inline"/></Link>}</div></div>)}</div> : <EmptyState title="No open orders" detail="Start with a new order, then add items from your menu." action={<Link className="btn-primary" to={`${base}/orders/new`}>Create first order</Link>} />}
        </section>
        <section className="panel"><h2 className="section-title">Quick workflow</h2><p className="mt-1 text-sm text-slate-500">From a food item to a customer receipt.</p><ol className="mt-5 space-y-4 text-sm">{['Manage menu and item prices.', 'Create or edit an open order.', 'Generate bill and record payment.', 'Print receipt; review daily sales.'].map((step, index) => <li className="flex gap-3" key={step}><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-900">{index + 1}</span>{step}</li>)}</ol><div className="mt-6 flex flex-wrap gap-4"><Link to={`${base}/bills`} className="text-sm font-semibold text-emerald-800 hover:underline">Bill history</Link><Link to={`${base}/reports`} className="text-sm font-semibold text-emerald-800 hover:underline">Sales reports</Link></div></section>
      </div>
    </> : null}
  </section>;
}

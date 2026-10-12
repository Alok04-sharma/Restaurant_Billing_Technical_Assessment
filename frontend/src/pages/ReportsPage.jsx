/**
 * Path: frontend/src/pages/ReportsPage.jsx
 * Responsibility: Show database-backed daily sales, cash/UPI split and top-selling dishes.
 * Integration: GET /api/reports/daily?date=; all business dates are Asia/Kolkata.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, IndianRupee, ReceiptText, Wallet } from 'lucide-react';
import { useStaffBase } from '../components/WorkspaceLayout.jsx';
import { api, businessDateToday, currency, shortDate } from '../services/api.js';
import { EmptyState, ErrorMessage, Loading } from '../components/Feedback.jsx';

export default function ReportsPage() {
  const base = useStaffBase();
  const [date, setDate] = useState(businessDateToday);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load(forDate) {
    setLoading(true); setError('');
    try { setReport(await api.dailyReport(forDate)); }
    catch (err) { setError(err.message); setReport(null); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    let live = true;
    api.dailyReport(businessDateToday()).then((value) => { if (live) setReport(value); }).catch((err) => { if (live) setError(err.message); }).finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, []);

  return <section className="space-y-6"><header className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">Restaurant performance</p><h1 className="page-title">Daily sales report</h1><p className="page-subtitle">Paid invoices only. Simulated UPI is excluded from recorded receipts; dates are IST.</p></div><form onSubmit={(e) => { e.preventDefault(); load(date); }} className="flex items-end gap-2"><label className="field-label">Business date<input type="date" className="field-input" required value={date} onChange={(e) => setDate(e.target.value)}/></label><button className="btn-primary" type="submit" disabled={loading}><CalendarDays size={17}/> Show</button></form></header>
    <ErrorMessage message={error}/>{loading ? <Loading/> : report ? <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[
        { label: 'Recorded receipts (excl. demo UPI)', value: currency(report.recordedSalesPaise), icon: IndianRupee },
        { label: 'Paid bills', value: report.paidOrders, icon: ReceiptText },
        { label: 'Cash sales', value: currency(report.cashPaise), icon: Wallet },
        { label: 'UPI recorded (incl. demo)', value: currency(report.upiPaise), icon: Wallet },
      ].map(({ label, value, icon: Icon }) => <div key={label} className="border-b-2 border-emerald-700 bg-white px-5 py-5 shadow-sm"><div className="flex items-center justify-between gap-3 text-sm text-slate-500"><span>{label}</span><Icon size={18}/></div><p className="mt-4 break-words text-2xl font-bold">{value}</p></div>)}</div>
      <div className="grid gap-5 xl:grid-cols-2"><section className="panel"><h2 className="section-title">Billing breakdown</h2><dl className="mt-5 space-y-3 text-sm">{[
        ['Food subtotals', report.subtotalPaise],
        ['Discounts', report.discountsPaise],
        ['Tax collected', report.taxPaise],
        ['Paid total (incl. simulation)', report.salesPaise],
        ['Simulated UPI (not received)', report.demoUpiPaise],
        ['Recorded receipts (excl. simulation)', report.recordedSalesPaise],
      ].map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt className="text-slate-600">{label}</dt><dd className="font-semibold">{currency(value)}</dd></div>)}</dl></section>
      <section className="panel"><h2 className="section-title">Top dishes by quantity</h2>{report.topItems.length ? <div className="mt-4 divide-y divide-slate-100">{report.topItems.map((row) => <div key={row._id} className="flex justify-between gap-3 py-3 text-sm"><span className="min-w-0 break-words">{row._id}</span><span className="shrink-0 font-semibold">{row.quantity} sold</span></div>)}</div> : <p className="mt-4 text-sm text-slate-500">No paid bills on this date.</p>}<p className="mt-4 text-xs text-slate-500">Dish totals are before order-level discounts and taxes.</p></section></div>
      <section className="panel"><h2 className="section-title">Recent payments on {report.date}</h2>{!report.recentBills.length ? <EmptyState title="No sales recorded" detail="Paid bills for the selected day will appear here."/> : <div className="mt-4 divide-y divide-slate-100">{report.recentBills.map((order) => <div key={order._id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-semibold">{order.bill.invoiceNumber}</p><p className="mt-1 text-xs text-slate-500">{shortDate(order.bill.paidAt)} · {order.bill.paymentMethod}</p></div><div className="flex items-center gap-3"><strong className="text-sm">{currency(order.bill.totalPaise)}</strong><Link to={`${base}/bills/${order._id}`} className="text-sm font-semibold text-emerald-800 hover:underline">Receipt</Link></div></div>)}</div>}</section>
    </> : null}
  </section>;
}

/**
 * Path: frontend/src/pages/InvoicePage.jsx
 * Responsibility: Read-only paid-invoice display and printable customer receipt.
 * Integration: GET /api/bills/:id, window.print and print-specific CSS in index.css.
 */
import { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { useStaffBase } from '../components/WorkspaceLayout.jsx';
import { api, currency, shortDate } from '../services/api.js';
import { ErrorMessage, Loading } from '../components/Feedback.jsx';

export default function InvoicePage() {
  const staff = useStaffBase();
  const pathname = useLocation().pathname;
  const base = pathname.startsWith('/customer/') ? '/customer' : staff;
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let live = true;
    api.bill(id).then((data) => { if (live) setOrder(data); }).catch((err) => { if (live) setError(err.message); });
    return () => { live = false; };
  }, [id]);

  return <section className="space-y-6"><header className="flex flex-wrap items-start justify-between gap-3"><div><Link to={base === '/customer' ? '/customer/orders' : `${base}/bills`} className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-emerald-800"><ArrowLeft size={16}/> {base === '/customer' ? 'My orders' : 'Bill history'}</Link><p className="eyebrow">Paid customer receipt</p><h1 className="page-title">Invoice</h1><p className="page-subtitle">Saved bills are read-only, even if menu prices change later.</p></div>{order ? <button type="button" className="btn-primary" onClick={() => window.print()}><Printer size={18}/> Print receipt</button> : null}</header>
    <ErrorMessage message={error}/>{!order && !error ? <Loading/> : null}
    {order ? <div id="invoice-print" className="mx-auto w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-9">
      <div className="flex items-start justify-between gap-3 border-b border-dashed border-slate-300 pb-5"><div><h2 className="text-xl font-extrabold">Restaurant OS</h2><p className="mt-1 text-xs text-slate-600">Restaurant billing receipt</p></div><span className="status-pill status-open">PAID</span></div>
      <div className="grid gap-3 border-b border-dashed border-slate-300 py-5 text-sm sm:grid-cols-2"><div><p className="text-xs text-slate-500">Invoice number</p><strong className="break-all">{order.bill.invoiceNumber}</strong></div><div><p className="text-xs text-slate-500">Paid at (India time)</p><strong>{shortDate(order.bill.paidAt)}</strong></div><div><p className="text-xs text-slate-500">Order</p><strong>{order.orderNumber}</strong></div><div><p className="text-xs text-slate-500">Service</p><strong>{order.type === 'DINE_IN' ? `Dine-in · Table ${order.tableNumber}` : 'Takeaway'}</strong></div>{order.customerName ? <div><p className="text-xs text-slate-500">Customer</p><strong>{order.customerName}</strong></div> : null}</div>
      <table className="my-5 w-full text-left text-sm"><thead><tr className="border-b border-slate-200 text-xs text-slate-500"><th className="py-2 font-medium">Item</th><th className="py-2 text-center font-medium">Qty</th><th className="py-2 text-right font-medium">Amount</th></tr></thead><tbody>{order.items.map((line) => <tr key={line.menuItemId} className="border-b border-slate-100"><td className="py-3 pr-2"><span className="font-medium">{line.name}</span><span className="block text-xs text-slate-500">{currency(line.unitPricePaise)} each</span></td><td className="py-3 text-center">{line.quantity}</td><td className="py-3 text-right">{currency(line.lineTotalPaise)}</td></tr>)}</tbody></table>
      <div className="ml-auto max-w-xs space-y-2 text-sm"><div className="flex justify-between"><span>Subtotal</span><strong>{currency(order.bill.subtotalPaise)}</strong></div><div className="flex justify-between"><span>Discount</span><span>− {currency(order.bill.discountPaise)}</span></div><div className="flex justify-between"><span>Tax ({order.bill.taxRateBps / 100}%)</span><span>{currency(order.bill.taxPaise)}</span></div><div className="flex justify-between border-t-2 border-slate-900 pt-3 text-lg"><strong>Total paid</strong><strong>{currency(order.bill.totalPaise)}</strong></div><div className="flex justify-between"><span>Payment</span><strong>{order.bill.paymentMethod}</strong></div>{order.bill.paymentMethod === 'CASH' ? <><div className="flex justify-between"><span>Cash received</span><span>{currency(order.bill.tenderedPaise)}</span></div><div className="flex justify-between"><span>Change returned</span><span>{currency(order.bill.changePaise)}</span></div></> : order.bill.upiReference ? <div className="flex justify-between gap-3"><span>UPI ref.</span><span className="break-all text-right">{order.bill.upiReference}</span></div> : null}</div>
      <p className="mt-9 border-t border-dashed border-slate-300 pt-5 text-center text-xs text-slate-500">Thank you for dining with us!</p>
      <p className="mt-2 text-center text-[10px] text-slate-400">{order.bill.paymentSource === 'DEMO_UPI' ? 'SIMULATED UPI PAYMENT — no real money transferred. ' : ''}Demo receipt. Restaurant identity and tax registration details should be configured before commercial use.</p>
    </div> : null}
  </section>;
}

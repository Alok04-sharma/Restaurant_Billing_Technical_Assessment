/**
 * Path: frontend/src/pages/BillsPage.jsx
 * Responsibility: Search recent paid bills and reopen immutable receipts for reprinting.
 * Integration: GET /api/bills?q=..., InvoicePage; backend limits each result set to 100.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ReceiptText, Search } from "lucide-react";
import { useStaffBase } from "../components/WorkspaceLayout.jsx";
import { api, currency, shortDate } from "../services/api.js";
import { EmptyState, ErrorMessage, Loading } from "../components/Feedback.jsx";

export default function BillsPage() {
  const base = useStaffBase();
  const [query, setQuery] = useState("");
  const [bills, setBills] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load(search = "") {
    setLoading(true);
    setError("");
    try {
      setBills(await api.bills(search));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    api
      .bills()
      .then((data) => {
        if (active) setBills(data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="space-y-6">
      <header>
        <p className="eyebrow">Customer receipts</p>
        <h1 className="page-title">Bill history</h1>
        <p className="page-subtitle">
          Search completed payments and reprint a customer receipt.
        </p>
      </header>
      <section className="panel">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(query.trim());
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <label className="sr-only" htmlFor="bill-search">
            Search paid bills
          </label>
          <input
            id="bill-search"
            maxLength={80}
            className="field-input mt-0 flex-1"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Invoice, order, customer or table"
          />
          <button
            disabled={loading}
            className="btn-primary justify-center"
            type="submit"
          >
            <Search size={17} /> Search bills
          </button>
        </form>
        <p className="mt-2 text-xs text-slate-500">
          Showing the latest 100 matching paid bills.
        </p>
      </section>
      <ErrorMessage message={error} />
      {loading ? (
        <Loading />
      ) : !bills.length ? (
        <EmptyState
          title="No paid bills found"
          detail="Complete an open order through billing, or try another search."
          action={
            <Link className="btn-outline" to={`${base}/orders`}>
              View orders
            </Link>
          }
        />
      ) : (
        <section className="panel divide-y divide-slate-100">
          {bills.map((order) => (
            <div
              key={order._id}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <ReceiptText size={16} className="text-emerald-800" />
                  <strong className="break-all text-sm">
                    {order.bill.invoiceNumber}
                  </strong>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {shortDate(order.bill.paidAt)} ·{" "}
                  {order.type === "DINE_IN"
                    ? `Table ${order.tableNumber}`
                    : "Takeaway"}{" "}
                  · {order.bill.paymentMethod}
                  {order.customerName ? ` · ${order.customerName}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <strong className="text-sm">
                  {currency(order.bill.totalPaise)}
                </strong>
                <Link className="btn-outline" to={`${base}/bills/${order._id}`}>
                  View / print
                </Link>
              </div>
            </div>
          ))}
        </section>
      )}
    </section>
  );
}

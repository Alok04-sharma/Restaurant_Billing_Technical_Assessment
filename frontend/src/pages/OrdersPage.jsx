/**
 * Path: frontend/src/pages/OrdersPage.jsx
 * Responsibility: Manage OPEN orders and route BILLED orders to immutable receipts.
 * Integration: Part 1 order APIs, /orders/:id/bill checkout screen and /bills/:id.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus, ReceiptText } from "lucide-react";
import { useStaffBase } from "../components/WorkspaceLayout.jsx";
import { api, currency, shortDate } from "../services/api.js";
import { EmptyState, ErrorMessage, Loading } from "../components/Feedback.jsx";

const statuses = ["ALL", "OPEN", "CANCELLED", "BILLED"];

export default function OrdersPage() {
  const base = useStaffBase();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  async function reload() {
    setOrders(await api.orders());
  }
  useEffect(() => {
    let active = true;
    api
      .orders()
      .then((data) => {
        if (active) setOrders(data);
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
  const visible = useMemo(
    () =>
      orders.filter(
        (order) =>
          (filter === "ALL" || order.status === filter) &&
          `${order.orderNumber} ${order.customerName} ${order.tableNumber}`
            .toLowerCase()
            .includes(search.toLowerCase())
      ),
    [orders, filter, search]
  );

  async function cancel(order) {
    if (
      !window.confirm(
        `Cancel order ${order.orderNumber}? This cannot be reversed.`
      )
    )
      return;
    setBusyId(order._id);
    setError("");
    try {
      await api.cancelOrder(order._id);
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  }
  return (
    <section className="space-y-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Restaurant operations</p>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">
            Edit open orders, generate bills and view paid receipts.
          </p>
        </div>
        <Link className="btn-primary" to={`${base}/orders/new`}>
          <Plus size={17} /> New order
        </Link>
      </header>
      <ErrorMessage message={error} />
      <section className="panel">
        <div className="mb-5 flex flex-wrap justify-between gap-4">
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Order status filters"
          >
            {statuses.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                className={`rounded-full px-3 py-2 text-xs font-semibold ${
                  filter === status
                    ? "bg-emerald-800 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {status === "ALL"
                  ? "All"
                  : status === "OPEN"
                  ? "Open"
                  : status === "CANCELLED"
                  ? "Cancelled"
                  : "Billed"}
              </button>
            ))}
          </div>
          <input
            className="field-input w-full sm:w-64"
            placeholder="Search order, name, table"
            aria-label="Search orders"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <Loading />
        ) : visible.length === 0 ? (
          <EmptyState
            title="No matching orders"
            detail={
              orders.length
                ? "Try another status or search term."
                : "Create an order to get started."
            }
            action={
              !orders.length ? (
                <Link className="btn-primary" to={`${base}/orders/new`}>
                  Create order
                </Link>
              ) : null
            }
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {visible.map((order) => (
              <div
                key={order._id}
                className="flex flex-wrap items-center gap-4 py-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="break-all text-sm">
                      {order.orderNumber}
                    </strong>
                    <span
                      className={`status-pill ${
                        order.status === "OPEN" ? "status-open" : "status-muted"
                      }`}
                    >
                      {order.status.toLowerCase()}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {order.type === "DINE_IN"
                      ? `Table ${order.tableNumber}`
                      : "Takeaway"}
                    {order.customerName ? ` · ${order.customerName}` : ""} ·{" "}
                    {shortDate(order.createdAt)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {order.items.length} different item
                    {order.items.length === 1 ? "" : "s"}
                  </p>
                </div>
                <strong className="text-sm">
                  {currency(
                    order.status === "BILLED"
                      ? order.bill?.totalPaise
                      : order.subtotalPaise
                  )}
                </strong>
                {order.status === "OPEN" ? (
                  <div className="flex flex-wrap gap-2">
                    {order.source !== "CUSTOMER" ? (
                      <Link
                        className="btn-outline"
                        to={`${base}/orders/${order._id}/edit`}
                      >
                        Edit <ArrowRight size={15} />
                      </Link>
                    ) : null}
                    {order.source === "CUSTOMER" &&
                    order.paymentIntent === "DEMO_UPI" ? (
                      <span className="text-xs font-semibold text-amber-700">
                        Awaiting customer demo UPI
                      </span>
                    ) : (
                      <Link
                        className="btn-primary"
                        to={`${base}/orders/${order._id}/bill`}
                      >
                        <ReceiptText size={16} /> Generate bill
                      </Link>
                    )}
                    <button
                      type="button"
                      disabled={busyId === order._id}
                      onClick={() => cancel(order)}
                      className="btn-danger"
                    >
                      {busyId === order._id ? "Cancelling…" : "Cancel"}
                    </button>
                  </div>
                ) : order.status === "BILLED" ? (
                  <Link
                    className="btn-outline"
                    to={`${base}/bills/${order._id}`}
                  >
                    View receipt
                  </Link>
                ) : (
                  <span className="text-xs text-slate-500">Cancelled</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

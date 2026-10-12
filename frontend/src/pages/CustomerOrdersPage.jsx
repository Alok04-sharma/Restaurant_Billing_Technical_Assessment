/**
 * Path: frontend/src/pages/CustomerOrdersPage.jsx
 * Responsibility: Show only the customer's own orders and complete simulated UPI payments.
 * Integration: Customer session, /api/customer/orders and paid invoice route.
 */
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api, currency, shortDate } from "../services/api.js";
import { EmptyState, ErrorMessage, Loading } from "../components/Feedback.jsx";
export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const location = useLocation();
  useEffect(() => {
    let active = true;
    api
      .customerOrders()
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
  async function pay(id) {
    setBusyId(id);
    setError("");
    try {
      await api.customerDemoPay(id);
      setOrders(await api.customerOrders());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId("");
    }
  }
  return (
    <section className="space-y-6">
      <header>
        <p className="eyebrow">Your account</p>
        <h1 className="page-title">My orders</h1>
        <p className="page-subtitle">
          Track pending payments and access your paid receipts.
        </p>
      </header>
      {location.state?.newOrderId ? (
        <div className="success-note">
          Order placed successfully. Complete demo UPI below or pay cash at the
          restaurant cashier.
        </div>
      ) : null}
      <ErrorMessage message={error} />
      {loading ? (
        <Loading />
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          detail="Your orders will appear here."
          action={
            <Link className="btn-primary" to="/customer/menu">
              Browse menu
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <article
              key={order._id}
              className="panel flex flex-wrap items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="break-all text-sm font-bold">
                  {order.orderNumber}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {shortDate(order.createdAt)} ·{" "}
                  {order.type === "DINE_IN"
                    ? `Table ${order.tableNumber}`
                    : "Takeaway"}
                </p>
                <p className="mt-2 text-sm">
                  {order.items
                    .map((x) => `${x.name} ×${x.quantity}`)
                    .join(", ")}
                </p>
                <span
                  className={`status-pill mt-3 inline-block ${
                    order.status === "BILLED" ? "status-open" : "status-muted"
                  }`}
                >
                  {order.status === "BILLED"
                    ? "PAID"
                    : order.status === "OPEN"
                    ? "AWAITING PAYMENT"
                    : order.status}
                </span>
              </div>
              <div className="space-y-2 text-right">
                <p className="text-lg font-extrabold">
                  {currency(order.bill?.totalPaise ?? order.subtotalPaise)}
                </p>
                {order.status === "BILLED" ? (
                  <Link
                    className="btn-outline"
                    to={`/customer/bills/${order._id}`}
                  >
                    View / print bill
                  </Link>
                ) : order.status === "OPEN" &&
                  order.paymentIntent === "DEMO_UPI" ? (
                  <>
                    <p className="text-xs text-slate-500">
                      Simulation only · no money transfer
                    </p>
                    <button
                      type="button"
                      disabled={busyId === order._id}
                      onClick={() => pay(order._id)}
                      className="btn-primary"
                    >
                      {busyId === order._id
                        ? "Confirming…"
                        : "Complete demo UPI"}
                    </button>
                  </>
                ) : order.status === "OPEN" ? (
                  <p className="text-sm text-slate-600">
                    Pay cash at cashier; invoice after confirmation.
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

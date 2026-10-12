/**
 * Path: frontend/src/pages/BillingPage.jsx
 * Responsibility: Preview a frozen order subtotal, enter discount/tax, record payment and finalize once.
 * Integration: POST /api/orders/:id/bill-preview and /checkout; redirects to read-only printable invoice.
 */
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, ReceiptText } from "lucide-react";
import { useStaffBase } from "../components/WorkspaceLayout.jsx";
import { api, currency, parseRupeesToPaise } from "../services/api.js";
import { EmptyState, ErrorMessage, Loading } from "../components/Feedback.jsx";

export default function BillingPage() {
  const base = useStaffBase();
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [discount, setDiscount] = useState("0");
  const [taxRateBps, setTaxRateBps] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [cashReceived, setCashReceived] = useState("");
  const [upiReference, setUpiReference] = useState("");
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let live = true;
    api
      .order(id)
      .then((data) => {
        if (live) setOrder(data);
      })
      .catch((err) => {
        if (live) setError(err.message);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [id]);

  function invalidatePreview(setter, value) {
    setter(value);
    setPreview(null);
    setError("");
  }

  function billOptions() {
    const discountPaise = parseRupeesToPaise(discount);
    if (discountPaise === null)
      throw new Error("Enter a valid discount with at most 2 decimal places.");
    if (discountPaise > order.subtotalPaise)
      throw new Error("Discount cannot exceed the food subtotal.");
    return { version: order.__v, discountPaise, taxRateBps };
  }

  async function review() {
    setError("");
    setBusy(true);
    try {
      setPreview(await api.previewBill(id, billOptions()));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function checkout() {
    if (!preview || busy) return;
    setBusy(true);
    setError("");
    try {
      const payment = { paymentMethod };
      if (paymentMethod === "CASH") {
        const tenderedPaise = parseRupeesToPaise(cashReceived);
        if (tenderedPaise === null || tenderedPaise < preview.totalPaise)
          throw new Error(
            "Enter cash received equal to or greater than the bill total."
          );
        payment.tenderedPaise = tenderedPaise;
      } else {
        payment.upiReference = upiReference;
      }
      const completed = await api.checkout(id, {
        ...billOptions(),
        ...payment,
      });
      navigate(`${base}/bills/${completed._id}`, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <Link
          to={`${base}/orders`}
          className="mb-2 inline-flex items-center gap-1 text-sm font-semibold text-emerald-800"
        >
          <ArrowLeft size={16} /> All orders
        </Link>
        <p className="eyebrow">Billing & payment</p>
        <h1 className="page-title">Generate customer bill</h1>
        <p className="page-subtitle">
          Review the order, calculate the final amount, then confirm received
          payment.
        </p>
      </header>
      <ErrorMessage message={error} />
      {loading ? (
        <Loading />
      ) : !order ? null : order.status !== "OPEN" ? (
        <EmptyState
          title="Order is no longer open"
          detail="You can only bill an open order."
          action={
            order.status === "BILLED" ? (
              <Link className="btn-primary" to={`${base}/bills/${id}`}>
                View paid invoice
              </Link>
            ) : (
              <Link className="btn-outline" to={`${base}/orders`}>
                Back to orders
              </Link>
            )
          }
        />
      ) : (
        <div className="grid items-start gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <section className="panel">
              <h2 className="section-title">1. Confirm order</h2>
              <p className="mt-1 text-sm text-slate-500">
                {order.orderNumber} ·{" "}
                {order.type === "DINE_IN"
                  ? `Table ${order.tableNumber}`
                  : "Takeaway"}
                {order.customerName ? ` · ${order.customerName}` : ""}
              </p>
              <div className="mt-5 divide-y divide-slate-100">
                {order.items.map((item) => (
                  <div
                    key={item.menuItemId}
                    className="flex items-center justify-between gap-4 py-3 text-sm"
                  >
                    <div>
                      <strong>{item.name}</strong>
                      <p className="text-xs text-slate-500">
                        {item.quantity} × {currency(item.unitPricePaise)}
                      </p>
                    </div>
                    <strong>{currency(item.lineTotalPaise)}</strong>
                  </div>
                ))}
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-4 text-sm">
                <span>Food subtotal</span>
                <strong>{currency(order.subtotalPaise)}</strong>
              </div>
            </section>
            <section className="panel space-y-4">
              <div>
                <h2 className="section-title">2. Discount & tax</h2>
                <p className="text-sm text-slate-500">
                  Tax is optional for this demo. Select a rate only if
                  applicable to your restaurant.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="field-label">
                  Discount (₹)
                  <input
                    className="field-input"
                    type="text"
                    inputMode="decimal"
                    value={discount}
                    disabled={order.source === "CUSTOMER"}
                    onChange={(e) =>
                      invalidatePreview(setDiscount, e.target.value)
                    }
                    placeholder="0.00"
                  />
                </label>
                <label className="field-label">
                  Tax rate
                  <select
                    className="field-input"
                    value={taxRateBps}
                    disabled={order.source === "CUSTOMER"}
                    onChange={(e) =>
                      invalidatePreview(setTaxRateBps, Number(e.target.value))
                    }
                  >
                    <option value="0">No tax (0%)</option>
                    <option value="500">5%</option>
                    <option value="1200">12%</option>
                    <option value="1800">18%</option>
                  </select>
                </label>
              </div>
              <p className="text-xs text-slate-500">
                {order.source === "CUSTOMER"
                  ? "Customer-submitted orders keep their agreed checkout amount unchanged."
                  : "Tax is applied after the discount. The server calculates and verifies the final amount."}
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={review}
                className="btn-primary w-full justify-center sm:w-auto"
              >
                {busy ? "Calculating…" : "Review final bill"}
              </button>
            </section>
          </div>
          <aside className="panel xl:sticky xl:top-8">
            <h2 className="section-title">3. Payment & finish</h2>
            {!preview ? (
              <div className="mt-5 rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                Select discount/tax and click <strong>Review final bill</strong>{" "}
                to continue.
              </div>
            ) : (
              <>
                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <strong>{currency(preview.subtotalPaise)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount</span>
                    <strong>− {currency(preview.discountPaise)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({preview.taxRateBps / 100}%)</span>
                    <strong>{currency(preview.taxPaise)}</strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-4 text-lg">
                    <strong>Amount to collect</strong>
                    <strong>{currency(preview.totalPaise)}</strong>
                  </div>
                </div>
                <div className="mt-6 space-y-4 border-t border-slate-200 pt-5">
                  <label className="field-label">
                    Payment method
                    <select
                      className="field-input"
                      value={paymentMethod}
                      onChange={(e) => {
                        setPaymentMethod(e.target.value);
                        setError("");
                      }}
                    >
                      <option value="CASH">Cash</option>
                      {order.source !== "CUSTOMER" ? (
                        <option value="UPI">UPI (record payment only)</option>
                      ) : null}
                    </select>
                  </label>
                  {paymentMethod === "CASH" ? (
                    <label className="field-label">
                      Cash received (₹)
                      <input
                        type="text"
                        inputMode="decimal"
                        className="field-input"
                        placeholder={(preview.totalPaise / 100).toFixed(2)}
                        value={cashReceived}
                        onChange={(e) => {
                          setCashReceived(e.target.value);
                          setError("");
                        }}
                      />
                    </label>
                  ) : (
                    <label className="field-label">
                      UPI transaction reference{" "}
                      <span className="text-slate-400">(optional)</span>
                      <input
                        className="field-input"
                        maxLength={80}
                        value={upiReference}
                        onChange={(e) => setUpiReference(e.target.value)}
                        placeholder="e.g. UPI123456"
                      />
                    </label>
                  )}
                  <p className="text-xs text-slate-500">
                    Only confirm after the money has actually been received.
                    This app records payment; it does not collect online
                    payments.
                  </p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={checkout}
                    className="btn-primary w-full justify-center"
                  >
                    <CheckCircle2 size={17} />
                    {busy ? "Saving payment…" : "Confirm payment & issue bill"}
                  </button>
                </div>
              </>
            )}
            {order.source !== "CUSTOMER" ? (
              <Link
                to={`${base}/orders/${id}/edit`}
                className="mt-5 flex min-h-10 items-center justify-center text-sm font-medium text-slate-600 hover:underline"
              >
                Edit order instead
              </Link>
            ) : null}
          </aside>
        </div>
      )}
    </section>
  );
}

/**
 * Path: frontend/src/pages/OrderEditorPage.jsx
 * Responsibility: Build/edit real dine-in and takeaway orders with live item/subtotal previews.
 * Integration: Menu and order APIs; backend is authoritative for price and totals on save.
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useStaffBase } from "../components/WorkspaceLayout.jsx";
import { api, currency } from "../services/api.js";
import { EmptyState, ErrorMessage, Loading } from "../components/Feedback.jsx";

const emptyDetails = {
  type: "DINE_IN",
  tableNumber: "",
  customerName: "",
  notes: "",
};

export default function OrderEditorPage() {
  const base = useStaffBase();
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [menu, setMenu] = useState([]);
  const [details, setDetails] = useState(emptyDetails);
  const [lines, setLines] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loadedOrder, setLoadedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([api.menu(), editing ? api.order(id) : Promise.resolve(null)])
      .then(([items, order]) => {
        if (!active) return;
        setMenu(items);
        if (order) {
          setLoadedOrder(order);
          setDetails({
            type: order.type,
            tableNumber: order.tableNumber,
            customerName: order.customerName,
            notes: order.notes,
          });
          setLines(
            order.items.map((line) => ({
              menuItemId: String(line.menuItemId),
              name: line.name,
              unitPricePaise: line.unitPricePaise,
              quantity: line.quantity,
            }))
          );
        }
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
  }, [editing, id]);

  const options = useMemo(
    () =>
      menu.filter(
        (item) =>
          item.isAvailable &&
          !lines.some((line) => line.menuItemId === item._id)
      ),
    [menu, lines]
  );
  const totalPaise = lines.reduce(
    (sum, line) => sum + line.unitPricePaise * line.quantity,
    0
  );
  const readOnly = editing && loadedOrder?.status !== "OPEN";

  function addItem() {
    const item = options.find((candidate) => candidate._id === selectedId);
    if (!item) return;
    setLines((current) => [
      ...current,
      {
        menuItemId: item._id,
        name: item.name,
        unitPricePaise: item.pricePaise,
        quantity: 1,
      },
    ]);
    setSelectedId("");
    setError("");
  }

  function updateQuantity(menuItemId, quantity) {
    setLines((current) =>
      current.map((line) =>
        line.menuItemId === menuItemId ? { ...line, quantity } : line
      )
    );
  }

  async function save(event) {
    event.preventDefault();
    setError("");
    if (!lines.length) {
      setError("Add at least one item before saving the order.");
      return;
    }
    if (
      lines.some(
        (line) =>
          !Number.isInteger(line.quantity) ||
          line.quantity < 1 ||
          line.quantity > 99
      )
    ) {
      setError("Every quantity must be a whole number between 1 and 99.");
      return;
    }
    if (details.type === "DINE_IN" && !details.tableNumber.trim()) {
      setError("Enter a table number for dine-in orders.");
      return;
    }
    const payload = {
      ...details,
      items: lines.map(({ menuItemId, quantity }) => ({
        menuItemId,
        quantity,
      })),
    };
    if (editing) payload.version = loadedOrder.__v;
    setSaving(true);
    try {
      if (editing) await api.updateOrder(id, payload);
      else await api.createOrder(payload);
      navigate(`${base}/orders`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-7">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to={`${base}/orders`}
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-emerald-800 hover:underline"
          >
            <ArrowLeft size={15} /> All orders
          </Link>
          <p className="eyebrow">Order management</p>
          <h1 className="page-title">{editing ? "Edit order" : "New order"}</h1>
          <p className="page-subtitle">
            Choose the order type, add food and save it to your database.
          </p>
        </div>
      </header>
      <ErrorMessage message={error} />
      {loading ? (
        <Loading />
      ) : readOnly ? (
        <EmptyState
          title="This order cannot be edited"
          detail="Only open orders can be updated."
          action={
            <Link to={`${base}/orders`} className="btn-outline">
              Back to orders
            </Link>
          }
        />
      ) : (
        <form
          onSubmit={save}
          className="grid items-start gap-6 xl:grid-cols-[1.2fr_0.8fr]"
        >
          <div className="space-y-6">
            <section className="panel space-y-5">
              <div>
                <h2 className="section-title">1. Order details</h2>
                <p className="text-sm text-slate-500">
                  Identify the service type and table, if applicable.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="field-label">
                  Order type
                  <select
                    className="field-input"
                    value={details.type}
                    onChange={(e) =>
                      setDetails({
                        ...details,
                        type: e.target.value,
                        tableNumber:
                          e.target.value === "TAKEAWAY"
                            ? ""
                            : details.tableNumber,
                      })
                    }
                  >
                    <option value="DINE_IN">Dine-in</option>
                    <option value="TAKEAWAY">Takeaway</option>
                  </select>
                </label>
                {details.type === "DINE_IN" ? (
                  <label className="field-label">
                    Table number
                    <input
                      required
                      maxLength={12}
                      className="field-input"
                      placeholder="e.g. 4"
                      value={details.tableNumber}
                      onChange={(e) =>
                        setDetails({ ...details, tableNumber: e.target.value })
                      }
                    />
                  </label>
                ) : (
                  <div className="hidden sm:block" />
                )}
                <label className="field-label">
                  Customer name{" "}
                  <span className="text-slate-400">(optional)</span>
                  <input
                    maxLength={80}
                    className="field-input"
                    placeholder="e.g. Guest"
                    value={details.customerName}
                    onChange={(e) =>
                      setDetails({ ...details, customerName: e.target.value })
                    }
                  />
                </label>
                <label className="field-label">
                  Instructions{" "}
                  <span className="text-slate-400">(optional)</span>
                  <input
                    maxLength={300}
                    className="field-input"
                    placeholder="e.g. Less spicy"
                    value={details.notes}
                    onChange={(e) =>
                      setDetails({ ...details, notes: e.target.value })
                    }
                  />
                </label>
              </div>
            </section>
            <section className="panel space-y-5">
              <div>
                <h2 className="section-title">2. Add food items</h2>
                <p className="text-sm text-slate-500">
                  Only items marked available can be newly added.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="field-label min-w-0 flex-1">
                  Choose a dish
                  <select
                    className="field-input"
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                  >
                    <option value="">Select an available item</option>
                    {options.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name} — {currency(item.pricePaise)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  disabled={!selectedId}
                  onClick={addItem}
                  className="btn-outline self-stretch sm:self-end"
                >
                  <Plus size={17} /> Add to order
                </button>
              </div>
              {!menu.length ? (
                <p className="text-sm text-amber-700">
                  Your menu is empty.{" "}
                  <Link to={`${base}/menu`} className="font-semibold underline">
                    Add menu items first
                  </Link>
                  .
                </p>
              ) : !options.length ? (
                <p className="text-sm text-slate-500">
                  No more available items to add.
                </p>
              ) : null}
              {!lines.length ? (
                <EmptyState
                  title="No food selected yet"
                  detail="Choose a dish above to build this order."
                />
              ) : (
                <div className="divide-y divide-slate-100">
                  {lines.map((line) => (
                    <div
                      key={line.menuItemId}
                      className="flex flex-wrap items-center gap-3 py-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold break-words">{line.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {currency(line.unitPricePaise)} per item
                        </p>
                      </div>
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-500">
                        Qty
                        <input
                          aria-label={`Quantity for ${line.name}`}
                          className="field-input w-20 text-center"
                          type="number"
                          min="1"
                          max="99"
                          step="1"
                          required
                          value={line.quantity}
                          onChange={(e) =>
                            updateQuantity(
                              line.menuItemId,
                              e.target.value === "" ? 0 : Number(e.target.value)
                            )
                          }
                        />
                      </label>
                      <strong className="min-w-20 text-right text-sm">
                        {currency(line.unitPricePaise * line.quantity)}
                      </strong>
                      <button
                        type="button"
                        className="icon-button text-red-700 hover:bg-red-50"
                        aria-label={`Remove ${line.name}`}
                        onClick={() =>
                          setLines((current) =>
                            current.filter(
                              (item) => item.menuItemId !== line.menuItemId
                            )
                          )
                        }
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
          <aside className="panel xl:sticky xl:top-8">
            <h2 className="section-title">3. Order summary</h2>
            <p className="mt-1 text-sm text-slate-500">
              {lines.length} unique dish{lines.length === 1 ? "" : "es"}
            </p>
            <div className="my-6 border-y border-slate-200 py-5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-slate-600">Subtotal</span>
                <strong className="text-xl">{currency(totalPaise)}</strong>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                This is the food subtotal. Generate the final bill and record
                payment from the Orders page after saving.
              </p>
            </div>
            <button
              type="submit"
              disabled={saving || !lines.length}
              className="btn-primary w-full justify-center"
            >
              {saving
                ? "Saving order…"
                : editing
                ? "Save order changes"
                : "Create order"}
            </button>
            <Link
              to={`${base}/orders`}
              className="mt-3 flex min-h-10 items-center justify-center text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              Back without saving
            </Link>
          </aside>
        </form>
      )}
    </section>
  );
}

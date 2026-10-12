/**
 * Path: frontend/src/pages/MenuPage.jsx
 * Responsibility: Real MongoDB-backed menu CRUD, availability toggle, search and editing.
 * Integration: api.js menu endpoints and reusable Feedback components.
 */
import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { api, currency } from "../services/api.js";
import { EmptyState, ErrorMessage, Loading } from "../components/Feedback.jsx";

const blank = { name: "", category: "", price: "", isAvailable: true };

export default function MenuPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(blank);

  async function reload() {
    const result = await api.menu();
    setItems(result);
  }
  useEffect(() => {
    let active = true;
    api
      .menu()
      .then((result) => {
        if (active) setItems(result);
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

  const filtered = useMemo(
    () =>
      items.filter((item) =>
        `${item.name} ${item.category}`
          .toLowerCase()
          .includes(search.trim().toLowerCase())
      ),
    [items, search]
  );

  function beginEdit(item) {
    setEditingId(item._id);
    setDraft({
      name: item.name,
      category: item.category,
      price: (item.pricePaise / 100).toFixed(2),
      isAvailable: item.isAvailable,
    });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function reset() {
    setEditingId(null);
    setDraft(blank);
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    // Keep inputs in rupees; the API stores integer paise.
    if (!/^\d+(?:\.\d{1,2})?$/.test(String(draft.price).trim())) {
      setError("Enter a non-negative price with up to two decimal places.");
      return;
    }
    const pricePaise = Math.round(Number(draft.price) * 100);
    if (!Number.isSafeInteger(pricePaise)) {
      setError("Invalid price");
      return;
    }
    const body = {
      name: draft.name,
      category: draft.category,
      pricePaise,
      isAvailable: draft.isAvailable,
    };
    setSaving(true);
    try {
      if (editingId) await api.updateMenuItem(editingId, body);
      else await api.createMenuItem(body);
      await reload();
      setMessage(editingId ? "Menu item updated." : "Menu item added.");
      reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(item) {
    if (
      !window.confirm(
        `Delete "${item.name}" from the menu? Existing orders will keep their saved details.`
      )
    )
      return;
    setError("");
    setMessage("");
    try {
      await api.deleteMenuItem(item._id);
      await reload();
      if (editingId === item._id) reset();
      setMessage("Menu item deleted.");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="space-y-7">
      <header>
        <p className="eyebrow">Menu management</p>
        <h1 className="page-title">Food & prices</h1>
        <p className="page-subtitle">
          Create dishes, update prices and control availability.
        </p>
      </header>
      <ErrorMessage message={error} />
      {message ? (
        <p role="status" className="success-note">
          {message}
        </p>
      ) : null}
      <section className="panel">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="section-title">
              {editingId ? "Edit menu item" : "Add menu item"}
            </h2>
            <p className="text-sm text-slate-500">
              Prices are entered in Indian rupees.
            </p>
          </div>
          {editingId ? (
            <button type="button" className="btn-outline" onClick={reset}>
              <X size={16} /> Cancel edit
            </button>
          ) : null}
        </div>
        <form
          onSubmit={submit}
          className="grid gap-4 md:grid-cols-[1.2fr_1fr_0.7fr_auto] md:items-end"
        >
          <label className="field-label">
            Item name
            <input
              className="field-input"
              required
              maxLength={80}
              placeholder="e.g. Paneer Tikka"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </label>
          <label className="field-label">
            Category
            <input
              className="field-input"
              required
              maxLength={40}
              placeholder="e.g. Starters"
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            />
          </label>
          <label className="field-label">
            Price (₹)
            <input
              className="field-input"
              required
              inputMode="decimal"
              placeholder="199.00"
              value={draft.price}
              onChange={(e) => setDraft({ ...draft, price: e.target.value })}
            />
          </label>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary justify-center"
          >
            <Plus size={17} />
            {saving ? "Saving…" : editingId ? "Save changes" : "Add item"}
          </button>
          <label className="flex items-center gap-2 text-sm font-medium md:col-span-full">
            <input
              type="checkbox"
              checked={draft.isAvailable}
              onChange={(e) =>
                setDraft({ ...draft, isAvailable: e.target.checked })
              }
              className="h-4 w-4 accent-emerald-800"
            />
            Available for orders
          </label>
        </form>
      </section>
      <section className="panel">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="section-title">Current menu</h2>
            <p className="text-sm text-slate-500">
              {items.length} item{items.length === 1 ? "" : "s"} in database
            </p>
          </div>
          <label className="relative w-full sm:w-64">
            <Search
              size={17}
              className="pointer-events-none absolute left-3 top-3 text-slate-400"
            />
            <span className="sr-only">Search menu</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field-input pl-10"
              placeholder="Search dishes or categories"
            />
          </label>
        </div>
        {loading ? (
          <Loading />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={search ? "No matching dishes" : "Your menu is empty"}
            detail={
              search
                ? "Try a different search."
                : "Add the first item using the form above."
            }
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <div
                key={item._id}
                className="flex flex-wrap items-center gap-3 py-4 sm:flex-nowrap"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold break-words">{item.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {item.category} ·{" "}
                    <span
                      className={
                        item.isAvailable ? "text-emerald-700" : "text-amber-700"
                      }
                    >
                      {item.isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </p>
                </div>
                <strong className="min-w-24 text-sm">
                  {currency(item.pricePaise)}
                </strong>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => beginEdit(item)}
                    aria-label={`Edit ${item.name}`}
                    className="icon-button"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(item)}
                    aria-label={`Delete ${item.name}`}
                    className="icon-button text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

/**
 * Path: frontend/src/pages/CustomerMenuPage.jsx
 * Responsibility: Public menu browsing and pre-login cart building with live availability.
 * Integration: public GET /api/menu and CartContext.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, ShoppingBag } from "lucide-react";
import { api, currency } from "../services/api.js";
import { useCart } from "../contexts/CartContext.jsx";
import { EmptyState, ErrorMessage, Loading } from "../components/Feedback.jsx";
export default function CustomerMenuPage() {
  const [menu, setMenu] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const cart = useCart();
  useEffect(() => {
    let active = true;
    api
      .menu()
      .then((data) => {
        if (active) setMenu(data.filter((item) => item.isAvailable));
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  const available = useMemo(
    () =>
      menu.filter((item) =>
        `${item.name} ${item.category}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [menu, search]
  );
  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Welcome to our restaurant</p>
          <h1 className="page-title">Choose your meal</h1>
          <p className="page-subtitle">
            Explore dishes, add them to your cart, then sign in at checkout.
          </p>
        </div>
        <Link className="btn-primary" to="/customer/cart">
          <ShoppingBag size={17} />
          View cart ({cart.count})
        </Link>
      </header>
      <ErrorMessage message={error} />
      <label className="field-label max-w-lg">
        Search menu
        <input
          className="field-input"
          value={search}
          placeholder="Search dishes or categories"
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      {loading ? (
        <Loading />
      ) : !available.length ? (
        <EmptyState
          title="No menu items found"
          detail="Try another search or ask restaurant staff about availability."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {available.map((item) => (
            <article
              key={item._id}
              className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5"
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  {item.category}
                </p>
                <h2 className="mt-2 text-lg font-bold">{item.name}</h2>
                <p className="mt-3 text-xl font-extrabold">
                  {currency(item.pricePaise)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => cart.add(item)}
                className="btn-outline mt-5 w-full"
              >
                <Plus size={16} /> Add to cart
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

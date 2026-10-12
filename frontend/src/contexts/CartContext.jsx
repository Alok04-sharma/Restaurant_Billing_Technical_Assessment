/**
 * Path: frontend/src/contexts/CartContext.jsx
 * Responsibility: Hold a pre-login customer cart without storing passwords or sessions.
 * Integration: Customer menu, cart checkout and localStorage for convenience.
 */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
const CartContext = createContext(null);
const KEY = "restaurant_demo_cart_v1";
function readCart() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(value)
      ? value
          .filter(
            (x) =>
              typeof x.menuItemId === "string" &&
              Number.isInteger(x.quantity) &&
              x.quantity >= 1 &&
              x.quantity <= 99
          )
          .slice(0, 40)
      : [];
  } catch {
    return [];
  }
}
export function CartProvider({ children }) {
  const [lines, setLines] = useState(readCart);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* Browser may disable storage. */
    }
  }, [lines]);
  const value = useMemo(
    () => ({
      lines,
      count: lines.reduce((count, line) => count + line.quantity, 0),
      add(item) {
        setLines((old) => {
          const found = old.find((l) => l.menuItemId === item._id);
          if (found)
            return old.map((l) =>
              l.menuItemId === item._id
                ? { ...l, quantity: Math.min(99, l.quantity + 1) }
                : l
            );
          if (old.length >= 40) return old;
          return [
            ...old,
            {
              menuItemId: item._id,
              quantity: 1,
              name: item.name,
              pricePaise: item.pricePaise,
            },
          ];
        });
      },
      quantity(id, value) {
        setLines((old) =>
          old.map((l) =>
            l.menuItemId === id
              ? { ...l, quantity: Math.max(1, Math.min(99, value)) }
              : l
          )
        );
      },
      remove(id) {
        setLines((old) => old.filter((l) => l.menuItemId !== id));
      },
      clear() {
        setLines([]);
      },
    }),
    [lines]
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("CartProvider missing");
  return ctx;
}

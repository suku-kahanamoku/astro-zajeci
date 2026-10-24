import { useEffect, useSyncExternalStore } from "react";
import type { RecordData } from "../CoreModule/types";
export interface CartState {
  carts: RecordData[];
  user: RecordData;
  shipping: RecordData;
  payment: RecordData;
}
const empty: CartState = {
  carts: [],
  user: { address: { main: {}, shipping: {} } },
  shipping: {},
  payment: {},
};
let state: CartState = empty;
let loaded = false;
const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((listener) => listener());
}
export function decodeStoredCart(
  raw: string,
  now = Date.now(),
): CartState | null {
  let stored = JSON.parse(raw);
  if (stored && "value" in stored && "created" in stored) {
    const units: Record<string, number> = {
      s: 1000,
      m: 60000,
      h: 3600000,
      d: 86400000,
    };
    if (
      Number(stored.created) +
        Number(stored.expiry) * (units[stored.unit] || 60000) <=
      now
    )
      return null;
    stored =
      typeof stored.value === "string"
        ? JSON.parse(stored.value)
        : stored.value;
  }
  if (stored && "ttl" in stored && stored.ttl && stored.ttl < now) return null;
  if (stored && "data" in stored)
    stored =
      typeof stored.data === "string" ? JSON.parse(stored.data) : stored.data;
  return stored?.carts
    ? {
        carts: stored.carts
          .filter((item: any) => item?.wine?.id && Number(item.quantity) > 0)
          .map((item: any) => cartLine(item.wine, Number(item.quantity))),
        user: stored.user || empty.user,
        shipping: stored.shipping || {},
        payment: stored.payment || stored.billing || {},
      }
    : null;
}
export function loadCart() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    state =
      decodeStoredCart(localStorage.getItem("cashdesk") || "null") || empty;
  } catch {
    /* Storage is optional. */
  }
  notify();
}
export function updateCart(patch: Partial<CartState>) {
  state = { ...state, ...patch };
  try {
    localStorage.setItem(
      "cashdesk",
      JSON.stringify({
        created: Date.now(),
        expiry: 7,
        unit: "d",
        value: JSON.stringify({ ...state, billing: state.payment }),
      }),
    );
  } catch {
    /* Continue in memory. */
  }
  notify();
}
export function cartLine(wine: RecordData, quantity: number) {
  const price = Number(wine.price) || 0;
  return {
    wine,
    product_id: Number(wine.id),
    quantity,
    unit_price: price,
    total_price: price * quantity,
    total_price_with_vat: Number(wine.price_with_vat ?? price) * quantity,
  };
}
export function addItem(wine: RecordData, quantity = 1) {
  loadCart();
  const current = state.carts.find(
    (item) => item.product_id === Number(wine.id),
  );
  const item = cartLine(
    wine,
    Math.max(1, Number(quantity) || 1) + (current?.quantity || 0),
  );
  updateCart({
    carts: current
      ? state.carts.map((line) => (line === current ? item : line))
      : [...state.carts, item],
  });
  return item;
}
export function setQuantity(id: number, quantity: number) {
  updateCart({
    carts: state.carts.flatMap((line) =>
      Number(line.product_id) !== Number(id)
        ? [line]
        : quantity > 0
          ? [cartLine(line.wine, Math.floor(quantity))]
          : [],
    ),
  });
}
export function resetCart() {
  updateCart({ carts: [], shipping: {}, payment: {} });
}
export function cartSubtotal(carts: RecordData[]) {
  return carts.reduce(
    (total, line) =>
      total + Number(line.total_price_with_vat ?? line.total_price),
    0,
  );
}
export function shippingPrice(shipping: RecordData, subtotal: number) {
  return subtotal > 2500
    ? 0
    : Number(shipping?.data?.price ?? shipping?.price ?? 0);
}
export function useCart() {
  useEffect(loadCart, []);
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => state,
    () => empty,
  );
}

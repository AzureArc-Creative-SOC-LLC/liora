import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { projects } from "../data/site";

export type CartLine = { id: string; qty: number };

type CartContextValue = {
  items: CartLine[];
  totalQty: number;
  subtotal: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  addItem: (id: string, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "liora.cart.v1";

const readStorage = (): CartLine[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l): l is CartLine =>
        typeof l?.id === "string" && Number.isFinite(l?.qty),
    );
  } catch {
    return [];
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>(() => readStorage());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota errors
    }
  }, [items]);

  useEffect(() => {
    document.body.classList.toggle("scroll-lock", isOpen);
    return () => document.body.classList.remove("scroll-lock");
  }, [isOpen]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((id: string, qty: number = 1) => {
    setItems((prev) => {
      const existing = prev.find((l) => l.id === id);
      if (existing) {
        return prev.map((l) =>
          l.id === id ? { ...l, qty: l.qty + qty } : l,
        );
      }
      return [...prev, { id, qty }];
    });
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((l) => l.id !== id)
        : prev.map((l) => (l.id === id ? { ...l, qty } : l)),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const { totalQty, subtotal } = useMemo(() => {
    let q = 0;
    let s = 0;
    for (const line of items) {
      q += line.qty;
      const p = projects.find((pr) => pr.id === line.id);
      if (p) s += p.price * line.qty;
    }
    return { totalQty: q, subtotal: s };
  }, [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      totalQty,
      subtotal,
      isOpen,
      open,
      close,
      addItem,
      setQty,
      remove,
      clear,
    }),
    [items, totalQty, subtotal, isOpen, open, close, addItem, setQty, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

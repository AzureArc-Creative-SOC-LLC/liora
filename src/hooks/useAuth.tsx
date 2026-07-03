import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ApiError,
  authLogin,
  authRegister,
  authVerify,
  getToken,
  setToken,
  type ApiUser,
} from "../lib/api";

export type OrderStatus =
  | "clinician review"
  | "approved"
  | "dispensing"
  | "dispatched"
  | "delivered";

export type OrderLine = { id: string; title: string; qty: number; price: number };

export type Order = {
  ref: string;
  placedAt: number;
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  items: OrderLine[];
  contact: { email: string; phone: string };
  address: {
    firstName: string;
    lastName: string;
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    country: string;
  };
};

export type Account = {
  email: string;
  fullName: string;
  memberSince: number;
  orders: Order[];
};

type AuthResult = { ok: true } | { ok: false; error: string };

type AuthContextValue = {
  account: Account | null;
  authReady: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  createAccount: (input: {
    fullName: string;
    email: string;
    password: string;
    dateOfBirth: string;
    nationality: string;
    countryOfResidence: string;
  }) => Promise<AuthResult>;
  logout: () => void;
  addOrder: (order: Omit<Order, "ref" | "placedAt" | "status">) => Order;
  addOrderWithRef: (
    order: Omit<Order, "ref" | "placedAt" | "status">,
    ref: string,
  ) => Order;
  advanceOrderStatus: (ref: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const ORDERS_KEY = "liora.auth.orders.v1";

type StoredOrders = Record<string, Order[]>;

const readOrders = (): StoredOrders => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(ORDERS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const STATUS_FLOW: OrderStatus[] = [
  "clinician review",
  "approved",
  "dispensing",
  "dispatched",
  "delivered",
];

const nextStatus = (s: OrderStatus): OrderStatus => {
  const idx = STATUS_FLOW.indexOf(s);
  if (idx < 0 || idx >= STATUS_FLOW.length - 1) return s;
  return STATUS_FLOW[idx + 1];
};

const makeRef = () => {
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase();
  const ts = Date.now().toString(36).slice(-4).toUpperCase();
  return `LR-${ts}${rnd}`;
};

const memberSinceFromUser = (u: ApiUser): number => {
  // API does not expose account creation date; fall back to now.
  void u;
  return Date.now();
};

const toAccount = (u: ApiUser, orders: Order[]): Account => ({
  email: u.email.toLowerCase(),
  fullName: u.name,
  memberSince: memberSinceFromUser(u),
  orders,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [ordersByEmail, setOrdersByEmail] = useState<StoredOrders>(() =>
    readOrders(),
  );
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(ORDERS_KEY, JSON.stringify(ordersByEmail));
    } catch {
      // ignore
    }
  }, [ordersByEmail]);

  // On mount, if we have a token, resolve the current user.
  useEffect(() => {
    let cancelled = false;
    const token = getToken();
    if (!token) {
      setAuthReady(true);
      return;
    }
    authVerify()
      .then((res) => {
        if (cancelled) return;
        setUser(res.user);
      })
      .catch(() => {
        if (cancelled) return;
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setAuthReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const account = useMemo<Account | null>(() => {
    if (!user) return null;
    const key = user.email.toLowerCase();
    const orders = ordersByEmail[key] ?? [];
    return toAccount(user, orders);
  }, [user, ordersByEmail]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      try {
        const res = await authLogin(email.trim(), password);
        setToken(res.token);
        setUser(res.user);
        return { ok: true };
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.message
            : "Sign in failed. Please try again.";
        return { ok: false, error: msg };
      }
    },
    [],
  );

  const createAccount = useCallback(
    async (input: {
      fullName: string;
      email: string;
      password: string;
      dateOfBirth: string;
      nationality: string;
      countryOfResidence: string;
    }): Promise<AuthResult> => {
      const name = input.fullName.trim();
      if (!name) return { ok: false, error: "Please enter your full name." };
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email.trim()))
        return { ok: false, error: "Please enter a valid email." };
      if (input.password.length < 6)
        return { ok: false, error: "Password must be at least 6 characters." };
      if (!input.dateOfBirth)
        return { ok: false, error: "Please enter your date of birth." };
      if (!input.nationality.trim())
        return { ok: false, error: "Please enter your nationality." };
      if (!input.countryOfResidence.trim())
        return { ok: false, error: "Please enter your country of residence." };

      try {
        const res = await authRegister({
          name,
          email: input.email.trim(),
          password: input.password,
          date_of_birth: input.dateOfBirth,
          nationality: input.nationality.trim(),
          country_of_residence: input.countryOfResidence.trim(),
        });
        setToken(res.token);
        setUser(res.user);
        return { ok: true };
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.message
            : "Registration failed. Please try again.";
        return { ok: false, error: msg };
      }
    },
    [],
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const addOrderWithRef = useCallback(
    (order: Omit<Order, "ref" | "placedAt" | "status">, ref: string) => {
      const full: Order = {
        ...order,
        ref,
        placedAt: Date.now(),
        status: "clinician review",
      };
      setOrdersByEmail((prev) => {
        const key = order.contact.email.toLowerCase();
        const existing = prev[key] ?? [];
        return { ...prev, [key]: [full, ...existing] };
      });
      return full;
    },
    [],
  );

  const addOrder = useCallback(
    (order: Omit<Order, "ref" | "placedAt" | "status">) =>
      addOrderWithRef(order, makeRef()),
    [addOrderWithRef],
  );

  const advanceOrderStatus = useCallback((ref: string) => {
    setOrdersByEmail((prev) => {
      const next: StoredOrders = {};
      for (const [key, orders] of Object.entries(prev)) {
        next[key] = orders.map((o) =>
          o.ref === ref ? { ...o, status: nextStatus(o.status) } : o,
        );
      }
      return next;
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      account,
      authReady,
      signIn,
      createAccount,
      logout,
      addOrder,
      addOrderWithRef,
      advanceOrderStatus,
    }),
    [
      account,
      authReady,
      signIn,
      createAccount,
      logout,
      addOrder,
      addOrderWithRef,
      advanceOrderStatus,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type View =
  | { name: "home" }
  | { name: "product"; id: string }
  | { name: "cart" }
  | { name: "checkout" }
  | { name: "login"; redirect?: string }
  | { name: "account" };

type RouterContextValue = {
  view: View;
  navigate: (next: View) => void;
};

const parse = (hash: string): View => {
  if (/^#\/cart\b/.test(hash)) return { name: "cart" };
  if (/^#\/checkout\b/.test(hash)) return { name: "checkout" };
  if (/^#\/account\b/.test(hash)) return { name: "account" };
  const login = hash.match(/^#\/login(?:\?redirect=([^&]+))?/);
  if (login) return { name: "login", redirect: login[1] ? decodeURIComponent(login[1]) : undefined };
  const product = hash.match(/^#\/product\/([^/?]+)/);
  if (product) return { name: "product", id: product[1] };
  return { name: "home" };
};

const RouterContext = createContext<RouterContextValue | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<View>(() =>
    typeof window === "undefined"
      ? { name: "home" }
      : parse(window.location.hash),
  );

  useEffect(() => {
    const onHashChange = () => {
      setView(parse(window.location.hash));
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = useCallback((next: View) => {
    let hash: string;
    switch (next.name) {
      case "home":
        hash = "";
        break;
      case "product":
        hash = `#/product/${next.id}`;
        break;
      case "cart":
        hash = "#/cart";
        break;
      case "checkout":
        hash = "#/checkout";
        break;
      case "login":
        hash = next.redirect ? `#/login?redirect=${encodeURIComponent(next.redirect)}` : "#/login";
        break;
      case "account":
        hash = "#/account";
        break;
    }
    if (hash === "") {
      if (window.location.hash) {
        history.pushState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
        setView({ name: "home" });
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      }
    } else {
      window.location.hash = hash.slice(1);
    }
  }, []);

  const value = useMemo(() => ({ view, navigate }), [view, navigate]);

  return (
    <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error("useRouter must be used within RouterProvider");
  return ctx;
}

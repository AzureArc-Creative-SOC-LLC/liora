import { useEffect } from "react";
import clsx from "clsx";
import { projects } from "../data/site";
import { useCart } from "../hooks/useCart";
import { useRouter } from "../hooks/useRouter";

const formatUsd = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export function CartDrawer() {
  const { items, isOpen, close, setQty, remove, subtotal } = useCart();
  const { navigate } = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  const lines = items
    .map((line) => {
      const product = projects.find((p) => p.id === line.id);
      if (!product) return null;
      return { line, product };
    })
    .filter((x): x is { line: typeof items[number]; product: typeof projects[number] } => x !== null);

  const goToCart = () => {
    close();
    navigate({ name: "cart" });
  };

  const goToCheckout = () => {
    close();
    navigate({ name: "checkout" });
  };

  return (
    <div
      className={clsx("cart", isOpen && "is-open")}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        className="cart__overlay"
        onClick={close}
        aria-label="Close cart"
        tabIndex={isOpen ? 0 : -1}
      />
      <aside
        className="cart__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <header className="cart__header">
          <div>
            <span className="mono cart__eyebrow">Your cart</span>
            <h2 className="cart__title">
              {lines.length} {lines.length === 1 ? "item" : "items"}
            </h2>
          </div>
          <button
            type="button"
            className="cart__close"
            onClick={close}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="cart__empty">
            <div className="cart__empty-mark" aria-hidden>
              ◌
            </div>
            <p>Your cart is empty.</p>
            <button
              type="button"
              className="cart__empty-cta"
              onClick={() => {
                close();
                navigate({ name: "home" });
                window.setTimeout(() => {
                  const el = document.querySelector("#work");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }, 80);
              }}
            >
              Browse catalogue
            </button>
          </div>
        ) : (
          <>
            <ul className="cart__items">
              {lines.map(({ line, product }) => (
                <li key={product.id} className="cart__item">
                  <a
                    href={`#/product/${product.id}`}
                    className="cart__thumb"
                    style={{ background: product.accent }}
                    onClick={close}
                  >
                    <img src={product.image} alt={product.title} />
                  </a>
                  <div className="cart__item-body">
                    <a
                      href={`#/product/${product.id}`}
                      className="cart__item-name"
                      onClick={close}
                    >
                      {product.title}
                    </a>
                    <span className="mono cart__item-sector">
                      {product.sector}
                    </span>
                    <div className="cart__item-row">
                      <div
                        className="cart__qty"
                        role="group"
                        aria-label={`Quantity for ${product.title}`}
                      >
                        <button
                          type="button"
                          onClick={() => setQty(product.id, line.qty - 1)}
                          aria-label="Decrease"
                        >
                          −
                        </button>
                        <span>{line.qty}</span>
                        <button
                          type="button"
                          onClick={() => setQty(product.id, line.qty + 1)}
                          aria-label="Increase"
                        >
                          +
                        </button>
                      </div>
                      <span className="cart__item-price">
                        {formatUsd(product.price * line.qty)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="cart__remove"
                    onClick={() => remove(product.id)}
                    aria-label={`Remove ${product.title}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>

            <footer className="cart__footer">
              <div className="cart__totals">
                <span>Subtotal</span>
                <span className="cart__total-value">
                  {formatUsd(subtotal)}
                </span>
              </div>
              <p className="cart__note mono">
                Shipping calculated at checkout — discreet dispatch
              </p>
              <button
                type="button"
                className="cart__checkout"
                onClick={goToCheckout}
              >
                Proceed to checkout
              </button>
              <button
                type="button"
                className="cart__view"
                onClick={goToCart}
              >
                View cart
              </button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}

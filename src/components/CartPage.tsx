import { projects } from "../data/site";
import { useCart } from "../hooks/useCart";
import { useRouter } from "../hooks/useRouter";

const formatUsd = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export function CartPage() {
  const { items, setQty, remove, subtotal } = useCart();
  const { navigate } = useRouter();

  const lines = items
    .map((line) => {
      const product = projects.find((p) => p.id === line.id);
      if (!product) return null;
      return { line, product };
    })
    .filter(
      (x): x is { line: typeof items[number]; product: typeof projects[number] } =>
        x !== null,
    );

  if (lines.length === 0) {
    return (
      <section className="container cart-page cart-page--empty">
        <header className="cart-page__head">
          <span className="mono eyebrow">Cart</span>
          <h1 className="cart-page__title">No items yet</h1>
          <p className="cart-page__lede">
            Your Liora Healthcare cart is empty. Add a treatment to continue.
          </p>
        </header>
        <div className="cart-page__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              navigate({ name: "home" });
              window.setTimeout(() => {
                const el = document.querySelector("#work");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }, 80);
            }}
          >
            Browse treatments
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="container cart-page">
      <header className="cart-page__head">
        <span className="mono eyebrow">Cart</span>
        <h1 className="cart-page__title">Your cart</h1>
        <p className="cart-page__lede">
          Review the items in your Liora Healthcare cart before checkout.
        </p>
      </header>

      <div className="cart-page__grid">
        <div className="cart-page__items">
          <div className="cart-page__items-head">
            <span className="mono">Items in your cart</span>
          </div>

          <ul className="cart-page__list">
            {lines.map(({ line, product }) => (
              <li key={product.id} className="cart-line">
                <a
                  href={`#/product/${product.id}`}
                  className="cart-line__thumb"
                >
                  <img src={product.image} alt={product.title} />
                </a>
                <div className="cart-line__body">
                  <div className="cart-line__meta">
                    <span className="mono">{product.sector}</span>
                    <a
                      href={`#/product/${product.id}`}
                      className="cart-line__name"
                    >
                      {product.title}
                    </a>
                  </div>
                  <div className="cart-line__controls">
                    <div
                      className="cart-line__qty"
                      role="group"
                      aria-label={`Quantity for ${product.title}`}
                    >
                      <button
                        type="button"
                        onClick={() => setQty(product.id, line.qty - 1)}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span>{line.qty}</span>
                      <button
                        type="button"
                        onClick={() => setQty(product.id, line.qty + 1)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <span className="cart-line__price">
                      {formatUsd(product.price * line.qty)}
                    </span>
                    <button
                      type="button"
                      className="cart-line__remove"
                      onClick={() => remove(product.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <aside className="cart-page__summary">
          <h2 className="cart-page__summary-title">Order summary</h2>
          <dl className="cart-page__summary-rows">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatUsd(subtotal)}</dd>
            </div>
            <div className="cart-page__summary-total">
              <dt>Total</dt>
              <dd>{formatUsd(subtotal)}</dd>
            </div>
          </dl>
          <button
            type="button"
            className="btn btn--primary cart-page__checkout"
            onClick={() => navigate({ name: "checkout" })}
          >
            Proceed to checkout
          </button>
          <button
            type="button"
            className="cart-page__continue"
            onClick={() => {
              navigate({ name: "home" });
              window.setTimeout(() => {
                const el = document.querySelector("#work");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }, 80);
            }}
          >
            Continue shopping
          </button>
        </aside>
      </div>
    </section>
  );
}

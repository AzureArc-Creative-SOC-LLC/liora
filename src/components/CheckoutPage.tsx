import { useEffect, useState } from "react";
import { projects } from "../data/site";
import { useCart } from "../hooks/useCart";
import { useRouter } from "../hooks/useRouter";
import { useAuth, type Order } from "../hooks/useAuth";
import {
  ApiError,
  createPrimaryOrder,
  sendOrderConfirmationEmail,
  validatePromo,
} from "../lib/api";

const formatUsd = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

type FormState = {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  line1: string;
  line2: string;
  city: string;
  postcode: string;
  country: string;
};

const emptyForm: FormState = {
  email: "",
  phone: "",
  firstName: "",
  lastName: "",
  line1: "",
  line2: "",
  city: "",
  postcode: "",
  country: "United Arab Emirates",
};

export function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { navigate } = useRouter();
  const { account, addOrderWithRef } = useAuth();

  const [form, setForm] = useState<FormState>(() => ({
    ...emptyForm,
    email: account?.email ?? "",
    firstName: account?.fullName.split(" ")[0] ?? "",
    lastName: account?.fullName.split(" ").slice(1).join(" ") ?? "",
  }));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [promo, setPromo] = useState("");
  const [promoApplied, setPromoApplied] = useState<{ code: string; amount: number; percent: number } | null>(null);
  const [promoBusy, setPromoBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!placed) return;
    document.body.classList.add("scroll-lock");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate({ name: "home" });
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("scroll-lock");
      window.removeEventListener("keydown", onKey);
    };
  }, [placed, navigate]);

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

  const discount = promoApplied?.amount ?? 0;
  const shipping = 0;
  const total = Math.max(0, subtotal + shipping - discount);

  if (lines.length === 0 && !placed) {
    return (
      <section className="container checkout checkout--empty">
        <span className="mono eyebrow">Checkout</span>
        <h1 className="checkout__title">Nothing to check out</h1>
        <p className="checkout__lede">
          Your basket is empty. Add a treatment before you continue.
        </p>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => navigate({ name: "cart" })}
        >
          Browse treatments
        </button>
      </section>
    );
  }

  if (!account) {
    return (
      <section className="container checkout checkout--signin">
        <span className="mono eyebrow">Checkout</span>
        <h1 className="checkout__title">Sign in to complete your order</h1>
        <p className="checkout__lede">
          You need a Liora Healthcare account to place an order. It only takes a
          minute.
        </p>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() =>
            navigate({ name: "login", redirect: "/checkout" })
          }
        >
          Sign in or create account
        </button>
      </section>
    );
  }

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()))
      next.email = "Please enter a valid email";
    if (!form.phone.trim()) next.phone = "Required";
    if (!form.firstName.trim()) next.firstName = "Required";
    if (!form.lastName.trim()) next.lastName = "Required";
    if (!form.line1.trim()) next.line1 = "Required";
    if (!form.city.trim()) next.city = "Required";
    if (!form.postcode.trim()) next.postcode = "Required";
    if (!form.country.trim()) next.country = "Required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const applyPromo = async () => {
    const code = promo.trim().toUpperCase();
    if (!code) return;
    setPromoBusy(true);
    setError(null);
    try {
      const res = await validatePromo(code);
      const percent = res.percent ?? 0;
      const amount = Math.round((subtotal * percent) / 100);
      setPromoApplied({ code, amount, percent });
    } catch (err) {
      setPromoApplied(null);
      const msg =
        err instanceof ApiError && err.status === 404
          ? "That promo code isn't valid."
          : err instanceof ApiError
            ? err.message
            : "Could not validate promo code.";
      setError(msg);
      window.setTimeout(() => setError(null), 2500);
    } finally {
      setPromoBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setError(null);
    try {
      const orderItems = lines.map(({ line, product }) => ({
        id: product.id,
        title: product.title,
        qty: line.qty,
        price: product.price,
      }));

      const apiRes = await createPrimaryOrder({
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        address: [form.line1.trim(), form.line2.trim()].filter(Boolean).join(", "),
        city: form.city.trim(),
        postcode: form.postcode.trim(),
        country: form.country.trim(),
        subtotal,
        total,
        discountAmount: discount,
        promoCode: promoApplied?.code,
        promoDiscount: promoApplied?.percent,
        itemsArray: lines.map(({ line, product }) => ({
          name: product.title,
          quantity: line.qty,
          unitPrice: product.price,
          productId: product.id,
          sku: product.id,
        })),
      });

      // Fire-and-forget: liora's own branded confirmation email, built from
      // a fresh read of the persisted order (not local checkout form
      // state), so it reflects what was actually saved server-side. Never
      // awaited into this try/catch — a failed send shouldn't undo a
      // successfully placed order.
      void sendOrderConfirmationEmail(apiRes.orderNumber);

      const order = addOrderWithRef(
        {
          items: orderItems,
          subtotal,
          shipping,
          discount,
          total,
          contact: { email: form.email.trim(), phone: form.phone.trim() },
          address: {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            line1: form.line1.trim(),
            line2: form.line2.trim() || undefined,
            city: form.city.trim(),
            postcode: form.postcode.trim(),
            country: form.country.trim(),
          },
        },
        apiRes.orderNumber,
      );

      clear();
      setPlaced(order);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <section className="container checkout">
      <header className="checkout__head">
        <span className="mono eyebrow">Final step</span>
        <h1 className="checkout__title">Checkout</h1>
        <p className="checkout__lede">
          Complete your Liora Healthcare order securely.
        </p>
      </header>

      <div className="checkout__grid">
        <form
          id="checkout-form"
          className="checkout__form"
          onSubmit={submit}
          noValidate
        >
          <fieldset className="checkout__section">
            <legend>Contact</legend>
            <div className="field">
              <label htmlFor="co-email">Email address</label>
              <input
                id="co-email"
                type="email"
                autoComplete="email"
                placeholder="you@lab.com"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                aria-invalid={!!errors.email}
              />
              {errors.email && <span className="field__error">{errors.email}</span>}
            </div>
            <div className="field">
              <label htmlFor="co-phone">Mobile</label>
              <input
                id="co-phone"
                type="tel"
                autoComplete="tel"
                placeholder="+971 …"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                aria-invalid={!!errors.phone}
              />
              {errors.phone && <span className="field__error">{errors.phone}</span>}
            </div>
          </fieldset>

          <fieldset className="checkout__section">
            <legend>Shipping address</legend>
            <div className="field-row">
              <div className="field">
                <label htmlFor="co-first">First name</label>
                <input
                  id="co-first"
                  autoComplete="given-name"
                  placeholder="Avery"
                  value={form.firstName}
                  onChange={(e) => setField("firstName", e.target.value)}
                  aria-invalid={!!errors.firstName}
                />
                {errors.firstName && (
                  <span className="field__error">{errors.firstName}</span>
                )}
              </div>
              <div className="field">
                <label htmlFor="co-last">Last name</label>
                <input
                  id="co-last"
                  autoComplete="family-name"
                  placeholder="Jordan"
                  value={form.lastName}
                  onChange={(e) => setField("lastName", e.target.value)}
                  aria-invalid={!!errors.lastName}
                />
                {errors.lastName && (
                  <span className="field__error">{errors.lastName}</span>
                )}
              </div>
            </div>
            <div className="field">
              <label htmlFor="co-line1">Address line 1</label>
              <input
                id="co-line1"
                autoComplete="address-line1"
                placeholder="123 Research Park"
                value={form.line1}
                onChange={(e) => setField("line1", e.target.value)}
                aria-invalid={!!errors.line1}
              />
              {errors.line1 && <span className="field__error">{errors.line1}</span>}
            </div>
            <div className="field">
              <label htmlFor="co-line2">
                Address line 2 <span className="field__hint">optional</span>
              </label>
              <input
                id="co-line2"
                autoComplete="address-line2"
                placeholder="Unit 4B"
                value={form.line2}
                onChange={(e) => setField("line2", e.target.value)}
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="co-city">City</label>
                <input
                  id="co-city"
                  autoComplete="address-level2"
                  placeholder="Dubai"
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                  aria-invalid={!!errors.city}
                />
                {errors.city && <span className="field__error">{errors.city}</span>}
              </div>
              <div className="field">
                <label htmlFor="co-post">Postcode</label>
                <input
                  id="co-post"
                  autoComplete="postal-code"
                  placeholder="00000"
                  value={form.postcode}
                  onChange={(e) => setField("postcode", e.target.value)}
                  aria-invalid={!!errors.postcode}
                />
                {errors.postcode && (
                  <span className="field__error">{errors.postcode}</span>
                )}
              </div>
            </div>
            <div className="field">
              <label htmlFor="co-country">Country</label>
              <input
                id="co-country"
                autoComplete="country-name"
                placeholder="United Arab Emirates"
                value={form.country}
                onChange={(e) => setField("country", e.target.value)}
                aria-invalid={!!errors.country}
              />
              {errors.country && (
                <span className="field__error">{errors.country}</span>
              )}
            </div>
          </fieldset>

          {error && <p className="checkout__error">{error}</p>}
        </form>

        <aside className="checkout__summary">
          <h2 className="checkout__summary-title">Order summary</h2>
          <ul className="checkout__summary-items">
            {lines.map(({ line, product }) => (
              <li key={product.id}>
                <span className="checkout__summary-name">
                  {product.title}
                  <span className="mono"> × {line.qty}</span>
                </span>
                <span>{formatUsd(product.price * line.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="checkout__promo">
            <label htmlFor="co-promo">Promo code</label>
            <div className="checkout__promo-row">
              <input
                id="co-promo"
                placeholder="Promo code"
                value={promo}
                onChange={(e) => setPromo(e.target.value)}
              />
              <button type="button" onClick={applyPromo} disabled={promoBusy}>
                {promoBusy ? "Checking…" : "Apply"}
              </button>
            </div>
            {promoApplied && (
              <p className="checkout__promo-ok mono">
                {promoApplied.code} applied — −{formatUsd(promoApplied.amount)}
              </p>
            )}
          </div>
          <dl className="checkout__summary-rows">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatUsd(subtotal)}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>Free</dd>
            </div>
            {discount > 0 && (
              <div>
                <dt>Discount</dt>
                <dd>−{formatUsd(discount)}</dd>
              </div>
            )}
            <div className="checkout__summary-total">
              <dt>Total</dt>
              <dd>{formatUsd(total)}</dd>
            </div>
          </dl>
          <button
            type="submit"
            form="checkout-form"
            className="btn btn--primary checkout__submit"
            disabled={submitting}
          >
            {submitting ? "Placing order…" : "Place order"}
          </button>
        </aside>
      </div>
    </section>

    {placed && (
      <div
        className="order-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-modal-title"
      >
        <div
          className="order-modal__backdrop"
          onClick={() => navigate({ name: "home" })}
          aria-hidden
        />
        <div className="order-modal__card">
          <button
            type="button"
            className="order-modal__close"
            aria-label="Close"
            onClick={() => navigate({ name: "home" })}
          >
            ×
          </button>
          <div className="order-modal__icon" aria-hidden>
            <svg viewBox="0 0 60 60" fill="none">
              <circle
                cx="30"
                cy="30"
                r="27"
                stroke="currentColor"
                strokeWidth="1.5"
                opacity="0.35"
              />
              <path
                d="M19 30.5 27 38 42 22"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="mono eyebrow">Order confirmed</span>
          <h2 id="order-modal-title" className="order-modal__title">
            Thank you, {placed.address.firstName}
          </h2>
          <p className="order-modal__lede">
            Your order is with our clinician team for review. A confirmation has
            been sent to {placed.contact.email}.
          </p>

          <dl className="order-modal__meta">
            <div>
              <dt className="mono">Reference</dt>
              <dd className="mono">{placed.ref}</dd>
            </div>
            <div>
              <dt className="mono">Total</dt>
              <dd>{formatUsd(placed.total)}</dd>
            </div>
            <div>
              <dt className="mono">Ship to</dt>
              <dd>
                {placed.address.city}, {placed.address.country}
              </dd>
            </div>
          </dl>

          <div className="order-modal__actions">
            <button
              type="button"
              className="account-btn account-btn--primary"
              onClick={() => navigate({ name: "track", order: placed.ref })}
            >
              Track order
            </button>
            <button
              type="button"
              className="account-btn account-btn--ghost"
              onClick={() => navigate({ name: "home" })}
            >
              Back to home
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

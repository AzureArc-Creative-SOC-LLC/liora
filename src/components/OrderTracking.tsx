import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "../hooks/useRouter";
import {
  ApiError,
  getOrderByNumber,
  type OrderDetailResponse,
} from "../lib/api";

/**
 * Public order-tracking page. Looks up a single order by its order number via
 * `GET /api/user-orders/:orderNumber` and renders its status, items, shipping
 * address, payment status and tracking number. No auth required (matching the
 * documented endpoint).
 *
 * Faithful to the API contract:
 *  - monetary fields arrive as strings ("49.99") — we never mutate them, only
 *    format at display time via `Number(...)` inside the formatter.
 *  - DB booleans come back as 1/0 — normalised with `toBool` where shown.
 *  - amounts are formatted using each order's own `currency` field.
 */

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "notfound" }
  | { kind: "error"; message: string; retriable: boolean }
  | { kind: "ok"; data: OrderDetailResponse };

// Canonical fulfilment flow used to render the timeline. The backend `status`
// column is free-form text; we map known values onto these steps and treat
// anything unrecognised as "pending".
const TIMELINE = ["pending", "processing", "completed"] as const;
type TimelineStep = (typeof TIMELINE)[number];

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  cancelled: "Cancelled",
  canceled: "Cancelled",
};

const labelFor = (raw: string | undefined): string => {
  if (!raw) return "Pending";
  return STATUS_LABEL[raw.toLowerCase()] ?? raw;
};

const normaliseStep = (raw: string | undefined): TimelineStep | "cancelled" => {
  const s = (raw ?? "pending").toLowerCase();
  if (s === "cancelled" || s === "canceled") return "cancelled";
  if (s === "completed" || s === "delivered" || s === "fulfilled")
    return "completed";
  if (
    s === "processing" ||
    s === "approved" ||
    s === "dispatched" ||
    s === "shipped" ||
    s === "paid"
  )
    return "processing";
  return "pending";
};

const formatMoney = (value: string | number | null | undefined, currency: string) => {
  const n = typeof value === "string" ? Number(value) : value ?? 0;
  const amount = Number.isFinite(n) ? (n as number) : 0;
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency || "GBP",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency || "GBP"} ${amount.toFixed(2)}`;
  }
};

const formatDate = (ts: string | number | null | undefined) => {
  if (ts === null || ts === undefined || ts === "") return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// DB booleans arrive as 1/0 (see API docs); normalise defensively.
const toBool = (v: unknown): boolean =>
  v === true || v === 1 || v === "1" || v === "true";

export function OrderTracking() {
  const { view, navigate } = useRouter();
  const deepLinked = view.name === "track" ? view.order ?? "" : "";

  const [input, setInput] = useState(deepLinked);
  // Start in the loading state when the page is deep-linked to an order, so the
  // first paint already shows the skeleton (no synchronous setState in effect).
  const [state, setState] = useState<State>(() =>
    deepLinked.trim() ? { kind: "loading" } : { kind: "idle" },
  );

  // Resolves an order and writes only the outcome state. Every setState happens
  // after `await`, so this is safe to call from an effect without triggering
  // cascading synchronous re-renders.
  const resolveOrder = useCallback(async (orderNumber: string) => {
    try {
      const data = await getOrderByNumber(orderNumber);
      setState({ kind: "ok", data });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setState({ kind: "notfound" });
      } else if (err instanceof ApiError && err.status === 0) {
        setState({
          kind: "error",
          retriable: true,
          message:
            "The service is unreachable. Please check your connection and try again.",
        });
      } else {
        setState({
          kind: "error",
          retriable: true,
          message:
            err instanceof ApiError
              ? err.message
              : "Could not load that order. Please try again.",
        });
      }
    }
  }, []);

  // Kicks off a search from a user action (submit/retry): shows loading
  // synchronously — allowed here because it runs in an event handler, not an
  // effect — then resolves.
  const runSearch = useCallback(
    (orderNumber: string) => {
      const trimmed = orderNumber.trim();
      if (!trimmed) {
        setState({
          kind: "error",
          retriable: false,
          message: "Please enter an order number.",
        });
        return;
      }
      setState({ kind: "loading" });
      void resolveOrder(trimmed);
    },
    [resolveOrder],
  );

  // Auto-run the lookup once when the page is opened with a deep-linked order
  // number (e.g. #/track/ORD-…). A ref guards against re-fetching when the
  // submit handler subsequently updates the URL to the same order.
  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current || !deepLinked.trim()) return;
    autoRan.current = true;
    void resolveOrder(deepLinked.trim());
  }, [deepLinked, resolveOrder]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    // Reflect the searched order in the URL so it's shareable/back-able.
    autoRan.current = true; // this search supersedes any pending auto-run
    navigate({ name: "track", order: trimmed || undefined });
    runSearch(trimmed);
  };

  const order = state.kind === "ok" ? state.data.order : null;
  const items = state.kind === "ok" ? state.data.items : [];
  const payments = state.kind === "ok" ? state.data.payments : [];

  const currency =
    (order?.currency as string | undefined)?.trim() || "GBP";

  const step = normaliseStep(order?.status as string | undefined);
  const cancelled = step === "cancelled";
  const stepIdx = cancelled ? -1 : TIMELINE.indexOf(step as TimelineStep);
  const progress =
    cancelled || stepIdx < 0
      ? 0
      : ((stepIdx + 1) / TIMELINE.length) * 100;

  return (
    <section className="container track">
      <header className="track__head">
        <span className="mono eyebrow">Order tracking</span>
        <h1 className="track__title">Track your order</h1>
        <p className="track__lede">
          Enter your order reference to see its current status and details.
        </p>
      </header>

      <form className="track__form" onSubmit={onSubmit} noValidate>
        <div className="field track__field">
          <label htmlFor="track-order">Order number</label>
          <input
            id="track-order"
            className="track__input"
            placeholder="ORD-20250101-120000000-ABC123"
            value={input}
            autoComplete="off"
            spellCheck={false}
            onChange={(e) => setInput(e.target.value)}
            aria-invalid={state.kind === "error"}
          />
        </div>
        <button
          type="submit"
          className="btn btn--primary track__submit"
          disabled={state.kind === "loading"}
          data-cursor
        >
          {state.kind === "loading" ? "Searching…" : "Track order"}
        </button>
      </form>

      {state.kind === "loading" && (
        <div className="track__result" aria-live="polite">
          <div className="track__skeleton" aria-hidden>
            <span className="track__skeleton-line" />
            <span className="track__skeleton-line track__skeleton-line--short" />
            <span className="track__skeleton-line" />
          </div>
          <p className="mono track__hint">Looking up your order…</p>
        </div>
      )}

      {state.kind === "notfound" && (
        <div className="account-empty track__empty" aria-live="polite">
          <div className="account-empty__icon" aria-hidden>
            <svg viewBox="0 0 48 48" fill="none">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="1.5"
                opacity="0.4"
              />
              <path
                d="M18 18l12 12M30 18L18 30"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h3 className="account-empty__title">Order not found</h3>
          <p className="account-empty__text">
            We couldn't find an order with that reference. Double-check the
            number from your confirmation email and try again.
          </p>
        </div>
      )}

      {state.kind === "error" && (
        <div className="track__result" aria-live="assertive">
          <p className="account__error mono track__error">{state.message}</p>
          {state.retriable && (
            <button
              type="button"
              className="account-btn account-btn--ghost account-btn--sm"
              onClick={() => runSearch(input)}
              data-cursor
            >
              Retry
            </button>
          )}
        </div>
      )}

      {state.kind === "ok" && order && (
        <div className="order-cards track__result">
          <article className="order-card">
            <header className="order-card__head">
              <div className="order-card__ref">
                <span className="mono eyebrow">Order</span>
                <span className="order-card__ref-value">
                  {order.order_number}
                </span>
                <span className="order-card__placed mono">
                  Placed {formatDate(order.created_at)}
                </span>
              </div>
              <div className="order-card__total">
                <span className="mono eyebrow">Total</span>
                <span className="order-card__total-value">
                  {formatMoney(order.total, currency)}
                </span>
              </div>
            </header>

            {/* Status timeline */}
            <div className="order-card__progress">
              <div className="order-card__progress-head">
                <span className="mono eyebrow">Fulfilment</span>
                <span className="order-card__progress-current mono">
                  {labelFor(order.status as string | undefined)}
                </span>
              </div>
              {cancelled ? (
                <p className="track__cancelled mono">
                  This order has been cancelled.
                </p>
              ) : (
                <>
                  <div className="order-card__progress-track" aria-hidden>
                    <div
                      className="order-card__progress-fill"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <ol className="order-card__steps">
                    {TIMELINE.map((s, i) => (
                      <li
                        key={s}
                        className={
                          "order-card__step" +
                          (i <= stepIdx ? " is-done" : "") +
                          (i === stepIdx ? " is-current" : "")
                        }
                      >
                        <span className="order-card__step-dot" aria-hidden />
                        <span className="mono">{STATUS_LABEL[s]}</span>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </div>

            {/* Key facts */}
            <dl className="track__meta">
              <div>
                <dt className="mono">Payment status</dt>
                <dd>{labelFor(order.payment_status as string | undefined)}</dd>
              </div>
              <div>
                <dt className="mono">Payment method</dt>
                <dd>{(order.payment_method as string | undefined) || "—"}</dd>
              </div>
              <div>
                <dt className="mono">Tracking number</dt>
                <dd className="mono">
                  {(order.tracking_number as string | null | undefined) || "—"}
                </dd>
              </div>
              <div>
                <dt className="mono">Promo</dt>
                <dd className="mono">
                  {toBool(order.promo_valid) && order.promo_code
                    ? String(order.promo_code)
                    : "—"}
                </dd>
              </div>
            </dl>

            {/* Purchased products */}
            {items.length > 0 && (
              <ul className="order-card__items">
                {items.map((it) => (
                  <li key={it.id} className="order-card__item">
                    <div>
                      <span className="order-card__item-name">{it.name}</span>
                      <span className="mono order-card__item-qty">
                        × {it.quantity}
                      </span>
                    </div>
                    <span className="order-card__item-price">
                      {formatMoney(it.line_total, currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {/* Customer & shipping */}
            <div className="track__cols">
              <div className="track__col">
                <span className="mono eyebrow">Customer</span>
                <p className="track__addr">
                  {(order.customer_name as string | undefined) || "—"}
                  <br />
                  <span className="mono">{order.customer_email}</span>
                  {order.customer_phone ? (
                    <>
                      <br />
                      <span className="mono">
                        {String(order.customer_phone)}
                      </span>
                    </>
                  ) : null}
                </p>
              </div>
              <div className="track__col">
                <span className="mono eyebrow">Address</span>
                <p className="track__addr">
                  {[
                    order.shipping_address,
                    order.shipping_city,
                    order.shipping_zip,
                    order.shipping_country,
                  ]
                    .filter(Boolean)
                    .map((part, i) => (
                      <span key={i}>
                        {String(part)}
                        <br />
                      </span>
                    ))}
                </p>
              </div>
            </div>

            {/* Payments */}
            {payments.length > 0 && (
              <div className="track__payments">
                <span className="mono eyebrow">Payments</span>
                <ul className="track__payments-list">
                  {payments.map((pay) => (
                    <li key={pay.id} className="track__payment">
                      <span className="mono">{pay.provider}</span>
                      <span>{labelFor(pay.status)}</span>
                      <span className="order-card__item-price">
                        {formatMoney(pay.amount, pay.currency || currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </article>
        </div>
      )}

      <div className="track__foot">
        <button
          type="button"
          className="account-btn account-btn--ghost"
          onClick={() => navigate({ name: "home" })}
          data-cursor
        >
          Back to home
        </button>
      </div>
    </section>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useAuth, type OrderStatus } from "../hooks/useAuth";
import { useRouter } from "../hooks/useRouter";
import {
  ApiError,
  getAffiliateDashboard,
  getAffiliateStatus,
  getOrderByNumber,
  getOrdersByEmail,
  getWallet,
  requestAffiliate,
  type AffiliateDashboardResponse,
  type AffiliateStatusResponse,
  type ApiOrderRow,
  type OrderDetailResponse,
  type WalletResponse,
} from "../lib/api";

const formatUsd = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const formatGbp = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(n);

const formatDate = (ts: number | string) => {
  const d = typeof ts === "number" ? new Date(ts) : new Date(ts);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const STATUS_ORDER: OrderStatus[] = [
  "clinician review",
  "approved",
  "dispensing",
  "dispatched",
  "delivered",
];

const STATUS_LABEL: Record<OrderStatus, string> = {
  "clinician review": "Clinician review",
  approved: "Approved",
  dispensing: "Dispensing",
  dispatched: "Dispatched",
  delivered: "Delivered",
};

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("");

export function AccountPage() {
  const { account, logout, advanceOrderStatus } = useAuth();
  const { navigate } = useRouter();

  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [affStatus, setAffStatus] = useState<AffiliateStatusResponse | null>(
    null,
  );
  const [affDash, setAffDash] = useState<AffiliateDashboardResponse | null>(
    null,
  );
  const [affError, setAffError] = useState<string | null>(null);
  const [remoteOrders, setRemoteOrders] = useState<ApiOrderRow[]>([]);
  const [remoteOrdersError, setRemoteOrdersError] = useState<string | null>(
    null,
  );
  type DetailState =
    | { kind: "loading" }
    | { kind: "ok"; data: OrderDetailResponse }
    | { kind: "error"; error: string };
  const [orderDetails, setOrderDetails] = useState<Record<string, DetailState>>(
    {},
  );

  const [showAffiliateForm, setShowAffiliateForm] = useState(false);
  const [affFirst, setAffFirst] = useState("");
  const [affLast, setAffLast] = useState("");
  const [affTiktok, setAffTiktok] = useState("");
  const [affSubmitting, setAffSubmitting] = useState(false);
  const [affFormError, setAffFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!account) return;
    let cancelled = false;

    getWallet()
      .then((res) => {
        if (!cancelled) setWallet(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setWalletError(
            err instanceof ApiError ? err.message : "Could not load wallet.",
          );
        }
      });

    getAffiliateStatus()
      .then((res) => {
        if (!cancelled) setAffStatus(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setAffError(
            err instanceof ApiError
              ? err.message
              : "Could not load affiliate status.",
          );
        }
      });

    getAffiliateDashboard()
      .then((res) => {
        if (!cancelled) setAffDash(res);
      })
      .catch(() => {
        // dashboard failure is non-fatal
      });

    getOrdersByEmail(account.email)
      .then((res) => {
        if (!cancelled) setRemoteOrders(res.orders ?? []);
      })
      .catch((err) => {
        if (!cancelled) {
          setRemoteOrdersError(
            err instanceof ApiError
              ? err.message
              : "Could not load remote orders.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [account]);

  const stats = useMemo(() => {
    if (!account) return null;
    const totalOrders = account.orders.length;
    const totalSpent = account.orders.reduce((s, o) => s + o.total, 0);
    const active = account.orders.filter((o) => o.status !== "delivered").length;
    return { totalOrders, totalSpent, active };
  }, [account]);

  const toggleOrderDetail = async (orderNumber: string) => {
    setOrderDetails((prev) => {
      if (prev[orderNumber]) {
        const { [orderNumber]: _drop, ...rest } = prev;
        void _drop;
        return rest;
      }
      return { ...prev, [orderNumber]: { kind: "loading" } };
    });
    // Only fetch when we just added the loading entry (previously absent).
    if (orderDetails[orderNumber]) return;
    try {
      const data = await getOrderByNumber(orderNumber);
      setOrderDetails((prev) => ({
        ...prev,
        [orderNumber]: { kind: "ok", data },
      }));
    } catch (err) {
      setOrderDetails((prev) => ({
        ...prev,
        [orderNumber]: {
          kind: "error",
          error:
            err instanceof ApiError
              ? err.message
              : "Could not load order detail.",
        },
      }));
    }
  };

  const browseTreatments = () => {
    navigate({ name: "home" });
    window.setTimeout(() => {
      const el = document.querySelector("#work");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 120);
  };

  const submitAffiliateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setAffFormError(null);
    if (!affFirst.trim() || !affLast.trim() || !affTiktok.trim()) {
      setAffFormError("Please fill every field.");
      return;
    }
    setAffSubmitting(true);
    try {
      const res = await requestAffiliate({
        first_name: affFirst.trim(),
        last_name: affLast.trim(),
        tiktok_link: affTiktok.trim(),
      });
      setAffStatus({
        ok: true,
        hasRequest: true,
        request: {
          id: 0,
          status: res.status,
          promo_code: res.promo_code,
          promo_percent: res.promo_percent,
          created_at: new Date().toISOString(),
          decided_at: null,
        },
      });
      // refresh dashboard in case we're now an affiliate
      try {
        setAffDash(await getAffiliateDashboard());
      } catch {
        // ignore
      }
      setShowAffiliateForm(false);
    } catch (err) {
      setAffFormError(
        err instanceof ApiError ? err.message : "Could not submit request.",
      );
    } finally {
      setAffSubmitting(false);
    }
  };

  if (!account) {
    return (
      <section className="container account account--signin">
        <div className="account-signin-card">
          <span className="mono eyebrow">Account</span>
          <h1 className="account__title">Please sign in</h1>
          <p className="account__lede">
            Sign in to view your orders, treatment history and account details.
          </p>
          <div className="account-signin-actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => navigate({ name: "login" })}
              data-cursor
            >
              Sign in or create account
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => navigate({ name: "home" })}
              data-cursor
            >
              Back to home
            </button>
          </div>
        </div>
      </section>
    );
  }

  const affiliateIsActive =
    affDash && affDash.ok && affDash.is_affiliate ? affDash : null;

  return (
    <section className="container account account--modern">
      <div className="account-hero">
        <div className="account-hero__inner">
          <div className="account-hero__avatar" aria-hidden>
            {getInitials(account.fullName) || "L"}
          </div>
          <div className="account-hero__text">
            <span className="mono eyebrow">Welcome back</span>
            <h1 className="account-hero__title">{account.fullName}</h1>
            <p className="account-hero__sub mono">{account.email}</p>
          </div>
          <div className="account-hero__actions">
            <button
              type="button"
              className="account-btn account-btn--ghost"
              onClick={browseTreatments}
              data-cursor
            >
              Browse treatments
            </button>
            <button
              type="button"
              className="account-btn account-btn--danger"
              onClick={() => {
                logout();
                navigate({ name: "home" });
              }}
              data-cursor
            >
              Log out
            </button>
          </div>
        </div>
      </div>

      {stats && (
        <div className="account-stats">
          <div className="account-stat">
            <span className="account-stat__label mono">Total orders</span>
            <span className="account-stat__value">{stats.totalOrders}</span>
          </div>
          <div className="account-stat">
            <span className="account-stat__label mono">Active</span>
            <span className="account-stat__value">{stats.active}</span>
          </div>
          <div className="account-stat">
            <span className="account-stat__label mono">Lifetime spend</span>
            <span className="account-stat__value">
              {formatUsd(stats.totalSpent)}
            </span>
          </div>
          <div className="account-stat">
            <span className="account-stat__label mono">Wallet</span>
            <span className="account-stat__value">
              {wallet ? formatGbp(wallet.balance) : walletError ? "—" : "…"}
            </span>
          </div>
        </div>
      )}

      <div className="account-orders">
        <header className="account-orders__head">
          <div>
            <span className="mono eyebrow">Wallet & rewards</span>
            <h2 className="account-orders__title">Store credit</h2>
          </div>
        </header>
        {walletError ? (
          <p className="account__error mono">{walletError}</p>
        ) : wallet ? (
          <div className="account-wallet">
            <p className="account-wallet__balance">
              Balance <strong>{formatGbp(wallet.balance)}</strong>
            </p>
            {wallet.ledger.length > 0 ? (
              <ul className="account-wallet__ledger">
                {wallet.ledger.slice(0, 5).map((entry, i) => (
                  <li key={`${entry.created_at}-${i}`}>
                    <span className="mono">{formatDate(entry.created_at)}</span>
                    <span>{entry.note ?? entry.source}</span>
                    <span>
                      {entry.amount >= 0 ? "+" : ""}
                      {formatGbp(entry.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mono">No wallet activity yet.</p>
            )}
          </div>
        ) : (
          <p className="mono">Loading wallet…</p>
        )}
      </div>

      <div className="account-orders">
        <header className="account-orders__head">
          <div>
            <span className="mono eyebrow">Affiliate</span>
            <h2 className="account-orders__title">Refer & earn</h2>
          </div>
        </header>
        {affError ? (
          <p className="account__error mono">{affError}</p>
        ) : affiliateIsActive ? (
          <div className="account-affiliate">
            <p>
              You're an affiliate. Share code{" "}
              <strong className="mono">{affiliateIsActive.promo_code}</strong>{" "}
              for {affiliateIsActive.promo_percent}% off — earn{" "}
              {formatGbp(affiliateIsActive.reward_amount)} per order.
            </p>
            <dl className="account-affiliate__stats">
              <div>
                <dt className="mono">Total earned</dt>
                <dd>{formatGbp(affiliateIsActive.total_earned)}</dd>
              </div>
              <div>
                <dt className="mono">Customers</dt>
                <dd>{affiliateIsActive.unique_customers}</dd>
              </div>
              <div>
                <dt className="mono">Wallet balance</dt>
                <dd>{formatGbp(affiliateIsActive.wallet_balance)}</dd>
              </div>
            </dl>
          </div>
        ) : affStatus && affStatus.hasRequest ? (
          <p className="mono">
            Request status: <strong>{affStatus.request.status}</strong> · code{" "}
            <span className="mono">{affStatus.request.promo_code}</span>
          </p>
        ) : showAffiliateForm ? (
          <form className="auth__form" onSubmit={submitAffiliateRequest}>
            <div className="field-row">
              <div className="field">
                <label htmlFor="af-first">First name</label>
                <input
                  id="af-first"
                  value={affFirst}
                  onChange={(e) => setAffFirst(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="af-last">Last name</label>
                <input
                  id="af-last"
                  value={affLast}
                  onChange={(e) => setAffLast(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="af-tt">TikTok link or handle</label>
              <input
                id="af-tt"
                placeholder="@handle or tiktok.com/@you"
                value={affTiktok}
                onChange={(e) => setAffTiktok(e.target.value)}
                required
              />
            </div>
            {affFormError && <p className="auth__error">{affFormError}</p>}
            <div className="account-signin-actions">
              <button
                type="submit"
                className="btn btn--primary"
                disabled={affSubmitting}
              >
                {affSubmitting ? "Submitting…" : "Request affiliate"}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setShowAffiliateForm(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div>
            <p>Become an affiliate — earn store credit on every referral.</p>
            <button
              type="button"
              className="account-btn account-btn--primary"
              onClick={() => setShowAffiliateForm(true)}
            >
              Become an affiliate
            </button>
          </div>
        )}
      </div>

      <div className="account-orders">
        <header className="account-orders__head">
          <div>
            <span className="mono eyebrow">Order history</span>
            <h2 className="account-orders__title">Your orders</h2>
          </div>
          <button
            type="button"
            className="account-btn account-btn--ghost"
            onClick={browseTreatments}
            data-cursor
          >
            New order
          </button>
        </header>

        {remoteOrdersError && (
          <p className="account__error mono">{remoteOrdersError}</p>
        )}
        {remoteOrders.length > 0 && (
          <ul className="account-remote-orders">
            {remoteOrders.slice(0, 10).map((row) => {
              const detail = orderDetails[row.order_number];
              const isOpen = !!detail;
              return (
                <li key={row.id} className="account-remote-order">
                  <div className="account-remote-order__row">
                    <span className="mono">{row.order_number}</span>
                    <span>{row.status ?? "pending"}</span>
                    <span>{row.payment_status ?? "—"}</span>
                    <span>
                      {row.total !== undefined
                        ? formatGbp(Number(row.total))
                        : "—"}
                    </span>
                    <span className="mono">
                      {row.created_at ? formatDate(row.created_at) : ""}
                    </span>
                    <button
                      type="button"
                      className="account-btn account-btn--ghost account-btn--sm"
                      onClick={() => toggleOrderDetail(row.order_number)}
                    >
                      {isOpen ? "Hide" : "Details"}
                    </button>
                  </div>
                  {detail?.kind === "loading" && (
                    <p className="mono">Loading details…</p>
                  )}
                  {detail?.kind === "error" && (
                    <p className="account__error mono">{detail.error}</p>
                  )}
                  {detail?.kind === "ok" && (
                    <div className="account-remote-order__detail">
                      <ul className="account-remote-order__items">
                        {detail.data.items.map((it) => (
                          <li key={it.id}>
                            <span>{it.name}</span>
                            <span className="mono">× {it.quantity}</span>
                            <span>{formatGbp(Number(it.line_total))}</span>
                          </li>
                        ))}
                      </ul>
                      {detail.data.payments.length > 0 && (
                        <ul className="account-remote-order__payments">
                          {detail.data.payments.map((pay) => (
                            <li key={pay.id}>
                              <span className="mono">{pay.provider}</span>
                              <span>{pay.status}</span>
                              <span>
                                {formatGbp(Number(pay.amount))} {pay.currency}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {account.orders.length === 0 ? (
          <div className="account-empty">
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
                  d="M16 22h16M16 27h10"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h3 className="account-empty__title">No local orders yet</h3>
            <p className="account-empty__text">
              Explore our research-grade catalogue to place your first order.
            </p>
            <button
              type="button"
              className="account-btn account-btn--primary"
              onClick={browseTreatments}
              data-cursor
            >
              Browse treatments
            </button>
          </div>
        ) : (
          <ul className="order-cards">
            {account.orders.map((order) => {
              const stepIdx = STATUS_ORDER.indexOf(order.status);
              const progress =
                stepIdx >= 0
                  ? ((stepIdx + 1) / STATUS_ORDER.length) * 100
                  : 0;
              return (
                <li key={order.ref} className="order-card">
                  <header className="order-card__head">
                    <div className="order-card__ref">
                      <span className="mono eyebrow">Order</span>
                      <span className="order-card__ref-value">
                        {order.ref}
                      </span>
                      <span className="order-card__placed mono">
                        Placed {formatDate(order.placedAt)}
                      </span>
                    </div>
                    <div className="order-card__total">
                      <span className="mono eyebrow">Total</span>
                      <span className="order-card__total-value">
                        {formatUsd(order.total)}
                      </span>
                    </div>
                  </header>

                  <ul className="order-card__items">
                    {order.items.map((it) => (
                      <li key={it.id} className="order-card__item">
                        <div>
                          <span className="order-card__item-name">
                            {it.title}
                          </span>
                          <span className="mono order-card__item-qty">
                            × {it.qty}
                          </span>
                        </div>
                        <span className="order-card__item-price">
                          {formatUsd(it.price * it.qty)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="order-card__shipping mono">
                    Address · {[order.address.city, order.address.country].filter(Boolean).join(", ")}
                  </div>

                  <div className="order-card__progress">
                    <div className="order-card__progress-head">
                      <span className="mono eyebrow">Fulfilment</span>
                      <span className="order-card__progress-current mono">
                        {STATUS_LABEL[order.status]}
                      </span>
                    </div>
                    <div className="order-card__progress-track" aria-hidden>
                      <div
                        className="order-card__progress-fill"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <ol className="order-card__steps">
                      {STATUS_ORDER.map((s, i) => (
                        <li
                          key={s}
                          className={
                            "order-card__step" +
                            (i <= stepIdx ? " is-done" : "") +
                            (i === stepIdx ? " is-current" : "")
                          }
                        >
                          <span
                            className="order-card__step-dot"
                            aria-hidden
                          />
                          <span className="mono">{STATUS_LABEL[s]}</span>
                        </li>
                      ))}
                    </ol>
                    {order.status !== "delivered" && (
                      <button
                        type="button"
                        className="account-btn account-btn--ghost account-btn--sm"
                        onClick={() => advanceOrderStatus(order.ref)}
                        data-cursor
                      >
                        Advance status (demo)
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

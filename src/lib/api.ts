export const API_BASE_URL =
  (import.meta.env?.VITE_API_BASE_URL as string | undefined) ??
  "https://www.microservices.tech";

const TOKEN_KEY = "liora.auth.token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const extractErrorMessage = (data: unknown, fallback: string): string => {
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.error === "string") return d.error;
    if (typeof d.message === "string") return d.message;
  }
  return fallback;
};

export async function apiFetch<T = unknown>(
  path: string,
  opts: FetchOptions = {},
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = { Accept: "application/json", ...opts.headers };

  let body: BodyInit | undefined;
  if (opts.body !== undefined) {
    if (opts.body instanceof FormData) {
      body = opts.body;
    } else {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(opts.body);
    }
  }

  if (opts.auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? (opts.body ? "POST" : "GET"),
      headers,
      body,
      signal: opts.signal,
      mode: "cors",
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(
      "Network error — the service is unreachable. Please check your connection or try again shortly.",
      0,
      err,
    );
  }

  let data: unknown = null;
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await res.text();
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    throw new ApiError(
      extractErrorMessage(data, `Request failed (${res.status})`),
      res.status,
      data,
    );
  }

  return data as T;
}

// ---------- Auth ----------

export type ApiUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  country_of_residence: string | null;
  role: string;
};

export type AuthResponse = { success: true; token: string; user: ApiUser };

export function authLogin(email: string, password: string) {
  return apiFetch<AuthResponse>("/api/auth/login", {
    body: { email, password },
  });
}

export function authRegister(input: {
  name: string;
  email: string;
  password: string;
  date_of_birth: string;
  nationality: string;
  country_of_residence: string;
}) {
  return apiFetch<AuthResponse>("/api/auth/register", { body: input });
}

export function authVerify() {
  return apiFetch<{ success: true; user: ApiUser }>("/api/auth/verify", {
    method: "GET",
    auth: true,
  });
}

export function authForgotPassword(email: string) {
  return apiFetch<{ success: true; message: string }>(
    "/api/auth/forgot-password",
    { body: { email } },
  );
}

export function authResetPassword(input: { token: string; password: string }) {
  return apiFetch<{ success: true; message: string }>(
    "/api/auth/reset-password",
    { body: input },
  );
}

// ---------- Wallet & affiliate ----------

export type WalletLedgerEntry = {
  amount: number;
  source: string;
  order_number: string | null;
  admin_username: string | null;
  note: string | null;
  created_at: string;
};

export type WalletResponse = {
  success: true;
  balance: number;
  ledger: WalletLedgerEntry[];
};

export function getWallet() {
  return apiFetch<WalletResponse>("/api/wallet", { method: "GET", auth: true });
}

export type AffiliateStatusResponse =
  | { ok: true; hasRequest: false }
  | {
      ok: true;
      hasRequest: true;
      request: {
        id: number;
        status: "pending" | "approved" | "rejected";
        promo_code: string;
        promo_percent: number;
        created_at: string;
        decided_at: string | null;
      };
    };

export function getAffiliateStatus() {
  return apiFetch<AffiliateStatusResponse>("/api/affiliate/status", {
    method: "GET",
    auth: true,
  });
}

export type AffiliateRequestInput = {
  first_name: string;
  last_name: string;
  tiktok_link: string;
};

export type AffiliateRequestResponse = {
  ok: true;
  approved?: boolean;
  alreadyRequested?: boolean;
  status: "pending" | "approved" | "rejected";
  promo_code: string;
  promo_percent: number;
  reward_amount: number;
};

export function requestAffiliate(input: AffiliateRequestInput) {
  return apiFetch<AffiliateRequestResponse>("/api/affiliate/request", {
    body: input,
    auth: true,
  });
}

export type AffiliateDashboardResponse =
  | { ok: true; is_affiliate: false }
  | {
      ok: true;
      is_affiliate: true;
      promo_code: string;
      promo_percent: number;
      reward_amount: number;
      status: string;
      first_name: string;
      last_name: string;
      tiktok_link: string;
      wallet_balance: number;
      total_earned: number;
      unique_customers: number;
      recent_redemptions: Array<{
        order_number: string;
        customer_email_masked: string;
        reward_amount: number;
        created_at: string;
      }>;
    };

export function getAffiliateDashboard() {
  return apiFetch<AffiliateDashboardResponse>("/api/affiliate/dashboard", {
    method: "GET",
    auth: true,
  });
}

// ---------- Klyme payments ----------

export type KlymeCreatePaymentInput = {
  orderId: string;
  amount: number;
  currency?: string;
};

export type KlymeCreatePaymentResponse =
  | {
      ok: true;
      paymentUuid: string;
      orderId: string;
      klymeEnv: string;
      paidByCredits?: false;
    }
  | { ok: true; paidByCredits: true; orderId: string; klymeEnv: string };

export function klymeCreatePayment(input: KlymeCreatePaymentInput) {
  return apiFetch<KlymeCreatePaymentResponse>("/api/klyme/create-payment", {
    body: input,
  });
}

export type KlymeVerifyPaymentResponse = {
  ok: true;
  session: {
    uuid: string;
    status: "success" | "failed" | "pending";
    orderId: number;
  };
  payment: {
    status: string;
    finalStatus: string;
    amount: string;
    currency: string;
  } | null;
  klyme: unknown;
};

export function klymeVerifyPayment(uuid: string) {
  return apiFetch<KlymeVerifyPaymentResponse>(
    `/api/klyme/verify-payment/${encodeURIComponent(uuid)}`,
    { method: "GET" },
  );
}

// ---------- AabanPay payments ----------

export type AabanpayCreatePaymentInput = {
  orderId: string;
  amount: number;
  currency?: string;
  returnUrl?: string;
  cancelUrl?: string;
};

export type AabanpayCreatePaymentResponse = {
  ok: true;
  sessionId: string;
  paymentUrl: string;
  orderId: string;
};

export function aabanpayCreatePayment(input: AabanpayCreatePaymentInput) {
  return apiFetch<AabanpayCreatePaymentResponse>(
    "/api/aabanpay/create-payment",
    { body: input },
  );
}

export type AabanpayVerifyPaymentResponse = {
  ok: true;
  session: {
    sessionId: string;
    status: "success" | "failed" | "pending";
    orderId: number;
  };
  payment: { status: string; finalStatus: string } | null;
  aabanpay: unknown;
};

export function aabanpayVerifyPayment(sessionId: string) {
  return apiFetch<AabanpayVerifyPaymentResponse>(
    `/api/aabanpay/verify-payment/${encodeURIComponent(sessionId)}`,
    { method: "GET" },
  );
}

// ---------- Products (Klyme availability) ----------

export type KlymeStatusResponse = {
  klyme_settings: Record<string, boolean>;
};

export function productsKlymeStatusByName(names: string[]) {
  return apiFetch<KlymeStatusResponse>(
    "/api/products/klyme-status-by-name",
    { body: { product_names: names } },
  );
}

// ---------- Promo ----------

export type PromoResponse = { ok: true; valid: true; percent: number };

export function validatePromo(code: string) {
  return apiFetch<PromoResponse>("/api/promos/validate", {
    body: { code },
  });
}

// ---------- Orders ----------

export type CentralOrderInput = {
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
  };
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    postcode: string;
    country: string;
  };
  promoCode?: string;
  items: Array<{ name: string; price: number; qty: number; productId?: string }>;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
};

export type CentralOrderResponse = {
  ok: true;
  success: true;
  orderNumber: string;
  orderId: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  totals: { subtotal: number; shipping: number; discount: number; total: number };
  message: string;
};

export function createCentralOrder(input: CentralOrderInput) {
  return apiFetch<CentralOrderResponse>("/api/central/orders", {
    body: input,
  });
}

// ---------- Orders (primary endpoint) ----------

export type PrimaryOrderItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  productId?: string;
  sku?: string;
};

export type PrimaryOrderInput = {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  city?: string;
  postcode?: string;
  country?: string;
  subtotal: number;
  total: number;
  discountAmount?: number;
  promoCode?: string;
  promoDiscount?: number;
  itemsArray: PrimaryOrderItem[];
  payment_method?: string;
};

export type PrimaryOrderResponse = {
  success: true;
  orderId: number;
  orderNumber: string;
  email_debug?: unknown;
};

export function createPrimaryOrder(input: PrimaryOrderInput) {
  const { itemsArray, ...rest } = input;
  return apiFetch<PrimaryOrderResponse>("/api/user-orders", {
    body: {
      ...rest,
      itemsArray: JSON.stringify(itemsArray),
      payment_method: input.payment_method ?? "manual",
    },
  });
}

export type ApiOrderRow = {
  id: number;
  order_number: string;
  customer_email: string;
  customer_name?: string;
  status?: string;
  payment_status?: string;
  total?: number | string;
  subtotal?: number | string;
  shipping?: number | string;
  discount?: number | string;
  created_at?: string;
  shipping_city?: string;
  shipping_country?: string;
  items?: unknown;
};

export function getOrdersByEmail(email: string) {
  const q = new URLSearchParams({ email }).toString();
  return apiFetch<{ orders: ApiOrderRow[] }>(
    `/api/user-orders/by-email?${q}`,
  );
}

// ---------- Newsletter ----------

export type NewsletterResponse = {
  ok: true;
  id?: number;
  already_subscribed?: boolean;
};

export function subscribeNewsletter(input: {
  email: string;
  consent?: boolean;
  source?: string;
  /** Honeypot — must stay empty for genuine submissions. */
  website?: string;
}) {
  return apiFetch<NewsletterResponse>("/api/newsletter/subscribe", {
    body: {
      email: input.email,
      consent: input.consent ?? true,
      source: input.source ?? "footer_newsletter",
      website: input.website ?? "",
    },
  });
}

export const API_BASE_URL =
  "https://www.microservices.tech"; // production
  // "http://localhost:5003"; // TESTING — local user-order-service

// liora is a static Vite SPA, not Next.js — it has no server-side API routes
// of its own. Order confirmation email is sent by a tiny companion server
// (see /server) that this frontend calls after the order is created; that
// server forwards to the shared order-confirmation email module. In
// production this is same-origin (nginx proxies /api/send-order-confirmation
// to the companion server); while testing it's a bare local port.
const EMAIL_BASE_URL =
  ""; // production (same-origin, proxied by nginx)
  // "http://localhost:4003"; // TESTING — local companion email server

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

  let data: unknown;
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

export function productsKlymeStatusById(ids: Array<number | string>) {
  return apiFetch<KlymeStatusResponse>("/api/products/klyme-status", {
    body: { product_ids: ids },
  });
}

export function productsKlymeStatusBySku(skus: string[]) {
  return apiFetch<KlymeStatusResponse>("/api/products/klyme-status-by-sku", {
    body: { product_skus: skus },
  });
}

// ---------- Promo ----------

export type PromoResponse = { ok: true; valid: true; percent: number };

export function validatePromo(code: string) {
  return apiFetch<PromoResponse>("/api/promos/validate", {
    body: { code },
  });
}

// ---------- Orders (primary endpoint) ----------

export type PrimaryOrderItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  productId?: string | number;
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

export type OrderEmailStep = {
  attempted: boolean;
  ok: boolean;
  error: string | null;
};

export type OrderEmailDebug = {
  paymentLinkCreated?: boolean;
  orderConfirmation?: OrderEmailStep;
  paymentCapture?: OrderEmailStep;
};

// Note: `orderId` in the response is the order-number string, not a numeric DB id — see docs.
export type PrimaryOrderResponse = {
  success: true;
  orderId: string;
  orderNumber: string;
  email_debug?: OrderEmailDebug;
};

export function createPrimaryOrder(input: PrimaryOrderInput) {
  const { itemsArray, ...rest } = input;
  return apiFetch<PrimaryOrderResponse>("/api/user-orders", {
    body: {
      ...rest,
      items: itemsArray,
      payment_method: input.payment_method ?? "manual",
    },
  });
}

// ---------- Order confirmation email (fallback fire-and-forget) ----------

export type SendOrderConfirmationInput = {
  orderNumber: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  postcode?: string;
  country?: string;
  subtotal: number;
  total: number;
  discountAmount?: number;
  promoCode?: string;
  items: PrimaryOrderItem[];
};

export type SendOrderConfirmationResponse = {
  success: boolean;
  ok?: boolean;
  message?: string;
  error?: string | null;
};

export function sendOrderConfirmation(input: SendOrderConfirmationInput) {
  return apiFetch<SendOrderConfirmationResponse>(
    "/api/send-order-confirmation",
    { body: input },
  );
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

export type ApiOrderItemRow = {
  id: number;
  order_id: number;
  product_id: number | null;
  name: string;
  sku: string | null;
  quantity: number;
  unit_price: string;
  line_total: string;
};

export type ApiPaymentRow = {
  id: number;
  order_id: number;
  user_id: number | null;
  provider: string;
  provider_id: string | null;
  amount: string;
  currency: string;
  status: string;
  webhook_received: 0 | 1;
  final_status: string | null;
  status_checked_at: string | null;
  bank_name: string | null;
  raw_response: unknown;
  created_at: string;
  updated_at: string | null;
};

export type OrderDetailResponse = {
  order: ApiOrderRow & Record<string, unknown>;
  items: ApiOrderItemRow[];
  payments: ApiPaymentRow[];
};

export function getOrderByNumber(orderNumber: string) {
  return apiFetch<OrderDetailResponse>(
    `/api/user-orders/${encodeURIComponent(orderNumber)}`,
  );
}

// ---------- Order confirmation email ----------

// Posts to this frontend's own companion server (server/index.js), which
// forwards to the shared order-confirmation email module. This is a
// different origin from API_BASE_URL — it never talks to the shared backend.
//
// `createPrimaryOrder`'s own response only carries {orderId, orderNumber,
// email_debug} — it doesn't echo back the persisted order. So the email is
// built from a fresh `getOrderByNumber` read (the order-creation API's own
// stored record) rather than local checkout form/cart state, so it reflects
// what was actually persisted server-side, not what the client guessed
// pre-submission.
//
// Never throws: a failed send should not block the checkout success flow,
// so failures are only logged.
export async function sendOrderConfirmationEmail(orderNumber: string): Promise<void> {
  try {
    const { order, items } = await getOrderByNumber(orderNumber);
    const o = order as ApiOrderRow & Record<string, unknown>;

    const customerName =
      (o.customer_name as string | undefined) || o.customer_email;
    const shippingAddress = [
      o.shipping_address as string | undefined,
      o.shipping_city as string | undefined,
      o.shipping_zip as string | undefined,
      o.shipping_country as string | undefined,
    ]
      .filter(Boolean)
      .join(", ");

    const res = await fetch(`${EMAIL_BASE_URL}/api/send-order-confirmation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: { name: customerName, email: o.customer_email },
        order: {
          orderNumber: o.order_number,
          currency: (o.currency as string | undefined) || "USD",
          items: items.map((it) => ({
            name: it.name,
            quantity: it.quantity,
            price: Number(it.unit_price),
          })),
          subtotal: Number(o.subtotal),
          shipping: Number(o.shipping) || 0,
          discount: Number((o.discount_amount as string | number | undefined) ?? 0),
          total: Number(o.total),
          shippingAddress,
        },
      }),
    });

    if (!res.ok) {
      console.error("[api] order confirmation email failed", {
        status: res.status,
        body: await res.text(),
      });
    }
  } catch (err) {
    console.error("[api] order confirmation email request failed", err);
  }
}

export type OrderUpdateInput = Partial<{
  status: string;
  payment_status: string;
  tracking_number: string;
}>;

export function updateOrder(orderNumber: string, input: OrderUpdateInput) {
  return apiFetch<{ success: true }>(
    `/api/user-orders/${encodeURIComponent(orderNumber)}`,
    { method: "PUT", body: input },
  );
}

export function deleteOrder(orderNumber: string) {
  return apiFetch<{ success: true }>(
    `/api/user-orders/${encodeURIComponent(orderNumber)}`,
    { method: "DELETE" },
  );
}

// ---------- Payment Capture (manual bank-transfer flow) ----------

export type PaymentCaptureValidateResponse = {
  ok: true;
  order: ApiOrderRow & Record<string, unknown>;
  items: ApiOrderItemRow[];
  payments: ApiPaymentRow[];
  allowPromo: boolean;
  bank: {
    payeeName: string;
    sortCode: string;
    accountNumber: string;
    reference: string;
  };
};

export function paymentCaptureValidate(token: string) {
  return apiFetch<PaymentCaptureValidateResponse>(
    "/api/payment-capture/validate",
    { body: { token } },
  );
}

export type PaymentCaptureApplyPromoResponse = {
  ok: true;
  promoCode: string;
  promoDiscountPercent: number;
  discountAmount: number;
  total: number;
};

export function paymentCaptureApplyPromo(input: {
  token: string;
  promoCode: string;
}) {
  return apiFetch<PaymentCaptureApplyPromoResponse>(
    "/api/payment-capture/apply-promo",
    { body: input },
  );
}

export type PaymentCaptureUploadResponse = {
  ok: true;
  screenshotUrl: string;
  screenshotFilename: string;
  verification: unknown | null;
  verification_error?: string;
  payment_status: "received" | "rejected" | "pending";
};

export function paymentCaptureUpload(token: string, file: File) {
  const form = new FormData();
  form.append("token", token);
  form.append("paymentScreenshot", file);
  return apiFetch<PaymentCaptureUploadResponse>(
    "/api/payment-capture/upload",
    { body: form },
  );
}

// ---------- AabanPay direct card charge ----------

export type AabanpayCardType = "visa" | "mastercard" | "amex" | "discover";

export type AabanpayChargeInput = {
  orderId: string;
  cardNumber: string;
  cardType: AabanpayCardType;
  expMonth: string;
  expYear: string;
  cvv: string;
};

export type AabanpayChargeResponse =
  | {
      ok: true;
      status: "APPROVED";
      transactionId: string;
      descriptor: string;
    }
  | {
      ok: true;
      status: "3DS";
      transactionId: string;
      descriptor: string;
      threeDsUrl: string;
    };

export function aabanpayCharge(input: AabanpayChargeInput) {
  return apiFetch<AabanpayChargeResponse>(
    "/api/user-orders/aabanpay/charge",
    { body: input },
  );
}

// ---------- Spot-a-fake / verify-product / train-model uploads ----------

export type SpotAFakeSubmission = {
  id: number;
  submission_id: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  location_timestamp: number | null;
  user_agent: string | null;
  image_paths: string[];
  ip_address: string | null;
  created_at: string;
};

export function listSpotAFakeSubmissions() {
  return apiFetch<{ submissions: SpotAFakeSubmission[] }>(
    "/api/user-orders/spot-a-fake/submissions",
    { method: "GET" },
  );
}

export type SpotAFakeSubmitInput = {
  latitude: number | string;
  longitude: number | string;
  accuracy?: number | string;
  timestamp?: number | string;
  userAgent?: string;
  existingSubmissionId?: string;
  images?: File[];
};

export function submitSpotAFake(input: SpotAFakeSubmitInput) {
  const form = new FormData();
  form.append("latitude", String(input.latitude));
  form.append("longitude", String(input.longitude));
  if (input.accuracy !== undefined) form.append("accuracy", String(input.accuracy));
  if (input.timestamp !== undefined) form.append("timestamp", String(input.timestamp));
  if (input.userAgent) form.append("userAgent", input.userAgent);
  if (input.existingSubmissionId)
    form.append("existingSubmissionId", input.existingSubmissionId);
  for (const image of input.images ?? []) form.append("images", image);
  return apiFetch<{ success: true; submissionId: string }>(
    "/api/user-orders/spot-a-fake/submit",
    { body: form },
  );
}

export function trainModelUpload(input: {
  photos: File[];
  email?: string;
  userAgent?: string;
}) {
  const form = new FormData();
  for (const p of input.photos) form.append("photos", p);
  if (input.email) form.append("email", input.email);
  if (input.userAgent) form.append("userAgent", input.userAgent);
  return apiFetch<{ success: true; sessionId: string; count: number }>(
    "/api/user-orders/train-model/upload",
    { body: form },
  );
}

export function verifyProductUpload(input: {
  photo: File;
  email?: string;
  userAgent?: string;
  latitude?: number | string;
  longitude?: number | string;
  accuracy?: number | string;
  locationTimestamp?: number | string;
}) {
  const form = new FormData();
  form.append("photo", input.photo);
  if (input.email) form.append("email", input.email);
  if (input.userAgent) form.append("userAgent", input.userAgent);
  if (input.latitude !== undefined) form.append("latitude", String(input.latitude));
  if (input.longitude !== undefined) form.append("longitude", String(input.longitude));
  if (input.accuracy !== undefined) form.append("accuracy", String(input.accuracy));
  if (input.locationTimestamp !== undefined)
    form.append("locationTimestamp", String(input.locationTimestamp));
  return apiFetch<{ success: true; submissionId: string }>(
    "/api/user-orders/verify-product/upload",
    { body: form },
  );
}

export type VerifyProductSubmission = {
  id: number;
  submission_id: string;
  email: string | null;
  image_filename: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  location_timestamp: number | null;
  user_agent: string | null;
  ip_address: string | null;
  created_at: string;
};

export function listVerifyProductSubmissions() {
  return apiFetch<{ submissions: VerifyProductSubmission[] }>(
    "/api/user-orders/verify-product/submissions",
    { method: "GET" },
  );
}

// ---------- Browser fingerprint ----------

export type FingerprintPayload = Partial<{
  os: string;
  osVersion: string;
  browser: string;
  browserVersion: string;
  isMobile: boolean;
  isTablet: boolean;
  screenWidth: number;
  screenHeight: number;
  screenColorDepth: number;
  devicePixelRatio: number;
  cpuCores: number;
  deviceMemory: number;
  maxTouchPoints: number;
  timezone: string;
  timezoneOffset: number;
  language: string;
  languages: string;
  connectionType: string;
  gpuVendor: string;
  gpuRenderer: string;
  canvasHash: string;
  cookiesEnabled: boolean;
  doNotTrack: string;
  batteryLevel: number;
  batteryCharging: boolean;
  audioInputs: number;
  audioOutputs: number;
  videoInputs: number;
  userAgent: string;
  platform: string;
  vendor: string;
  referrer: string;
  pageUrl: string;
  webdriver: boolean;
}> &
  Record<string, unknown>;

export function collectFingerprint(payload: FingerprintPayload) {
  return apiFetch<{ ok: true }>(
    "/api/user-orders/fingerprint/collect",
    { body: payload },
  );
}

export function listFingerprints() {
  return apiFetch<{ fingerprints: Array<Record<string, unknown>> }>(
    "/api/user-orders/fingerprint/list",
    { method: "GET" },
  );
}

// ---------- AI support chat ----------

export type AiChatHistoryEntry = {
  role: "user" | "assistant";
  text?: string;
  content?: string;
};

export type AiChatResponse = {
  reply: string;
  sources: Array<{ id: string; title: string }>;
  provider: "gemini" | "huggingface";
};

export function aiChat(input: { message: string; history?: AiChatHistoryEntry[] }) {
  return apiFetch<AiChatResponse>("/api/ai-chat", { body: input });
}

export function aiChatSuggestions() {
  return apiFetch<{ suggestions: string[] }>("/api/ai-chat/suggestions", {
    method: "GET",
  });
}

// ---------- Client IP / diagnostics ----------

export type ClientIpResponse = {
  ip: string;
  source: string;
  warning?: string;
  headers?: Record<string, string | null>;
};

export function getClientIp() {
  return apiFetch<ClientIpResponse>("/api/client-ip", { method: "GET" });
}

// ---------- Fengyu visitor-check CORS proxy ----------

export type FengyuCheckInput = {
  userAgent: string;
  visitUrl: string;
  timestamp: number;
  clientLanguage?: string;
  referer?: string;
};

export function fengyuCheck(input: FengyuCheckInput) {
  return apiFetch<unknown>("/api/user-orders/fengyu/check", { body: input });
}

// ---------- Health ----------

export type HealthResponse = {
  ok: boolean;
  service: string;
  db: "connected" | "disconnected";
  error?: string;
};

export function getHealth() {
  return apiFetch<HealthResponse>("/health", { method: "GET" });
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

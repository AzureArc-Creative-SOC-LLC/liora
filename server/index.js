// Tiny server-side endpoint for liora.
//
// liora is a static Vite SPA (not Next.js) — it has no server of its own, and
// sendOrderConfirmationEmail() must run server-side (it holds the Resend
// API key / SMTP password). This process is that server: it exposes one
// endpoint that the frontend calls right after the shared backend confirms
// an order, and it forwards the request to the shared-email module.
//
// The backend (user-order-service) is unchanged and still creates the
// order; it just returns the order response. This service only sends the
// per-brand confirmation email for liora.

import express from 'express';
// Path depth depends on where this file lives relative to /var/www/. On the
// VPS, sites are deployed flat as /var/www/<site>/, sibling to
// /var/www/shared-email/, so this needs exactly 2 levels up
// (server/ -> liora/ -> /var/www/) before descending into shared-email/.
import { sendOrderConfirmationEmail } from '../../shared-email/order-email.js';

const PORT = Number(process.env.PORT) || 4003;
const BRAND_DOMAIN = process.env.BRAND_DOMAIN || 'liorahealthcare.com';
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://liorahealthcare.com,http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();
app.use(express.json({ limit: '100kb' }));

// Minimal CORS: only the frontend's own origins may call this from a
// browser. In production this endpoint is typically proxied same-origin
// through nginx, so this mainly matters for local dev (Vite on :5173).
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.post('/api/send-order-confirmation', async (req, res) => {
  const { customer, order } = req.body || {};
  console.log('[liora-email-server] request received', {
    to: customer?.email,
    orderNumber: order?.orderNumber,
  });

  if (!customer?.email || !customer?.name) {
    console.warn('[liora-email-server] rejected: missing customer.name/email');
    return res.status(400).json({ success: false, error: '"customer.name" and "customer.email" are required.' });
  }
  if (!order?.orderNumber || !Array.isArray(order?.items)) {
    console.warn('[liora-email-server] rejected: missing order.orderNumber/items');
    return res.status(400).json({ success: false, error: '"order.orderNumber" and "order.items" are required.' });
  }

  // Domain is fixed to this frontend's own brand rather than taken from the
  // request — otherwise a caller could pass an arbitrary domain and send
  // mail under a different brand's letterhead through this endpoint.
  const result = await sendOrderConfirmationEmail({ domain: BRAND_DOMAIN, customer, order });
  console.log('[liora-email-server] result', result);

  res.status(result.success ? 200 : 502).json(result);
});

app.listen(PORT, () => {
  console.log(`[liora-email-server] listening on :${PORT} (brand domain: ${BRAND_DOMAIN})`);
});

import type { Checkout, MerchantProfile, PaymentInstrument } from './types';

const BASE = '/api';

function headers(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Request-Signature': 'test',
    'Idempotency-Key': crypto.randomUUID(),
    'Request-Id': crypto.randomUUID(),
    'UCP-Agent': 'profile="http://localhost:5173/profile"',
  };
}

export async function fetchMerchantProfile(): Promise<MerchantProfile> {
  const res = await fetch(`${BASE}/.well-known/ucp`);
  if (!res.ok) throw new Error('Failed to fetch merchant profile');
  return res.json();
}

export async function createCheckout(
  productId: string,
  title: string,
  quantity: number,
  paymentHandlers: MerchantProfile['payment']['handlers'],
): Promise<Checkout> {
  const res = await fetch(`${BASE}/checkout-sessions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      line_items: [{ item: { id: productId, title }, quantity }],
      buyer: { full_name: 'John Doe', email: 'john.doe@example.com' },
      currency: 'USD',
      payment: { instruments: [], handlers: paymentHandlers },
    }),
  });
  if (!res.ok) throw new Error('Failed to create checkout');
  return res.json();
}

export async function updateCheckout(
  checkoutId: string,
  body: Record<string, unknown>,
): Promise<Checkout> {
  const res = await fetch(`${BASE}/checkout-sessions/${checkoutId}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? 'Failed to update checkout');
  }
  return res.json();
}

export async function completeCheckout(
  checkoutId: string,
  instrument: PaymentInstrument,
): Promise<Checkout> {
  const res = await fetch(`${BASE}/checkout-sessions/${checkoutId}/complete`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      payment_data: instrument,
      risk_signals: { ip: '127.0.0.1', browser: 'chrome' },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? 'Payment failed');
  }
  return res.json();
}

export async function cancelCheckout(checkoutId: string): Promise<void> {
  await fetch(`${BASE}/checkout-sessions/${checkoutId}/cancel`, {
    method: 'POST',
    headers: headers(),
  });
}

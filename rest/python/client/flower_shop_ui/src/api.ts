import type { Checkout, MerchantProfile, PaymentInstrument } from './types';

const BASE = '/api';

function parseError(err: unknown, fallback: string): string {
  if (typeof err !== 'object' || err === null) return fallback;
  const detail = (err as Record<string, unknown>).detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as Record<string, unknown>;
    return `${first.msg ?? fallback}: ${(first.loc as string[] | undefined)?.join('.') ?? ''}`;
  }
  return fallback;
}

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
  const res = await fetch(`${BASE}/.well-known/ucp`, { headers: headers() });
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
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseError(err, 'Failed to create checkout'));
  }
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
    throw new Error(parseError(err, 'Failed to update checkout'));
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
    throw new Error(parseError(err, 'Payment failed'));
  }
  return res.json();
}

export async function cancelCheckout(checkoutId: string): Promise<void> {
  await fetch(`${BASE}/checkout-sessions/${checkoutId}/cancel`, {
    method: 'POST',
    headers: headers(),
  });
}

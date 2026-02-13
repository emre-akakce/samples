import { useState } from 'react';
import type { Checkout, PaymentInstrument } from '../types';
import { formatCents } from '../types';

interface Props {
  checkout: Checkout;
  onPay: (instrument: PaymentInstrument) => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
}

export function PaymentForm({ checkout, onPay, onBack, loading, error }: Props) {
  const instruments = checkout.payment?.instruments ?? [];
  const handlers = checkout.payment?.handlers ?? [];

  const [selectedId, setSelectedId] = useState<string>(instruments[0]?.id ?? '');

  const total = checkout.totals.find((t) => t.type === 'total')?.amount ?? 0;
  const subtotal = checkout.totals.find((t) => t.type === 'subtotal')?.amount ?? 0;
  const discount = checkout.totals.find((t) => t.type === 'discount')?.amount ?? 0;
  const shipping = checkout.totals.find((t) => t.type === 'fulfillment')?.amount ?? 0;

  function handlePay() {
    const instrument = instruments.find((i) => i.id === selectedId);
    if (instrument) onPay(instrument);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-gray-800">Payment</h2>

      {/* Order summary */}
      <div className="bg-gray-50 rounded-lg p-3 flex flex-col gap-1 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span><span>{formatCents(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span><span>-{formatCents(discount)}</span>
          </div>
        )}
        {shipping > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Shipping</span><span>{formatCents(shipping)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-gray-800 pt-1 border-t border-gray-200">
          <span>Total</span><span>{formatCents(total)}</span>
        </div>
      </div>

      {/* Payment handlers from UCP discovery */}
      {handlers.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-1">Accepted payment methods (from UCP profile):</p>
          <div className="flex gap-2 flex-wrap">
            {handlers.map((h) => (
              <span
                key={h.id}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
              >
                {h.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Saved instruments from UCP checkout response */}
      {instruments.length > 0 ? (
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">Select saved card:</p>
          <div className="flex flex-col gap-2">
            {instruments.map((instr) => {
              const isFail = (instr.credential?.token ?? '') === 'fail_token';
              return (
                <label
                  key={instr.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedId === instr.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="instrument"
                      value={instr.id}
                      checked={selectedId === instr.id}
                      onChange={() => setSelectedId(instr.id)}
                      disabled={loading}
                      className="accent-green-500"
                    />
                    <span className="text-sm text-gray-700">
                      {instr.brand} •••• {instr.last_digits}
                    </span>
                  </div>
                  {isFail && (
                    <span className="text-xs text-red-400 italic">test: will fail</span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">No saved payment instruments returned by server.</p>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          ← Back
        </button>
        <button
          onClick={handlePay}
          disabled={loading || !selectedId}
          className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Processing…' : `Pay ${formatCents(total)}`}
        </button>
      </div>
    </div>
  );
}

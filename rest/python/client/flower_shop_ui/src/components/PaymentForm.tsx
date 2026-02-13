import { useState } from 'react';
import type { Checkout, PaymentInstrument } from '../types';
import { formatCents } from '../types';

// Mock payment instruments matching test_data/flower_shop payment_instruments.csv
const MOCK_INSTRUMENTS: PaymentInstrument[] = [
  {
    id: 'instr_1',
    handler_id: 'mock_payment_handler',
    handler_name: 'dev.ucp.mock_payment',
    type: 'card',
    brand: 'Visa',
    last_digits: '1234',
    credential: { type: 'token', token: 'success_token' },
  },
  {
    id: 'instr_2',
    handler_id: 'mock_payment_handler',
    handler_name: 'dev.ucp.mock_payment',
    type: 'card',
    brand: 'Mastercard',
    last_digits: '5678',
    credential: { type: 'token', token: 'success_token' },
  },
  {
    id: 'instr_fail',
    handler_id: 'mock_payment_handler',
    handler_name: 'dev.ucp.mock_payment',
    type: 'card',
    brand: 'Visa',
    last_digits: '0000',
    credential: { type: 'token', token: 'fail_token' },
  },
];

interface Props {
  checkout: Checkout;
  onPay: (instrument: PaymentInstrument) => void;
  onBack: () => void;
  loading: boolean;
  error: string | null;
}

export function PaymentForm({ checkout, onPay, onBack, loading, error }: Props) {
  const [selectedId, setSelectedId] = useState<string>(MOCK_INSTRUMENTS[0].id);

  const total = checkout.totals.find((t) => t.type === 'total')?.amount ?? 0;
  const shipping = checkout.totals.find((t) => t.type === 'fulfillment')?.amount ?? 0;
  const subtotal = checkout.totals.find((t) => t.type === 'subtotal')?.amount ?? 0;
  const discount = checkout.totals.find((t) => t.type === 'discount')?.amount ?? 0;

  function handlePay() {
    const instrument = MOCK_INSTRUMENTS.find((i) => i.id === selectedId);
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

      {/* Card selector */}
      <div>
        <p className="text-sm font-medium text-gray-600 mb-2">Select payment method:</p>
        <div className="flex flex-col gap-2">
          {MOCK_INSTRUMENTS.map((instr) => {
            const isFail = instr.credential.token === 'fail_token';
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
          disabled={loading}
          className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          {loading ? 'Processing…' : `Pay ${formatCents(total)}`}
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import type { Checkout } from '../types';
import { formatCents } from '../types';

interface Props {
  checkout: Checkout;
  onApplyDiscount: (code: string) => void;
  onProceedToFulfillment: () => void;
  onCancel: () => void;
  loading: boolean;
}

export function Cart({ checkout, onApplyDiscount, onProceedToFulfillment, onCancel, loading }: Props) {
  const [discountInput, setDiscountInput] = useState('');

  const subtotal = checkout.totals.find((t) => t.type === 'subtotal')?.amount ?? 0;
  const discount = checkout.totals.find((t) => t.type === 'discount')?.amount ?? 0;
  const total = checkout.totals.find((t) => t.type === 'total')?.amount ?? 0;
  const appliedCodes = checkout.discounts?.codes ?? [];

  function handleDiscount() {
    if (discountInput.trim()) {
      onApplyDiscount(discountInput.trim().toUpperCase());
      setDiscountInput('');
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-gray-800">Your Cart</h2>

      {/* Line items */}
      <div className="flex flex-col gap-2">
        {checkout.line_items.map((item) => (
          <div key={item.id} className="flex justify-between items-center text-sm">
            <span className="text-gray-700">
              {item.item.title} × {item.quantity}
            </span>
            <span className="font-medium">{formatCents(item.item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <hr className="border-gray-100" />

      {/* Totals */}
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{formatCents(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount ({appliedCodes.join(', ')})</span>
            <span>-{formatCents(discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-gray-800 pt-1 border-t border-gray-100">
          <span>Total</span>
          <span>{formatCents(total)}</span>
        </div>
      </div>

      {/* Discount code input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={discountInput}
          onChange={(e) => setDiscountInput(e.target.value)}
          placeholder="Discount code (e.g. 10OFF)"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          onKeyDown={(e) => e.key === 'Enter' && handleDiscount()}
          disabled={loading}
        />
        <button
          onClick={handleDiscount}
          disabled={loading || !discountInput.trim()}
          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg disabled:opacity-50"
        >
          Apply
        </button>
      </div>

      {appliedCodes.length > 0 && (
        <div className="text-xs text-green-600">
          ✓ Applied: {appliedCodes.join(', ')}
        </div>
      )}

      {/* Hint: available codes */}
      <div className="text-xs text-gray-400">Try: 10OFF, WELCOME20, FIXED500</div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onProceedToFulfillment}
          disabled={loading}
          className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

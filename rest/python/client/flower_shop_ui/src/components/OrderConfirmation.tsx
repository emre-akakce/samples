import type { Checkout } from '../types';
import { formatCents } from '../types';

interface Props {
  checkout: Checkout;
  onStartOver: () => void;
}

export function OrderConfirmation({ checkout, onStartOver }: Props) {
  const order = checkout.order;
  const total = checkout.totals.find((t) => t.type === 'total')?.amount ?? 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col items-center gap-4 text-center">
      <div className="text-5xl">🎉</div>
      <h2 className="text-xl font-semibold text-gray-800">Order Confirmed!</h2>

      {order && (
        <div className="bg-gray-50 rounded-lg p-4 w-full text-left flex flex-col gap-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Order ID</span>
            <span className="font-mono text-xs text-gray-700 break-all">{order.id}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Total Charged</span>
            <span className="font-semibold text-gray-800">{formatCents(total)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status</span>
            <span className="text-green-600 font-medium">Completed</span>
          </div>
        </div>
      )}

      {/* Line items summary */}
      <div className="w-full text-left">
        <p className="text-sm font-medium text-gray-600 mb-2">Items ordered:</p>
        <div className="flex flex-col gap-1">
          {checkout.line_items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm text-gray-600">
              <span>{item.item.title} × {item.quantity}</span>
              <span>{formatCents(item.item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
      </div>

      {order && (
        <a
          href={order.permalink_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-green-600 hover:underline"
        >
          View order details →
        </a>
      )}

      <button
        onClick={onStartOver}
        className="mt-2 w-full py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium"
      >
        Shop Again
      </button>
    </div>
  );
}

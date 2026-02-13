import type { Checkout, FulfillmentDestination, FulfillmentOption } from '../types';
import { formatCents } from '../types';

interface Props {
  checkout: Checkout;
  onSelectDestination: (destinationId: string) => void;
  onSelectShipping: (groupId: string, optionId: string) => void;
  onProceedToPayment: () => void;
  onBack: () => void;
  loading: boolean;
}

export function FulfillmentSelector({
  checkout,
  onSelectDestination,
  onSelectShipping,
  onProceedToPayment,
  onBack,
  loading,
}: Props) {
  const method = checkout.fulfillment?.methods?.[0];
  const destinations: FulfillmentDestination[] = method?.destinations ?? [];
  const selectedDestId = method?.selected_destination_id ?? null;
  const groups = method?.groups ?? [];

  function formatAddress(d: FulfillmentDestination) {
    return `${d.street_address}, ${d.city}, ${d.region} ${d.postal_code}, ${d.address_country}`;
  }

  function shippingPrice(option: FulfillmentOption) {
    const total = option.totals.find((t) => t.type === 'total')?.amount ?? 0;
    return total === 0 ? 'Free' : formatCents(total);
  }

  const allShippingSelected = groups.every((g) => g.selected_option_id !== null);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-4">
      <h2 className="text-xl font-semibold text-gray-800">Delivery</h2>

      {/* Destination */}
      {destinations.length > 0 ? (
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">Select delivery address:</p>
          <div className="flex flex-col gap-2">
            {destinations.map((dest) => (
              <label
                key={dest.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedDestId === dest.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="destination"
                  value={dest.id}
                  checked={selectedDestId === dest.id}
                  onChange={() => onSelectDestination(dest.id)}
                  disabled={loading}
                  className="mt-0.5 accent-green-500"
                />
                <span className="text-sm text-gray-700">{formatAddress(dest)}</span>
              </label>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">Loading addresses…</p>
      )}

      {/* Shipping options per group */}
      {selectedDestId && groups.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">Select shipping method:</p>
          {groups.map((group) => (
            <div key={group.id} className="flex flex-col gap-2">
              {group.options.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    group.selected_option_id === option.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name={`shipping-${group.id}`}
                      value={option.id}
                      checked={group.selected_option_id === option.id}
                      onChange={() => onSelectShipping(group.id, option.id)}
                      disabled={loading}
                      className="accent-green-500"
                    />
                    <span className="text-sm text-gray-700">{option.title}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-800">{shippingPrice(option)}</span>
                </label>
              ))}
            </div>
          ))}
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
          onClick={onProceedToPayment}
          disabled={loading || !selectedDestId || !allShippingSelected}
          className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
        >
          Continue →
        </button>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import type {
  Checkout,
  MerchantProfile,
  PaymentInstrument,
  Product,
} from './types';
import {
  fetchMerchantProfile,
  createCheckout,
  updateCheckout,
  completeCheckout,
  cancelCheckout,
} from './api';
import { ProductCatalog } from './components/ProductCatalog';
import { Cart } from './components/Cart';
import { FulfillmentSelector } from './components/FulfillmentSelector';
import { PaymentForm } from './components/PaymentForm';
import { OrderConfirmation } from './components/OrderConfirmation';

type Step = 'catalog' | 'cart' | 'fulfillment' | 'payment' | 'confirmed';

export default function App() {
  const [profile, setProfile] = useState<MerchantProfile | null>(null);
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [step, setStep] = useState<Step>('catalog');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMerchantProfile()
      .then(setProfile)
      .catch(() => setError('Could not reach the UCP server at http://localhost:8182'));
  }, []);

  async function handleAddToCart(product: Product) {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      if (!checkout) {
        // First item: create checkout
        const c = await createCheckout(
          product.id,
          product.title,
          1,
          profile.payment.handlers,
        );
        setCheckout(c);
        setStep('cart');
      } else {
        // Additional items: update with full line_items list
        const existing = checkout.line_items.find(
          (li) => li.item.id === product.id,
        );
        const updatedItems = existing
          ? checkout.line_items.map((li) =>
              li.item.id === product.id
                ? { id: li.id, item: { id: li.item.id, title: li.item.title }, quantity: li.quantity + 1 }
                : { id: li.id, item: { id: li.item.id, title: li.item.title }, quantity: li.quantity },
            )
          : [
              ...checkout.line_items.map((li) => ({
                id: li.id,
                item: { id: li.item.id, title: li.item.title },
                quantity: li.quantity,
              })),
              { item: { id: product.id, title: product.title }, quantity: 1 },
            ];
        const c = await updateCheckout(checkout.id, {
          id: checkout.id,
          line_items: updatedItems,
          currency: checkout.currency,
          payment: { instruments: [], handlers: [] },
        });
        setCheckout(c);
        setStep('cart');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyDiscount(code: string) {
    if (!checkout) return;
    setLoading(true);
    setError(null);
    try {
      const existingCodes = checkout.discounts?.codes ?? [];
      const c = await updateCheckout(checkout.id, {
        id: checkout.id,
        line_items: checkout.line_items.map((li) => ({
          id: li.id,
          item: { id: li.item.id, title: li.item.title },
          quantity: li.quantity,
        })),
        currency: checkout.currency,
        payment: { instruments: [], handlers: [] },
        discounts: { codes: [...existingCodes, code] },
      });
      setCheckout(c);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleProceedToFulfillment() {
    if (!checkout) return;
    setLoading(true);
    setError(null);
    try {
      // Trigger fulfillment method generation
      const c = await updateCheckout(checkout.id, {
        id: checkout.id,
        line_items: checkout.line_items.map((li) => ({
          id: li.id,
          item: { id: li.item.id, title: li.item.title },
          quantity: li.quantity,
        })),
        currency: checkout.currency,
        payment: { instruments: [], handlers: [] },
        discounts: checkout.discounts
          ? { codes: checkout.discounts.codes ?? [] }
          : undefined,
        fulfillment: { methods: [{ type: 'shipping' }] },
      });
      setCheckout(c);
      setStep('fulfillment');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectDestination(destinationId: string) {
    if (!checkout) return;
    setLoading(true);
    setError(null);
    try {
      const method = checkout.fulfillment!.methods[0];
      const c = await updateCheckout(checkout.id, {
        id: checkout.id,
        line_items: checkout.line_items.map((li) => ({
          id: li.id,
          item: { id: li.item.id, title: li.item.title },
          quantity: li.quantity,
        })),
        currency: checkout.currency,
        payment: { instruments: [], handlers: [] },
        discounts: checkout.discounts
          ? { codes: checkout.discounts.codes ?? [] }
          : undefined,
        fulfillment: {
          methods: [{ id: method.id, type: method.type, selected_destination_id: destinationId }],
        },
      });
      setCheckout(c);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectShipping(groupId: string, optionId: string) {
    if (!checkout) return;
    setLoading(true);
    setError(null);
    try {
      const method = checkout.fulfillment!.methods[0];
      const c = await updateCheckout(checkout.id, {
        id: checkout.id,
        line_items: checkout.line_items.map((li) => ({
          id: li.id,
          item: { id: li.item.id, title: li.item.title },
          quantity: li.quantity,
        })),
        currency: checkout.currency,
        payment: { instruments: [], handlers: [] },
        discounts: checkout.discounts
          ? { codes: checkout.discounts.codes ?? [] }
          : undefined,
        fulfillment: {
          methods: [
            {
              id: method.id,
              type: method.type,
              selected_destination_id: method.selected_destination_id,
              groups: method.groups.map((g) => ({
                id: g.id,
                selected_option_id: g.id === groupId ? optionId : g.selected_option_id,
              })),
            },
          ],
        },
      });
      setCheckout(c);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePay(instrument: PaymentInstrument) {
    if (!checkout) return;
    setLoading(true);
    setError(null);
    try {
      const c = await completeCheckout(checkout.id, instrument);
      setCheckout(c);
      setStep('confirmed');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (checkout) {
      await cancelCheckout(checkout.id).catch(() => {});
    }
    setCheckout(null);
    setStep('catalog');
    setError(null);
  }

  function handleStartOver() {
    setCheckout(null);
    setStep('catalog');
    setError(null);
  }

  const cartProductIds = checkout?.line_items.map((li) => li.item.id) ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌸</span>
          <span className="font-semibold text-gray-800 text-lg">UCP Flower Shop</span>
        </div>
        <div className="flex items-center gap-3">
          {profile && (
            <span className="text-xs text-gray-400">
              UCP v{profile.ucp.version}
            </span>
          )}
          {checkout && step !== 'confirmed' && (
            <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded-full">
              {checkout.line_items.length} item{checkout.line_items.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </header>

      {/* Step indicator */}
      {step !== 'catalog' && step !== 'confirmed' && (
        <div className="flex justify-center gap-1 py-3">
          {(['cart', 'fulfillment', 'payment'] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  step === s
                    ? 'bg-green-500'
                    : ['cart', 'fulfillment', 'payment'].indexOf(step) > i
                    ? 'bg-green-300'
                    : 'bg-gray-300'
                }`}
              />
              {i < 2 && <div className="w-8 h-px bg-gray-200" />}
            </div>
          ))}
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* Server error banner */}
        {error && step !== 'payment' && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {step === 'catalog' && (
          <ProductCatalog
            onAddToCart={handleAddToCart}
            cartIds={cartProductIds}
            loading={loading}
          />
        )}

        {step === 'cart' && checkout && (
          <>
            <div className="mb-4">
              <button
                onClick={() => setStep('catalog')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ← Continue shopping
              </button>
            </div>
            <Cart
              checkout={checkout}
              onApplyDiscount={handleApplyDiscount}
              onProceedToFulfillment={handleProceedToFulfillment}
              onCancel={handleCancel}
              loading={loading}
            />
          </>
        )}

        {step === 'fulfillment' && checkout && (
          <FulfillmentSelector
            checkout={checkout}
            onSelectDestination={handleSelectDestination}
            onSelectShipping={handleSelectShipping}
            onProceedToPayment={() => setStep('payment')}
            onBack={() => setStep('cart')}
            loading={loading}
          />
        )}

        {step === 'payment' && checkout && (
          <PaymentForm
            checkout={checkout}
            onPay={handlePay}
            onBack={() => setStep('fulfillment')}
            loading={loading}
            error={error}
          />
        )}

        {step === 'confirmed' && checkout && (
          <OrderConfirmation
            checkout={checkout}
            onStartOver={handleStartOver}
          />
        )}
      </main>
    </div>
  );
}

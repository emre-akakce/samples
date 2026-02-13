import type { Product } from '../types';
import { PRODUCTS, formatCents } from '../types';

const EMOJI: Record<string, string> = {
  bouquet_roses: '🌹',
  pot_ceramic: '🪴',
  bouquet_sunflowers: '🌻',
  bouquet_tulips: '🌷',
  orchid_white: '🌸',
  gardenias: '🌼',
};

interface Props {
  onAddToCart: (product: Product) => void;
  cartIds: string[];
  loading: boolean;
}

export function ProductCatalog({ onAddToCart, cartIds, loading }: Props) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Products</h2>
      <div className="grid grid-cols-2 gap-3">
        {PRODUCTS.map((product) => {
          const inCart = cartIds.includes(product.id);
          return (
            <div
              key={product.id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-2 shadow-sm"
            >
              <div className="text-4xl text-center">{EMOJI[product.id] ?? '🌿'}</div>
              <div className="text-sm font-medium text-gray-800 text-center">{product.title}</div>
              <div className="text-green-600 font-semibold text-center">{formatCents(product.price)}</div>
              <button
                onClick={() => onAddToCart(product)}
                disabled={loading}
                className={`mt-1 w-full py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  inCart
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                } disabled:opacity-50`}
              >
                {inCart ? '✓ In Cart' : 'Add to Cart'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// UCP Data Types

export interface Product {
  id: string;
  title: string;
  price: number; // in cents
  image_url: string | null;
}

export interface CheckoutTotal {
  type: string;
  display_text: string | null;
  amount: number; // in cents
}

export interface CheckoutItem {
  id: string;
  item: Product;
  quantity: number;
  totals: CheckoutTotal[];
}

export interface DiscountApplied {
  code: string;
  title: string;
  amount: number;
  automatic: boolean;
}

export interface Discounts {
  codes: string[] | null;
  applied: DiscountApplied[] | null;
}

export interface FulfillmentDestination {
  id: string;
  street_address: string;
  city: string;
  region: string;
  address_country: string;
  postal_code: string;
}

export interface FulfillmentOption {
  id: string;
  title: string;
  totals: CheckoutTotal[];
}

export interface FulfillmentGroup {
  id: string;
  line_item_ids: string[];
  options: FulfillmentOption[];
  selected_option_id: string | null;
}

export interface FulfillmentMethod {
  id: string;
  type: string;
  line_item_ids: string[];
  destinations: FulfillmentDestination[];
  selected_destination_id: string | null;
  groups: FulfillmentGroup[];
}

export interface Fulfillment {
  methods: FulfillmentMethod[];
}

export interface PaymentHandler {
  id: string;
  name: string;
  config?: Record<string, unknown>;
}

export interface PaymentCredential {
  type: string;
  token: string;
}

export interface PaymentInstrument {
  id: string;
  handler_id: string;
  handler_name: string;
  type: string;
  brand: string;
  last_digits: string;
  credential: PaymentCredential;
}

export interface Payment {
  handlers: PaymentHandler[];
  instruments: PaymentInstrument[];
  selected_instrument_id: string | null;
}

export interface Order {
  id: string;
  permalink_url: string;
}

export interface Checkout {
  id: string;
  status: 'incomplete' | 'ready_for_complete' | 'completed' | 'cancelled';
  currency: string;
  line_items: CheckoutItem[];
  totals: CheckoutTotal[];
  buyer: { full_name: string | null; email: string | null } | null;
  discounts: Discounts | null;
  fulfillment: Fulfillment | null;
  payment: Payment | null;
  order: Order | null;
}

export interface MerchantProfile {
  ucp: {
    version: string;
    capabilities: Array<{ name: string; version: string }>;
  };
  payment: {
    handlers: PaymentHandler[];
  };
}

// Static product catalog (from test_data/flower_shop)
export const PRODUCTS: Product[] = [
  { id: 'bouquet_roses', title: 'Bouquet of Red Roses', price: 3500, image_url: null },
  { id: 'pot_ceramic', title: 'Ceramic Pot', price: 1500, image_url: null },
  { id: 'bouquet_sunflowers', title: 'Sunflower Bundle', price: 2500, image_url: null },
  { id: 'bouquet_tulips', title: 'Spring Tulips', price: 3000, image_url: null },
  { id: 'orchid_white', title: 'White Orchid', price: 4500, image_url: null },
  { id: 'gardenias', title: 'Gardenias', price: 2000, image_url: null },
];

export const DISCOUNT_CODES = ['10OFF', 'WELCOME20', 'FIXED500'];

export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

# Understanding UCP (Universal Commerce Protocol)

## What is UCP?

UCP is an **open standard for commerce interoperability** that enables any client (AI agent, web app, mobile app) to work with any merchant using a common language. Think of it as "HTTP for commerce" - it standardizes:

- **Data types** (Checkout, LineItem, Payment, Order)
- **Capability negotiation** (client and merchant agree on features)
- **Multiple protocols** (REST, A2A JSON-RPC, MCP)
- **Version compatibility** checking

---

## Core Workflow

### 1. Discovery Phase
- Merchant publishes capabilities at `/.well-known/ucp`
- Client fetches profile to learn what features are available
- Profile contains: UCP version, services, capabilities, payment handlers

### 2. Capability Negotiation
```
Client offers: [checkout, fulfillment, discount]
Merchant supports: [checkout, fulfillment]
Agreed contract: [checkout, fulfillment]
```

### 3. Dynamic Type Composition
Based on negotiated capabilities, the checkout object dynamically includes only relevant fields. If fulfillment is negotiated, shipping address fields appear automatically.

---

## Checkout Lifecycle (3-State Machine)

```
incomplete → ready_for_complete → completed
```

| State | Meaning | Example |
|-------|---------|---------|
| **incomplete** | Cart mode | User adds items |
| **ready_for_complete** | Validation gate | Email + address collected, price locked |
| **completed** | Order finalized | Payment processed, order ID issued |

This prevents race conditions and ensures all required data is collected before payment.

---

## Discovery Profile Structure

Example from `/.well-known/ucp`:

```json
{
  "ucp": {
    "version": "2026-01-11",
    "services": {
      "dev.ucp.shopping": {
        "version": "2026-01-11",
        "spec": "https://ucp.dev/specs/shopping",
        "rest": {
          "schema": "https://ucp.dev/services/shopping/openapi.json",
          "endpoint": "http://localhost:3000/"
        }
      }
    },
    "capabilities": [
      {
        "name": "dev.ucp.shopping.checkout",
        "version": "2026-01-11",
        "spec": "https://ucp.dev/specs/shopping/checkout",
        "schema": "https://ucp.dev/schemas/shopping/checkout.json"
      },
      {
        "name": "dev.ucp.shopping.fulfillment",
        "version": "2026-01-11",
        "spec": "https://ucp.dev/specs/shopping/fulfillment",
        "extends": "dev.ucp.shopping.checkout"
      },
      {
        "name": "dev.ucp.shopping.discount",
        "version": "2026-01-11",
        "spec": "https://ucp.dev/specs/shopping/discount",
        "extends": "dev.ucp.shopping.checkout"
      }
    ]
  },
  "payment": {
    "handlers": [
      {
        "id": "shop_pay",
        "name": "com.shopify.shop_pay",
        "version": "2026-01-11",
        "instrument_schemas": [
          "https://shopify.dev/ucp/handlers/shop_pay/instrument.json"
        ]
      },
      {
        "id": "google_pay",
        "name": "google.pay",
        "version": "2026-01-11",
        "instrument_schemas": [
          "https://ucp.dev/schemas/shopping/types/gpay_card_payment_instrument.json"
        ]
      }
    ]
  }
}
```

---

## Key Capabilities

### dev.ucp.shopping.checkout (base)
- Line items with quantities
- Buyer information
- Totals calculation
- Payment instruments

### dev.ucp.shopping.fulfillment (extends checkout)
- Shipping addresses
- Delivery options (standard, express)
- Fulfillment groups

### dev.ucp.shopping.discount (extends checkout)
- Promo codes
- Discount allocations
- Applied discount tracking

---

## Checkout Data Model

```json
{
  "id": "checkout-uuid",
  "status": "ready_for_complete",
  "currency": "USD",

  "line_items": [{
    "id": "item-uuid",
    "item": {
      "id": "cookie-chocochip",
      "title": "Chocolate Chip Cookies",
      "price": 499,
      "image_url": "https://example.com/cookie.jpg"
    },
    "quantity": 2,
    "totals": [
      {"type": "subtotal", "amount": 998}
    ]
  }],

  "totals": [
    {"type": "subtotal", "amount": 998},
    {"type": "tax", "amount": 100},
    {"type": "shipping", "amount": 500},
    {"type": "total", "amount": 1598}
  ],

  "buyer": {
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },

  "fulfillment": {
    "destination": {
      "address": {
        "street1": "123 Main St",
        "city": "San Francisco",
        "state": "CA",
        "postal_code": "94102",
        "country": "US"
      }
    },
    "groups": [{
      "selected_method": {
        "id": "express",
        "title": "Express Shipping",
        "price": 500
      }
    }]
  },

  "payment": {
    "handlers": [
      {"id": "google_pay", "name": "google.pay"}
    ],
    "selected_instrument_id": "instr_123",
    "instruments": [
      {
        "id": "instr_123",
        "type": "card",
        "last_digits": "1111",
        "brand": "VISA",
        "handler_id": "google_pay",
        "credential": {
          "type": "card_token",
          "token": "tok_abc123"
        }
      }
    ]
  },

  "order": {
    "id": "order-uuid",
    "permalink_url": "https://example.com/order?id=order-uuid"
  }
}
```

**Important**: All prices are in **cents** (499 = $4.99)

---

## Payment Flow

### Phase 1: Payment Method Selection
- Client UI shows available payment handlers from `checkout.payment.handlers`
- User selects payment method (card, Google Pay, Shop Pay, etc.)
- Payment provider returns `PaymentInstrument`

### Phase 2: Payment Token Exchange
- CredentialProviderProxy handles secure tokenization
- Returns token instead of raw card data
- Token stored in session state

### Phase 3: Complete Checkout
- `complete_checkout()` is called with payment data
- Payment processor validates payment
- If successful:
  - Checkout status → "completed"
  - OrderConfirmation created with order ID
  - Order moved to orders storage

Example PaymentInstrument:
```json
{
  "id": "instr_123",
  "type": "card",
  "last_digits": "1111",
  "brand": "AMEX",
  "handler_id": "example_payment_provider",
  "credential": {
    "type": "card_token",
    "token": "mock_token_abc123"
  }
}
```

---

## Total Calculation Logic

```python
def calculate_totals(checkout):
    # 1. Calculate line item subtotals
    subtotal = 0
    for item in checkout.line_items:
        item_total = item.item.price * item.quantity
        item.totals = [Total(type="subtotal", amount=item_total)]
        subtotal += item_total

    # 2. Tax (10% flat rate, only if fulfillment address set)
    tax = subtotal // 10 if checkout.fulfillment else 0

    # 3. Shipping (from selected method)
    shipping = 0
    if checkout.fulfillment:
        shipping = checkout.fulfillment.groups[0].selected_method.price

    # 4. Discounts (if discount capability negotiated)
    discount = 0
    if checkout.discounts and checkout.discounts.applied:
        discount = sum(d.amount for d in checkout.discounts.applied)

    # 5. Grand total
    total = subtotal + tax + shipping - discount

    # 6. Update checkout.totals
    checkout.totals = [
        Total(type="subtotal", amount=subtotal),
        Total(type="tax", amount=tax),
        Total(type="shipping", amount=shipping),
        Total(type="discount", amount=discount),
        Total(type="total", amount=total),
    ]
```

---

## A2A Integration (Agent-to-Agent)

The A2A implementation shows how UCP works with AI agents:

### Discovery Endpoints

**`GET /.well-known/agent-card.json`** - Advertises agent capabilities
```json
{
  "name": "SuperStore Merchant Agent",
  "capabilities": {
    "extensions": [{
      "uri": "https://ucp.dev/specification/reference?v=2026-01-11",
      "description": "UCP Extension",
      "params": {
        "capabilities": ["dev.ucp.shopping.checkout", "dev.ucp.shopping.fulfillment"]
      }
    }]
  },
  "skills": [
    {"id": "product_search", "name": "Perform product search"},
    {"id": "checkout", "name": "Checkout"}
  ]
}
```

**`GET /.well-known/ucp`** - UCP merchant profile (see Discovery Profile Structure above)

### Request Flow

1. **Chat Client** sends POST request with:
   - JSON-RPC payload (user query)
   - `UCP-Agent: profile="<client_profile_url>"` header
   - `requested_extensions: ["https://ucp.dev/..."]`

2. **A2A Server** (Starlette):
   - Routes to AgentExecutor
   - Extracts headers and extensions

3. **AgentExecutor** (UcpRequestProcessor):
   - Parses `UCP-Agent` header
   - Fetches client profile from URL
   - Validates version compatibility
   - Calls `get_ucp_metadata()` for capability negotiation
   - Stores metadata in session

4. **ADK Agent**:
   - Receives user query
   - Runs with 8 shopping tools available
   - Tools access negotiated capabilities via ToolContext
   - Returns response

5. **Callbacks**:
   - `after_tool_callback` - Captures UCP data in state
   - `after_agent_callback` - Attaches structured data to response

6. **Response** to client:
   - Text: Agent's natural language response
   - Data: Structured checkout/product objects for UI rendering

### Example Request/Response

**Request**: Add Item to Checkout
```json
POST /
Content-Type: application/json
UCP-Agent: profile="https://agent.example/profile.json"

{
  "jsonrpc": "2.0",
  "method": "route",
  "params": {
    "task": {
      "context_id": "...",
      "input": "Add cookies to my cart"
    }
  }
}
```

**Response**: Checkout Created
```json
{
  "jsonrpc": "2.0",
  "result": {
    "parts": [
      {
        "type": "text",
        "text": "I've added 2 boxes of Chocochip Cookies to your cart for $9.98"
      },
      {
        "type": "data",
        "data": {
          "a2a.ucp.checkout": {
            "id": "checkout-abc123",
            "status": "incomplete",
            "line_items": [...],
            "totals": [...]
          }
        }
      }
    ]
  }
}
```

---

## Dynamic Type Generation

Based on negotiated capabilities, checkout types are composed dynamically:

```python
def get_checkout_type(ucp_metadata: UcpMetadata) -> type[Checkout]:
    selected_base_models = []
    active_capability_names = {c.name for c in ucp_metadata.capabilities}

    # Start with base Checkout
    selected_base_models.append(Checkout)

    # Add fulfillment fields if negotiated
    if "dev.ucp.shopping.fulfillment" in active_capability_names:
        selected_base_models.append(FulfillmentCheckout)

    # Add discount fields if negotiated
    if "dev.ucp.shopping.discount" in active_capability_names:
        selected_base_models.append(DiscountCheckout)

    # Compose final type using multiple inheritance
    return create_model("DynamicCheckout", __base__=tuple(selected_base_models))
```

**Result**: If both fulfillment and discount are negotiated, the Checkout class automatically inherits fields for addresses, shipping options, and discount codes.

---

## Implementation Patterns

### Node.js (Hono + TypeScript)

**Discovery Service** - `rest/nodejs/src/api/discovery.ts`
```typescript
export class DiscoveryService {
  ucpVersion = '2026-01-11';

  getMerchantProfile = (c: Context) => {
    return c.json({
      ucp: {
        version: this.ucpVersion,
        services: {...},
        capabilities: [...]
      },
      payment: {
        handlers: [...]
      }
    });
  };
}
```

**Checkout Service** - `rest/nodejs/src/api/checkout.ts`
- Idempotency support (SHA256 hash of request)
- Webhook notifications for order events
- Payment processor integration
- Inventory reservation/release via `inventory.ts`

**Inventory Management** - `rest/nodejs/src/data/inventory.ts`
```typescript
// Atomic stock reservation
export function reserveStock(productId: string, quantity: number): boolean {
  const stmt = db.prepare(`
    UPDATE inventory
    SET quantity = quantity - ?
    WHERE product_id = ? AND quantity >= ?
  `);
  const info = stmt.run(quantity, productId, quantity);
  return info.changes > 0;
}

// Release reserved stock (for cancellations)
export function releaseStock(productId: string, quantity: number): void {
  const stmt = db.prepare(`
    UPDATE inventory
    SET quantity = quantity + ?
    WHERE product_id = ?
  `);
  stmt.run(quantity, productId);
}
```

### Python (FastAPI + Google ADK)

**8 Shopping Tools** - `a2a/business_agent/src/business_agent/agent.py`
1. `search_products` - Find products by query
2. `add_to_checkout` - Add items to cart
3. `update_buyer_info` - Set email, name
4. `set_shipping_address` - Set delivery address
5. `select_shipping_option` - Choose shipping method
6. `start_payment` - Move to ready_for_complete state
7. `complete_checkout` - Process payment and create order
8. `get_checkout` - Retrieve current checkout state

**Tool Pattern**:
```python
def tool_function(tool_context: ToolContext, param: str) -> dict:
    """Docstring visible to LLM."""

    # 1. Get state
    checkout_id = tool_context.state.get(ADK_USER_CHECKOUT_ID)
    ucp_metadata = tool_context.state.get(ADK_UCP_METADATA_STATE)

    # 2. Validate
    if not ucp_metadata:
        return {"message": "Missing UCP metadata", "status": "error"}

    # 3. Execute business logic
    try:
        result = store.method(checkout_id, ...)
    except ValueError as e:
        return {"message": str(e), "status": "error"}

    # 4. Update state if needed
    if not checkout_id:
        tool_context.state[ADK_USER_CHECKOUT_ID] = result.id

    # 5. Return UCP-formatted response
    return {
        "a2a.ucp.checkout": result.model_dump(mode="json"),
        "status": "success"
    }
```

**State Management**:
- `user:checkout_id` - Current checkout session ID
- `__ucp_metadata__` - Negotiated capabilities
- `__payment_data__` - Payment instrument
- `__session_extensions__` - Active A2A extensions
- `temp:LATEST_TOOL_RESULT` - Last UCP tool response

---

## Extensions & Capability System

### How Extensions Work

Extensions are modular additions that modify base capabilities:

```python
class A2AExtensionBase:
    URI: str  # Extension identifier

    def get_agent_extension(self) -> AgentExtension:
        return AgentExtension(
            uri=self.URI,
            description="...",
            params={...}  # Capability list and versions
        )

    def activate(self, context: RequestContext) -> None:
        if self.URI in context.requested_extensions:
            context.add_activated_extension(self.URI)
```

**UcpExtension** (`https://ucp.dev/specification/reference?v=2026-01-11`):
- Declares UCP capabilities in its params
- Activated when client requests it
- Tools check if extension is active before processing UCP data

### Adding New Capabilities

1. **Update merchant profile** (`ucp.json`):
```json
{
  "capabilities": [
    {
      "name": "dev.ucp.shopping.new_feature",
      "extends": "dev.ucp.shopping.checkout"
    }
  ]
}
```

2. **Create new Checkout subclass** (e.g., `NewFeatureCheckout`)

3. **Update type generator** (`helpers/type_generator.py`):
```python
if "dev.ucp.shopping.new_feature" in active_names:
    selected_base_models.append(NewFeatureCheckout)
```

4. **Add/update tools** if new fields need processing

---

## Key Files Reference

| File | Purpose | Location |
|------|---------|----------|
| `ucp.json` | Merchant capabilities profile | `a2a/business_agent/data/ucp.json` |
| `agent_card.json` | A2A agent discovery | `a2a/business_agent/data/agent_card.json` |
| `agent.py` | 8 shopping tools + LLM | `a2a/business_agent/src/business_agent/agent.py` |
| `store.py` | Checkout state machine + calculations | `a2a/business_agent/src/business_agent/store.py` |
| `agent_executor.py` | A2A ↔ ADK bridge | `a2a/business_agent/src/business_agent/agent_executor.py` |
| `ucp_profile_resolver.py` | Capability negotiation | `a2a/business_agent/src/business_agent/ucp_profile_resolver.py` |
| `type_generator.py` | Dynamic checkout type composition | `a2a/business_agent/src/business_agent/helpers/type_generator.py` |
| `payment_processor.py` | Payment validation | `a2a/business_agent/src/business_agent/payment_processor.py` |
| `discovery.ts` | REST discovery endpoint | `rest/nodejs/src/api/discovery.ts` |
| `checkout.ts` | REST checkout implementation | `rest/nodejs/src/api/checkout.ts` |
| `inventory.ts` | Stock reservation logic | `rest/nodejs/src/data/inventory.ts` |
| `extensions.ts` | Extension type definitions | `rest/nodejs/src/models/extensions.ts` |
| `checkout_service.py` | Python checkout service | `rest/python/server/services/checkout_service.py` |

---

## REST API Endpoints

### Discovery
- `GET /.well-known/ucp` - Get merchant profile

### Checkout
- `POST /checkout-sessions` - Create new checkout
- `GET /checkout-sessions/:id` - Retrieve checkout
- `PUT /checkout-sessions/:id` - Update checkout
- `POST /checkout-sessions/:id/complete` - Complete checkout (create order)
- `POST /checkout-sessions/:id/cancel` - Cancel checkout

### Order
- `GET /orders/:id` - Retrieve order details
- `PUT /orders/:id` - Update order

### Testing
- `POST /testing/simulate-shipping/:id` - Trigger simulated shipping event

### Required Headers
- `UCP-Agent: profile="<client_profile_url>"` - Client profile for capability negotiation
- `request-signature: <signature>` - Request signature (varies by environment)
- `idempotency-key: <uuid>` - Prevent duplicate requests
- `request-id: <uuid>` - Request tracking

---

## Why UCP Matters

### Before UCP
Each merchant has custom APIs. Agents need custom integrations for each store.
- Shopify API ≠ WooCommerce API ≠ Custom Store API
- Each integration requires specialized code
- No standard way to discover capabilities
- Payment handling varies wildly

### With UCP
Agent learns capabilities from discovery profile, negotiates common features, and transacts using standard types. **One integration works everywhere.**

- Single integration works with all UCP merchants
- Automatic capability discovery
- Type-safe data exchange
- Standard payment handler interface
- Version compatibility built-in

---

## Example: Complete Shopping Flow

1. **Discovery**
   ```
   Client → GET /.well-known/ucp → Server
   Server returns: capabilities [checkout, fulfillment, discount]
   ```

2. **Create Checkout**
   ```
   Client → POST /checkout-sessions
   {
     "line_items": [{"item": {"id": "cookie"}, "quantity": 2}],
     "buyer": {"email": "user@example.com"}
   }
   Server returns: Checkout (status: "incomplete")
   ```

3. **Add Shipping Address** (fulfillment capability)
   ```
   Client → PUT /checkout-sessions/:id
   {
     "fulfillment": {
       "destination": {"address": {...}}
     }
   }
   Server returns: Checkout with shipping options
   ```

4. **Select Shipping Method**
   ```
   Client → PUT /checkout-sessions/:id
   {
     "fulfillment": {
       "groups": [{
         "selected_method": {"id": "express"}
       }]
     }
   }
   Server returns: Checkout (status: "ready_for_complete")
   ```

5. **Apply Discount** (discount capability)
   ```
   Client → PUT /checkout-sessions/:id
   {
     "discounts": {"codes": ["10OFF"]}
   }
   Server returns: Checkout with discount applied
   ```

6. **Complete Checkout**
   ```
   Client → POST /checkout-sessions/:id/complete
   {
     "payment": {
       "selected_instrument_id": "instr_123"
     }
   }
   Server returns: Order confirmation (status: "completed")
   ```

7. **Track Order**
   ```
   Client → GET /orders/:id
   Server returns: Order details with status
   ```

---

## Further Learning

- **UCP Specification**: https://ucp.dev/specification/overview/
- **Google ADK Documentation**: https://google.github.io/adk-docs/
- **A2A Protocol Specification**: https://a2a-protocol.org/latest/specification/
- **UCP Python SDK**: https://github.com/Universal-Commerce-Protocol/python-sdk

---

**Generated**: February 12, 2026
**Based on**: UCP Samples Repository (Node.js, Python, A2A implementations)

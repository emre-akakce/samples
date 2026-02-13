# Running the UCP Python Client

## Prerequisites

- Server must be running at `http://localhost:8182` — see `rest/python/server/RUNNING.md`
- `uv` must be installed — see server RUNNING.md for install instructions
- UCP Python SDK must be cloned at `~/Desktop/Workspace/sdk/python` — see server RUNNING.md

## Steps

**1. Go to the client directory:**
```bash
cd ~/Desktop/Workspace/samples/rest/python/client/flower_shop
```

**2. Install dependencies:**
```bash
uv sync
```

**3. Run the happy path client:**
```bash
uv run simple_happy_path_client.py --server_url=http://localhost:8182
```

## Expected Output

```
STEP 0: Discovery - Asking merchant what they support...
  - shop_pay (dev.shopify.shop_pay)
  - google_pay (com.google.pay)
  - mock_payment_handler (dev.ucp.mock_payment)

STEP 1: Creating a new Checkout Session...
  Successfully created checkout session: <id>
  Current Total: 3500 cents

STEP 2: Adding a second item (Ceramic Pot)...
  New Total: 6500 cents

STEP 3: Applying Discount (10% OFF)...
  New Total: 5850 cents

STEP 4-6: Selecting Fulfillment Option...
  Fulfillment option selected.

STEP 7: Processing Payment...
  Payment Successful!
  Checkout Status: completed
  Order ID: <id>

Happy Path completed successfully.
```

## Notes

- The client runs a scripted "happy path" — discovery → checkout → discount → fulfillment → payment → order.
- It uses `mock_payment_handler` for payment, which must be present in the server's discovery profile (`routes/discovery_profile.json`). This was added as a fix — if you cloned the repo fresh, re-apply it:

  ```json
  {
    "id": "mock_payment_handler",
    "name": "dev.ucp.mock_payment",
    "version": "2026-01-11",
    "spec": "https://ucp.dev/specs/mock",
    "config_schema": "https://ucp.dev/schemas/mock.json",
    "instrument_schemas": [
      "https://ucp.dev/schemas/shopping/types/card_payment_instrument.json"
    ],
    "config": {
      "supported_tokens": ["success_token", "fail_token"]
    }
  }
  ```

  Add this to the `payment.handlers` array in `rest/python/server/routes/discovery_profile.json`, then restart the server.

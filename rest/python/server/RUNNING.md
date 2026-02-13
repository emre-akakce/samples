# Running the UCP Python Server

## Prerequisites (one-time setup)

**1. Install `uv`** (Python package manager):
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
source $HOME/.local/bin/env   # add uv to PATH
```

**2. Clone the UCP Python SDK** (required dependency, not on PyPI):
```bash
mkdir -p ~/Desktop/Workspace/sdk
git clone https://github.com/Universal-Commerce-Protocol/python-sdk.git ~/Desktop/Workspace/sdk/python
```

> The server's `pyproject.toml` expects the SDK at exactly `../../../../sdk/python/` relative to
> the server directory — that path resolves to `~/Desktop/Workspace/sdk/python`.

## Every time

**3. Go to the server directory:**
```bash
cd ~/Desktop/Workspace/samples/rest/python/server
```

**4. Install dependencies:**
```bash
uv sync
```

**5. Initialize the database** (only needed once, or to reset data):
```bash
mkdir -p /tmp/ucp_test
uv run import_csv.py \
    --products_db_path=/tmp/ucp_test/products.db \
    --transactions_db_path=/tmp/ucp_test/transactions.db \
    --data_dir=../test_data/flower_shop
```

**6. Start the server:**
```bash
uv run server.py \
    --products_db_path=/tmp/ucp_test/products.db \
    --transactions_db_path=/tmp/ucp_test/transactions.db \
    --port=8182
```

The server is ready when you see:
```
INFO:     Uvicorn running on http://0.0.0.0:8182
```

**7. Verify it's working:**
```bash
curl http://localhost:8182/.well-known/ucp
```

**8. Stop the server:**
```
Ctrl+C
```

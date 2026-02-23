# Trading Model Worker

FastAPI service used by the TypeScript trading orchestrator for forecasting, calibration, drift checks, and attribution.

## Run locally

```bash
cd services/model-worker
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

The TypeScript service expects this base URL:

```bash
TRADING_MODEL_WORKER_URL=http://127.0.0.1:8001
```

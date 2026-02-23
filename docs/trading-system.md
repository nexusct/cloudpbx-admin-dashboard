# Polymarket Agentic Trading System

This repository now includes a full-stack trading subsystem with TypeScript orchestration and an optional Python model worker.

## Core paths

- `shared/trading-schema.ts`: Trading domain tables and schemas
- `shared/trading-types.ts`: Shared signal/risk/execution interfaces
- `server/trading/routes.ts`: Trading REST APIs
- `server/trading/orchestrator.ts`: Autonomous L0-L5 loop coordinator
- `server/trading/agents/*`: Research, signal, risk, execution, learning agents
- `server/trading/workers/*`: Ingestion, decision, execution, learning workers
- `server/trading/providers/polymarket.ts`: Polymarket market/execution adapter
- `client/src/pages/trading.tsx`: Operator console
- `services/model-worker/app/main.py`: Python model gateway

## API surface

- `POST /api/trading/control/start`
- `POST /api/trading/control/stop`
- `POST /api/trading/control/kill-switch`
- `GET /api/trading/control/status`
- `GET /api/trading/markets`
- `GET /api/trading/signals`
- `GET/PATCH /api/trading/risk/limits`
- `GET /api/trading/positions`
- `GET /api/trading/orders`
- `GET /api/trading/attribution`
- `GET /api/trading/drift`

## Environment variables

- `DATABASE_URL` (required)
- `TRADING_CYCLE_MS` (optional, default 300000)
- `TRADING_MARKET_LIMIT` (optional, default 40)
- `TRADING_TOP_CATEGORIES` (optional, default `Politics,Macro,Crypto`)
- `TRADING_DEFAULT_BANKROLL_USD` (optional, default 100000)
- `TRADING_MODEL_WORKER_URL` (optional, default `http://127.0.0.1:8001`)
- `POLYMARKET_GAMMA_BASE_URL` (optional, default `https://gamma-api.polymarket.com`)
- `POLYMARKET_EXECUTION_BASE_URL` (optional, enables live execution proxy)
- `POLYMARKET_EXECUTION_API_KEY` (optional)

## Notes

- If trading tables are not created in Postgres yet, the trading API responds with `503` and existing PBX features remain unaffected.
- Without `POLYMARKET_EXECUTION_BASE_URL`, order placement runs in paper fallback mode.
- Run `npm run db:push` to create/update trading tables from `shared/trading-schema.ts`.

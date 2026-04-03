# HealthNavigator

A health monitoring application that integrates with wearable devices to track vital signs and provide personalized wellness recommendations.

## Architecture

Microservice-ready full-stack application:

- **Frontend**: React + Vite (port 5000) — dashboard with real-time health metrics
- **Backend**: Node.js + Express REST API (port 3001)
- **Database**: PostgreSQL (Replit built-in)

## Project Structure

```
/
├── client/              # React + Vite frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components (MetricCard, PageHeader)
│   │   ├── hooks/       # useApi.js for API fetch helpers
│   │   └── pages/       # Dashboard, Devices, Vitals, Recommendations
│   ├── vite.config.js   # Host 0.0.0.0, port 5000, proxy /api → :3001
│   └── package.json
├── server/              # Express REST API
│   ├── src/
│   │   ├── routes/      # devices.js, vitals.js, recommendations.js
│   │   ├── db.js        # PostgreSQL pool (DATABASE_URL)
│   │   ├── schema.js    # Table creation + seed data
│   │   └── index.js     # Entry point, port 3001
│   └── package.json
└── replit.md
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Service health check |
| GET | /api/devices | List all devices |
| POST | /api/devices | Register new device |
| PATCH | /api/devices/:id/status | Toggle device status |
| DELETE | /api/devices/:id | Remove device |
| GET | /api/vitals | List readings (filter by device_id) |
| GET | /api/vitals/summary | Aggregate stats |
| GET | /api/vitals/latest | Latest reading per device |
| GET | /api/vitals/trends | Hourly averages (last 24h) |
| POST | /api/vitals | Log a manual reading |
| POST | /api/vitals/simulate | Simulate readings from active devices |
| GET | /api/recommendations | List recommendations |
| POST | /api/recommendations/generate | Auto-generate based on latest vitals |

## Database Tables

- **devices** — registered wearable devices (smartwatches, fitness bracelets, medical sensors)
- **vital_signs** — health readings (heart rate, steps, sleep, SpO2)
- **recommendations** — personalized health tips per device

## Workflows

- **Start Backend** — `node server/src/index.js` → port 3001 (console)
- **Start application** — `cd client && npm run dev` → port 5000 (webview)

## Environment Variables

- `DATABASE_URL` — Replit PostgreSQL connection string (auto-provisioned)

## Key Features

- Dashboard with live metric cards and 24h trend charts
- Device management (register, activate/deactivate, delete)
- Vital signs log with manual entry and device simulation
- Recommendations engine with priority-based alerts
- Microservice-ready architecture — new device types can be added via the devices API

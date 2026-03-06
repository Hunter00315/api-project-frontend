# Healthcare Appointment System — Frontend

Vue 3 frontend for the Healthcare Appointment System backend API.

## Features

- **Dashboard** — API health status, live weather & air quality data
- **Appointments** — Browse available slots by doctor and book appointments
- **Reservations** — View and cancel existing bookings
- **Health Metrics** — Calculate BMI, TDEE, and macro targets

## Tech Stack

- Vue 3 (Composition API)
- Vue Router 4 (hash mode — works as static files)
- Axios
- Vite

## Getting Started

```bash
npm install
cp .env.example .env   # optional — defaults point to live EC2
npm run dev            # http://localhost:5173
```

## Build

```bash
npm run build          # outputs to dist/
```

Open `dist/index.html` in a browser or serve the `dist/` folder from any HTTP server.

## Backend API

Base URL: `http://13.53.123.150:5000`

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Service health check |
| `/slots` | GET | Available appointment slots |
| `/reserve` | POST | Book a slot |
| `/reserve/:id` | DELETE | Cancel a reservation |
| `/reservations` | GET | All reservations |
| `/weather` | GET | Weather by city |
| `/aqi` | GET | Air quality by city |
| `/metrics` | POST | Health metrics calculation |

> **Note:** The backend API is served over HTTP. If hosting this frontend on HTTPS (e.g. GitHub Pages), browsers will block mixed-content requests. Serve the frontend from an HTTP server, or add HTTPS to the EC2 instance.

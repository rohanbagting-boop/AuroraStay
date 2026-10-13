# Hotel Reservation System

A full-stack hotel reservation system with React, Express, MongoDB, role-based dashboards, secure authentication, booking allocation, payments, audit logs, reports, and seed data.

## Stack

- Client: React + Vite, React Router, Axios, React Hook Form, Lucide React, CSS
- Server: Node.js, Express, MongoDB, Mongoose, JWT in HttpOnly cookies, bcryptjs, Helmet, CORS, rate limiting, express-validator
- Tests: Vitest, Supertest, mongodb-memory-server

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment files:
   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```
3. Set `MONGO_URI` in `server/.env` to MongoDB Atlas or local MongoDB.
4. Seed development data:
   ```bash
   npm run seed
   ```
5. Start both apps:
   ```bash
   npm run dev
   ```

Client runs on `http://localhost:5173`. Server runs on `http://localhost:5000`.

## Demo Accounts

Configured in `server/.env`; defaults are development-only:

- Admin: `admin@aurorastay.test` / `ChangeMeAdmin!123`
- Receptionist: `reception@aurorastay.test` / `ChangeMeReception!123`
- Guest: `guest@aurorastay.test` / `ChangeMeGuest!123`

## Important Environment Variables

See [server/.env.example](server/.env.example) and [client/.env.example](client/.env.example).

Server variables include `MONGO_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, cookie settings, tax/service fee rates, and seed account credentials. Never commit real `.env` files.

## API Overview

- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `PUT /api/auth/password`
- Rooms: `GET /api/rooms`, `GET /api/rooms/:id`, `POST /api/rooms`, `PUT /api/rooms/:id`, `DELETE /api/rooms/:id`, `GET /api/rooms/availability`
- Room types: `GET/POST /api/room-types`, `PUT/DELETE /api/room-types/:id`
- Reservations: `POST /api/reservations`, `GET /api/reservations/my`, `GET /api/reservations`, `GET /api/reservations/:id`, `PUT /api/reservations/:id`, `PATCH /api/reservations/:id/status`, `PATCH /api/reservations/:id/cancel`
- Payments: `POST /api/payments`, `GET /api/payments`, `GET /api/payments/:id`
- Users: `GET /api/users`, `GET /api/users/:id`, `PUT /api/users/:id`, `PATCH /api/users/:id/status`, `DELETE /api/users/:id`
- Dashboard and reports: `GET /api/dashboard/stats`, `GET /api/reports/reservations`, `GET /api/reports/revenue`, `GET /api/reports/reservations/export`
- Settings, notifications, audit logs: `/api/settings`, `/api/notifications`, `/api/audit-logs`

## Booking Rules

Reservations use half-open date intervals: check-in is inclusive, check-out is exclusive. Conflicts are detected when requested check-in is before an existing check-out and requested check-out is after an existing check-in. The server calculates nights, tax, fees, and totals from trusted room data, snapshots the room and price, and allocates an actual physical room in a transaction where MongoDB supports transactions.

## Testing

Run:

```bash
npm test
```

Backend tests cover auth, RBAC, ownership checks, NoSQL operator rejection, reservation validation, overlap prevention, payment idempotency, status transitions, headers, and rate limits. Frontend tests cover basic render behavior.

## Security Notes

The app uses HttpOnly JWT cookies, CSRF tokens for state-changing requests, strict server-side validation, Helmet, production CORS allowlists, query sanitization, audit logging, role checks, ownership checks, password reset token hashing, and safe response shaping. Production deployments must enable HTTPS, secure cookies, restricted MongoDB network access, real email delivery if needed, backups, monitoring, and legal review for privacy obligations.


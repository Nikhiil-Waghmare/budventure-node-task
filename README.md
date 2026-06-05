# Grocery Delivery Inventory Reservation System

A production-grade Node.js/TypeScript backend for highly concurrent inventory reservation.

## Features
- **Concurrency Control**: PostgreSQL `SELECT FOR UPDATE` prevents overselling and duplicate deductions.
- **Idempotency**: Redis-backed idempotency keys prevent duplicate orders.
- **Transaction Pooling**: PgBouncer for efficient connection multiplexing.
- **Metrics**: Prometheus `/metrics` endpoint.
- **Logging**: Structured Pino logging with Request IDs.
- **Validation**: Strict runtime validation using Zod.

## Architecture & Concurrency Strategy
When a user reserves an item, we must ensure the stock doesn't drop below zero and their wallet balance is accurate. We use Prisma's interactive transactions with raw `SELECT FOR UPDATE` queries to achieve this:

1. **Lock Item Row**: `SELECT ... FOR UPDATE` locks the item to prevent concurrent stock modifications.
2. **Lock User Row**: We lock the user row to prevent concurrent wallet modifications.
3. **Application Logic**: Check stock and balance. If valid, proceed.
4. **Update & Insert**: Deduct stock, deduct balance, insert reservation.
5. **Commit**: Transaction commits and releases locks.

*Why row-level locks instead of Optimistic Concurrency Control (OCC)?*
In high-contention scenarios (like a flash sale where 100 users try to buy 5 items), OCC results in many transaction aborts and retries. Row-level pessimistic locking handles this more efficiently by queuing transactions at the database level.

## PgBouncer
PgBouncer is configured in `transaction` mode. This allows Prisma to hold a connection only during an active transaction, drastically reducing the required number of physical Postgres connections when scaling horizontally.

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Start infrastructure (Postgres, Redis, PgBouncer):**
   ```bash
   docker compose up -d db redis pgbouncer
   ```

4. **Run migrations and seed the database:**
   ```bash
   npm run db:migrate:dev
   npm run db:seed
   ```

5. **Start the application:**
   ```bash
   npm run dev
   ```

*(Alternatively, run everything via Docker Compose: `docker compose up --build`)*

## API Documentation

### POST `/reserve-item`
Reserves inventory and deducts wallet balance atomically.

**Headers:**
- `Idempotency-Key` (Required): Unique string for the operation.

**Body:**
```json
{
  "userId": 2,
  "itemId": 101,
  "quantity": 1
}
```

### GET `/metrics`
Exposes Prometheus metrics.

## Load Testing
Use [k6](https://k6.io) to run the load test simulation.
The simulation spins up 100 concurrent Virtual Users attempting to purchase the last 5 items.

```bash
k6 run k6/load-test.js
```
Expected result: 5 users succeed (status 200), 95 users receive "Insufficient stock" (status 400).

# budventure-node-task

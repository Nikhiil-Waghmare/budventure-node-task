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
## PgBouncer Configuration & Tradeoffs

PgBouncer is configured in **`transaction` pool mode**. 

### 1. Selected Pool Mode
*   **Mode:** `transaction`

### 2. Why It Was Chosen & Advantages
*   **Active Transactions Only:** Connections are only assigned to the client when a transaction is actively executing. As soon as the transaction commits or rolls back, the physical PostgreSQL connection is released back into the pool.
*   **Scalability:** Allows a high number of concurrent client requests to share a small number of physical PostgreSQL connections, resolving the PostgreSQL connection limit issue.
*   **Reduced Overhead:** Drastically lowers memory and connection overhead on the PostgreSQL server, enabling smoother horizontal scaling under peak load.

### 3. Limitations & Tradeoffs
*   **Prepared Statements:** Transaction mode does not support server-side prepared statements because subsequent queries in the same statement prep phase might run on different database connections. 
    *   *Mitigation:* We append `pgbouncer=true` to the `DATABASE_URL` in `docker-compose.yml`, which instructs the Prisma engine to use client-side query compilation and avoid prepared statements.
*   **Migration Execution:** Database schema migrations (`prisma migrate`) require session-level locks and commands which are incompatible with transaction pool mode.
    *   *Mitigation:* We configure a direct database connection (`DIRECT_DATABASE_URL`) bypassing PgBouncer (connecting directly to port `5432` of the DB) via the `directUrl` parameter in `schema.prisma`.
*   **Session Pinning / Advisory Locks:** Features like Postgres advisory locks or user session variables are lost when the transaction completes, as the connection is reassigned. This application avoids session variables and relies on table-level/row-level locks (`SELECT ... FOR UPDATE`) within transaction blocks, which is fully compatible.

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

## **Backend Assessment Task** 

## **Project Scenario** 

You are building a backend service for a high-traffic grocery delivery platform where thousands of users may attempt to purchase the same inventory simultaneously during flash sales or peak traffic periods. 

The system must ensure: 

- inventory consistency, 

- safe concurrent transaction handling, 

- proper database connection management, 

- and reliable API behavior under load. 

## **Technical Requirements** 

Please use the following technologies: 

## **Mandatory** 

- Node.js 

- Express.js or Fastify 

- PostgreSQL 

- PgBouncer 

- Docker / Docker Compose 

## **Optional** 

- Redis 

- Prisma / Knex / Sequelize / TypeORM / Raw SQL 

- Queue systems if required 

## **Functional Requirement** 

You are required to build the following API: 

## **Reserve Inventory API** 

POST /reserve-item 

## **Request Payload** 

{ "userId": 1, "itemId": 101, "quantity": 2 } 

## **Database Structure** 

You may extend the schema if required. 

## **users** 

**Column Type** id integer name varchar wallet_balance numeric 

## **items** 

**Column Type** id integer name varchar stock integer price numeric 

## **reservations** 

**Column Type** 

id integer user_id integer item_id integer quantity integer status varchar created_a timestamp t 

## **Business Logic** 

When a reservation request is received: 

1. Validate item stock availability. 

2. Validate whether the user has sufficient wallet balance. 

3. Reserve inventory safely. 

4. Deduct the wallet balance. 

5. Create the reservation record. 

6. Ensure all operations are atomic. 

## **Important Expectations** 

The system must correctly handle: 

- concurrent requests, 

- race conditions, 

- transaction failures, 

- retry scenarios, 

- duplicate requests, 

- and PostgreSQL connection limits. 

## **Concurrency Scenario** 

Example: 

If 100 users attempt to reserve the last 5 items simultaneously: 

- stock must never become negative, 

- wallet deductions must remain accurate, 

- duplicate reservations must not occur, 

- and data consistency must always be maintained. 

## **Mandatory Technical Expectations** 

## **1. Database Transactions** 

The complete reservation flow must be transaction-safe. 

Please ensure proper rollback behavior in failure cases. 

## **2. Concurrency Handling** 

Implement an appropriate concurrency control mechanism such as: 

- SELECT ... FOR UPDATE 

- optimistic locking 

- advisory locks 

- or another justified approach. 

Please explain your chosen strategy. 

## **3. PgBouncer Integration** 

Configure PgBouncer within Docker Compose. 

Your README should explain: 

- which pool mode was selected, 

- why it was chosen, 

- expected advantages, 

- and any limitations/tradeoffs. 

## **4. Error & Failure Handling** 

Handle scenarios such as: 

- deadlocks, 

- transaction rollback, 

- database timeout, 

- unexpected process failures, 

- and invalid requests. 

## **5. Logging** 

Implement structured logs containing: 

- request identifiers, 

- API errors, 

- transaction failures, 

- and query timing where applicable. 

## **Bonus Points (Optional but Recommended)** 

The following additions will be considered strong indicators of senior-level experience. 

## **Idempotency Support** 

Prevent duplicate reservation creation when the same request is retried. 

Example: 

Idempotency-Key: abc123 

## **Load Testing** 

Add a simple load test using: 

- k6 

- autocannon 

- artillery 

- or similar tools. 

Simulate concurrent reservation traffic. 

## **Metrics Endpoint** 

Create: 

GET /metrics 

## Examples: 

- active DB connections, 

- pool usage, 

- average response time, 

- transaction failures, 

- or custom application metrics. 

## **Deliverables** 

Please submit: 

1. GitHub repository 

2. README documentation 

3. Setup instructions 

4. Architecture explanation 

5. Database schema/migrations 

6. Docker Compose configuration 

7. PgBouncer configuration 

8. Any assumptions or tradeoffs considered 


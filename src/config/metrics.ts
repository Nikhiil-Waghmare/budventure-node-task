import client from 'prom-client';

export const register = new client.Registry();

register.setDefaultLabels({
  app: 'grocery-reservation',
});

client.collectDefaultMetrics({ register });

export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 5, 15, 50, 100, 500],
});

export const dbQueryDurationMicroseconds = new client.Histogram({
  name: 'db_query_duration_ms',
  help: 'Duration of DB queries in ms',
  labelNames: ['query_type', 'table'],
  buckets: [0.1, 5, 15, 50, 100, 500],
});

export const activeDbConnections = new client.Gauge({
  name: 'db_active_connections',
  help: 'Number of active database connections',
});

export const reservationCounter = new client.Counter({
  name: 'reservation_count_total',
  help: 'Total number of reservations',
  labelNames: ['status'], 
});

register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(dbQueryDurationMicroseconds);
register.registerMetric(activeDbConnections);
register.registerMetric(reservationCounter);

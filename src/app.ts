import express from 'express';
import pinoHttp from 'pino-http';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { requestIdMiddleware } from './middleware/requestId';
import { logger } from './config/logger';
import { httpRequestDurationMicroseconds } from './config/metrics';

const app = express();

app.use(express.json());

// Request ID middleware
app.use(requestIdMiddleware);

// Pino logger middleware
app.use(
  pinoHttp({
    logger,
    customProps: (req, res) => ({
      requestId: (req as any).id,
    }),
  })
);

// Metrics middleware
app.use((req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const duration = diff[0] * 1000 + diff[1] / 1e6; // in ms
    httpRequestDurationMicroseconds
      .labels(req.method, req.route ? req.route.path : req.path, res.statusCode.toString())
      .observe(duration);
  });
  next();
});

// Mount routes
app.use('/', routes);

// Global Error Handler
app.use(errorHandler);

export default app;

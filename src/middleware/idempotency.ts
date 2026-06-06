import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';
import { logger } from '../config/logger';

export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (req.method !== 'POST' && req.method !== 'PATCH' && req.method !== 'PUT') {
    return next();
  }

  const idempotencyKey = req.headers['idempotency-key'];

  if (!idempotencyKey || typeof idempotencyKey !== 'string') {
    res.status(400).json({ error: 'Idempotency-Key header is required for this operation' });
    return;
  }

  try {
    const lockKey = `idempotency:lock:${idempotencyKey}`;
    const responseKey = `idempotency:${idempotencyKey}`;

    const lockAcquired = await redis.set(lockKey, 'processing', 'EX', 60, 'NX');

    if (lockAcquired) {
      req.idempotencyKey = idempotencyKey;
      return next();
    }

    const cachedResponse = await redis.get(responseKey);

    if (cachedResponse) {
      logger.info({ idempotencyKey }, 'Returning cached response for idempotent request');
      const { status, body } = JSON.parse(cachedResponse);
      res.status(status).json(body);
      return;
    }

    res.status(409).json({ error: 'Concurrent request is processing for this Idempotency-Key' });
    return;
  } catch (error) {
    logger.error({ error, idempotencyKey }, 'Error checking idempotency key');
    next(error);
  }
};

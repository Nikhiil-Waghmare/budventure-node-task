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
    const cachedResponse = await redis.get(`idempotency:${idempotencyKey}`);

    if (cachedResponse) {
      logger.info({ idempotencyKey }, 'Returning cached response for idempotent request');
      res.json(JSON.parse(cachedResponse));
      return;
    }

    // Attach key to request so the controller/service can save the response later
    req.idempotencyKey = idempotencyKey;
    next();
  } catch (error) {
    logger.error({ error, idempotencyKey }, 'Error checking idempotency key');
    next(error);
  }
};

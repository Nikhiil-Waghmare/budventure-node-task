import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { reservationService, ReservationError } from '../services/reservation.service';
import { idempotencyService } from '../services/idempotency.service';
import { reservationCounter } from '../config/metrics';

export const reserveItemSchema = z.object({
  body: z.object({
    userId: z.number().int().positive(),
    itemId: z.number().int().positive(),
    quantity: z.number().int().positive().min(1),
  }),
});

export const reserveItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, itemId, quantity } = req.body;
    
    const result = await reservationService.reserveItem({ userId, itemId, quantity });

    if (req.idempotencyKey) {
      await idempotencyService.saveResponse(req.idempotencyKey, 200, result);
    }

    reservationCounter.labels({ status: 'success' }).inc();
    
    res.status(200).json(result);
  } catch (error) {
    reservationCounter.labels({ status: 'failure' }).inc();

    if (error instanceof ReservationError) {
      const errorBody = { error: error.message };
      if (req.idempotencyKey) {
        await idempotencyService.saveResponse(req.idempotencyKey, error.statusCode, errorBody);
      }
      res.status(error.statusCode).json(errorBody);
      return;
    }

    if (req.idempotencyKey) {
      try {
        await idempotencyService.deleteLock(req.idempotencyKey);
      } catch (redisError) {
        req.log?.error({ err: redisError, idempotencyKey: req.idempotencyKey }, 'Failed to release idempotency lock after unexpected server error');
      }
    }

    next(error);
  }
};

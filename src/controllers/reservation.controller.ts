import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { reservationService, ReservationError } from '../services/reservation.service';
import { idempotencyService } from '../services/idempotency.service';
import { reservationCounter } from '../config/metrics';
import { logger } from '../config/logger';

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

    // Save response for idempotency
    if (req.idempotencyKey) {
      await idempotencyService.saveResponse(req.idempotencyKey, result);
    }

    reservationCounter.labels({ status: 'success' }).inc();
    
    res.status(200).json(result);
  } catch (error) {
    reservationCounter.labels({ status: 'failure' }).inc();

    if (error instanceof ReservationError) {
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    // Pass unexpected errors to global error handler
    next(error);
  }
};

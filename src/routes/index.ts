import { Router } from 'express';
import { reserveItem, reserveItemSchema } from '../controllers/reservation.controller';
import { getMetrics } from '../controllers/metrics.controller';
import { validate } from '../middleware/validate';
import { idempotencyMiddleware } from '../middleware/idempotency';

const router = Router();

router.post(
  '/reserve-item',
  idempotencyMiddleware,
  validate(reserveItemSchema),
  reserveItem
);

router.get('/metrics', getMetrics);

// Basic health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default router;

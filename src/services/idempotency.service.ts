import { redis } from '../config/redis';

const IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24; // 24 hours

export class IdempotencyService {
  async saveResponse(key: string, status: number, body: any): Promise<void> {
    const responseKey = `idempotency:${key}`;
    const lockKey = `idempotency:lock:${key}`;
    const payload = JSON.stringify({ status, body });
    
    // Save response and remove lock
    await redis.setex(responseKey, IDEMPOTENCY_TTL_SECONDS, payload);
    await redis.del(lockKey);
  }
}

export const idempotencyService = new IdempotencyService();

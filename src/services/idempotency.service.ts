import { redis } from '../config/redis';

const IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24; // 24 hours

export class IdempotencyService {
  async saveResponse(key: string, response: any): Promise<void> {
    await redis.setex(`idempotency:${key}`, IDEMPOTENCY_TTL_SECONDS, JSON.stringify(response));
  }
}

export const idempotencyService = new IdempotencyService();

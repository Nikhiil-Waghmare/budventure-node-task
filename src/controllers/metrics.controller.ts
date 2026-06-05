import { Request, Response } from 'express';
import { register } from '../config/metrics';
import { prisma } from '../config/prisma';

export const getMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    // We could update active connections metric here before returning
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  } catch (error) {
    res.status(500).send('Error generating metrics');
  }
};

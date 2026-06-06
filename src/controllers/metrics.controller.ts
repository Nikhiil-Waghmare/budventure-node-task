import { Request, Response } from 'express';
import { register } from '../config/metrics';
import { prisma } from '../config/prisma';

export const getMetrics = async (req: Request, res: Response): Promise<void> => {
  try {
    const customMetrics = await register.metrics();
    
    const prismaMetrics = await prisma.$metrics.prometheus();
    
    res.set('Content-Type', register.contentType);
    res.send(customMetrics + '\n' + prismaMetrics);
  } catch (error) {
    res.status(500).send('Error generating metrics');
  }
};

import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check if essential environment variables are set
    const requiredEnvVars = [
      'NEXTAUTH_SECRET',
      'DATABASE_URL',
      'GOOGLE_CLIENT_ID',
      'STRIPE_SECRET_KEY'
    ];

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: 'healthy',
        environment: missingEnvVars.length === 0 ? 'healthy' : 'degraded',
        authentication: process.env.NEXTAUTH_SECRET ? 'healthy' : 'unhealthy',
        stripe: process.env.STRIPE_SECRET_KEY ? 'healthy' : 'unhealthy'
      },
      missingEnvVars: missingEnvVars.length > 0 ? missingEnvVars : undefined
    };

    // Return 503 if critical components are unhealthy
    const isHealthy = healthStatus.checks.database === 'healthy' && 
                      healthStatus.checks.authentication === 'healthy';

    res.status(isHealthy ? 200 : 503).json(healthStatus);

  } catch (error) {
    console.error('Health check failed:', error);
    
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      checks: {
        database: 'unhealthy',
        environment: 'unknown',
        authentication: 'unknown',
        stripe: 'unknown'
      }
    });
  }
}
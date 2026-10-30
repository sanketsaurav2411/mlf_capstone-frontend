import { Response, NextFunction } from 'express';
import { createDemoRequest } from '../services/demoService';
import { AuthRequest } from '../middleware/auth';

export async function requestDemo(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, email, company, message } = req.body;
    const requestedBy = req.user?.sub || 'public-guest';

    const demoRequest = createDemoRequest({
      name,
      email,
      company,
      message,
      requestedBy,
    });

    return res.status(201).json({
      success: true,
      message: 'Demo request submitted successfully',
      data: demoRequest,
    });
  } catch (error) {
    return next(error);
  }
}

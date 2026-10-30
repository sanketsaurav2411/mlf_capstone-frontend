import { Request, Response, NextFunction } from 'express';
import { signToken } from '../lib/jwt';
import { AppError } from '../lib/errors';
import { verifyCredentials, getUserById, serializeUser } from '../services/authService';
import { AuthRequest } from '../middleware/auth';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const user = await verifyCredentials(email, password);
    if (!user) {
      return next(new AppError('Invalid email or password', 401));
    }

    const token = signToken({ sub: user.id, email: user.email, name: user.name });
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: serializeUser(user),
        token,
      },
    });
  } catch (error) {
    return next(error);
  }
}

export function logout(req: Request, res: Response) {
  return res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
}

export function getMe(req: AuthRequest, res: Response) {
  const user = getUserById(req.user?.sub);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  return res.status(200).json({
    success: true,
    data: {
      user: serializeUser(user),
    },
  });
}

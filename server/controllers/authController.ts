import { Request, Response, NextFunction } from 'express';
import { signToken } from '../lib/jwt';
import { AppError } from '../lib/errors';
import { verifyCredentials, getUserById, serializeUser, upsertGoogleUser } from '../services/authService';
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

export async function loginWithGoogle(req: Request, res: Response, next: NextFunction) {
  try {
    let email = req.body.email;
    let name = req.body.name;
    let picture = req.body.picture || req.body.avatar;

    // Handle Google Identity Services credential JWT if provided
    if (req.body.credential && typeof req.body.credential === 'string') {
      try {
        const parts = req.body.credential.split('.');
        if (parts.length === 3) {
          const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
          const payload = JSON.parse(payloadJson);
          if (payload.email) {
            email = payload.email;
            name = name || payload.name;
            picture = picture || payload.picture;
          }
        }
      } catch (err) {
        console.warn('Failed to parse Google credential token:', err);
      }
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return next(new AppError('A valid Google account email is required for authentication', 400));
    }

    const user = await upsertGoogleUser(email, name, picture);
    const token = signToken({ sub: user.id, email: user.email, name: user.name });

    return res.status(200).json({
      success: true,
      message: 'Google authentication successful',
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

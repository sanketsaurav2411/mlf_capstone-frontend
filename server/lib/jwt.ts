import jwt from 'jsonwebtoken';
import { jwtSecret } from '../config';

export function signToken(payload: object): string {
  return jwt.sign(payload, jwtSecret, { expiresIn: '7d' });
}

export function verifyToken(token: string): any {
  return jwt.verify(token, jwtSecret);
}

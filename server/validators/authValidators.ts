import { body, header } from 'express-validator';

export const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain at least one letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number'),
];

export const logoutValidator = [
  header('authorization')
    .optional()
    .matches(/^Bearer\s.+$/)
    .withMessage('Authorization header must be in Bearer token format'),
];

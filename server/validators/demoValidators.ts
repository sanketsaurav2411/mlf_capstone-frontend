import { body } from 'express-validator';

export const demoRequestValidator = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('company').optional().trim().isLength({ min: 2, max: 150 }).withMessage('Company must be between 2 and 150 characters'),
  body('message').trim().isLength({ min: 10, max: 1000 }).withMessage('Message must be between 10 and 1000 characters'),
];

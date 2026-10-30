import { body } from 'express-validator';

export const chatValidator = [
  body('message')
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters'),
  body('conversationId')
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage('Conversation ID must be a valid string'),
];

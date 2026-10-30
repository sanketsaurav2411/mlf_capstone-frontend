import { Router } from 'express';
import multer from 'multer';
import fs from 'fs';
import { handleValidationErrors } from '../lib/validation';
import { AppError } from '../lib/errors';
import { requireAuth } from '../middleware/auth';
import { uploadDir, maxUploadSize } from '../config';
import {
  processChat,
  listConversations,
  getConversation,
  createConversationHandler,
  deleteConversationHandler,
  updateConversationHandler,
} from '../controllers/chatController';
import { chatValidator } from '../validators/chatValidators';

const router = Router();

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: maxUploadSize,
    files: 3,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/json',
      'text/csv',
      'image/png',
      'image/jpeg',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(
        new AppError(
          'Unsupported file type. Allowed types: PDF, DOC/DOCX, XLS/XLSX, TXT, CSV, JSON, PNG, JPG',
          400
        )
      );
    }
    cb(null, true);
  },
});

// Conversation memory endpoints
router.get('/conversations', requireAuth, listConversations);
router.post('/conversations', requireAuth, createConversationHandler);
router.get('/conversations/:id', requireAuth, getConversation);
router.patch('/conversations/:id', requireAuth, updateConversationHandler);
router.delete('/conversations/:id', requireAuth, deleteConversationHandler);

// Chat execution within conversation
router.post(
  '/chat',
  requireAuth,
  upload.array('files', 3),
  chatValidator,
  handleValidationErrors,
  processChat
);

export default router;

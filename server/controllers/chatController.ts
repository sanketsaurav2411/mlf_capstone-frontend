import { Response, NextFunction } from 'express';
import {
  getUserConversations,
  getConversationById,
  createConversation,
  deleteConversation,
  addMessageToConversation,
} from '../services/chatService';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../lib/errors';

export async function listConversations(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const conversations = getUserConversations(userId);
    return res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    return next(error);
  }
}

export async function getConversation(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.sub;
    const { id } = req.params;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const conversation = getConversationById(userId, id);
    if (!conversation) {
      return next(new AppError('Conversation not found', 404));
    }

    return res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    return next(error);
  }
}

export async function createConversationHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.sub;
    const { title } = req.body;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const conversation = createConversation(userId, title);
    return res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      data: conversation,
    });
  } catch (error) {
    return next(error);
  }
}

export async function deleteConversationHandler(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.sub;
    const { id } = req.params;

    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const deleted = deleteConversation(userId, id);
    if (!deleted) {
      return next(new AppError('Conversation not found or already deleted', 404));
    }

    return res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully',
    });
  } catch (error) {
    return next(error);
  }
}

export async function processChat(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return next(new AppError('User not authenticated', 401));
    }

    const { message = '', conversationId } = req.body;
    const files = (req as any).files || [];

    const result = addMessageToConversation({
      userId,
      conversationId,
      message,
      files,
    });

    return res.status(200).json({
      success: true,
      message: 'Chat processed successfully',
      data: {
        conversationId: result.conversation.id,
        conversationTitle: result.conversation.title,
        userMessage: result.userMessage,
        botMessage: result.botMessage,
        reply: result.botMessage.text,
        messages: result.conversation.messages,
      },
    });
  } catch (error) {
    return next(error);
  }
}

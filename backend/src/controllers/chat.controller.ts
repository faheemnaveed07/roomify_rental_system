import { Request, Response, NextFunction } from 'express';
import ChatService from '../services/ChatService';

export const getConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await ChatService.getConversations({ userId, page, limit });

        res.status(200).json({
            success: true,
            data: result.conversations,
            meta: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const getConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { conversationId } = req.params;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const conversation = await ChatService.getConversationById(conversationId, userId);

        if (!conversation) {
            res.status(404).json({ success: false, message: 'Conversation not found' });
            return;
        }

        res.status(200).json({
            success: true,
            data: conversation,
        });
    } catch (error) {
        next(error);
    }
};

export const getMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { conversationId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const result = await ChatService.getMessages({ conversationId, userId, page, limit });

        res.status(200).json({
            success: true,
            data: result.messages,
            meta: {
                total: result.total,
                page: result.page,
                limit: result.limit,
                totalPages: result.totalPages,
            },
        });
    } catch (error) {
        next(error);
    }
};

export const sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const { conversationId, receiverId, propertyId, content, messageType, attachments } = req.body;

        if (!content || !receiverId) {
            res.status(400).json({ success: false, message: 'Content and receiverId are required' });
            return;
        }

        const message = await ChatService.sendMessage({
            conversationId,
            senderId: userId,
            receiverId,
            propertyId,
            content,
            messageType,
            attachments,
        });

        res.status(201).json({
            success: true,
            data: message,
        });
    } catch (error) {
        next(error);
    }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        const { conversationId } = req.params;

        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        await ChatService.markMessagesAsRead(conversationId, userId);

        res.status(200).json({
            success: true,
            message: 'Messages marked as read',
        });
    } catch (error) {
        next(error);
    }
};

export const getUnreadCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const count = await ChatService.getUnreadCount(userId);

        res.status(200).json({
            success: true,
            data: { unreadCount: count },
        });
    } catch (error) {
        next(error);
    }
};

export const startPropertyInquiry = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.user?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }

        const { landlordId, propertyId, message } = req.body;

        if (!landlordId || !propertyId || !message) {
            res.status(400).json({ 
                success: false, 
                message: 'landlordId, propertyId, and message are required' 
            });
            return;
        }

        const result = await ChatService.startPropertyInquiry(userId, landlordId, propertyId, message);

        res.status(201).json({
            success: true,
            data: {
                conversation: result.conversation,
                message: result.message,
            },
        });
    } catch (error) {
        next(error);
    }
};

export default {
    getConversations,
    getConversation,
    getMessages,
    sendMessage,
    markAsRead,
    getUnreadCount,
    startPropertyInquiry,
};

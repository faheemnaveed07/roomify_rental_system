import { Router, RequestHandler } from 'express';
import chatController from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All chat routes require authentication
router.use(authenticate);

// Conversations
router.get('/conversations', chatController.getConversations as RequestHandler);
router.get('/conversations/:conversationId', chatController.getConversation as RequestHandler);
router.get('/conversations/:conversationId/messages', chatController.getMessages as RequestHandler);
router.post('/conversations/:conversationId/read', chatController.markAsRead as RequestHandler);

// Messages
router.post('/messages', chatController.sendMessage as RequestHandler);

// Unread count
router.get('/unread', chatController.getUnreadCount as RequestHandler);

// Start property inquiry (tenant contacting landlord about property)
router.post('/inquiry', chatController.startPropertyInquiry as RequestHandler);

export default router;

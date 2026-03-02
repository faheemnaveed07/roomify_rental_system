import { Server as HttpServer } from 'http';
import { Server, Socket, ServerOptions } from 'socket.io';
import { env } from './environment';
import { logger } from '../utils/logger';
import ChatService from '../services/ChatService';
import { MessageType } from '../models/Message';

export interface SocketUser {
    id: string;
    socketId: string;
    userId: string;
}

interface ChatMessageData {
    conversationId?: string;
    receiverId: string;
    propertyId?: string;
    content: string;
    messageType?: MessageType;
    attachments?: {
        url: string;
        type: 'image' | 'document';
        name: string;
        size: number;
    }[];
}

interface TypingData {
    conversationId: string;
    isTyping: boolean;
}

const connectedUsers: Map<string, SocketUser> = new Map();

const socketOptions: Partial<ServerOptions> = {
    cors: {
        origin: [
            env.FRONTEND_URL,
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:3002',
            'http://localhost:5173',
        ].filter(Boolean),
        methods: ['GET', 'POST'],
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
};

let ioInstance: Server | null = null;

export const initializeSocket = (httpServer: HttpServer): Server => {
    const io = new Server(httpServer, socketOptions);
    ioInstance = io;

    io.on('connection', (socket: Socket) => {
        logger.info(`Socket connected: ${socket.id}`);

        // User joins with their user ID
        socket.on('user:join', (userId: string) => {
            const user: SocketUser = {
                id: userId,
                socketId: socket.id,
                userId,
            };
            connectedUsers.set(userId, user);
            socket.join(`user:${userId}`);
            logger.info(`User ${userId} joined with socket ${socket.id}`);
            
            // Notify user is online
            io.emit('user:online', { userId, online: true });
        });

        // Subscribe to property updates
        socket.on('property:subscribe', (propertyId: string) => {
            socket.join(`property:${propertyId}`);
            logger.info(`Socket ${socket.id} subscribed to property ${propertyId}`);
        });

        socket.on('property:unsubscribe', (propertyId: string) => {
            socket.leave(`property:${propertyId}`);
            logger.info(`Socket ${socket.id} unsubscribed from property ${propertyId}`);
        });

        // Join conversation room
        socket.on('chat:join', (conversationId: string) => {
            socket.join(`conversation:${conversationId}`);
            logger.info(`Socket ${socket.id} joined conversation ${conversationId}`);
        });

        // Leave conversation room
        socket.on('chat:leave', (conversationId: string) => {
            socket.leave(`conversation:${conversationId}`);
            logger.info(`Socket ${socket.id} left conversation ${conversationId}`);
        });

        // Send message
        socket.on('chat:send', async (data: ChatMessageData & { senderId: string }, callback?: (response: { ok: boolean; error?: string; messageId?: string; conversationId?: string }) => void) => {
            try {
                const message = await ChatService.sendMessage({
                    conversationId: data.conversationId,
                    senderId: data.senderId,
                    receiverId: data.receiverId,
                    propertyId: data.propertyId,
                    content: data.content,
                    messageType: data.messageType,
                    attachments: data.attachments,
                });

                // Get conversation ID
                const conversationId = message.conversation.toString();

                // Emit to conversation room
                io.to(`conversation:${conversationId}`).emit('chat:message', {
                    message,
                    conversationId,
                });

                // Also emit to receiver's user room (in case they're not in the conversation room)
                io.to(`user:${data.receiverId}`).emit('chat:new-message', {
                    message,
                    conversationId,
                });

                logger.info(`Message sent via socket in conversation ${conversationId}`);
                callback?.({ ok: true, messageId: message._id?.toString(), conversationId });
            } catch (error) {
                logger.error('Socket chat:send error', error as Error);
                socket.emit('chat:error', { message: 'Failed to send message' });
                callback?.({ ok: false, error: 'Failed to send message' });
            }
        });

        // Typing indicator
        socket.on('chat:typing', (data: TypingData & { userId: string }) => {
            socket.to(`conversation:${data.conversationId}`).emit('chat:typing', {
                conversationId: data.conversationId,
                userId: data.userId,
                isTyping: data.isTyping,
            });
        });

        // Mark messages as read
        socket.on('chat:read', async (data: { conversationId: string; userId: string }) => {
            try {
                await ChatService.markMessagesAsRead(data.conversationId, data.userId);
                
                // Notify other participants
                socket.to(`conversation:${data.conversationId}`).emit('chat:read-receipt', {
                    conversationId: data.conversationId,
                    userId: data.userId,
                    readAt: new Date(),
                });
            } catch (error) {
                logger.error('Socket chat:read error', error as Error);
            }
        });

        // Payment notifications
        socket.on('payment:subscribe', (userId: string) => {
            socket.join(`payment:${userId}`);
            logger.info(`Socket ${socket.id} subscribed to payment notifications for user ${userId}`);
        });

        socket.on('disconnect', () => {
            const user = Array.from(connectedUsers.values()).find((u) => u.socketId === socket.id);
            if (user) {
                connectedUsers.delete(user.userId);
                // Notify user is offline
                io.emit('user:online', { userId: user.userId, online: false });
                logger.info(`User ${user.userId} disconnected`);
            }
            logger.info(`Socket disconnected: ${socket.id}`);
        });
    });

    return io;
};

export const emitToUser = (io: Server, userId: string, event: string, data: unknown): void => {
    io.to(`user:${userId}`).emit(event, data);
};

export const emitToProperty = (io: Server, propertyId: string, event: string, data: unknown): void => {
    io.to(`property:${propertyId}`).emit(event, data);
};

export const emitToConversation = (conversationId: string, event: string, data: unknown): void => {
    if (ioInstance) {
        ioInstance.to(`conversation:${conversationId}`).emit(event, data);
    }
};

export const emitPaymentNotification = (userId: string, event: string, data: unknown): void => {
    if (ioInstance) {
        ioInstance.to(`user:${userId}`).emit(event, data);
        ioInstance.to(`payment:${userId}`).emit(event, data);
    }
};

export const getConnectedUsers = (): Map<string, SocketUser> => connectedUsers;

export const isUserOnline = (userId: string): boolean => connectedUsers.has(userId);

export const getIO = (): Server | null => ioInstance;

export default { 
    initializeSocket, 
    emitToUser, 
    emitToProperty, 
    emitToConversation,
    emitPaymentNotification,
    getConnectedUsers,
    isUserOnline,
    getIO,
};

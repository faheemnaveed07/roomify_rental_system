import { Server as HttpServer } from 'http';
import { Server, Socket, ServerOptions } from 'socket.io';
import { logger } from '../utils/logger';
import { isAllowedOrigin } from '../utils/origins';
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
    /** Stable across the client's retries of one send. */
    clientMessageId?: string;
}

interface TypingData {
    conversationId: string;
    isTyping: boolean;
}

/**
 * userId → the socket ids that user currently holds.
 *
 * One user routinely has several sockets open at once (the messages list and an
 * open chat window each create their own). Keying by userId alone meant the
 * newest socket overwrote the previous one and closing ANY of them marked the
 * user offline everywhere — peers saw "Offline" and the backend even sent them
 * "you missed a message" email while they were sitting in the app.
 */
const connectedUsers: Map<string, Set<string>> = new Map();

const socketOptions: Partial<ServerOptions> = {
    cors: {
        origin: (origin, callback) => {
            callback(null, isAllowedOrigin(origin));
        },
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
            const sockets = connectedUsers.get(userId) ?? new Set<string>();
            const wasOffline = sockets.size === 0;
            sockets.add(socket.id);
            connectedUsers.set(userId, sockets);
            socket.join(`user:${userId}`);
            logger.info(`User ${userId} joined with socket ${socket.id}`);

            // Presence was broadcast-only, so a socket that connected after its
            // peer was already online never learned about them and showed
            // "Offline" forever. Hand the joiner the current roster.
            socket.emit('user:online-list', {
                userIds: Array.from(connectedUsers.keys()).filter((id) => id !== userId),
            });

            if (wasOffline) {
                io.emit('user:online', { userId, online: true });
            }
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
                    clientMessageId: data.clientMessageId,
                });

                // Get conversation ID
                const conversationId = message.conversation.toString();

                // Emit to conversation room
                io.to(`conversation:${conversationId}`).emit('chat:message', {
                    message,
                    conversationId,
                });

                // Both sides need this: the receiver to be notified at all, and
                // the SENDER so their own conversation list moves the thread to
                // the top with the new preview. Without the sender copy their
                // sidebar kept showing the previous message until a reload.
                io.to(`user:${data.receiverId}`).emit('chat:new-message', {
                    message,
                    conversationId,
                });
                io.to(`user:${data.senderId}`).emit('chat:new-message', {
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
            for (const [userId, sockets] of connectedUsers) {
                if (!sockets.delete(socket.id)) continue;

                // Offline only once the user's LAST socket is gone.
                if (sockets.size === 0) {
                    connectedUsers.delete(userId);
                    io.emit('user:online', { userId, online: false });
                    logger.info(`User ${userId} disconnected`);
                }
                break;
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

export const emitAgreementNotification = (userId: string, event: string, data: unknown): void => {
    if (ioInstance) {
        ioInstance.to(`user:${userId}`).emit(event, data);
    }
};

/** userId → their live socket ids. A user is online while this set is non-empty. */
export const getConnectedUsers = (): Map<string, Set<string>> => connectedUsers;

export const isUserOnline = (userId: string): boolean => connectedUsers.has(userId);

export const getIO = (): Server | null => ioInstance;

export default { 
    initializeSocket, 
    emitToUser, 
    emitToProperty, 
    emitToConversation,
    emitPaymentNotification,
    emitAgreementNotification,
    getConnectedUsers,
    isUserOnline,
    getIO,
};

import { Server as HttpServer } from 'http';
import { Server, Socket, ServerOptions } from 'socket.io';
import { env } from './environment';
import { logger } from '../utils/logger';

export interface SocketUser {
    id: string;
    socketId: string;
    userId: string;
}

const connectedUsers: Map<string, SocketUser> = new Map();

const socketOptions: Partial<ServerOptions> = {
    cors: {
        origin: env.FRONTEND_URL,
        methods: ['GET', 'POST'],
        credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
};

export const initializeSocket = (httpServer: HttpServer): Server => {
    const io = new Server(httpServer, socketOptions);

    io.on('connection', (socket: Socket) => {
        logger.info(`Socket connected: ${socket.id}`);

        socket.on('user:join', (userId: string) => {
            const user: SocketUser = {
                id: userId,
                socketId: socket.id,
                userId,
            };
            connectedUsers.set(userId, user);
            socket.join(`user:${userId}`);
            logger.info(`User ${userId} joined with socket ${socket.id}`);
        });

        socket.on('property:subscribe', (propertyId: string) => {
            socket.join(`property:${propertyId}`);
            logger.info(`Socket ${socket.id} subscribed to property ${propertyId}`);
        });

        socket.on('property:unsubscribe', (propertyId: string) => {
            socket.leave(`property:${propertyId}`);
            logger.info(`Socket ${socket.id} unsubscribed from property ${propertyId}`);
        });

        socket.on('disconnect', () => {
            const user = Array.from(connectedUsers.values()).find((u) => u.socketId === socket.id);
            if (user) {
                connectedUsers.delete(user.userId);
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

export const getConnectedUsers = (): Map<string, SocketUser> => connectedUsers;

export default { initializeSocket, emitToUser, emitToProperty, getConnectedUsers };

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

interface UseSocketOptions {
    userId?: string;
    autoConnect?: boolean;
}

interface TypingData {
    conversationId: string;
    userId: string;
    isTyping: boolean;
}

interface MessageData {
    message: any;
    conversationId: string;
}

interface ReadReceiptData {
    conversationId: string;
    userId: string;
    readAt: Date;
}

interface UserOnlineData {
    userId: string;
    online: boolean;
}

export const useSocket = (options: UseSocketOptions = {}) => {
    const { userId, autoConnect = true } = options;
    const socketRef = useRef<Socket | null>(null);
    const joinedConversationsRef = useRef<Set<string>>(new Set());
    const [isConnected, setIsConnected] = useState(false);
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!autoConnect) return;

        const socket = io(SOCKET_URL, {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
            console.log('Socket connected:', socket.id);
            
            // Join user room if userId provided
            if (userId) {
                socket.emit('user:join', userId);
            }

            // Rejoin conversation rooms after reconnect
            joinedConversationsRef.current.forEach((conversationId) => {
                socket.emit('chat:join', conversationId);
            });
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
            console.log('Socket disconnected');
        });

        socket.on('user:online', (data: UserOnlineData) => {
            setOnlineUsers(prev => {
                const newSet = new Set(prev);
                if (data.online) {
                    newSet.add(data.userId);
                } else {
                    newSet.delete(data.userId);
                }
                return newSet;
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [userId, autoConnect]);

    // Join a conversation room
    const joinConversation = useCallback((conversationId: string) => {
        joinedConversationsRef.current.add(conversationId);
        socketRef.current?.emit('chat:join', conversationId);
    }, []);

    // Leave a conversation room
    const leaveConversation = useCallback((conversationId: string) => {
        joinedConversationsRef.current.delete(conversationId);
        socketRef.current?.emit('chat:leave', conversationId);
    }, []);

    const emitWithAck = useCallback((event: string, payload: unknown, timeoutMs: number) => {
        return new Promise<{ ok: boolean; error?: string; messageId?: string; conversationId?: string }>((resolve, reject) => {
            const socket = socketRef.current;
            if (!socket) {
                reject(new Error('Socket not connected'));
                return;
            }

            let timeoutId: ReturnType<typeof setTimeout> | null = null;
            timeoutId = setTimeout(() => {
                timeoutId = null;
                reject(new Error('Socket ack timeout'));
            }, timeoutMs);

            socket.emit(event, payload, (response: { ok: boolean; error?: string; messageId?: string; conversationId?: string }) => {
                if (timeoutId) {
                    clearTimeout(timeoutId);
                }
                if (response?.ok) {
                    resolve(response);
                } else {
                    reject(new Error(response?.error || 'Socket request failed'));
                }
            });
        });
    }, []);

    // Send a message
    const sendMessage = useCallback((data: {
        conversationId?: string;
        senderId: string;
        receiverId: string;
        propertyId?: string;
        content: string;
    }) => {
        socketRef.current?.emit('chat:send', data);
    }, []);

    const sendMessageWithRetry = useCallback(async (
        data: {
            conversationId?: string;
            senderId: string;
            receiverId: string;
            propertyId?: string;
            content: string;
        },
        options: { retries?: number; timeoutMs?: number; retryDelayMs?: number } = {}
    ) => {
        const { retries = 2, timeoutMs = 3000, retryDelayMs = 800 } = options;
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= retries; attempt += 1) {
            try {
                return await emitWithAck('chat:send', data, timeoutMs);
            } catch (error) {
                lastError = error as Error;
                if (attempt < retries) {
                    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
                }
            }
        }

        throw lastError || new Error('Failed to send message');
    }, [emitWithAck]);

    // Send typing indicator
    const sendTyping = useCallback((data: { conversationId: string; userId: string; isTyping: boolean }) => {
        socketRef.current?.emit('chat:typing', data);
    }, []);

    // Mark messages as read
    const markAsRead = useCallback((data: { conversationId: string; userId: string }) => {
        socketRef.current?.emit('chat:read', data);
    }, []);

    // Subscribe to new messages
    const onNewMessage = useCallback((callback: (data: MessageData) => void) => {
        socketRef.current?.on('chat:message', callback);
        socketRef.current?.on('chat:new-message', callback);
        return () => {
            socketRef.current?.off('chat:message', callback);
            socketRef.current?.off('chat:new-message', callback);
        };
    }, []);

    // Subscribe to typing events
    const onTyping = useCallback((callback: (data: TypingData) => void) => {
        socketRef.current?.on('chat:typing', callback);
        return () => {
            socketRef.current?.off('chat:typing', callback);
        };
    }, []);

    // Subscribe to read receipts
    const onReadReceipt = useCallback((callback: (data: ReadReceiptData) => void) => {
        socketRef.current?.on('chat:read-receipt', callback);
        return () => {
            socketRef.current?.off('chat:read-receipt', callback);
        };
    }, []);

    // Subscribe to payment notifications
    const subscribeToPayments = useCallback((userId: string) => {
        socketRef.current?.emit('payment:subscribe', userId);
    }, []);

    const onPaymentNotification = useCallback((callback: (data: any) => void) => {
        socketRef.current?.on('payment:update', callback);
        return () => {
            socketRef.current?.off('payment:update', callback);
        };
    }, []);

    // Check if user is online
    const isUserOnline = useCallback((userId: string) => onlineUsers.has(userId), [onlineUsers]);

    return {
        socket: socketRef.current,
        isConnected,
        onlineUsers,
        joinConversation,
        leaveConversation,
        sendMessage,
        sendMessageWithRetry,
        sendTyping,
        markAsRead,
        onNewMessage,
        onTyping,
        onReadReceipt,
        subscribeToPayments,
        onPaymentNotification,
        isUserOnline,
    };
};

export default useSocket;

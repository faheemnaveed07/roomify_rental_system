import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001';

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
            // Cross-domain (Vercel frontend -> Hugging Face backend): send the
            // auth cookie on the handshake and allow polling fallback if the
            // WebSocket upgrade is blocked by an intermediate proxy.
            withCredentials: true,
            transports: ['websocket', 'polling'],
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

        // Who was already online before we connected. Without this the roster
        // only ever grew from live join events, so a peer who signed in first
        // showed as Offline for the whole session.
        socket.on('user:online-list', (data: { userIds: string[] }) => {
            setOnlineUsers(prev => new Set([...prev, ...data.userIds]));
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

        // One id for all attempts at this message. A slow ack (rather than a
        // lost send) used to store the message once per retry, so it appeared
        // two or three times in both threads.
        const payload = {
            ...data,
            clientMessageId:
                globalThis.crypto?.randomUUID?.() ??
                `${data.senderId}-${Date.now()}-${Math.round(Math.random() * 1e9)}`,
        };

        for (let attempt = 0; attempt <= retries; attempt += 1) {
            try {
                return await emitWithAck('chat:send', payload, timeoutMs);
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

    // Agreement notifications (delivered to the user:<id> room the socket joins
    // on connect). Fires for both "tenant signed, awaiting your signature" and
    // "fully executed" — the caller distinguishes via the `event` argument.
    const onAgreementNotification = useCallback(
        (callback: (event: 'agreement:awaiting-signature' | 'agreement:executed', data: any) => void) => {
            const awaiting = (data: any) => callback('agreement:awaiting-signature', data);
            const executed = (data: any) => callback('agreement:executed', data);
            socketRef.current?.on('agreement:awaiting-signature', awaiting);
            socketRef.current?.on('agreement:executed', executed);
            return () => {
                socketRef.current?.off('agreement:awaiting-signature', awaiting);
                socketRef.current?.off('agreement:executed', executed);
            };
        },
        []
    );

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
        onAgreementNotification,
        isUserOnline,
    };
};

export default useSocket;

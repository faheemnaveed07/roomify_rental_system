import React, { useEffect, useState, useRef } from 'react';
import { useChatStore } from '../../store/chat.store';
import { useSocket } from '../../hooks/useSocket';
import { useAuthStore } from '../../store/auth.store';
import { ASSETS_URL } from '../../services/api';
import { Send, ArrowLeft, User as UserIcon, Check, CheckCheck } from 'lucide-react';
import Button from '../atoms/Button';

interface ChatWindowProps {
    conversationId: string;
    onBack?: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId, onBack }) => {
    const { user } = useAuthStore();
    const { 
        currentConversation, 
        messages, 
        fetchMessages, 
        addMessage, 
        markAsRead,
        typingUsers,
        setTyping,
        loading 
    } = useChatStore();
    
    const { 
        joinConversation, 
        leaveConversation, 
        sendMessageWithRetry,
        sendTyping,
        onNewMessage,
        onTyping,
        isUserOnline,
    } = useSocket({ userId: user?.id });

    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Get the other participant
    const otherParticipant = currentConversation?.participants?.find(
        (p: any) => p._id !== user?.id
    );

    useEffect(() => {
        if (conversationId) {
            fetchMessages(conversationId);
            joinConversation(conversationId);
            
            // Mark as read
            if (user?.id) {
                markAsRead(conversationId);
            }
        }

        return () => {
            if (conversationId) {
                leaveConversation(conversationId);
            }
        };
    }, [conversationId]);

    // Subscribe to new messages
    useEffect(() => {
        const unsubMessage = onNewMessage((data) => {
            if (data.conversationId === conversationId) {
                addMessage(data.message);
                // Mark as read since we're viewing
                if (user?.id && data.message.receiver?._id === user.id) {
                    markAsRead(conversationId);
                }
            }
        });

        const unsubTyping = onTyping((data) => {
            if (data.conversationId === conversationId) {
                setTyping(conversationId, data.userId, data.isTyping);
            }
        });

        return () => {
            unsubMessage();
            unsubTyping();
        };
    }, [conversationId, user?.id]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !otherParticipant || !user?.id) return;

        setSending(true);
        try {
            await sendMessageWithRetry({
                conversationId,
                senderId: user.id,
                receiverId: otherParticipant._id,
                content: newMessage.trim(),
            }, { retries: 2, timeoutMs: 3000, retryDelayMs: 800 });
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setSending(false);
        }
    };

    const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMessage(e.target.value);

        if (!user?.id) return;

        // Send typing indicator
        sendTyping({ conversationId, userId: user.id, isTyping: true });

        // Clear previous timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Stop typing after 2 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            sendTyping({ conversationId, userId: user.id, isTyping: false });
        }, 2000);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const isTyping = typingUsers[conversationId]?.length > 0;

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 border-b border-neutral-100">
                {onBack && (
                    <button onClick={onBack} className="p-2 hover:bg-neutral-100 rounded-full" title="Go back">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}
                <div className="relative">
                    {otherParticipant?.avatar ? (
                        <img
                            src={otherParticipant.avatar.startsWith('/uploads/') 
                                ? `${ASSETS_URL}${otherParticipant.avatar}` 
                                : otherParticipant.avatar}
                            alt={`${otherParticipant.firstName} ${otherParticipant.lastName}`}
                            className="w-10 h-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <UserIcon className="w-5 h-5 text-primary-600" />
                        </div>
                    )}
                    {otherParticipant && isUserOnline(otherParticipant._id) && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                    )}
                </div>
                <div className="flex-1">
                    <h3 className="font-semibold text-neutral-900">
                        {otherParticipant?.firstName} {otherParticipant?.lastName}
                    </h3>
                    {isTyping ? (
                        <p className="text-sm text-primary-600">Typing...</p>
                    ) : (
                        <p className="text-sm text-neutral-500">
                            {otherParticipant && isUserOnline(otherParticipant._id) ? 'Online' : 'Offline'}
                        </p>
                    )}
                </div>
                {currentConversation?.property && (
                    <div className="text-right">
                        <p className="text-sm text-neutral-500">Property</p>
                        <p className="text-sm font-medium truncate max-w-[150px]">
                            {currentConversation.property.title}
                        </p>
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading && messages.length === 0 ? (
                    <div className="text-center text-neutral-500 py-8">Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-neutral-500 py-8">
                        No messages yet. Start the conversation!
                    </div>
                ) : (
                    messages.map((message) => {
                        const isOwn = message.sender?._id === user?.id;
                        return (
                            <div
                                key={message._id}
                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                                        isOwn
                                            ? 'bg-primary-600 text-white rounded-br-sm'
                                            : 'bg-neutral-100 text-neutral-900 rounded-bl-sm'
                                    }`}
                                >
                                    <p className="break-words">{message.content}</p>
                                    <div className={`flex items-center gap-1 mt-1 text-xs ${
                                        isOwn ? 'text-primary-200' : 'text-neutral-400'
                                    }`}>
                                        <span>{formatTime(message.createdAt)}</span>
                                        {isOwn && (
                                            message.isRead ? (
                                                <CheckCheck className="w-4 h-4" />
                                            ) : (
                                                <Check className="w-4 h-4" />
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-neutral-100">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={handleTyping}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 rounded-full border border-neutral-200 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                        disabled={sending}
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="!rounded-full !p-3"
                    >
                        <Send className="w-5 h-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ChatWindow;

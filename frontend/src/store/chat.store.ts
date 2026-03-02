import { create } from 'zustand';
import { chatService } from '../services/api';

interface Message {
    _id: string;
    conversation: string;
    sender: any;
    receiver: any;
    content: string;
    messageType: string;
    isRead: boolean;
    readAt?: Date;
    attachments?: any[];
    createdAt: string;
}

interface Conversation {
    _id: string;
    participants: any[];
    property?: any;
    booking?: any;
    lastMessage?: Message;
    lastMessageAt?: string;
    unreadCount: { [key: string]: number };
    isActive: boolean;
}

interface ChatState {
    conversations: Conversation[];
    currentConversation: Conversation | null;
    messages: Message[];
    unreadCount: number;
    loading: boolean;
    error: string | null;
    typingUsers: { [conversationId: string]: string[] };
    
    // Actions
    fetchConversations: () => Promise<void>;
    fetchMessages: (conversationId: string) => Promise<void>;
    setCurrentConversation: (conversation: Conversation | null) => void;
    addMessage: (message: Message) => void;
    sendMessage: (data: { conversationId?: string; receiverId: string; propertyId?: string; content: string }) => Promise<Message>;
    markAsRead: (conversationId: string) => Promise<void>;
    fetchUnreadCount: () => Promise<void>;
    startPropertyInquiry: (landlordId: string, propertyId: string, message: string) => Promise<any>;
    setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
    updateConversationLastMessage: (conversationId: string, message: Message) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
    conversations: [],
    currentConversation: null,
    messages: [],
    unreadCount: 0,
    loading: false,
    error: null,
    typingUsers: {},

    fetchConversations: async () => {
        set({ loading: true, error: null });
        try {
            const response = await chatService.getConversations();
            set({ conversations: response.data || [], loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    fetchMessages: async (conversationId: string) => {
        set({ loading: true, error: null });
        try {
            const response = await chatService.getMessages(conversationId);
            set({ messages: response.data || [], loading: false });
        } catch (error: any) {
            set({ error: error.message, loading: false });
        }
    },

    setCurrentConversation: (conversation) => {
        set({ currentConversation: conversation, messages: [] });
    },

    addMessage: (message) => {
        set((state) => {
            // Check if message already exists
            const exists = state.messages.some(m => m._id === message._id);
            if (exists) return state;
            
            return { messages: [...state.messages, message] };
        });
    },

    sendMessage: async (data) => {
        try {
            const message = await chatService.sendMessage(data);
            get().addMessage(message);
            get().updateConversationLastMessage(message.conversation, message);
            return message;
        } catch (error: any) {
            set({ error: error.message });
            throw error;
        }
    },

    markAsRead: async (conversationId) => {
        try {
            await chatService.markAsRead(conversationId);
            set((state) => ({
                conversations: state.conversations.map(conv => 
                    conv._id === conversationId 
                        ? { ...conv, unreadCount: { ...conv.unreadCount } }
                        : conv
                ),
            }));
            get().fetchUnreadCount();
        } catch (error: any) {
            console.error('Failed to mark as read:', error);
        }
    },

    fetchUnreadCount: async () => {
        try {
            const count = await chatService.getUnreadCount();
            set({ unreadCount: count });
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    },

    startPropertyInquiry: async (landlordId, propertyId, message) => {
        set({ loading: true, error: null });
        try {
            const result = await chatService.startPropertyInquiry(landlordId, propertyId, message);
            // Add new conversation to list
            set((state) => ({
                conversations: [result.conversation, ...state.conversations],
                loading: false,
            }));
            return result;
        } catch (error: any) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    setTyping: (conversationId, userId, isTyping) => {
        set((state) => {
            const currentTyping = state.typingUsers[conversationId] || [];
            let newTyping: string[];
            
            if (isTyping) {
                newTyping = currentTyping.includes(userId) ? currentTyping : [...currentTyping, userId];
            } else {
                newTyping = currentTyping.filter(id => id !== userId);
            }
            
            return {
                typingUsers: {
                    ...state.typingUsers,
                    [conversationId]: newTyping,
                },
            };
        });
    },

    updateConversationLastMessage: (conversationId, message) => {
        set((state) => ({
            conversations: state.conversations.map(conv =>
                conv._id === conversationId
                    ? { ...conv, lastMessage: message, lastMessageAt: message.createdAt }
                    : conv
            ).sort((a, b) => 
                new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
            ),
        }));
    },
}));

export default useChatStore;

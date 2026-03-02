import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { useChatStore } from '../store/chat.store';
import { useSocket } from '../hooks/useSocket';
import ConversationList from '../components/organisms/ConversationList';
import ChatWindow from '../components/organisms/ChatWindow';
import { MessageCircle } from 'lucide-react';

const MessagesPage: React.FC = () => {
    const { user } = useAuthStore();
    const { fetchUnreadCount, updateConversationLastMessage } = useChatStore();
    const userId = user?.id || (user as any)?._id;
    const { onNewMessage } = useSocket({ userId });
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        fetchUnreadCount();

        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Listen for new messages globally
    useEffect(() => {
        const unsub = onNewMessage((data) => {
            // Update conversation list with new message
            updateConversationLastMessage(data.conversationId, data.message);

            const isFromSelf = data.message?.sender?._id === userId;
            const isActiveConversation = data.conversationId === selectedConversationId;
            const canNotify = 'Notification' in window && Notification.permission === 'granted';

            if (!isFromSelf && !isActiveConversation && canNotify) {
                const senderName = data.message?.sender
                    ? `${data.message.sender.firstName || ''} ${data.message.sender.lastName || ''}`.trim()
                    : 'New message';
                const title = senderName || 'New message';
                const body = data.message?.content || 'You have a new message';

                new Notification(title, {
                    body,
                    tag: data.conversationId,
                });
            }
        });
        return unsub;
    }, [selectedConversationId, userId]);

    const handleSelectConversation = (conversationId: string) => {
        setSelectedConversationId(conversationId);
    };

    const handleBack = () => {
        setSelectedConversationId(null);
    };

    // Mobile view
    if (isMobile) {
        return (
            <div className="h-[calc(100vh-64px)] bg-white">
                {selectedConversationId ? (
                    <ChatWindow 
                        conversationId={selectedConversationId} 
                        onBack={handleBack}
                    />
                ) : (
                    <div className="h-full flex flex-col">
                        <div className="p-4 border-b border-neutral-100">
                            <h1 className="text-2xl font-bold text-neutral-900">Messages</h1>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            <ConversationList 
                                onSelectConversation={handleSelectConversation}
                                selectedId={selectedConversationId || undefined}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Desktop view
    return (
        <div className="h-[calc(100vh-64px)] flex bg-neutral-50">
            {/* Sidebar - Conversation List */}
            <div className="w-80 bg-white border-r border-neutral-200 flex flex-col">
                <div className="p-4 border-b border-neutral-100">
                    <h1 className="text-xl font-bold text-neutral-900">Messages</h1>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <ConversationList 
                        onSelectConversation={handleSelectConversation}
                        selectedId={selectedConversationId || undefined}
                    />
                </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedConversationId ? (
                    <ChatWindow conversationId={selectedConversationId} />
                ) : (
                    <div className="flex-1 flex items-center justify-center bg-white">
                        <div className="text-center">
                            <MessageCircle className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold text-neutral-700 mb-2">
                                Select a conversation
                            </h2>
                            <p className="text-neutral-500">
                                Choose a conversation from the list to start chatting
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagesPage;

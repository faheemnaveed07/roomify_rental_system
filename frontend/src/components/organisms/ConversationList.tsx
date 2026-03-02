import React, { useEffect } from 'react';
import { useChatStore } from '../../store/chat.store';
import { useAuthStore } from '../../store/auth.store';
import { ASSETS_URL } from '../../services/api';
import { User as UserIcon, MessageCircle } from 'lucide-react';

interface ConversationListProps {
    onSelectConversation: (conversationId: string) => void;
    selectedId?: string;
}

const ConversationList: React.FC<ConversationListProps> = ({ 
    onSelectConversation, 
    selectedId 
}) => {
    const { user } = useAuthStore();
    const { conversations, fetchConversations, setCurrentConversation, loading } = useChatStore();

    useEffect(() => {
        fetchConversations();
    }, []);

    const formatTime = (dateString?: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Yesterday';
        } else if (diffDays < 7) {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    const handleSelect = (conversation: any) => {
        setCurrentConversation(conversation);
        onSelectConversation(conversation._id);
    };

    if (loading && conversations.length === 0) {
        return (
            <div className="p-4 text-center text-neutral-500">
                Loading conversations...
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                <p className="text-neutral-500">No conversations yet</p>
                <p className="text-sm text-neutral-400 mt-1">
                    Start a conversation by contacting a landlord about a property
                </p>
            </div>
        );
    }

    return (
        <div className="divide-y divide-neutral-100">
            {conversations.map((conversation) => {
                const otherParticipant = conversation.participants?.find(
                    (p: any) => p._id !== user?.id
                );
                const unreadCount = conversation.unreadCount?.[user?.id || ''] || 0;
                const isSelected = selectedId === conversation._id;

                return (
                    <div
                        key={conversation._id}
                        onClick={() => handleSelect(conversation)}
                        className={`flex items-center gap-3 p-4 cursor-pointer transition-colors ${
                            isSelected 
                                ? 'bg-primary-50 border-l-4 border-primary-500' 
                                : 'hover:bg-neutral-50'
                        }`}
                    >
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            {otherParticipant?.avatar ? (
                                <img
                                    src={otherParticipant.avatar.startsWith('/uploads/') 
                                        ? `${ASSETS_URL}${otherParticipant.avatar}` 
                                        : otherParticipant.avatar}
                                    alt={`${otherParticipant.firstName} ${otherParticipant.lastName}`}
                                    className="w-12 h-12 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                                    <UserIcon className="w-6 h-6 text-primary-600" />
                                </div>
                            )}
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <h4 className={`font-semibold truncate ${unreadCount > 0 ? 'text-neutral-900' : 'text-neutral-700'}`}>
                                    {otherParticipant?.firstName} {otherParticipant?.lastName}
                                </h4>
                                <span className="text-xs text-neutral-400 flex-shrink-0 ml-2">
                                    {formatTime(conversation.lastMessageAt)}
                                </span>
                            </div>
                            {conversation.property && (
                                <p className="text-xs text-primary-600 truncate mb-0.5">
                                    {conversation.property.title}
                                </p>
                            )}
                            <p className={`text-sm truncate ${unreadCount > 0 ? 'text-neutral-900 font-medium' : 'text-neutral-500'}`}>
                                {conversation.lastMessage?.content || 'No messages yet'}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ConversationList;

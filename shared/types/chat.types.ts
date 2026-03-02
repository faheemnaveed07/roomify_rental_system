export interface IMessage {
    _id?: string;
    conversation: string;
    sender: string | any;
    receiver: string | any;
    content: string;
    messageType: MessageType;
    readAt?: Date;
    isRead: boolean;
    attachments?: IAttachment[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IConversation {
    _id?: string;
    participants: string[] | any[];
    property?: string | any;
    booking?: string | any;
    lastMessage?: string | IMessage;
    lastMessageAt?: Date;
    unreadCount: {
        [userId: string]: number;
    };
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IAttachment {
    url: string;
    type: 'image' | 'document';
    name: string;
    size: number;
}

export enum MessageType {
    TEXT = 'text',
    IMAGE = 'image',
    DOCUMENT = 'document',
    SYSTEM = 'system',
}

export interface IChatEvent {
    conversationId: string;
    message: IMessage;
}

export interface ITypingEvent {
    conversationId: string;
    userId: string;
    isTyping: boolean;
}

export interface IReadReceiptEvent {
    conversationId: string;
    messageId: string;
    userId: string;
    readAt: Date;
}

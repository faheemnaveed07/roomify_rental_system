import { Message, IMessageDocument, MessageType } from '../models/Message';
import { Conversation, IConversationDocument } from '../models/Conversation';
import { User } from '../models/User';
import { Property } from '../models/Property';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { sanitizeText } from '../utils/sanitize';
import { sendEmail } from '../utils/email';

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_ATTACHMENT_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.pdf']);
const MAX_ATTACHMENTS = 5;
const OFFLINE_EMAIL_DELAY_MS = 7 * 60 * 1000; // 7 minutes

const pendingEmailNotifications = new Map<string, NodeJS.Timeout>();

const getFileExtension = (value: string): string => {
    const idx = value.lastIndexOf('.');
    return idx >= 0 ? value.slice(idx).toLowerCase() : '';
};

const validateAttachments = (attachments?: CreateMessageDTO['attachments']) => {
    if (!attachments || attachments.length === 0) return;

    if (attachments.length > MAX_ATTACHMENTS) {
        throw new Error(`You can upload up to ${MAX_ATTACHMENTS} attachments per message`);
    }

    for (const attachment of attachments) {
        const extFromName = getFileExtension(attachment.name || '');
        const extFromUrl = getFileExtension(attachment.url || '');
        const ext = extFromName || extFromUrl;

        if (!ALLOWED_ATTACHMENT_EXTENSIONS.has(ext)) {
            throw new Error('Attachment type is not allowed');
        }

        if (attachment.size > MAX_ATTACHMENT_SIZE) {
            throw new Error('Attachment exceeds the 5MB size limit');
        }

        if (attachment.type === 'image' && ext === '.pdf') {
            throw new Error('Invalid attachment type for image');
        }

        if (attachment.type === 'document' && ext !== '.pdf') {
            throw new Error('Only PDF documents are allowed');
        }
    }
};

const scheduleOfflineEmailNotification = async (
    receiverId: string,
    senderName: string,
    messagePreview: string,
    conversationId: string
) => {
    const key = `${conversationId}:${receiverId}`;
    const existing = pendingEmailNotifications.get(key);
    if (existing) {
        clearTimeout(existing);
    }

    const timer = setTimeout(async () => {
        try {
            const { isUserOnline } = await import('../config/socket');
            if (isUserOnline(receiverId)) {
                pendingEmailNotifications.delete(key);
                return;
            }

            const receiver = await User.findById(receiverId);
            if (!receiver?.email) {
                pendingEmailNotifications.delete(key);
                return;
            }

            const safePreview = messagePreview.slice(0, 120);
            await sendEmail({
                to: receiver.email,
                subject: 'New message on Roomify',
                html: `
                    <p>Hi ${receiver.firstName || 'there'},</p>
                    <p>You received a new message from ${senderName} on Roomify:</p>
                    <blockquote>${safePreview}</blockquote>
                    <p>Open your Messages page to reply.</p>
                `,
                text: `You received a new message from ${senderName}: ${safePreview}`,
            });
        } catch (error) {
            logger.error('Failed to send offline chat email notification', error as Error);
        } finally {
            pendingEmailNotifications.delete(key);
        }
    }, OFFLINE_EMAIL_DELAY_MS);

    pendingEmailNotifications.set(key, timer);
};

export interface CreateMessageDTO {
    conversationId?: string;
    senderId: string;
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

export interface GetConversationsDTO {
    userId: string;
    page?: number;
    limit?: number;
}

export interface GetMessagesDTO {
    conversationId: string;
    userId: string;
    page?: number;
    limit?: number;
}

class ChatService {
    /**
     * Get or create a conversation between two users
     */
    async getOrCreateConversation(
        participantIds: string[],
        propertyId?: string,
        bookingId?: string
    ): Promise<IConversationDocument> {
        if (participantIds.length !== 2) {
            throw new Error('Conversation must have exactly 2 participants');
        }

        const sortedParticipants = participantIds.sort();
        
        // Try to find existing conversation
        const query: any = {
            participants: { $all: sortedParticipants.map(id => new mongoose.Types.ObjectId(id)) },
        };
        
        if (propertyId) {
            query.property = new mongoose.Types.ObjectId(propertyId);
        }

        let conversation = await Conversation.findOne(query);

        if (!conversation) {
            // Create new conversation
            const conversationData: any = {
                participants: sortedParticipants.map(id => new mongoose.Types.ObjectId(id)),
                unreadCount: new Map(),
                isActive: true,
            };

            if (propertyId) {
                conversationData.property = new mongoose.Types.ObjectId(propertyId);
            }
            if (bookingId) {
                conversationData.booking = new mongoose.Types.ObjectId(bookingId);
            }

            // Initialize unread count for each participant
            sortedParticipants.forEach(id => {
                conversationData.unreadCount.set(id, 0);
            });

            conversation = await Conversation.create(conversationData);
            logger.info(`Created new conversation: ${conversation._id}`);
        }

        return conversation;
    }

    /**
     * Send a new message
     */
    async sendMessage(data: CreateMessageDTO): Promise<IMessageDocument> {
        const { conversationId, senderId, receiverId, propertyId, content, messageType, attachments } = data;
        validateAttachments(attachments);

        // Validate users exist
        const [sender, receiver] = await Promise.all([
            User.findById(senderId),
            User.findById(receiverId),
        ]);

        if (!sender || !receiver) {
            throw new Error('Sender or receiver not found');
        }

        // Get or create conversation
        let conversation: IConversationDocument;
        if (conversationId) {
            const existingConv = await Conversation.findById(conversationId);
            if (!existingConv) {
                throw new Error('Conversation not found');
            }
            conversation = existingConv;
        } else {
            conversation = await this.getOrCreateConversation([senderId, receiverId], propertyId);
        }

        const sanitizedContent = sanitizeText(content.trim());
        if (!sanitizedContent && (!attachments || attachments.length === 0)) {
            throw new Error('Message content or attachments are required');
        }

        // Create message
        const message = await Message.create({
            conversation: conversation._id,
            sender: new mongoose.Types.ObjectId(senderId),
            receiver: new mongoose.Types.ObjectId(receiverId),
            content: sanitizedContent,
            messageType: messageType || MessageType.TEXT,
            attachments: attachments || [],
            isRead: false,
        });

        // Update conversation - cast unreadCount to Map<string, number> for TypeScript
        const unreadCountMap = conversation.unreadCount as Map<string, number>;
        const currentUnread = unreadCountMap.get(receiverId) || 0;
        unreadCountMap.set(receiverId, currentUnread + 1);
        conversation.lastMessage = message._id as mongoose.Types.ObjectId;
        conversation.lastMessageAt = new Date();
        await conversation.save();

        // Populate sender info for response
        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'firstName lastName avatar')
            .populate('receiver', 'firstName lastName avatar');

        logger.info(`Message sent in conversation ${conversation._id}`);

        // Email fallback if recipient stays offline
        await scheduleOfflineEmailNotification(
            receiverId,
            `${sender.firstName} ${sender.lastName}`.trim(),
            sanitizedContent,
            conversation._id.toString()
        );
        return populatedMessage!;
    }

    /**
     * Get all conversations for a user
     */
    async getConversations(data: GetConversationsDTO) {
        const { userId, page = 1, limit = 20 } = data;

        const conversations = await Conversation.find({
            participants: new mongoose.Types.ObjectId(userId),
            isActive: true,
        })
            .populate('participants', 'firstName lastName avatar email')
            .populate('property', 'title images location')
            .populate({
                path: 'lastMessage',
                populate: {
                    path: 'sender',
                    select: 'firstName lastName',
                },
            })
            .sort({ lastMessageAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Conversation.countDocuments({
            participants: new mongoose.Types.ObjectId(userId),
            isActive: true,
        });

        return {
            conversations,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get messages for a conversation
     */
    async getMessages(data: GetMessagesDTO) {
        const { conversationId, userId, page = 1, limit = 50 } = data;

        // Verify user is part of conversation
        const conversation = await Conversation.findOne({
            _id: new mongoose.Types.ObjectId(conversationId),
            participants: new mongoose.Types.ObjectId(userId),
        });

        if (!conversation) {
            throw new Error('Conversation not found or access denied');
        }

        const messages = await Message.find({
            conversation: new mongoose.Types.ObjectId(conversationId),
        })
            .populate('sender', 'firstName lastName avatar')
            .populate('receiver', 'firstName lastName avatar')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Message.countDocuments({
            conversation: new mongoose.Types.ObjectId(conversationId),
        });

        return {
            messages: messages.reverse(), // Return in chronological order
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Mark messages as read
     */
    async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
        const conversation = await Conversation.findOne({
            _id: new mongoose.Types.ObjectId(conversationId),
            participants: new mongoose.Types.ObjectId(userId),
        });

        if (!conversation) {
            throw new Error('Conversation not found');
        }

        // Mark all unread messages as read
        await Message.updateMany(
            {
                conversation: new mongoose.Types.ObjectId(conversationId),
                receiver: new mongoose.Types.ObjectId(userId),
                isRead: false,
            },
            {
                $set: { isRead: true, readAt: new Date() },
            }
        );

        // Reset unread count - cast to Map<string, number> for TypeScript
        const unreadCountMap = conversation.unreadCount as Map<string, number>;
        unreadCountMap.set(userId, 0);
        await conversation.save();

        logger.info(`Messages marked as read for user ${userId} in conversation ${conversationId}`);
    }

    /**
     * Get unread count for a user
     */
    async getUnreadCount(userId: string): Promise<number> {
        const conversations = await Conversation.find({
            participants: new mongoose.Types.ObjectId(userId),
            isActive: true,
        });

        let totalUnread = 0;
        for (const conv of conversations) {
            const unreadCountMap = conv.unreadCount as Map<string, number>;
            totalUnread += unreadCountMap.get(userId) || 0;
        }

        return totalUnread;
    }

    /**
     * Get conversation by ID
     */
    async getConversationById(conversationId: string, userId: string): Promise<IConversationDocument | null> {
        return Conversation.findOne({
            _id: new mongoose.Types.ObjectId(conversationId),
            participants: new mongoose.Types.ObjectId(userId),
        })
            .populate('participants', 'firstName lastName avatar email phone')
            .populate('property', 'title images location rent')
            .populate('booking', 'status proposedMoveInDate rentDetails');
    }

    /**
     * Start a conversation about a property (tenant to landlord)
     */
    async startPropertyInquiry(
        tenantId: string,
        landlordId: string,
        propertyId: string,
        initialMessage: string
    ): Promise<{ conversation: IConversationDocument; message: IMessageDocument }> {
        // Verify property exists and belongs to landlord
        const property = await Property.findOne({
            _id: new mongoose.Types.ObjectId(propertyId),
            owner: new mongoose.Types.ObjectId(landlordId),
        });

        if (!property) {
            throw new Error('Property not found');
        }

        const conversation = await this.getOrCreateConversation([tenantId, landlordId], propertyId);
        
        const message = await this.sendMessage({
            conversationId: conversation._id.toString(),
            senderId: tenantId,
            receiverId: landlordId,
            propertyId,
            content: initialMessage,
            messageType: MessageType.TEXT,
        });

        return { conversation, message };
    }
}

export default new ChatService();

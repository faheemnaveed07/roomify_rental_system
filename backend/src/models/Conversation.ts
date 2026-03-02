import mongoose, { Schema, Document, Types } from 'mongoose';
import { IConversation as ISharedConversation } from '@shared/types';

export interface IConversationDocument extends Document, Omit<ISharedConversation, '_id' | 'participants' | 'property' | 'booking' | 'lastMessage' | 'unreadCount'> {
    participants: Types.ObjectId[];
    property?: Types.ObjectId;
    booking?: Types.ObjectId;
    lastMessage?: Types.ObjectId;
    unreadCount: Map<string, number>;
}

const conversationSchema = new Schema<IConversationDocument>(
    {
        participants: [{
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        }],
        property: {
            type: Schema.Types.ObjectId,
            ref: 'Property',
            default: null,
        },
        booking: {
            type: Schema.Types.ObjectId,
            ref: 'Booking',
            default: null,
        },
        lastMessage: {
            type: Schema.Types.ObjectId,
            ref: 'Message',
            default: null,
        },
        lastMessageAt: {
            type: Date,
            default: null,
        },
        unreadCount: {
            type: Map,
            of: Number,
            default: {},
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
conversationSchema.index({ participants: 1 });
conversationSchema.index({ property: 1 });
conversationSchema.index({ booking: 1 });
conversationSchema.index({ lastMessageAt: -1 });

// Ensure unique conversation between two users for a property
conversationSchema.index(
    { participants: 1, property: 1 },
    { unique: true, sparse: true }
);

export const Conversation = mongoose.model<IConversationDocument>('Conversation', conversationSchema);
export default Conversation;

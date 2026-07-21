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

// Lookup index for getOrCreateConversation.
//
// This was `unique: true`, which is wrong on an array field: Mongo indexes one
// key PER participant, so the first conversation about a property reserved
// (landlordId, propertyId) and every later tenant asking about that same
// listing collided with E11000. A landlord could hold exactly one conversation
// per listing, ever. Uniqueness is handled in getOrCreateConversation, which
// looks the pair up before creating.
conversationSchema.index({ participants: 1, property: 1 });

export const Conversation = mongoose.model<IConversationDocument>('Conversation', conversationSchema);
export default Conversation;

import mongoose, { Schema, Document, Types } from 'mongoose';
import { IMessage as ISharedMessage, MessageType } from '@shared/types';

export { MessageType };

export interface IMessageDocument extends Document, Omit<ISharedMessage, '_id' | 'conversation' | 'sender' | 'receiver'> {
    conversation: Types.ObjectId;
    sender: Types.ObjectId;
    receiver: Types.ObjectId;
}

const attachmentSchema = new Schema({
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'document'], required: true },
    name: { type: String, required: true },
    size: { type: Number, required: true },
}, { _id: false });

const messageSchema = new Schema<IMessageDocument>(
    {
        conversation: {
            type: Schema.Types.ObjectId,
            ref: 'Conversation',
            required: [true, 'Conversation is required'],
            index: true,
        },
        sender: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Sender is required'],
        },
        receiver: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Receiver is required'],
        },
        content: {
            type: String,
            required: [true, 'Message content is required'],
            maxlength: [2000, 'Message cannot exceed 2000 characters'],
        },
        messageType: {
            type: String,
            enum: Object.values(MessageType),
            default: MessageType.TEXT,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        readAt: {
            type: Date,
            default: null,
        },
        attachments: [attachmentSchema],
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1 });

export const Message = mongoose.model<IMessageDocument>('Message', messageSchema);
export default Message;

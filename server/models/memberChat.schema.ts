import { Schema, model } from 'mongoose';

const memberChatSchema = new Schema({
    conversationId: {
        type: Schema.Types.ObjectId,
        ref: 'Chat'
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    role: {
        type: String,
        enum: ['owner', 'member'],
        default: 'member'
    }
})

export const MemberChat = model("MemberChat", memberChatSchema);
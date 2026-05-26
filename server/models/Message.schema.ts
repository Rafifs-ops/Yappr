import { Schema, model } from 'mongoose';

const messageSchema = new Schema({
    conversationId: {
        type: Schema.Types.ObjectId,
        ref: 'Chat'
    },
    senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    content: {
        type: String,
        require: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

export const Message = model("Message", messageSchema);
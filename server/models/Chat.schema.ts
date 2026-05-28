import { Schema, model } from 'mongoose';

const chatSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

export const Chat = model("Chat", chatSchema);
import { Schema, model } from 'mongoose';

const repostSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' }, // Siapa yang repost
    twit: { type: Schema.Types.ObjectId, ref: 'Twit' }, // Twit yang direpost
}, { timestamps: true });

export const Repost = model('Repost', repostSchema);
import { Schema, model } from 'mongoose';

const likeSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' }, // Siapa yang like
    twit: { type: Schema.Types.ObjectId, ref: 'Twit' }, // Twit yang di like
}, { timestamps: true });

export const Like = model('Like', likeSchema);
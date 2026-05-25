import { Schema, model } from "mongoose";

const followSchema = new Schema({
    follower: { type: Schema.Types.ObjectId, ref: 'User' }, // Siapa yang follow
    following: { type: Schema.Types.ObjectId, ref: 'User' }, // Siapa yang di follow
}, { timestamps: true });

export const Follow = model('Follow', followSchema);
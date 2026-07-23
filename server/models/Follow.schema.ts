import { Schema, model } from "mongoose";

const followSchema = new Schema({
    follower: { type: Schema.Types.ObjectId, ref: 'User' }, // Siapa yang follow
    following: { type: Schema.Types.ObjectId, ref: 'User' }, // Siapa yang di follow
    status: { type: String, enum: ['pending', 'accepted'], default: 'accepted' }
}, { timestamps: true });

followSchema.index({ follower: 1 });
followSchema.index({ following: 1 });
followSchema.index({ follower: 1, following: 1 }, { unique: true });

export const Follow = model('Follow', followSchema);
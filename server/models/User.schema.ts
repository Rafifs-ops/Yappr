import { Schema, model } from 'mongoose';

const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    photo: { type: String, required: true, default: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png' },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: { type: String, required: true },
    emailVerifiedAt: { type: Date, default: null },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 }
}, { timestamps: true });

export const User = model('User', userSchema);
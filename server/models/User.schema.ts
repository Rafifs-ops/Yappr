import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
    username: string;
    photo: string;
    email: string;
    password?: string;
    bio: string;
    emailVerifiedAt?: Date | null;
    followers: number;
    following: number;
    isPrivate: boolean;
    refreshToken?: string | null;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>({
    username: { type: String, required: true, unique: true },
    photo: { type: String, required: true, default: 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png' },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: { type: String, required: true },
    emailVerifiedAt: { type: Date, default: null }, // Jika masih null, maka belum terverifikasi
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    isPrivate: { type: Boolean, default: false },
    refreshToken: { type: String, default: null }
}, { timestamps: true });

export const User = model<IUser>('User', userSchema);
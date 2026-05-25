import { User } from "../../models/User.schema";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default defineEventHandler(async (event) => {
    const data = await readBody(event);
    const photo = event.context.photo;

    if (!data.username || !data.password || !data.email || !data.bio) {
        throw createError({ statusCode: 400, statusMessage: 'data belum lengkap' });
    }

    const usernameRegex = /^[a-z]{4,15}$/;
    if (!usernameRegex.test(data.username)) {
        throw createError({ statusCode: 400, statusMessage: 'Username harus huruf kecil semua, minimal 4 karakter, dan maksimal 15 karakter' });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail|yahoo)\.com$/;
    if (!emailRegex.test(data.email)) {
        throw createError({ statusCode: 400, statusMessage: 'Format email tidak valid. Gunakan format seperti @gmail.com atau @yahoo.com' });
    }

    // Cek apakah username atau email sudah terdaftar
    const existingUser = await User.findOne({
        $or: [{ email: data.email }, { username: data.username }]
    });

    if (existingUser) {
        throw createError({
            statusCode: 409, // 409 Conflict
            statusMessage: 'Username atau Email sudah terdaftar'
        });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    try {
        const user = await User.create({
            username: data.username,
            photo: photo,
            email: data.email,
            password: hashedPassword,
            bio: data.bio
        })

        // Session is not created here. The user must verify OTP first.
        return {
            status: 'berhasil daftar',
            message: 'User registered, OTP required'
        }
    } catch (error: any) {
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message });
    }
})

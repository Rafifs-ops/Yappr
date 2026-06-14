import { User } from "../../models/User.schema";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default defineEventHandler(async (event) => {
    const data = await readBody(event); // Mengambil data body request
    const photo = event.context.photo; // Mengambil foto

    // Validasi apakah data ada / tidak
    if (!data.username || !data.password || !data.email || !data.bio) {
        throw createError({ statusCode: 400, statusMessage: 'data belum lengkap' });
    }

    // Validasi format username (huruf kecil semua, minimal 4 karakter, dan maksimal 15 karakter)
    const usernameRegex = /^[a-z]{4,15}$/;
    if (!usernameRegex.test(data.username)) {
        throw createError({ statusCode: 400, statusMessage: 'Username harus huruf kecil semua, minimal 4 karakter, dan maksimal 15 karakter' });
    }

    // Validasi format email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(data.email)) {
        throw createError({ statusCode: 400, statusMessage: 'Format email tidak valid.' });
    }

    // Cek apakah username atau email sudah terdaftar
    const existingUser = await User.findOne({
        $or: [{ email: data.email }, { username: data.username }]
    });

    // jika user sudah ada
    if (existingUser) {
        throw createError({
            statusCode: 409, // 409 Conflict
            statusMessage: 'Username atau Email sudah terdaftar'
        });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10); // hashing password dengan 10 salt

    try {
        // Input user ke database
        await User.create({
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

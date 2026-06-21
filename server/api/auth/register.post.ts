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
    const existingUsers = await User.find({
        $or: [{ email: data.email }, { username: data.username }]
    });

    if (existingUsers.length > 0) {
        // Cek jika ada user yang sudah terverifikasi
        const verifiedUser = existingUsers.find(u => u.emailVerifiedAt);
        
        if (verifiedUser) {
            if (verifiedUser.email === data.email && verifiedUser.username === data.username) {
                throw createError({ statusCode: 409, statusMessage: 'Username dan Email sudah terdaftar' });
            } else if (verifiedUser.email === data.email) {
                throw createError({ statusCode: 409, statusMessage: 'Email sudah terdaftar' });
            } else {
                throw createError({ statusCode: 409, statusMessage: 'Username sudah terdaftar' });
            }
        }

        // Jika semua user dengan username/email ini belum terverifikasi, kita bisa menghapusnya
        // Ini memungkinkan pengguna yang sebelumnya gagal OTP untuk mencoba mendaftar kembali
        const unverifiedIds = existingUsers.map(u => u._id);
        await User.deleteMany({ _id: { $in: unverifiedIds } });
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
        if (error.code === 11000) {
            throw createError({ statusCode: 409, statusMessage: 'Username atau Email sudah terdaftar' });
        }
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message });
    }
})

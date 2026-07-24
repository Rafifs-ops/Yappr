import { prisma } from '../../utils/prisma';
import bcrypt from 'bcryptjs';

export default defineEventHandler(async (event) => {
    const data = await readBody(event); // Mengambil data body request
    const photo = event.context.photo; // Mengambil photo dari event context

    // Validasi data request apakah sudah lengkap atau belum
    if (!data.username && !data.password && !data.email && !data.bio) {
        throw createError({ statusCode: 400, statusMessage: 'data belum lengkap' });
    }

    // Validasi format username
    const usernameRegex = /^[a-z]{4,15}$/;
    if (!usernameRegex.test(data.username)) {
        throw createError({ statusCode: 400, statusMessage: 'Username harus huruf kecil semua, minimal 4 karakter, dan maksimal 15 karakter' });
    }

    // Validasi format email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(data.email)) {
        throw createError({ statusCode: 400, statusMessage: 'Format email tidak valid.' });
    }

    // Mencari user yang sudah ada berdasarkan email atau username (untuk memeriksa apakah sudah ada user yang terdaftar menggunakan data dari request)
    const existingUsers = await prisma.user.findMany({
        where: {
            OR: [{ email: data.email }, { username: data.username }]
        }
    });

    // Jika user ditemukan
    if (existingUsers.length > 0) {
        // Memeriksa apakah user sudah terverifikasi
        const verifiedUser = existingUsers.find((u: any) => u.emailVerifiedAt);

        if (verifiedUser) {
            // Memeriksa apakah user sudah terdaftar
            if (verifiedUser.email === data.email && verifiedUser.username === data.username) {
                throw createError({ statusCode: 409, statusMessage: 'Username dan Email sudah terdaftar' });
            } else if (verifiedUser.email === data.email) {
                throw createError({ statusCode: 409, statusMessage: 'Email sudah terdaftar' });
            } else {
                throw createError({ statusCode: 409, statusMessage: 'Username sudah terdaftar' });
            }
        }

        throw createError({ statusCode: 409, statusMessage: 'Akun dengan email atau username ini sudah terdaftar tapi belum diverifikasi. Silakan minta ulang OTP atau login.' });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10); // Hash password

    // Membuat user baru
    try {
        await prisma.user.create({
            data: {
                username: data.username,
                photo: photo || undefined,
                email: data.email,
                password: hashedPassword,
                bio: data.bio
            }
        });

        return {
            status: 'berhasil daftar',
            message: 'User registered, OTP required'
        };
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw createError({ statusCode: 409, statusMessage: 'Username atau Email sudah terdaftar' });
        }
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message });
    }
});

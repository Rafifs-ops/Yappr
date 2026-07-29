import { prisma } from '../../utils/prisma';
import bcrypt from 'bcryptjs';

export default defineEventHandler(async (event) => {
    const data = await readBody(event); // Mengambil data body request
    const photo = event.context.photo; // Mengambil photo dari event context

    const username = data.username?.trim().toLowerCase(); // Mengambil data username dari body request dan mengubahnya menjadi huruf kecil
    const email = data.email?.trim().toLowerCase(); // Mengambil data email dari body request dan mengubahnya menjadi huruf kecil
    const { password, bio } = data; // Mengambil data password dan bio dari body request

    // Validasi data request apakah sudah lengkap atau belum
    if (!username && !password && !email && !bio) {
        throw createError({ statusCode: 400, statusMessage: 'data belum lengkap' });
    }

    // Validasi format username
    const usernameRegex = /^[a-z]{4,15}$/;
    if (!usernameRegex.test(username)) {
        throw createError({ statusCode: 400, statusMessage: 'Username harus huruf kecil semua, minimal 4 karakter, dan maksimal 15 karakter' });
    }

    // Validasi format email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        throw createError({ statusCode: 400, statusMessage: 'Format email tidak valid.' });
    }

    if (password.length < 6) {
        throw createError({ statusCode: 400, statusMessage: 'Password minimal 6 karakter' });
    }

    // Mencari user yang sudah ada berdasarkan email atau username (untuk memeriksa apakah sudah ada user yang terdaftar menggunakan data dari request)
    const existingUsers = await prisma.user.findMany({
        where: {
            OR: [{ email: email }, { username: username }]
        }
    });

    // Jika user ditemukan
    if (existingUsers.length > 0) {
        // Memeriksa apakah user sudah terverifikasi
        const verifiedUser = existingUsers.find((u: any) => u.emailVerifiedAt);

        if (verifiedUser) {
            // Memeriksa apakah user sudah terdaftar
            if (verifiedUser.email === email && verifiedUser.username === username) {
                throw createError({ statusCode: 409, statusMessage: 'Username dan Email sudah terdaftar' });
            } else if (verifiedUser.email === email) {
                throw createError({ statusCode: 409, statusMessage: 'Email sudah terdaftar' });
            } else {
                throw createError({ statusCode: 409, statusMessage: 'Username sudah terdaftar' });
            }
        }

        // Jika user belum terverifikasi
        const unverifiedUser = existingUsers.find((u: any) => !u.emailVerifiedAt);
        if (unverifiedUser && unverifiedUser.email === email) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await prisma.user.update({
                where: { id: unverifiedUser.id },
                data: {
                    username: username,
                    photo: photo || undefined,
                    password: hashedPassword,
                    bio: bio || '',
                }
            });
            return {
                status: 'berhasil daftar',
                message: 'User updated, OTP required'
            };
        }

        throw createError({ statusCode: 409, statusMessage: 'Akun dengan username ini sudah terdaftar. Silakan gunakan username lain atau verifikasi email Anda.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10); // Hash password

    // Membuat user baru
    try {
        await prisma.user.create({
            data: {
                username: username,
                photo: photo || undefined,
                email: email,
                password: hashedPassword,
                bio: bio || ''
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

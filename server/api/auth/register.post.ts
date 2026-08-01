import { prisma } from '../../utils/prisma';
import bcrypt from 'bcryptjs';
import { v2 as cloudinary } from 'cloudinary';

export default defineEventHandler(async (event) => {
    const data = await readBody(event); // Mengambil data body request
    let photo = event.context.photo; // Mengambil photo dari event context jika ada

    const username = data.username?.trim().toLowerCase(); // Mengambil data username dari body request dan mengubahnya menjadi huruf kecil
    const email = data.email?.trim().toLowerCase(); // Mengambil data email dari body request dan mengubahnya menjadi huruf kecil
    const { password, bio } = data; // Mengambil data password dan bio dari body request

    // Validasi data request apakah sudah lengkap atau belum
    if (!username || !password || !email) {
        throw createError({ statusCode: 400, statusMessage: 'Data wajib melengkapi username, email, dan password' });
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

    // Validasi panjang password
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
            if (verifiedUser.email === email && verifiedUser.username === username) { // Jika Username dan Email sudah dipakai
                throw createError({ statusCode: 409, statusMessage: 'Username dan Email sudah terdaftar' });
            } else if (verifiedUser.email === email) { // Jika Email sudah dipakai
                throw createError({ statusCode: 409, statusMessage: 'Email sudah terdaftar' });
            } else { // Jika Username sudah dipakai
                throw createError({ statusCode: 409, statusMessage: 'Username sudah terdaftar' });
            }
        }
    }

    // Setelah validasi lolos dan tidak ada user terverifikasi yang duplikat, baru lakukan upload foto ke Cloudinary
    if (!photo && data.file) {
        try {
            const config = useRuntimeConfig(); //mengambil secret key di .env
            cloudinary.config({
                cloud_name: config.cloudinaryCloudName,
                api_key: config.cloudinaryApiKey,
                api_secret: config.cloudinaryApiSecret,
                secure: true
            });
            const result = await cloudinary.uploader.upload(data.file, {
                folder: 'user_profile_photos_RTwit',
                use_filename: true,
            });
            photo = result.secure_url; //Mengambil URL foto yang sudah diupload ke Cloudinary
        } catch (error) { //catch error jika upload gagal
            throw createError({
                statusCode: 500,
                statusMessage: 'Gagal upload foto profil ke Cloudinary',
            });
        }
    }

    // Jika ada user belum terverifikasi dengan email yang sama, perbarui datanya
    if (existingUsers.length > 0) {
        const unverifiedUser = existingUsers.find((u: any) => !u.emailVerifiedAt);

        // Jika user belum terverifikasi dan email cocok dengan data email dari request
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


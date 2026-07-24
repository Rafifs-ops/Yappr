import { prisma } from '../../utils/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default defineEventHandler(async (event) => {
    const data = await readBody(event); // Mengambil data body request

    // Validasi data request apakah password dan email ada ?
    if (!data.password && !data.email) {
        throw createError({ statusCode: 400, statusMessage: 'Email atau Password belum ada' });
    }

    // Validasi format email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(data.email)) {
        throw createError({ statusCode: 400, statusMessage: 'Format email tidak valid.' });
    }

    // Mencari user berdasarkan email
    const user = await prisma.user.findUnique({ where: { email: data.email } });

    // Jika user tidak ditemukan
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'User belum terdaftar' });
    }

    // Jika user tidak verifikasi
    if (!user.emailVerifiedAt) {
        throw createError({ statusCode: 403, statusMessage: 'Email belum terverifikasi' });
    }

    // Membandingkan password user dengan password request
    const isMatch = await bcrypt.compare(data.password, user.password as string);

    const config = useRuntimeConfig(); // Mengambil variable env yang terdaftar di config nuxt js
    const secretAuthKey = config.jwtSecret; // Mengambil secret key dari variable env

    // Validasi secret key apakah terdaftar atau tidak
    if (!secretAuthKey) {
        throw createError({
            statusCode: 500,
            message: 'JWT Secret is not defined in runtime config'
        });
    }

    // Mengambil data user id untuk dijadikan payload
    const payload = user;

    // Jika password cocok
    if (isMatch) {
        // Membuat token dan refresh token
        const token = jwt.sign(payload, secretAuthKey, { expiresIn: '15m' });
        const refreshToken = jwt.sign(payload, secretAuthKey, { expiresIn: '7d' });

        // Menyimpan refresh token ke database
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: refreshToken }
        });

        // Menyimpan token ke cookie
        setCookie(event, 'auth_token', token, {
            maxAge: 60 * 15,  // 15 menit
            httpOnly: true,
            secure: true,
            path: '/',
        });
        setCookie(event, 'refresh_token', refreshToken, {
            maxAge: 60 * 60 * 24 * 7,  // 7 hari
            httpOnly: true,
            secure: true,
            path: '/',
        });

        return {
            status: 'berhasil login'
        };
    } else {
        throw createError({ statusCode: 400, statusMessage: 'Email atau password salah' });
    }
});

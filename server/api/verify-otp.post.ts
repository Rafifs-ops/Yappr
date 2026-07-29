import { prisma } from '../utils/prisma';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export default defineEventHandler(async (event) => {
    const data = await readBody(event); // Mengambil data body dari request
    const { otp, type } = data; // Mengambil otp dan type dari data request
    const email = data.email?.trim().toLowerCase(); // Mengambil email dari data dan mengubahnya menjadi huruf kecil

    // Validasi data
    if (!email || !otp || !type) {
        throw createError({ statusCode: 400, statusMessage: 'Data belum lengkap' });
    }

    const hashedInput = crypto.createHash('sha256').update(otp).digest('hex'); // Mengubah otp menjadi hash

    // Mencari otp
    const otpDoc = await prisma.otp.findFirst({
        where: { email, otp: hashedInput, type }
    });

    // Jika otp tidak ada
    if (!otpDoc) {
        throw createError({ statusCode: 400, statusMessage: 'OTP tidak valid atau salah' });
    }

    // Cek apakah otp sudah kadaluwarsa
    if (new Date() > otpDoc.expiresAt) {
        await prisma.otp.deleteMany({ where: { email, type } });
        throw createError({ statusCode: 400, statusMessage: 'OTP sudah kadaluwarsa' });
    }

    if (type === 'register') { // Jika tipe otp adalah register
        const user = await prisma.user.findUnique({ where: { email } }); // Mencari user
        if (!user) {
            throw createError({ statusCode: 404, statusMessage: 'User tidak ditemukan' });
        }

        const config = useRuntimeConfig(); // Mengambil variabel env dari runTimeConfig
        const secretAuthKey = config.jwtSecret;
        if (!secretAuthKey) {
            throw createError({ statusCode: 500, message: 'JWT Secret is not defined in runtime config' });
        }

        // Membuat payload untuk membuat token JWT
        const payload = {
            id: user.id,
            username: user.username,
            email: user.email,
        };

        // Membuat Token 
        const token = jwt.sign(payload, secretAuthKey, { expiresIn: '15m' });
        const refreshToken = jwt.sign(payload, secretAuthKey, { expiresIn: '7d' });

        // Update user (email menjadi terverifikasi) dan simpan refresh token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerifiedAt: new Date(),
                refreshToken: refreshToken
            }
        });

        // Set cookie
        setCookie(event, 'auth_token', token, {
            maxAge: 60 * 15,  // 15 menit
            httpOnly: true,
            secure: true,
            path: '/',
        });

        // Set refresh token cookie
        setCookie(event, 'refresh_token', refreshToken, {
            maxAge: 60 * 60 * 24 * 7,  // 7 hari
            httpOnly: true,
            secure: true,
            path: '/',
        });

        // Hapus otp
        await prisma.otp.deleteMany({ where: { email, type } });

        // Mengembalikan status login sukses
        return { status: 'Verifikasi berhasil dan login sukses' };

    } else if (type === 'reset_password') { // Jika tipe otp adalah reset password

        // Mengembalikan status otp reset password valid
        return { status: 'OTP reset password valid' };

    } else { // Jika tipe otp tidak valid
        throw createError({ statusCode: 400, statusMessage: 'Tipe OTP tidak valid' });
    }
});

import { prisma } from '../utils/prisma';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export default defineEventHandler(async (event) => {
    const data = await readBody(event);
    const { email, otp, type } = data;

    if (!email || !otp || !type) {
        throw createError({ statusCode: 400, statusMessage: 'Data belum lengkap' });
    }

    const hashedInput = crypto.createHash('sha256').update(otp).digest('hex');
    const otpDoc = await prisma.otp.findFirst({
        where: { email, otp: hashedInput, type }
    });

    if (!otpDoc) {
        throw createError({ statusCode: 400, statusMessage: 'OTP tidak valid atau salah' });
    }

    if (new Date() > otpDoc.expiresAt) {
        await prisma.otp.deleteMany({ where: { email, type } });
        throw createError({ statusCode: 400, statusMessage: 'OTP sudah kadaluwarsa' });
    }

    if (type === 'register') {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw createError({ statusCode: 404, statusMessage: 'User tidak ditemukan' });
        }

        const config = useRuntimeConfig();
        const secretAuthKey = config.jwtSecret;
        if (!secretAuthKey) {
            throw createError({ statusCode: 500, message: 'JWT Secret is not defined in runtime config' });
        }

        const payload = {
            userId: user.id,
        };

        const token = jwt.sign(payload, secretAuthKey, { expiresIn: '15m' });
        const refreshToken = jwt.sign(payload, secretAuthKey, { expiresIn: '7d' });

        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerifiedAt: new Date(),
                refreshToken: refreshToken
            }
        });

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

        await prisma.otp.deleteMany({ where: { email, type } });

        return { status: 'Verifikasi berhasil dan login sukses' };
    } else if (type === 'reset_password') {
        return { status: 'OTP reset password valid' };
    } else {
        throw createError({ statusCode: 400, statusMessage: 'Tipe OTP tidak valid' });
    }
});

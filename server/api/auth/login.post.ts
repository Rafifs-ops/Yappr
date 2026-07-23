import { prisma } from '../../utils/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default defineEventHandler(async (event) => {
    const data = await readBody(event);

    if (!data.password || !data.email) {
        throw createError({ statusCode: 400, statusMessage: 'Email atau Password belum ada' });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(data.email)) {
        throw createError({ statusCode: 400, statusMessage: 'Format email tidak valid.' });
    }

    const user = await prisma.user.findUnique({ where: { email: data.email } });

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'User belum terdaftar' });
    }

    if (!user.emailVerifiedAt) {
        throw createError({ statusCode: 403, statusMessage: 'Email belum terverifikasi' });
    }

    const isMatch = await bcrypt.compare(data.password, user.password as string);
    const config = useRuntimeConfig();
    const secretAuthKey = config.jwtSecret;

    if (!secretAuthKey) {
        throw createError({
            statusCode: 500,
            message: 'JWT Secret is not defined in runtime config'
        });
    }

    const payload = {
        userId: user.id,
    };

    if (isMatch) {
        const token = jwt.sign(payload, secretAuthKey, { expiresIn: '15m' });
        const refreshToken = jwt.sign(payload, secretAuthKey, { expiresIn: '7d' });

        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: refreshToken }
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

        return {
            status: 'berhasil login'
        };
    } else {
        throw createError({ statusCode: 400, statusMessage: 'Email atau password salah' });
    }
});

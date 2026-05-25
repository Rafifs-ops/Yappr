import { User } from "../../models/User.schema";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default defineEventHandler(async (event) => {
    const data = await readBody(event);

    if (!data.password || !data.email) {
        throw createError({ statusCode: 400, statusMessage: 'Email atau Password belum ada' });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail|yahoo)\.com$/;
    if (!emailRegex.test(data.email)) {
        throw createError({ statusCode: 400, statusMessage: 'Format email tidak valid. Gunakan format seperti @gmail.com atau @yahoo.com' });
    }

    const user = await User.findOne({ email: data.email });

    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'User belum terdaftar' });
    }

    if (!user.emailVerifiedAt) {
        throw createError({ statusCode: 403, statusMessage: 'Email belum terverifikasi' });
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    const secretAuthKey = process.env.JWT_SECRET;

    if (!secretAuthKey) {
        throw createError({
            statusCode: 500,
            message: 'JWT Secret is not defined in runtime config'
        });
    }

    const payload = {
        userId: user._id.toString(),
    }

    if (isMatch) {
        const token = jwt.sign(payload, secretAuthKey, { expiresIn: '49d' })
        setCookie(event, 'auth_token', token, {
            maxAge: 60 * 60 * 24 * 7 * 7,  // 7 minggu
        })
        return {
            status: 'berhasil login'
        }
    } else {
        throw createError({ statusCode: 400, statusMessage: 'Email atau password salah' })
    }
})

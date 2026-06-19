import { Otp } from '../models/Otp.schema';
import { User } from '../models/User.schema';
import jwt from 'jsonwebtoken';

export default defineEventHandler(async (event) => {
    const data = await readBody(event);
    const { email, otp, type } = data;

    if (!email || !otp || !type) {
        throw createError({ statusCode: 400, statusMessage: 'Data belum lengkap' });
    }

    const otpDoc = await Otp.findOne({ email, otp, type });

    if (!otpDoc) {
        throw createError({ statusCode: 400, statusMessage: 'OTP tidak valid atau salah' });
    }

    if (new Date() > otpDoc.expiresAt) {
        await Otp.findByIdAndDelete(otpDoc._id);
        throw createError({ statusCode: 400, statusMessage: 'OTP sudah kadaluwarsa' });
    }

    if (type === 'register') {
        const user = await User.findOne({ email });
        if (!user) {
            throw createError({ statusCode: 404, statusMessage: 'User tidak ditemukan' });
        }

        user.emailVerifiedAt = new Date();
        await user.save();

        // Buat sesi login
        const payload = {
            userId: user._id.toString(),
        }

        const secretAuthKey = process.env.JWT_SECRET;
        if (!secretAuthKey) {
            throw createError({ statusCode: 500, message: 'JWT Secret is not defined in runtime config' });
        }

        const token = jwt.sign(payload, secretAuthKey, { expiresIn: '15m' })
        const refreshToken = jwt.sign(payload, secretAuthKey, { expiresIn: '7d' });

        user.refreshToken = refreshToken;
        await user.save();

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

        // Hapus OTP setelah berhasil
        await Otp.findByIdAndDelete(otpDoc._id);

        return { status: 'Verifikasi berhasil dan login sukses' };
    } else if (type === 'reset_password') {
        // Untuk reset password, cukup verify OTP dan kembalikan sukses
        // Frontend lalu memanggil endpoint reset-password
        return { status: 'OTP reset password valid' };
    } else {
        throw createError({ statusCode: 400, statusMessage: 'Tipe OTP tidak valid' });
    }
});

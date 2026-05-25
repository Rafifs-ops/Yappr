import { Otp } from '../models/Otp.schema';
import { User } from '../models/User.schema';
import bcrypt from 'bcryptjs';

export default defineEventHandler(async (event) => {
    const data = await readBody(event);
    const { email, otp, newPassword } = data;

    if (!email || !otp || !newPassword) {
        throw createError({ statusCode: 400, statusMessage: 'Data belum lengkap' });
    }

    // Verifikasi OTP sekali lagi untuk memastikan keamanan
    const otpDoc = await Otp.findOne({ email, otp, type: 'reset_password' });

    if (!otpDoc) {
        throw createError({ statusCode: 400, statusMessage: 'OTP tidak valid atau salah' });
    }

    if (new Date() > otpDoc.expiresAt) {
        await Otp.findByIdAndDelete(otpDoc._id);
        throw createError({ statusCode: 400, statusMessage: 'OTP sudah kadaluwarsa' });
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw createError({ statusCode: 404, statusMessage: 'User tidak ditemukan' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Hapus OTP setelah digunakan
    await Otp.findByIdAndDelete(otpDoc._id);

    return { status: 'Password berhasil diubah' };
});

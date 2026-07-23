import { prisma } from '../utils/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export default defineEventHandler(async (event) => {
    const data = await readBody(event);
    const { email, otp, newPassword } = data;

    if (!email || !otp || !newPassword) {
        throw createError({ statusCode: 400, statusMessage: 'Data belum lengkap' });
    }

    const hashedInput = crypto.createHash('sha256').update(otp).digest('hex');
    const otpDoc = await prisma.otp.findFirst({
        where: { email, otp: hashedInput, type: 'reset_password' }
    });

    if (!otpDoc) {
        throw createError({ statusCode: 400, statusMessage: 'OTP tidak valid atau salah' });
    }

    if (new Date() > otpDoc.expiresAt) {
        await prisma.otp.delete({ where: { id: otpDoc.id } });
        throw createError({ statusCode: 400, statusMessage: 'OTP sudah kadaluwarsa' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw createError({ statusCode: 404, statusMessage: 'User tidak ditemukan' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
    });

    await prisma.otp.delete({ where: { id: otpDoc.id } });

    return { status: 'Password berhasil diubah' };
});

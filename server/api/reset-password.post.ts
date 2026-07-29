import { prisma } from '../utils/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export default defineEventHandler(async (event) => {
    const data = await readBody(event); // Mengambil data body dari request
    const { otp, newPassword } = data; // Mengambil otp dan password baru dari data
    const email = data.email?.trim().toLowerCase(); // Mengambil email dari data dan mengubahnya menjadi huruf kecil

    // Validasi data
    if (!email || !otp || !newPassword) {
        throw createError({ statusCode: 400, statusMessage: 'Data belum lengkap' });
    }

    // Validasi password baru
    if (newPassword.length < 6) {
        throw createError({ statusCode: 400, statusMessage: 'Password baru minimal 6 karakter' });
    }

    const hashedInput = crypto.createHash('sha256').update(otp).digest('hex'); // Mengubah otp menjadi hash

    // Cek apakah otp ada
    const otpDoc = await prisma.otp.findFirst({
        where: { email, otp: hashedInput, type: 'reset_password' }
    });

    // Jika otp tidak ada
    if (!otpDoc) {
        throw createError({ statusCode: 400, statusMessage: 'OTP tidak valid atau salah' });
    }

    // Cek apakah otp sudah kadaluwarsa
    if (new Date() > otpDoc.expiresAt) {
        await prisma.otp.delete({ where: { id: otpDoc.id } }); // Menghapus otp yang sudah kadaluwarsa
        throw createError({ statusCode: 400, statusMessage: 'OTP sudah kadaluwarsa' });
    }

    // Cek apakah user ada
    const user = await prisma.user.findUnique({ where: { email } });
    // Jika user tidak ada
    if (!user) {
        throw createError({ statusCode: 404, statusMessage: 'User tidak ditemukan' });
    }

    // Mengubah password baru menjadi hash
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // Mengupdate password user dan me-reset refreshToken agar sesi di semua perangkat ter-logout
    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            refreshToken: null
        }
    });

    // Menghapus semua otp reset_password untuk email ini
    await prisma.otp.deleteMany({ where: { email, type: 'reset_password' } });

    return { status: 'Password berhasil diubah' };
});

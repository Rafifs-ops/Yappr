import { prisma } from '../utils/prisma';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

export default defineEventHandler(async (event) => {
    const data = await readBody(event); // Mengambil data body dari request
    const { type } = data; // Mengambil tipe dari data request. Reset Password or Register
    const email = data.email?.trim().toLowerCase(); // Mengambil email dari data dan mengubahnya menjadi huruf kecil

    // Validasi data
    if (!email || !type) {
        throw createError({ statusCode: 400, statusMessage: 'Email dan tipe (register/reset_password) wajib diisi' });
    }

    // Pengecekan setiap tipe
    if (type === 'register') {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw createError({ statusCode: 404, statusMessage: 'User tidak ditemukan. Silakan daftar terlebih dahulu.' });
        }
        if (user.emailVerifiedAt) {
            throw createError({ statusCode: 400, statusMessage: 'Email sudah terverifikasi' });
        }
    } else if (type === 'reset_password') {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw createError({ statusCode: 404, statusMessage: 'User tidak ditemukan' });
        }
    } else {
        throw createError({ statusCode: 400, statusMessage: 'Tipe OTP tidak valid' });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString(); // Membuat otp random 6 digit
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 menit

    const hashedOtp = crypto.createHash('sha256').update(otpCode).digest('hex'); // Mengubah otp menjadi hash

    await prisma.otp.deleteMany({ where: { email, type } }); // Menghapus otp yang sudah ada

    // Membuat otp baru
    await prisma.otp.create({
        data: {
            email,
            otp: hashedOtp,
            type,
            expiresAt
        }
    });

    // Mengirim email
    try {
        const config = useRuntimeConfig(); // Mengambil variabel env dari runTimeConfig
        if (config.emailUser && config.emailPass) { // Jika variabel env terisi

            // Konfigurasi transporter
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: config.emailUser,
                    pass: config.emailPass
                }
            });

            // Konfigurasi mail options
            const mailOptions = {
                from: `"Yappr App" <${config.emailUser}>`,
                to: email,
                subject: 'Kode Verifikasi Yappr Anda',
                html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h2>Selamat Datang di Yappr!</h2>
            <p>Kode OTP Anda adalah: <strong>${otpCode}</strong></p>
            <p>Kode ini berlaku selama 5 menit.</p>
          </div>
        `
            };

            await transporter.sendMail(mailOptions); // Mengirim email
            return { status: 'OTP berhasil dikirim' }; // Mengembalikan status OTP berhasil dikirim
        } else {
            console.warn("EMAIL_USER atau EMAIL_PASS kosong di .env. OTP tidak dikirim, tetapi disimpan di database untuk testing: " + otpCode);
            return { status: 'OTP berhasil dibuat untuk testing', devOtp: otpCode };
        }
    } catch (error: any) {
        console.error("nodemailer error:", error); // Error saat mengirim email

        // Jika bukan production, tampilkan otp di console
        if (process.env.NODE_ENV !== 'production') {
            console.warn(`[DEV MODE] OTP untuk ${email}: ${otpCode}`);
            return { status: 'OTP berhasil dibuat (DEV: cek console)', devOtp: otpCode };
        }

        // Jika production dan gagal mengirim email, tampilkan error
        throw createError({ statusCode: 500, statusMessage: 'Gagal mengirim email OTP: ' + (error instanceof Error ? error.message : 'Unknown error') });
    }
});

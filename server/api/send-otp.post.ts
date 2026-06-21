import { Otp } from '../models/Otp.schema';
import { User } from '../models/User.schema';
import nodemailer from 'nodemailer';

export default defineEventHandler(async (event) => {
    const data = await readBody(event);
    const { email, type } = data;

    if (!email || !type) {
        throw createError({ statusCode: 400, statusMessage: 'Email dan tipe (register/reset_password) wajib diisi' });
    }

    if (type === 'register') {
        const user = await User.findOne({ email });
        if (!user) {
            throw createError({ statusCode: 404, statusMessage: 'User tidak ditemukan. Silakan daftar terlebih dahulu.' });
        }
        if (user.emailVerifiedAt) {
            throw createError({ statusCode: 400, statusMessage: 'Email sudah terverifikasi' });
        }
    } else if (type === 'reset_password') {
        const user = await User.findOne({ email });
        if (!user) {
            throw createError({ statusCode: 404, statusMessage: 'User tidak ditemukan' });
        }
    } else {
        throw createError({ statusCode: 400, statusMessage: 'Tipe OTP tidak valid' });
    }

    // Generate 6 digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 menit

    // Simpan ke database (replace if exists for the same email and type)
    await Otp.deleteMany({ email, type });
    await Otp.create({ email, otp: otpCode, type, expiresAt });

    // Kirim email
    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: type === 'register' ? 'Verifikasi Email Yappr' : 'Reset Password Yappr',
        text: `Kode OTP Anda adalah: ${otpCode}. Kode ini akan kadaluwarsa dalam 5 menit.`
    };

    try {
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail(mailOptions);
        } else {
            console.warn("EMAIL_USER atau EMAIL_PASS kosong di .env. OTP tidak dikirim, tetapi disimpan di database untuk testing: " + otpCode);
        }
        return { status: 'OTP berhasil dikirim' };
    } catch (error) {
        throw createError({ statusCode: 500, statusMessage: 'Gagal mengirim email OTP' });
    }
});

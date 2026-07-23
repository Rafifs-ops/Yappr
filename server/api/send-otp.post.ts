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

    try {
        const config = useRuntimeConfig();
        if (config.emailUser && config.emailPass) {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: config.emailUser,
                    pass: config.emailPass
                }
            });

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

            await transporter.sendMail(mailOptions);
            return { status: 'OTP berhasil dikirim' };
        } else {
            console.warn("EMAIL_USER atau EMAIL_PASS kosong di .env. OTP tidak dikirim, tetapi disimpan di database untuk testing: " + otpCode);
            return { status: 'OTP berhasil dibuat untuk testing' };
        }
    } catch (error) {
        console.error("nodemailer error:", error);
        throw createError({ statusCode: 500, statusMessage: 'Gagal mengirim email OTP: ' + (error instanceof Error ? error.message : 'Unknown error') });
    }
});

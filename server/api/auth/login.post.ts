import { User } from "../../models/User.schema";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default defineEventHandler(async (event) => {
    const data = await readBody(event); // Mengambil data Request

    // Validasi apakah email dan password ada / tidak
    if (!data.password || !data.email) {
        throw createError({ statusCode: 400, statusMessage: 'Email atau Password belum ada' });
    }

    // Validasi format email (hanya gmail / yahoo)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail|yahoo)\.com$/;
    if (!emailRegex.test(data.email)) {
        throw createError({ statusCode: 400, statusMessage: 'Format email tidak valid. Gunakan format seperti @gmail.com atau @yahoo.com' });
    }

    // Mencari user berdasarkan email, output: objek
    const user = await User.findOne({ email: data.email });

    // Validasi apakah user ada/tidak, jika tidak ada maka throw error
    if (!user) {
        throw createError({ statusCode: 401, statusMessage: 'User belum terdaftar' });
    }

    // Validasi apakah email user sudah terverifikasi/belum, jika belum maka throw error
    if (!user.emailVerifiedAt) {
        throw createError({ statusCode: 403, statusMessage: 'Email belum terverifikasi' });
    }

    // Membandingkan password
    const isMatch = await bcrypt.compare(data.password, user.password);
    const secretAuthKey = process.env.JWT_SECRET; // Mengambil JWT Secret

    // Validasi JWT Secret
    if (!secretAuthKey) {
        throw createError({
            statusCode: 500,
            message: 'JWT Secret is not defined in runtime config'
        });
    }

    // Membuat payload
    const payload = {
        userId: user._id.toString(),
    }

    // Jika password cocok
    if (isMatch) {
        const token = jwt.sign(payload, secretAuthKey, { expiresIn: '49d' }) // Buat token dengan payload isi userId

        // Token disimpan di cookie dengan key 'auth_token' dan masa berlaku 7 minggu
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

import jwt from "jsonwebtoken";
import { prisma } from "./prisma";

// mengambil session
export const session = async (event: any) => {
    let token = getCookie(event, 'auth_token'); // Mengambil token dari cookie
    const refreshTokenCookie = getCookie(event, 'refresh_token'); // Mengambil refresh token dari cookie

    // mengambil JWT Secret dari environment variable
    const config = useRuntimeConfig();
    const secretAuthKey = config.jwtSecret;

    // Validasi JWT Secret apakah terdaftar atau tidak
    if (!secretAuthKey) {
        throw createError({
            statusCode: 500,
            message: 'JWT Secret is not defined in runtime config'
        });
    }

    // Validasi apakah token atau refresh token terdaftar atau tidak
    if (!token && !refreshTokenCookie) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    let decodedToken: any = null;

    // Validasi token
    if (token) {
        try {
            decodedToken = jwt.verify(token, secretAuthKey as string) as any;
        } catch (error: any) {
            // Jika token expired maka akan lanjut ke validasi refresh token
            if (error.name === 'TokenExpiredError') {
                decodedToken = null; // Biarkan lanjut ke validasi refresh token
            } else {
                deleteCookie(event, 'auth_token', { path: '/' }); // Menghapus cookie auth_token
                deleteCookie(event, 'refresh_token', { path: '/' }); // Menghapus cookie refresh_token
                throw createError({ statusCode: 401, statusMessage: 'Unauthorized' }); // Menampilkan error jika tidak dapat login
            }
        }
    }

    let existingUser: any = null;

    // Jika token expired maka akan mengambil refresh token
    if (!decodedToken && refreshTokenCookie) {
        try {
            const decodedRefresh = jwt.verify(refreshTokenCookie, secretAuthKey as string) as any; // Verifikasi refresh token
            const refreshUserId = decodedRefresh.id || decodedRefresh.userId;
            existingUser = await prisma.user.findUnique({ where: { id: refreshUserId } }); // Mengambil user berdasarkan refresh token

            // Jika user tidak ada, refreshToken null/sudah di-reset, atau refresh token tidak cocok, hapus cookie dan tampilkan error
            if (!existingUser || !existingUser.refreshToken || existingUser.refreshToken !== refreshTokenCookie) {
                deleteCookie(event, 'auth_token', { path: '/' }); // Menghapus cookie auth_token
                deleteCookie(event, 'refresh_token', { path: '/' }); // Menghapus cookie refresh_token
                throw createError({ statusCode: 401, statusMessage: 'Unauthorized' }); // Menampilkan error jika tidak dapat login
            }

            // Membuat token access baru (tanpa merotasi refreshToken di database agar terhindar dari race condition saat concurrent request atau SSR)
            const payload = { id: existingUser.id, username: existingUser.username, email: existingUser.email };
            token = jwt.sign(payload, secretAuthKey as string, { expiresIn: '15m' }); // Membuat token baru

            // Menyimpan token baru ke cookie
            setCookie(event, 'auth_token', token, {
                maxAge: 60 * 15,  // 15 menit
                httpOnly: true,
                secure: true,
                path: '/',
            });
            // Memperbarui masa aktif cookie refresh_token (7 hari) dengan nilai token yang sama
            setCookie(event, 'refresh_token', refreshTokenCookie, {
                maxAge: 60 * 60 * 24 * 7,  // 7 hari
                httpOnly: true,
                secure: true,
                path: '/',
            });

            decodedToken = payload; // Mengisi DecodedToken dengan payload baru
        } catch (error) {
            deleteCookie(event, 'auth_token', { path: '/' }); // Menghapus cookie auth_token
            deleteCookie(event, 'refresh_token', { path: '/' }); // Menghapus cookie refresh_token
            throw createError({ statusCode: 401, statusMessage: 'Unauthorized' }); // Menampilkan error jika tidak dapat login
        }
    }

    if (!decodedToken) {
        deleteCookie(event, 'auth_token', { path: '/' });
        deleteCookie(event, 'refresh_token', { path: '/' });
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    try {
        const userId = decodedToken.id || decodedToken.userId; // Mengambil user ID dari decoded token
        // Gunakan user yang sudah diambil saat validasi refresh token jika ada, atau query ke database
        const user = existingUser || await prisma.user.findUnique({ where: { id: userId } });

        // Jika user tidak ada maka akan menghapus cookie dan menampilkan error
        if (!user) {
            deleteCookie(event, 'auth_token', { path: '/' }); // Menghapus cookie auth_token
            deleteCookie(event, 'refresh_token', { path: '/' }); // Menghapus cookie refresh_token
            throw createError({ statusCode: 401, statusMessage: 'Unauthorized' }); // Menampilkan error jika tidak dapat login
        }

        const { password, refreshToken, ...userWithoutPassword } = user;
        return userWithoutPassword;
    } catch (error) {
        deleteCookie(event, 'auth_token', { path: '/' });
        deleteCookie(event, 'refresh_token', { path: '/' });
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }
};
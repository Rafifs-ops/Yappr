import { session } from '../../utils/session';
import { prisma } from '../../utils/prisma';

export default defineEventHandler(async (event) => {

    // Hapus refresh token di database user
    try {
        const auth = await session(event); //dapet data user dari jwt
        if (auth?.id) {
            await prisma.user.update({
                where: { id: auth.id },
                data: { refreshToken: null } // jadi pas di cek di server refresh token udah null
            });
        }
    } catch (e) {
        // Abaikan error jika token sesi sudah tidak valid/expired
    }

    // Menghapus cookie token
    deleteCookie(event, 'auth_token', { path: '/' });
    deleteCookie(event, 'refresh_token', { path: '/' });
    return {
        status: 'berhasil logout'
    }
})


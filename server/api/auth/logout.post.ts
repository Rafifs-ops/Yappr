import { session } from '../../utils/session';
import { prisma } from '../../utils/prisma';

export default defineEventHandler(async (event) => {
    try {
        const auth = await session(event);
        if (auth?.id) {
            await prisma.user.update({
                where: { id: auth.id },
                data: { refreshToken: null }
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


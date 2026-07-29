import { prisma } from "../../utils/prisma";
import { session } from "../../utils/session";

// Hanya untuk mengubah status isRead dari false menjadi true, tidak bisa mengubah status isRead menjadi false
export default defineEventHandler(async (event) => {
    try {
        const user = await session(event); // Mengambil user dari session

        // Jika tidak ada user
        if (!user) {
            throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
        }

        // Mengambil id dari router param
        const id = getRouterParam(event, 'id');
        if (!id) {
            throw createError({ statusCode: 400, statusMessage: 'ID required' });
        }

        // Mencari notifikasi
        const notification = await prisma.notification.findFirst({
            where: { id, userId: user.id }
        });

        // Jika tidak ada notifikasi
        if (!notification) {
            throw createError({ statusCode: 404, statusMessage: 'Notification not found' });
        }

        // Update notifikasi
        const updated = await prisma.notification.update({
            where: { id: notification.id },
            data: { isRead: true }
        });

        return { ...updated, _id: updated.id };
    } catch (error: any) {
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message });
    }
});

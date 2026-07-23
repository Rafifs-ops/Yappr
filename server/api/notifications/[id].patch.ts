import { prisma } from "../../utils/prisma";
import { session } from "../../utils/session";

export default defineEventHandler(async (event) => {
    try {
        const user = await session(event);
        if (!user) {
            throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
        }

        const id = getRouterParam(event, 'id');
        if (!id) {
            throw createError({ statusCode: 400, statusMessage: 'ID required' });
        }

        const notification = await prisma.notification.findFirst({
            where: { id, userId: user.id }
        });

        if (!notification) {
            throw createError({ statusCode: 404, statusMessage: 'Notification not found' });
        }

        const updated = await prisma.notification.update({
            where: { id: notification.id },
            data: { isRead: true }
        });

        return { ...updated, _id: updated.id };
    } catch (error: any) {
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message });
    }
});

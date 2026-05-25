import { Notification } from "../../models/Notification.schema";
import { session } from "../../utils/session";

export default defineEventHandler(async (event) => {
    try {
        const user = await session(event);
        if (!user) {
            throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
        }

        const id = getRouterParam(event, 'id');

        const notification = await Notification.findOneAndUpdate(
            { _id: id, user: user.id },
            { isRead: true },
            { returnDocument: 'after' }
        );

        if (!notification) {
            throw createError({ statusCode: 404, statusMessage: 'Notification not found' });
        }

        return notification;
    } catch (error: any) {
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message });
    }
});

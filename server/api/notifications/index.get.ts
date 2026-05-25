import { Notification } from "../../models/Notification.schema";
import { session } from "../../utils/session";

export default defineEventHandler(async (event) => {
    try {
        const user = await session(event);
        if (!user) {
            throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
        }

        const notifications = await Notification.find({ user: user.id })
            .populate('sender', 'username name profileImage')
            .sort({ createdAt: -1 });

        return notifications;
    } catch (error: any) {
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message });
    }
});

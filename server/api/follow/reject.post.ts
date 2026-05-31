import { Follow } from "../../models/Follow.schema";
import { Notification } from "../../models/Notification.schema";

export default defineEventHandler(async (event) => {
    try {
        const { follower, following } = await readBody(event);

        // Delete the pending follow request
        const follow = await Follow.findOneAndDelete({ 
            follower, 
            following, 
            status: 'pending' 
        });

        if (!follow) {
            throw createError({ statusCode: 404, statusMessage: 'Follow request not found' });
        }

        // Delete the notification
        await Notification.findOneAndDelete({
            user: following,
            sender: follower,
            type: 'follow_request'
        });

        return {
            statusCode: 200,
            statusMessage: "Follow request rejected",
        };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        });
    }
});

import { Follow } from "../../models/Follow.schema";
import { Notification } from "../../models/Notification.schema";
import { User } from "../../models/User.schema";

export default defineEventHandler(async (event) => {
    try {
        const { follower, following } = await readBody(event);
        const follow = new Follow({ follower, following });
        await follow.save();

        // Create Notification
        if (follower !== following) {
            await Notification.create({
                user: following,
                sender: follower,
                type: 'follow',
                message: 'mulai mengikuti Anda'
            });

            await User.findByIdAndUpdate(follower, { $inc: { following: 1 } });
            await User.findByIdAndUpdate(following, { $inc: { followers: 1 } });
        }

        return {
            statusCode: 201,
            statusMessage: "User followed successfully",
        };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        });
    }
});


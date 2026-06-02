import { Follow } from "../../models/Follow.schema";
import { Notification } from "../../models/Notification.schema";
import { User } from "../../models/User.schema";

export default defineEventHandler(async (event) => {
    try {
        const { follower, following } = await readBody(event);

        const targetUser = await User.findById(following);
        if (!targetUser) throw createError({ statusCode: 404, statusMessage: 'User not found' });

        const isPrivate = targetUser.isPrivate;
        const status = isPrivate ? 'pending' : 'accepted';

        const follow = new Follow({ follower, following, status });
        await follow.save();

        // Create Notification
        if (follower !== following) {
            if (isPrivate) {
                await Notification.create({
                    user: following,
                    sender: follower,
                    type: 'follow_request',
                    message: 'meminta untuk mengikuti Anda'
                });
            } else {
                await Notification.create({
                    user: following,
                    sender: follower,
                    type: 'follow',
                    message: 'mulai mengikuti Anda'
                });

                await User.findByIdAndUpdate(follower, { $inc: { following: 1 } }); // Yang ngefollow, followingnya nambah 1
                await User.findByIdAndUpdate(following, { $inc: { followers: 1 } }); // Yang difollow, followersnya nambah 1
            }
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


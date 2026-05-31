import { Follow } from "../../models/Follow.schema";
import { Notification } from "../../models/Notification.schema";
import { User } from "../../models/User.schema";

export default defineEventHandler(async (event) => {
    try {
        const { follower, following } = await readBody(event);

        // Update the follow status to 'accepted'
        const follow = await Follow.findOneAndUpdate(
            { follower, following, status: 'pending' },
            { status: 'accepted' },
            { new: true }
        );

        if (!follow) {
            throw createError({ statusCode: 404, statusMessage: 'Follow request not found' });
        }

        // Increment follower/following counts
        await User.findByIdAndUpdate(follower, { $inc: { following: 1 } });
        await User.findByIdAndUpdate(following, { $inc: { followers: 1 } });

        // Update notification to read or delete it
        await Notification.findOneAndDelete({
            user: following,
            sender: follower,
            type: 'follow_request'
        });

        // Create accepted notification
        await Notification.create({
            user: follower,
            sender: following,
            type: 'follow_accept',
            message: 'telah menyetujui permintaan mengikuti Anda'
        });

        return {
            statusCode: 200,
            statusMessage: "Follow request accepted",
        };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        });
    }
});

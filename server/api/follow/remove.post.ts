import { Follow } from "../../models/Follow.schema";
import { User } from "../../models/User.schema";

export default defineEventHandler(async (event) => {
    try {
        const { follower, following } = await readBody(event);
        const follow = await Follow.findOneAndDelete({ follower, following });

        if (follow && follow.status === 'accepted') {
            await User.findByIdAndUpdate(follower, { $inc: { following: -1 } });
            await User.findByIdAndUpdate(following, { $inc: { followers: -1 } });
        }

        return {
            statusCode: 200,
            statusMessage: "Follow removed successfully",
        };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        });
    }
});


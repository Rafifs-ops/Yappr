import { Follow } from "../../models/Follow.schema";
import { User } from "../../models/User.schema";

export default defineEventHandler(async (event) => {
    try {
        const { follower, following } = await readBody(event);
        await Follow.deleteOne({ follower, following });

        await User.findByIdAndUpdate(follower, { $inc: { following: -1 } });
        await User.findByIdAndUpdate(following, { $inc: { followers: -1 } });

        return {
            statusCode: 200,
            statusMessage: "User unfollowed successfully",
        };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        });
    }
});


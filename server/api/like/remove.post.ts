import { Like } from "../../models/Like.schema";
import { Twit } from "../../models/Twit.schema";
import { session } from "../../utils/session";

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event);
        const user = await session(event);

        if (!body.twitId || !user) {
            throw createError({ statusCode: 400, statusMessage: 'twit dan user tidak ada' });
        }

        const removedLike = await Like.deleteOne({
            twit: body.twitId,
            user: user.id,
        });

        const updateTwit = await Twit.updateOne(
            { _id: body.twitId },
            { $inc: { likesCount: -1 } }
        );

        return {
            removedLike,
            updateTwit
        };

    } catch (error: any) {
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message });
    }
});

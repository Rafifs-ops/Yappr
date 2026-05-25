import { Repost } from "../../models/Repost.schema";
import { Twit } from "../../models/Twit.schema";
import { session } from "../../utils/session";

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event);
        const user = await session(event);

        if (!body.twitId || !user) {
            throw createError({ statusCode: 400, statusMessage: 'twit dan user tidak ada' });
        }

        const removedRepost = await Repost.deleteOne({
            twit: body.twitId,
            user: user.id,
        });

        const updateTwit = await Twit.updateOne(
            { _id: body.twitId },
            { $inc: { repostCount: -1 } }
        );

        return {
            removedRepost,
            updateTwit
        };

    } catch (error: any) {
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message });
    }
});

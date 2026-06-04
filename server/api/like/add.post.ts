import { Like } from "../../models/Like.schema";
import { Twit } from "../../models/Twit.schema";
import { Notification } from "../../models/Notification.schema";
import { session } from "../../utils/session";

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event);
        const user = await session(event);

        if (!body.twitId || !user) {
            throw createError({ statusCode: 400, statusMessage: 'twit dan user tidak ada' });
        }

        const newLike = await Like.create({
            twit: body.twitId, // id twit yang di like
            user: user.id, // id user yang like
        });

        // Create Notification
        const twit = await Twit.findById(body.twitId);
        if (twit && twit.user.toString() !== user.id.toString()) {
            await Notification.create({
                user: twit.user,
                sender: user.id,
                type: 'like',
                message: 'menyukai twit Anda',
                twitText: twit.text,
                twitId: body.twitId,
            });
        }

        const updateTwit = await Twit.updateOne(
            { _id: body.twitId },
            { $inc: { likesCount: 1 } }
        );

        return {
            newLike,
            updateTwit
        };

    } catch (error: any) {
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message });
    }
});

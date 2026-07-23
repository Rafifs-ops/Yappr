import { prisma } from "../../utils/prisma";
import { session } from "../../utils/session";

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event);
        const user = await session(event);

        if (!body.twitId || !user) {
            throw createError({ statusCode: 400, statusMessage: 'twit dan user tidak ada' });
        }

        const removedLike = await prisma.like.deleteMany({
            where: {
                twitId: body.twitId,
                userId: user.id,
            }
        });

        const updateTwit = await prisma.twit.update({
            where: { id: body.twitId },
            data: { likesCount: { decrement: 1 } }
        });

        return {
            removedLike,
            updateTwit
        };

    } catch (error: any) {
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message });
    }
});

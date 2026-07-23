import { prisma } from "../../utils/prisma";
import { session } from "../../utils/session";

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event);
        const user = await session(event);

        if (!body.twitId || !user) {
            throw createError({ statusCode: 400, statusMessage: 'twit dan user tidak ada' });
        }

        const newRepost = await prisma.repost.create({
            data: {
                twitId: body.twitId,
                userId: user.id,
            }
        });

        const twit = await prisma.twit.findUnique({ where: { id: body.twitId } });
        if (twit && twit.userId !== user.id) {
            await prisma.notification.create({
                data: {
                    userId: twit.userId,
                    senderId: user.id,
                    type: 'repost',
                    message: 'memposting ulang twit Anda',
                    twitText: twit.text,
                    twitId: body.twitId,
                }
            });
        }

        const updateTwit = await prisma.twit.update({
            where: { id: body.twitId },
            data: { repostCount: { increment: 1 } }
        });

        return {
            newRepost,
            updateTwit
        };

    } catch (error: any) {
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message });
    }
});

import { prisma } from "../../utils/prisma";
import { session } from "../../utils/session";

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event); // Mengambil data body request
        const user = await session(event); // Mengambil user dari session

        // Memeriksa apakah body twit dan user ada
        if (!body.twitId || !user) {
            throw createError({ statusCode: 400, statusMessage: 'twit dan user tidak ada' });
        }

        // Menghapus repost
        const removedRepost = await prisma.repost.deleteMany({
            where: {
                twitId: body.twitId,
                userId: user.id,
            }
        });

        // Update jumlah repost pada twit
        const updateTwit = await prisma.twit.update({
            where: { id: body.twitId },
            data: { repostCount: { decrement: 1 } }
        });

        return {
            removedRepost,
            updateTwit
        };

    } catch (error: any) {
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message });
    }
});

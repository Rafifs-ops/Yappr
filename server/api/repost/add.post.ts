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

        // Membuat repost baru
        const newRepost = await prisma.repost.create({
            data: {
                twitId: body.twitId,
                userId: user.id,
            }
        });

        const twit = await prisma.twit.findUnique({ where: { id: body.twitId } }); // Mencari twit yang di repost

        // jika twit ada dan user yang repost bukan user yang memposting twit
        if (twit && twit.userId !== user.id) {
            // Membuat notifikasi untuk user yang memposting twit
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

        // Update jumlah repost pada twit
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

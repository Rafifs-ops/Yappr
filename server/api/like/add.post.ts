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

        // Membuat like baru
        const newLike = await prisma.like.create({
            data: {
                twitId: body.twitId,
                userId: user.id
            }
        });

        // Mencari twit yang di like
        const twit = await prisma.twit.findUnique({ where: { id: body.twitId } });
        // Jika twit ditemukan dan user yang login bukan pemilik twit
        if (twit && twit.userId !== user.id) {
            // Membuat notifikasi
            await prisma.notification.create({
                data: {
                    userId: twit.userId,
                    senderId: user.id,
                    type: 'like',
                    message: 'menyukai twit Anda',
                    twitText: twit.text,
                    twitId: body.twitId,
                }
            });
        }

        // Update jumlah like pada twit
        const updateTwit = await prisma.twit.update({
            where: { id: body.twitId },
            data: { likesCount: { increment: 1 } }
        });

        // Mengembalikan data like baru dan twit yang di update
        return {
            newLike,
            updateTwit
        };

    } catch (error: any) {
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message });
    }
});

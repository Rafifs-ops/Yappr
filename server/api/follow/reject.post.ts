import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
    try {
        const { follower, following } = await readBody(event); // Mengambil data follower dan following dari body request

        // Mencari data follow berdasarkan follower dan following
        const followRecord = await prisma.follow.findFirst({
            where: { followerId: follower, followingId: following, status: 'pending' }
        });

        // Jika data follow tidak ditemukan
        if (!followRecord) {
            throw createError({ statusCode: 404, statusMessage: 'Follow request not found' });
        }

        // Hapus data follow
        await prisma.follow.delete({
            where: { id: followRecord.id }
        });

        // Hapus notifikasi follow request
        await prisma.notification.deleteMany({
            where: {
                userId: following,
                senderId: follower,
                type: 'follow_request'
            }
        });

        return {
            statusCode: 200,
            statusMessage: "Follow request rejected",
        };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        });
    }
});

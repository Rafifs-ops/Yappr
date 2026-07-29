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

        // Update data follow menjadi accepted
        await prisma.follow.update({
            where: { id: followRecord.id },
            data: { status: 'accepted' }
        });

        // Update jumlah following pada user yang login
        await prisma.user.update({
            where: { id: follower },
            data: { following: { increment: 1 } }
        });

        // Update jumlah followers pada user yang diikuti
        await prisma.user.update({
            where: { id: following },
            data: { followers: { increment: 1 } }
        });

        // Hapus notifikasi follow request
        await prisma.notification.deleteMany({
            where: {
                userId: following,
                senderId: follower,
                type: 'follow_request'
            }
        });

        // Membuat notifikasi follow accept
        await prisma.notification.create({
            data: {
                userId: follower,
                senderId: following,
                type: 'follow_accept',
                message: 'telah menyetujui permintaan mengikuti Anda'
            }
        });

        return {
            statusCode: 200,
            statusMessage: "Follow request accepted",
        };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        });
    }
});

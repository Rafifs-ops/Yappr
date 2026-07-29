import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
    try {
        const { follower, following } = await readBody(event); // Mengambil data follower dan following dari body request

        // Mencari data follow berdasarkan follower dan following
        const followRecord = await prisma.follow.findFirst({
            where: { followerId: follower, followingId: following }
        });

        // Jika data follow ditemukan
        if (followRecord) {
            // Hapus data follow
            await prisma.follow.delete({
                where: { id: followRecord.id }
            });

            // Update jumlah following pada user yang login
            if (followRecord.status === 'accepted') {
                await prisma.user.update({
                    where: { id: follower },
                    data: { following: { decrement: 1 } }
                });
                // Update jumlah followers pada user yang diikuti
                await prisma.user.update({
                    where: { id: following },
                    data: { followers: { decrement: 1 } }
                });
            }
        }

        return {
            statusCode: 200,
            statusMessage: "Follow removed successfully",
        };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        });
    }
});

import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
    try {
        const { follower, following } = await readBody(event);

        const followRecord = await prisma.follow.findFirst({
            where: { followerId: follower, followingId: following, status: 'pending' }
        });

        if (!followRecord) {
            throw createError({ statusCode: 404, statusMessage: 'Follow request not found' });
        }

        await prisma.follow.update({
            where: { id: followRecord.id },
            data: { status: 'accepted' }
        });

        await prisma.user.update({
            where: { id: follower },
            data: { following: { increment: 1 } }
        });
        await prisma.user.update({
            where: { id: following },
            data: { followers: { increment: 1 } }
        });

        await prisma.notification.deleteMany({
            where: {
                userId: following,
                senderId: follower,
                type: 'follow_request'
            }
        });

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

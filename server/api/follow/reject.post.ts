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

        await prisma.follow.delete({
            where: { id: followRecord.id }
        });

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

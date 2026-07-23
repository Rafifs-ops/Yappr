import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
    try {
        const { follower, following } = await readBody(event);

        const followRecord = await prisma.follow.findFirst({
            where: { followerId: follower, followingId: following }
        });

        if (followRecord) {
            await prisma.follow.delete({
                where: { id: followRecord.id }
            });

            if (followRecord.status === 'accepted') {
                await prisma.user.update({
                    where: { id: follower },
                    data: { following: { decrement: 1 } }
                });
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

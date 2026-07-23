import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
    try {
        const { follower, following } = await readBody(event);

        const targetUser = await prisma.user.findUnique({ where: { id: following } });
        if (!targetUser) throw createError({ statusCode: 404, statusMessage: 'User not found' });

        const isPrivate = targetUser.isPrivate;
        const status = isPrivate ? 'pending' : 'accepted';

        await prisma.follow.create({
            data: {
                followerId: follower,
                followingId: following,
                status: status
            }
        });

        if (follower !== following) {
            if (isPrivate) {
                await prisma.notification.create({
                    data: {
                        userId: following,
                        senderId: follower,
                        type: 'follow_request',
                        message: 'meminta untuk mengikuti Anda'
                    }
                });
            } else {
                await prisma.notification.create({
                    data: {
                        userId: following,
                        senderId: follower,
                        type: 'follow',
                        message: 'mulai mengikuti Anda'
                    }
                });

                await prisma.user.update({
                    where: { id: follower },
                    data: { following: { increment: 1 } }
                });
                await prisma.user.update({
                    where: { id: following },
                    data: { followers: { increment: 1 } }
                });
            }
        }

        return {
            statusCode: 201,
            statusMessage: "User followed successfully",
        };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        });
    }
});

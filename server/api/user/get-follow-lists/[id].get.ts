import { prisma } from '../../../utils/prisma';

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');
        if (!id) {
            throw createError({ statusCode: 400, statusMessage: 'User ID is required' });
        }

        const followers = await prisma.follow.findMany({
            where: {
                followingId: id,
                status: 'accepted'
            },
            include: {
                follower: {
                    select: {
                        id: true,
                        username: true,
                        photo: true
                    }
                }
            }
        });

        const following = await prisma.follow.findMany({
            where: {
                followerId: id,
                status: 'accepted'
            },
            include: {
                following: {
                    select: {
                        id: true,
                        username: true,
                        photo: true
                    }
                }
            }
        });

        return {
            followers: followers.map((f: any) => ({ ...f.follower, _id: f.follower.id })),
            following: following.map((f: any) => ({ ...f.following, _id: f.following.id }))
        };
    } catch (error) {
        console.log(error);
    }
});
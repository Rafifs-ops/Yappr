import { prisma } from '../../../utils/prisma';

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id'); // Mengambil id dari parameter router

        // Jika tidak ada id
        if (!id) {
            throw createError({ statusCode: 400, statusMessage: 'User ID is required' });
        }

        // Mengambil followers
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

        // Mengambil following
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
        }; // output: { followers: [{ _id: string, username: string, photo: string }], following: [{ _id: string, username: string, photo: string }] }
    } catch (error: any) {
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message });
    }
});
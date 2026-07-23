import { prisma } from '../../utils/prisma';
import { session } from "../../utils/session";

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');
        if (!id) {
            throw createError({ statusCode: 400, statusMessage: 'User ID is required' });
        }

        const userDb = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                photo: true,
                email: true,
                bio: true,
                emailVerifiedAt: true,
                followers: true,
                following: true,
                isPrivate: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!userDb) {
            throw createError({ statusCode: 404, statusMessage: 'User tidak ditemukan' });
        }

        const userTweetsRaw = await prisma.twit.findMany({
            where: { userId: id },
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        email: true,
                        bio: true,
                        photo: true,
                        isPrivate: true
                    }
                }
            }
        });

        const userTweets = userTweetsRaw.map((t: any) => ({
            ...t,
            _id: t.id,
            user: { ...t.user, _id: t.user.id }
        }));

        let currentUser = null;
        try {
            currentUser = await session(event);
        } catch (e) {
            // Abaikan jika user belum login
        }

        const formattedUserDb = { ...userDb, _id: userDb.id };

        if (!currentUser) {
            return {
                user: formattedUserDb,
                tweets: userDb.isPrivate ? [] : userTweets,
                isFollowed: false,
                followStatus: null
            };
        }

        const userFollow = await prisma.follow.findFirst({
            where: {
                followerId: currentUser.id,
                followingId: id
            }
        });

        const isFollowed = !!userFollow && (!userFollow.status || userFollow.status === 'accepted');
        const followStatus = userFollow?.status || null;

        let tweets = userTweets;
        if (userDb.isPrivate && currentUser.id !== id && !isFollowed) {
            tweets = [];
        }

        return {
            user: formattedUserDb,
            tweets: tweets,
            isFollowed: isFollowed,
            followStatus: followStatus
        };

    } catch (error: any) {
        if (error.statusCode === 404 || error.statusCode === 400) {
            throw error;
        }
        console.error('Error fetching profile data:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error'
        });
    }
});

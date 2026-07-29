import { prisma } from '../../utils/prisma';
import { session } from "../../utils/session";

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id'); // Mengambil id dari parameter router

        // Jika tidak ada id
        if (!id) {
            throw createError({ statusCode: 400, statusMessage: 'User ID is required' });
        }

        // Mencari user
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

        // Jika tidak ada user
        if (!userDb) {
            throw createError({ statusCode: 404, statusMessage: 'User tidak ditemukan' });
        }

        // Mencari twit user
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

        // Mengubah format twit user
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

        // Mengubah format user
        const formattedUserDb = { ...userDb, _id: userDb.id };

        // Jika tidak ada user
        if (!currentUser) {
            return {
                user: formattedUserDb,
                tweets: userDb.isPrivate ? [] : userTweets,
                isFollowed: false,
                followStatus: null
            };
        }

        // Mencari follow
        const userFollow = await prisma.follow.findFirst({
            where: {
                followerId: currentUser.id,
                followingId: id
            }
        });

        // Mengubah format follow
        const isFollowed = !!userFollow && (!userFollow.status || userFollow.status === 'accepted');
        const followStatus = userFollow?.status || null;

        let tweets = userTweets;
        // Jika user private dan bukan dirinya sendiri
        if (userDb.isPrivate && currentUser.id !== id && !isFollowed) {
            tweets = [];
        }

        return {
            user: formattedUserDb,
            tweets: tweets,
            isFollowed: isFollowed,
            followStatus: followStatus
        }; // output: { user: { _id: string, username: string, photo: string, email: string, bio: string, emailVerifiedAt: string, followers: number, following: number, isPrivate: boolean, createdAt: string, updatedAt: string }, tweets: [{ _id: string, user: { _id: string, username: string, email: string, bio: string, photo: string, isPrivate: boolean }, text: string, isPinned: boolean, isQuote: boolean, quoteTo: string, likesCount: number, repostCount: number, replyCount: number, isLiked: boolean, isReposted: boolean }], isFollowed: boolean, followStatus: string }

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

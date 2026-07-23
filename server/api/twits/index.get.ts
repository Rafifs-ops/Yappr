import { prisma } from "../../utils/prisma";
import { session } from "../../utils/session";

/**
 * Helper to format Prisma Twit object for frontend compatibility
 */
const formatTwit = (twit: any) => {
    if (!twit) return null;
    return {
        ...twit,
        _id: twit.id,
        user: twit.user ? {
            ...twit.user,
            _id: twit.user.id
        } : null,
        SubTwit: {
            isSubTwit: twit.isSubTwit,
            reference: twit.reference ? {
                ...twit.reference,
                _id: twit.reference.id,
                user: twit.reference.user ? {
                    ...twit.reference.user,
                    _id: twit.reference.user.id
                } : null
            } : null
        }
    };
};

export default defineEventHandler(async (event) => {
    const queryParams = getQuery(event);
    const cursor = queryParams.cursor;
    const limit = Math.min(parseInt(queryParams.limit as string) || 10, 50);

    let currentUser = null;
    try {
        currentUser = await session(event);
    } catch (e) {
        // Guest view
    }

    try {
        let paginationDate = new Date();
        if (cursor && cursor !== 'undefined' && cursor !== 'null') {
            const parsedDate = new Date(cursor as string);
            if (!isNaN(parsedDate.getTime())) {
                paginationDate = parsedDate;
            }
        }

        if (!currentUser) {
            const publicTwits = await prisma.twit.findMany({
                where: {
                    user: { isPrivate: false },
                    ...(cursor && cursor !== 'undefined' && cursor !== 'null' ? { createdAt: { lt: paginationDate } } : {})
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                include: {
                    user: { select: { id: true, username: true, photo: true } },
                    reference: {
                        include: {
                            user: { select: { id: true, username: true, photo: true } }
                        }
                    }
                }
            });

            return publicTwits.map(t => ({
                ...formatTwit(t),
                isLiked: false,
                isReposted: false
            }));
        }

        const following = await prisma.follow.findMany({
            where: {
                followerId: currentUser.id,
                status: 'accepted'
            },
            select: { followingId: true }
        });

        const followingIds = following.map(f => f.followingId);
        followingIds.push(currentUser.id);

        const twitIdsResult = await prisma.twit.findMany({
            where: {
                userId: { in: followingIds },
                ...(cursor && cursor !== 'undefined' && cursor !== 'null' ? { createdAt: { lt: paginationDate } } : {})
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: { id: true, createdAt: true }
        });

        const repostsResult = await prisma.repost.findMany({
            where: {
                userId: { in: followingIds },
                ...(cursor && cursor !== 'undefined' && cursor !== 'null' ? { createdAt: { lt: paginationDate } } : {})
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: { twitId: true, createdAt: true }
        });

        const likesResult = await prisma.like.findMany({
            where: {
                userId: { in: followingIds },
                ...(cursor && cursor !== 'undefined' && cursor !== 'null' ? { createdAt: { lt: paginationDate } } : {})
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: { twitId: true, createdAt: true }
        });

        const combined = [
            ...twitIdsResult.map(t => ({ id: t.id, date: t.createdAt })),
            ...repostsResult.map(r => ({ id: r.twitId, date: r.createdAt })),
            ...likesResult.map(l => ({ id: l.twitId, date: l.createdAt }))
        ].filter(item => item.id);

        combined.sort((a, b) => b.date.getTime() - a.date.getTime());

        const topIds: string[] = [];
        const seen = new Set();
        for (const item of combined) {
            if (!seen.has(item.id)) {
                seen.add(item.id);
                topIds.push(item.id);
                if (topIds.length >= limit) break;
            }
        }

        if (topIds.length === 0) return [];

        const finalTwits = await prisma.twit.findMany({
            where: { id: { in: topIds } },
            include: {
                user: { select: { id: true, username: true, photo: true } },
                reference: {
                    include: {
                        user: { select: { id: true, username: true, photo: true } }
                    }
                }
            }
        });

        const myLikes = await prisma.like.findMany({
            where: { userId: currentUser.id, twitId: { in: topIds } },
            select: { twitId: true }
        });

        const myReposts = await prisma.repost.findMany({
            where: { userId: currentUser.id, twitId: { in: topIds } },
            select: { twitId: true }
        });

        const likedSet = new Set(myLikes.map(l => l.twitId));
        const repostedSet = new Set(myReposts.map(r => r.twitId));

        const result = topIds.map(id => {
            const twit = finalTwits.find(t => t.id === id);
            if (!twit) return null;
            return {
                ...formatTwit(twit),
                isLiked: likedSet.has(id),
                isReposted: repostedSet.has(id)
            };
        }).filter(Boolean);

        return result;

    } catch (error: any) {
        console.error("Index GET error:", error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Error: ' + (error.stack || error.message)
        });
    }
});

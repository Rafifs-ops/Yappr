import { prisma } from "../../../../utils/prisma";
import { session } from "../../../../utils/session";

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'userId');
        if (!id) throw createError({ statusCode: 400, statusMessage: 'User ID required' });

        const searchLiked = await prisma.like.findMany({
            where: { userId: id },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                twit: {
                    include: {
                        user: { select: { id: true, username: true, photo: true, isPrivate: true } },
                        reference: {
                            include: {
                                user: { select: { id: true, username: true, photo: true } }
                            }
                        }
                    }
                }
            }
        });

        let twits = searchLiked.map(l => l.twit).filter(Boolean);

        let currentUser = null;
        try {
            currentUser = await session(event);
        } catch (e) {
            // Abaikan jika user belum login
        }

        let followingIds: string[] = [];
        if (currentUser) {
            const following = await prisma.follow.findMany({
                where: { followerId: currentUser.id, status: 'accepted' },
                select: { followingId: true }
            });
            followingIds = following.map(f => f.followingId);
        }

        twits = twits.filter((twit: any) => {
            const author = twit.user;
            if (!author?.isPrivate) return true;
            if (currentUser && author.id === currentUser.id) return true;
            if (followingIds.includes(author.id)) return true;
            return false;
        });

        const formattedTwits = twits.map(twit => ({
            ...twit,
            _id: twit.id,
            user: twit.user ? { ...twit.user, _id: twit.user.id } : null,
            SubTwit: {
                isSubTwit: twit.isSubTwit,
                reference: twit.reference ? {
                    ...twit.reference,
                    _id: twit.reference.id,
                    user: twit.reference.user ? { ...twit.reference.user, _id: twit.reference.user.id } : null
                } : null
            }
        }));

        if (!currentUser) {
            return formattedTwits.map(twit => ({ ...twit, isLiked: false, isReposted: false }));
        }

        const twitIds = formattedTwits.map(t => t.id);

        const userLikes = await prisma.like.findMany({
            where: { userId: currentUser.id, twitId: { in: twitIds } },
            select: { twitId: true }
        });
        const userReposts = await prisma.repost.findMany({
            where: { userId: currentUser.id, twitId: { in: twitIds } },
            select: { twitId: true }
        });

        const likedTwitIds = new Set(userLikes.map(l => l.twitId));
        const repostedTwitIds = new Set(userReposts.map(r => r.twitId));

        return formattedTwits.map(twit => ({
            ...twit,
            isLiked: likedTwitIds.has(twit.id),
            isReposted: repostedTwitIds.has(twit.id)
        }));
    } catch (error: any) {
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message });
    }
});

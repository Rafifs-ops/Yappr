import { prisma } from "../../../../utils/prisma";
import { session } from "../../../../utils/session";
import { formatTwit } from "../../../../utils/formatTwit";

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'userId'); // Mengambil ID user dari router params
        if (!id) throw createError({ statusCode: 400, statusMessage: 'User ID required' });

        const searchReposted = await prisma.repost.findMany({
            where: { userId: id }, // Mencari twit yang di repost oleh user
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                twit: {
                    include: {
                        user: { select: { id: true, username: true, photo: true, isPrivate: true } },
                        hashtags: { select: { tag: true } },
                        reference: {
                            include: {
                                user: { select: { id: true, username: true, photo: true } },
                                hashtags: { select: { tag: true } }
                            }
                        }
                    }
                }
            }
        });

        let twits = searchReposted.map(r => r.twit).filter(Boolean);

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

        const formattedTwits = twits.map(twit => formatTwit(twit));

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

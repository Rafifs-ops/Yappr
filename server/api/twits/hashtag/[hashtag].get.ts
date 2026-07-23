import { prisma } from "../../../utils/prisma";
import { session } from "../../../utils/session";

export default defineEventHandler(async (event) => {
    try {
        const tagParam = event.context?.params?.hashtag?.toLowerCase();
        if (!tagParam) return [];

        const matchingHashtags: any = await prisma.twitHashtag.findMany({
            where: { tag: tagParam },
            select: { twitId: true }
        });

        const twitIdsForHashtag = matchingHashtags.map((h: any) => h.twitId);

        const twits: any = await prisma.twit.findMany({
            where: { id: { in: twitIdsForHashtag } },
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: {
                user: { select: { id: true, username: true, photo: true, isPrivate: true } },
                reference: {
                    include: {
                        user: { select: { id: true, username: true, photo: true, isPrivate: true } }
                    }
                }
            }
        });

        let currentUser = null;
        try {
            currentUser = await session(event);
        } catch (e) {
            // Ignore if not logged in
        }

        let followingIds: string[] = [];
        if (currentUser) {
            const following = await prisma.follow.findMany({
                where: { followerId: currentUser.id, status: 'accepted' },
                select: { followingId: true }
            });
            followingIds = following.map((f: any) => f.followingId);
        }

        const filteredTwits = twits.filter((twit: any) => {
            const author = twit.user;
            if (!author?.isPrivate) return true;
            if (currentUser && author.id === currentUser.id) return true;
            if (followingIds.includes(author.id)) return true;
            return false;
        });

        const formattedTwits = filteredTwits.map((twit: any) => ({
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
            return formattedTwits.map((twit: any) => ({ ...twit, isLiked: false, isReposted: false }));
        }

        const twitIds = formattedTwits.map((t: any) => t.id);

        const userLikes = await prisma.like.findMany({
            where: { userId: currentUser.id, twitId: { in: twitIds } },
            select: { twitId: true }
        });
        const userReposts = await prisma.repost.findMany({
            where: { userId: currentUser.id, twitId: { in: twitIds } },
            select: { twitId: true }
        });

        const likedTwitIds = new Set(userLikes.map((like: any) => like.twitId));
        const repostedTwitIds = new Set(userReposts.map((repost: any) => repost.twitId));

        return formattedTwits.map((twit: any) => ({
            ...twit,
            isLiked: likedTwitIds.has(twit.id),
            isReposted: repostedTwitIds.has(twit.id)
        }));

    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }
});

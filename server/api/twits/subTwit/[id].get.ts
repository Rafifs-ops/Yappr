import { prisma } from "../../../utils/prisma";
import { session } from "../../../utils/session";

export default defineEventHandler(async (event) => {
    try {
        const twitId = getRouterParam(event, 'id');
        if (!twitId) return [];

        const twits = await prisma.twit.findMany({
            where: {
                isSubTwit: true,
                referenceId: twitId
            },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, username: true, photo: true } },
                reference: {
                    include: {
                        user: { select: { id: true, username: true, photo: true } }
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
            where: {
                userId: currentUser.id,
                twitId: { in: twitIds }
            },
            select: { twitId: true }
        });
        const userReposts = await prisma.repost.findMany({
            where: {
                userId: currentUser.id,
                twitId: { in: twitIds }
            },
            select: { twitId: true }
        });

        const likedTwitIds = new Set(userLikes.map(like => like.twitId));
        const repostedTwitIds = new Set(userReposts.map(repost => repost.twitId));

        return formattedTwits.map(twit => ({
            ...twit,
            isLiked: likedTwitIds.has(twit.id),
            isReposted: repostedTwitIds.has(twit.id)
        }));
    } catch (error: any) {
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message });
    }
});
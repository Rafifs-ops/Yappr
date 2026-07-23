import { prisma } from "../../utils/prisma";
import { session } from "../../utils/session";

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');
        if (!id) {
            throw createError({ statusCode: 400, statusMessage: 'ID Required' });
        }

        const twit = await prisma.twit.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, username: true, photo: true, isPrivate: true } },
                reference: {
                    include: {
                        user: { select: { id: true, username: true, photo: true, isPrivate: true } }
                    }
                }
            }
        });

        if (!twit) {
            throw createError({ statusCode: 404, statusMessage: 'Twit tidak ditemukan' });
        }

        let currentUser = null;
        try {
            currentUser = await session(event);
        } catch (e) {
            // Abaikan jika user belum login
        }

        const author = twit.user;
        if (author?.isPrivate) {
            let canView = false;
            if (currentUser && author.id === currentUser.id) {
                canView = true;
            } else if (currentUser) {
                const isFollowing = await prisma.follow.findFirst({
                    where: {
                        followerId: currentUser.id,
                        followingId: author.id,
                        status: 'accepted'
                    }
                });
                if (isFollowing) canView = true;
            }

            if (!canView) {
                throw createError({ statusCode: 403, statusMessage: 'Akun ini di-private' });
            }
        }

        const formattedTwit = {
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
        };

        if (!currentUser) {
            return { ...formattedTwit, isLiked: false, isReposted: false };
        }

        const userLike = await prisma.like.findFirst({
            where: {
                userId: currentUser.id,
                twitId: id
            }
        });
        const userRepost = await prisma.repost.findFirst({
            where: {
                userId: currentUser.id,
                twitId: id
            }
        });

        return {
            ...formattedTwit,
            isLiked: userLike !== null,
            isReposted: userRepost !== null
        };
    } catch (error: any) {
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message });
    }
});

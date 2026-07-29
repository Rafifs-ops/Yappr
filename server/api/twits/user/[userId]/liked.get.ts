import { prisma } from "../../../../utils/prisma";
import { session } from "../../../../utils/session";

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'userId'); // Mengambil user ID dari router parameter
        if (!id) throw createError({ statusCode: 400, statusMessage: 'User ID required' }); // Jika user ID tidak ada

        const searchLiked = await prisma.like.findMany({
            where: { userId: id }, // Mencari twit yang disukai oleh user
            orderBy: { createdAt: 'desc' }, // Mengurutkan twit berdasarkan tanggal pembuatan
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

        let twits = searchLiked.map(l => l.twit).filter(Boolean); // Mengambil twit yang disukai oleh user

        let currentUser = null;
        try {
            currentUser = await session(event); // Mengambil user dari session
        } catch (e) {
            // Abaikan jika user belum login
        }

        let followingIds: string[] = [];

        // Jika user login, ambil following
        if (currentUser) {
            // Mengambil user yang diikuti oleh user
            const following = await prisma.follow.findMany({
                where: { followerId: currentUser.id, status: 'accepted' },
                select: { followingId: true }
            });
            // Mengambil following ID
            followingIds = following.map(f => f.followingId);
        }

        // Filtering twits
        twits = twits.filter((twit: any) => {
            const author = twit.user;
            if (!author?.isPrivate) return true; // Jika user tidak private, maka bisa dilihat
            if (currentUser && author.id === currentUser.id) return true; // Jika user adalah author, maka bisa dilihat
            if (followingIds.includes(author.id)) return true; // Jika user mengikuti author, maka bisa dilihat
            return false; // Jika tidak memenuhi syarat, maka tidak bisa dilihat
        });

        // Format twit
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

        // Jika user tidak login, maka isLiked dan isReposted adalah false
        if (!currentUser) {
            return formattedTwits.map(twit => ({ ...twit, isLiked: false, isReposted: false }));
        }

        const twitIds = formattedTwits.map(t => t.id); // Mengambil ID dari twit yang difilter

        // Mengambil twit yang disukai oleh user
        const userLikes = await prisma.like.findMany({
            where: { userId: currentUser.id, twitId: { in: twitIds } },
            select: { twitId: true }
        });
        // Mengambil twit yang di-repost oleh user
        const userReposts = await prisma.repost.findMany({
            where: { userId: currentUser.id, twitId: { in: twitIds } },
            select: { twitId: true }
        });

        const likedTwitIds = new Set(userLikes.map(l => l.twitId)); // output: Set {1, 2}
        const repostedTwitIds = new Set(userReposts.map(r => r.twitId)); // output: Set {1, 2}

        return formattedTwits.map(twit => ({
            ...twit,
            isLiked: likedTwitIds.has(twit.id),
            isReposted: repostedTwitIds.has(twit.id)
        })); // output: [{}]
    } catch (error: any) {
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message });
    }
});

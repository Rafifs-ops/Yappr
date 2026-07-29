import { prisma } from "../../../utils/prisma";
import { session } from "../../../utils/session";

export default defineEventHandler(async (event) => {
    try {
        const twitId = getRouterParam(event, 'id'); // Mengambil twitId dari router params
        if (!twitId) return []; // Jika tidak ada twitId, kembalikan array kosong

        // Mengambil sub twit berdasarkan twitId
        const twits = await prisma.twit.findMany({
            where: {
                isSubTwit: true,
                referenceId: twitId // Mencari sub twit berdasarkan twitId (twit yang dikomentari)
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

        // Mengembalikan sub twit yang sudah difilter
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

        // Jika user belum login/registers
        if (!currentUser) {
            return formattedTwits.map(twit => ({ ...twit, isLiked: false, isReposted: false }));
        }

        const twitIds = formattedTwits.map(t => t.id); // Mengambil id dari setiap twit

        // Mencari twit yang disukai oleh user
        const userLikes = await prisma.like.findMany({
            where: {
                userId: currentUser.id, // User yang menyukai twit
                twitId: { in: twitIds } // Twit yang disukai
            },
            select: { twitId: true } // Mengembalikan id dari twit yang disukai
        });

        // Mencari twit yang di-repost oleh user
        const userReposts = await prisma.repost.findMany({
            where: {
                userId: currentUser.id, // User yang me-repost twit
                twitId: { in: twitIds } // Twit yang di-repost
            },
            select: { twitId: true } // Mengembalikan id dari twit yang di-repost
        });

        // Mengubah array menjadi Set untuk pencarian yang lebih cepat
        const likedTwitIds = new Set(userLikes.map(like => like.twitId)); // output: Set {'1', '2', '3'}
        const repostedTwitIds = new Set(userReposts.map(repost => repost.twitId)); // output: Set {'1', '2', '3'}

        // Mengembalikan sub twit yang sudah difilter
        return formattedTwits.map(twit => ({
            ...twit,
            isLiked: likedTwitIds.has(twit.id), // Cek apakah twit disukai oleh user. output: true/false
            isReposted: repostedTwitIds.has(twit.id) // Cek apakah twit di-repost oleh user. output: true/false
        }));
    } catch (error: any) {
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message });
    }
});
import { prisma } from "../../utils/prisma";
import { session } from "../../utils/session";

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id'); // Mengambil twitId dari router params
        // Jika tidak ada twitId
        if (!id) {
            throw createError({ statusCode: 400, statusMessage: 'ID Required' });
        }

        // Mengambil twit berdasarkan twitId
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

        const author = twit.user; // Mengambil user yang membuat twit
        if (author?.isPrivate) { // Jika user membuat twit di private account
            let canView = false; // Variabel untuk mengecek apakah user bisa melihat twit
            if (currentUser && author.id === currentUser.id) { // Jika user yang login adalah user yang membuat twit
                canView = true; // User bisa melihat twit
            } else if (currentUser) { // Jika user yang login adalah user yang bukan membuat twit
                // Cek apakah user yang login mengikuti user yang membuat twit
                const isFollowing = await prisma.follow.findFirst({
                    where: {
                        followerId: currentUser.id,
                        followingId: author.id,
                        status: 'accepted'
                    }
                });
                if (isFollowing) canView = true; // User bisa melihat twit
            }

            // Jika user tidak bisa melihat twit
            if (!canView) {
                throw createError({ statusCode: 403, statusMessage: 'Akun ini di-private' });
            }
        }

        // Format twit agar sesuai dengan frontend
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

        // Jika user tidak login
        if (!currentUser) {
            return { ...formattedTwit, isLiked: false, isReposted: false };
        }

        // Mencari twit yang disukai oleh user
        const userLike = await prisma.like.findFirst({
            where: {
                userId: currentUser.id,
                twitId: id
            }
        });
        // Mencari twit yang di-repost oleh user
        const userRepost = await prisma.repost.findFirst({
            where: {
                userId: currentUser.id,
                twitId: id
            }
        });

        // Mengembalikan twit yang sudah difilter
        return {
            ...formattedTwit,
            isLiked: userLike !== null, // Cek apakah twit disukai oleh user. output: true/false
            isReposted: userRepost !== null // Cek apakah twit di-repost oleh user. output: true/false
        };
    } catch (error: any) {
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message });
    }
});

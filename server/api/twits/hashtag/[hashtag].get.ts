import { prisma } from "../../../utils/prisma";
import { session } from "../../../utils/session";

export default defineEventHandler(async (event) => {
    try {
        const tagParam = event.context?.params?.hashtag?.toLowerCase(); // Mengambil hashtag dari params dan mengubahnya menjadi huruf kecil
        if (!tagParam) return []; // Jika tidak ada hashtag, kembalikan array kosong

        const matchingHashtags: any = await prisma.twitHashtag.findMany({
            where: { tag: tagParam }, // Mencari hashtag yang sesuai
            select: { twitId: true } // Mengambil twitId yang sesuai dengan hashtag
        });

        const twitIdsForHashtag = matchingHashtags.map((h: any) => h.twitId); // Mengambil semua twitId yang sesuai dengan hashtag

        // Mengambil semua twit berdasarkan id yang didapat di atas
        const twits: any = await prisma.twit.findMany({
            where: { id: { in: twitIdsForHashtag } }, // Mencari twit berdasarkan id yang sesuai
            orderBy: { createdAt: 'desc' }, // Mengurutkan twit berdasarkan tanggal pembuatan
            take: 10, // Mengambil 10 twit
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
        if (currentUser) { // Jika user login
            // Mengambil following yang sesuai dengan user
            const following = await prisma.follow.findMany({
                where: { followerId: currentUser.id, status: 'accepted' }, // Mencari follow yang sesuai
                select: { followingId: true } // Mengambil followingId yang sesuai
            });
            followingIds = following.map((f: any) => f.followingId); // Mengambil semua followingId yang sesuai
        }

        const filteredTwits = twits.filter((twit: any) => {
            const author = twit.user; // mengambil penulis twit
            if (!author?.isPrivate) return true; // Jika tidak private, tampilkan
            if (currentUser && author.id === currentUser.id) return true; // Jika user yang login adalah penulis twit, tampilkan
            if (followingIds.includes(author.id)) return true; // Jika user yang login mengikuti penulis twit, tampilkan
            return false; // Jika tidak memenuhi syarat, jangan tampilkan
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

        const twitIds = formattedTwits.map((t: any) => t.id); // Mengambil ID twit yang sudah diformat

        // Mengambil twit yang di like oleh user
        const userLikes = await prisma.like.findMany({
            where: { userId: currentUser.id, twitId: { in: twitIds } },
            select: { twitId: true }
        });

        // Mengambil twit yang di repost oleh user
        const userReposts = await prisma.repost.findMany({
            where: { userId: currentUser.id, twitId: { in: twitIds } },
            select: { twitId: true }
        });

        // Membuat set untuk menyimpan ID twit yang di like dan di repost
        const likedTwitIds = new Set(userLikes.map((like: any) => like.twitId)); // output: Set { '1', '2', '3' }
        const repostedTwitIds = new Set(userReposts.map((repost: any) => repost.twitId)); // output: Set { '1', '2', '3' }

        // Menampilkan twit yang sudah difilter
        return formattedTwits.map((twit: any) => ({
            ...twit,
            isLiked: likedTwitIds.has(twit.id), // output: true/false
            isReposted: repostedTwitIds.has(twit.id) // output: true/false
        }));

    } catch (error: any) { // Mengembalikan error jika terjadi error
        throw createError({ statusCode: 500, statusMessage: error.message });
    }
});

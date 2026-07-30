import { prisma } from "../../utils/prisma";
import { session } from "../../utils/session";
import { formatTwit } from "../../utils/formatTwit";

export default defineEventHandler(async (event) => {
    const queryParams = getQuery(event); // Mendapatkan data query string dari request
    const cursor = queryParams.cursor; // Mendapatkan nilai dari query string 'cursor', untuk mengambil data berdasarkan tanggal tertentu
    const limit = Math.min(parseInt(queryParams.limit as string) || 10, 50); // Mendapatkan nilai dari query string 'limit'

    let currentUser = null;
    try {
        currentUser = await session(event); // Mendapatkan data user dari session
    } catch (e) {
        // Guest view
    }

    try {
        let paginationDate = new Date(); // Mengambil tanggal hari ini
        if (cursor && cursor !== 'undefined' && cursor !== 'null') { // Jika cursor ada dan bukan undefined atau null
            const parsedDate = new Date(cursor as string); // Mengubah cursor menjadi Date
            if (!isNaN(parsedDate.getTime())) { // Jika cursor berhasil diubah menjadi Date
                paginationDate = parsedDate; // Mengubah paginationDate menjadi parsedDate
            }
        }

        if (!currentUser) { // Jika user tidak login, mode public
            const publicTwits = await prisma.twit.findMany({
                where: {
                    user: { isPrivate: false },
                    ...(cursor && cursor !== 'undefined' && cursor !== 'null' ? { createdAt: { lt: paginationDate } } : {})
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                include: {
                    user: { select: { id: true, username: true, photo: true } },
                    hashtags: { select: { tag: true } },
                    reference: {
                        include: {
                            user: { select: { id: true, username: true, photo: true } },
                            hashtags: { select: { tag: true } }
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

        // Mencari user yang di follow oleh client
        const following = await prisma.follow.findMany({
            where: {
                followerId: currentUser.id,
                status: 'accepted'
            },
            select: { followingId: true }
        });

        // Mengambil id user yang di follow
        const followingIds = following.map(f => f.followingId);
        followingIds.push(currentUser.id); // Menambahkan id user sendiri

        // Mengambil twit milik orang yang di follow dan diri sendiri
        const twitIdsResult = await prisma.twit.findMany({
            where: {
                userId: { in: followingIds },
                ...(cursor && cursor !== 'undefined' && cursor !== 'null' ? { createdAt: { lt: paginationDate } } : {})
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: { id: true, createdAt: true }
        });

        // Mengambil twit yang di repost oleh orang yang di follow dan diri sendiri
        const repostsResult = await prisma.repost.findMany({
            where: {
                userId: { in: followingIds },
                ...(cursor && cursor !== 'undefined' && cursor !== 'null' ? { createdAt: { lt: paginationDate } } : {})
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: { twitId: true, createdAt: true }
        });

        // Mengambil twit yang di like oleh orang yang di follow dan diri sendiri
        const likesResult = await prisma.like.findMany({
            where: {
                userId: { in: followingIds },
                ...(cursor && cursor !== 'undefined' && cursor !== 'null' ? { createdAt: { lt: paginationDate } } : {})
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            select: { twitId: true, createdAt: true }
        });

        // Menggabungkan hasil twit, twit yang di repost, dan twit yang di like
        const combined = [
            ...twitIdsResult.map(t => ({ id: t.id, date: t.createdAt })),
            ...repostsResult.map(r => ({ id: r.twitId, date: r.createdAt })),
            ...likesResult.map(l => ({ id: l.twitId, date: l.createdAt }))
        ].filter(item => item.id);

        // Mengurutkan hasil twit berdasarkan tanggal
        combined.sort((a, b) => b.date.getTime() - a.date.getTime());

        // Mengambil id twit teratas
        const topIds: string[] = [];
        const seen = new Set();

        // Memastikan tidak ada duplikat id
        for (const item of combined) {
            if (!seen.has(item.id)) {
                seen.add(item.id);
                topIds.push(item.id);
                if (topIds.length >= limit) break;
            }
        }

        // Jika sudah sampau batas akhir twit
        if (topIds.length === 0) return [];

        // Mengambil twit berdasarkan id teratas
        const finalTwits = await prisma.twit.findMany({
            where: { id: { in: topIds } },
            include: {
                user: { select: { id: true, username: true, photo: true } },
                hashtags: { select: { tag: true } },
                reference: {
                    include: {
                        user: { select: { id: true, username: true, photo: true } },
                        hashtags: { select: { tag: true } }
                    }
                }
            }
        });

        // Mengambil twit yang di like oleh client
        const myLikes = await prisma.like.findMany({
            where: { userId: currentUser.id, twitId: { in: topIds } },
            select: { twitId: true }
        });

        // Mengambil twit yang di repost oleh client
        const myReposts = await prisma.repost.findMany({
            where: { userId: currentUser.id, twitId: { in: topIds } },
            select: { twitId: true }
        });

        // Membuat set untuk memudahkan pengecekan
        const likedSet = new Set(myLikes.map(l => l.twitId)); // output: Set { "twit1", "twit2", ... }
        const repostedSet = new Set(myReposts.map(r => r.twitId)); // output: Set { "twit1", "twit2", ... }

        // Mengubah hasil menjadi format yang diinginkan
        const result = topIds.map(id => {
            const twit = finalTwits.find(t => t.id === id); // Mencari twit berdasarkan id
            if (!twit) return null; // Jika twit tidak ditemukan, keluar dari fungsi
            return {
                ...formatTwit(twit),
                isLiked: likedSet.has(id), // output: true jika twit di like, false jika tidak
                isReposted: repostedSet.has(id) // output: true jika twit di repost, false jika tidak
            };
        }).filter(Boolean); // output: array of twits

        return result;

    } catch (error: any) {
        console.error("Index GET error:", error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Error: ' + (error.stack || error.message)
        });
    }
});

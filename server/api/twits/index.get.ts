import { Twit } from "../../models/Twit.schema";
import { Like } from "../../models/Like.schema";
import { Repost } from "../../models/Repost.schema";
import { session } from "../../utils/session";
import { Follow } from "../../models/Follow.schema";
import { User } from "../../models/User.schema";

/**
 * GET /api/twits
 * Fetches a list of twits, sorted by the newest first.
 * Solves N+1 query problem by batch-fetching relations.
 */
export default defineEventHandler(async (event) => {
    const queryParams = getQuery(event);
    const cursor = queryParams.cursor;
    const limit = Math.min(parseInt(queryParams.limit as string) || 10, 50);
    
    let currentUser = null;
    try {
        currentUser = await session(event);
    } catch (e) {
        // Guest view
    }

    try {
        let paginationDate = new Date();
        if (cursor && cursor !== 'undefined' && cursor !== 'null') {
            const parsedDate = new Date(cursor as string);
            if (!isNaN(parsedDate.getTime())) {
                paginationDate = parsedDate;
            }
        }

        if (!currentUser) {
            const publicUsers = await User.find({ isPrivate: { $ne: true } }).select('_id').lean();
            const publicUserIds = publicUsers.map(u => u._id);

            const query: any = { user: { $in: publicUserIds } };
            if (cursor && cursor !== 'undefined' && cursor !== 'null') {
                query.createdAt = { $lt: paginationDate };
            }

            const publicTwits = await Twit.find(query)
                .sort({ createdAt: -1 })
                .populate('user', 'username photo')
                .populate({
                    path: 'SubTwit.reference',
                    populate: { path: 'user', select: 'username photo' }
                })
                .limit(limit)
                .lean();
            return publicTwits.map(twit => ({ ...twit, isLiked: false, isReposted: false }));
        }

        const following = await Follow.find({
            follower: currentUser.id,
            $or: [{ status: 'accepted' }, { status: { $exists: false } }]
        }).select('following').lean();

        const followingIds = following.map(f => f.following);
        followingIds.push(currentUser.id as any);

        const queryTwit: any = { user: { $in: followingIds } };
        if (cursor && cursor !== 'undefined' && cursor !== 'null') queryTwit.createdAt = { $lt: paginationDate };
        
        const twitIdsResult = await Twit.find(queryTwit)
            .sort({ createdAt: -1 }).limit(limit).select('_id createdAt').lean();

        const queryRepost: any = { user: { $in: followingIds } };
        if (cursor && cursor !== 'undefined' && cursor !== 'null') queryRepost.createdAt = { $lt: paginationDate };
        
        const repostsResult = await Repost.find(queryRepost)
            .sort({ createdAt: -1 }).limit(limit).select('twit createdAt').lean();

        const queryLike: any = { user: { $in: followingIds } };
        if (cursor && cursor !== 'undefined' && cursor !== 'null') queryLike.createdAt = { $lt: paginationDate };
        
        const likesResult = await Like.find(queryLike)
            .sort({ createdAt: -1 }).limit(limit).select('twit createdAt').lean();

        // Gabungkan semua interaksi, urutkan berdasarkan waktu kejadian
        const combined = [
            ...twitIdsResult.map(t => ({ id: t._id?.toString(), date: t.createdAt })),
            ...repostsResult.map(r => ({ id: r.twit?.toString(), date: r.createdAt })),
            ...likesResult.map(l => ({ id: l.twit?.toString(), date: l.createdAt }))
        ].filter(item => item.id);

        combined.sort((a, b) => b.date.getTime() - a.date.getTime());

        // Ambil unik top IDs
        const topIds: string[] = [];
        const seen = new Set();
        for (const item of combined) {
            if (!seen.has(item.id)) {
                seen.add(item.id);
                topIds.push(item.id as string);
                if (topIds.length >= limit) break;
            }
        }

        if (topIds.length === 0) return [];

        // 5. Fetch twit records (tanpa N+1 queries untuk user)
        const finalTwits = await Twit.find({ _id: { $in: topIds } })
            .populate('user', 'username photo')
            .populate({
                path: 'SubTwit.reference',
                populate: { path: 'user', select: 'username photo' }
            })
            .lean();

        // 6. Fetch interaksi user saat ini terhadap kumpulan twit tersebut
        const myLikes = await Like.find({ user: currentUser.id, twit: { $in: topIds } }).select('twit').lean();
        const myReposts = await Repost.find({ user: currentUser.id, twit: { $in: topIds } }).select('twit').lean();

        const likedSet = new Set(myLikes.map(l => l.twit?.toString()));
        const repostedSet = new Set(myReposts.map(r => r.twit?.toString()));

        // 7. Mapping hasil untuk menjaga urutan waktu asli
        const result = topIds.map(id => {
            const twit = finalTwits.find(t => t._id?.toString() === id);
            if (!twit) return null;
            return {
                ...twit,
                isLiked: likedSet.has(id),
                isReposted: repostedSet.has(id)
            };
        }).filter(Boolean);

        return result;

    } catch (error: any) {
        console.error("Index GET error:", error);
        throw createError({ 
            statusCode: 500, 
            statusMessage: 'Error: ' + (error.stack || error.message) 
        });
    }
});

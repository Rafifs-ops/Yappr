import { Like } from "../../../../models/Like.schema";
import { Repost } from "../../../../models/Repost.schema";
import { session } from "../../../../utils/session";
import { Follow } from "../../../../models/Follow.schema";

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'userId');
        const { cursor } = getQuery(event);

        // 1. Ambil twit
        const query: any = { user: id };
        if (cursor) query.twit = { $lt: cursor };

        const searchReposted = await Repost.find(query)
            .sort({ twit: -1 })
            .limit(10)
            .populate({
                path: 'twit',
                populate: {
                    path: 'user', // Mengambil data user (pembuat asli) di dalam twit
                    select: 'username photo isPrivate'
                }
            })
            .populate('user', 'username photo')
            .lean();

        if (!searchReposted) {
            throw createError({ statusCode: 404, statusMessage: 'Twit tidak ditemukan' });
        }
        let twits = searchReposted.map(repost => repost.twit).filter(twit => twit != null);

        let currentUser = null;
        try {
            currentUser = await session(event);
        } catch (e) {
            // Abaikan jika user belum login
        }

        let followingIds: string[] = [];
        if (currentUser) {
            const following = await Follow.find({
                follower: currentUser.id,
                $or: [{ status: 'accepted' }, { status: { $exists: false } }]
            }).lean();
            followingIds = following.map(f => f.following?.toString()).filter(id => id != null) as string[];
        }

        twits = twits.filter((twit: any) => {
            const author = twit.user as any;
            if (!author?.isPrivate) return true;
            if (currentUser && author._id.toString() === currentUser.id) return true;
            if (followingIds.includes(author._id.toString())) return true;
            return false;
        });

        // Jika user belum login, asumsikan belum ada yang dilike dan direpost
        if (!currentUser) {
            return twits.map((twit: any) => ({ ...twit, isLiked: false, isReposted: false }));
        }

        // Ambil semua ID twit dari hasil query pertama
        const twitIds = twits.map(t => t._id);

        // Cari semua twit yang di like dan di repost oleh user
        const userLikes = await Like.find({
            user: currentUser.id,
            twit: { $in: twitIds }
        }).lean();
        const userReposts = await Repost.find({
            user: currentUser.id,
            twit: { $in: twitIds }
        }).lean();

        // Ubah array likes dan reposts menjadi Set berisi ID string untuk pencarian instan (O(1))
        const likedTwitIds = new Set(userLikes.map(like => like.twit?.toString()));
        const repostedTwitIds = new Set(userReposts.map(repost => repost.twit?.toString()));

        // Petakan status isLiked dan isReposted ke masing-masing twit
        const twitsWithLikeStatus = twits.map((twit: any) => {
            return {
                ...twit,
                isLiked: likedTwitIds.has(twit._id.toString()),
                isReposted: repostedTwitIds.has(twit._id.toString())
            };
        });

        return twitsWithLikeStatus;
    } catch (error: any) {
        if (error.name === 'CastError') {
            throw createError({ statusCode: 400, statusMessage: error.message });
        }
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message });
    }
});


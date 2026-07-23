import { Twit } from "../../../models/Twit.schema";
import { Like } from "../../../models/Like.schema";
import { Repost } from "../../../models/Repost.schema";
import { session } from "../../../utils/session";
import { Follow } from "../../../models/Follow.schema";

export default defineEventHandler(async (event) => {
    try {
        const { cursor } = getQuery(event);
        // 1. Ambil twits
        const query: any = { hashtags: event.context?.params?.hashtag?.toLowerCase() };
        if (cursor) query._id = { $lt: cursor };

        const twits = await Twit.find(query)
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('user', 'username photo isPrivate')
            .populate({
                path: 'SubTwit.reference',
                populate: { path: 'user', select: 'username photo isPrivate' }
            }).lean();

        let currentUser = null;
        try {
            currentUser = await session(event);
        } catch (e) {
            // Ignore if not logged in
        }

        let followingIds: string[] = [];
        if (currentUser) {
            const following = await Follow.find({
                follower: currentUser.id,
                $or: [{ status: 'accepted' }, { status: { $exists: false } }]
            }).lean();
            followingIds = following.map(f => f.following?.toString()).filter(id => id != null) as string[];
        }

        const filteredTwits = twits.filter((twit: any) => {
            const author = twit.user;
            if (!author?.isPrivate) return true;
            if (currentUser && author._id.toString() === currentUser.id) return true;
            if (followingIds.includes(author._id.toString())) return true;
            return false;
        });

        // Jika user belum login, asumsikan belum ada yang dilike dan direpost
        if (!currentUser) {
            return filteredTwits.map((twit: any) => ({ ...twit, isLiked: false, isReposted: false }));
        }

        // Ambil semua ID twit dari hasil query pertama
        const twitIds = filteredTwits.map((t: any) => t._id);

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
        const twitsWithLikeStatus = filteredTwits.map((twit: any) => {
            return {
                ...twit,
                isLiked: likedTwitIds.has(twit._id.toString()),
                isReposted: repostedTwitIds.has(twit._id.toString())
            };
        });

        return twitsWithLikeStatus;

    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }
});



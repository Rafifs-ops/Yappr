import { Twit } from "../../models/Twit.schema";
import { Like } from "../../models/Like.schema";
import { Repost } from "../../models/Repost.schema";
import { session } from "../../utils/session";
import { Follow } from "../../models/Follow.schema";

import { User } from "../../models/User.schema";

/**
 * GET /api/twits
 * Fetches a list of twits, sorted by the newest first.
 * If a user is logged in, it also appends boolean flags `isLiked` and `isReposted`
 * indicating whether the current user has interacted with each twit.
 */
export default defineEventHandler(async (event) => {
    let currentUser = null;
    try {
        // Attempt to get the current user session
        currentUser = await session(event);
    } catch (e) {
        // Silently ignore if not logged in (guest view)
    }

    try {
        if (!currentUser) {
            // Contoh untuk Guest: Tampilkan twit publik tanpa status follow
            const publicUsers = await User.find({ isPrivate: { $ne: true } }).select('_id').lean();
            const publicUserIds = publicUsers.map(u => u._id);

            const publicTwits = await Twit.find({ user: { $in: publicUserIds } })
                .sort({ createdAt: -1 })
                .populate('user', 'username photo')
                .populate({
                    path: 'SubTwit.reference',
                    populate: { path: 'user', select: 'username photo' }
                })
                .limit(15)
                .lean();
            return publicTwits.map(twit => ({ ...twit, isLiked: false, isReposted: false }));
        }

        const following = await Follow.find({ 
            follower: currentUser.id,
            $or: [{ status: 'accepted' }, { status: { $exists: false } }]
        }).lean();
        const followingIds = following.map(f => f.following);

        const twitsFromFollowing = await Twit.find({ user: { $in: followingIds } })
            .sort({ createdAt: -1 })
            .populate('user', 'username photo')
            .populate({
                path: 'SubTwit.reference',
                populate: { path: 'user', select: 'username photo' }
            })
            .limit(15)
            .lean();

        const repostedTwitsfromFollowing = await Repost.find({ user: { $in: followingIds } })
            .sort({ createdAt: -1 })
            .populate('user', 'username photo')
            .populate({
                path: 'twit',
                populate: [
                    { path: 'user', select: 'username photo' },
                    { path: 'SubTwit.reference', populate: { path: 'user', select: 'username photo' } }
                ]
            })
            .limit(15)
            .lean();

        const LikedTwitsfromFollowing = await Like.find({ user: { $in: followingIds } })
            .sort({ createdAt: -1 })
            .populate('user', 'username photo')
            .populate({
                path: 'twit',
                populate: [
                    { path: 'user', select: 'username photo' },
                    { path: 'SubTwit.reference', populate: { path: 'user', select: 'username photo' } }
                ]
            })
            .limit(15)
            .lean();

        // Filter nilai null apabila parent twit terhapus
        const repostedTwits = repostedTwitsfromFollowing
            .filter(repost => repost.twit != null)
            .map(repost => repost.twit);

        const LikedTwits = LikedTwitsfromFollowing
            .filter(like => like.twit != null)
            .map(like => like.twit);

        let allTwits = [...twitsFromFollowing, ...repostedTwits, ...LikedTwits];

        // Hapus duplikasi berdasarkan ID
        const uniqueTwitsMap = new Map();
        for (const twit of allTwits) {
            uniqueTwitsMap.set(twit._id.toString(), twit);
        }
        allTwits = Array.from(uniqueTwitsMap.values());

        // Sorting aman di TypeScript
        allTwits.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Potong jumlah hasil gabungan
        const twits = allTwits.slice(0, 15);

        const twitIds = twits.map(t => t._id);

        const userLikes = await Like.find({
            user: currentUser.id,
            twit: { $in: twitIds }
        }).lean();

        const userReposts = await Repost.find({
            user: currentUser.id,
            twit: { $in: twitIds }
        }).lean();

        const likedTwitIds = new Set(userLikes.map(like => like.twit.toString()));
        const repostedTwitIds = new Set(userReposts.map(repost => repost.twit.toString()));

        return twits.map(twit => {
            return {
                ...twit,
                isLiked: likedTwitIds.has(twit._id.toString()),
                isReposted: repostedTwitIds.has(twit._id.toString())
            };
        });

    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message || 'Internal Server Error' });
    }
});

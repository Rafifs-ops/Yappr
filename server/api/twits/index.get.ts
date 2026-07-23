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
    const { cursor } = getQuery(event);
    let currentUser = null;
    try {
        currentUser = await session(event);
    } catch (e) {
        // Guest view
    }

    try {
        if (!currentUser) {
            const publicUsers = await User.find({ isPrivate: { $ne: true } }).select('_id').lean();
            const publicUserIds = publicUsers.map(u => u._id);

            const query: any = { user: { $in: publicUserIds } };
            if (cursor) {
                query._id = { $lt: cursor };
            }

            const publicTwits = await Twit.find(query)
                .sort({ createdAt: -1 })
                .populate('user', 'username photo')
                .populate({
                    path: 'SubTwit.reference',
                    populate: { path: 'user', select: 'username photo' }
                })
                .limit(10)
                .lean();
            return publicTwits.map(twit => ({ ...twit, isLiked: false, isReposted: false }));
        }

        const following = await Follow.find({
            follower: currentUser.id,
            $or: [{ status: 'accepted' }, { status: { $exists: false } }]
        }).select('following').lean();

        const followingIds = following.map(f => f.following);
        followingIds.push(currentUser.id as any); // Also show own twits

        // 1. Fetch recent twit IDs from following & self
        const queryTwit: any = { user: { $in: followingIds } };
        if (cursor) queryTwit._id = { $lt: cursor };
        const twitIdsResult = await Twit.find(queryTwit)
            .sort({ createdAt: -1 }).limit(10).select('_id').lean();

        // 2. Fetch recent reposted twit IDs from following
        const queryRepost: any = { user: { $in: followingIds } };
        if (cursor) queryRepost.twit = { $lt: cursor };
        const repostsResult = await Repost.find(queryRepost)
            .sort({ createdAt: -1 }).limit(10).select('twit').lean();

        // 3. Fetch recent liked twit IDs from following
        const queryLike: any = { user: { $in: followingIds } };
        if (cursor) queryLike.twit = { $lt: cursor };
        const likesResult = await Like.find(queryLike)
            .sort({ createdAt: -1 }).limit(10).select('twit').lean();

        // 4. Combine IDs
        const combinedIds = Array.from(new Set([
            ...twitIdsResult.map(t => t._id.toString()),
            ...repostsResult.map(r => r.twit?.toString()).filter(Boolean),
            ...likesResult.map(l => l.twit?.toString()).filter(Boolean)
        ]));

        // 5. Fetch fully populated twits, sorted & limited
        const queryCombined: any = { _id: { $in: combinedIds } };
        if (cursor) queryCombined._id = { $in: combinedIds, $lt: cursor };

        const twits = await Twit.find(queryCombined)
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('user', 'username photo')
            .populate({
                path: 'SubTwit.reference',
                populate: { path: 'user', select: 'username photo' }
            })
            .lean();

        // 6. Attach isLiked and isReposted for the current user
        const twitIds = twits.map(t => t._id);

        const userLikes = await Like.find({
            user: currentUser.id,
            twit: { $in: twitIds }
        }).select('twit').lean();

        const userReposts = await Repost.find({
            user: currentUser.id,
            twit: { $in: twitIds }
        }).select('twit').lean();

        const likedTwitIds = new Set(userLikes.map(like => like.twit?.toString()));
        const repostedTwitIds = new Set(userReposts.map(repost => repost.twit?.toString()));

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

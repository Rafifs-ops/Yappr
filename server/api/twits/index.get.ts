import { Twit } from "../../models/Twit.schema";
import { Like } from "../../models/Like.schema";
import { Repost } from "../../models/Repost.schema";
import { session } from "../../utils/session";

/**
 * GET /api/twits
 * Fetches a list of twits, sorted by the newest first.
 * If a user is logged in, it also appends boolean flags `isLiked` and `isReposted`
 * indicating whether the current user has interacted with each twit.
 */
export default defineEventHandler(async (event) => {
    try {
        // 1. Fetch all twits and populate user details for the main twit and its reference (if it's a SubTwit)
        const twits = await Twit.find({})
            .sort({ createdAt: -1 })
            .populate('user', 'username photo')
            .populate({
                path: 'SubTwit.reference',
                populate: { path: 'user', select: 'username photo' }
            })
            .lean();

        let currentUser = null;
        try {
            // Attempt to get the current user session
            currentUser = await session(event);
        } catch (e) {
            // Silently ignore if not logged in (guest view)
        }

        // If user is not logged in, assume they haven't liked or reposted any twits
        if (!currentUser) {
            return twits.map(twit => ({ ...twit, isLiked: false, isReposted: false }));
        }

        // Extract all twit IDs to run a bulk query for interactions
        const twitIds = twits.map(t => t._id);

        // Fetch all like and repost records for the current user concerning these twits
        const userLikes = await Like.find({
            user: currentUser.id,
            twit: { $in: twitIds }
        }).lean();
        
        const userReposts = await Repost.find({
            user: currentUser.id,
            twit: { $in: twitIds }
        }).lean();

        // Convert arrays to Sets for O(1) lookup time when mapping
        const likedTwitIds = new Set(userLikes.map(like => like.twit.toString()));
        const repostedTwitIds = new Set(userReposts.map(repost => repost.twit.toString()));

        // Map over twits and attach the personalized interaction status
        const twitsWithLikeStatus = twits.map(twit => {
            return {
                ...twit,
                isLiked: likedTwitIds.has(twit._id.toString()),
                isReposted: repostedTwitIds.has(twit._id.toString())
            };
        });

        return twitsWithLikeStatus;

    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message || 'Internal Server Error' });
    }
});

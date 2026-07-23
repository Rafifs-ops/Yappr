import { Twit } from "../../models/Twit.schema";
import { Like } from "../../models/Like.schema";
import { Repost } from "../../models/Repost.schema";
import { session } from "../../utils/session";
import { Follow } from "../../models/Follow.schema";
import { User } from "../../models/User.schema";
import { Types } from 'mongoose';

/**
 * GET /api/twits
 * Fetches a list of twits, sorted by the newest first.
 * If a user is logged in, it also appends boolean flags `isLiked` and `isReposted`
 * indicating whether the current user has interacted with each twit.
 */
export default defineEventHandler(async (event) => {
    const queryParams = getQuery(event);
    const cursor = queryParams.cursor;
    const limit = Math.min(parseInt(queryParams.limit as string) || 10, 50); // Validasi Limit (Max 50)
    
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
            if (cursor && cursor !== 'undefined' && cursor !== 'null') {
                const paginationDate = new Date(cursor as string);
                if (!isNaN(paginationDate.getTime())) {
                    query.createdAt = { $lt: paginationDate };
                }
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
        followingIds.push(currentUser.id as any); // Also show own twits

        let paginationDate = new Date();
        if (cursor && cursor !== 'undefined' && cursor !== 'null') {
            const parsedDate = new Date(cursor as string);
            if (!isNaN(parsedDate.getTime())) {
                paginationDate = parsedDate;
            }
        }

        // 1. Fetch recent twit IDs from following & self
        const queryTwit: any = { user: { $in: followingIds } };
        if (cursor && cursor !== 'undefined' && cursor !== 'null') queryTwit.createdAt = { $lt: paginationDate };
        const twitIdsResult = await Twit.find(queryTwit)
            .sort({ createdAt: -1 }).limit(limit).select('_id').lean();

        // 2. Fetch recent reposted twit IDs from following
        const queryRepost: any = { user: { $in: followingIds } };
        if (cursor && cursor !== 'undefined' && cursor !== 'null') queryRepost.createdAt = { $lt: paginationDate };
        const repostsResult = await Repost.find(queryRepost)
            .sort({ createdAt: -1 }).limit(limit).select('twit').lean();

        // 3. Fetch recent liked twit IDs from following
        const queryLike: any = { user: { $in: followingIds } };
        if (cursor && cursor !== 'undefined' && cursor !== 'null') queryLike.createdAt = { $lt: paginationDate };
        const likesResult = await Like.find(queryLike)
            .sort({ createdAt: -1 }).limit(limit).select('twit').lean();

        // 4. Combine IDs
        const combinedIds = Array.from(new Set([
            ...twitIdsResult.map(t => t._id.toString()),
            ...repostsResult.map(r => r.twit?.toString()).filter(Boolean),
            ...likesResult.map(l => l.twit?.toString()).filter(Boolean)
        ])).map(id => new Types.ObjectId(id));

        // 5. Fetch using aggregation pipeline to avoid N+1 queries
        const queryCombined: any = { _id: { $in: combinedIds } };

        const twitsAgg = await Twit.aggregate([
            { $match: queryCombined },
            { $sort: { createdAt: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'likes',
                    let: { twitId: '$_id', userId: new Types.ObjectId(currentUser.id) },
                    pipeline: [
                        { $match: { $expr: { $and: [
                            { $eq: ['$twit', '$$twitId'] },
                            { $eq: ['$user', '$$userId'] }
                        ] } } }
                    ],
                    as: 'userLikes'
                }
            },
            {
                $lookup: {
                    from: 'reposts',
                    let: { twitId: '$_id', userId: new Types.ObjectId(currentUser.id) },
                    pipeline: [
                        { $match: { $expr: { $and: [
                            { $eq: ['$twit', '$$twitId'] },
                            { $eq: ['$user', '$$userId'] }
                        ] } } }
                    ],
                    as: 'userReposts'
                }
            },
            {
                $addFields: {
                    isLiked: { $gt: [{ $size: '$userLikes' }, 0] },
                    isReposted: { $gt: [{ $size: '$userReposts' }, 0] },
                    // Make user consistent with populate output
                    user: {
                        _id: '$user._id',
                        username: '$user.username',
                        photo: '$user.photo'
                    }
                }
            },
            {
                $project: {
                    userLikes: 0,
                    userReposts: 0
                }
            }
        ]);

        // 6. Deep populate SubTwit reference
        const twits = await Twit.populate(twitsAgg, {
            path: 'SubTwit.reference',
            populate: { path: 'user', select: 'username photo' }
        });

        return twits;

    } catch (error: any) {
        console.error("Index GET error:", error);
        throw createError({ 
            statusCode: 500, 
            statusMessage: 'Error: ' + (error.stack || error.message) 
        });
    }
});

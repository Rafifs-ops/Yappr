import { Like } from "../../../../models/Like.schema";
import { Repost } from "../../../../models/Repost.schema";
import { session } from "../../../../utils/session";

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'userId');
        // 1. Ambil twit
        const searchReposted = await Repost.find({ user: id })
            .populate({
                path: 'twit',
                populate: {
                    path: 'user', // Mengambil data user (pembuat asli) di dalam twit
                    select: 'username photo'
                }
            })
            .populate('user', 'username photo')
            .lean();

        if (!searchReposted) {
            throw createError({ statusCode: 404, statusMessage: 'Twit tidak ditemukan' });
        }
        const twits = searchReposted.map(repost => repost.twit);

        let currentUser = null;
        try {
            currentUser = await session(event);
        } catch (e) {
            // Abaikan jika user belum login
        }

        // Jika user belum login, asumsikan belum ada yang dilike dan direpost
        if (!currentUser) {
            return twits.map(twit => ({ ...twit, isLiked: false, isReposted: false }));
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
        const likedTwitIds = new Set(userLikes.map(like => like.twit.toString()));
        const repostedTwitIds = new Set(userReposts.map(repost => repost.twit.toString()));

        // Petakan status isLiked dan isReposted ke masing-masing twit
        const twitsWithLikeStatus = twits.map(twit => {
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


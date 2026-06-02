import { Twit } from "../../models/Twit.schema";
import { Like } from "../../models/Like.schema";
import { Repost } from "../../models/Repost.schema";
import { session } from "../../utils/session";
import { Follow } from "../../models/Follow.schema";

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');
        // 1. Ambil twit
        const twit = await Twit.findById(id)
            .populate('user', 'username photo isPrivate')
            .populate({
                path: 'SubTwit.reference',
                populate: { path: 'user', select: 'username photo isPrivate' }
            })
            .lean();

        if (!twit) {
            throw createError({ statusCode: 404, statusMessage: 'Twit tidak ditemukan' });
        }

        let currentUser = null;
        try {
            currentUser = await session(event);
        } catch (e) {
            // Abaikan jika user belum login
        }

        const author = (twit as any).user;
        if (author?.isPrivate) {
            let canView = false;
            if (currentUser && author._id.toString() === currentUser.id) {
                canView = true;
            } else if (currentUser) {
                const isFollowing = await Follow.findOne({
                    follower: currentUser.id,
                    following: author._id,
                    $or: [{ status: 'accepted' }, { status: { $exists: false } }]
                }).lean();
                if (isFollowing) canView = true;
            }
            
            if (!canView) {
                throw createError({ statusCode: 403, statusMessage: 'Akun ini di-private' });
            }
        }

        // Jika user belum login, asumsikan belum ada yang dilike dan direpost
        if (!currentUser) {
            return { ...twit, isLiked: false, isReposted: false };
        }

        // 2. Ambil ID twit
        const twitId = twit._id;

        // 3. Cari Like dan Repost milik user INI yang berkaitan dengan twit ini
        const userLike = await Like.findOne({
            user: currentUser.id,
            twit: twitId
        }).lean();
        const userRepost = await Repost.findOne({
            user: currentUser.id,
            twit: twitId
        }).lean();

        // 4. Cek apakah user sudah like dan repost twit
        const isLiked = userLike !== null;
        const isReposted = userRepost !== null;

        // 5. Petakan status isLiked dan isReposted ke twit
        return {
            ...twit,
            isLiked: isLiked,
            isReposted: isReposted
        };
    } catch (error: any) {
        if (error.name === 'CastError') {
            throw createError({ statusCode: 400, statusMessage: error.message });
        }
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message });
    }
});


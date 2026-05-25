import { User } from '../../models/User.schema';
import { Twit } from '../../models/Twit.schema';
import { Follow } from '~~/server/models/Follow.schema';
import { session } from "../../utils/session";


export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');
        if (!id) {
            throw createError({ statusCode: 400, statusMessage: 'User ID is required' });
        }

        // Ambil data User dari MongoDB (tanpa password)
        const userDb = await User.findById(id).select('-password');

        if (!userDb) {
            throw createError({ statusCode: 404, statusMessage: 'User tidak ditemukan' });
        }

        // Ambil Tweet milik user ini (diurutkan dari yang terbaru)
        const userTweets = await Twit.find({ user: id })
            .sort({ createdAt: -1 })
            .populate('user', 'username email bio');

        let currentUser = null;
        try {
            currentUser = await session(event);
        } catch (e) {
            // Abaikan jika user belum login
        }

        // Jika user belum login, asumsikan belum ada yang difollow
        if (!currentUser) {
            return { ...userDb, isFollowed: false };
        }

        // 2. Ambil ID twit
        const userId = userDb._id;

        // 3. Cari Follow milik user INI yang berkaitan dengan twit ini
        const userFollow = await Follow.findOne({
            follower: currentUser.id,
            following: userId
        }).lean();

        // 4. Cek apakah user sudah follow user tersebut
        const isFollowed = userFollow !== null;

        return {
            user: userDb,
            tweets: userTweets ? userTweets : [],
            isFollowed: isFollowed
        };

    } catch (error: any) {
        if (error.statusCode === 404 || error.statusCode === 400) {
            throw error;
        }
        console.error('Error fetching profile data:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error'
        });
    }
});

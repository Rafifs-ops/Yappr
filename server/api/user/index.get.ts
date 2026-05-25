import { User } from '../../models/User.schema';

export default defineEventHandler(async (event) => {
    try {
        const userDb = await User.find({}).sort({ createdAt: -1 });
        return userDb;
    } catch (error) {
        console.error('Error fetching profile data:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error'
        });
    }
});

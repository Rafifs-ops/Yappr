import { Follow } from '../../../models/Follow.schema';

export default defineEventHandler(async (event) => {
    try {
        const id = getRouterParam(event, 'id');
        if (!id) {
            throw createError({ statusCode: 400, statusMessage: 'User ID is required' });
        }
        const followers = await Follow.find({
            following: id,
            status: 'accepted'
        }).populate('follower', 'username photo');

        const following = await Follow.find({
            follower: id,
            status: 'accepted'
        }).populate('following', 'username photo');

        return {
            followers: followers.map((f) => f.follower),
            following: following.map((f) => f.following)
        }
    } catch (error) {
        console.log(error)
    }
})
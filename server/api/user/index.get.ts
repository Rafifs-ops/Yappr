import { prisma } from '../../utils/prisma';

export default defineEventHandler(async (event) => {
    try {
        const userDb = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                username: true,
                photo: true,
                email: true,
                bio: true,
                followers: true,
                following: true,
                isPrivate: true,
                createdAt: true,
                updatedAt: true
            }
        });
        return userDb.map((u: any) => ({ ...u, _id: u.id }));
    } catch (error) {
        console.error('Error fetching profile data:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error'
        });
    }
});

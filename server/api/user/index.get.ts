import { prisma } from '../../utils/prisma';

// Mengambil semua daftar user
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
        return userDb.map((u: any) => ({ ...u, _id: u.id })); // output: [{ _id: string, username: string, photo: string, email: string, bio: string, emailVerifiedAt: string, followers: number, following: number, isPrivate: boolean, createdAt: string, updatedAt: string }, ...]
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message
        });
    }
});

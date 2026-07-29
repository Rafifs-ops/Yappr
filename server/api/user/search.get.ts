import { prisma } from '../../utils/prisma';

export default defineEventHandler(async (event) => {
    const query = getQuery(event); // Mengambil data query dari parameter router
    const search = query.q as string; // Mengambil data search dari parameter router

    // Jika tidak ada search
    if (!search) return [];

    try {
        // Mencari user
        const users = await prisma.user.findMany({
            where: {
                username: {
                    contains: search
                }
            },
            take: 5,
            select: {
                id: true,
                username: true,
                photo: true
            }
        });

        return users.map((u: any) => ({ ...u, _id: u.id, name: u.username })); // output: [{ _id: string, username: string, photo: string }, ...]
    } catch (error) {
        return [];
    }
});
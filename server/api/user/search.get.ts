import { prisma } from '../../utils/prisma';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const search = query.q as string;

    if (!search) return [];

    try {
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

        return users.map((u: any) => ({ ...u, _id: u.id, name: u.username }));
    } catch (error) {
        return [];
    }
});
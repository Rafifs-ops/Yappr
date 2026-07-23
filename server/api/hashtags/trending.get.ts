import { prisma } from '../../utils/prisma';

export default defineEventHandler(async (event) => {
    try {
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - 7);

        const trending = await prisma.twitHashtag.groupBy({
            by: ['tag'],
            where: {
                twit: {
                    createdAt: { gte: dateLimit }
                }
            },
            _count: {
                tag: true
            },
            orderBy: {
                _count: {
                    tag: 'desc'
                }
            },
            take: 10
        });

        return trending.map((item: any) => ({
            hashtag: item.tag,
            count: item._count.tag
        }));

    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Gagal mengambil data trending hashtag'
        });
    }
});
import { prisma } from '../../utils/prisma';

export default defineEventHandler(async (event) => {
    try {
        const dateLimit = new Date(); // Mengambil tanggal hari ini
        dateLimit.setDate(dateLimit.getDate() - 7); // Mengambil tanggal 7 hari yang lalu

        // Mengelompokkan hashtag berdasarkan tag dan menghitung jumlahnya
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
        })); // outputnya berupa array of object dengan format [{ hashtag: 'tag', count: 10 }, { hashtag: 'tag', count: 10 }, ...]

    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Gagal mengambil data trending hashtag'
        });
    }
});
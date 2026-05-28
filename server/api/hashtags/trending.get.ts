// server/api/hashtags/trending.get.ts
import { Twit } from '../../models/Twit.schema'

export default defineEventHandler(async (event) => {
    try {
        // Tentukan batas waktu (misal: 7 hari terakhir)
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - 7);

        const trendingHashtags = await Twit.aggregate([
            // 1. Ambil twit yang dibuat dalam 7 hari terakhir dan memiliki hashtag
            {
                $match: {
                    createdAt: { $gte: dateLimit },
                    hashtags: { $exists: true, $not: { $size: 0 } }
                }
            },
            // 2. Pecah array hashtags sehingga setiap hashtag menjadi dokumen terpisah
            { $unwind: "$hashtags" },
            // 3. Kelompokkan berdasarkan nama hashtag dan hitung kemunculannya
            {
                $group: {
                    _id: "$hashtags",
                    count: { $sum: 1 }
                }
            },
            // 4. Urutkan berdasarkan jumlah terbanyak (descending)
            { $sort: { count: -1 } },
            // 5. Ambil top 10 hashtag saja
            { $limit: 10 }
        ]);

        // Format ulang output agar lebih mudah dibaca di frontend
        return trendingHashtags.map(tag => ({
            hashtag: tag._id,
            count: tag.count
        }));

    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Gagal mengambil data trending hashtag'
        })
    }
})
import { User } from '../../models/User.schema'

export default defineEventHandler(async (event) => {
    // Ambil query 'q' dari URL (misal: /api/user/search?q=raf)
    const query = getQuery(event)
    const search = query.q as string

    if (!search) return []

    try {
        // Cari user yang username-nya mengandung huruf yang diketik (case-insensitive)
        const users = await User.find({
            username: { $regex: search, $options: 'i' }
        })
            .limit(5) // Batasi maksimal 5 saran agar pop-up tidak kepanjangan
            .select('_id username name photo') // Ambil field yang dibutuhkan saja

        return users
    } catch (error) {
        return []
    }
})
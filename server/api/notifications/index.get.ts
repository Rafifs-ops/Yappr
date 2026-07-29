import { prisma } from "../../utils/prisma";
import { session } from "../../utils/session";

export default defineEventHandler(async (event) => {
    try {
        const user = await session(event); // Mengambil user dari session

        // Jika tidak ada user
        if (!user) {
            throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
        }

        // Mengambil notifikasi
        const notifications = await prisma.notification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            include: {
                sender: { select: { id: true, username: true, photo: true } }
            }
        });

        // Mengembalikan notifikasi
        return notifications.map((n: any) => ({
            ...n,
            _id: n.id,
            user: n.userId,
            sender: n.sender ? {
                ...n.sender,
                _id: n.sender.id,
                name: n.sender.username,
                profileImage: n.sender.photo
            } : null
        })); // output: [{ _id: string, user: string, sender: { _id: string, name: string, profileImage: string } }, ...]
    } catch (error: any) {
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message });
    }
});

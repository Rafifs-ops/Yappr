import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
    try {
        const { follower, following } = await readBody(event); // Mengambil data follower dan following dari body request

        // Mencari user yang akan diikuti
        const targetUser = await prisma.user.findUnique({ where: { id: following } });
        if (!targetUser) throw createError({ statusCode: 404, statusMessage: 'User not found' });

        const isPrivate = targetUser.isPrivate; // Mengambil status private user yang akan diikuti
        const status = isPrivate ? 'pending' : 'accepted'; // Mengambil status follow (pending jika private, accepted jika tidak)

        // Membuat follow baru
        await prisma.follow.create({
            data: {
                followerId: follower,
                followingId: following,
                status: status
            }
        });

        // Membuat notifikasi
        if (follower !== following) { // Jika follower dan following bukan orang yang sama
            if (isPrivate) { // Jika user yang akan diikuti adalah private
                await prisma.notification.create({
                    data: {
                        userId: following,
                        senderId: follower,
                        type: 'follow_request',
                        message: 'meminta untuk mengikuti Anda'
                    }
                });
            } else { // Jika user yang akan diikuti adalah public
                await prisma.notification.create({
                    data: {
                        userId: following,
                        senderId: follower,
                        type: 'follow',
                        message: 'mulai mengikuti Anda'
                    }
                });

                // Update jumlah following pada user yang login
                await prisma.user.update({
                    where: { id: follower },
                    data: { following: { increment: 1 } }
                });

                // Update jumlah followers pada user yang diikuti
                await prisma.user.update({
                    where: { id: following },
                    data: { followers: { increment: 1 } }
                });
            }
        }

        return {
            statusCode: 201,
            statusMessage: status == 'pending' ? "Follow request sent" : "User followed successfully",
        };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: error.message,
        });
    }
});

import { session } from "../../utils/session";
import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
    try {
        const auth = await session(event); // Mengambil data client yang login
        const body = await readBody(event); // Mengambil data dari body
        const { targetUserId } = body; // Mengambil data target user dari body

        // Validasi data targetUserId apakah ada ?
        if (!targetUserId) {
            throw createError({ statusCode: 400, statusMessage: 'targetUserId is required' });
        }

        // Mencari user berdasarkan targetUserId apakah user tersebut ada ?
        const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!targetUser) {
            throw createError({ statusCode: 404, statusMessage: 'User not found' });
        }

        // Validasi apakah user yang login sama dengan target user
        if (targetUserId === auth.id) {
            throw createError({ statusCode: 400, statusMessage: 'Cannot chat with yourself' });
        }

        // Mengambil data chat berdasarkan user yang login
        const authUserChats: any = await prisma.memberChat.findMany({
            where: { userId: auth.id },
            select: { conversationId: true }
        });
        // Mengambil data chat berdasarkan user yang login
        const chatIds = authUserChats.map((mc: any) => mc.conversationId);

        // Mencari chat yang sudah ada antara user yang login dengan target user
        const existingChat = await prisma.memberChat.findFirst({
            where: {
                conversationId: { in: chatIds },
                userId: targetUserId
            }
        });

        // Jika chat sudah ada maka akan menampilkan pesan bahwa chat sudah ada
        if (existingChat) {
            return {
                message: 'Chat already exists',
                chatId: existingChat.conversationId
            };
        }

        // Membuat room chat baru
        const newChat = await prisma.chat.create({
            data: {
                name: 'Direct Message',
                members: {
                    create: [
                        { userId: auth.id, role: 'owner' },
                        { userId: targetUserId, role: 'member' }
                    ]
                }
            }
        });

        return {
            message: 'Chat created successfully',
            chatId: newChat.id
        }; // output: { message, chatId }
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || 'Internal Server Error'
        });
    }
});

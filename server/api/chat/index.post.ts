import { session } from "../../utils/session";
import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
    try {
        const auth = await session(event);
        const body = await readBody(event);
        const { targetUserId } = body;

        if (!targetUserId) {
            throw createError({ statusCode: 400, statusMessage: 'targetUserId is required' });
        }

        const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
        if (!targetUser) {
            throw createError({ statusCode: 404, statusMessage: 'User not found' });
        }

        if (targetUserId === auth.id) {
            throw createError({ statusCode: 400, statusMessage: 'Cannot chat with yourself' });
        }

        const authUserChats: any = await prisma.memberChat.findMany({
            where: { userId: auth.id },
            select: { conversationId: true }
        });
        const chatIds = authUserChats.map((mc: any) => mc.conversationId);

        const existingChat = await prisma.memberChat.findFirst({
            where: {
                conversationId: { in: chatIds },
                userId: targetUserId
            }
        });

        if (existingChat) {
            return {
                message: 'Chat already exists',
                chatId: existingChat.conversationId
            };
        }

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
        };
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || 'Internal Server Error'
        });
    }
});

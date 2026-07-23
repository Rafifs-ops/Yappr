import { prisma } from "~~/server/utils/prisma";
import { session } from "~~/server/utils/session";

export default defineEventHandler(async (event) => {
    const auth = await session(event);
    const chatId = getRouterParam(event, 'id');

    if (!chatId) {
        throw createError({ statusCode: 400, statusMessage: 'Chat ID required' });
    }

    const isMember = await prisma.memberChat.findFirst({
        where: { conversationId: chatId, userId: auth.id }
    });

    if (!isMember) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
    }

    const messages = await prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: 'asc' },
        take: 50,
        include: {
            sender: { select: { id: true, username: true, photo: true } }
        }
    });

    return messages.map((m: any) => ({
        ...m,
        _id: m.id,
        senderId: m.sender ? {
            _id: m.sender.id,
            username: m.sender.username,
            photo: m.sender.photo
        } : null
    }));
});
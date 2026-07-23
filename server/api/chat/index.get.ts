import { session } from "../../utils/session";
import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
    try {
        const auth = await session(event);

        const memberChats = await prisma.memberChat.findMany({
            where: { userId: auth.id },
            include: {
                chat: true
            }
        });

        const chatList = [];

        for (const mc of memberChats) {
            const chat = mc.chat;
            if (!chat) continue;

            const otherMembers = await prisma.memberChat.findMany({
                where: {
                    conversationId: chat.id,
                    NOT: { userId: auth.id }
                },
                include: {
                    user: { select: { id: true, username: true, photo: true } }
                }
            });

            let chatName = chat.name;
            let chatPhoto = null;
            let otherUserId = null;

            if (otherMembers.length > 0) {
                const otherUser = otherMembers[0].user;
                if (!chatName || chatName === 'Direct Message') {
                    chatName = otherUser.username;
                }
                chatPhoto = otherUser.photo;
                otherUserId = otherUser.id;
            }

            const latestMessage = await prisma.message.findFirst({
                where: { chatId: chat.id },
                orderBy: { createdAt: 'desc' },
                include: {
                    sender: { select: { username: true } }
                }
            });

            chatList.push({
                _id: chat.id,
                name: chatName,
                photo: chatPhoto,
                otherUserId: otherUserId,
                latestMessage: latestMessage ? {
                    content: latestMessage.content,
                    createdAt: latestMessage.createdAt,
                    sender: latestMessage.sender?.username
                } : null,
                updatedAt: latestMessage ? latestMessage.createdAt : chat.createdAt
            });
        }

        chatList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        return chatList;
    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Gagal mengambil daftar chat'
        });
    }
});

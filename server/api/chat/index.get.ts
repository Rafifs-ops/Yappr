import { session } from "../../utils/session";
import { prisma } from "../../utils/prisma";
import { OutgoingMessage } from "http";

export default defineEventHandler(async (event) => {
    try {
        const auth = await session(event); // Mengambil data client yang login

        // Mengambil data-data chat(room chat) dimana user menjadi memberChat di beberapa room chat
        const memberChats = await prisma.memberChat.findMany({
            where: { userId: auth.id },
            include: {
                chat: true
            }
        });

        const chatList = [];

        // Looping data chat yang didapat
        for (const mc of memberChats) {
            const chat = mc.chat;
            if (!chat) continue;

            // Mencari member lain selain user yang login
            const otherMembers: any = await prisma.memberChat.findMany({
                where: {
                    conversationId: chat.id,
                    NOT: { userId: auth.id }
                },
                include: {
                    user: { select: { id: true, username: true, photo: true } }
                }
            });

            // Mengambil nama chat, foto, dan user lain
            let chatName = chat.name;
            let chatPhoto = null;
            let otherUserId = null;

            // Jika ada member lain
            if (otherMembers.length > 0) {
                const otherUser = otherMembers[0].user;
                if (!chatName || chatName === 'Direct Message') {
                    chatName = otherUser.username;
                }
                chatPhoto = otherUser.photo;
                otherUserId = otherUser.id;
            }

            // Mengambil pesan terakhir
            const latestMessage = await prisma.message.findFirst({
                where: { chatId: chat.id },
                orderBy: { createdAt: 'desc' },
                include: {
                    sender: { select: { username: true } }
                }
            });

            // Memasukkan data chat ke dalam array chatList
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

        // Mengurutkan data chat berdasarkan pesan terakhir
        chatList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        return chatList; // output:  [{_id, name, photo, otherUserId, latestMessage, updatedAt}]
    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Gagal mengambil daftar chat'
        });
    }
});

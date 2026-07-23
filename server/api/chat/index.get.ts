import { session } from "../../utils/session";
import { MemberChat } from "../../models/memberChat.schema";
import { Chat } from "../../models/Chat.schema";
import { Message } from "../../models/Message.schema";
import { User } from "../../models/User.schema";

export default defineEventHandler(async (event) => {
    try {
        const auth = await session(event); // mengambil session

        // mengambil semua chat di mana user adalah anggota
        const memberChats = await MemberChat.find({ userId: auth.id }).populate('conversationId');

        const chatList = []; // inisialisasi chatList

        // Looping semua chat di mana user adalah anggota
        for (const mc of memberChats) {
            const chat = mc.conversationId as any; // mengambil chat
            if (!chat) continue;

            // mengambil anggota lain dari chat
            const otherMembers = await MemberChat.find({
                conversationId: chat._id,
                userId: { $ne: auth.id }
            }).populate('userId');

            // menentukan nama dan foto chat (default ke anggota lain pertama jika ini adalah chat 1-on-1)
            let chatName = chat.name;
            let chatPhoto = null;
            let otherUserId = null;

            // jika anggota lain ada
            if (otherMembers.length > 0) {
                const otherUser = otherMembers[0]?.userId as any;
                // jika nama chat tidak ada atau "Direct Message" maka akan diisi dengan nama anggota lain
                if (!chatName || chatName === 'Direct Message') {
                    chatName = otherUser.username;
                }
                chatPhoto = otherUser.photo;
                otherUserId = otherUser._id;
            }

            // mengambil pesan terakhir untuk preview
            const latestMessage = await Message.findOne({ chatId: chat._id })
                .sort({ createdAt: -1 })
                .populate('senderId');

            // memasukkan data ke chatList
            chatList.push({
                _id: chat._id,
                name: chatName,
                photo: chatPhoto,
                otherUserId: otherUserId,
                latestMessage: latestMessage ? {
                    content: latestMessage.content,
                    createdAt: latestMessage.createdAt,
                    sender: (latestMessage.senderId as any)?.username
                } : null,
                updatedAt: latestMessage ? latestMessage.createdAt : chat.createdAt
            });
        }

        // Sort chats by latest update
        chatList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

        return chatList;
    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Gagal mengambil daftar chat'
        });
    }
});

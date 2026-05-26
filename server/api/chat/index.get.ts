import { session } from "../../utils/session";
import { MemberChat } from "../../models/memberChat.schema";
import { Chat } from "../../models/Chat.schema";
import { Message } from "../../models/Message.schema";
import { User } from "../../models/User.schema";

export default defineEventHandler(async (event) => {
    try {
        const auth = await session(event);
        
        // Find all chats where the current user is a member
        const memberChats = await MemberChat.find({ userId: auth.id }).populate('conversationId');
        
        const chatList = [];

        for (const mc of memberChats) {
            const chat = mc.conversationId;
            if (!chat) continue;

            // Get the other members of this chat
            const otherMembers = await MemberChat.find({ 
                conversationId: chat._id, 
                userId: { $ne: auth.id } 
            }).populate('userId');

            // Determine chat name and photo (default to the first other member if it's a 1-on-1 chat)
            let chatName = chat.name;
            let chatPhoto = null;
            let otherUserId = null;

            if (otherMembers.length > 0) {
                const otherUser = otherMembers[0].userId as any;
                if (!chatName || chatName === 'Direct Message') {
                    chatName = otherUser.username;
                }
                chatPhoto = otherUser.photo;
                otherUserId = otherUser._id;
            }

            // Get the latest message for preview
            const latestMessage = await Message.findOne({ chatId: chat._id })
                .sort({ createdAt: -1 })
                .populate('senderId');

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

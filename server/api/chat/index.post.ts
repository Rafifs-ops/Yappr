import { session } from "../../utils/session";
import { MemberChat } from "../../models/memberChat.schema";
import { Chat } from "../../models/Chat.schema";
import { User } from "../../models/User.schema";

export default defineEventHandler(async (event) => {
    try {
        const auth = await session(event);
        const body = await readBody(event);
        const { targetUserId } = body;

        if (!targetUserId) {
            throw createError({ statusCode: 400, statusMessage: 'targetUserId is required' });
        }

        // Check if target user exists
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            throw createError({ statusCode: 404, statusMessage: 'User not found' });
        }

        // Prevent chatting with oneself
        if (targetUserId === auth.id) {
            throw createError({ statusCode: 400, statusMessage: 'Cannot chat with yourself' });
        }

        // Check if chat already exists between these two users
        // Kita cek semua chat yang dimiliki auth, lalu kita cek apakah targetUserId ada di salah satu chat tersebut.
        const authUserChats = await MemberChat.find({ userId: auth.id });
        const chatIds = authUserChats.map(mc => mc.conversationId).filter(id => id != null);

        const existingChat = await MemberChat.findOne({
            conversationId: { $in: chatIds },
            userId: targetUserId
        });

        if (existingChat) {
            return {
                message: 'Chat already exists',
                chatId: existingChat.conversationId
            };
        }

        // Create new chat
        const newChat = await Chat.create({
            name: 'Direct Message',
        });

        // Add both users to MemberChat
        await MemberChat.insertMany([
            {
                conversationId: newChat._id,
                userId: auth.id,
                role: 'owner'
            },
            {
                conversationId: newChat._id,
                userId: targetUserId,
                role: 'member'
            }
        ]);

        return {
            message: 'Chat created successfully',
            chatId: newChat._id
        };
    } catch (error: any) {
        throw createError({
            statusCode: error.statusCode || 500,
            statusMessage: error.statusMessage || 'Internal Server Error'
        });
    }
});

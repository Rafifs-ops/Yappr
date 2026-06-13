import { Message } from "~~/server/models/Message.schema";
import { session } from "~~/server/utils/session";
import { MemberChat } from "~~/server/models/memberChat.schema";

export default defineEventHandler(async (event) => {
    const auth = await session(event); // mengambil session
    const chatId = getRouterParam(event, 'id'); // mengambil id dari url

    // Cek apakah user adalah anggota dari chat ini
    const isMember = await MemberChat.findOne({ conversationId: chatId, userId: auth.id });
    if (!isMember) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
    }

    // Mengambil 50 pesan terakhir
    const messages = await Message.find({ chatId })
        .populate('senderId', 'username photo') // Populate nama dan foto
        .sort({ createdAt: 1 })
        .limit(50);

    return messages;
});
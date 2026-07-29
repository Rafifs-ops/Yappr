import { prisma } from "~~/server/utils/prisma";
import { session } from "~~/server/utils/session";

export default defineEventHandler(async (event) => {
    const auth = await session(event); // Mengambil data session
    const chatId = getRouterParam(event, 'id'); // Mengambil data dari parameter url

    // Validasi data chat id apakah ada ?
    if (!chatId) {
        throw createError({ statusCode: 400, statusMessage: 'Chat ID required' });
    }

    // Validasi user apakah menjadi anggota dari chat yang dipilih ?
    // Jika tidak maka akan menampilkan error
    const isMember = await prisma.memberChat.findFirst({
        where: { conversationId: chatId, userId: auth.id }
    });
    if (!isMember) {
        throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
    }

    // Mengambil data pesan
    // take: 50 digunakan untuk mengambil 50 data pesan terakhir
    // orderBy: { createdAt: 'asc' } digunakan untuk mengurutkan data pesan berdasarkan tanggal pembuatan
    const messages = await prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: 'asc' },
        take: 50,
        include: {
            sender: { select: { id: true, username: true, photo: true } }
        }
    });

    // Mengembalikan data pesan
    return messages.map((m: any) => ({
        ...m,
        _id: m.id,
        senderId: m.sender ? {
            _id: m.sender.id,
            username: m.sender.username,
            photo: m.sender.photo
        } : null
    })); // output: [{ _id, chatId, content, createdAt, senderId }] 
});
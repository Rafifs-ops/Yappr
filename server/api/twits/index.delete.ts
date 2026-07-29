import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event); // Mengambil body dari request
        const twit = await prisma.twit.findUnique({ where: { id: body.twitId } }); // Mengambil twit berdasarkan id

        // Jika twit tidak ditemukan
        if (!twit) {
            throw createError({ statusCode: 404, statusMessage: 'Twit not found' });
        }

        // Jika twit adalah sub twit, update commentCount di twit utama
        if (twit.isSubTwit && twit.referenceId) {
            await prisma.twit.update({
                where: { id: twit.referenceId },
                data: { commentCount: { decrement: 1 } }
            });
        }

        // Hapus semua sub twit yang terhubung dengan twit yang akan dihapus
        await prisma.twit.deleteMany({
            where: { referenceId: body.twitId }
        });

        // Hapus twit
        const deletedTwit = await prisma.twit.delete({
            where: { id: body.twitId }
        });

        return { success: true, data: { ...deletedTwit, _id: deletedTwit.id } };
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }
});

import { prisma } from "../../utils/prisma";

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event);
        const twit = await prisma.twit.findUnique({ where: { id: body.twitId } });

        if (!twit) {
            throw createError({ statusCode: 404, statusMessage: 'Twit not found' });
        }

        if (twit.isSubTwit && twit.referenceId) {
            await prisma.twit.update({
                where: { id: twit.referenceId },
                data: { commentCount: { decrement: 1 } }
            });
        }

        await prisma.twit.deleteMany({
            where: { referenceId: body.twitId }
        });

        const deletedTwit = await prisma.twit.delete({
            where: { id: body.twitId }
        });

        return { success: true, data: { ...deletedTwit, _id: deletedTwit.id } };
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }
});

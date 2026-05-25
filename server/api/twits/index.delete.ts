import { Twit } from "../../models/Twit.schema";

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event);
        const twit = await Twit.findByIdAndDelete(body.twitId);
        
        if (twit && twit.SubTwit?.isSubTwit && twit.SubTwit.reference) {
            await Twit.findByIdAndUpdate(twit.SubTwit.reference, { $inc: { commentCount: -1 } });
        }
        
        // Hapus semua komentar yang me-reference ke twit ini
        await Twit.deleteMany({ 'SubTwit.reference': body.twitId });

        return { success: true, data: twit };
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }
});

import { Twit } from '../../models/Twit.schema';
import { session } from '../../utils/session';
import { v2 as cloudinary } from 'cloudinary';

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event);
        const user = await session(event);
        const { twitId, text, image, hashtags } = body;

        if (!text || !user) {
            throw createError({ statusCode: 400, statusMessage: 'Text dan UserId wajib diisi' });
        }

        let imageUrl = '';
        if (image) {
            // Configure Cloudinary
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET,
                secure: true
            });

            try {
                const uploadResult = await cloudinary.uploader.upload(image, {
                    folder: 'twit_images_RTwit',
                    use_filename: true,
                });
                imageUrl = uploadResult.secure_url;
            } catch (err: any) {
                console.error('Cloudinary Upload Error:', err);
                throw createError({ statusCode: 500, statusMessage: 'Gagal upload gambar ke Cloudinary' });
            }
        }

        const newTwit = await Twit.create({
            user: user.id,
            text: text,
            image: imageUrl,
            hashtags: hashtags || [],
            likesCount: 0,
            commentCount: 0,
            SubTwit: {
                isSubTwit: twitId ? true : false,
                reference: twitId ? twitId : null
            }
        });

        if (twitId) {
            await Twit.findByIdAndUpdate(twitId, { $inc: { commentCount: 1 } });
        }

        return { success: true, data: newTwit };
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            throw createError({ statusCode: 400, statusMessage: error.message });
        }
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message });
    }
});

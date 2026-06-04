import { Twit } from '../../models/Twit.schema';
import { session } from '../../utils/session';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event);
        const user = await session(event);
        const { twitId, text, image, video, hashtags } = body;

        // Membersihkan tag HTML dari tiptap (seperti <p></p> atau <p><br></p>)
        const plainText = (text || '').replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();

        // Tolak jika teks kosong dan tidak ada media
        if (!plainText) {
            throw createError({ statusCode: 400, statusMessage: 'Twit tidak boleh kosong' });
        }

        // Cek autentikasi user
        if (!user) {
            throw createError({ statusCode: 401, statusMessage: 'Akses ditolak. User tidak valid.' });
        }

        let imageUrl = '';
        let videoUrl = '';

        if (image) {
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
        if (video) {
            try {
                const uploadResult = await cloudinary.uploader.upload_large(video, {
                    folder: 'twit_videos_RTwit',
                    resource_type: 'video',
                    chunk_size: 6000000 // 6MB chunks
                });
                videoUrl = uploadResult.secure_url;
            } catch (err: any) {
                console.error('Cloudinary Upload Error:', err);
                throw createError({ statusCode: 500, statusMessage: 'Gagal upload video ke Cloudinary' });
            }
        }

        const newTwit = await Twit.create({
            user: user.id,
            text: text,
            image: imageUrl,
            video: videoUrl,
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

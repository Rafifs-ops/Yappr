import { Twit } from '../../models/Twit.schema';
import { Notification } from '../../models/Notification.schema';
import { session } from '../../utils/session';
import { User } from '../../models/User.schema';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

// Helper function untuk upload file berbentuk Buffer (Stream) ke Cloudinary
const uploadStream = (buffer: Buffer, options: any) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) reject(error);
            else resolve(result);
        });
        stream.end(buffer);
    });
};

export default defineEventHandler(async (event) => {
    try {
        const user = await session(event);

        // Cek autentikasi user
        if (!user) {
            throw createError({ statusCode: 401, statusMessage: 'Akses ditolak. User tidak valid.' });
        }

        // Membaca FormData dari request
        const multipartData = await readMultipartFormData(event);
        if (!multipartData) {
            throw createError({ statusCode: 400, statusMessage: 'Data form tidak valid atau kosong' });
        }

        let text = '';
        let twitId = '';
        let hashtags: string[] = [];
        let imageBuffer: Buffer | undefined;
        let videoBuffer: Buffer | undefined;

        // Ekstrak data dari array multipart
        for (const part of multipartData) {
            if (part.name === 'text' && part.data) {
                text = part.data.toString('utf-8');
            }
            if (part.name === 'twitId' && part.data) {
                twitId = part.data.toString('utf-8');
            }
            if (part.name === 'hashtags' && part.data) {
                try {
                    hashtags = JSON.parse(part.data.toString('utf-8'));
                } catch (e) {
                    hashtags = [];
                }
            }
            if (part.name === 'image' && part.data) {
                imageBuffer = part.data;
            }
            if (part.name === 'video' && part.data) {
                videoBuffer = part.data;
            }
        }

        // Membersihkan tag HTML dari tiptap
        const plainText = (text || '').replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();

        const mentionedUsernames = text.match(/@([a-zA-Z0-9_]+)/g)?.map(m => m.substring(1)) || [];
        let mentionIds: string[] = [];
        let taggedUsers: any[] = [];

        // Check user if mentioned
        if (mentionedUsernames.length > 0) {
            taggedUsers = await User.find({ username: { $in: mentionedUsernames } });
            mentionIds = taggedUsers.map(user => user._id.toString());
        }

        // Tolak jika teks kosong
        if (!plainText) {
            throw createError({ statusCode: 400, statusMessage: 'Twit tidak boleh kosong' });
        }

        let imageUrl = '';
        let videoUrl = '';

        // Upload Image via Stream jika ada
        if (imageBuffer) {
            try {
                const uploadResult: any = await uploadStream(imageBuffer, {
                    folder: 'twit_images_RTwit'
                });
                imageUrl = uploadResult.secure_url;
            } catch (err: any) {
                console.error('Cloudinary Image Upload Error:', err);
                throw createError({ statusCode: 500, statusMessage: 'Gagal upload gambar ke Cloudinary' });
            }
        }

        // Upload Video via Stream jika ada
        if (videoBuffer) {
            try {
                const uploadResult: any = await uploadStream(videoBuffer, {
                    folder: 'twit_videos_RTwit',
                    resource_type: 'video',
                    chunk_size: 6000000 // 6MB chunks
                });
                videoUrl = uploadResult.secure_url;
            } catch (err: any) {
                console.error('Cloudinary Video Upload Error:', err);
                throw createError({ statusCode: 500, statusMessage: 'Gagal upload video ke Cloudinary' });
            }
        }

        const dbSession = await mongoose.startSession();
        dbSession.startTransaction();
        let newTwit;

        try {
            // Simpan data ke MongoDB
            const newTwitArr = await Twit.create([{
                user: user.id,
                text: text,
                image: imageUrl,
                video: videoUrl,
                hashtags: hashtags || [],
                mentions: mentionIds,
                likesCount: 0,
                commentCount: 0,
                SubTwit: {
                    isSubTwit: twitId ? true : false,
                    reference: twitId ? twitId : null
                }
            }], { session: dbSession });
            newTwit = newTwitArr[0];

            if (mentionIds.length > 0) {
                // Kirim Notifikasi ke setiap user yang di-tag
                for (const taggedUser of taggedUsers) {
                    // Jangan kirim notifikasi jika user menge-tag dirinya sendiri
                    if (taggedUser._id.toString() !== user.id.toString()) {
                        await Notification.create([{
                            user: taggedUser._id,
                            sender: user.id,
                            type: 'mention',
                            twitId: newTwit._id,
                            message: 'menandai Anda dalam yappingannya',
                            twitText: text,
                        }], { session: dbSession });
                    }
                }
            }

            if (twitId) {
                await Twit.findByIdAndUpdate(twitId, { $inc: { commentCount: 1 } }, { session: dbSession });

                const twit = await Twit.findById(twitId).session(dbSession);
                if (twit && twit.user.toString() !== user.id.toString()) {
                    await Notification.create([{
                        user: twit.user,
                        sender: user.id,
                        type: 'comment',
                        message: 'mengomentari twit Anda',
                        twitText: twit.text,
                        twitId: twitId, // Menggunakan twitId yang diekstrak dari form
                        commentText: text,
                    }], { session: dbSession });
                }
            }

            await dbSession.commitTransaction();
            dbSession.endSession();
        } catch (error) {
            await dbSession.abortTransaction();
            dbSession.endSession();
            throw error;
        }

        return { success: true, data: newTwit };
    } catch (error: any) {
        if (error.name === 'ValidationError') {
            throw createError({ statusCode: 400, statusMessage: error.message });
        }
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message });
    }
});
import { prisma } from '../../utils/prisma';
import { session } from '../../utils/session';
import { v2 as cloudinary } from 'cloudinary';

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
        const config = useRuntimeConfig(); // Mengambil data config dari file .env

        // Mengkonfigurasi Cloudinary
        cloudinary.config({
            cloud_name: config.cloudinaryCloudName,
            api_key: config.cloudinaryApiKey,
            api_secret: config.cloudinaryApiSecret,
            secure: true
        });
        const user = await session(event); // Mengambil data user dari session

        // Jika user tidak login, throw error
        if (!user) {
            throw createError({ statusCode: 401, statusMessage: 'Akses ditolak. User tidak valid.' });
        }

        const multipartData = await readMultipartFormData(event); // output: data yang dikirim dari client
        if (!multipartData) {
            throw createError({ statusCode: 400, statusMessage: 'Data form tidak valid atau kosong' });
        }

        let text = '';
        let twitId = '';
        let hashtags: string[] = [];
        let imageBuffer: Buffer | undefined;
        let videoBuffer: Buffer | undefined;

        // Mengambil data dari form
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

        // Menghapus tag html dan spasi dari twit (hanya untuk pengecekan jumlah karakter)
        const plainText = (text || '').replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').trim();
        const MAX_TWIT_LENGTH = 280;

        // Jika twit kosong, throw error
        if (!plainText) {
            throw createError({ statusCode: 400, statusMessage: 'Twit tidak boleh kosong' });
        }

        // Jika twit terlalu panjang, throw error
        if (plainText.length > MAX_TWIT_LENGTH) {
            throw createError({
                statusCode: 400,
                statusMessage: `Twit terlalu panjang. Maksimal ${MAX_TWIT_LENGTH} karakter.`
            });
        }

        const MAX_MENTIONS = 5; // Maksimal user yang bisa mention
        const MAX_MENTION_LENGTH = 20; // Maksimal panjang username yang bisa mention

        // Mengambil username yang di mention
        const mentionedUsernames = text.match(new RegExp(`@([a-zA-Z0-9_]{1,${MAX_MENTION_LENGTH}})`, 'g'))
            ?.map(m => m.substring(1))
            .slice(0, MAX_MENTIONS) || [];

        let mentionIds: string[] = [];
        let taggedUsers: any[] = [];

        // Jika mention lebih dari maksimal, throw error
        if ((text.match(/@([a-zA-Z0-9_]+)/g) || []).length > MAX_MENTIONS) {
            throw createError({
                statusCode: 400,
                statusMessage: `Maksimal ${MAX_MENTIONS} mention per twit`
            });
        }

        // Jika username mention lebih dari maksimal, throw error
        if ((text.match(/@([a-zA-Z0-9_]+)/g) || []).some(m => m.length - 1 > MAX_MENTION_LENGTH)) {
            throw createError({
                statusCode: 400,
                statusMessage: `Username mention terlalu panjang. Maksimal ${MAX_MENTION_LENGTH} karakter.`
            });
        }

        // Jika ada mention, ambil data user yang di mention dari database
        if (mentionedUsernames.length > 0) {
            taggedUsers = await prisma.user.findMany({
                where: { username: { in: mentionedUsernames } }
            });
            mentionIds = taggedUsers.map(u => u.id);
        }

        let imageUrl = '';
        let videoUrl = '';

        // Upload gambar ke Cloudinary
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

        // Upload video ke Cloudinary
        if (videoBuffer) {
            try {
                const uploadResult: any = await uploadStream(videoBuffer, {
                    folder: 'twit_videos_RTwit',
                    resource_type: 'video',
                    chunk_size: 6000000
                });
                videoUrl = uploadResult.secure_url;
            } catch (err: any) {
                console.error('Cloudinary Video Upload Error:', err);
                throw createError({ statusCode: 500, statusMessage: 'Gagal upload video ke Cloudinary' });
            }
        }

        // Membuat twit di database (Menggunakan $transaction agar aman)
        const result = await prisma.$transaction(async (tx) => {
            const newTwit = await tx.twit.create({
                data: {
                    userId: user.id,
                    text: text,
                    image: imageUrl || null,
                    video: videoUrl || null,
                    isSubTwit: !!twitId,
                    referenceId: twitId || null,
                    hashtags: {
                        create: (hashtags || []).map(tag => ({ tag: tag.toLowerCase().trim() }))
                    },
                    mentions: {
                        create: mentionIds.map(mId => ({ userId: mId }))
                    }
                }
            });

            // Membuat notifikasi untuk user yang di mention (jika ada)
            if (mentionIds.length > 0) {
                for (const taggedUser of taggedUsers) {
                    if (taggedUser.id !== user.id) { // Jika yang di mention bukan client sendiri
                        await tx.notification.create({
                            data: {
                                userId: taggedUser.id,
                                senderId: user.id,
                                type: 'mention',
                                twitId: newTwit.id,
                                message: 'menandai Anda dalam yappingannya',
                                twitText: text,
                            }
                        });
                    }
                }
            }

            // Jika twit merupakan komentar (sub twit) di dalam twit lain
            if (twitId) {
                await tx.twit.update({
                    where: { id: twitId },
                    data: { commentCount: { increment: 1 } }
                });

                const parentTwit = await tx.twit.findUnique({ where: { id: twitId } });

                // Membuat notifikasi untuk user yang memiliki twit (jika ada)
                if (parentTwit && parentTwit.userId !== user.id) { // Jika twit bukan milik client sendiri
                    await tx.notification.create({
                        data: {
                            userId: parentTwit.userId,
                            senderId: user.id,
                            type: 'comment',
                            message: 'mengomentari twit Anda',
                            twitText: parentTwit.text,
                            twitId: twitId,
                            commentText: text,
                        }
                    });
                }
            }

            return {
                ...newTwit,
                _id: newTwit.id,
                SubTwit: {
                    isSubTwit: newTwit.isSubTwit,
                    reference: newTwit.referenceId
                }
            };
        });

        return { success: true, data: result };

    } catch (error: any) {
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.message });
    }
});
import { prisma } from '../../utils/prisma';
import { session } from '../../utils/session';
import { v2 as cloudinary } from 'cloudinary';

export default defineEventHandler(async (event) => {
    try {
        const config = useRuntimeConfig();
        cloudinary.config({
            cloud_name: config.cloudinaryCloudName,
            api_key: config.cloudinaryApiKey,
            api_secret: config.cloudinaryApiSecret,
            secure: true
        });

        const body = await readBody(event);
        const currentUser = await session(event);

        if (!currentUser) {
            throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
        }

        const { id, username, bio, photo, isPrivate } = body;

        if (id && id !== currentUser.id) {
            throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
        }

        const updateData: any = {};
        if (username) updateData.username = username;
        if (bio !== undefined) updateData.bio = bio;
        if (isPrivate !== undefined) updateData.isPrivate = isPrivate;

        if (photo && photo.startsWith('data:image')) {
            try {
                const uploadResult = await cloudinary.uploader.upload(photo, {
                    folder: 'profile_pictures_RTwit',
                    use_filename: true,
                });
                updateData.photo = uploadResult.secure_url;
            } catch (err: any) {
                console.error('Cloudinary Upload Error:', err);
                throw createError({ statusCode: 500, statusMessage: 'Gagal upload foto ke Cloudinary' });
            }
        }

        if (username) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    username,
                    NOT: { id: currentUser.id }
                }
            });
            if (existingUser) {
                throw createError({ statusCode: 400, statusMessage: 'Username sudah digunakan' });
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: currentUser.id },
            data: updateData
        });

        return {
            success: true,
            username: updatedUser.username,
            bio: updatedUser.bio,
            photo: updatedUser.photo
        };

    } catch (error: any) {
        if (error.statusCode) {
            throw error;
        }
        console.error('Error updating profile:', error);
        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error'
        });
    }
});

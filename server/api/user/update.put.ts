import { User } from '../../models/User.schema';
import { session } from '../../utils/session';
import { v2 as cloudinary } from 'cloudinary';



export default defineEventHandler(async (event) => {
    try {
        const config = useRuntimeConfig();
        // Configure Cloudinary
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

        // Validasi jika user ID di body berbeda dengan session (opsional)
        if (id && id !== currentUser.id) {
            throw createError({ statusCode: 403, statusMessage: 'Forbidden' });
        }

        // Siapkan object update
        const updateData: any = {};
        if (username) updateData.username = username;
        if (bio !== undefined) updateData.bio = bio;
        if (isPrivate !== undefined) updateData.isPrivate = isPrivate;

        // Jika ada foto baru (base64 string)
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

        // Cek apakah username sudah dipakai orang lain
        if (username) {
            const existingUser = await User.findOne({ username, _id: { $ne: currentUser.id } });
            if (existingUser) {
                throw createError({ statusCode: 400, statusMessage: 'Username sudah digunakan' });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            currentUser.id,
            { $set: updateData },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            throw createError({ statusCode: 404, statusMessage: 'User tidak ditemukan' });
        }

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

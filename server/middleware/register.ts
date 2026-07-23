import { v2 as cloudinary } from 'cloudinary'

export default defineEventHandler(async (event) => {
    // 1. Dapatkan path dari request saat ini
    const path = event.path;

    // 2. Cek apakah path cocok dengan route yang ingin Anda targetkan
    if (path.startsWith('/api/auth/register')) {
        // Logika middleware Anda di sini
        const config = useRuntimeConfig()

        // Konfigurasi Cloudinary
        cloudinary.config({
            cloud_name: config.cloudinaryCloudName,
            api_key: config.cloudinaryApiKey,
            api_secret: config.cloudinaryApiSecret,
            secure: true
        })

        // Ambil body request (biasanya base64 atau file)
        const body = await readBody(event)
        const { file } = body

        if (file) {
            try {
                // Proses upload ke Cloudinary
                const result = await cloudinary.uploader.upload(file, {
                    folder: 'user_profile_photos_RTwit',
                    use_filename: true,
                })

                event.context.photo = result.secure_url
            } catch (error) {
                throw createError({
                    statusCode: 500,
                    statusMessage: 'Gagal upload ke Cloudinary',
                })
            }
        }
    }
    // Jika path tidak cocok, middleware akan mengabaikan blok if di atas
    // dan request akan dilanjutkan seperti biasa.
});
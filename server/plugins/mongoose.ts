import mongoose from 'mongoose';

export default defineNitroPlugin(async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.warn('MONGODB_URI is not defined in .env');
            return;
        }

        // PERBAIKAN: Cek jika Mongoose sudah terkoneksi, jangan buat koneksi baru
        if (mongoose.connection.readyState === 1) {
            console.log('MongoDB already connected.');
            return;
        }

        await mongoose.connect(uri);
        console.log('Successfully connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
});
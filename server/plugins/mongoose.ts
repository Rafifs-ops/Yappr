import mongoose from 'mongoose';
import dns from 'dns';



export default defineNitroPlugin(async () => {
    dns.setServers(['1.1.1.1']);
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
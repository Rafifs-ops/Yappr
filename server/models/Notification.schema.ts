import { Schema, model } from "mongoose";

const notificationSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' }, // Siapa yang menerima notifikasi (penerima)
    sender: { type: Schema.Types.ObjectId, ref: 'User' }, // Siapa yang melakukan aksi (pengirim)
    type: String, // like, comment, reply, follow
    message: String, // Isi pesan notifikasi
    isRead: { type: Boolean, default: false }, // Status notifikasi (dibaca atau belum)
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 5 * 60 * 1000) }
});

notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Notification = model('Notification', notificationSchema);
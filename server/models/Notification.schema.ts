import { Schema, model } from "mongoose";

const notificationSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' }, // Siapa yang menerima notifikasi (penerima)
    sender: { type: Schema.Types.ObjectId, ref: 'User' }, // Siapa yang melakukan aksi (pengirim)
    type: String, // like, comment, reply, follow
    message: String, // Isi pesan notifikasi
    twitId: { type: Schema.Types.ObjectId, ref: 'Twit', default: null }, // ID twit yang di like, comment, repost
    twitText: { type: String, default: null }, // Isi twit yang di like, comment, repost
    commentText: { type: String, default: null }, // Isi komentar untuk notifikasi comment
    isRead: { type: Boolean, default: false }, // Status notifikasi (dibaca atau belum)
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 5 * 60 * 1000) }
});

notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Notification = model('Notification', notificationSchema);
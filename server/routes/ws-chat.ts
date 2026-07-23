import { Message } from '../models/Message.schema';

// Menyimpan daftar koneksi aktif untuk heartbeat/cleanup jika perlu
const activeConnections = new Set<any>();

export default defineWebSocketHandler({
    open(peer) {
        console.log('[WS] Koneksi baru:', peer.id);
        activeConnections.add(peer);
    },

    async message(peer, message) {
        try {
            const data = JSON.parse(message.text());

            // Allow subscribing to a specific chat room
            if (data.type === 'subscribe') {
                peer.subscribe(data.chatId);
                console.log(`[WS] Peer ${peer.id} subscribed to ${data.chatId}`);
                return;
            }

            if (data.type === 'message') {
                // Simpan pesan ke MongoDB
                const newMessage = await Message.create({
                    chatId: data.chatId,
                    senderId: data.senderId,
                    content: data.content
                });

                // Populate data pengirim agar langsung tampil foto & namanya di sisi klien
                await newMessage.populate('senderId', 'username photo');

                // Broadcast pesan ini ke semua peer yang terhubung ke chatId tersebut
                peer.publish(data.chatId, JSON.stringify({
                    type: 'new_message',
                    message: newMessage
                }));

                peer.send(JSON.stringify({
                    type: 'new_message',
                    message: newMessage
                }));
            }
        } catch (error) {
            console.error('[WS] Error processing message:', error);
        }
    },

    error(peer, error) {
        console.error(`[WS] WebSocket error for peer ${peer.id}:`, error);
        // We do not need to explicitly close it, the framework handles it, but we can clean up
        activeConnections.delete(peer);
    },

    close(peer) {
        console.log('[WS] Koneksi ditutup:', peer.id);
        activeConnections.delete(peer);
    }
});

// Implementasi heartbeat (ping) sederhana untuk membersihkan koneksi mati
setInterval(() => {
    activeConnections.forEach((peer: any) => {
        if (peer.readyState === 3 /* CLOSED */) {
            activeConnections.delete(peer);
        } else {
            try {
                peer.send('ping'); // Atau bisa peer.ping() jika didukung oleh adapter WS nuxt
            } catch (e) {
                activeConnections.delete(peer);
            }
        }
    });
}, 30000);
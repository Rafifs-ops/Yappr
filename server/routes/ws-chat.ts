import { Message } from '../models/Message.schema';

// Peer adalah pihak yang terhubung ke websocket

export default defineWebSocketHandler({
    open(peer) {
        console.log('[WS] Koneksi baru:', peer.id);
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

    close(peer) {
        console.log('[WS] Koneksi ditutup:', peer.id);
    }
});
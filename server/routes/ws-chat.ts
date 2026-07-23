import { prisma } from '../utils/prisma';

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
                // Simpan pesan ke SQLite via Prisma
                const newMessage = await prisma.message.create({
                    data: {
                        chatId: data.chatId,
                        senderId: data.senderId,
                        content: data.content
                    },
                    include: {
                        sender: {
                            select: {
                                id: true,
                                username: true,
                                photo: true
                            }
                        }
                    }
                });

                // Format response structure compatible with frontend
                const formattedMessage = {
                    ...newMessage,
                    _id: newMessage.id,
                    senderId: {
                        _id: newMessage.sender.id,
                        username: newMessage.sender.username,
                        photo: newMessage.sender.photo
                    }
                };

                // Broadcast pesan ini ke semua peer yang terhubung ke chatId tersebut
                peer.publish(data.chatId, JSON.stringify({
                    type: 'new_message',
                    message: formattedMessage
                }));

                peer.send(JSON.stringify({
                    type: 'new_message',
                    message: formattedMessage
                }));
            }
        } catch (error) {
            console.error('[WS] Error processing message:', error);
        }
    },

    error(peer, error) {
        console.error(`[WS] WebSocket error for peer ${peer.id}:`, error);
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
                peer.send('ping');
            } catch (e) {
                activeConnections.delete(peer);
            }
        }
    });
}, 30000);
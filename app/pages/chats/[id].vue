<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '~/stores/Auth'

const route = useRoute()
const authStore = useAuth()
const chatId = route.params.id

const messages = ref([])
const newMessage = ref('')
const messagesContainer = ref(null)
let ws = null

const scrollToBottom = async () => {
    await nextTick()
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
}

onMounted(async () => {
    try {
        // Fetch history
        const history = await $fetch(`/api/chat/${chatId}/message`)
        messages.value = history
        scrollToBottom()

        // Connect to WebSocket
        // Gunakan host relatif jika mungkin, atau host absolut
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const wsUrl = `${protocol}//${window.location.host}/ws-chat`

        ws = new WebSocket(wsUrl)

        ws.onopen = () => {
            console.log('Terhubung ke chat server')
            // Subscribe ke room
            ws.send(JSON.stringify({
                type: 'subscribe',
                chatId: chatId
            }))
        }

        // Menerima pesan dari lawan bicara
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)
            if (data.type === 'new_message') {
                messages.value.push(data.message)
                scrollToBottom()
            }
        }

        ws.onerror = (error) => {
            console.error('WebSocket Error: ', error)
        }

    } catch (e) {
        console.error('Gagal memuat pesan:', e)
    }
})

onBeforeUnmount(() => {
    if (ws) {
        ws.close()
    }
})

// Mengirim pesan ke lawan bicara
const sendMessage = () => {
    if (!newMessage.value.trim() || !ws) return

    ws.send(JSON.stringify({
        type: 'message',
        chatId: chatId,
        senderId: authStore.session.id,
        content: newMessage.value.trim()
    }))

    newMessage.value = ''
}

const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(date)
}
</script>

<template>
    <main class="h-full flex flex-col bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden"
        style="height: calc(100vh - 180px);">
        <!-- Header -->
        <div class="flex items-center p-4 border-b border-white/10 bg-black/60 shadow-md">
            <NuxtLink to="/chats"
                class="text-gray-400 hover:text-white transition-colors mr-3 p-1 rounded-full hover:bg-white/10">
                <Icon name="mdi:arrow-left" class="w-6 h-6" />
            </NuxtLink>
            <div class="flex-1">
                <h1 class="text-xl font-bold text-white tracking-wide">Room Chat</h1>
            </div>
        </div>

        <!-- Messages Area -->
        <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            <div v-if="messages.length === 0" class="flex flex-col items-center justify-center h-full text-gray-500">
                <Icon name="mdi:chat-processing-outline" class="w-16 h-16 mb-2 opacity-50" />
                <p>Mulai obrolan sekarang!</p>
            </div>

            <div v-for="msg in messages" :key="msg._id" class="flex flex-col"
                :class="[msg.senderId?._id === authStore.session?.id ? 'items-end' : 'items-start']">

                <div class="flex items-end gap-2 max-w-[80%]">
                    <!-- Foto profil teman (kiri) -->
                    <img v-if="msg.senderId?._id !== authStore.session?.id"
                        :src="msg.senderId?.photo || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'"
                        class="w-8 h-8 rounded-full object-cover border border-gray-700" />

                    <div class="flex flex-col"
                        :class="[msg.senderId?._id === authStore.session?.id ? 'items-end' : 'items-start']">
                        <span v-if="msg.senderId?._id !== authStore.session?.id"
                            class="text-xs text-gray-400 mb-1 ml-1">{{ msg.senderId?.username }}</span>

                        <div class="px-4 py-2 rounded-2xl break-words" :class="[
                            msg.senderId?._id === authStore.session?.id
                                ? 'bg-blue-600 text-white rounded-br-none shadow-[0_2px_10px_rgba(37,99,235,0.3)]'
                                : 'bg-gray-800 border border-white/5 text-gray-100 rounded-bl-none shadow-[0_2px_10px_rgba(0,0,0,0.3)]'
                        ]">
                            {{ msg.content }}
                        </div>
                        <span class="text-[10px] text-gray-500 mt-1 mx-1">{{ formatDate(msg.createdAt) }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Input Area -->
        <div class="p-3 bg-black/60 border-t border-white/10">
            <form @submit.prevent="sendMessage" class="flex gap-2 relative">
                <input v-model="newMessage" type="text" placeholder="Tulis pesan..."
                    class="flex-1 bg-gray-900 border border-white/10 text-white rounded-full px-5 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-500" />

                <button type="submit" :disabled="!newMessage.trim()"
                    class="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white p-3 rounded-full flex items-center justify-center transition-all duration-300 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                    <Icon name="mdi:send" class="w-5 h-5 ml-1" />
                </button>
            </form>
        </div>
    </main>
</template>
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuth } from '~/stores/Auth'

const { $csrfFetch } = useNuxtApp()
const authStore = useAuth()
const chats = ref([])
const users = ref([])
const showNewChatModal = ref(false)
const isLoading = ref(true)

onMounted(async () => {
    try {
        const [chatsRes, usersRes] = await Promise.all([
            $fetch('/api/chat'),
            $fetch('/api/user')
        ])
        chats.value = chatsRes
        // Filter out current user from the list
        if (authStore.session?.id) {
            users.value = usersRes.filter(u => u._id !== authStore.session.id)
        } else {
            users.value = usersRes
        }
    } catch (e) {
        console.error(e)
    } finally {
        isLoading.value = false
    }
})

const createChat = async (userId) => {
    try {
        const res = await $csrfFetch('/api/chat', {
            method: 'POST',
            body: { targetUserId: userId }
        })
        showNewChatModal.value = false
        navigateTo(`/chats/${res.chatId}`)
    } catch (e) {
        console.error(e)
        alert('Gagal membuat obrolan')
    }
}

const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' }).format(date)
}
</script>

<template>
    <main class="h-full flex flex-col space-y-4">
        <!-- Header -->
        <div
            class="flex items-center justify-between bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-lg">
            <h1 class="text-2xl font-bold text-white tracking-wide">Chats</h1>
            <button @click="showNewChatModal = true"
                class="bg-blue-600 hover:bg-blue-500 text-white px-2 py-2 rounded-lg font-medium transition-all duration-300 shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                <Icon name="streamline-ultimate:add-circle-bold-bold" /> New Chat
            </button>
        </div>

        <!-- Chat List -->
        <div v-if="isLoading" class="flex justify-center py-12">
            <Icon name="eos-icons:loading" class="w-10 h-10 text-blue-500 animate-spin" />
        </div>
        <div v-else-if="chats.length === 0"
            class="flex flex-col items-center justify-center py-16 bg-black/20 rounded-xl border border-white/5">
            <Icon name="mdi:message-outline" class="w-16 h-16 text-gray-500 mb-4" />
            <p class="text-gray-400 text-lg">Belum ada obrolan.</p>
            <p class="text-gray-500 text-sm mt-1">Mulai obrolan baru sekarang!</p>
        </div>
        <div v-else class="flex flex-col gap-3">
            <NuxtLink v-for="chat in chats" :key="chat._id" :to="`/chats/${chat._id}`"
                class="flex items-center p-4 bg-black/40 backdrop-blur-sm border border-white/10 rounded-xl hover:bg-white/5 hover:border-blue-500/50 transition-all duration-300 group cursor-pointer">

                <img :src="chat.photo || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png'"
                    class="w-14 h-14 rounded-full object-cover border-2 border-gray-700 group-hover:border-blue-500 transition-colors" />

                <div class="ml-4 flex-1">
                    <div class="flex justify-between items-start">
                        <h3 class="text-white font-semibold text-lg">{{ chat.name }}</h3>
                        <span class="text-xs text-gray-500">{{ formatDate(chat.updatedAt) }}</span>
                    </div>
                    <p class="text-gray-400 text-sm truncate mt-1 max-w-[200px] sm:max-w-md">
                        <span v-if="chat.latestMessage?.sender" class="font-medium text-gray-300">{{
                            chat.latestMessage.sender }}: </span>
                        {{ chat.latestMessage?.content || 'Belum ada pesan' }}
                    </p>
                </div>
            </NuxtLink>
        </div>

        <!-- Modal New Chat -->
        <div v-if="showNewChatModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div
                class="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
                <div class="p-4 border-b border-white/10 flex justify-between items-center">
                    <h2 class="text-xl font-bold text-white">Mulai Obrolan</h2>
                    <button @click="showNewChatModal = false" class="text-gray-400 hover:text-white transition-colors">
                        <Icon name="streamline-ultimate:arrow-right" class="w-6 h-6" />
                    </button>
                </div>
                <div class="p-4 overflow-y-auto flex-1 space-y-3">
                    <div v-for="user in users" :key="user._id" @click="createChat(user._id)"
                        class="flex items-center p-3 hover:bg-white/5 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-white/10">
                        <img :src="user.photo" class="w-12 h-12 rounded-full object-cover" />
                        <div class="ml-3">
                            <p class="text-white font-medium">{{ user.username }}</p>
                            <p class="text-gray-400 text-xs">{{ user.email }}</p>
                        </div>
                    </div>
                    <div v-if="users.length === 0" class="text-center py-8 text-gray-500">
                        Tidak ada pengguna lain.
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>
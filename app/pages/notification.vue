<script setup>
import { useAuth } from '~/stores/Auth';
import { useToast } from '~/composables/useToast';
import { getIcon, getIconColor } from '~/utils/notifIcon';
import { formatDate } from '~/utils/formatDate';
import DOMPurify from '~/utils/sanitize';

const { $csrfFetch } = useNuxtApp();
const auth = useAuth();
const toast = useToast();

definePageMeta({
    layout: 'default'
})

const { data: notifications, refresh } = await useFetch('/api/notifications', {
    key: 'notifications-data',
    lazy: true
});

const markAsRead = async (notification) => {
    if (notification.isRead) return

    await $csrfFetch(`/api/notifications/${notification._id}`, {
        method: 'PATCH'
    })

    // Gunakan refreshNuxtData agar NavBottom juga terupdate
    refreshNuxtData('notifications-data');
}

const handleRequest = async (notif, action) => {
    try {
        await $csrfFetch(`/api/follow/${action}`, {
            method: 'POST',
            body: {
                follower: notif.sender._id || notif.sender,
                following: auth.session.id
            }
        });
        toast.success(action === 'accept' ? 'Permintaan mengikuti diterima' : 'Permintaan mengikuti ditolak', 'Permintaan Ikuti');
        refreshNuxtData('notifications-data');
    } catch (err) {
        toast.error(err.statusMessage || 'Gagal memproses permintaan', 'Gagal');
    }
}
</script>

<template>
    <div class="max-w-2xl mx-auto py-4">
        <div class="flex items-center justify-between border-b border-purple-800/50 pb-4 mb-6">
            <div>
                <h1 class="text-xl font-bold font-orbitron text-white tracking-wider glow-text-purple">
                    NOTIFICATIONS
                </h1>
                <p class="text-purple-300 text-[10px] font-mono tracking-widest mt-0.5">PANTAU AKTIVITAS TEMAN MU</p>
            </div>
            <span v-if="notifications?.filter(n => !n.isRead).length > 0"
                class="bg-purple-900/200/10 text-purple-600 border border-purple-500/20 text-[10px] font-mono px-3 py-1 rounded-full animate-pulse shadow-[0_0_8px_rgba(2,132,199,0.1)]">
                {{notifications?.filter(n => !n.isRead).length}} NOTIFIKASI BARU
            </span>
        </div>

        <div v-if="notifications?.length" class="space-y-4">
            <div v-for="notif in notifications" :key="notif._id" @click="markAsRead(notif)" :class="[
                'cyber-panel relative overflow-hidden transition-all duration-300 cursor-pointer rounded-2xl p-4 flex gap-4 border',
                notif.isRead
                    ? 'bg-[#1a0b2e]/80 backdrop-blur-md/40 border-purple-800/50/50 opacity-60 hover:opacity-100'
                    : 'bg-[#1a0b2e]/80 backdrop-blur-md border-purple-500/20 shadow-[0_0_10px_rgba(2,132,199,0.06)]'
            ]">

                <!-- Unread Indicator Dot -->
                <span v-if="!notif.isRead"
                    class="absolute top-4 right-4 w-2.5 h-2.5 bg-purple-900/200 rounded-full shadow-[0_0_6px_rgba(2,132,199,0.6)] animate-pulse"></span>

                <!-- Icon Background -->
                <div
                    :class="['flex-shrink-0 w-12 h-12 rounded-xl border border-purple-800/40 flex items-center justify-center bg-purple-900/20 shadow-inner', getIconColor(notif.type)]">
                    <i :class="['bi', getIcon(notif.type), 'text-lg']"></i>
                </div>

                <!-- Content -->
                <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                        <img v-if="notif.sender?.photo" :src="notif.sender.photo"
                            class="w-5 h-5 rounded-full object-cover aspect-square border border-purple-800/50" alt="">
                        <span class="font-bold text-white text-xs">
                            {{ notif.sender?.username || 'Seseorang' }}
                        </span>
                        <span
                            class="font-mono text-[9px] text-purple-300 bg-purple-900/30 border border-purple-800/50/50 px-1.5 py-0.5 rounded">•
                            {{ formatDate(notif.createdAt) }}</span>
                    </div>
                    <p class="text-xs text-purple-200 leading-relaxed font-mono">
                        <span class="font-bold text-purple-600">@{{ notif.sender?.username }}</span>
                        {{ notif.message }}
                    </p>

                    <!-- Balasan / Komentar -->
                    <div v-if="notif.commentText && notif.type == 'comment'"
                        class="mt-3 px-3.5 py-2.5 bg-purple-900/30 border-l-2 border-fuchsia-500 rounded-r-xl text-xs text-purple-100 font-mono leading-relaxed shadow-sm">
                        <div class="flex items-center gap-1.5 text-[10px] font-orbitron text-fuchsia-400 mb-1">
                            <i class="bi bi-chat-dots-fill"></i>
                            <span>KOMENTAR BALASAN:</span>
                        </div>
                        <div v-html="DOMPurify.sanitize(notif.commentText)"></div>
                    </div>

                    <!-- Referenced Yappingan Card -->
                    <div v-if="notif.type == 'repost' || notif.type == 'comment' || notif.type == 'like'"
                        class="mt-3 relative group overflow-hidden rounded-xl bg-[#130722]/80 backdrop-blur-md border border-purple-500/30 hover:border-purple-400/70 transition-all duration-300 shadow-inner hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                        <!-- Left Neon Accent Bar -->
                        <div
                            class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 via-fuchsia-500 to-indigo-500 group-hover:w-1.5 transition-all duration-300">
                        </div>

                        <!-- Decorative Watermark Icon -->
                        <i
                            class="bi bi-quote absolute -bottom-3 -right-2 text-5xl text-purple-500/5 pointer-events-none select-none"></i>

                        <ClientOnly>
                            <NuxtLink :to="`/twit/${notif.twitId}`" class="block p-3.5 pl-4 relative z-10">
                                <!-- Top Bar -->
                                <div class="flex items-center justify-between gap-2 mb-2">
                                    <div class="flex items-center gap-1.5">
                                        <div
                                            class="w-5 h-5 rounded-md bg-purple-900/40 border border-purple-700/50 flex items-center justify-center text-purple-400">
                                            <i class="bi bi-quote text-xs"></i>
                                        </div>
                                        <span
                                            class="text-[10px] font-orbitron font-bold tracking-widest text-purple-300 uppercase">
                                            Yappingan
                                        </span>
                                    </div>
                                    <span
                                        class="text-[10px] font-mono text-purple-400/70 group-hover:text-purple-300 flex items-center gap-1 transition-colors">
                                        <span>Buka</span>
                                        <i
                                            class="bi bi-arrow-up-right text-[10px] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"></i>
                                    </span>
                                </div>

                                <!-- Text Content -->
                                <p class="text-xs text-purple-100/90 leading-relaxed font-mono pl-1 line-clamp-3 group-hover:text-white transition-colors"
                                    v-html="DOMPurify.sanitize(notif.twitText || '')">
                                </p>
                            </NuxtLink>
                        </ClientOnly>
                    </div>

                    <!-- Action Buttons for Follow Request -->
                    <div v-if="notif.type === 'follow_request'" class="flex gap-2 mt-3">
                        <button @click.stop="handleRequest(notif, 'accept')"
                            class="px-4 py-1.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-lg text-[10px] font-orbitron font-bold tracking-widest transition-colors shadow-[0_0_10px_rgba(236,72,153,0.3)]">TERIMA</button>
                        <button @click.stop="handleRequest(notif, 'reject')"
                            class="px-4 py-1.5 bg-purple-900/50 hover:bg-purple-800/50 text-purple-300 border border-purple-800/50 rounded-lg text-[10px] font-orbitron font-bold tracking-widest transition-colors">TOLAK</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else
            class="flex flex-col items-center justify-center py-20 text-center bg-[#1a0b2e]/80 backdrop-blur-md/40 rounded-3xl border border-purple-800/40">
            <div
                class="w-16 h-16 bg-purple-900/20 border border-purple-800/40 rounded-2xl flex items-center justify-center mb-4 text-purple-400 shadow-inner">
                <i class="bi bi-bell-slash-fill text-3xl animate-pulse"></i>
            </div>
            <h2 class="font-orbitron font-bold text-purple-100 text-sm tracking-wider">BELUM ADA NOTIFIKASI</h2>
        </div>
    </div>
</template>

<style scoped>
.ring-1 {
    --tw-ring-inset: var(--tw-empty,
            /*!*/
            /*!*/
        );
    --tw-ring-offset-width: 0px;
    --tw-ring-offset-color: #fff;
    --tw-ring-color: rgb(147 51 234 / 0.1);
    --tw-ring-offset-shadow: var(--tw-ring-inset) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);
    --tw-ring-shadow: var(--tw-ring-inset) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color);
    box-shadow: var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow, 0 0 #0000);
}
</style>
<script setup>
import { useAuth } from '~/stores/Auth';
import { getIcon, getIconColor } from '~/utils/notifIcon';
import { formatDate } from '~/utils/formatDate';
import DOMPurify from 'dompurify';

const { $csrfFetch } = useNuxtApp();
const auth = useAuth();

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
        refreshNuxtData('notifications-data');
    } catch (err) {
        alert(err.statusMessage || 'Gagal memproses permintaan');
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
                    <Icon :name="getIcon(notif.type)" size="20" />
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

                    <div v-if="notif.commentText && notif.type == 'comment'"
                        class="text-xs text-purple-200 leading-relaxed font-mono mt-3" v-html="DOMPurify.sanitize(notif.commentText)">
                    </div>

                    <p class="text-md font-bold text-purple-400 leading-relaxed font-mono mt-4">Yappingan</p>
                    <div v-if="notif.type == 'repost' || notif.type == 'comment' || notif.type == 'like'"
                        class="border-2 border-purple-800/50/50 rounded-lg p-2 mt-2">
                        <ClientOnly>
                            <NuxtLink :to="`/twit/${notif.twitId}`" class="block mt-2">
                                <p class="text-xs text-purple-200 leading-relaxed font-mono" v-html="DOMPurify.sanitize(notif.twitText)">
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
                <Icon name="ph:bell-slash-light" size="32" class="animate-pulse" />
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
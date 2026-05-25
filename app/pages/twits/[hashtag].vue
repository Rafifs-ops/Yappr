<script setup>
import { useAuth } from '../../stores/Auth';
const auth = useAuth();
const { $csrfFetch } = useNuxtApp();
const route = useRoute();
const hashtag = route.params.hashtag;

// Ambil data menggunakan useFetch
const { data: fetchedTwits, pending, error } = await useFetch(`/api/twits/hashtag/${hashtag}`);

// Buat state lokal yang 100% reaktif dan bisa kita modifikasi sesuka hati
const twits = ref([]);

// Sinkronkan data dari fetchedTwits ke state lokal 'twits'
watch(fetchedTwits, (newData) => {
    if (newData) {
        // Kita "clone" datanya untuk melepaskan ikatan dari sistem cache Nuxt
        // Ini memastikan Vue mendeteksi setiap perubahan kecil di dalamnya
        twits.value = JSON.parse(JSON.stringify(newData));
    }
}, { immediate: true }); // immediate: true penting agar data langsung terisi saat halaman dimuat


// Ubah parameter fungsi untuk menerima ID, bukan seluruh objek
async function toggleLike(twitId) {
    // Cari index twit yang diklik di dalam state lokal kita
    const index = twits.value.findIndex(t => t._id === twitId);
    if (index === -1) return;

    // Ambil referensi target twit
    const targetTwit = twits.value[index];
    const previousIsLiked = targetTwit.isLiked;

    // OPTIMISTIC UPDATE: Karena ini state lokal, UI akan LANGSUNG BERUBAH
    targetTwit.isLiked = !targetTwit.isLiked;
    targetTwit.isLiked ? targetTwit.likesCount++ : targetTwit.likesCount--;

    try {
        const endpoint = previousIsLiked ? '/api/like/remove' : '/api/like/add';

        await $csrfFetch(endpoint, {
            method: 'POST',
            body: {
                twitId: targetTwit._id
            }
        });

    } catch (err) {
        // ROLLBACK jika internet putus / API error
        targetTwit.isLiked = previousIsLiked;
        targetTwit.isLiked ? targetTwit.likesCount++ : targetTwit.likesCount--;

        alert(err.statusMessage || 'Gagal mengubah status like');
    }
}

async function toggleRepost(twitId) {
    // Cari index twit yang diklik di dalam state lokal kita
    const index = twits.value.findIndex(t => t._id === twitId);
    if (index === -1) return;

    // Ambil referensi target twit
    const targetTwit = twits.value[index];
    const previousIsReposted = targetTwit.isReposted;

    // OPTIMISTIC UPDATE: Karena ini state lokal, UI akan LANGSUNG BERUBAH
    targetTwit.isReposted = !targetTwit.isReposted;
    targetTwit.isReposted ? targetTwit.repostCount++ : targetTwit.repostCount--;

    try {
        const endpoint = previousIsReposted ? '/api/repost/remove' : '/api/repost/add';

        await $csrfFetch(endpoint, {
            method: 'POST',
            body: {
                twitId: targetTwit._id
            }
        });

    } catch (err) {
        // ROLLBACK jika internet putus / API error
        targetTwit.isReposted = previousIsReposted;
        targetTwit.isReposted ? targetTwit.repostCount++ : targetTwit.repostCount--;

        alert(err.statusMessage || 'Gagal mengubah status like');
    }
}

async function deleteTwit(twitId) {
    try {
        await $csrfFetch('/api/twits', {
            method: 'DELETE',
            body: {
                twitId: twitId
            }
        });

        // Remove twit from local state
        twits.value = twits.value.filter(t => t._id !== twitId);
    } catch (err) {
        alert(err.statusMessage || 'Gagal menghapus twit');
    }
}
</script>

<template>
    <main class="w-full">
        <div v-if="pending" class="text-center p-8 text-purple-600 font-orbitron animate-pulse">
            <Icon name="svg-spinners:ring-resize" class="w-8 h-8 mx-auto mb-2" />
            DOWNLINKING FEED...
        </div>
        <div v-else-if="error" class="text-center p-8 text-rose-600 font-orbitron">
            <Icon name="streamline-ultimate:alert-triangle-bold" class="w-8 h-8 mx-auto mb-2 animate-bounce" />
            FEED DOWNLINK FAILURE
        </div>

        <div v-else-if="!twits?.length && !id"
            class="text-center font-orbitron font-bold text-sm p-12 text-purple-400 bg-purple-900/30/30 rounded-2xl border border-purple-800/50/50 max-w-xl mx-auto shadow-inner">
            <Icon name="ph:circle-dashed" class="w-12 h-12 mx-auto mb-3 text-purple-400 animate-spin" />
            NO DATA TRANSMISSIONS FOUND IN THE GRID
        </div>

        <div v-else-if="!twits?.length && id"
            class="text-center font-orbitron font-bold text-sm p-12 text-purple-400 bg-purple-900/30/30 rounded-2xl border border-purple-800/50/50 max-w-xl mx-auto shadow-inner">
            <Icon name="ph:user-focus" class="w-12 h-12 mx-auto mb-3 text-purple-400" />
            THIS PROFILE HAS NO LOGGED TRANSMISSIONS
        </div>

        <div v-else class="flex flex-col gap-4 w-full">
            <div v-for="twit in twits" :key="twit._id"
                class="cyber-panel p-5 rounded-2xl w-full max-w-xl mx-auto flex flex-col relative overflow-hidden group">
                <!-- Glowing corner accent -->
                <div class="absolute top-0 right-0 w-16 h-[1px] bg-gradient-to-l from-purple-400 to-transparent"></div>
                <div class="absolute top-0 right-0 h-16 w-[1px] bg-gradient-to-b from-purple-400 to-transparent"></div>

                <div class="flex items-start justify-between gap-3 mb-3">
                    <NuxtLink :to="`/profile/${twit.user?._id}`" class="flex items-center gap-3 group/user">
                        <div
                            class="p-0.5 rounded-full bg-gradient-to-tr from-fuchsia-500 to-purple-400 shadow-[0_0_8px_rgba(2,132,199,0.1)] group-hover/user:shadow-[0_0_12px_rgba(2,132,199,0.25)] transition-all duration-300">
                            <img :src="twit.user?.photo" alt="Avatar"
                                class="rounded-full w-10 h-10 object-cover aspect-square border border-white">
                        </div>
                        <div class="flex flex-col">
                            <h2
                                class="font-bold text-white group-hover/user:text-purple-600 transition-colors duration-200 text-sm tracking-wide">
                                {{ twit.user?.username || 'unknown_node' }}
                            </h2>
                            <span
                                class="font-mono text-[9px] tracking-wider text-purple-300 bg-purple-900/30 border border-purple-800/50/50 px-2 py-0.5 rounded mt-1">
                                {{ new Date(twit.createdAt).toLocaleString('id-ID', { hour12: false }) }}
                            </span>
                        </div>
                    </NuxtLink>

                    <button v-if="twit.user?._id === auth.session?.id" @click="deleteTwit(twit._id)"
                        class="text-purple-400 hover:text-rose-500 hover:shadow-[0_0_8px_rgba(244,63,94,0.1)] p-1.5 rounded-lg bg-purple-900/30 border border-purple-800/50/50 transition-all">
                        <Icon name="streamline-ultimate:bin-1-bold" class="w-4 h-4" />
                    </button>
                </div>

                <!-- SubTwit / Reply Target Link -->
                <div v-if="twit.SubTwit?.isSubTwit" class="mb-3">
                    <span
                        class="inline-flex items-center gap-1.5 font-mono text-[10px] text-purple-700 bg-purple-900/20 px-2.5 py-1 rounded border border-purple-700/50">
                        <Icon name="ph:arrow-bend-down-right" class="w-3.5 h-3.5" />
                        Reply to <NuxtLink :to="`/twit/${twit?.SubTwit?.reference?._id}`"
                            class="font-bold text-purple-600 hover:underline hover:text-purple-800">@{{
                                twit?.SubTwit?.reference?.user?.username }}</NuxtLink>
                    </span>
                </div>

                <!-- Twit Body Content -->
                <div class="text-white text-sm mt-1 twit-content leading-relaxed" v-html="twit.text"></div>

                <div v-if="twit.hashtags?.length" class="flex flex-wrap gap-2 mt-2">
                    <NuxtLink v-for="(hashtag, idx) in twit.hashtags" :key="idx" :to="`/twits/${hashtag}`"
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-800/40 bg-purple-900/30 text-purple-300 hover:border-purple-300 hover:text-purple-600 text-xs font-mono transition-all duration-300">
                        <span>#{{ hashtag }}</span>
                    </NuxtLink>
                </div>

                <!-- Twit Attachment Image -->
                <div v-if="twit.image"
                    class="mt-4 relative group/img rounded-xl overflow-hidden border border-purple-800/50 shadow-sm">
                    <img :src="twit.image" alt="Transmission Attachment"
                        class="w-full h-auto object-cover max-h-96 transition-transform duration-500 group-hover/img:scale-[1.02]" />
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-100/10 to-transparent pointer-events-none">
                    </div>
                </div>

                <!-- Interactive Stats Bar -->
                <div class="mt-5 flex justify-between items-center border-t border-purple-800/40 pt-3">
                    <button @click="toggleLike(twit._id)"
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono select-none transition-all duration-300"
                        :class="twit.isLiked
                            ? 'text-rose-600 bg-rose-50 border-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.08)]'
                            : 'text-purple-300 bg-purple-900/30 border-purple-800/40 hover:border-rose-400 hover:text-rose-600'">
                        <Icon name="streamline-ultimate:like-bold"
                            :class="{ 'animate-ping absolute w-4 h-4 text-rose-500 opacity-20': twit.isLiked }" />
                        <Icon name="streamline-ultimate:like-bold" />
                        <span>{{ twit.likesCount }}</span>
                    </button>

                    <button @click="toggleRepost(twit._id)"
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono select-none transition-all duration-300"
                        :class="twit.isReposted
                            ? 'text-purple-600 bg-purple-900/20 border-purple-700/50 shadow-[0_0_10px_rgba(2,132,199,0.08)]'
                            : 'text-purple-300 bg-purple-900/30 border-purple-800/40 hover:border-purple-400 hover:text-purple-600'">
                        <Icon name="streamline-ultimate:switch-account-1-bold" />
                        <span>{{ twit.repostCount }}</span>
                    </button>

                    <NuxtLink :to="`/twit/${twit._id}`"
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-800/40 bg-purple-900/30 text-purple-300 hover:border-purple-300 hover:text-purple-600 text-xs font-mono transition-all duration-300">
                        <Icon name="streamline-ultimate:messages-bubble-square-typing-bold" />
                        <span>{{ twit.commentCount || 0 }}</span>
                    </NuxtLink>
                </div>
            </div>
        </div>
    </main>
</template>

<style scoped>
.twit-content :deep(ul) {
    list-style-type: disc;
    padding-left: 1.5rem;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
}

.twit-content :deep(ol) {
    list-style-type: decimal;
    padding-left: 1.5rem;
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
}

.twit-content :deep(li) {
    margin-bottom: 0.25rem;
}

.twit-content :deep(a) {
    color: #93c5fd;
    /* blue-300 */
    text-decoration: underline;
    transition: color 0.2s;
}

.twit-content :deep(a:hover) {
    color: #bfdbfe;
    /* blue-200 */
}

.twit-content :deep(h1) {
    font-size: 1.5rem;
    font-weight: 700;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    color: white;
}

.twit-content :deep(h2) {
    font-size: 1.25rem;
    font-weight: 700;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    color: white;
}

.twit-content :deep(h3) {
    font-size: 1.125rem;
    font-weight: 700;
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    color: white;
}

.twit-content :deep(p) {
    margin-bottom: 0.5rem;
}

.twit-content :deep(p:last-child) {
    margin-bottom: 0;
}

.twit-content :deep(strong) {
    font-weight: 700;
    color: white;
}

.twit-content :deep(em) {
    font-style: italic;
}

.twit-content :deep(u) {
    text-decoration: underline;
}

.twit-content :deep(s) {
    text-decoration: line-through;
}
</style>
<script setup>
import { useAuth } from '../../stores/Auth';
import DOMPurify from 'isomorphic-dompurify';
const auth = useAuth();

const { $csrfFetch } = useNuxtApp();
definePageMeta({
    layout: 'default'
})

const twitId = useRoute().params.id;

const { data: fetchedData, pending, error, refresh } = await useAsyncData(`comment-page-${twitId}`, async () => {
    const fetchWithHeaders = useRequestFetch();
    const [twitData, commentsData] = await Promise.all([ // Menjalankan beberapa fungsi asinkron dalam satu waktu/paralel
        fetchWithHeaders(`/api/twits/${twitId}`), // output akan disimpan di variable twitData
        fetchWithHeaders(`/api/twits/subTwit/${twitId}`) // output akan disimpan di variable commentsData
    ]);
    return { response: twitData, comments: commentsData };
});

if (fetchedData.value?.response) {
    const twit = fetchedData.value.response;

    // Hilangkan tag HTML dari konten twit (karena twit.text pakai v-html)
    const plainText = twit.text ? twit.text.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...' : 'Lihat twit ini di Yappr';

    // Dapatkan origin URL (misal: https://yappr.com) secara dinamis baik di Server maupun Client
    const baseUrl = useRequestURL().origin;

    useSeoMeta({
        title: `${twit.user?.username} di Yappr`,
        ogTitle: `${twit.user?.username} memposting di Yappr`,
        description: plainText,
        ogDescription: plainText,
        // Jika ada attachment gambar, gunakan itu. Jika tidak, gunakan avatar user
        ogImage: twit.image || twit.user?.photo || `${baseUrl}/images/brand-yappr.png`,
        ogUrl: `${baseUrl}/twit/${twit._id}`,
        twitterCard: twit.image ? 'summary_large_image' : 'summary',
    });
}

// Buat state lokal yang 100% reaktif dan bisa dimodifikasi untuk optimistic update
const data = ref(null);
watch(fetchedData, (newData) => {
    if (newData) {
        // "Clone" data untuk melepaskan ikatan cache Nuxt sehingga Vue mendeteksi setiap perubahan
        data.value = JSON.parse(JSON.stringify(newData));
    }
}, { immediate: true });

async function toggleLike() {
    const targetTwit = data.value.response;
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

const deleteMainTwit = async () => {
    if (!confirm('Apakah anda yakin ingin menghapus twit ini?')) return;
    try {
        await $csrfFetch('/api/twits', {
            method: 'DELETE',
            body: { twitId: data.value.response._id }
        });
        navigateTo('/');
    } catch (e) {
        alert(e.statusMessage || 'Gagal menghapus twit');
    }
};
</script>

<template>
    <main class="w-full max-w-xl mx-auto py-4">
        <div v-if="pending" class="text-center p-8 text-purple-600 font-orbitron animate-pulse">
            <Icon name="svg-spinners:ring-resize" class="w-8 h-8 mx-auto mb-2" />
            SEDANG MEMUAT TWIT...
        </div>
        <div v-else-if="error"
            class="p-4 bg-rose-500/5 border border-rose-500/20 text-rose-600 rounded-2xl m-4 font-mono text-xs text-center">
            TERJADI KESALAHAN...
        </div>
        <div v-else-if="data?.response"
            class="cyber-panel p-5 rounded-2xl w-full flex flex-col relative overflow-hidden bg-[#1a0b2e]/80 backdrop-blur-md/75 border border-purple-800/50/80 space-y-4">

            <!-- Sci-Fi corner tags -->
            <div class="absolute top-0 left-0 w-12 h-[1px] bg-gradient-to-r from-purple-400 to-transparent"></div>
            <div class="absolute top-0 left-0 h-12 w-[1px] bg-gradient-to-b from-purple-400 to-transparent"></div>

            <!--Twit Header-->
            <div v-if="data.response.SubTwit?.isSubTwit" class="mb-1">
                <span
                    class="inline-flex items-center gap-1.5 font-mono text-[10px] text-purple-700 bg-purple-900/20 px-2.5 py-1 rounded border border-purple-700/50">
                    <Icon name="ph:arrow-bend-down-right" class="w-3.5 h-3.5" />
                    Reply to <NuxtLink :to="`/twit/${data.response?.SubTwit?.reference?._id}`"
                        class="font-bold text-purple-600 hover:underline">@{{
                            data.response?.SubTwit?.reference?.user?.username }}</NuxtLink>
                </span>
            </div>

            <div class="mb-1">
                <div class="flex justify-between items-start">
                    <NuxtLink :to="`/profile/${data.response?.user?._id}`" class="flex items-center gap-3 group/user">
                        <div
                            class="p-0.5 rounded-full bg-gradient-to-tr from-fuchsia-500 to-purple-400 shadow-[0_0_8px_rgba(2,132,199,0.1)] group-hover/user:shadow-[0_0_12px_rgba(2,132,199,0.25)] transition-all duration-300">
                            <img :src="data.response?.user?.photo" alt="Avatar"
                                class="rounded-full w-10 h-10 object-cover aspect-square border border-white">
                        </div>
                        <div class="flex flex-col">
                            <h2
                                class="font-bold text-white group-hover/user:text-purple-600 transition-colors duration-200 text-sm tracking-wide">
                                {{ data.response?.user?.username || 'unknown_node' }}
                            </h2>
                            <span
                                class="font-mono text-[9px] tracking-wider text-purple-300 bg-purple-900/30 border border-purple-800/50/50 px-2 py-0.5 rounded mt-1 w-fit">
                                {{ new Date(data.response?.createdAt).toLocaleString('id-ID', { hour12: false }) }}
                            </span>
                        </div>
                    </NuxtLink>

                    <button v-if="data.response?.user?._id === auth.session?.id" @click="deleteMainTwit"
                        class="text-purple-400 hover:text-rose-500 hover:shadow-[0_0_8px_rgba(244,63,94,0.1)] p-1.5 rounded-lg bg-purple-900/30 border border-purple-800/50/50 transition-all">
                        <Icon name="streamline-ultimate:bin-1-bold" class="w-4 h-4" />
                    </button>
                </div>

                <div class="text-white text-sm mt-3 twit-content leading-relaxed" v-html="DOMPurify.sanitize(data.response?.text)">
                </div>
                <div class="flex flex-wrap gap-2 mt-2" v-if="data.response.hashtags?.length">
                    <NuxtLink :to="`/twits/${hashtag}`" v-for="hashtag in data.response.hashtags"
                        class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-800/40 bg-purple-900/30 text-purple-300 hover:border-purple-300 hover:text-purple-600 text-xs font-mono transition-all duration-300">
                        <span>#{{ hashtag }}</span>
                    </NuxtLink>
                </div>

                <div v-if="data.response?.image"
                    class="mt-4 relative group/img rounded-xl overflow-hidden border border-purple-800/50 shadow-sm">
                    <img :src="data.response.image" alt="Transmission Attachment"
                        class="w-full h-auto object-cover max-h-96" />
                    <div class="absolute inset-0 bg-gradient-to-t from-slate-100/10 to-transparent pointer-events-none">
                    </div>
                </div>

                <div class="mt-5 flex justify-between items-center border-t border-purple-800/40 pt-3">
                    <button @click="toggleLike()"
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono select-none transition-all duration-300"
                        :class="data.response.isLiked
                            ? 'text-rose-600 bg-rose-50 border-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.08)]'
                            : 'text-purple-300 bg-purple-900/30 border-purple-800/40 hover:border-rose-400 hover:text-rose-600'">
                        <Icon name="streamline-ultimate:like-bold" />
                        <span>{{ data.response.likesCount }}</span>
                    </button>

                    <div
                        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-800/40 bg-purple-900/30 text-purple-300 text-xs font-mono">
                        <Icon name="streamline-ultimate:messages-bubble-square-typing-bold" />
                        <span>{{ data.response.commentCount || 0 }}</span>
                    </div>
                </div>
            </div>

            <CommentsView :comments="data.comments" :twitId="twitId" @refresh="refresh" />
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
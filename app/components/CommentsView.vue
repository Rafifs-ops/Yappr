<script setup>
import { useAuth } from '../stores/Auth';
const auth = useAuth();
const { $csrfFetch } = useNuxtApp();
const props = defineProps(['twitId', 'comments']);

const newComment = ref('');
const isSubmitting = ref(false);
const submitComment = async () => {
    if (!newComment.value.trim()) return;

    isSubmitting.value = true;

    try {
        await $csrfFetch('/api/twits', {
            method: 'POST',
            body: { twitId: props.twitId, text: newComment.value }
        });

        newComment.value = '';
        await refresh(); // Memuat ulang daftar komentar
    } catch (e) {
        alert(e.statusMessage);
        return
    } finally {
        isSubmitting.value = false;
    }
};

const deleteComment = async (commentId) => {
    try {
        await $csrfFetch('/api/twits', {
            method: 'DELETE',
            body: { twitId: commentId }
        });
        await refresh();
    } catch (e) {
        alert(e.statusMessage || 'Gagal menghapus komentar');
    }
};

async function toggleLike(twitId) {

    // Cari index twit yang diklik di dalam state lokal kita
    const index = props.comments.findIndex(t => t._id === twitId);
    if (index === -1) return;
    const targetTwit = props.comments[index];

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
</script>

<template>
    <!--Form Kirim Komentar-->
    <div class="flex flex-col gap-2.5 mt-4 pt-2 border-t border-purple-800/40">
        <ClientOnly>
            <TiptapEditor v-model="newComment" />
        </ClientOnly>
        <button @click="submitComment" :disabled="isSubmitting"
            class="btn-neon-purple font-orbitron font-bold py-2.5 px-6 rounded-xl transition duration-300 shadow-lg tracking-widest text-[10px] self-end w-32 disabled:opacity-50">
            {{ isSubmitting ? 'MENGIRIM...' : 'KIRIM' }}
        </button>
    </div>

    <div class="border-b border-purple-800/50 pb-2 pt-4">
        <span class="font-orbitron text-[10px] font-bold text-purple-300 tracking-widest">BALASAN</span>
    </div>

    <!--Comments List-->
    <div v-if="props.comments && props.comments.length">
        <div v-for="comment in props.comments" :key="comment._id"
            class="bg-purple-900/20/50 p-4 rounded-xl border border-purple-800/40 relative overflow-hidden group/comment">

            <div class="absolute top-0 right-0 w-12 h-[1px] bg-gradient-to-l from-violet-500/20 to-transparent">
            </div>

            <!--Header Comment-->
            <div class="flex justify-between items-start mb-2">
                <div class="flex flex-col">
                    <h2 class="font-bold text-purple-600 font-orbitron text-xs tracking-wide">@{{
                        comment.user?.username }}</h2>
                    <span class="font-mono text-[8px] text-purple-300 mt-1">
                        {{ new Date(comment.createdAt).toLocaleString('id-ID', { hour12: false }) }}
                    </span>
                </div>
                <button v-if="comment.user?._id === auth.session?.id" @click="deleteComment(comment._id)"
                    class="text-purple-400 hover:text-rose-500 hover:shadow-[0_0_8px_rgba(244,63,94,0.1)] p-1 rounded-lg bg-purple-900/30/50 border border-purple-800/50/50 transition-all">
                    <Icon name="streamline-ultimate:bin-1-bold" class="w-3.5 h-3.5" />
                </button>
            </div>

            <div class="twit-content">
                <div v-html="comment.text"></div>
            </div>

            <div class="mt-4 flex justify-between border-t border-purple-800/40 pt-2">
                <button @click="toggleLike(comment._id)"
                    class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-mono select-none transition-all duration-300"
                    :class="comment.isLiked
                        ? 'text-rose-600 bg-rose-50 border-rose-200 shadow-[0_0_8px_rgba(244,63,94,0.06)]'
                        : 'text-slate-505 bg-purple-900/30 border-purple-800/40 hover:border-rose-400 hover:text-rose-600'">
                    <Icon name="streamline-ultimate:like-bold" />
                    <span>{{ comment.likesCount }}</span>
                </button>

                <NuxtLink :to="`/twit/${comment._id}`"
                    class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-purple-800/40 bg-purple-900/30 text-purple-300 hover:border-purple-300 hover:text-purple-600 text-[10px] font-mono transition-all duration-300">
                    <Icon name="streamline-ultimate:messages-bubble-square-typing-bold" />
                    <span>{{ comment.commentCount || 0 }}</span>
                </NuxtLink>
            </div>
        </div>
    </div>
    <p v-else class="text-purple-300 text-xs italic font-mono pl-1 py-4">Belum ada komentar...
    </p>
</template>
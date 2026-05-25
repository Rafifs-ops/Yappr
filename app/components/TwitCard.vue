<script setup>
/**
 * A reusable component for displaying a single Twit, including its
 * content, media, and interactive action buttons.
 */
const props = defineProps({
    /** The individual twit object */
    twit: {
        type: Object,
        required: true
    },
    /** The ID of the currently logged in user (used to show/hide delete button) */
    currentUserId: {
        type: String,
        default: null
    }
});

const emit = defineEmits(['toggleLike', 'toggleRepost', 'deleteTwit']);
</script>

<template>
    <div class="cyber-panel p-5 rounded-2xl w-full max-w-xl mx-auto flex flex-col relative overflow-hidden group">
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

            <button v-if="twit.user?._id === currentUserId" @click="emit('deleteTwit', twit._id)"
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

        <!-- Twit Attachment Image/Video -->
        <div v-if="twit.image"
            class="mt-4 relative group/img rounded-xl overflow-hidden border border-purple-800/50 shadow-sm">
            <img :src="twit.image" alt="Transmission Attachment"
                class="w-full h-auto object-cover max-h-96 transition-transform duration-500 group-hover/img:scale-[1.02]" />
            <div class="absolute inset-0 bg-gradient-to-t from-slate-100/10 to-transparent pointer-events-none">
            </div>
        </div>
        <div v-if="twit.video"
            class="mt-4 relative group/vid rounded-xl overflow-hidden border border-purple-800/50 shadow-sm">
            <video :src="twit.video" controls preload="metadata"
                class="w-full h-auto max-h-[500px] object-cover bg-black/20">
            </video>
        </div>


        <!-- Interactive Stats Bar -->
        <div class="mt-5 flex justify-between items-center border-t border-purple-800/40 pt-3">
            <button @click="emit('toggleLike', twit._id)"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono select-none transition-all duration-300"
                :class="twit.isLiked
                    ? 'text-rose-600 bg-rose-50 border-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.08)]'
                    : 'text-purple-300 bg-purple-900/30 border-purple-800/40 hover:border-rose-400 hover:text-rose-600'">
                <Icon name="streamline-ultimate:like-bold"
                    :class="{ 'animate-ping absolute w-4 h-4 text-rose-500 opacity-20': twit.isLiked }" />
                <Icon name="streamline-ultimate:like-bold" />
                <span>{{ twit.likesCount }}</span>
            </button>

            <button @click="emit('toggleRepost', twit._id)"
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
    text-decoration: underline;
    transition: color 0.2s;
}

.twit-content :deep(a:hover) {
    color: #bfdbfe;
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

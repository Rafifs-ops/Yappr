<script setup>
definePageMeta({
    layout: 'default'
})

useHead({
    title: 'Cari Teman - RTwit',
    meta: [
        { name: 'description', content: 'Cari teman Anda di RTwit' }
    ]
})

// Fetch profil user
const { data: profiles, pending, error } = await useFetch('/api/user');

// Fetch trending hashtags
const { data: trendingHashtags, pending: pendingHashtags } = await useFetch('/api/hashtags/trending');

const query = ref('');

const dataProfile = computed(() => {
    // Jika profiles.value masih null/undefined, kembalikan array kosong
    if (!profiles.value) return [];

    // Filter data berdasarkan username (case-insensitive)
    const searchTerm = query.value.toLowerCase();
    return profiles.value.filter(profile =>
        profile.username.toLowerCase().includes(searchTerm)
    );
});
</script>

<template>
    <main class="w-full max-w-xl mx-auto py-4">
        <div v-if="pending" class="text-center p-8 text-purple-600 font-orbitron animate-pulse">
            <Icon name="svg-spinners:ring-resize" class="w-8 h-8 mx-auto mb-2" />
            SEDANG MENCARI...
        </div>

        <div v-else-if="error"
            class="p-4 bg-rose-500/5 border border-rose-500/20 text-rose-600 rounded-2xl m-4 font-mono text-xs text-center">
            TERJADI ERROR: {{ error.statusMessage || 'TERJADI KESALAHAN' }} [Code: {{ error.status }}]
        </div>

        <div v-else
            class="cyber-panel p-3.5 rounded-2xl border border-purple-800/50/80 flex items-center gap-3 bg-[#1a0b2e]/80 backdrop-blur-md/75 mb-6 group">
            <div class="text-purple-600 pl-2">
                <Icon name="ph:radardecals-bold" class="w-5 h-5 animate-spin" style="animation-duration: 4s" />
            </div>
            <input type="text"
                class="bg-[#1a0b2e]/80 backdrop-blur-md border border-purple-800/50 text-white placeholder-purple-400/70 rounded-xl px-4 py-2.5 focus:outline-none w-full focus:border-purple-400 focus:shadow-[0_0_12px_rgba(2,132,199,0.12)] transition-all duration-300 font-mono text-sm"
                placeholder="CARI USERNAME..." v-model="query">
        </div>

        <div v-if="!query" class="text-center py-8">
            <div class="relative mx-auto mb-8 flex flex-col items-center justify-center">
                <h1 class="font-orbitron font-bold text-purple-100 tracking-wider text-sm">
                    CARI TEMAN BARU....
                </h1>
                <p class="text-purple-300 text-[10px] font-mono tracking-widest mt-1">Cari temanmu dan yapping bareng
                </p>
            </div>

            <div class="mt-8 border-t border-purple-800/30 pt-6">
                <h2
                    class="font-orbitron text-purple-400 text-xs tracking-[0.2em] mb-4 flex items-center justify-center gap-2">
                    <Icon name="ph:trend-up-bold" class="w-4 h-4" /> TRENDING MINGGU INI
                </h2>

                <div v-if="pendingHashtags" class="flex justify-center mt-4">
                    <Icon name="svg-spinners:3-dots-fade" class="w-6 h-6 text-purple-600" />
                </div>

                <div v-else-if="trendingHashtags && trendingHashtags.length > 0"
                    class="flex flex-wrap gap-2 justify-center px-4">
                    <NuxtLink v-for="item in trendingHashtags" :key="item.hashtag" :to="`/twits/${item.hashtag}`"
                        class="px-3 py-1.5 rounded-lg border border-purple-500/30 bg-purple-900/20 text-purple-200 text-xs font-mono hover:bg-purple-800/50 hover:border-purple-400 transition-all cursor-pointer flex items-center gap-1">
                        <span class="text-purple-400">#</span>{{ item.hashtag }}
                        <span class="text-[9px] text-purple-500 ml-1 bg-purple-950 px-1.5 rounded-full">{{ item.count
                        }}</span>
                    </NuxtLink>
                </div>

                <div v-else class="text-purple-500/50 text-xs font-mono">
                    Belum ada hashtag trending saat ini.
                </div>
            </div>
        </div>

        <ProfileCards v-else-if="!pending && !error" :dataProfile="dataProfile" />
    </main>
</template>
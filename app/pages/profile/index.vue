<script setup>
import { useAuth } from '~/stores/Auth';

definePageMeta({
    layout: 'default'
})

const auth = useAuth();

const { data: response, pending, error } = await useFetch(`/api/user/${auth.session?.id}`, { lazy: true });

// State lokal untuk Optimistic UI
const followStats = ref({
    isFollowing: false,
    followStatus: null,
    followersCount: 0,
    followingCount: 0,
});

// Sinkronisasi data initial setelah fetch
watchEffect(() => {
    if (response.value) {
        followStats.value = {
            isFollowing: response.value.isFollowed,
            followStatus: response.value.followStatus,
            followersCount: response.value.user.followers,
            followingCount: response.value.user.following
        };
    }
});

const isYappinganActive = ref(true);
const isLikedActive = ref(false);
const isRepostedActive = ref(false);

function toggleTabs(tab) {
    if (tab === 'yappingan') {
        isYappinganActive.value = true;
        isLikedActive.value = false;
        isRepostedActive.value = false;
    } else if (tab === 'liked') {
        isYappinganActive.value = false;
        isLikedActive.value = true;
        isRepostedActive.value = false;
    } else if (tab === 'reposted') {
        isYappinganActive.value = false;
        isLikedActive.value = false;
        isRepostedActive.value = true;
    }
}
</script>

<template>
    <main class="w-full max-w-xl mx-auto py-4">
        <div v-if="pending" class="text-center p-8 text-purple-600 font-orbitron animate-pulse">
            <Icon name="svg-spinners:ring-resize" class="w-8 h-8 mx-auto mb-2" />
        </div>

        <div v-else-if="error || !auth.session?.id"
            class="p-4 bg-rose-500/5 border border-rose-500/20 text-rose-600 rounded-2xl m-4 font-mono text-xs text-center">
            ERROR MENGAMBIL PROFIL: {{ error ? error.statusMessage : "PROFIL TIDAK DITEMUKAN" }}
        </div>

        <div v-else class="flex flex-col gap-6 w-full">
            <div id="profile"
                class="cyber-panel p-6 rounded-3xl border border-purple-800/50/80 flex flex-col items-center relative overflow-hidden bg-[#1a0b2e]/80 backdrop-blur-md/75 w-full text-center">
                <!-- Sci-Fi corner tags -->
                <div class="absolute top-0 left-0 w-16 h-[1px] bg-gradient-to-r from-purple-400 to-transparent"></div>
                <div class="absolute top-0 left-0 h-16 w-[1px] bg-gradient-to-b from-purple-400 to-transparent"></div>

                <div
                    class="p-0.5 rounded-full bg-gradient-to-tr from-fuchsia-500 to-purple-400 shadow-[0_0_15px_rgba(2,132,199,0.15)]">
                    <img :src="response?.user?.photo" alt="Avatar"
                        class="rounded-full w-20 h-20 object-cover aspect-square border-2 border-white">
                </div>

                <h1 class="font-bold font-orbitron text-2xl tracking-wide text-purple-600 mt-4 glow-text-purple">
                    @{{ response?.user?.username }}
                </h1>

                <p
                    class="text-sm text-purple-100 px-6 py-3 mt-3 leading-relaxed bg-purple-900/20/80 border border-purple-800/50/50 rounded-2xl max-w-sm">
                    {{ response?.user?.bio || 'No status log written.' }}
                </p>

                <FollowList :userId="auth.session?.id" :followStats="followStats" />

                <div class="flex space-x-2">
                    <button @click="auth.signOut"
                        class="btn-neon-magenta text-[10px] font-orbitron font-bold tracking-widest py-2.5 px-6 rounded-xl shadow-lg mt-5 flex items-center gap-1.5">
                        <Icon name="ph:power-bold" class="w-4 h-4" />
                        LOGOUT
                    </button>
                    <NuxtLink to="/profile/edit"
                        class="bg-cyan-400 text-[10px] font-orbitron font-bold tracking-widest py-2.5 px-6 rounded-xl shadow-lg mt-5 flex items-center gap-1.5">
                        <Icon name="streamline-ultimate:single-neutral-actions-edit-2-bold" class="w-4 h-4" />
                        EDIT PROFILE
                    </NuxtLink>
                </div>
            </div>

            <!-- Header for user's tweets -->
            <div class="border-b border-purple-800/50 pb-2 max-w-xl mx-auto w-full">
                <span class="font-orbitron text-[10px] font-bold text-purple-400 tracking-widest">
                    YAPPINGAN {{ response?.user?.username }}</span>
            </div>

            <!-- Tweet Tabs-->
            <ProfileTwitsTab @toggleTabs="toggleTabs" :isYappinganActive="isYappinganActive"
                :isLikedActive="isLikedActive" :isRepostedActive="isRepostedActive" />

            <Twits :id="auth.session?.id"
                :type="isYappinganActive ? 'yappingan' : isLikedActive ? 'liked' : 'reposted'" />
        </div>
    </main>
</template>
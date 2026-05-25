<script setup>
import { useAuth } from '~/stores/Auth';
const { $csrfFetch } = useNuxtApp();

definePageMeta({
    layout: 'default'
})

const auth = useAuth();
const route = useRoute();
const userId = route.params.id;

// Fetch Profile Data
const { data: response, pending, error } = await useFetch(`/api/user/${userId}`);

// State lokal untuk Optimistic UI
const followStats = ref({
    isFollowing: false,
    followersCount: 0,
    followingCount: 0
});

// Sinkronisasi data initial setelah fetch
watchEffect(() => {
    if (response.value) {
        followStats.value = {
            isFollowing: response.value.isFollowed,
            followersCount: response.value.user.followers,
            followingCount: response.value.user.following
        };
    }
});

// Logic Optimistic UI
const toggleFollow = async () => {
    // Abaikan jika user belum login atau meng-klik profilnya sendiri
    if (!auth.session?.id || auth.session.id === userId) return;

    // Simpan state sebelum berubah untuk antisipasi rollback
    const previousStatus = followStats.value.isFollowing;

    // OPTIMISTIC UPDATE: UI LANGSUNG BERUBAH
    followStats.value.isFollowing = !followStats.value.isFollowing;
    followStats.value.followersCount += followStats.value.isFollowing ? 1 : -1;

    try {
        const endpoint = previousStatus ? '/api/follow/remove' : '/api/follow/add';

        await $csrfFetch(endpoint, {
            method: 'POST',
            body: {
                follower: auth.session.id,
                following: userId
            }
        });
    } catch (err) {
        // ROLLBACK
        followStats.value.isFollowing = previousStatus;
        followStats.value.followersCount += previousStatus ? 1 : -1;
        alert(err.statusMessage || 'Gagal mengubah status follow');
    }
}
</script>

<template>
    <main class="w-full max-w-xl mx-auto py-4">
        <div v-if="pending" class="text-center p-8 text-purple-600 font-orbitron animate-pulse">
            <Icon name="svg-spinners:ring-resize" class="w-8 h-8 mx-auto mb-2" />
            LOADING PROFILE...
        </div>

        <div v-else-if="error"
            class="p-4 bg-rose-500/5 border border-rose-500/20 text-rose-600 rounded-2xl m-4 font-mono text-xs text-center">
            PROFIL TIDAK DITEMUKAN
        </div>

        <div v-else class="flex flex-col gap-6 w-full">
            <div id="profile"
                class="cyber-panel p-6 rounded-3xl border border-purple-800/50/80 flex flex-col items-center relative overflow-hidden bg-[#1a0b2e]/80 backdrop-blur-md/75 w-full text-center">
                <!-- Sci-Fi corner tags -->
                <div class="absolute top-0 left-0 w-16 h-[1px] bg-gradient-to-r from-purple-400 to-transparent"></div>
                <div class="absolute top-0 left-0 h-16 w-[1px] bg-gradient-to-b from-purple-400 to-transparent"></div>

                <div
                    class="p-0.5 rounded-full bg-gradient-to-tr from-fuchsia-500 to-purple-400 shadow-[0_0_15px_rgba(2,132,199,0.15)]">
                    <img :src="response?.user?.photo || 'https://api.dicebear.com/8.x/adventurer/svg?seed=Felix'"
                        alt="avatar" class="rounded-full w-20 h-20 object-cover aspect-square border-2 border-white">
                </div>

                <h1 class="font-bold font-orbitron text-2xl tracking-wide text-purple-600 mt-4 glow-text-purple">
                    @{{ response?.user?.username }}
                </h1>

                <p
                    class="text-sm text-purple-100 px-6 py-3 mt-3 leading-relaxed bg-purple-900/20/80 border border-purple-800/50/50 rounded-2xl max-w-sm">
                    {{ response?.user?.bio || 'No status log written.' }}
                </p>

                <!-- Holographic Stats grid -->
                <div
                    class="flex justify-center gap-8 w-full border-t border-b border-purple-800/40 py-3.5 my-3 font-mono">
                    <div class="flex flex-col items-center">
                        <span class="font-bold text-purple-600 text-lg tracking-wider">{{ followStats.followersCount
                        }}</span>
                        <span class="text-[9px] text-purple-300 tracking-widest mt-1">FOLLOWERS</span>
                    </div>
                    <div class="w-[1px] bg-slate-200"></div>
                    <div class="flex flex-col items-center">
                        <span class="font-bold text-purple-600 text-lg tracking-wider">{{ followStats.followingCount
                        }}</span>
                        <span class="text-[9px] text-purple-300 tracking-widest mt-1">FOLLOWING</span>
                    </div>
                </div>

                <!-- Follow / Unfollow Action Button -->
                <button v-if="auth.session?.id && auth.session.id !== userId" @click="toggleFollow"
                    :class="followStats.isFollowing ? 'btn-neon-magenta' : 'btn-neon-purple'"
                    class="mt-2 text-[10px] font-orbitron font-bold tracking-widest py-2.5 px-6 rounded-xl shadow-lg flex items-center gap-1.5 transition-all">
                    <Icon :name="followStats.isFollowing ? 'ph:user-minus-bold' : 'ph:user-plus-bold'"
                        class="w-4 h-4" />
                    {{ followStats.isFollowing ? 'UNFOLLOW' : 'FOLLOW' }}
                </button>
            </div>

            <!-- Header for user's tweets -->
            <div class="border-b border-purple-800/50 pb-2 max-w-xl mx-auto w-full">
                <span class="font-orbitron text-[10px] font-bold text-purple-400 tracking-widest">Yappingan {{
                    response?.user?.username }}</span>
            </div>

            <Twits :id="userId" />
        </div>
    </main>
</template>
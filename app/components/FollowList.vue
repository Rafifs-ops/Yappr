<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
    userId: String,
    followStats: Object,
});

const followLists = ref({
    followers: [],
    following: []
});

const showFollowList = ref(false);
const followListType = ref('followers');
const followListLoading = ref(false);
const followListFetched = ref(false);

// Me-reset state jika user berpindah ke profil lain tanpa reload halaman
watch(() => props.userId, () => {
    followListFetched.value = false;
    followLists.value = { followers: [], following: [] };
});

// Menggabungkan logika showFollowers dan showFollowing
const openFollowList = async (type) => {
    const count = type === 'followers' ? props.followStats.followersCount : props.followStats.followingCount;
    if (count === 0) return;

    showFollowList.value = true;
    followListType.value = type;

    if (followListFetched.value) return;

    followListLoading.value = true;
    try {
        const response = await $fetch(`/api/user/get-follow-lists/${props.userId}`);
        followLists.value.followers = response.followers;
        followLists.value.following = response.following;
        followListFetched.value = true;
    } catch (err) {
        console.error("Gagal mengambil data follow list:", err);
    } finally {
        followListLoading.value = false;
    }
};
</script>

<template>
    <div class="flex justify-center gap-8 w-full border-t border-b border-purple-800/40 py-3.5 my-3 font-mono">
        <div class="flex flex-col items-center cursor-pointer" @click="openFollowList('followers')">
            <span class="font-bold text-purple-600 text-lg tracking-wider">{{ followStats.followersCount }}</span>
            <span class="text-[9px] text-purple-300 tracking-widest mt-1">FOLLOWERS</span>
        </div>
        <div class="w-[1px] bg-slate-200"></div>
        <div class="flex flex-col items-center cursor-pointer" @click="openFollowList('following')">
            <span class="font-bold text-purple-600 text-lg tracking-wider">{{ followStats.followingCount }}</span>
            <span class="text-[9px] text-purple-300 tracking-widest mt-1">FOLLOWING</span>
        </div>
    </div>

    <div v-if="showFollowList"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0a0514]/80 backdrop-blur-sm transition-all"
        @click.self="showFollowList = false">
        <div
            class="bg-[#1a0b2e] border border-purple-800/50 rounded-2xl w-full max-w-sm max-h-[70vh] flex flex-col overflow-hidden shadow-[0_0_30px_rgba(168,85,247,0.2)]">
            <div class="p-4 border-b border-purple-800/40 flex justify-between items-center bg-purple-900/20">
                <h3 class="font-orbitron font-bold text-purple-400 tracking-wider">
                    {{ followListType === 'followers' ? 'FOLLOWERS' : 'FOLLOWING' }}
                </h3>
                <button @click="showFollowList = false"
                    class="text-purple-400 hover:text-purple-300 transition-colors p-1 rounded-lg hover:bg-purple-800/30">
                    <Icon name="streamline-ultimate:arrow-right-bold" class="w-5 h-5" />
                </button>
            </div>

            <div class="p-2 overflow-y-auto flex flex-col gap-1">
                <div v-if="followListLoading"
                    class="text-center py-8 text-purple-400/50 text-sm font-mono animate-pulse">
                    LOADING USERS...
                </div>

                <div v-else>
                    <NuxtLink
                        v-for="user in (followListType === 'followers' ? followLists.followers : followLists.following)"
                        :key="user._id" :to="`/profile/${user._id}`"
                        class="flex items-center gap-3 p-3 rounded-xl hover:bg-purple-800/30 transition-colors group"
                        @click="showFollowList = false">
                        <div class="p-0.5 rounded-full bg-gradient-to-tr from-purple-500/50 to-transparent">
                            <img :src="user.photo || 'https://api.dicebear.com/8.x/adventurer/svg?seed=Felix'"
                                alt="avatar" class="w-10 h-10 rounded-full object-cover border border-[#1a0b2e]">
                        </div>
                        <div class="flex flex-col text-left">
                            <span
                                class="font-bold text-purple-100 text-sm group-hover:text-purple-300 transition-colors">@{{
                                    user.username }}</span>
                        </div>
                    </NuxtLink>

                    <div v-if="(followListType === 'followers' ? followLists.followers : followLists.following).length === 0"
                        class="text-center py-8 text-purple-400/50 text-sm font-mono">
                        Belum ada {{ followListType === 'followers' ? 'followers' : 'following' }}.
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
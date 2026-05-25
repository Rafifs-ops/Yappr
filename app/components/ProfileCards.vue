<script setup>
const props = defineProps({
    dataProfile: {
        type: Array,
        default: () => []
    }
})
</script>

<template>
    <main class="w-full">
        <div v-if="props.dataProfile.length === 0"
            class="text-center mx-auto my-8 font-orbitron font-bold text-lg text-purple-300">
            <Icon name="ph:user-minus-light" class="w-12 h-12 mx-auto mb-2 text-purple-200" />
            USER TIDAK ADA
        </div>

        <div v-else class="flex flex-wrap gap-4 justify-center py-2">
            <NuxtLink v-for="profile in props.dataProfile" :key="profile._id || profile.username"
                :to="`/profile/${profile._id}`"
                class="cyber-panel p-4 flex items-center gap-4 rounded-2xl min-w-[18rem] max-w-[20rem] w-full cursor-pointer relative overflow-hidden group">
                <!-- Cyber top-left tag -->
                <div class="absolute top-0 left-0 w-12 h-[1px] bg-gradient-to-r from-purple-400 to-transparent"></div>
                <div class="absolute top-0 left-0 h-12 w-[1px] bg-gradient-to-b from-purple-400 to-transparent"></div>

                <div
                    class="p-0.5 rounded-full bg-gradient-to-tr from-fuchsia-500 to-purple-400 shadow-[0_0_8px_rgba(2,132,199,0.15)] group-hover:shadow-[0_0_15px_rgba(2,132,199,0.35)] transition-all duration-300">
                    <img :src="profile.photo" alt="Profile Avatar"
                        class="rounded-full w-12 h-12 object-cover aspect-square border border-white">
                </div>

                <div class="flex flex-col flex-1">
                    <div class="flex items-center gap-1.5">
                        <h1
                            class="font-bold text-white group-hover:text-purple-600 transition-colors font-orbitron tracking-wide text-sm">
                            {{ profile.username }}
                        </h1>
                    </div>
                </div>

                <div class="text-purple-300 group-hover:text-purple-400 transition-colors">
                    <Icon name="ph:arrow-square-out-bold" class="w-5 h-5" />
                </div>
            </NuxtLink>
        </div>
    </main>
</template>
<script setup>
import { ref, watch } from 'vue';
import { useAuth } from '../stores/Auth';
import { useTwitActions } from '../composables/useTwitActions';
import TwitCard from './TwitCard.vue';

const auth = useAuth();
const props = defineProps({
    id: String
})

// Ambil data menggunakan useFetch
const { data: fetchedTwits, pending, error } = await useFetch(() => {
    return props.id ? `/api/twits/user/${props.id}` : '/api/twits'
});

// Buat state lokal yang 100% reaktif dan bisa kita modifikasi sesuka hati
const twits = ref([]);

// Gunakan composable untuk aksi-aksi interaktif (Like, Repost, Delete)
const { toggleLike, toggleRepost, deleteTwit } = useTwitActions(twits);

// Sinkronkan data dari fetchedTwits ke state lokal 'twits'
watch(fetchedTwits, (newData) => {
    if (newData) {
        // Kita "clone" datanya untuk melepaskan ikatan dari sistem cache Nuxt
        // Ini memastikan Vue mendeteksi setiap perubahan kecil di dalamnya
        twits.value = JSON.parse(JSON.stringify(newData));
    }
}, { immediate: true }); // immediate: true penting agar data langsung terisi saat halaman dimuat
</script>

<template>
    <main class="w-full">
        <div v-if="pending" class="text-center p-8 text-purple-600 font-orbitron animate-pulse">
            <Icon name="svg-spinners:ring-resize" class="w-8 h-8 mx-auto mb-2" />
            SEDANG MENGAMBIL TWIT...
        </div>
        <div v-else-if="error" class="text-center p-8 text-rose-600 font-orbitron">
            <Icon name="streamline-ultimate:alert-triangle-bold" class="w-8 h-8 mx-auto mb-2 animate-bounce" />
            TERJADI KESALAHAN...
        </div>

        <div v-else-if="!twits?.length && !id"
            class="text-center font-orbitron font-bold text-sm p-12 text-purple-400 bg-purple-900/30/30 rounded-2xl border border-purple-800/50/50 max-w-xl mx-auto shadow-inner">
            BELUM ADA YANG UPLOAD TWIT
        </div>

        <div v-else-if="!twits?.length && id"
            class="text-center font-orbitron font-bold text-sm p-12 text-purple-400 bg-purple-900/30/30 rounded-2xl border border-purple-800/50/50 max-w-xl mx-auto shadow-inner">
            USER INI BELUM MENGUPLOAD TWIT
        </div>

        <div v-else class="flex flex-col gap-4 w-full">
            <TwitCard v-for="twit in twits" :key="twit._id" :twit="twit" :current-user-id="auth.session?.id"
                @toggle-like="toggleLike" @toggle-repost="toggleRepost" @delete-twit="deleteTwit" />
        </div>
    </main>
</template>
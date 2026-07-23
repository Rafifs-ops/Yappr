<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useAuth } from '../stores/Auth';
import { useTwitActions } from '../composables/useTwitActions';
import TwitCard from './TwitCard.vue';

const auth = useAuth();
const props = defineProps({
    id: String,
    type: String,
    hashtag: String
});

const getEndpoint = (cursor = null) => {
    let url = `/api/twits`;
    if (props.id && props.type === 'liked') {
        url = `/api/twits/user/${props.id}/liked`;
    } else if (props.id && props.type === 'reposted') {
        url = `/api/twits/user/${props.id}/reposted`;
    } else if (props.id) {
        url = `/api/twits/user/${props.id}`;
    } else if (props.hashtag) {
        url = `/api/twits/hashtag/${props.hashtag}`;
    }
    if (cursor) {
        url += `?cursor=${cursor}`;
    }
    return url;
};

// Ambil data menggunakan useFetch
const { data: fetchedTwits, pending, error } = await useFetch(() => getEndpoint());

// Buat state lokal yang 100% reaktif dan bisa kita modifikasi sesuka hati
const twits = ref([]);
const hasMore = ref(true);
const loadingMore = ref(false);
const loadMoreTrigger = ref(null);
let observer = null;

// Gunakan composable untuk aksi-aksi interaktif (Like, Repost, Delete)
const { toggleLike, toggleRepost, deleteTwit } = useTwitActions(twits);

// Sinkronkan data dari fetchedTwits ke state lokal 'twits'
watch(fetchedTwits, (newData) => {
    if (newData) {
        // Kita "clone" datanya untuk melepaskan ikatan dari sistem cache Nuxt
        // Ini memastikan Vue mendeteksi setiap perubahan kecil di dalamnya
        twits.value = JSON.parse(JSON.stringify(newData));
        hasMore.value = newData.length === 10;
    }
}, { immediate: true }); // immediate: true penting agar data langsung terisi saat halaman dimuat

const fetchMorePosts = async () => {
    if (!hasMore.value || loadingMore.value || !twits.value.length) return;

    loadingMore.value = true;
    try {
        const lastTwit = twits.value[twits.value.length - 1];
        const cursor = lastTwit.createdAt;
        
        const newTwits = await $fetch(getEndpoint(cursor));
        
        if (newTwits && newTwits.length > 0) {
            twits.value.push(...newTwits);
            if (newTwits.length < 10) {
                hasMore.value = false;
            }
        } else {
            hasMore.value = false;
        }
    } catch (err) {
        console.error("Gagal memuat lebih banyak twit:", err);
    } finally {
        loadingMore.value = false;
    }
};

onMounted(() => {
    observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            fetchMorePosts();
        }
    }, {
        rootMargin: '100px',
    });

    if (loadMoreTrigger.value) {
        observer.observe(loadMoreTrigger.value);
    }
});

watch(loadMoreTrigger, (el) => {
    if (el && observer) {
        observer.observe(el);
    }
});

onBeforeUnmount(() => {
    if (observer) {
        observer.disconnect();
    }
});
</script>

<template>
    <main class="w-full">
        <div v-if="pending" class="text-center p-8 text-purple-600 font-orbitron animate-pulse">
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

        <div v-else-if="!twits?.length && id && type === 'liked'"
            class="text-center font-orbitron font-bold text-sm p-12 text-purple-400 bg-purple-900/30/30 rounded-2xl border border-purple-800/50/50 max-w-xl mx-auto shadow-inner">
            USER BELUM MENYUKAI TWIT LAIN
        </div>

        <div v-else-if="!twits?.length && id && type === 'reposted'"
            class="text-center font-orbitron font-bold text-sm p-12 text-purple-400 bg-purple-900/30/30 rounded-2xl border border-purple-800/50/50 max-w-xl mx-auto shadow-inner">
            USER BELUM MEREPOST TWIT LAIN
        </div>

        <div v-else-if="!twits?.length && id"
            class="text-center font-orbitron font-bold text-sm p-12 text-purple-400 bg-purple-900/30/30 rounded-2xl border border-purple-800/50/50 max-w-xl mx-auto shadow-inner">
            USER INI BELUM MENGUPLOAD TWIT
        </div>

        <div v-else class="flex flex-col gap-4 w-full">
            <TwitCard v-for="twit in twits" :key="twit._id" :twit="twit" :current-user-id="auth.session?.id"
                @toggle-like="toggleLike" @toggle-repost="toggleRepost" @delete-twit="deleteTwit" />

            <!-- Elemen trigger untuk infinite scroll -->
            <div ref="loadMoreTrigger" class="w-full flex justify-center py-6">
                <Icon v-if="loadingMore" name="svg-spinners:3-dots-fade" class="w-8 h-8 text-purple-500" />
            </div>
        </div>
    </main>
</template>
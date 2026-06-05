<script setup>
import { useAuth } from '~/stores/Auth';

const auth = useAuth();
const router = useRouter();
const { $csrfFetch } = useNuxtApp();

definePageMeta({
    layout: 'default'
});

const { data: profile, pending, error } = await useFetch(`/api/user/${auth.session?.id}`);

const fileInput = ref(null);
const photoPreview = ref(null);

const form = reactive({
    username: profile.value?.user?.username || '',
    bio: profile.value?.user?.bio || '',
    photo: null,
    isPrivate: profile.value?.user?.isPrivate || false
});

const message = ref({
    show: false,
    text: '',
    isError: false
});

function triggerFileInput() {
    if (fileInput.value) {
        fileInput.value.click();
    }
}

function handleFileChange(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        message.value = {
            show: true,
            text: 'Harap pilih file gambar',
            isError: true
        };
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        message.value = {
            show: true,
            text: 'Ukuran file maksimal 5MB',
            isError: true
        };
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        photoPreview.value = e.target.result;
        form.photo = e.target.result;
    };
    reader.readAsDataURL(file);
}

async function handleUpdate() {
    message.value = {
        show: false,
        text: '',
        isError: false
    };

    try {
        const result = await $csrfFetch('/api/user/update', {
            method: 'PUT',
            body: {
                id: auth.session?.id,
                username: form.username,
                bio: form.bio,
                photo: form.photo,
                isPrivate: form.isPrivate
            }
        });

        // Update session lokal jika berhasil
        auth.session.username = result.username;
        if (result.photo) {
            auth.session.photo = result.photo;
        }

        message.value = {
            show: true,
            text: 'Profil berhasil diperbarui!',
            isError: false
        };

        // Kembali ke halaman profil setelah 2 detik
        setTimeout(() => {
            router.push('/profile');
        }, 2000);

    } catch (e) {
        message.value = {
            show: true,
            text: e.data?.message || 'Gagal memperbarui profil',
            isError: true
        };
    }
}

// Watcher untuk auto-sync data dari API saat loading selesai
watch(profile, (newData) => {
    if (newData?.user) {
        form.username = newData.user.username;
        form.bio = newData.user.bio || '';
        form.isPrivate = newData.user.isPrivate || false;
    }
}, { immediate: true });
</script>

<template>
    <main class="w-full max-w-xl mx-auto py-4">
        <div
            class="cyber-panel p-6 rounded-3xl border border-purple-800/50/80 flex flex-col items-center relative overflow-hidden bg-[#1a0b2e]/80 backdrop-blur-md/75 w-full">

            <!-- Header -->
            <div class="w-full flex justify-between items-center mb-6">
                <button @click="$router.back()" class="p-2 hover:bg-purple-800/50 rounded-full transition-colors">
                    <Icon name="streamline-ultimate:arrow-thick-circle-left-2" class="w-5 h-5 text-purple-400" />
                </button>
                <h1 class="font-orbitron text-lg text-purple-600">EDIT PROFILE</h1>
                <div class="w-8"></div>
            </div>

            <!-- Message Box -->
            <div v-if="message.show" :class="{
                'bg-green-500/10 border-green-500/20 text-green-400': !message.isError,
                'bg-rose-500/10 border-rose-500/20 text-rose-400': message.isError
            }" class="w-full p-4 rounded-xl mb-4 border text-center font-mono text-xs">
                {{ message.text }}
            </div>

            <!-- Loading State -->
            <div v-if="pending" class="p-8 text-center text-purple-600 font-orbitron">
                <Icon name="streamline-ultimate:loading" class="w-8 h-8 mx-auto mb-2 animate-pulse" />
                LOADING...
            </div>

            <!-- Error State -->
            <div v-else-if="error || !auth.session?.id" class="p-8 text-center text-rose-600 font-orbitron">
                <Icon name="streamline-ultimate:alert-octagon-1" class="w-8 h-8 mx-auto mb-2 animate-bounce" />
                ERROR: {{ error ? error.statusMessage : "ID TIDAK DITEMUKAN" }}
            </div>

            <!-- Edit Form -->
            <div v-else class="w-full space-y-6">

                <!-- Avatar Upload Placeholder -->
                <div class="flex flex-col items-center gap-4">
                    <input type="file" accept="image/*" class="hidden" ref="fileInput" @change="handleFileChange" />
                    <div
                        class="relative p-0.5 rounded-full bg-gradient-to-tr from-fuchsia-500 to-purple-400 shadow-[0_0_20px_rgba(2,132,199,0.2)]">
                        <img :src="photoPreview || profile?.user?.photo" alt="Avatar"
                            class="rounded-full w-24 h-24 object-cover aspect-square border-4 border-white">
                        <button @click="triggerFileInput" type="button"
                            class="absolute bottom-0 right-0 p-1.5 bg-black rounded-full border border-purple-500 hover:scale-110 transition-transform">
                            <Icon name="streamline-ultimate:allowances-no-photos-bold"
                                class="w-4 h-4 text-purple-400" />
                        </button>
                    </div>
                    <p class="text-xs text-purple-400 font-orbitron cursor-pointer hover:text-purple-300"
                        @click="triggerFileInput">GANTI AVATAR</p>
                </div>

                <!-- Username Field -->
                <div class="space-y-2">
                    <label class="font-orbitron text-[10px] text-purple-400 uppercase tracking-widest">Username</label>
                    <div class="relative">
                        <input type="text" v-model="form.username" :disabled="pending"
                            class="cyber-input w-full pl-10 pr-4 py-3 bg-transparent border-purple-500/30 text-white rounded-xl focus:border-purple-400 focus:ring-0"
                            placeholder="Masukkan username Anda">
                        <div class="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500">
                            <Icon name="streamline-ultimate:single-neutral-circle-bold" class="w-5 h-5" />
                        </div>
                    </div>
                </div>

                <!-- Bio Field -->
                <div class="space-y-2">
                    <label class="font-orbitron text-[10px] text-purple-400 uppercase tracking-widest">Bio /
                        Status</label>
                    <div class="relative">
                        <textarea v-model="form.bio" :disabled="pending" rows="3"
                            class="cyber-input w-full pl-10 pr-4 py-3 bg-transparent border-purple-500/30 text-white rounded-xl focus:border-purple-400 focus:ring-0 resize-none"
                            placeholder="Ceritakan tentang diri Anda..."></textarea>
                        <div class="absolute left-3 top-3 text-purple-500">
                            <Icon name="streamline-ultimate:programming-user-chat" class="w-5 h-5" />
                        </div>
                        <div class="absolute right-3 bottom-3 text-xs text-purple-700 font-mono">
                            {{ form.bio.length }} / 250
                        </div>
                    </div>
                </div>

                <!-- Private Account Field -->
                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <label class="font-orbitron text-[10px] text-purple-400 uppercase tracking-widest">
                            Akun Privat
                        </label>
                        <div @click="form.isPrivate = !form.isPrivate"
                            class="w-11 h-6 bg-purple-900/50 rounded-full border border-purple-800/50 flex items-center cursor-pointer transition-colors"
                            :class="{ 'bg-red-600': form.isPrivate, 'opacity-50 cursor-not-allowed': pending }">
                            <div class="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform"
                                :class="form.isPrivate ? 'translate-x-6' : 'translate-x-1'">
                            </div>
                        </div>
                    </div>
                    <p class="text-[10px] text-purple-300/70 font-mono leading-relaxed">
                        Jika diaktifkan, hanya pengikut yang Anda setujui yang dapat melihat foto dan video Anda.
                    </p>
                </div>

                <!-- Save Button -->
                <button @click="handleUpdate" :disabled="pending"
                    class="btn-neon-magenta w-full py-3 font-orbitron font-bold tracking-widest rounded-xl mt-6 shadow-lg hover:shadow-[0_0_25px_rgba(236,72,153,0.5)] transition-all"
                    :class="{ 'opacity-50 cursor-not-allowed': pending }">
                    <span v-if="pending">MEMPROSES...</span>
                    <span v-else>SIMPAN PERUBAHAN</span>
                </button>

            </div>
        </div>
    </main>
</template>
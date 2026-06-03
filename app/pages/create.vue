<script setup>
const { $csrfFetch } = useNuxtApp();

const content = ref('')

definePageMeta({
    layout: 'default'
})
const imageFile = ref(null);
const imagePreview = ref('');
const videoFile = ref(null);
const videoPreview = ref('');
const isUploading = ref(false);

const fileInput = ref(null);

function triggerFileInput() {
    fileInput.value.click();
}

function onFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    // Cek apakah file adalah video atau gambar
    if (file.type.startsWith('image/')) {
        imageFile.value = file;
        reader.onload = (event) => { imagePreview.value = event.target.result; };
    } else if (file.type.startsWith('video/')) {
        // Cek durasi video sebelum diproses
        const videoElement = document.createElement('video');
        videoElement.preload = 'metadata';

        videoElement.onloadedmetadata = function () {
            window.URL.revokeObjectURL(videoElement.src); // Bersihkan memori

            // Cek jika durasi lebih dari 60 detik
            if (videoElement.duration > 60) {
                alert('Durasi video terlalu panjang! Maksimal 1 menit (60 detik).');
                // Reset input file
                if (fileInput.value) fileInput.value.value = '';
                return;
            }

            // Jika lolos validasi, proses video
            videoFile.value = file;
            const reader = new FileReader();
            reader.onload = (event) => {
                videoPreview.value = event.target.result;
            };
            reader.readAsDataURL(file);
        }

        // Memuat file sementara untuk membaca metadata
        videoElement.src = URL.createObjectURL(file);
    } else {
        alert('Tolong pilih file gambar atau video');
        return;
    }

    reader.readAsDataURL(file);
}

function removeImage() {
    imageFile.value = null;
    imagePreview.value = '';
    // Kosongkan input file agar bisa memilih file yang sama lagi jika perlu
    if (fileInput.value) fileInput.value.value = '';
}

function removeVideo() {
    videoFile.value = null;
    videoPreview.value = '';
    if (fileInput.value) fileInput.value.value = '';
}

async function handlePost() {
    // Mengecek apakah content kosong, null, atau hanya berisi tag kosong
    const isContentEmpty = !content.value || content.value.trim() === '' || content.value === '<p><br></p>' || content.value === '<p></p>';

    // PERBAIKAN: Mengganti text.value menjadi isContentEmpty
    if (isContentEmpty && !imageFile.value && !videoFile.value) {
        alert('Tolong masukkan teks, pilih gambar, atau pilih video.');
        return;
    }

    const { finalText, hashtags } = extractAndCleanHashtags(content.value);

    try {
        isUploading.value = true;
        await $csrfFetch('/api/twits', {
            method: 'POST',
            body: {
                text: finalText,
                image: imagePreview.value, // This is the base64 string
                video: videoPreview.value,
                hashtags: hashtags,
            }
        });
        navigateTo('/profile');
    } catch (err) {
        alert(err.statusMessage || 'An error occurred');
    } finally {
        isUploading.value = false;
    }
}
</script>

<template>
    <main class="w-full py-4">
        <div
            class="max-w-2xl mx-auto cyber-panel rounded-2xl border border-purple-800/50/80 overflow-hidden bg-[#1a0b2e]/80 backdrop-blur-md/75 relative">
            <!-- Sci-Fi corner lines -->
            <div class="absolute top-0 left-0 w-16 h-[1px] bg-gradient-to-r from-purple-400 to-transparent"></div>
            <div class="absolute top-0 left-0 h-16 w-[1px] bg-gradient-to-b from-purple-400 to-transparent"></div>
            <div class="absolute bottom-0 right-0 w-16 h-[1px] bg-gradient-to-l from-purple-500 to-transparent"></div>
            <div class="absolute bottom-0 right-0 h-16 w-[1px] bg-gradient-to-t from-purple-500 to-transparent"></div>

            <div class="p-6 space-y-6 relative z-10">
                <div class="flex items-center space-x-3 border-b border-purple-800/40 pb-4">
                    <div
                        class="w-10 h-10 rounded-xl bg-purple-900/200/5 border border-purple-500/20 flex items-center justify-center text-purple-600 shadow-[0_0_12px_rgba(2,132,199,0.08)] animate-pulse">
                        <Icon name="streamline-ultimate:content-paper-edit-bold" class="w-5 h-5" />
                    </div>
                    <div>
                        <h1 class="text-lg font-bold font-orbitron text-white tracking-wider glow-text-purple">
                            Create a new twit
                        </h1>
                        <p class="text-purple-300 text-[10px] font-mono tracking-widest mt-0.5">Buat twit baru dan
                            yapping lah sepuasnya</p>
                    </div>
                </div>

                <div class="flex flex-col space-y-4">
                    <div class="rounded-xl overflow-hidden border border-purple-800/50/50 shadow-inner">
                        <ClientOnly>
                            <TiptapEditor v-model="content" />
                        </ClientOnly>
                    </div>

                    <!-- Image Preview Area -->
                    <div v-if="imagePreview"
                        class="relative group/img rounded-xl overflow-hidden border border-purple-800/50 shadow-sm">
                        <img :src="imagePreview" alt="Preview" class="w-full h-auto object-cover max-h-96" />
                        <div
                            class="absolute inset-0 bg-gradient-to-t from-slate-100/10 to-transparent pointer-events-none">
                        </div>
                        <button @click="removeImage"
                            class="absolute top-3 right-3 bg-rose-500 hover:bg-rose-600 p-2.5 rounded-xl text-white transition-all transform hover:scale-105 shadow-lg border border-rose-400/20">
                            <Icon name="streamline-ultimate:bin-1-bold" class="w-4 h-4" />
                        </button>
                    </div>

                    <!-- Video Preview Area -->
                    <div v-if="videoPreview"
                        class="relative group/vid rounded-xl overflow-hidden border border-purple-800/50 shadow-sm mt-4">
                        <video :src="videoPreview" controls class="w-full h-auto max-h-96"></video>
                        <button @click="removeVideo"
                            class="absolute top-3 right-3 bg-rose-500 hover:bg-rose-600 p-2.5 rounded-xl text-white shadow-lg border border-rose-400/20">
                            <Icon name="streamline-ultimate:bin-1-bold" class="w-4 h-4" />
                        </button>
                    </div>

                    <div class="flex items-center justify-between pt-2">
                        <div class="flex items-center space-x-3">
                            <input type="file" ref="fileInput" @change="onFileChange" accept="image/*,video/*"
                                class="hidden" />
                            <button @click="triggerFileInput"
                                class="flex items-center space-x-2 btn-neon-purple py-2 px-4 rounded-md font-semibold">
                                <Icon name="streamline-ultimate:picture-stack-landscape-bold" class="w-4 h-4" />
                                <span> ADD MEDIA</span>
                            </button>
                        </div>

                        <button @click="handlePost" :disabled="isUploading"
                            class="btn-neon-purple font-orbitron font-bold py-2.5 px-6 rounded-xl transition duration-300 shadow-lg tracking-widest text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2">
                            <span v-if="isUploading">PROSES....</span>
                            <span v-else>CREATE</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </main>
</template>

<style scoped>
textarea::placeholder {
    font-size: 1.1rem;
}
</style>
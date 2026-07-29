<script setup>
import { useToast } from '~/composables/useToast';

const { $csrfFetch } = useNuxtApp();
const toast = useToast();

definePageMeta({
    layout: 'auth'
})
const router = useRouter();

const dataRegister = ref({
    username: "",
    email: "",
    password: "",
    bio: "",
    file: null
})

const photoPreview = ref(null);

function handleFileChange(event) {
    const file = event.target.files[0];
    if (file) {
        const allowedTypes = ['image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            toast.warning('Format file wajib JPG, JPEG, atau PNG', 'Format File Error');
            event.target.value = '';
            return;
        }

        const maxSize = 5 * 1024 * 1024; // 5 MB
        if (file.size > maxSize) {
            toast.warning('Ukuran maksimal file adalah 5 MB', 'File Terlalu Besar');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            photoPreview.value = e.target.result;
            dataRegister.value.file = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

const step = ref(1);
const otp = ref("");
const isLoading = ref(false);

async function handleRegister() {
    const usernameRegex = /^[a-z]{4,15}$/;
    if (!usernameRegex.test(dataRegister.value.username)) {
        toast.warning("Username harus huruf kecil semua, minimal 4 karakter, dan maksimal 15 karakter", "Username Tidak Valid");
        return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(dataRegister.value.email)) {
        toast.warning("Format email tidak valid.", "Email Tidak Valid");
        return;
    }

    try {
        isLoading.value = true;
        await $csrfFetch('/api/auth/register', {
            method: 'POST',
            body: dataRegister.value
        })

        // Kirim OTP
        await $csrfFetch('/api/send-otp', {
            method: 'POST',
            body: { email: dataRegister.value.email, type: 'register' }
        });

        toast.info(`Kode OTP telah dikirim ke ${dataRegister.value.email}`, 'Verifikasi Email');
        step.value = 2; // Pindah ke langkah verifikasi
    } catch (err) {
        toast.error(err.statusMessage || "Terjadi kesalahan saat mendaftar", "Pendaftaran Gagal");
    } finally {
        isLoading.value = false;
    }
}

import { useAuth } from '~/stores/Auth';
const auth = useAuth();

async function handleVerifyOTP() {
    try {
        isLoading.value = true;
        await $csrfFetch('/api/verify-otp', {
            method: 'POST',
            body: { email: dataRegister.value.email, otp: otp.value, type: 'register' }
        })
        await auth.fetchSession();
        toast.success("Akun berhasil terverifikasi! Selamat bergabung di Yappr.", "Pendaftaran Sukses");
        router.push('/');
    } catch (err) {
        toast.error(err.statusMessage || "OTP tidak valid", "Verifikasi Gagal");
    } finally {
        isLoading.value = false;
    }
}

async function handleResendOTP() {
    try {
        isLoading.value = true;
        await $csrfFetch('/api/send-otp', {
            method: 'POST',
            body: { email: dataRegister.value.email, type: 'register' }
        });
        toast.info(`Kode OTP baru telah dikirim ke ${dataRegister.value.email}`, 'OTP Terkirim');
    } catch (err) {
        toast.error(err.statusMessage || "Gagal mengirim ulang OTP", "Pengiriman Gagal");
    } finally {
        isLoading.value = false;
    }
}
</script>

<template>
    <div
        class="bg-[#1a0b2e]/80 backdrop-blur-md/75 p-6 sm:p-8 m-auto flex flex-col w-full max-w-md cyber-panel rounded-2xl border border-purple-800/50/80 relative overflow-hidden">
        <!-- Sci-Fi corner tags -->
        <div class="absolute top-0 left-0 w-16 h-[1px] bg-gradient-to-r from-purple-400 to-transparent"></div>
        <div class="absolute top-0 left-0 h-16 w-[1px] bg-gradient-to-b from-purple-400 to-transparent"></div>
        <div class="absolute bottom-0 right-0 w-16 h-[1px] bg-gradient-to-l from-purple-500 to-transparent"></div>
        <div class="absolute bottom-0 right-0 h-16 w-[1px] bg-gradient-to-t from-purple-500 to-transparent"></div>

        <div class="relative z-10">
            <h1 class="text-2xl font-bold font-orbitron text-white text-center tracking-wider mb-2 glow-text-purple">
                {{ step === 1 ? 'DAFTAR AKUN' : 'VERIFIKASI EMAIL' }}
            </h1>

            <form v-if="step === 1" class="flex flex-col gap-4 text-left" @submit.prevent="handleRegister">

                <!-- Profile Photo Upload -->
                <div class="flex flex-col items-center gap-2 mb-2">
                    <div class="relative group">
                        <div
                            class="w-20 h-20 rounded-full border-2 border-purple-800/50 overflow-hidden bg-purple-900/20 flex items-center justify-center shadow-inner relative group-hover:border-purple-400/60 transition-all duration-300">
                            <img v-if="photoPreview" :src="photoPreview" class="w-full h-full object-cover" />
                            <span v-else class="text-purple-400 text-3xl">👤</span>
                        </div>
                        <label for="photo-upload"
                            class="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-purple-400/30">
                            <span
                                class="text-purple-400 text-[10px] font-orbitron font-bold text-center px-1">UPLOAD</span>
                        </label>
                        <input type="file" id="photo-upload" class="hidden"
                            accept=".jpg,.jpeg,.png,image/jpeg,image/png" @change="handleFileChange" />
                    </div>
                    <span class="text-purple-300 text-[10px] font-mono tracking-wide">AVATAR UPLINK (OPTIONAL)</span>
                </div>

                <div class="flex flex-col gap-1">
                    <label for="username" class="text-purple-300 text-xs font-mono tracking-wider ml-1">USERNAME (4-15
                        lowercase)</label>
                    <input type="text" id="username" placeholder="Masukkan username"
                        class="w-full px-3 py-2 rounded-xl bg-[#1a0b2e]/80 backdrop-blur-md border border-purple-800/50 text-white placeholder-purple-400/70 focus:border-purple-400 focus:bg-[#1a0b2e]/80 backdrop-blur-md focus:outline-none focus:shadow-[0_0_12px_rgba(2,132,199,0.15)] transition duration-300 font-mono text-sm"
                        required v-model="dataRegister.username" />
                </div>

                <div class="flex flex-col gap-1">
                    <label for="email" class="text-purple-300 text-xs font-mono tracking-wider ml-1">EMAIL
                        ADDRESS</label>
                    <input type="email" id="email" placeholder="Masukkan email"
                        class="w-full px-3 py-2 rounded-xl bg-[#1a0b2e]/80 backdrop-blur-md border border-purple-800/50 text-white placeholder-purple-400/70 focus:border-purple-400 focus:bg-[#1a0b2e]/80 backdrop-blur-md focus:outline-none focus:shadow-[0_0_12px_rgba(2,132,199,0.15)] transition duration-300 font-mono text-sm"
                        required v-model="dataRegister.email" />
                </div>

                <div class="flex flex-col gap-1">
                    <label for="password" class="text-purple-300 text-xs font-mono tracking-wider ml-1">PASSWORD
                        KEY</label>
                    <input type="password" id="password" placeholder="Masukkan password"
                        class="w-full px-3 py-2 rounded-xl bg-[#1a0b2e]/80 backdrop-blur-md border border-purple-800/50 text-white placeholder-purple-400/70 focus:border-purple-400 focus:bg-[#1a0b2e]/80 backdrop-blur-md focus:outline-none focus:shadow-[0_0_12px_rgba(2,132,199,0.15)] transition duration-300 font-mono text-sm"
                        required v-model="dataRegister.password" />
                </div>

                <div class="flex flex-col gap-1">
                    <label for="bio" class="text-purple-300 text-xs font-mono tracking-wider ml-1">BIO</label>
                    <textarea id="bio" rows="2" placeholder="Tell us about yourself..."
                        class="w-full px-3 py-2 rounded-xl bg-[#1a0b2e]/80 backdrop-blur-md border border-purple-800/50 text-white placeholder-purple-400/70 focus:border-purple-400 focus:bg-[#1a0b2e]/80 backdrop-blur-md focus:outline-none focus:shadow-[0_0_12px_rgba(2,132,199,0.15)] transition duration-300 resize-none text-sm"
                        v-model="dataRegister.bio"></textarea>
                </div>

                <button type="submit" :disabled="isLoading"
                    class="mt-2 w-full btn-neon-purple font-orbitron font-bold py-3 rounded-xl transition duration-300 shadow-lg tracking-widest text-xs">
                    {{ isLoading ? 'PROSES...' : 'DAFTAR' }}
                </button>

                <p class="text-center font-mono text-[10px] text-purple-300 mt-2">
                    Already registered?
                    <NuxtLink to="/auth/login"
                        class="text-purple-600 hover:text-purple-700 transition-colors hover:underline ml-1">Access
                        Login Di Sini</NuxtLink>
                </p>

            </form>

            <form v-else class="flex flex-col gap-4 text-left" @submit.prevent="handleVerifyOTP">
                <div class="p-3 bg-purple-900/20 border border-purple-700/50 rounded-xl mb-2">
                    <p class="text-purple-100 text-xs leading-relaxed font-mono">
                        Kode OTP telah dikirim ke email: <br>
                        <span class="font-bold text-purple-600">{{ dataRegister.email }}</span>.
                    </p>
                </div>

                <div class="flex flex-col gap-1">
                    <label for="otp" class="text-purple-300 text-xs font-mono tracking-wider ml-1">KODE OTP
                        EMAIL</label>
                    <input type="text" id="otp" placeholder="••••••"
                        class="w-full px-4 py-3 rounded-xl bg-[#1a0b2e]/80 backdrop-blur-md border border-purple-800/50 text-white placeholder-purple-400/70 focus:border-purple-400 focus:bg-[#1a0b2e]/80 backdrop-blur-md focus:outline-none focus:shadow-[0_0_12px_rgba(2,132,199,0.15)] transition duration-300 font-mono tracking-[0.4em] text-center font-bold text-lg"
                        required v-model="otp" />
                </div>

                <button type="submit" :disabled="isLoading"
                    class="mt-2 w-full btn-neon-purple font-orbitron font-bold py-3 rounded-xl transition duration-300 shadow-lg tracking-widest text-xs">
                    {{ isLoading ? 'VALIDATING...' : 'VERIFY' }}
                </button>

                <div class="flex justify-between items-center mt-2 font-mono text-[11px]">
                    <button type="button" @click="handleResendOTP" :disabled="isLoading"
                        class="text-purple-400 hover:text-purple-300 transition-colors underline underline-offset-2">
                        Kirim Ulang OTP
                    </button>
                    <button type="button" @click="step = 1" :disabled="isLoading"
                        class="text-purple-600 hover:text-purple-500 transition-colors">
                        Kembali
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>
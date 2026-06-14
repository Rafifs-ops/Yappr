<script setup>
import { useAuth } from '~/stores/Auth';
const { $csrfFetch } = useNuxtApp();

definePageMeta({
    layout: 'auth'
})

const isLoading = ref(false);

// State untuk menampung input user
const form = reactive({
    email: '',
    password: ''
})

const router = useRouter();
const auth = useAuth();
const login = async () => {
    isLoading.value = true;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(form.email)) {
        alert("Format email tidak valid.");
        return;
    }

    try {
        await $csrfFetch('/api/auth/login', { method: 'POST', body: { email: form.email, password: form.password } })
        await auth.fetchSession()
        router.push('/')
    } catch (e) {
        alert(e.statusMessage || "Terjadi kesalahan saat login");
    }
}
</script>

<template>
    <div
        class="w-full max-w-md p-8 cyber-panel rounded-2xl border border-purple-800/50/80 text-center relative overflow-hidden bg-[#1a0b2e]/80 backdrop-blur-md/75">
        <!-- Sci-Fi corner tags -->
        <div class="absolute top-0 left-0 w-16 h-[1px] bg-gradient-to-r from-purple-400 to-transparent"></div>
        <div class="absolute top-0 left-0 h-16 w-[1px] bg-gradient-to-b from-purple-400 to-transparent"></div>
        <div class="absolute bottom-0 right-0 w-16 h-[1px] bg-gradient-to-l from-purple-500 to-transparent"></div>
        <div class="absolute bottom-0 right-0 h-16 w-[1px] bg-gradient-to-t from-purple-500 to-transparent"></div>

        <div class="relative z-10">
            <div class="mb-4 inline-block rounded-2xl bg-purple-900/30/50 shadow-inner">
                <img src="/images/brand-yappr.png" alt="Yappr Logo" class="mx-auto h-35 w-auto object-contain" />
            </div>

            <h1 class="text-2xl font-bold font-orbitron text-white tracking-wider mb-2 glow-text-purple">
                LOGIN
            </h1>
            <p class="text-purple-300 text-xs font-mono tracking-wide mb-8">Yapping sepuas Anda !!!</p>

            <form @submit.prevent="login" class="space-y-5 text-left">
                <div class="flex flex-col gap-1">
                    <label class="text-purple-300 text-xs font-mono tracking-wider ml-1">EMAIL ADDRESS</label>
                    <input v-model="form.email" type="email" placeholder="user@domain.com"
                        class="w-full px-4 py-3 rounded-xl bg-[#1a0b2e]/80 backdrop-blur-md border border-purple-800/50 text-white placeholder-purple-400/70 focus:border-purple-400 focus:bg-[#1a0b2e]/80 backdrop-blur-md focus:outline-none focus:shadow-[0_0_12px_rgba(2,132,199,0.15)] transition duration-300 font-mono text-sm"
                        required />
                </div>

                <div class="flex flex-col gap-1">
                    <label class="text-purple-300 text-xs font-mono tracking-wider ml-1">PASSWORD</label>
                    <input v-model="form.password" type="password" placeholder="••••••••"
                        class="w-full px-4 py-3 rounded-xl bg-[#1a0b2e]/80 backdrop-blur-md border border-purple-800/50 text-white placeholder-purple-400/70 focus:border-purple-400 focus:bg-[#1a0b2e]/80 backdrop-blur-md focus:outline-none focus:shadow-[0_0_12px_rgba(2,132,199,0.15)] transition duration-300 font-mono text-sm"
                        required />
                </div>

                <button :disabled="isLoading" type="submit"
                    class="w-full btn-neon-purple font-orbitron font-bold py-3.5 rounded-xl transition duration-300 shadow-lg tracking-widest text-sm mt-2">
                    {{ isLoading ? 'Loading...' : 'LOGIN' }}
                </button>
            </form>

            <div class="mt-6 flex flex-col gap-2.5 font-mono text-xs">
                <NuxtLink to="/auth/reset-password"
                    class="text-purple-600 hover:text-purple-700 transition-colors hover:underline">
                    Lupa Password ?
                </NuxtLink>

                <p class="text-purple-300 mt-2">
                    Belum Punya Akun?
                    <NuxtLink to="/auth/register"
                        class="text-purple-600 hover:text-purple-700 font-bold transition-colors underline-offset-4 hover:underline ml-1">
                        Daftar Di sini
                    </NuxtLink>
                </p>
            </div>
        </div>
    </div>
</template>
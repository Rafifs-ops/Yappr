<script setup>
const { $csrfFetch } = useNuxtApp();
definePageMeta({
    layout: 'auth'
})
const router = useRouter();

const step = ref(1);
const email = ref("");
const otp = ref("");
const newPassword = ref("");
const isLoading = ref(false);

async function handleRequestOTP() {
    try {
        isLoading.value = true;
        await $csrfFetch('/api/send-otp', {
            method: 'POST',
            body: { email: email.value, type: 'reset_password' }
        })
        step.value = 2;
    } catch (err) {
        alert(err.statusMessage || "Terjadi kesalahan");
    } finally {
        isLoading.value = false;
    }
}

async function handleResetPassword() {
    try {
        isLoading.value = true;
        await $csrfFetch('/api/reset-password', {
            method: 'POST',
            body: { email: email.value, otp: otp.value, newPassword: newPassword.value }
        })
        alert("Password berhasil diubah. Silakan login.");
        router.push('/auth/login');
    } catch (err) {
        alert(err.statusMessage || "Terjadi kesalahan");
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
                LUPA PASSWORD
            </h1>
            <p class="text-purple-300 text-center text-xs font-mono tracking-wide mb-6">
                {{ step === 1 ? 'LUPA PASSWORD' : 'RESET PASSWORD' }}
            </p>

            <!-- Step Indicator -->
            <div class="flex items-center justify-center gap-3 mb-6 font-mono text-[10px]">
                <span class="px-2.5 py-0.5 rounded border"
                    :class="step === 1 ? 'border-purple-400 text-purple-600 bg-purple-900/200/10 shadow-[0_0_8px_rgba(2,132,199,0.2)]' : 'border-purple-800/50 text-purple-400'">STEP_01</span>
                <div class="w-8 h-[1px]" :class="step === 2 ? 'bg-purple-900/200' : 'bg-slate-200'"></div>
                <span class="px-2.5 py-0.5 rounded border"
                    :class="step === 2 ? 'border-purple-400 text-purple-600 bg-purple-900/200/10 shadow-[0_0_8px_rgba(2,132,199,0.2)]' : 'border-purple-800/50 text-purple-400'">STEP_02</span>
            </div>

            <form v-if="step === 1" class="flex flex-col gap-4 text-left" @submit.prevent="handleRequestOTP">
                <div class="flex flex-col gap-1">
                    <label for="email" class="text-purple-300 text-xs font-mono tracking-wider ml-1">REGISTERED
                        EMAIL</label>
                    <input type="email" id="email" placeholder="user@domain.com"
                        class="w-full px-3 py-2 rounded-xl bg-[#1a0b2e]/80 backdrop-blur-md border border-purple-800/50 text-white placeholder-purple-400/70 focus:border-purple-400 focus:bg-[#1a0b2e]/80 backdrop-blur-md focus:outline-none focus:shadow-[0_0_12px_rgba(2,132,199,0.15)] transition duration-300 font-mono text-sm"
                        required v-model="email" />
                </div>
                <button type="submit" :disabled="isLoading"
                    class="mt-2 w-full btn-neon-purple font-orbitron font-bold py-3 rounded-xl transition duration-300 shadow-lg tracking-widest text-xs">
                    {{ isLoading ? 'LOADING...' : 'KIRIM OTP' }}
                </button>

                <NuxtLink to="/auth/login"
                    class="text-center font-mono text-[10px] text-purple-300 mt-2 hover:text-purple-600 hover:underline transition-colors">
                    Kembali Login
                </NuxtLink>
            </form>

            <form v-else class="flex flex-col gap-4 text-left" @submit.prevent="handleResetPassword">
                <div class="p-3 bg-purple-900/20 border border-purple-700/50 rounded-xl mb-2">
                    <p class="text-purple-100 text-xs leading-relaxed font-mono">
                        KODE OTP BERHASIL DIKIRIM KE: <br>
                        <span class="font-bold text-purple-600">{{ email }}</span>.
                    </p>
                </div>

                <div class="flex flex-col gap-1">
                    <label for="otp" class="text-purple-300 text-xs font-mono tracking-wider ml-1">VERIFICATION
                        OTP</label>
                    <input type="text" id="otp" placeholder="••••••"
                        class="w-full px-4 py-3 rounded-xl bg-[#1a0b2e]/80 backdrop-blur-md border border-purple-800/50 text-white placeholder-purple-400/70 focus:border-purple-400 focus:bg-[#1a0b2e]/80 backdrop-blur-md focus:outline-none focus:shadow-[0_0_12px_rgba(2,132,199,0.15)] transition duration-300 font-mono tracking-[0.4em] text-center font-bold text-lg"
                        required v-model="otp" />
                </div>

                <div class="flex flex-col gap-1">
                    <label for="newPassword" class="text-purple-300 text-xs font-mono tracking-wider ml-1">NEW
                        PASSWORD</label>
                    <input type="password" id="newPassword" placeholder="••••••••"
                        class="w-full px-3 py-2 rounded-xl bg-[#1a0b2e]/80 backdrop-blur-md border border-purple-800/50 text-white placeholder-purple-400/70 focus:border-purple-400 focus:bg-[#1a0b2e]/80 backdrop-blur-md focus:outline-none focus:shadow-[0_0_12px_rgba(2,132,199,0.15)] transition duration-300 font-mono text-sm"
                        required v-model="newPassword" />
                </div>

                <button type="submit" :disabled="isLoading"
                    class="mt-2 w-full btn-neon-purple font-orbitron font-bold py-3 rounded-xl transition duration-300 shadow-lg tracking-widest text-xs">
                    {{ isLoading ? 'LOADING...' : 'UBAH PASSWORD' }}
                </button>
            </form>
        </div>
    </div>
</template>

import { defineStore } from 'pinia';
import { useToast } from '~/composables/useToast';

export const useAuth = defineStore("auth", () => {
    const session = ref(null) // Membuat variable session

    // Mengambil data auth di server
    const fetchSession = async () => {
        const headers = import.meta.server ? useRequestHeaders(['cookie']) as Record<string, string> : {}
        try {
            const data = await $fetch('/api/auth/session', {
                headers,
                credentials: 'include'
            })
            session.value = data as any // Menyimpan data auth di variable session client
        } catch (e) {
            session.value = null // Mengembalikan null jika tidak ada data auth
        }
    }

    // Fungsi logout
    const signOut = async () => {
        const { $csrfFetch } = useNuxtApp();
        const toast = useToast();
        await $csrfFetch('/api/auth/logout', { method: 'POST' });
        session.value = null;
        toast.info('Anda telah keluar dari akun', 'Logout Berhasil');
        await navigateTo('/auth/login');
    }

    return { session, fetchSession, signOut }

})

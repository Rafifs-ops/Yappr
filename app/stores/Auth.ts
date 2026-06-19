import { defineStore } from 'pinia';

export const useAuth = defineStore("auth", () => {
    const { $csrfFetch } = useNuxtApp();
    const session = ref(null) // Membuat variable session

    const headers = import.meta.server ? useRequestHeaders(['cookie']) as Record<string, string> : {}

    // Mengambil data auth di server
    const fetchSession = async () => {
        try {
            const data = await $fetch('/api/auth/session', {
                headers
            })
            session.value = data as any // Menyimpan data auth di variable session client
        } catch (e) {
            session.value = null // Mengembalikan null jika tidak ada data auth
        }
    }

    // Fungsi logout
    const signOut = async () => {
        await $csrfFetch('/api/auth/logout', { method: 'POST' })
        session.value = null
        await navigateTo('/auth/login')
    }

    return { session, fetchSession, signOut }

})

import { useAuth } from '~/stores/Auth';

export default defineNuxtRouteMiddleware(async (to) => {
    const auth = useAuth();
    const publicPages = ['/auth/login', '/auth/register', '/auth/reset-password'];
    const isPublicPages = publicPages.includes(to.path);

    // Selalu coba ambil session jika null, karena cookie httpOnly tidak bisa dibaca di client-side
    if (!auth.session) {
        await auth.fetchSession();
    }

    if (!auth.session && !isPublicPages) {
        return navigateTo('/auth/login');
    } else if (auth.session && isPublicPages) {
        return navigateTo('/');
    }
});
import { useAuth } from '~/stores/Auth';

export default defineNuxtRouteMiddleware(async (to) => {
    const auth = useAuth();
    const token = useCookie('auth_token');
    const publicPages = ['/auth/login', '/auth/register', '/auth/reset-password'];
    const isPublicPages = publicPages.includes(to.path);

    if (!auth.session && token.value) {
        await auth.fetchSession();
    }

    if (!auth.session && !isPublicPages) {
        return navigateTo('/auth/login');
    } else if (auth.session && isPublicPages) {
        return navigateTo('/');
    }
});
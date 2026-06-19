export default defineEventHandler(async (event) => {
    // Menghapus cookie token
    deleteCookie(event, 'auth_token', { path: '/' });
    deleteCookie(event, 'refresh_token', { path: '/' });
    return {
        status: 'berhasil logout'
    }
})

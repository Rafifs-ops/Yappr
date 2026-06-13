export default defineEventHandler(async (event) => {
    // Menghapus cookie token dengan key 'auth_token'
    deleteCookie(event, 'auth_token', { path: '/' })
    return {
        status: 'berhasil logout'
    }
})

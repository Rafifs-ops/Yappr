export default defineEventHandler(async (event) => {
    deleteCookie(event, 'auth_token', { path: '/' })
    return {
        status: 'berhasil logout'
    }
})
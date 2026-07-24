import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'


const config = useRuntimeConfig()

const tursoUrl = (config.tursoDatabaseUrl as string)
    || process.env.DATABASE_TURSO_DATABASE_URL
    || process.env.NUXT_TURSO_DATABASE_URL
    || process.env.TURSO_DATABASE_URL
    || ''

const tursoAuthToken = (config.tursoAuthToken as string)
    || process.env.DATABASE_TURSO_AUTH_TOKEN
    || process.env.NUXT_TURSO_AUTH_TOKEN
    || process.env.TURSO_AUTH_TOKEN
    || ''

// Inisialisasi koneksi libSQL (Turso)
const libsql = createClient({
    url: tursoUrl,
    authToken: tursoAuthToken,
})

// Pasang adapter ke Prisma
const adapter = new PrismaLibSQL(libsql as any)

// Export instance Prisma agar bisa digunakan di seluruh file API Nuxt
export const prisma = new PrismaClient({ adapter })
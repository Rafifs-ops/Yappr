import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'


const config = useRuntimeConfig()

// Inisialisasi koneksi libSQL (Turso)
const libsql = createClient({
    url: config.tursoDatabaseUrl,
    authToken: config.tursoAuthToken,
})

// Pasang adapter ke Prisma
const adapter = new PrismaLibSQL(libsql)

// Export instance Prisma agar bisa digunakan di seluruh file API Nuxt
export const prisma = new PrismaClient({ adapter })
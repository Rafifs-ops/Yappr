import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'


const config = useRuntimeConfig()

// Inisialisasi koneksi libSQL (Turso)
const libsql: any = createClient({
    url: config.tursoDatabaseUrl,
    authToken: config.tursoAuthToken,
})

// Pasang adapter ke Prisma
const adapter = new PrismaLibSql(libsql)

// Export instance Prisma agar bisa digunakan di seluruh file API Nuxt
export const prisma = new PrismaClient({ adapter })
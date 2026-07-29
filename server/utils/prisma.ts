import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client/web' // Gunakan /web untuk Vercel Edge/Serverless

let prisma: PrismaClient
const runtimeConfig = useRuntimeConfig()

if (runtimeConfig.nodeEnv === 'production') {
    // Menggunakan koneksi database dari Turso / LibSQL saat production
    const url = (runtimeConfig.tursoDatabaseUrl || runtimeConfig.databaseUrl || process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || 'file:./dev.db') as string
    const authToken = (runtimeConfig.tursoAuthToken || process.env.TURSO_AUTH_TOKEN) as string | undefined

    const libsql: any = createClient({
        url,
        authToken,
    })

    const adapter = new PrismaLibSQL(libsql)
    prisma = new PrismaClient({ adapter })
} else {
    // Koneksi dev.db lokal saat development
    prisma = new PrismaClient()
}

export { prisma }
export default prisma
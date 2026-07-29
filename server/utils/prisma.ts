import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const config = useRuntimeConfig()

const adapter = new PrismaLibSQL({
    url: config.tursoDatabaseUrl,
    authToken: config.tursoAuthToken,
})

const prisma = new PrismaClient({ adapter })

export { prisma }
export default prisma

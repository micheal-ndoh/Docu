import { defineConfig } from 'prisma/config'

export default defineConfig({
    schema: './schema.prisma',
    connectionString: process.env.DATABASE_URL,
})
// ──────────────────────────────────────
// Prisma Client Singleton (Prisma 7 + pg adapter)
// ──────────────────────────────────────

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Walk up from CWD to find the root .env file
function loadEnv() {
    let dir = process.cwd();
    for (let i = 0; i < 5; i++) {
        const envPath = path.join(dir, ".env");
        if (fs.existsSync(envPath)) {
            dotenv.config({ path: envPath });
            return;
        }
        dir = path.dirname(dir);
    }
    dotenv.config();
}

loadEnv();

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error("DATABASE_URL environment variable is not set");
    }

    // Use standard node-postgres Pool — works reliably in Node.js
    const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

export { PrismaClient };

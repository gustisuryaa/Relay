import { PrismaClient } from '@prisma/client';

// Next.js dev mode hot-reloads modules on every save. Without this guard,
// each reload would create a brand new PrismaClient (and a new DB
// connection pool) while the old one leaks, quickly exhausting Postgres'
// connection limit. Stashing the instance on `globalThis` survives the
// module reload so we reuse the same client in dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

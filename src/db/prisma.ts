import { PrismaClient } from '@prisma/client';

// Determine database URL based on environment
const getDatabaseUrl = () => {
  if (process.env.NODE_ENV === 'test') {
    return 'file:./test.db?mode=memory';
  }
  return process.env.DATABASE_URL;
};

// Singleton pattern for Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

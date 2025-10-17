import { PrismaClient } from '@prisma/client';

declare global {
  // allow global `var` declarations

  var prisma: PrismaClient | undefined;
}

export const db =
  global.prisma ||
  new PrismaClient({
    log: ['query'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') global.prisma = db;

// Log non-sensitive DB host info to help debugging connection issues.
try {
  const raw = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || '';
  if (raw) {
    // Strip known prisma+ prefix
    const safe = raw.replace(/^prisma\+/, '');
    try {
      const u = new URL(safe);
      console.log('[db] connecting to:', { host: u.hostname, port: u.port });
    } catch (e) {
      console.log('[db] database url present but could not parse host (masked)');
    }
  } else {
    console.log('[db] no DATABASE_URL / DIRECT_DATABASE_URL found in environment');
  }
} catch (err) {
  console.error('[db] error while logging DB info', err);
}
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function validateDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL belum diisi. Set environment variable DATABASE_URL ke PostgreSQL cloud sebelum deploy."
    );
  }

  if (process.env.NODE_ENV === "production" && /localhost|127\.0\.0\.1/i.test(databaseUrl)) {
    throw new Error(
      "DATABASE_URL production masih mengarah ke database lokal. Ganti ke PostgreSQL cloud, lalu redeploy."
    );
  }
}

validateDatabaseUrl();

export const prisma = global.prisma ?? new PrismaClient({
  log: ["error"],
});

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

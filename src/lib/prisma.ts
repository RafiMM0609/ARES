// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

/**
 * Prisma Client Singleton Pattern
 * Prevents multiple instances in development (hot reload)
 */
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Generate a UUID for new records
 */
export function generateUUID(): string {
  return randomUUID();
}

/**
 * Get current timestamp in ISO format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Generate invoice number with proper sequence using a transaction to prevent race conditions
 */
export async function generateInvoiceNumber(): Promise<string> {
  const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
  
  // Use a transaction to prevent race conditions
  const invoiceNumber = await prisma.$transaction(async (tx) => {
    // Find the highest sequence number for this month
    const lastInvoice = await tx.invoice.findFirst({
      where: {
        invoiceNumber: {
          startsWith: `INV-${yearMonth}-`,
        },
      },
      orderBy: {
        invoiceNumber: 'desc',
      },
    });

    let sequenceNum = 1;
    if (lastInvoice) {
      const lastSeq = parseInt(lastInvoice.invoiceNumber.slice(-4), 10);
      if (!isNaN(lastSeq)) {
        sequenceNum = lastSeq + 1;
      }
    }

    return `INV-${yearMonth}-${sequenceNum.toString().padStart(4, '0')}`;
  });

  return invoiceNumber;
}

/**
 * Seed initial skills if the table is empty
 */
export async function seedInitialSkills(): Promise<void> {
  const skillCount = await prisma.skill.count();
  
  if (skillCount === 0) {
    const skills = [
      { id: 'skill-001', name: 'JavaScript', category: 'Programming' },
      { id: 'skill-002', name: 'TypeScript', category: 'Programming' },
      { id: 'skill-003', name: 'React', category: 'Framework' },
      { id: 'skill-004', name: 'Next.js', category: 'Framework' },
      { id: 'skill-005', name: 'Node.js', category: 'Backend' },
      { id: 'skill-006', name: 'Python', category: 'Programming' },
      { id: 'skill-007', name: 'UI/UX Design', category: 'Design' },
      { id: 'skill-008', name: 'Graphic Design', category: 'Design' },
      { id: 'skill-009', name: 'Content Writing', category: 'Writing' },
      { id: 'skill-010', name: 'SEO', category: 'Marketing' },
    ];

    // Use individual creates since SQLite doesn't support skipDuplicates
    for (const skill of skills) {
      try {
        await prisma.skill.create({ data: skill });
      } catch {
        // Ignore duplicate errors
      }
    }
  }
}

/**
 * Gracefully disconnect Prisma on app shutdown
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

export default prisma;

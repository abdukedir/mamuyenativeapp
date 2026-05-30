import type { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma';

export const inventoryRepository = {
  findMany(where: Prisma.InventoryTransactionWhereInput, skip: number, take: number) {
    return prisma.inventoryTransaction.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { product: true, supplier: true, createdBy: true },
    });
  },

  count(where: Prisma.InventoryTransactionWhereInput) {
    return prisma.inventoryTransaction.count({ where });
  },
};

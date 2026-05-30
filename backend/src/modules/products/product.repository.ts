import type { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma';

export const productRepository = {
  findMany(where: Prisma.ProductWhereInput, skip: number, take: number) {
    return prisma.product.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { category: true, supplier: true },
    });
  },

  count(where: Prisma.ProductWhereInput) {
    return prisma.product.count({ where });
  },

  findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: { category: true, supplier: true },
    });
  },
};

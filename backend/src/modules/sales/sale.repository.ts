import { prisma } from '../../config/prisma';

export const saleRepository = {
  findMany(skip: number, take: number) {
    return prisma.sale.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } }, createdBy: true },
    });
  },

  count() {
    return prisma.sale.count();
  },

  findById(id: string) {
    return prisma.sale.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, createdBy: true },
    });
  },
};

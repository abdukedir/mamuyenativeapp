import { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma';

export const dashboardService = {
  async summary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalProducts, lowStockProducts, salesAggregate, recentSales, recentInventory] =
      await Promise.all([
        prisma.product.count({ where: { isActive: true } }),
        prisma.product.count({ where: { isActive: true, quantityOnHand: { lte: 5 } } }),
        prisma.sale.aggregate({
          where: { createdAt: { gte: today }, status: 'COMPLETED' },
          _count: { id: true },
          _sum: { totalAmount: true },
        }),
        prisma.sale.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { createdBy: true },
        }),
        prisma.inventoryTransaction.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { product: true },
        }),
      ]);

    const recentActivities = [
      ...recentSales.map((sale) => ({
        id: sale.id,
        type: 'SALE',
        title: sale.saleNumber,
        amount: sale.totalAmount,
        createdAt: sale.createdAt,
      })),
      ...recentInventory.map((item) => ({
        id: item.id,
        type: item.transactionType,
        title: item.product.name,
        amount: new Prisma.Decimal(item.quantity),
        createdAt: item.createdAt,
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5);

    return {
      totalProducts,
      totalSales: salesAggregate._count.id,
      revenue: salesAggregate._sum.totalAmount ?? new Prisma.Decimal(0),
      lowStockProducts,
      recentActivities,
    };
  },
};

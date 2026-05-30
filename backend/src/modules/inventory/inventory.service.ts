import { InventoryTransactionType } from '@prisma/client';

import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/api-error';
import { inventoryRepository } from './inventory.repository';

type InventoryMutation = {
  productId: string;
  transactionType: InventoryTransactionType;
  quantity: number;
  unitCost?: number;
  reference?: string;
  reason?: string;
  supplierId?: string;
};

export const inventoryService = {
  async list(query: { productId?: string; page: number; pageSize: number }) {
    const where = { productId: query.productId };
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      inventoryRepository.findMany(where, skip, query.pageSize),
      inventoryRepository.count(where),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  },

  async mutateStock(data: InventoryMutation, userId: string) {
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: data.productId } });
      if (!product || !product.isActive) {
        throw new ApiError(404, 'Product not found');
      }

      const quantityBefore = product.quantityOnHand;
      const delta =
        data.transactionType === InventoryTransactionType.STOCK_IN ||
        data.transactionType === InventoryTransactionType.RETURN
          ? data.quantity
          : -data.quantity;

      const quantityAfter =
        data.transactionType === InventoryTransactionType.ADJUSTMENT ? data.quantity : quantityBefore + delta;

      if (quantityAfter < 0) {
        throw new ApiError(400, 'Insufficient stock');
      }

      const [transaction] = await Promise.all([
        tx.inventoryTransaction.create({
          data: {
            productId: data.productId,
            transactionType: data.transactionType,
            quantity: data.quantity,
            quantityBefore,
            quantityAfter,
            unitCost: data.unitCost,
            reference: data.reference,
            reason: data.reason,
            supplierId: data.supplierId,
            createdById: userId,
          },
        }),
        tx.product.update({
          where: { id: data.productId },
          data: { quantityOnHand: quantityAfter },
        }),
      ]);

      if (quantityAfter <= product.lowStockThreshold) {
        await tx.notification.create({
          data: {
            notificationType: 'LOW_STOCK',
            title: 'Low stock alert',
            message: `${product.name} is at ${quantityAfter} units.`,
            productId: product.id,
          },
        });
      }

      return transaction;
    });
  },
};

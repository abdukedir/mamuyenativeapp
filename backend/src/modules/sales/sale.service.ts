import { Prisma } from '@prisma/client';

import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/api-error';
import { saleRepository } from './sale.repository';

type SaleItemInput = {
  productId: string;
  quantity: number;
  unitPrice?: number;
  discountAmount: number;
};

type SaleCreateInput = {
  customerName?: string;
  customerPhone?: string;
  discountAmount: number;
  paymentMethod: 'CASH' | 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'OTHER';
  notes?: string;
  items: SaleItemInput[];
};

function saleNumber() {
  return `INV-${Date.now()}`;
}

export const saleService = {
  async list(query: { page: number; pageSize: number }) {
    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      saleRepository.findMany(skip, query.pageSize),
      saleRepository.count(),
    ]);
    return { items, total, page: query.page, pageSize: query.pageSize };
  },

  async get(id: string) {
    const sale = await saleRepository.findById(id);
    if (!sale) {
      throw new ApiError(404, 'Sale not found');
    }
    return sale;
  },

  async create(data: SaleCreateInput, userId: string) {
    return prisma.$transaction(async (tx) => {
      const productIds = data.items.map((item) => item.productId);
      const products = await tx.product.findMany({ where: { id: { in: productIds }, isActive: true } });
      const productMap = new Map(products.map((product) => [product.id, product]));

      let subtotal = new Prisma.Decimal(0);
      const saleItems = data.items.map((item) => {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new ApiError(404, `Product not found: ${item.productId}`);
        }
        if (product.quantityOnHand < item.quantity) {
          throw new ApiError(400, `Insufficient stock for ${product.name}`);
        }

        const unitPrice = new Prisma.Decimal(item.unitPrice ?? product.sellingPrice);
        const discount = new Prisma.Decimal(item.discountAmount);
        const lineTotal = unitPrice.mul(item.quantity).minus(discount);
        subtotal = subtotal.plus(lineTotal);

        return { item, product, unitPrice, discount, lineTotal };
      });

      const discountAmount = new Prisma.Decimal(data.discountAmount);
      const totalAmount = subtotal.minus(discountAmount);
      if (totalAmount.lessThan(0)) {
        throw new ApiError(400, 'Sale total cannot be negative');
      }

      const sale = await tx.sale.create({
        data: {
          saleNumber: saleNumber(),
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          subtotal,
          discountAmount,
          totalAmount,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          createdById: userId,
          items: {
            create: saleItems.map(({ item, unitPrice, discount, lineTotal }) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice,
              discountAmount: discount,
              lineTotal,
            })),
          },
        },
        include: { items: true },
      });

      for (const { item, product } of saleItems) {
        const quantityAfter = product.quantityOnHand - item.quantity;
        await tx.product.update({
          where: { id: product.id },
          data: { quantityOnHand: quantityAfter },
        });
        await tx.inventoryTransaction.create({
          data: {
            productId: product.id,
            transactionType: 'SALE',
            quantity: item.quantity,
            quantityBefore: product.quantityOnHand,
            quantityAfter,
            saleId: sale.id,
            reference: sale.saleNumber,
            createdById: userId,
          },
        });
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
      }

      await tx.notification.create({
        data: {
          notificationType: 'NEW_SALE',
          title: 'New sale created',
          message: `${sale.saleNumber} total: ${totalAmount.toFixed(2)}`,
        },
      });

      return sale;
    });
  },
};

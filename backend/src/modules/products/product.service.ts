import type { Prisma, Role } from '@prisma/client';

import { prisma } from '../../config/prisma';
import { ApiError } from '../../utils/api-error';
import { productRepository } from './product.repository';

type ProductListQuery = {
  search?: string;
  categoryId?: string;
  supplierId?: string;
  lowStock?: boolean;
  page: number;
  pageSize: number;
};

export const productService = {
  async list(query: ProductListQuery) {
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      categoryId: query.categoryId,
      supplierId: query.supplierId,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { sku: { contains: query.search, mode: 'insensitive' } },
              { barcode: { contains: query.search, mode: 'insensitive' } },
              { brand: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    if (query.lowStock) {
      where.quantityOnHand = { lte: 5 };
    }

    const skip = (query.page - 1) * query.pageSize;
    const [items, total] = await Promise.all([
      productRepository.findMany(where, skip, query.pageSize),
      productRepository.count(where),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  },

  async get(id: string) {
    const product = await productRepository.findById(id);
    if (!product || !product.isActive) {
      throw new ApiError(404, 'Product not found');
    }
    return product;
  },

  async create(data: Prisma.ProductUncheckedCreateInput, userId: string, imageUrl?: string) {
    return prisma.product.create({
      data: { ...data, imageUrl, createdById: userId },
    });
  },

  async update(id: string, data: Prisma.ProductUncheckedUpdateInput, imageUrl?: string) {
    await this.get(id);
    return prisma.product.update({
      where: { id },
      data: { ...data, ...(imageUrl ? { imageUrl } : {}) },
    });
  },

  async remove(id: string, role: Role) {
    if (role !== 'ADMIN' && role !== 'STORE_MANAGER') {
      throw new ApiError(403, 'Only admins and store managers can delete products');
    }
    await this.get(id);
    return prisma.product.update({ where: { id }, data: { isActive: false } });
  },
};

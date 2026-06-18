import { Role } from "@prisma/client";
import { Router } from "express";

import { prisma } from "../../config/prisma";
import { authenticate, authorize } from "../../middlewares/auth.middleware";
import { asyncHandler } from "../../utils/async-handler";

export const supplierRoutes = Router();

supplierRoutes.use(authenticate);

supplierRoutes.get(
  "/",
  asyncHandler(async (_req, res) => {
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    res.json(suppliers);
  }),
);

supplierRoutes.post(
  "/",
  authorize(Role.ADMIN, Role.STORE_MANAGER),
  asyncHandler(async (req, res) => {
    const supplier = await prisma.supplier.create({
      data: req.body,
    });

    res.status(201).json(supplier);
  }),
);

supplierRoutes.patch(
  "/:id",
  authorize(Role.ADMIN, Role.STORE_MANAGER),
  asyncHandler(async (req, res) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    const supplier = await prisma.supplier.update({
      where: { id },
      data: req.body,
    });

    res.json(supplier);
  }),
);

supplierRoutes.delete(
  "/:id",
  authorize(Role.ADMIN, Role.STORE_MANAGER),
  asyncHandler(async (req, res) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    await prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });

    res.status(204).send();
  }),
);

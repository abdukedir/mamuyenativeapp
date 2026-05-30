import { asyncHandler } from '../../utils/async-handler';
import { inventoryService } from './inventory.service';

export const inventoryController = {
  list: asyncHandler(async (req, res) => {
    res.json(await inventoryService.list(req.query as never));
  }),

  create: asyncHandler(async (req, res) => {
    const transaction = await inventoryService.mutateStock(req.body, req.user!.id);
    res.status(201).json(transaction);
  }),
};

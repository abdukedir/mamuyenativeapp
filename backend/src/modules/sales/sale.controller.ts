import { asyncHandler } from "../../utils/async-handler";
import { saleService } from "./sale.service";

export const saleController = {
  list: asyncHandler(async (req, res) => {
    res.json(await saleService.list(req.query as never));
  }),

  get: asyncHandler(async (req, res) => {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    res.json(await saleService.get(id));
  }),

  create: asyncHandler(async (req, res) => {
    const sale = await saleService.create(req.body, req.user!.id);

    res.status(201).json(sale);
  }),
};

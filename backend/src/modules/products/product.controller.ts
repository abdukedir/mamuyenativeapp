import { asyncHandler } from '../../utils/async-handler';
import { productService } from './product.service';

export const productController = {
  list: asyncHandler(async (req, res) => {
    res.json(await productService.list(req.query as never));
  }),

  get: asyncHandler(async (req, res) => {
    res.json(await productService.get(req.params.id));
  }),

  create: asyncHandler(async (req, res) => {
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const product = await productService.create(req.body, req.user!.id, imageUrl);
    res.status(201).json(product);
  }),

  update: asyncHandler(async (req, res) => {
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    res.json(await productService.update(req.params.id, req.body, imageUrl));
  }),

  remove: asyncHandler(async (req, res) => {
    await productService.remove(req.params.id, req.user!.role);
    res.status(204).send();
  }),
};

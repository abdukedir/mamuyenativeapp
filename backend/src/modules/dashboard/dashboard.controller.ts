import { asyncHandler } from '../../utils/async-handler';
import { dashboardService } from './dashboard.service';

export const dashboardController = {
  summary: asyncHandler(async (_req, res) => {
    res.json(await dashboardService.summary());
  }),
};

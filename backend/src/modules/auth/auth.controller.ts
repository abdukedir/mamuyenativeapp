import { asyncHandler } from '../../utils/async-handler';
import { authService } from './auth.service';

export const authController = {
  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body.email, req.body.password);
    res.json(result);
  }),

  refresh: asyncHandler(async (req, res) => {
    const result = await authService.refresh(req.body.refreshToken);
    res.json(result);
  }),

  logout: asyncHandler(async (req, res) => {
    await authService.logout(req.body.refreshToken);
    res.status(204).send();
  }),

  profile: asyncHandler(async (req, res) => {
    const profile = await authService.profile(req.user!.id);
    res.json(profile);
  }),

  changePassword: asyncHandler(async (req, res) => {
    await authService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
    res.status(204).send();
  }),
};

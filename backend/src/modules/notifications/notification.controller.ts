import { prisma } from '../../config/prisma';
import { asyncHandler } from '../../utils/async-handler';

export const notificationController = {
  list: asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { OR: [{ recipientId: req.user!.id }, { recipientId: null }] },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(notifications);
  }),
};

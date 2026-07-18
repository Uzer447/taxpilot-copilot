import { Router } from 'express';
import { requireAuth } from '../auth/authMiddleware.js';
import prisma from '../shared/db.js';

const router = Router();

router.get('/history', requireAuth, async (req, res, next) => {
  try {
    const sessions = await prisma.filingSession.findMany({
      where: { userId: req.user.userId },
      include: {
        reviews: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, sessions });
  } catch (err) {
    next(err);
  }
});

export default router;

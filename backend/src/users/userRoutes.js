import { Router } from 'express';
import { requireAuth } from '../auth/authMiddleware.js';
import prisma from '../shared/db.js';

const router = Router();

router.get('/dashboard', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    // Get document count
    const docCount = await prisma.document.count({ where: { userId } });
    
    // Get reviews to calculate health score and pending actions
    const sessions = await prisma.filingSession.findMany({
      where: { userId },
      include: { reviews: true }
    });
    
    let pendingReviews = 0;
    let latestHealthScore = null;
    
    if (sessions.length > 0) {
      const activeSession = sessions[sessions.length - 1];
      pendingReviews = activeSession.status === 'in_progress' ? 1 : 0;
      
      if (activeSession.reviews.length > 0) {
        latestHealthScore = activeSession.reviews[activeSession.reviews.length - 1].healthScore;
      }
    }
    
    res.json({
      success: true,
      data: {
        healthScore: latestHealthScore || 0,
        documentsCount: docCount,
        pendingReviews,
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;

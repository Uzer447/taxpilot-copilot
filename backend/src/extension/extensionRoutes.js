import { Router } from 'express';
import { requireAuth } from '../auth/authMiddleware.js';
import { getIO } from '../socket.js';

const router = Router();

router.post('/context', requireAuth, (req, res) => {
  const { domData, screenshot, pageTitle, pageUrl } = req.body;
  const userId = req.user.userId;
  
  const io = getIO();
  io.to(`user_${userId}`).emit('website:live_review_context', {
    domData,
    screenshot,
    pageTitle,
    pageUrl,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, message: 'Context broadcasted to live session' });
});

export default router;

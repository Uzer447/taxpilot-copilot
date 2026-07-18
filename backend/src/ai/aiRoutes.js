import { Router } from 'express';
import { requireAuth } from '../auth/authMiddleware.js';
import prisma from '../shared/db.js';
import { chatWithCopilot } from '../gemini.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const conversations = await prisma.aIConversation.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, createdAt: true }
    });
    res.json({ success: true, conversations });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const conversation = await prisma.aIConversation.findUnique({
      where: { id: req.params.id, userId: req.user.userId }
    });
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }
    res.json({ success: true, conversation: { ...conversation, messages: JSON.parse(conversation.messages) } });
  } catch (err) {
    next(err);
  }
});

router.post('/chat', requireAuth, async (req, res, next) => {
  try {
    const { message, liveContext, conversationId } = req.body;
    
    // Fetch all extracted text from user's uploaded documents
    const userDocs = await prisma.document.findMany({
      where: { userId: req.user.userId }
    });
    
    let documentContext = null;
    if (userDocs.length > 0) {
      documentContext = userDocs
        .map(doc => `--- ${doc.name} ---\n${doc.extractedText}`)
        .join('\n\n');
    }

    // Load existing history if conversationId is provided
    let history = [];
    let conversation = null;
    if (conversationId) {
      conversation = await prisma.aIConversation.findUnique({
        where: { id: conversationId, userId: req.user.userId }
      });
      if (conversation) {
        history = JSON.parse(conversation.messages);
      }
    }

    const aiResponse = await chatWithCopilot({
      message,
      documentContext,
      liveContext,
      history
    });

    const newMessages = [
      ...history,
      { role: 'user', content: message },
      { role: 'assistant', content: aiResponse }
    ];

    if (conversation) {
      await prisma.aIConversation.update({
        where: { id: conversationId },
        data: { messages: JSON.stringify(newMessages) }
      });
    } else {
      conversation = await prisma.aIConversation.create({
        data: {
          userId: req.user.userId,
          title: message.substring(0, 40) + '...',
          messages: JSON.stringify(newMessages)
        }
      });
    }

    res.json({
      success: true,
      reply: aiResponse,
      conversationId: conversation.id
    });
  } catch (err) {
    next(err);
  }
});

export default router;

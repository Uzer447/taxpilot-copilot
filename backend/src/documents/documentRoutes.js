import { Router } from 'express';
import { requireAuth } from '../auth/authMiddleware.js';
import prisma from '../shared/db.js';
import multer from 'multer';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const documents = await prisma.document.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, type: true, createdAt: true } // Exclude large text blob from list
    });
    res.json({ success: true, documents });
  } catch (err) {
    next(err);
  }
});

router.post('/upload', requireAuth, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    
    // Parse the PDF text
    const parser = new pdfParse.PDFParse({ data: req.file.buffer });
    const pdfData = await parser.getText();
    const textContent = pdfData.text || '';
    
    if (!textContent.trim()) {
      return res.status(400).json({ success: false, error: 'Could not extract text from PDF.' });
    }

    const doc = await prisma.document.create({
      data: {
        userId: req.user.userId,
        name: req.file.originalname,
        type: 'unknown',
        extractedText: textContent,
      }
    });
    
    res.json({ success: true, document: { id: doc.id, name: doc.name } });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    await prisma.document.delete({
      where: { id: req.params.id, userId: req.user.userId }
    });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;

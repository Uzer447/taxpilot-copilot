/**
 * TaxPilot Copilot — Express Server
 *
 * Main entry point for the backend. Handles:
 * - CORS for Chrome extension requests
 * - POST /api/explain-page — full page analysis (with optional document context)
 * - POST /api/explain-selection — selected text analysis
 * - POST /api/documents/session — create a new upload session
 * - POST /api/documents/upload — upload a PDF document
 * - GET /api/documents/:sessionId — list documents for a session
 * - DELETE /api/documents/:sessionId/:documentId — remove a document
 * - Error handling middleware
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { validateRequest, explainPageSchema, explainSelectionSchema, VALID_DOC_TYPES } from './validate.js';
import { explainPage, explainSelection } from './gemini.js';
import {
  createSession,
  sessionExists,
  addDocument,
  getDocuments,
  removeDocument,
  getDocumentContext,
  MAX_FILE_SIZE,
} from './documents.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Multer config: store uploaded files in memory (Buffer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are accepted.'));
    }
  },
});

// ── Middleware ──────────────────────────────────────────────

// Allow requests from Chrome extensions and localhost
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests from Chrome extensions and no-origin (e.g., curl)
    if (!origin || origin.startsWith('chrome-extension://') || origin.startsWith('http://localhost')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
}));

// Parse JSON with a 10MB limit (base64 screenshots can be large)
app.use(express.json({ limit: '10mb' }));

// ── Health Check ───────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TaxPilot Copilot Backend',
    version: '1.1.0',
    timestamp: new Date().toISOString(),
  });
});

// ── Document Routes ────────────────────────────────────────

/**
 * POST /api/documents/session
 *
 * Create a new upload session and return the session ID.
 */
app.post('/api/documents/session', (req, res) => {
  const sessionId = createSession();
  res.json({ success: true, sessionId });
});

/**
 * POST /api/documents/upload
 *
 * Upload a PDF document to an existing session.
 * Expects multipart/form-data with:
 * - file: PDF file
 * - sessionId: string
 * - type: 'form16' | 'salary_slip'
 */
app.post('/api/documents/upload', upload.single('file'), async (req, res, next) => {
  try {
    const { sessionId, type } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'sessionId is required.' });
    }

    if (!sessionExists(sessionId)) {
      return res.status(404).json({ success: false, error: 'Session not found. Please create a new session.' });
    }

    if (!type || !VALID_DOC_TYPES.includes(type)) {
      return res.status(400).json({ success: false, error: `Invalid document type. Supported: ${VALID_DOC_TYPES.join(', ')}` });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded. Please attach a PDF file.' });
    }

    console.log(`[upload] Uploading ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)}KB) as ${type}`);

    const document = await addDocument(sessionId, {
      filename: req.file.originalname,
      type,
      pdfBuffer: req.file.buffer,
    });

    res.json({ success: true, document });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/documents/:sessionId
 *
 * List all documents for a session.
 */
app.get('/api/documents/:sessionId', (req, res) => {
  const { sessionId } = req.params;

  if (!sessionExists(sessionId)) {
    return res.json({ success: true, documents: [], sessionValid: false });
  }

  const documents = getDocuments(sessionId);
  res.json({ success: true, documents, sessionValid: true });
});

/**
 * DELETE /api/documents/:sessionId/:documentId
 *
 * Remove a specific document from a session.
 */
app.delete('/api/documents/:sessionId/:documentId', (req, res, next) => {
  try {
    const { sessionId, documentId } = req.params;
    const filename = removeDocument(sessionId, documentId);
    res.json({ success: true, message: `Removed ${filename}` });
  } catch (error) {
    next(error);
  }
});

// ── Analysis Routes ────────────────────────────────────────

/**
 * POST /api/explain-page
 *
 * Accepts a screenshot and DOM data, returns structured
 * explanations for every visible field on the page.
 * Optionally includes document context if sessionId is provided.
 */
app.post('/api/explain-page', validateRequest(explainPageSchema), async (req, res, next) => {
  try {
    const { screenshot, domData, pageTitle, pageUrl, sessionId } = req.validatedBody;

    // Retrieve document context if session exists
    let documentContext = null;
    if (sessionId && sessionExists(sessionId)) {
      documentContext = getDocumentContext(sessionId);
    }

    const hasDocuments = !!documentContext;
    console.log(`[explain-page] Analyzing: ${pageTitle} (${pageUrl}) | Documents: ${hasDocuments ? 'YES' : 'NO'}`);
    const startTime = Date.now();

    const result = await explainPage({ screenshot, domData, pageTitle, pageUrl, documentContext });

    const duration = Date.now() - startTime;
    console.log(`[explain-page] Completed in ${duration}ms — ${result.fields?.length || 0} fields detected`);

    res.json({
      success: true,
      data: result,
      meta: {
        processingTimeMs: duration,
        fieldsDetected: result.fields?.length || 0,
        hasDocuments,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/explain-selection
 *
 * Accepts selected text and page context, returns a
 * detailed explanation of the selected field/text.
 */
app.post('/api/explain-selection', validateRequest(explainSelectionSchema), async (req, res, next) => {
  try {
    const { selectedText, domData, pageTitle, pageUrl, screenshot, sessionId } = req.validatedBody;

    // Retrieve document context if session exists
    let documentContext = null;
    if (sessionId && sessionExists(sessionId)) {
      documentContext = getDocumentContext(sessionId);
    }

    console.log(`[explain-selection] Explaining: "${selectedText.substring(0, 50)}..." on ${pageTitle}`);
    const startTime = Date.now();

    const result = await explainSelection({ selectedText, domData, pageTitle, pageUrl, screenshot, documentContext });

    const duration = Date.now() - startTime;
    console.log(`[explain-selection] Completed in ${duration}ms`);

    res.json({
      success: true,
      data: result,
      meta: {
        processingTimeMs: duration,
        selectedText: selectedText.substring(0, 100),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ── Error Handling ─────────────────────────────────────────

// Multer file size error
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: `File size exceeds the ${MAX_FILE_SIZE / (1024 * 1024)}MB limit.`,
      });
    }
    return res.status(400).json({
      success: false,
      error: 'Upload error',
      message: err.message,
    });
  }
  next(err);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} does not exist`,
  });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error('[Error]', err.message);

  // Gemini API errors
  if (err.message?.includes('API_KEY') || err.message?.includes('GEMINI')) {
    return res.status(500).json({
      success: false,
      error: 'API Configuration Error',
      message: err.message,
    });
  }

  // Rate limiting from Gemini
  if (err.status === 429 || err.message?.includes('429') || err.message?.includes('quota')) {
    return res.status(429).json({
      success: false,
      error: 'Rate Limit Exceeded',
      message: 'Too many requests. Please wait a moment and try again.',
    });
  }

  // Generic error
  res.status(err.status || 500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production'
      ? 'Something went wrong. Please try again.'
      : err.message,
  });
});

// ── Start Server ───────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║       TaxPilot Copilot Backend           ║
  ║                v1.1.0                    ║
  ║                                          ║
  ║   Server running on port ${PORT}            ║
  ║   Health: http://localhost:${PORT}/api/health ║
  ║                                          ║
  ║   Model: ${process.env.GEMINI_MODEL || 'gemini-2.5-flash'}              ║
  ╚══════════════════════════════════════════╝
  `);
});

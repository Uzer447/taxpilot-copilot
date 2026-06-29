/**
 * TaxPilot Copilot — Express Server
 *
 * Main entry point for the backend. Handles:
 * - CORS for Chrome extension requests
 * - POST /api/explain-page — full page analysis
 * - POST /api/explain-selection — selected text analysis
 * - Error handling middleware
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { validateRequest, explainPageSchema, explainSelectionSchema } from './validate.js';
import { explainPage, explainSelection } from './gemini.js';

const app = express();
const PORT = process.env.PORT || 3000;

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
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ─────────────────────────────────────────────────

/**
 * POST /api/explain-page
 *
 * Accepts a screenshot and DOM data, returns structured
 * explanations for every visible field on the page.
 */
app.post('/api/explain-page', validateRequest(explainPageSchema), async (req, res, next) => {
  try {
    const { screenshot, domData, pageTitle, pageUrl } = req.validatedBody;

    console.log(`[explain-page] Analyzing: ${pageTitle} (${pageUrl})`);
    const startTime = Date.now();

    const result = await explainPage({ screenshot, domData, pageTitle, pageUrl });

    const duration = Date.now() - startTime;
    console.log(`[explain-page] Completed in ${duration}ms — ${result.fields?.length || 0} fields detected`);

    res.json({
      success: true,
      data: result,
      meta: {
        processingTimeMs: duration,
        fieldsDetected: result.fields?.length || 0,
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
    const { selectedText, domData, pageTitle, pageUrl, screenshot } = req.validatedBody;

    console.log(`[explain-selection] Explaining: "${selectedText.substring(0, 50)}..." on ${pageTitle}`);
    const startTime = Date.now();

    const result = await explainSelection({ selectedText, domData, pageTitle, pageUrl, screenshot });

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
  ║                                          ║
  ║   Server running on port ${PORT}            ║
  ║   Health: http://localhost:${PORT}/api/health ║
  ║                                          ║
  ║   Model: ${process.env.GEMINI_MODEL || 'gemini-2.5-flash'}              ║
  ╚══════════════════════════════════════════╝
  `);
});

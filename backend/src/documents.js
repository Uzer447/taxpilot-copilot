/**
 * TaxPilot Copilot — Document Store
 *
 * In-memory session-based document storage for V1.
 * Handles:
 * - Session creation and management
 * - PDF upload and text extraction via pdf-parse
 * - Document CRUD operations
 * - Building document context strings for prompt injection
 * - Auto-cleanup of expired sessions
 */

import { randomUUID } from 'crypto';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

// ── In-Memory Store ────────────────────────────────────────

/**
 * Map<sessionId, {
 *   documents: Array<{
 *     id: string,
 *     filename: string,
 *     type: string,       // 'form16' | 'salary_slip'
 *     uploadedAt: string,
 *     textContent: string,
 *     pageCount: number,
 *     textLength: number,
 *   }>,
 *   createdAt: Date,
 *   lastAccess: Date,
 * }>
 */
const sessions = new Map();

// Session TTL: 2 hours
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

// Max documents per session
const MAX_DOCUMENTS = 3;

// Max file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Supported document types
const DOCUMENT_TYPES = ['form16', 'salary_slip'];

// Human-readable labels for document types
const TYPE_LABELS = {
  form16: 'Form 16',
  salary_slip: 'Salary Slip',
};

// ── Session Management ─────────────────────────────────────

/**
 * Create a new session and return its ID.
 */
export function createSession() {
  const sessionId = randomUUID();
  sessions.set(sessionId, {
    documents: [],
    createdAt: new Date(),
    lastAccess: new Date(),
  });
  console.log(`[Documents] Session created: ${sessionId}`);
  return sessionId;
}

/**
 * Check if a session exists and is valid.
 */
export function sessionExists(sessionId) {
  return sessions.has(sessionId);
}

/**
 * Touch a session to update its last access time.
 */
function touchSession(sessionId) {
  const session = sessions.get(sessionId);
  if (session) {
    session.lastAccess = new Date();
  }
}

// ── Document CRUD ──────────────────────────────────────────

/**
 * Add a document to a session.
 * Extracts text from the PDF buffer and stores it.
 *
 * @param {string} sessionId
 * @param {object} params
 * @param {string} params.filename - Original filename
 * @param {string} params.type - Document type ('form16' | 'salary_slip')
 * @param {Buffer} params.pdfBuffer - Raw PDF file buffer
 * @returns {object} The created document metadata
 */
export async function addDocument(sessionId, { filename, type, pdfBuffer }) {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found. Please create a new session.');
  }

  if (session.documents.length >= MAX_DOCUMENTS) {
    throw new Error(`Maximum ${MAX_DOCUMENTS} documents per session. Remove a document before uploading another.`);
  }

  if (pdfBuffer.length > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit.`);
  }

  if (!DOCUMENT_TYPES.includes(type)) {
    throw new Error(`Invalid document type. Supported types: ${DOCUMENT_TYPES.join(', ')}`);
  }

  // Extract text from PDF
  let textContent = '';
  let pageCount = 0;

  try {
    const parser = new pdfParse.PDFParse({ data: pdfBuffer });
    const pdfData = await parser.getText();
    textContent = pdfData.text || '';
    pageCount = pdfData.total || 0;
    console.log(`[Documents] Extracted ${textContent.length} chars from ${pageCount} pages: ${filename}`);
  } catch (parseError) {
    console.error(`[Documents] PDF parse error for ${filename}:`, parseError.message);
    throw new Error('Failed to extract text from PDF. The file may be corrupted, password-protected, or a scanned image.');
  }

  if (!textContent.trim()) {
    throw new Error('No text could be extracted from this PDF. It may be a scanned image. Please upload a digitally-generated PDF.');
  }

  const document = {
    id: randomUUID(),
    filename,
    type,
    typeLabel: TYPE_LABELS[type] || type,
    uploadedAt: new Date().toISOString(),
    textContent,
    pageCount,
    textLength: textContent.length,
  };

  session.documents.push(document);
  touchSession(sessionId);

  console.log(`[Documents] Added document: ${filename} (${type}) to session ${sessionId}`);

  // Return metadata without the full text content
  return {
    id: document.id,
    filename: document.filename,
    type: document.type,
    typeLabel: document.typeLabel,
    uploadedAt: document.uploadedAt,
    pageCount: document.pageCount,
    textLength: document.textLength,
  };
}

/**
 * Get all documents for a session (metadata only, no text content).
 */
export function getDocuments(sessionId) {
  const session = sessions.get(sessionId);
  if (!session) {
    return [];
  }

  touchSession(sessionId);

  return session.documents.map(doc => ({
    id: doc.id,
    filename: doc.filename,
    type: doc.type,
    typeLabel: doc.typeLabel,
    uploadedAt: doc.uploadedAt,
    pageCount: doc.pageCount,
    textLength: doc.textLength,
  }));
}

/**
 * Remove a specific document from a session.
 */
export function removeDocument(sessionId, documentId) {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found.');
  }

  const index = session.documents.findIndex(doc => doc.id === documentId);
  if (index === -1) {
    throw new Error('Document not found.');
  }

  const removed = session.documents.splice(index, 1)[0];
  touchSession(sessionId);

  console.log(`[Documents] Removed document: ${removed.filename} from session ${sessionId}`);
  return removed.filename;
}

// ── Document Context for Prompts ───────────────────────────

/**
 * Build a formatted document context string for injection into AI prompts.
 * Returns null if no documents are uploaded.
 *
 * @param {string} sessionId
 * @returns {string|null} Formatted document text, or null
 */
export function getDocumentContext(sessionId) {
  const session = sessions.get(sessionId);
  if (!session || session.documents.length === 0) {
    return null;
  }

  touchSession(sessionId);

  let context = '=== USER\'S UPLOADED TAX DOCUMENTS ===\n\n';
  context += `Total documents uploaded: ${session.documents.length}\n\n`;

  for (const doc of session.documents) {
    context += `--- ${doc.typeLabel} (${doc.filename}) ---\n`;
    context += `Uploaded: ${doc.uploadedAt}\n`;
    context += `Pages: ${doc.pageCount}\n\n`;
    // Truncate very long documents to avoid token limits
    const maxChars = 15000;
    if (doc.textContent.length > maxChars) {
      context += doc.textContent.substring(0, maxChars);
      context += '\n\n[... Document truncated due to length ...]\n';
    } else {
      context += doc.textContent;
    }
    context += '\n\n';
  }

  context += '=== END OF UPLOADED DOCUMENTS ===';

  return context;
}

// ── Auto-Cleanup ───────────────────────────────────────────

/**
 * Purge sessions older than SESSION_TTL_MS.
 */
function cleanupExpiredSessions() {
  const now = Date.now();
  let cleaned = 0;

  for (const [sessionId, session] of sessions) {
    if (now - session.lastAccess.getTime() > SESSION_TTL_MS) {
      sessions.delete(sessionId);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    console.log(`[Documents] Cleaned up ${cleaned} expired session(s). Active sessions: ${sessions.size}`);
  }
}

// Run cleanup every 30 minutes
setInterval(cleanupExpiredSessions, 30 * 60 * 1000);

// ── Exports for Constants ──────────────────────────────────

export { DOCUMENT_TYPES, TYPE_LABELS, MAX_DOCUMENTS, MAX_FILE_SIZE };

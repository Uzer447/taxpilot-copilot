/**
 * TaxPilot Copilot — Request Validation (Zod)
 *
 * Validates incoming requests from the Chrome extension
 * before forwarding to the Gemini API.
 */

import { z } from 'zod';

/**
 * Schema for DOM data — kept permissive since this data is
 * just forwarded to the LLM for analysis. The content script
 * may return varying shapes depending on the page.
 */
const domDataSchema = z.object({}).passthrough().optional().default({});

/**
 * Schema for the "Explain Page" request.
 */
export const explainPageSchema = z.object({
  screenshot: z.string().min(1, 'Screenshot is required'),
  domData: domDataSchema,
  pageTitle: z.string().optional().default('Unknown Page'),
  pageUrl: z.string().optional().default(''),
  sessionId: z.string().optional(),
});

/**
 * Schema for the "Explain Selection" request.
 */
export const explainSelectionSchema = z.object({
  selectedText: z.string().min(1, 'Selected text is required'),
  domData: domDataSchema,
  pageTitle: z.string().optional().default('Unknown Page'),
  pageUrl: z.string().optional().default(''),
  screenshot: z.string().optional(),
  sessionId: z.string().optional(),
});

/**
 * Valid document types for upload.
 */
export const VALID_DOC_TYPES = ['form16', 'salary_slip'];

/**
 * Middleware factory that validates request body against a Zod schema.
 */
export function validateRequest(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      console.error('[Validation Error]', JSON.stringify(errors, null, 2));
      return res.status(400).json({
        error: 'Validation failed',
        message: errors.map(e => `${e.field}: ${e.message}`).join('; '),
        details: errors,
      });
    }
    req.validatedBody = result.data;
    next();
  };
}

/**
 * TaxPilot Copilot — Gemini API Client
 *
 * Handles communication with the Gemini API for
 * page explanation and selection explanation.
 *
 * V1: Now supports document context injection for
 * personalized recommendations.
 */

import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT, buildPagePrompt, buildSelectionPrompt } from './prompt.js';

let ai = null;

/**
 * Initialize the Gemini client (lazy singleton).
 */
function getClient() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_api_key_here') {
      throw new Error(
        'GEMINI_API_KEY is not configured. Please set it in your .env file.\n' +
        'Get your API key at: https://aistudio.google.com/apikey'
      );
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

/**
 * Get the configured model name.
 */
function getModel() {
  return process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
}

/**
 * Execute generateContent with a fallback model on rate limits (429).
 */
async function generateWithFallback(client, requestConfig) {
  try {
    return await client.models.generateContent(requestConfig);
  } catch (error) {
    if (error.status === 429 || error.status === 404 || error?.message?.includes('429') || error?.message?.includes('quota') || error?.message?.includes('not found')) {
      const fallbackModel = 'gemini-2.5-flash-lite';
      console.warn(`[TaxPilot] Model ${requestConfig.model} hit rate limit. Falling back to ${fallbackModel}...`);
      requestConfig.model = fallbackModel;
      return await client.models.generateContent(requestConfig);
    }
    throw error;
  }
}

/**
 * Explain an entire page using screenshot + DOM data + optional document context.
 *
 * @param {string} screenshot - Base64-encoded screenshot (data URL or raw base64)
 * @param {object} domData - Extracted DOM data from the content script
 * @param {string} pageTitle - Title of the current page
 * @param {string} pageUrl - URL of the current page
 * @param {string|null} documentContext - Extracted text from uploaded documents
 * @returns {object} Structured JSON explanation
 */
export async function explainPage({ screenshot, domData, pageTitle, pageUrl, documentContext }) {
  const client = getClient();
  const model = getModel();

  // Strip data URL prefix if present to get raw base64
  const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, '');

  const userPrompt = buildPagePrompt({ pageTitle, pageUrl, domData, documentContext });

  const response = await generateWithFallback(client, {
    model,
    contents: [
      {
        role: 'user',
        parts: [
          { text: userPrompt },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data,
            },
          },
        ],
      },
    ],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: 'application/json',
    },
  });

  return parseGeminiResponse(response);
}

/**
 * Explain selected text using context from the page + optional document context.
 *
 * @param {string} selectedText - The text the user selected
 * @param {object} domData - Extracted DOM data from the content script
 * @param {string} pageTitle - Title of the current page
 * @param {string} pageUrl - URL of the current page
 * @param {string} [screenshot] - Optional screenshot for additional context
 * @param {string|null} documentContext - Extracted text from uploaded documents
 * @returns {object} Structured JSON explanation
 */
export async function explainSelection({ selectedText, domData, pageTitle, pageUrl, screenshot, documentContext }) {
  const client = getClient();
  const model = getModel();

  const userPrompt = buildSelectionPrompt({ selectedText, pageTitle, pageUrl, domData, documentContext });

  const parts = [{ text: userPrompt }];

  // Attach screenshot if provided
  if (screenshot) {
    const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, '');
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: base64Data,
      },
    });
  }

  const response = await generateWithFallback(client, {
    model,
    contents: [
      {
        role: 'user',
        parts,
      },
    ],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: 'application/json',
    },
  });

  return parseGeminiResponse(response);
}

/**
 * Parse and validate the Gemini API response.
 * V1: Now handles additional fields (recommendations, inconsistencies, missingDocuments).
 */
function parseGeminiResponse(response) {
  const text = response.text;

  if (!text) {
    throw new Error('Empty response from Gemini API');
  }

  try {
    const parsed = JSON.parse(text);

    // Basic structural validation
    if (!parsed.pageTitle || !parsed.pageSummary) {
      console.warn('Response missing pageTitle or pageSummary, using defaults');
      parsed.pageTitle = parsed.pageTitle || 'Unknown Page';
      parsed.pageSummary = parsed.pageSummary || 'Unable to generate summary for this page.';
    }

    if (!Array.isArray(parsed.fields)) {
      parsed.fields = [];
    }

    // V1 fields: ensure graceful defaults
    if (!Array.isArray(parsed.inconsistencies)) {
      parsed.inconsistencies = [];
    }

    if (!Array.isArray(parsed.missingDocuments)) {
      parsed.missingDocuments = [];
    }

    // documentsSummary is optional — only present when documents were used
    if (typeof parsed.documentsSummary !== 'string') {
      parsed.documentsSummary = null;
    }

    return parsed;
  } catch (parseError) {
    console.error('Failed to parse Gemini response as JSON:', text.substring(0, 500));
    throw new Error('Failed to parse AI response. The model returned invalid JSON.');
  }
}

/**
 * TaxPilot Copilot — RAG Retrieval Pipeline
 *
 * Lightweight keyword-based retrieval system that matches the
 * current page context against the tax knowledge base.
 *
 * Strategy:
 * 1. Extract search terms from page title, URL, DOM field labels, and values
 * 2. Score each tax rule by counting keyword overlaps
 * 3. Return the top N most relevant rules
 * 4. Format them for prompt injection
 *
 * No vector DB, no embeddings — just fast deterministic matching.
 * Runs in <50ms typically. Can upgrade to embeddings in V3.
 */

import TAX_RULES from './tax-rules.js';

// Maximum number of rules to include in the prompt
const MAX_RULES = 7;

// Minimum score for a rule to be considered relevant
const MIN_SCORE = 1;

/**
 * Extract search terms from the page context.
 * Returns a set of lowercase terms for matching.
 */
function extractSearchTerms({ pageTitle, pageUrl, domData }) {
  const terms = new Set();

  // Helper: add all words from a string (lowercase, 3+ chars)
  function addWords(text) {
    if (!text) return;
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9₹\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3);
    words.forEach(w => terms.add(w));
  }

  // Helper: add full phrase (for multi-word matching)
  function addPhrase(text) {
    if (!text) return;
    terms.add(text.toLowerCase().trim());
  }

  // 1. Page title
  addWords(pageTitle);
  addPhrase(pageTitle);

  // 2. URL path segments
  if (pageUrl) {
    try {
      const url = new URL(pageUrl);
      addWords(url.pathname.replace(/[/\-_]/g, ' '));
    } catch { /* ignore invalid URLs */ }
  }

  // 3. DOM field labels and values
  if (domData?.fields && Array.isArray(domData.fields)) {
    for (const field of domData.fields) {
      addWords(field.label || field.name);
      addPhrase(field.label || field.name);
      addWords(field.value);
      addWords(field.placeholder);
    }
  }

  // 4. Headings from DOM
  if (domData?.headings && Array.isArray(domData.headings)) {
    for (const heading of domData.headings) {
      addWords(heading.text || heading);
      addPhrase(heading.text || heading);
    }
  }

  // 5. Table headers if present
  if (domData?.tables && Array.isArray(domData.tables)) {
    for (const table of domData.tables) {
      if (table.headers) {
        table.headers.forEach(h => addWords(h));
      }
    }
  }

  return terms;
}

/**
 * Score a tax rule against the search terms.
 * Higher score = more relevant.
 */
function scoreRule(rule, searchTerms) {
  let score = 0;

  for (const topic of rule.topics) {
    const topicLower = topic.toLowerCase();

    // Exact phrase match (highest weight)
    for (const term of searchTerms) {
      if (term === topicLower) {
        score += 5;
      } else if (term.includes(topicLower) || topicLower.includes(term)) {
        score += 3;
      }
    }

    // Word-level overlap
    const topicWords = topicLower.split(/\s+/).filter(w => w.length >= 3);
    for (const word of topicWords) {
      if (searchTerms.has(word)) {
        score += 1;
      }
    }
  }

  // Boost if title matches
  const titleWords = rule.title.toLowerCase().split(/\s+/).filter(w => w.length >= 3);
  for (const word of titleWords) {
    if (searchTerms.has(word)) {
      score += 0.5;
    }
  }

  return score;
}

/**
 * Retrieve the most relevant tax rules for the given page context.
 *
 * @param {object} params
 * @param {string} params.pageTitle - Title of the current page
 * @param {string} params.pageUrl - URL of the current page
 * @param {object} params.domData - Extracted DOM data
 * @returns {{ rules: Array, retrievalTimeMs: number }}
 */
export function retrieveRelevantRules({ pageTitle, pageUrl, domData }) {
  const startTime = Date.now();

  // Extract search terms from the page context
  const searchTerms = extractSearchTerms({ pageTitle, pageUrl, domData });

  // Score all rules
  const scoredRules = TAX_RULES.map(rule => ({
    ...rule,
    score: scoreRule(rule, searchTerms),
  }));

  // Sort by score (descending) and take top N above minimum threshold
  const relevantRules = scoredRules
    .filter(r => r.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RULES);

  const retrievalTimeMs = Date.now() - startTime;

  console.log(`[RAG] Retrieved ${relevantRules.length} rules in ${retrievalTimeMs}ms for: "${pageTitle}"`);
  if (relevantRules.length > 0) {
    console.log(`[RAG] Top rules: ${relevantRules.map(r => `${r.id}(${r.score.toFixed(1)})`).join(', ')}`);
  }

  return {
    rules: relevantRules,
    retrievalTimeMs,
  };
}

/**
 * Format retrieved rules into a string for prompt injection.
 *
 * @param {Array} rules - Retrieved tax rules
 * @returns {string|null} Formatted rules text, or null if no rules
 */
export function formatRulesForPrompt(rules) {
  if (!rules || rules.length === 0) {
    return null;
  }

  let context = '=== RELEVANT INDIAN TAX RULES ===\n\n';
  context += `The following ${rules.length} tax rules are relevant to the current page. Use them to validate the user\'s data and provide accurate guidance.\n\n`;

  for (const rule of rules) {
    context += `--- ${rule.title} [${rule.section}] ---\n`;
    context += `${rule.content}\n`;
    context += `Source: ${rule.source}\n\n`;
  }

  context += '=== END OF TAX RULES ===';

  return context;
}

/**
 * Get rule IDs from the retrieved rules (for response metadata).
 */
export function getRuleIds(rules) {
  return rules.map(r => r.id);
}

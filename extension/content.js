/**
 * TaxPilot Copilot — Content Script
 *
 * Injected into web pages to extract DOM content.
 * Handles:
 * - Extracting visible form fields with labels
 * - Extracting headings, paragraphs, and tables
 * - Getting user's selected text
 * - Serializing DOM data for the backend
 */

// ── Message Listener ───────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'ping') {
    sendResponse({ pong: true });
    return true;
  }

  if (message.action === 'extract-dom') {
    try {
      const domData = extractPageData();
      sendResponse({ domData });
    } catch (error) {
      console.error('[TaxPilot Content] DOM extraction error:', error);
      sendResponse({ error: `DOM extraction failed: ${error.message}` });
    }
    return true;
  }

  if (message.action === 'get-selection') {
    try {
      const selectedText = window.getSelection()?.toString()?.trim() || '';
      sendResponse({ selectedText });
    } catch (error) {
      sendResponse({ selectedText: '' });
    }
    return true;
  }
});

// ── DOM Extraction ─────────────────────────────────────────

/**
 * Check if an element is visible to the user.
 */
function isElementVisible(element) {
  if (!element) return false;

  // Use checkVisibility if available (modern browsers)
  if (typeof element.checkVisibility === 'function') {
    return element.checkVisibility();
  }

  // Fallback: check computed style
  const style = window.getComputedStyle(element);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    element.offsetParent !== null
  );
}

/**
 * Get the label text for a form field.
 * Tries multiple strategies in order of preference.
 */
function getFieldLabel(field) {
  // 1. Explicit label via 'for' attribute
  if (field.id) {
    const label = document.querySelector(`label[for="${CSS.escape(field.id)}"]`);
    if (label) return label.innerText.trim();
  }

  // 2. Parent <label> element
  const parentLabel = field.closest('label');
  if (parentLabel) {
    // Get label text excluding the input's own text
    const clone = parentLabel.cloneNode(true);
    const inputs = clone.querySelectorAll('input, select, textarea');
    inputs.forEach(input => input.remove());
    const text = clone.innerText.trim();
    if (text) return text;
  }

  // 3. aria-label attribute
  if (field.getAttribute('aria-label')) {
    return field.getAttribute('aria-label').trim();
  }

  // 4. aria-labelledby attribute
  const labelledBy = field.getAttribute('aria-labelledby');
  if (labelledBy) {
    const labelEl = document.getElementById(labelledBy);
    if (labelEl) return labelEl.innerText.trim();
  }

  // 5. Placeholder text
  if (field.placeholder) {
    return field.placeholder.trim();
  }

  // 6. Name attribute as last resort
  if (field.name) {
    return field.name
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]/g, ' ')
      .trim();
  }

  // 7. Preceding text sibling or label-like element
  const prev = field.previousElementSibling;
  if (prev && ['LABEL', 'SPAN', 'P', 'DIV'].includes(prev.tagName)) {
    const text = prev.innerText?.trim();
    if (text && text.length < 100) return text;
  }

  return '';
}

/**
 * Extract options from a <select> element.
 */
function getSelectOptions(selectEl) {
  const options = [];
  for (const option of selectEl.options) {
    if (option.value || option.text) {
      options.push({
        value: option.value,
        text: option.text.trim(),
        selected: option.selected,
      });
    }
  }
  return options;
}

/**
 * Extract all visible form fields with their metadata.
 */
function extractFields() {
  const fields = [];
  const elements = document.querySelectorAll('input, select, textarea, [role="combobox"], [role="listbox"], [role="checkbox"], [role="radio"]');

  for (const el of elements) {
    if (!isElementVisible(el)) continue;

    const elType = el.type ? el.type.toLowerCase() : '';
    // Skip buttons, submits, resets, and search bars
    if (['button', 'submit', 'reset', 'hidden', 'search'].includes(elType)) continue;

    // Skip global UI elements in header/footer/nav
    if (el.closest('header, footer, nav, .header, .footer, .nav, #header, #footer')) continue;

    const field = {
      tagName: el.tagName.toLowerCase(),
      type: el.type || el.getAttribute('role') || '',
      name: el.name || '',
      id: el.id || '',
      value: '',
      label: getFieldLabel(el),
      placeholder: el.placeholder || '',
      ariaLabel: el.getAttribute('aria-label') || '',
      required: el.required || el.getAttribute('aria-required') === 'true',
    };

    // Get current value (but don't include sensitive data)
    if (el.type === 'password') {
      field.value = '[password field]';
    } else if (el.type === 'checkbox' || el.type === 'radio') {
      field.value = el.checked ? 'checked' : 'unchecked';
    } else if (el.tagName.toLowerCase() === 'select') {
      field.options = getSelectOptions(el);
      field.value = el.options[el.selectedIndex]?.text || '';
    } else {
      field.value = (el.value || '').substring(0, 200); // Truncate long values
    }

    fields.push(field);
  }

  return fields;
}

/**
 * Extract all visible headings from the page.
 */
function extractHeadings() {
  const headings = [];
  const elements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');

  for (const el of elements) {
    if (!isElementVisible(el)) continue;
    const text = el.innerText?.trim();
    if (text) {
      headings.push({
        level: parseInt(el.tagName.charAt(1)),
        text,
      });
    }
  }

  return headings;
}

/**
 * Extract visible paragraph/descriptive text.
 */
function extractParagraphs() {
  const paragraphs = [];
  const elements = document.querySelectorAll('p, .help-text, .description, .info-text, [class*="help"], [class*="info"], [class*="note"]');

  for (const el of elements) {
    if (!isElementVisible(el)) continue;
    const text = el.innerText?.trim();
    if (text && text.length > 10 && text.length < 500) {
      paragraphs.push(text);
    }
  }

  // Deduplicate
  return [...new Set(paragraphs)];
}

/**
 * Extract visible table data.
 */
function extractTables() {
  const tables = [];
  const tableElements = document.querySelectorAll('table');

  for (const table of tableElements) {
    if (!isElementVisible(table)) continue;

    const tableData = {
      headers: [],
      rows: [],
    };

    // Extract headers
    const headerCells = table.querySelectorAll('thead th, thead td');
    for (const cell of headerCells) {
      tableData.headers.push(cell.innerText?.trim() || '');
    }

    // Extract rows (limit to first 20 rows)
    const bodyRows = table.querySelectorAll('tbody tr');
    let rowCount = 0;
    for (const row of bodyRows) {
      if (rowCount >= 20) break;
      const cells = [];
      for (const cell of row.querySelectorAll('td, th')) {
        cells.push(cell.innerText?.trim() || '');
      }
      if (cells.some(c => c)) {
        tableData.rows.push(cells);
        rowCount++;
      }
    }

    if (tableData.headers.length > 0 || tableData.rows.length > 0) {
      tables.push(tableData);
    }
  }

  return tables;
}

/**
 * Extract a summary of visible page text (for context).
 */
function extractPageText() {
  const body = document.body;
  if (!body) return '';

  // Get visible text content, truncated
  const text = body.innerText || '';
  return text.substring(0, 3000).trim();
}

/**
 * Main extraction function — gathers all page data.
 */
function extractPageData() {
  return {
    fields: extractFields(),
    headings: extractHeadings(),
    paragraphs: extractParagraphs(),
    tables: extractTables(),
    pageText: extractPageText(),
  };
}

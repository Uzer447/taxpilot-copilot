/**
 * TaxPilot Copilot — Side Panel Logic
 *
 * Handles:
 * - Analyze button click → capture screenshot + DOM → send to backend
 * - Explain selection → get selected text → send to backend
 * - Rendering results, loading, and error states
 * - Listening for trigger messages from background script
 */

const BACKEND_URL = 'https://taxpilot-copilot.onrender.com';

// ── DOM References ─────────────────────────────────────────

const welcomeState = document.getElementById('welcome-state');
const loadingState = document.getElementById('loading-state');
const resultsState = document.getElementById('results-state');
const errorState = document.getElementById('error-state');

const analyzeBtn = document.getElementById('analyze-btn');
const explainSelectionBtn = document.getElementById('explain-selection-btn');
const reanalyzeBtn = document.getElementById('reanalyze-btn');
const backHomeBtn = document.getElementById('back-home-btn');
const retryBtn = document.getElementById('retry-btn');

const resultsHeader = document.getElementById('results-header');
const resultsFields = document.getElementById('results-fields');
const errorTitle = document.getElementById('error-title');
const errorMessage = document.getElementById('error-message');

// ── State Management ───────────────────────────────────────

function showState(stateName) {
  [welcomeState, loadingState, resultsState, errorState].forEach(el => {
    el.classList.add('hidden');
  });

  const stateMap = {
    welcome: welcomeState,
    loading: loadingState,
    results: resultsState,
    error: errorState,
  };

  if (stateMap[stateName]) {
    stateMap[stateName].classList.remove('hidden');
  }
}

// ── Event Listeners ────────────────────────────────────────

analyzeBtn.addEventListener('click', () => analyzePage());
reanalyzeBtn.addEventListener('click', () => analyzePage());
backHomeBtn.addEventListener('click', () => showState('welcome'));
retryBtn.addEventListener('click', () => showState('welcome'));
explainSelectionBtn.addEventListener('click', () => explainSelection());

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'trigger-analysis') {
    analyzePage();
  }

  if (message.action === 'explain-selection') {
    explainSelectionFromContext(message.data);
  }
});

// ── Core Functions ─────────────────────────────────────────

/**
 * Main flow: Analyze the current page.
 * 1. Capture screenshot
 * 2. Extract DOM data
 * 3. Get page info
 * 4. Send to backend
 * 5. Render results
 */
async function analyzePage() {
  showState('loading');

  try {
    // Step 1: Get active tab info
    const tabInfo = await sendMessage({ action: 'get-active-tab' });
    if (tabInfo.error) throw new Error(tabInfo.error);

    // Step 2: Capture screenshot
    const screenshotResult = await sendMessage({ action: 'capture-screenshot' });
    if (screenshotResult.error) throw new Error(screenshotResult.error);

    // Step 3: Extract DOM data
    const domResult = await sendMessage({
      action: 'extract-dom',
      tabId: tabInfo.tabId,
    });
    if (domResult.error) throw new Error(domResult.error);

    // Step 4: Send to backend
    const response = await fetch(`${BACKEND_URL}/api/explain-page`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        screenshot: screenshotResult.screenshot,
        domData: domResult.domData,
        pageTitle: tabInfo.title,
        pageUrl: tabInfo.url,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Analysis failed');
    }

    // Step 5: Render results
    renderResults(result.data, result.meta);

  } catch (error) {
    console.error('[TaxPilot] Analysis error:', error);
    showError('Analysis Failed', getErrorMessage(error));
  }
}

/**
 * Explain selected text from the page.
 */
async function explainSelection() {
  showState('loading');

  try {
    // Get active tab info
    const tabInfo = await sendMessage({ action: 'get-active-tab' });
    if (tabInfo.error) throw new Error(tabInfo.error);

    // Get selected text
    const selectionResult = await sendMessage({
      action: 'get-selected-text',
      tabId: tabInfo.tabId,
    });

    const selectedText = selectionResult.selectedText?.trim();
    if (!selectedText) {
      showState('welcome');
      showError('No Text Selected', 'Please highlight some text on the page first, then click "Explain Selected Text".');
      return;
    }

    // Get DOM context
    const domResult = await sendMessage({
      action: 'extract-dom',
      tabId: tabInfo.tabId,
    });

    // Send to backend
    const response = await fetch(`${BACKEND_URL}/api/explain-selection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selectedText,
        domData: domResult.domData || {},
        pageTitle: tabInfo.title,
        pageUrl: tabInfo.url,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Explanation failed');
    }

    renderResults(result.data, result.meta, selectedText);

  } catch (error) {
    console.error('[TaxPilot] Selection error:', error);
    showError('Explanation Failed', getErrorMessage(error));
  }
}

/**
 * Handle selection explanation triggered from context menu.
 */
async function explainSelectionFromContext(data) {
  showState('loading');

  try {
    // Get DOM context
    const tabInfo = await sendMessage({ action: 'get-active-tab' });
    const domResult = await sendMessage({
      action: 'extract-dom',
      tabId: tabInfo.tabId,
    });

    const response = await fetch(`${BACKEND_URL}/api/explain-selection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selectedText: data.selectedText,
        domData: domResult.domData || {},
        pageTitle: data.pageTitle || tabInfo.title,
        pageUrl: data.pageUrl || tabInfo.url,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Explanation failed');
    }

    renderResults(result.data, result.meta, data.selectedText);

  } catch (error) {
    console.error('[TaxPilot] Context menu explanation error:', error);
    showError('Explanation Failed', getErrorMessage(error));
  }
}

// ── Rendering Functions ────────────────────────────────────

/**
 * Render the analysis results.
 */
function renderResults(data, meta, selectedText = null) {
  // Render header
  let headerHTML = '';

  if (selectedText) {
    headerHTML += `
      <div class="selection-header">
        <span class="selection-badge">Selection</span>
        <span class="selection-text">"${escapeHtml(selectedText.substring(0, 80))}${selectedText.length > 80 ? '...' : ''}"</span>
      </div>
    `;
  }

  headerHTML += `
    <h2 class="page-title">${escapeHtml(data.pageTitle || 'Page Analysis')}</h2>
    <p class="page-summary">${escapeHtml(data.pageSummary || '')}</p>
  `;

  if (data.fields && data.fields.length > 0) {
    headerHTML += `
      <div class="fields-count">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="7"/>
          <rect x="14" y="3" width="7" height="7"/>
          <rect x="3" y="14" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/>
        </svg>
        ${data.fields.length} field${data.fields.length !== 1 ? 's' : ''} detected
      </div>
    `;
  }

  if (meta) {
    headerHTML += `
      <div class="meta-info">
        <div class="meta-item">
          <span class="meta-dot"></span>
          ${meta.processingTimeMs ? `${(meta.processingTimeMs / 1000).toFixed(1)}s` : 'Done'}
        </div>
      </div>
    `;
  }

  resultsHeader.innerHTML = headerHTML;

  // Render field cards
  let fieldsHTML = '';

  if (data.fields && data.fields.length > 0) {
    data.fields.forEach(field => {
      fieldsHTML += renderFieldCard(field);
    });
    resultsFields.innerHTML = fieldsHTML;
    resultsFields.style.display = 'flex';
  } else {
    resultsFields.innerHTML = '';
    resultsFields.style.display = 'none';
  }
  showState('results');
}

/**
 * Render a single field explanation card.
 */
function renderFieldCard(field) {
  let html = `<div class="field-card">`;

  // Field name
  html += `<div class="field-name">${escapeHtml(field.name || 'Unknown Field')}</div>`;

  // Description
  if (field.description) {
    html += `<p class="field-description">${escapeHtml(field.description)}</p>`;
  }

  // When applicable
  if (field.whenApplicable) {
    html += `
      <div class="field-detail" data-type="when">
        <span class="field-detail-label">When</span>
        <span class="field-detail-value">${escapeHtml(field.whenApplicable)}</span>
      </div>
    `;
  }

  // Removed commonMistakes rendering

  // Notes
  if (field.notes) {
    html += `
      <div class="field-detail" data-type="notes">
        <span class="field-detail-label">Notes</span>
        <span class="field-detail-value">${escapeHtml(field.notes)}</span>
      </div>
    `;
  }

  html += `</div>`;
  return html;
}

/**
 * Show the error state with a title and message.
 */
function showError(title, message) {
  errorTitle.textContent = title;
  errorMessage.textContent = message;
  showState('error');
}

// ── Utility Functions ──────────────────────────────────────

/**
 * Send a message to the background script and return the response.
 */
function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        resolve({ error: chrome.runtime.lastError.message });
      } else {
        resolve(response || {});
      }
    });
  });
}

/**
 * Escape HTML to prevent XSS.
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Get a user-friendly error message.
 */
function getErrorMessage(error) {
  const msg = error.message || String(error);

  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('ERR_CONNECTION_REFUSED')) {
    return 'Cannot connect to the TaxPilot backend. Make sure the backend server is running (npm run dev in the backend folder).';
  }

  if (msg.includes('429') || msg.includes('quota') || msg.includes('Rate')) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  if (msg.includes('API_KEY') || msg.includes('GEMINI')) {
    return 'The Gemini API key is not configured. Please set GEMINI_API_KEY in the backend .env file.';
  }

  if (msg.includes('Screenshot failed')) {
    return 'Could not capture a screenshot of the current page. Make sure you\'re on a regular web page (not a Chrome internal page).';
  }

  if (msg.includes('DOM extraction failed')) {
    return 'Could not read the page content. Try refreshing the page and trying again.';
  }

  return msg;
}

/**
 * TaxPilot Copilot — Side Panel Logic (V1)
 *
 * Handles:
 * - Document upload, listing, and removal
 * - Session management via chrome.storage.local
 * - Analyze button click → capture screenshot + DOM → send to backend
 * - Explain selection → get selected text → send to backend
 * - Rendering results with V1 fields (recommendations, inconsistencies, missing docs)
 * - Loading, error, and results states
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

// Document UI elements
const documentsSection = document.getElementById('documents-section');
const documentsCount = document.getElementById('documents-count');
const uploadDropzone = document.getElementById('upload-dropzone');
const fileInput = document.getElementById('file-input');
const docTypeSelector = document.getElementById('doc-type-selector');
const cancelUploadBtn = document.getElementById('cancel-upload');
const uploadProgress = document.getElementById('upload-progress');
const uploadProgressText = document.getElementById('upload-progress-text');
const documentList = document.getElementById('document-list');
const loadingSubtext = document.getElementById('loading-subtext');

// Results V1 elements
const docSummaryBar = document.getElementById('doc-summary-bar');
const inconsistenciesSection = document.getElementById('inconsistencies-section');
const missingDocsSection = document.getElementById('missing-docs-section');

// ── State ──────────────────────────────────────────────────

let sessionId = null;
let documents = [];
let pendingFile = null;

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

// ── Session Management ─────────────────────────────────────

/**
 * Initialize or restore the session.
 */
async function initSession() {
  try {
    const stored = await chrome.storage.local.get('taxpilot_session_id');
    if (stored.taxpilot_session_id) {
      sessionId = stored.taxpilot_session_id;
      // Verify session is still valid on the server
      const res = await fetch(`${BACKEND_URL}/api/documents/${sessionId}`);
      const data = await res.json();
      if (data.sessionValid) {
        documents = data.documents || [];
        renderDocumentList();
        return;
      }
    }
  } catch (e) {
    console.log('[TaxPilot] Could not restore session, creating new one');
  }

  // Create new session
  try {
    const res = await fetch(`${BACKEND_URL}/api/documents/session`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      sessionId = data.sessionId;
      await chrome.storage.local.set({ taxpilot_session_id: sessionId });
      documents = [];
      renderDocumentList();
    }
  } catch (e) {
    console.error('[TaxPilot] Failed to create session:', e);
    // Extension still works without session (V0 mode)
  }
}

// ── Document Upload ────────────────────────────────────────

/**
 * Handle file selection (from input or drag-and-drop).
 */
function handleFileSelected(file) {
  if (!file) return;

  if (file.type !== 'application/pdf') {
    showUploadError('Only PDF files are supported.');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showUploadError('File is too large. Maximum size is 5MB.');
    return;
  }

  pendingFile = file;
  // Show type selector
  docTypeSelector.classList.remove('hidden');
  uploadDropzone.classList.add('hidden');
}

/**
 * Upload the pending file with the selected type.
 */
async function uploadDocument(type) {
  if (!pendingFile || !sessionId) return;

  // Hide type selector, show progress
  docTypeSelector.classList.add('hidden');
  uploadProgress.classList.remove('hidden');
  uploadProgressText.textContent = `Uploading ${pendingFile.name}...`;

  try {
    const formData = new FormData();
    formData.append('file', pendingFile);
    formData.append('sessionId', sessionId);
    formData.append('type', type);

    const res = await fetch(`${BACKEND_URL}/api/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || 'Upload failed');
    }

    // Add to local list
    documents.push(data.document);
    renderDocumentList();
    uploadProgressText.textContent = 'Upload complete!';

    setTimeout(() => {
      uploadProgress.classList.add('hidden');
      uploadDropzone.classList.remove('hidden');
    }, 1000);

  } catch (error) {
    console.error('[TaxPilot] Upload error:', error);
    uploadProgressText.textContent = `Error: ${error.message}`;
    setTimeout(() => {
      uploadProgress.classList.add('hidden');
      uploadDropzone.classList.remove('hidden');
    }, 2000);
  }

  pendingFile = null;
}

/**
 * Remove a document from the session.
 */
async function removeDocument(documentId) {
  if (!sessionId) return;

  try {
    await fetch(`${BACKEND_URL}/api/documents/${sessionId}/${documentId}`, {
      method: 'DELETE',
    });

    documents = documents.filter(d => d.id !== documentId);
    renderDocumentList();
  } catch (error) {
    console.error('[TaxPilot] Remove error:', error);
  }
}

/**
 * Show a brief error in the upload area.
 */
function showUploadError(message) {
  uploadProgressText.textContent = message;
  uploadProgress.classList.remove('hidden');
  uploadDropzone.classList.add('hidden');
  setTimeout(() => {
    uploadProgress.classList.add('hidden');
    uploadDropzone.classList.remove('hidden');
  }, 2000);
}

/**
 * Render the document list in the UI.
 */
function renderDocumentList() {
  documentsCount.textContent = documents.length === 0
    ? '0 uploaded'
    : `${documents.length} uploaded`;

  if (documents.length === 0) {
    documentList.innerHTML = '';
    return;
  }

  let html = '';
  for (const doc of documents) {
    html += `
      <div class="document-item" data-id="${doc.id}">
        <div class="document-item-info">
          <div class="document-item-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="document-item-details">
            <span class="document-item-name">${escapeHtml(doc.filename)}</span>
            <span class="document-item-meta">
              <span class="doc-type-badge doc-type-${doc.type}">${escapeHtml(doc.typeLabel)}</span>
              <span>${doc.pageCount} page${doc.pageCount !== 1 ? 's' : ''}</span>
            </span>
          </div>
        </div>
        <button class="document-remove-btn" data-id="${doc.id}" title="Remove document">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    `;
  }
  documentList.innerHTML = html;

  // Attach remove handlers
  documentList.querySelectorAll('.document-remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeDocument(btn.dataset.id);
    });
  });
}

// ── Event Listeners ────────────────────────────────────────

analyzeBtn.addEventListener('click', () => analyzePage());
reanalyzeBtn.addEventListener('click', () => analyzePage());
backHomeBtn.addEventListener('click', () => showState('welcome'));
retryBtn.addEventListener('click', () => showState('welcome'));
explainSelectionBtn.addEventListener('click', () => explainSelection());

// File upload events
uploadDropzone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => handleFileSelected(e.target.files[0]));

// Drag and drop
uploadDropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadDropzone.classList.add('dragover');
});
uploadDropzone.addEventListener('dragleave', () => {
  uploadDropzone.classList.remove('dragover');
});
uploadDropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadDropzone.classList.remove('dragover');
  handleFileSelected(e.dataTransfer.files[0]);
});

// Document type buttons
document.getElementById('type-form16').addEventListener('click', () => uploadDocument('form16'));
document.getElementById('type-salary-slip').addEventListener('click', () => uploadDocument('salary_slip'));
cancelUploadBtn.addEventListener('click', () => {
  pendingFile = null;
  docTypeSelector.classList.add('hidden');
  uploadDropzone.classList.remove('hidden');
});

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
 */
async function analyzePage() {
  showState('loading');

  // Update loading text if documents are uploaded
  if (documents.length > 0) {
    loadingSubtext.textContent = `Analyzing with ${documents.length} document${documents.length > 1 ? 's' : ''}... This may take 4-6 seconds`;
  } else {
    loadingSubtext.textContent = 'This usually takes 3-5 seconds';
  }

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

    // Step 4: Send to backend (include sessionId for V1 personalization)
    const requestBody = {
      screenshot: screenshotResult.screenshot,
      domData: domResult.domData,
      pageTitle: tabInfo.title,
      pageUrl: tabInfo.url,
    };

    if (sessionId) {
      requestBody.sessionId = sessionId;
    }

    const response = await fetch(`${BACKEND_URL}/api/explain-page`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
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
    const tabInfo = await sendMessage({ action: 'get-active-tab' });
    if (tabInfo.error) throw new Error(tabInfo.error);

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

    const domResult = await sendMessage({
      action: 'extract-dom',
      tabId: tabInfo.tabId,
    });

    const requestBody = {
      selectedText,
      domData: domResult.domData || {},
      pageTitle: tabInfo.title,
      pageUrl: tabInfo.url,
    };

    if (sessionId) {
      requestBody.sessionId = sessionId;
    }

    const response = await fetch(`${BACKEND_URL}/api/explain-selection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
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
    const tabInfo = await sendMessage({ action: 'get-active-tab' });
    const domResult = await sendMessage({
      action: 'extract-dom',
      tabId: tabInfo.tabId,
    });

    const requestBody = {
      selectedText: data.selectedText,
      domData: domResult.domData || {},
      pageTitle: data.pageTitle || tabInfo.title,
      pageUrl: data.pageUrl || tabInfo.url,
    };

    if (sessionId) {
      requestBody.sessionId = sessionId;
    }

    const response = await fetch(`${BACKEND_URL}/api/explain-selection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
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
 * Render the analysis results (V1: includes recommendations, inconsistencies, missing docs).
 */
function renderResults(data, meta, selectedText = null) {
  // ── Document Summary Bar ──
  if (data.documentsSummary) {
    docSummaryBar.innerHTML = `
      <div class="doc-bar-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <span>${escapeHtml(data.documentsSummary)}</span>
    `;
    docSummaryBar.classList.remove('hidden');
  } else if (documents.length === 0) {
    docSummaryBar.innerHTML = `
      <div class="doc-bar-icon doc-bar-empty">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <span>No documents uploaded — go back and upload your Form 16 for personalized guidance</span>
    `;
    docSummaryBar.classList.remove('hidden');
  } else {
    docSummaryBar.classList.add('hidden');
  }

  // ── Inconsistencies Section ──
  if (data.inconsistencies && data.inconsistencies.length > 0) {
    let inconsistHTML = `
      <div class="inconsistencies-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <span>${data.inconsistencies.length} Inconsistenc${data.inconsistencies.length === 1 ? 'y' : 'ies'} Detected</span>
      </div>
    `;

    for (const inc of data.inconsistencies) {
      inconsistHTML += `
        <div class="inconsistency-card severity-${(inc.severity || 'medium').toLowerCase()}">
          <div class="inconsistency-field">${escapeHtml(inc.field)}</div>
          <div class="inconsistency-values">
            <span class="inconsistency-portal">Portal: ${escapeHtml(inc.portalValue)}</span>
            <span class="inconsistency-vs">vs</span>
            <span class="inconsistency-doc">${escapeHtml(inc.document)}: ${escapeHtml(inc.documentValue)}</span>
          </div>
        </div>
      `;
    }

    inconsistenciesSection.innerHTML = inconsistHTML;
    inconsistenciesSection.classList.remove('hidden');
  } else {
    inconsistenciesSection.classList.add('hidden');
  }

  // ── Header ──
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

  // ── Field Cards ──
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

  // ── Missing Documents Section ──
  if (data.missingDocuments && data.missingDocuments.length > 0) {
    let missingHTML = `
      <div class="missing-docs-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <span>Additional Documents That May Help</span>
      </div>
    `;

    for (const doc of data.missingDocuments) {
      missingHTML += `
        <div class="missing-doc-item">
          <span class="missing-doc-name">${escapeHtml(doc.document)}</span>
          <span class="missing-doc-reason">${escapeHtml(doc.reason)}</span>
        </div>
      `;
    }

    missingDocsSection.innerHTML = missingHTML;
    missingDocsSection.classList.remove('hidden');
  } else {
    missingDocsSection.classList.add('hidden');
  }

  showState('results');
}

/**
 * Render a single field explanation card (V1: includes recommendation + inconsistency).
 */
function renderFieldCard(field) {
  let html = `<div class="field-card">`;

  // Field name
  html += `<div class="field-name">${escapeHtml(field.name || 'Unknown Field')}</div>`;

  // Description
  if (field.description) {
    html += `<p class="field-description">${escapeHtml(field.description)}</p>`;
  }

  // Selected value
  if (field.selectedValue) {
    html += `
      <div class="field-detail" data-type="selected">
        <span class="field-detail-label">Selected</span>
        <span class="field-detail-value font-mono font-bold">${escapeHtml(field.selectedValue)}</span>
      </div>
    `;
  }

  // V1: Recommendation
  if (field.recommendation) {
    const rec = field.recommendation;
    const confidence = (rec.confidence || 'MEDIUM').toUpperCase();

    html += `
      <div class="field-recommendation confidence-${confidence.toLowerCase()}">
        <div class="recommendation-header">
          <span class="confidence-badge confidence-${confidence.toLowerCase()}">${confidence}</span>
          <span class="recommendation-label">Recommendation</span>
        </div>
        <p class="recommendation-text">${escapeHtml(rec.suggestedAction)}</p>
    `;

    if (rec.reasoning) {
      html += `<p class="recommendation-reasoning">${escapeHtml(rec.reasoning)}</p>`;
    }

    if (rec.sourceDocument) {
      html += `<p class="recommendation-source">Source: ${escapeHtml(rec.sourceDocument)}</p>`;
    }

    html += `</div>`;
  }

  // V1: Field-level inconsistency
  if (field.inconsistency) {
    const inc = field.inconsistency;
    const severity = (inc.severity || 'MEDIUM').toUpperCase();

    html += `
      <div class="field-inconsistency severity-${severity.toLowerCase()}">
        <div class="inconsistency-inline-header">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>Mismatch Detected</span>
        </div>
        <p class="inconsistency-message">${escapeHtml(inc.message)}</p>
      </div>
    `;
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

  if (msg.includes('404') || msg.includes('502') || msg.includes('503')) {
    return 'The backend server is waking up from sleep (Render free tier). This takes about 30-50 seconds. Please wait a moment and click Try Again.';
  }

  return msg;
}

// ── Initialize ─────────────────────────────────────────────

initSession();

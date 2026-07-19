/**
 * TaxPilot Copilot — Side Panel Logic (V2.5)
 *
 * Handles:
 * - Native Auth (Login/Logout)
 * - Navigation tabs (Overview, Review, Documents)
 * - Session & Document management
 * - Page Review and Explanation
 * - Loading Timelines
 */

const BACKEND_URL = 'https://taxpilot-copilot.onrender.com';

// ── DOM References ─────────────────────────────────────────

const welcomeState = document.getElementById('welcome-state');
const loadingState = document.getElementById('loading-state');
const resultsState = document.getElementById('results-state');
const errorState = document.getElementById('error-state');

// Auth DOM
const loginFormContainer = document.getElementById('login-form-container');
const loggedInContainer = document.getElementById('logged-in-container');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const authLoginBtn = document.getElementById('auth-login-btn');
const authErrorMsg = document.getElementById('auth-error-msg');
const loggedInEmail = document.getElementById('logged-in-email');
const authLogoutBtn = document.getElementById('auth-logout-btn');
const triggerSyncBtn = document.getElementById('trigger-sync-btn');

// Navigation Tabs
const tabOverview = document.getElementById('tab-overview');
const tabReview = document.getElementById('tab-review');
const tabDocuments = document.getElementById('tab-documents');

// Actions
const reviewBtn = document.getElementById('review-btn');
const explainSelectionBtn = document.getElementById('explain-selection-btn');
const reanalyzeBtn = document.getElementById('reanalyze-btn');
const backHomeBtn = document.getElementById('back-home-btn');
const retryBtn = document.getElementById('retry-btn');

// Results DOM
const resultsHeader = document.getElementById('results-header');
const healthScoreWidget = document.getElementById('health-score-widget');
const validationSummaryBar = document.getElementById('validation-summary-bar');
const warningsSection = document.getElementById('warnings-section');
const resultsFields = document.getElementById('results-fields');
const missingDocsSection = document.getElementById('missing-docs-section');
const taxRulesSection = document.getElementById('tax-rules-section');
const errorTitle = document.getElementById('error-title');
const errorMessage = document.getElementById('error-message');

// Documents DOM
const documentsSection = document.getElementById('documents-section');
const documentsCount = document.getElementById('documents-count');
const uploadDropzone = document.getElementById('upload-dropzone');
const fileInput = document.getElementById('file-input');
const docTypeSelector = document.getElementById('doc-type-selector');
const cancelUploadBtn = document.getElementById('cancel-upload');
const uploadProgress = document.getElementById('upload-progress');
const uploadProgressText = document.getElementById('upload-progress-text');
const documentList = document.getElementById('document-list');

// Loading Timeline
const loadingTimeline = document.getElementById('loading-timeline');

// ── State ──────────────────────────────────────────────────

let sessionId = null;
let documents = [];
let pendingFile = null;
let currentTab = 'overview'; // 'overview', 'review', 'documents'

// ── State Management ───────────────────────────────────────

function showState(stateName) {
  [welcomeState, loadingState, resultsState, errorState].forEach(el => {
    if (el) el.classList.add('hidden');
  });

  const stateMap = {
    welcome: welcomeState,
    loading: loadingState,
    results: resultsState,
    error: errorState,
  };

  if (stateMap[stateName] && stateMap[stateName]) {
    stateMap[stateName].classList.remove('hidden');
  }
}

function switchTab(tabName) {
  currentTab = tabName;
  [tabOverview, tabReview, tabDocuments].forEach(el => el.classList.remove('active'));
  
  // Hide all sections in welcome state
  if (documentsSection) documentsSection.classList.add('hidden');
  
  if (tabName === 'overview') {
    tabOverview.classList.add('active');
    showState('welcome');
  } else if (tabName === 'review') {
    tabReview.classList.add('active');
    // Keep results open if we have them, else show overview but focused on actions
    if (resultsHeader.innerHTML !== '') {
      showState('results');
    } else {
      showState('welcome');
    }
  } else if (tabName === 'documents') {
    tabDocuments.classList.add('active');
    showState('welcome');
    if (documentsSection) documentsSection.classList.remove('hidden');
  }
}

// ── API Helper ─────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  return fetch(`${BACKEND_URL}${path}`, options);
}

// ── Session Management ─────────────────────────────────────

async function initSession() {
  try {
    const stored = await chrome.storage.local.get('taxpilot_session_id');
    if (stored.taxpilot_session_id) {
      sessionId = stored.taxpilot_session_id;
      const res = await apiFetch(`/api/documents/${sessionId}`);
      const data = await res.json();
      if (data.sessionValid) {
        documents = data.documents || [];
        renderDocumentList();
        return;
      }
    }
  } catch (e) {}

  try {
    const res = await apiFetch('/api/documents/session', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      sessionId = data.sessionId;
      await chrome.storage.local.set({ taxpilot_session_id: sessionId });
      documents = [];
      renderDocumentList();
    }
  } catch (e) {
    console.error('[TaxPilot] Failed to create session:', e);
  }
}

// ── Document Upload ────────────────────────────────────────

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
  docTypeSelector.classList.remove('hidden');
  uploadDropzone.classList.add('hidden');
}

async function uploadDocument(type) {
  if (!pendingFile || !sessionId) return;
  docTypeSelector.classList.add('hidden');
  uploadProgress.classList.remove('hidden');
  uploadProgressText.textContent = `Uploading ${pendingFile.name}...`;

  try {
    const formData = new FormData();
    formData.append('file', pendingFile);
    formData.append('sessionId', sessionId);
    formData.append('type', type);

    // Do not set Content-Type header when sending FormData!
    const res = await apiFetch('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Upload failed');

    documents.push(data.document);
    renderDocumentList();
    uploadProgressText.textContent = 'Upload complete!';
    setTimeout(() => {
      uploadProgress.classList.add('hidden');
      uploadDropzone.classList.remove('hidden');
    }, 1000);
  } catch (error) {
    uploadProgressText.textContent = `Error: ${error.message}`;
    setTimeout(() => {
      uploadProgress.classList.add('hidden');
      uploadDropzone.classList.remove('hidden');
    }, 2000);
  }
  pendingFile = null;
}

async function removeDocument(documentId) {
  try {
    if (!sessionId) return;
    await apiFetch(`/api/documents/${sessionId}/${documentId}`, { method: 'DELETE' });
    documents = documents.filter(d => d.id !== documentId);
    renderDocumentList();
  } catch (error) {}
}

function showUploadError(message) {
  uploadProgressText.textContent = message;
  uploadProgress.classList.remove('hidden');
  uploadDropzone.classList.add('hidden');
  setTimeout(() => {
    uploadProgress.classList.add('hidden');
    uploadDropzone.classList.remove('hidden');
  }, 2000);
}

function renderDocumentList() {
  documentsCount.textContent = documents.length === 0 ? '0 uploaded' : `${documents.length} uploaded`;

  if (documents.length > 0) {
    reviewBtn.removeAttribute('disabled');
    reviewBtn.removeAttribute('title');
  } else {
    reviewBtn.setAttribute('disabled', 'true');
    reviewBtn.setAttribute('title', 'Upload documents to review this page');
  }

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

  documentList.querySelectorAll('.document-remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeDocument(btn.dataset.id);
    });
  });
}

// ── Event Listeners ────────────────────────────────────────

// Auth
if (authLoginBtn) authLoginBtn.addEventListener('click', handleLogin);
if (authLogoutBtn) authLogoutBtn.addEventListener('click', handleLogout);
if (triggerSyncBtn) {
  triggerSyncBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'trigger_sync' });
    triggerSyncBtn.textContent = 'Synced!';
    setTimeout(() => triggerSyncBtn.textContent = 'Sync Now', 2000);
  });
}

// Navigation
if (tabOverview) tabOverview.addEventListener('click', () => switchTab('overview'));
if (tabReview) tabReview.addEventListener('click', () => switchTab('review'));
if (tabDocuments) tabDocuments.addEventListener('click', () => switchTab('documents'));

// Actions
if (reviewBtn) reviewBtn.addEventListener('click', () => reviewPage());
if (reanalyzeBtn) reanalyzeBtn.addEventListener('click', () => reviewPage());
if (backHomeBtn) backHomeBtn.addEventListener('click', () => switchTab('overview'));
if (retryBtn) retryBtn.addEventListener('click', () => switchTab('overview'));
if (explainSelectionBtn) explainSelectionBtn.addEventListener('click', () => explainSelection());

// Files
if (uploadDropzone) uploadDropzone.addEventListener('click', () => fileInput.click());
if (fileInput) fileInput.addEventListener('change', (e) => handleFileSelected(e.target.files[0]));
if (uploadDropzone) {
  uploadDropzone.addEventListener('dragover', (e) => { e.preventDefault(); uploadDropzone.style.borderColor = 'var(--color-primary)'; });
  uploadDropzone.addEventListener('dragleave', () => { uploadDropzone.style.borderColor = 'var(--border-default)'; });
  uploadDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadDropzone.style.borderColor = 'var(--border-default)';
    handleFileSelected(e.dataTransfer.files[0]);
  });
}
const typeForm16 = document.getElementById('type-form16');
const typeSalarySlip = document.getElementById('type-salary-slip');
if (typeForm16) typeForm16.addEventListener('click', () => uploadDocument('form16'));
if (typeSalarySlip) typeSalarySlip.addEventListener('click', () => uploadDocument('salary_slip'));
if (cancelUploadBtn) cancelUploadBtn.addEventListener('click', () => {
  pendingFile = null;
  docTypeSelector.classList.add('hidden');
  uploadDropzone.classList.remove('hidden');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'trigger-analysis') {
    reviewPage();
  }
  if (message.action === 'explain-selection') {
    explainSelectionFromContext(message.data);
  }
});

// ── Core Functions ─────────────────────────────────────────

function updateLoadingTimeline(stepIndex) {
  const steps = [
    'Capturing Page Context',
    'Extracting DOM Data',
    'Validating Fields against Documents',
    'Generating Review Results'
  ];
  
  let html = '';
  steps.forEach((step, i) => {
    let statusClass = '';
    let icon = '<div class="timeline-spinner"></div>';
    
    if (i < stepIndex) {
      statusClass = 'done';
      icon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (i === stepIndex) {
      statusClass = 'active';
    } else {
      icon = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle></svg>`;
    }
    
    html += `
      <div class="timeline-step ${statusClass}">
        <div class="timeline-icon">${icon}</div>
        <span>${step}</span>
      </div>
    `;
  });
  loadingTimeline.innerHTML = html;
}

async function reviewPage() {
  showState('loading');
  updateLoadingTimeline(0);

  try {
    const tabInfo = await sendMessage({ action: 'get-active-tab' });
    if (tabInfo.error) throw new Error(tabInfo.error);
    
    updateLoadingTimeline(1);
    const screenshotResult = await sendMessage({ action: 'capture-screenshot' });
    if (screenshotResult.error) throw new Error(screenshotResult.error);

    updateLoadingTimeline(2);
    const domResult = await sendMessage({ action: 'extract-dom', tabId: tabInfo.tabId });
    if (domResult.error) throw new Error(domResult.error);

    updateLoadingTimeline(3);
    const requestBody = {
      screenshot: screenshotResult.screenshot,
      domData: domResult.domData,
      pageTitle: tabInfo.title,
      pageUrl: tabInfo.url,
    };
    if (sessionId) requestBody.sessionId = sessionId;

    const response = await apiFetch('/api/review-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Server error: ${response.status}`);
    }

    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Review failed');

    renderReviewResults(result.data, result.meta);
  } catch (error) {
    showError('Review Failed', getErrorMessage(error));
  }
}

async function explainSelection() {
  showState('loading');
  updateLoadingTimeline(0);
  try {
    const tabInfo = await sendMessage({ action: 'get-active-tab' });
    if (tabInfo.error) throw new Error(tabInfo.error);

    const selectionResult = await sendMessage({ action: 'get-selected-text', tabId: tabInfo.tabId });
    const selectedText = selectionResult.selectedText?.trim();
    if (!selectedText) {
      showState('welcome');
      return;
    }

    updateLoadingTimeline(2);
    const domResult = await sendMessage({ action: 'extract-dom', tabId: tabInfo.tabId });

    updateLoadingTimeline(3);
    const requestBody = {
      selectedText,
      domData: domResult.domData || {},
      pageTitle: tabInfo.title,
      pageUrl: tabInfo.url,
    };
    if (sessionId) requestBody.sessionId = sessionId;

    const response = await apiFetch('/api/explain-selection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    const result = await response.json();
    renderReviewResults(result.data, result.meta);
  } catch (error) {
    showError('Explanation Failed', getErrorMessage(error));
  }
}

async function explainSelectionFromContext(data) {
  showState('loading');
  updateLoadingTimeline(2);
  try {
    const tabInfo = await sendMessage({ action: 'get-active-tab' });
    const domResult = await sendMessage({ action: 'extract-dom', tabId: tabInfo.tabId });

    updateLoadingTimeline(3);
    const requestBody = {
      selectedText: data.selectedText,
      domData: domResult.domData || {},
      pageTitle: data.pageTitle || tabInfo.title,
      pageUrl: data.pageUrl || tabInfo.url,
    };
    if (sessionId) requestBody.sessionId = sessionId;

    const response = await apiFetch('/api/explain-selection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) throw new Error(`Server error`);
    const result = await response.json();
    renderReviewResults(result.data, result.meta);
  } catch (error) {
    showError('Explanation Failed', getErrorMessage(error));
  }
}

// ── Rendering Functions ────────────────────────────────────

function clearResults() {
  if(resultsHeader) resultsHeader.innerHTML = '';
  if(healthScoreWidget) healthScoreWidget.innerHTML = '';
  if(validationSummaryBar) validationSummaryBar.innerHTML = '';
  if(warningsSection) warningsSection.innerHTML = '';
  if(resultsFields) resultsFields.innerHTML = '';
  if(missingDocsSection) missingDocsSection.innerHTML = '';
  if(taxRulesSection) taxRulesSection.innerHTML = '';

  if(healthScoreWidget) healthScoreWidget.classList.add('hidden');
  if(validationSummaryBar) validationSummaryBar.classList.add('hidden');
  if(warningsSection) warningsSection.classList.add('hidden');
  if(missingDocsSection) missingDocsSection.classList.add('hidden');
  if(taxRulesSection) taxRulesSection.classList.add('hidden');
}

function renderReviewResults(data, meta) {
  clearResults();

  // 1. Header
  let headerHTML = `
    <h2 class="page-title">${escapeHtml(data.pageTitle || 'Page Review')}</h2>
    <p class="page-summary text-secondary mt-2" style="font-size: 0.85rem;">${escapeHtml(data.reviewSummary || '')}</p>
  `;
  if (meta) {
    headerHTML += `<div style="font-size: 0.75rem; color: var(--text-tertiary); margin-top: 8px;">Processing time: ${meta.processingTimeMs ? `${(meta.processingTimeMs / 1000).toFixed(1)}s` : 'Done'}</div>`;
  }
  if(resultsHeader) resultsHeader.innerHTML = headerHTML;

  // 2. Health Score
  if (data.healthScore && healthScoreWidget) {
    const score = data.healthScore.score;
    const label = data.healthScore.label;
    let colorClass = 'health-good';
    if (score < 70) colorClass = 'health-warning';
    if (score < 50) colorClass = 'health-critical';

    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    healthScoreWidget.innerHTML = `
      <div class="health-ring ${colorClass}">
        <svg width="80" height="80" viewBox="0 0 84 84">
          <circle class="ring-bg" cx="42" cy="42" r="${radius}" />
          <circle class="ring-fill" cx="42" cy="42" r="${radius}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" />
        </svg>
        <div class="health-score-value">${score}</div>
      </div>
      <div class="health-text">
        <div class="health-label">${escapeHtml(label)}</div>
        <div class="health-subtitle">Filing Health Score</div>
      </div>
    `;
    healthScoreWidget.classList.remove('hidden');
    
    // Validation Summary Bar
    const b = data.healthScore.breakdown;
    if (b && validationSummaryBar) {
      validationSummaryBar.innerHTML = `
        <div class="val-stat"><span class="dot dot-gray"></span>${b.totalFieldsReviewed} Reviewed</div>
        <div class="val-stat"><span class="dot dot-green"></span>${b.validatedFields} Valid</div>
        ${b.warnings > 0 ? `<div class="val-stat"><span class="dot dot-yellow"></span>${b.warnings} Warnings</div>` : ''}
        ${b.criticalIssues > 0 ? `<div class="val-stat"><span class="dot dot-red"></span>${b.criticalIssues} Critical</div>` : ''}
      `;
      validationSummaryBar.classList.remove('hidden');
    }
  }

  // 3. Warnings
  if (data.warnings && data.warnings.length > 0 && warningsSection) {
    let warningsHTML = '<h3 class="section-title mb-4">Review Findings</h3>';
    data.warnings.forEach(warn => {
      const severity = (warn.severity || 'INFO').toUpperCase();
      warningsHTML += `
        <div class="warning-card warning-${severity.toLowerCase()}">
          <div class="warning-header">
            <span class="severity-badge badge-${severity.toLowerCase()}">${severity}</span>
            <span class="warning-title">${escapeHtml(warn.title)}</span>
          </div>
          <div class="warning-message">${escapeHtml(warn.message)}</div>
          ${warn.suggestedAction ? `<div class="warning-action"><strong>Action:</strong> ${escapeHtml(warn.suggestedAction)}</div>` : ''}
      `;
      if (warn.evidence && warn.evidence.length > 0) {
        warningsHTML += `<div class="warning-evidence">`;
        warn.evidence.forEach(ev => {
          warningsHTML += `<div class="evidence-item"><span class="evidence-source">${escapeHtml(ev.source)}</span><span class="evidence-detail">${escapeHtml(ev.detail)}</span></div>`;
        });
        warningsHTML += `</div>`;
      }
      warningsHTML += `</div>`;
    });
    warningsSection.innerHTML = warningsHTML;
    warningsSection.classList.remove('hidden');
  }

  // 4. Fields
  if (data.fieldValidations && data.fieldValidations.length > 0 && resultsFields) {
    let fieldsHTML = '';
    data.fieldValidations.forEach(field => {
      const status = (field.status || 'VALID').toUpperCase();
      const statusClass = `status-${status.toLowerCase()}`;
      let statusIcon = status === 'VALID' ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
      
      fieldsHTML += `
        <div class="field-card">
          <div class="field-header">
            <div class="field-name">${escapeHtml(field.name || 'Unknown Field')}</div>
            <div class="field-status ${statusClass}">${statusIcon} ${status.replace('_', ' ')}</div>
          </div>
      `;
      if (field.currentValue) {
        fieldsHTML += `<div class="field-detail"><span class="field-detail-label">Portal Value</span><span class="field-detail-value">${escapeHtml(field.currentValue)}</span></div>`;
      }
      if (field.recommendation && field.recommendation.suggestedAction) {
        const rec = field.recommendation;
        fieldsHTML += `
          <div class="field-recommendation">
            <div class="recommendation-text">${escapeHtml(rec.suggestedAction)}</div>
            ${rec.reasoning ? `<div class="recommendation-reasoning">${escapeHtml(rec.reasoning)}</div>` : ''}
          </div>
        `;
      }
      fieldsHTML += `</div>`;
    });
    resultsFields.innerHTML = fieldsHTML;
  }

  // 5. Missing Docs
  if (data.missingDocuments && data.missingDocuments.length > 0 && missingDocsSection) {
    let missingHTML = `
      <div class="missing-docs-header">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <span>Helpful Documents</span>
      </div>
    `;
    data.missingDocuments.forEach(doc => {
      missingHTML += `<div class="missing-doc-item"><span class="missing-doc-name">${escapeHtml(doc.document)}</span><span class="missing-doc-reason">${escapeHtml(doc.reason)}</span></div>`;
    });
    missingDocsSection.innerHTML = missingHTML;
    missingDocsSection.classList.remove('hidden');
  }

  // 6. Tax Rules
  if (data.taxRulesApplied && data.taxRulesApplied.length > 0 && taxRulesSection) {
    taxRulesSection.innerHTML = `
      <details class="tax-rules-details">
        <summary>Tax rules applied (${data.taxRulesApplied.length})</summary>
        <div class="tax-rules-list">
          ${data.taxRulesApplied.map(r => `<span class="tax-rule-tag">${escapeHtml(r)}</span>`).join('')}
        </div>
      </details>
    `;
    taxRulesSection.classList.remove('hidden');
  }

  showState('results');
}

function showError(title, message) {
  if(errorTitle) errorTitle.textContent = title;
  if(errorMessage) errorMessage.textContent = message;
  showState('error');
}

function sendMessage(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) resolve({ error: chrome.runtime.lastError.message });
      else resolve(response || {});
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getErrorMessage(error) {
  const msg = error.message || String(error);
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) return 'Cannot connect to the TaxPilot backend.';
  if (msg.includes('429')) return 'Too many requests. Please wait a moment and try again.';
  return msg;
}

// ── Initialize ─────────────────────────────────────────────

initSession();
switchTab('overview');

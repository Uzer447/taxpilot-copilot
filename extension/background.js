/**
 * TaxPilot Copilot — Background Service Worker
 *
 * Orchestrates communication between the side panel, content script,
 * and backend. Handles:
 * - Keyboard shortcut (Alt+Shift+T)
 * - Extension icon click → open side panel
 * - Context menu "Explain with TaxPilot"
 * - Screenshot capture via chrome.tabs.captureVisibleTab
 * - Message relay between components
 */

const BACKEND_URL = 'http://localhost:3000';

// ── Setup ──────────────────────────────────────────────────

// We handle side panel opening manually so we can send the analysis trigger message
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(console.error);

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'explain-selection',
    title: 'Explain with TaxPilot',
    contexts: ['selection'],
  });
  console.log('[TaxPilot] Extension installed, context menu created');
});

// ── Action / Shortcut Handler ───────────────────────────────

chrome.action.onClicked.addListener(async (tab) => {
  console.log('[TaxPilot] Action clicked or shortcut triggered');
  try {
    // Open the side panel for the current window
    await chrome.sidePanel.open({ windowId: tab.windowId });
    
    // Small delay to let side panel initialize, then trigger analysis automatically
    setTimeout(() => {
      chrome.runtime.sendMessage({ action: 'trigger-analysis' });
    }, 500);
  } catch (err) {
    console.error('[TaxPilot] Failed to open side panel', err);
  }
});

// ── Context Menu ───────────────────────────────────────────

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'explain-selection' && info.selectionText) {
    console.log('[TaxPilot] Context menu: explain selection');

    // Open side panel first
    await chrome.sidePanel.open({ windowId: tab.windowId });

    // Small delay, then send the selection to the side panel
    setTimeout(() => {
      chrome.runtime.sendMessage({
        action: 'explain-selection',
        data: {
          selectedText: info.selectionText,
          pageTitle: tab.title,
          pageUrl: tab.url,
        },
      });
    }, 500);
  }
});

// ── Message Handler ────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'capture-screenshot') {
    handleScreenshot(sendResponse);
    return true; // async response
  }

  if (message.action === 'extract-dom') {
    handleDOMExtraction(message.tabId, sendResponse);
    return true; // async response
  }

  if (message.action === 'get-selected-text') {
    handleGetSelection(message.tabId, sendResponse);
    return true; // async response
  }

  if (message.action === 'get-active-tab') {
    handleGetActiveTab(sendResponse);
    return true; // async response
  }

  if (message.action === 'trigger_sync') {
    handleTriggerSync();
    return true;
  }
});

// ── Handlers ───────────────────────────────────────────────

/**
 * Capture a screenshot of the currently visible tab.
 */
async function handleScreenshot(sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      sendResponse({ error: 'No active tab found' });
      return;
    }

    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: 'jpeg',
      quality: 50,
    });

    // Compress image using OffscreenCanvas to drastically reduce payload size for the AI
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    
    const MAX_WIDTH = 800;
    let width = bitmap.width;
    let height = bitmap.height;
    
    if (width > MAX_WIDTH) {
      height = Math.floor(height * (MAX_WIDTH / width));
      width = MAX_WIDTH;
    }
    
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, width, height);
    
    const blobResized = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.5 });
    const buffer = await blobResized.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    
    // Convert to base64
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    
    const base64 = btoa(binary);
    const resizedDataUrl = 'data:image/jpeg;base64,' + base64;

    sendResponse({ screenshot: resizedDataUrl });
  } catch (error) {
    console.error('[TaxPilot] Screenshot error:', error);
    sendResponse({ error: `Screenshot failed: ${error.message}` });
  }
}

/**
 * Ensure the content script is injected into the given tab.
 * If the content script wasn't loaded (e.g., page was open before
 * the extension was installed), inject it programmatically.
 */
async function ensureContentScript(tabId) {
  try {
    await chrome.tabs.sendMessage(tabId, { action: 'ping' });
  } catch {
    // Content script not loaded — inject it
    console.log('[TaxPilot] Injecting content script into tab', tabId);
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js'],
    });
    // Small delay to let it initialize
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

/**
 * Extract DOM data from the active tab via the content script.
 */
async function handleDOMExtraction(tabId, sendResponse) {
  try {
    let targetTabId = tabId;

    if (!targetTabId) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        sendResponse({ error: 'No active tab found' });
        return;
      }
      targetTabId = tab.id;
    }

    // Ensure content script is injected
    await ensureContentScript(targetTabId);

    const response = await chrome.tabs.sendMessage(targetTabId, { action: 'extract-dom' });
    sendResponse(response);
  } catch (error) {
    console.error('[TaxPilot] DOM extraction error:', error);
    sendResponse({ error: `DOM extraction failed: ${error.message}` });
  }
}

/**
 * Get selected text from the active tab.
 */
async function handleGetSelection(tabId, sendResponse) {
  try {
    let targetTabId = tabId;

    if (!targetTabId) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        sendResponse({ error: 'No active tab found' });
        return;
      }
      targetTabId = tab.id;
    }

    const response = await chrome.tabs.sendMessage(targetTabId, { action: 'get-selection' });
    sendResponse(response);
  } catch (error) {
    console.error('[TaxPilot] Selection error:', error);
    sendResponse({ error: `Selection failed: ${error.message}` });
  }
}

/**
 * Get the currently active tab info.
 */
async function handleGetActiveTab(sendResponse) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      sendResponse({ error: 'No active tab found' });
      return;
    }
    sendResponse({
      tabId: tab.id,
      title: tab.title,
      url: tab.url,
    });
  } catch (error) {
    sendResponse({ error: `Failed to get active tab: ${error.message}` });
  }
}

/**
 * Handle manual or automatic trigger to sync context to the backend
 */
async function handleTriggerSync() {
  console.log('[TaxPilot] Triggering context sync');
  try {
    const { jwt_token } = await chrome.storage.local.get('jwt_token');
    if (!jwt_token) {
      console.log('[TaxPilot] No JWT token found, skipping sync');
      return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;

    // 1. Get DOM Data
    await ensureContentScript(tab.id);
    const domResponse = await chrome.tabs.sendMessage(tab.id, { action: 'extract-dom' });
    if (!domResponse || domResponse.error) {
      throw new Error(domResponse?.error || 'Failed to extract DOM');
    }

    // 2. Get Screenshot
    const screenshotDataUrl = await new Promise((resolve) => {
      handleScreenshot((res) => resolve(res.screenshot));
    });

    // 3. Send to Backend
    const backendUrl = 'https://taxpilot-copilot.onrender.com/api/extension/context'; // For production
    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwt_token}`
      },
      body: JSON.stringify({
        domData: domResponse.data,
        screenshot: screenshotDataUrl,
        pageTitle: tab.title,
        pageUrl: tab.url,
      })
    });
    
    const result = await res.json();
    console.log('[TaxPilot] Sync result:', result);
  } catch (err) {
    console.error('[TaxPilot] Sync failed:', err);
  }
}

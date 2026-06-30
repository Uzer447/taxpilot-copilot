# Changelog

All notable changes to **TaxPilot Copilot** will be documented in this file.

## [1.1.0] - V1: Personalized Tax Companion

### 🚀 Features
- **Document Upload:** You can now upload your Form 16 or Salary Slips directly into the side panel extension via a drag-and-drop interface before analyzing a page.
- **Personalized Recommendations:** The copilot evolves from a generic explainer into a personalized assistant. It reads your uploaded documents and provides specific recommendations for form fields (e.g., "Based on your Form 16, enter ₹13,42,500 here").
- **Confidence Badges:** Every AI recommendation now includes a confidence indicator (High, Medium, Low) and cites the exact source document it used to make the suggestion.
- **Inconsistency Alerts:** The AI actively cross-references the values shown on the Income Tax portal against your uploaded documents. If it detects a mismatch, it throws a highly visible alert detailing the discrepancy.
- **Missing Document Suggestions:** If the AI determines that additional documents (like Form 26AS) would improve its analysis, it suggests them at the bottom of the results.

### ⚙️ Backend & Architecture
- **In-Memory Session Store:** Implemented a backend session manager (`documents.js`) that handles document parsing (`pdf-parse`) and securely stores them in memory.
- **Prompt Injection:** Completely overhauled the Gemini system prompts to dynamically inject document context and output structured JSON containing recommendations and inconsistencies.

## [1.0.0] - Initial Web Store Release

### 🚀 Features
- **Full Page Tax Analysis:** Click the extension icon to instantly analyze any Indian Income Tax portal page. The AI reads the form fields, checkboxes, and layout to explain exactly what you need to do.
- **Smart Data Extraction:** The copilot actively reads your screen, calling out specific numbers (e.g., TDS amounts, refunds, employer names) rather than giving generic advice.
- **Context Menu Explanations:** Right-click any confusing tax jargon on the page and select "Explain this tax term" to get an instant, plain-language breakdown in the side panel.
- **Selected Value Highlighting:** When analyzing forms, the AI automatically detects what you have currently selected in a dropdown or textbox and explicitly explains what your selection means.
- **Modern Side Panel UI:** Beautiful dark-mode interface featuring smooth micro-animations, skeleton loading states, and structured field-by-field breakdowns.

### ⚙️ Backend & Architecture
- **Secure Architecture:** Moved all LLM logic to a dedicated Node.js/Express backend deployed on Render, keeping Gemini API keys fully secure and out of the Chrome extension.
- **Resilient AI Fallbacks:** Built a highly resilient Gemini API client. It targets the latest Flash models by default, but automatically and silently falls back to `gemini-2.5-flash-lite` if a model is unavailable (404) or rate-limited (429).
- **Cold-Start Handling:** Integrated smart error handling in the frontend to detect when the Render free-tier backend is "sleeping" and gracefully asks the user to wait while the server wakes up.
- **Optimized Payloads:** Implemented `OffscreenCanvas` in the background script to compress page screenshots before sending them to the backend, drastically reducing payload sizes and speeding up AI response times.

### 🛠 Preparation & Compliance
- **Manifest V3:** Fully compliant with Chrome's latest extension architecture.
- **Icons & Branding:** Added 16x16, 48x48, and 128x128 icons for the Chrome Web Store.
- **Version Bump:** Promoted extension from prototype (0.1.0) to production (1.0.0) for publishing.

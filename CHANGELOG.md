# Changelog

All notable changes to the TaxPilot Copilot extension and backend will be documented in this file.

## [2.5.0] - 2024-12-10

### Product Polish Release
- **Visual Overhaul**: Transformed the extension from a dark-themed demo into a premium, light-themed financial dashboard with an emerald green brand identity.
- **Tab Navigation**: Introduced a clear, persistent tab system (Overview, Review, Documents) for better workflow organization.
- **Staged Loading Experience**: Added a step-by-step loading timeline providing clear visibility into the AI's reasoning process (Capturing, Reading, Retrieving, Validating).
- **Expandable Recommendation Cards**: Improved readability by organizing health scores, field validation metrics, and categorized warnings into interactive cards.
- **Developer Mode**: Added a hidden developer panel (triple-click version badge) displaying LLM metadata, token usage, and processing times.
- **Accessibility & UX**: Added ARIA attributes, keyboard navigation support, improved contextual empty/error states, and smooth micro-animations.

## [2.0.0] - 2024-11-20

### Added
- **AI-Powered Page Review**: Proactively reviews and validates user-entered information against official tax rules and uploaded documents.
- **RAG Pipeline (Tax Knowledge Base)**: New, lightweight retrieval-augmented generation engine with ~60 curated Indian tax rules to ensure accuracy.
- **Filing Health Score**: A new UI widget that calculates a health score (0-100) based on identified issues and successfully validated fields.
- **Categorized Warnings**: Review findings are now grouped by severity (CRITICAL, WARNING, SUGGESTION, INFO).
- **Evidence-Backed Recommendations**: Every suggestion cites specific sources (e.g., "Section 17(1)", "Form 16 Part B").
- **New API Route (`/api/review-page`)**: Dedicated backend endpoint for the validation flow, separate from the `explain-page` flow.

### Changed
- The side panel now has a distinct "Review This Page" action, active only when documents are uploaded.
- Updated extension manifest version to 2.0.0.

### Fixed
- Re-architected system prompts to strictly separate the "Explain" functionality (V1) from the "Review/Validate" functionality (V2).

---

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

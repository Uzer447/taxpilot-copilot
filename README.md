# TaxPilot Copilot

AI-powered browser companion that explains every field on the Indian Income Tax portal — directly within your browser.

---

## What It Does

Instead of taking screenshots and asking ChatGPT, TaxPilot explains every field on the current ITR page without you leaving the browser.

1. Open the Income Tax portal
2. Press **Alt+Shift+T** or click the extension icon
3. Get instant explanations for every field on the page
4. Continue filing with confidence

---

## Project Structure

```
AI_assited_tax_filing/
├── backend/                  # Node.js + Express server
│   ├── src/
│   │   ├── index.js          # Express server & routes
│   │   ├── gemini.js         # Gemini API client
│   │   ├── prompt.js         # System prompt & templates
│   │   └── validate.js       # Zod request validation
│   ├── .env.example           # Environment template
│   └── package.json
└── extension/                # Chrome Extension (Manifest V3)
    ├── manifest.json
    ├── background.js          # Service worker
    ├── content.js             # DOM extraction
    ├── sidepanel.html         # UI structure
    ├── sidepanel.css          # Styling
    ├── sidepanel.js           # UI logic
    └── icons/                 # Extension icons
```

---

## Setup

### 1. Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Select or create a Google Cloud project
5. Copy the generated API key

### 2. Setup the Backend

```bash
cd backend

# Create your .env file
cp .env.example .env

# Open .env and paste your Gemini API key
# GEMINI_API_KEY=your_actual_key_here

# Install dependencies
npm install

# Start the server
npm run dev
```

The server will start on `http://localhost:3000`.

Verify it's running:
```bash
curl http://localhost:3000/api/health
```

### 3. Load the Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right)
3. Click **"Load unpacked"**
4. Select the `extension/` folder from this project
5. The TaxPilot icon should appear in your toolbar

---

## Usage

### Analyze Full Page
1. Navigate to any page on the Income Tax portal
2. Press **Alt+Shift+T** or click the TaxPilot icon
3. Click **"Analyze This Page"** in the sidebar
4. Wait 3-5 seconds for the AI to analyze
5. Read the field-by-field explanations

### Explain Selected Text
1. Highlight any text on the page
2. Either:
   - Right-click → **"Explain with TaxPilot"**
   - Click **"Explain Selected Text"** in the sidebar
3. Get a detailed explanation of just that field

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Extension | Chrome Manifest V3 (Side Panel API) |
| Backend | Node.js + Express |
| AI Model | Gemini 2.5 Flash |
| Validation | Zod |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot connect to backend" | Make sure the backend is running: `cd backend && npm run dev` |
| "API key not configured" | Set `GEMINI_API_KEY` in `backend/.env` |
| "Screenshot failed" | Chrome can't capture internal pages (chrome://, extensions). Use regular web pages. |
| "Rate limit exceeded" | Free tier has 15 RPM. Wait a moment and retry. |
| Extension not showing | Check `chrome://extensions/` for errors. Click "Reload". |

---

## Future Plans (Post-V0)

- [ ] Custom extension icon design
- [ ] Deploy backend to cloud (Cloud Run / Railway)
- [ ] Form 16 analysis
- [ ] Multi-page reasoning
- [ ] User accounts & history

---

## License

This project is for personal use and learning purposes.

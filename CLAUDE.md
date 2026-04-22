# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A vanilla JavaScript Progressive Web App (PWA) for managing shopping lists. No build tools, bundlers, or frameworks - just pure HTML, CSS, and JavaScript with modern PWA features.

**Key characteristics:**
- Offline-first with Service Worker caching
- Multi-language support (English, Portuguese)
- localStorage for data persistence
- Installable as standalone app on desktop and mobile
- No npm, webpack, or any build process required

## Architecture

### Core Components

**1. App Layer (`app.js`)**
- `ShoppingListApp` class manages all application logic
- Handles item management (add, toggle, delete)
- Manages localStorage persistence
- Coordinates with i18n system
- Implements import/export/copy/paste functionality
- Uses XSS prevention via `escapeHtml()` method

**2. Internationalization (`i18n.js`)**
- `I18n` class handles translations and language switching
- Auto-detects browser language on first load
- Dynamically loads translation files from `locales/` directory
- **Important**: Switches manifest file based on selected language
  - English: `manifest.json`
  - Portuguese: `manifest-pt.json`
- Translations use `data-i18n` attributes and `data-i18n-placeholder` for placeholders

**3. Service Worker (`service-worker.js`)**
- Cache-first strategy for offline functionality
- Caches all static resources on install
- **Cache versioning**: Update `CACHE_NAME` constant when deploying changes
- Automatically cleans up old caches on activation
- Implements background sync and push notification handlers (for future use)

**4. Data Model**
Items stored in localStorage with this structure:
```javascript
{
  id: string,           // Timestamp-based unique ID
  text: string,         // Item text
  completed: boolean,   // Completion status
  createdAt: string,    // ISO timestamp
  completedAt?: string  // ISO timestamp (only if completed)
}
```

Two separate arrays:
- `shopping-list-items`: Active items
- `shopping-list-completed`: Completed items

### PWA Configuration

**Base Path**: Configured for deployment at `/shopping-list-pwa/`
- Set in both `manifest.json` and `manifest-pt.json` via `start_url` and `scope`
- Service worker cache paths use relative URLs (`./`)

**Icons**: Multiple sizes (48px to 512px) for various platforms
- Icon filenames: `icon-{size}.png`
- 192px icon marked as `maskable` for Android adaptive icons

## Development Workflow

### Local Development

No build step required. Serve the directory with any static file server:

```bash
# Option 1: Python (recommended)
python -m http.server 8000

# Option 2: Node.js
npx http-server

# Option 3: PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`

### Testing PWA Features

1. **Service Worker**: Requires HTTPS or localhost
   - Test offline: Open DevTools → Application → Service Workers → Check "Offline"
   - Clear cache: DevTools → Application → Clear storage

2. **Install Prompt**: Only appears when PWA criteria are met
   - Valid manifest
   - Service worker registered
   - Served over HTTPS (or localhost)

3. **Multi-language**:
   - Language preference stored in `localStorage` key: `shopping-list-language`
   - Test by changing language via UI globe icon
   - Verify manifest switch: Check DevTools → Application → Manifest

### Making Changes

**When modifying JavaScript/CSS:**
1. Make changes to source files
2. Increment `CACHE_NAME` in `service-worker.js` (e.g., `shopping-list-v2`)
3. Test locally
4. Users will get updated version on next page load

**When adding translations:**
1. Add keys to both `locales/en.json` and `locales/pt.json`
2. Use `data-i18n` attribute in HTML or `i18n.t('key.path')` in JavaScript
3. For placeholders, use `data-i18n-placeholder` attribute

**When modifying manifest:**
1. Update both `manifest.json` and `manifest-pt.json` to keep them in sync
2. Only difference should be localized fields: `name`, `short_name`, `description`, `lang`
3. Keep `start_url`, `scope`, `icons`, and other config identical

## Important Patterns

### XSS Prevention
Always use `escapeHtml()` when rendering user-generated content:
```javascript
escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

### Event Handling
The app uses a mix of approaches:
- Event listeners in `setupEventListeners()` for form and buttons
- Inline `onclick` attributes for dynamically created list items (calls global `app` instance methods)

### Offline Detection
App displays an offline indicator when network is unavailable:
- Listens to `online`/`offline` events
- Shows banner at bottom of screen when offline

## Data Import/Export

The app supports multiple ways to share data:

**Export**: Downloads JSON file with all items (active + completed)

**Copy**: Copies formatted text list to clipboard (active items only)

**Import**: 
- From file: JSON format matching export structure
- From paste: Accepts plain text (one item per line) or JSON

**Format compatibility**: Accepts both structured JSON and plain text for flexibility

## Git Workflow

This is a simple static site with no build artifacts to ignore. The repository tracks:
- All source files (HTML, CSS, JS)
- Icons and static assets
- Translation files
- Both manifest files

No `.gitignore` needed beyond standard `.claude/` directory.

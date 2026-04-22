# Shopping List PWA

A distinctive, offline-first Progressive Web App for managing shopping lists with a unique analog receipt aesthetic.

## Features

### Core Functionality
- ✅ Add and remove shopping list items
- ✅ Mark items as completed
- ✅ Search/filter items in real-time
- ✅ Track quantity and price per item
- ✅ Receipt-style totals with line items
- ✅ Share lists via copy/paste

### PWA Features
- ✅ Offline-first functionality with localStorage
- ✅ Installable as a PWA (desktop & mobile)
- ✅ Service worker caching
- ✅ Update notifications ("New version available")
- ✅ Dismissible offline indicator
- ✅ Responsive design for all screen sizes
- ✅ Dark mode support

### Design & UX
- 🧾 **Analog Receipt Aesthetic**: Unique thermal printer-inspired design
- 🌍 **Multi-language**: English and Portuguese with i18n
- 💰 **Localized Pricing**: USD ($1,234.56) and BRL (R$ 1.234,56)
- ✏️ **Inline Editing**: Edit item details without leaving the list
- 🎨 **Custom Typography**: IBM Plex Mono for authentic receipt feel

## How to Use

### Basic Operations
1. **Add items**: Type in the input field and click "Add"
2. **Complete items**: Click the checkbox to mark as done
3. **Delete items**: Click the × button
4. **Search**: Use the search box to filter items
5. **Edit details**: Click the pencil (✎) icon to add quantity/price

### Sharing Lists
- **Copy**: Copies your list to clipboard as formatted text
- **Paste**: Import a list from clipboard (supports plain text or JSON)

### Price Tracking
- Add quantity and price to any item via the edit button
- See line totals (quantity × price) for each item
- View grand total at the bottom of each list
- Prices automatically format based on selected language

### Installing
- Visit the app in your browser
- Click "Install App" when prompted
- The app will work offline after installation

## Files Structure

```
shopping_list/
├── index.html          # Main HTML file
├── style.css           # Analog receipt styling
├── app.js              # Application logic
├── i18n.js             # Internationalization system
├── service-worker.js   # Service worker for offline functionality
├── manifest.json       # PWA manifest (English)
├── manifest-pt.json    # PWA manifest (Portuguese)
├── locales/
│   ├── en.json         # English translations
│   └── pt.json         # Portuguese translations
├── icon-*.png          # App icons (48px to 512px)
├── CLAUDE.md           # Development guide for AI assistants
└── README.md           # This file
```

## Development

### Local Development

To serve locally, use any static file server:

```bash
# Using Python (recommended)
python -m http.server 8000

# On local network (for mobile testing)
python -m http.server 8000 --bind 0.0.0.0

# Using Node.js http-server
npx http-server

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000` in your browser.

### Service Worker Updates

When deploying changes, increment the cache version in `service-worker.js`:

```javascript
const CACHE_NAME = 'shopping-list-v8'; // Increment this
```

Users will see an "Update available" banner and can click to reload.

### Testing on Mobile

1. Start server with `--bind 0.0.0.0` flag
2. Find your local IP: `hostname -I`
3. Visit `http://YOUR_IP:8000` on your phone
4. Make sure both devices are on the same network
5. Open firewall port if needed: `sudo firewall-cmd --add-port=8000/tcp`

## Architecture

- **Vanilla JavaScript**: No frameworks, just modern ES6+
- **CSS Variables**: Theme colors defined with CSS custom properties
- **localStorage**: All data persists locally (no backend required)
- **Service Worker**: Network-first with cache fallback
- **i18n System**: Dynamic language switching with manifest updates

## Browser Support

- Chrome/Edge 80+
- Firefox 75+
- Safari 13+
- Mobile browsers with PWA support

## Completed Enhancements

- ✅ Search and filter functionality
- ✅ Quantity and price tracking
- ✅ Data sharing via clipboard (copy/paste)
- ✅ Multi-language support (EN/PT)
- ✅ Analog receipt design aesthetic
- ✅ PWA update notifications
- ✅ Dismissible offline indicator
- ✅ All icon sizes (48px to 512px)

## Future Ideas

- [ ] Drag and drop reordering
- [ ] Item categories/grouping
- [ ] Push notifications for shared lists
- [ ] Multiple shopping lists
- [ ] Shopping history/analytics

## License

This project was created as a PWA demonstration and is available for personal and educational use.

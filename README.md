# Shopping List PWA

A simple, offline-first Progressive Web App for managing shopping lists.

## Features

- ✅ Add and remove shopping list items
- ✅ Mark items as completed
- ✅ Offline-first functionality with localStorage
- ✅ Installable as a PWA
- ✅ Responsive design
- ✅ Dark mode support
- ✅ Service worker for caching

## How to Use

1. Open `index.html` in a web browser
2. Add items to your shopping list using the input field
3. Click the checkbox to mark items as completed
4. Use the × button to delete items
5. Install the app for offline use when prompted

## Files Structure

```
shopping_list/
├── index.html          # Main HTML file
├── style.css           # Styling and responsive design
├── app.js              # Main application logic
├── service-worker.js   # Service worker for offline functionality
├── manifest.json       # PWA manifest file
├── icon-192.png        # App icon (192x192) - placeholder
├── icon-512.png        # App icon (512x512) - placeholder
├── icon-32.png         # Favicon (32x32) - placeholder
└── README.md          # This file
```

## PWA Features

- **Offline First**: Works without internet connection
- **Installable**: Can be installed on desktop and mobile devices
- **Responsive**: Works on all screen sizes
- **Service Worker**: Caches resources for offline use
- **App Manifest**: Provides installation metadata

## Local Storage

The app uses browser localStorage to persist data:
- Shopping list items are stored locally
- Data persists across browser sessions
- No server required

## Development

To serve locally, you can use any static file server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js http-server
npx http-server

# Using PHP
php -S localhost:8000
```

Then visit `http://localhost:8000` in your browser.

## TODO/Enhancements

- [ ] Replace placeholder icons with actual PNG images
- [ ] Add drag and drop reordering
- [ ] Add categories for items
- [ ] Add quantity and notes for items
- [ ] Add data export/import functionality
- [ ] Add sharing capabilities
- [ ] Add push notifications (when appropriate)

## Browser Support

- Chrome/Edge 80+
- Firefox 75+
- Safari 13+
- Mobile browsers with PWA support
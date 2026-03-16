// Shopping List PWA App
class ShoppingListApp {
    constructor() {
        this.items = [];
        this.completedItems = [];
        this.init();
    }

    async init() {
        this.loadFromStorage();
        await this.setupI18n();
        this.setupEventListeners();
        this.setupServiceWorker();
        this.setupPWAInstall();
        this.setupOfflineIndicator();
        this.render();
    }

    // Setup internationalization
    async setupI18n() {
        if (window.i18n) {
            await window.i18n.init();

            // Listen for language changes
            window.addEventListener('languageChanged', () => {
                this.render(); // Re-render to apply new translations
            });
        }
    }

    // Load data from localStorage
    loadFromStorage() {
        const savedItems = localStorage.getItem('shopping-list-items');
        const savedCompleted = localStorage.getItem('shopping-list-completed');

        if (savedItems) {
            this.items = JSON.parse(savedItems);
        }

        if (savedCompleted) {
            this.completedItems = JSON.parse(savedCompleted);
        }
    }

    // Save data to localStorage
    saveToStorage() {
        localStorage.setItem('shopping-list-items', JSON.stringify(this.items));
        localStorage.setItem('shopping-list-completed', JSON.stringify(this.completedItems));
    }

    // Setup event listeners
    setupEventListeners() {
        const form = document.getElementById('add-item-form');
        const input = document.getElementById('item-input');
        const languageButton = document.getElementById('language-button');
        const languageMenu = document.getElementById('language-menu');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const itemText = input.value.trim();
            if (itemText) {
                this.addItem(itemText);
                input.value = '';
            }
        });

        // Clear input on escape
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                input.value = '';
            }
        });

        // Language dropdown
        if (languageButton && languageMenu && window.i18n) {
            const setMenuState = (open) => {
                languageMenu.classList.toggle('open', open);
                languageButton.setAttribute('aria-expanded', open);
                languageMenu.setAttribute('aria-hidden', !open);
            };

            languageButton.addEventListener('click', (e) => {
                e.stopPropagation();
                const isOpen = !languageMenu.classList.contains('open');
                setMenuState(isOpen);
            });

            languageMenu.querySelectorAll('.language-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    const lang = e.target.dataset.lang;
                    window.i18n.changeLanguage(lang);
                    setMenuState(false);
                });
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!languageMenu.contains(e.target) && !languageButton.contains(e.target)) {
                    setMenuState(false);
                }
            });
        }
    }

    // Add new item
    addItem(text) {
        const item = {
            id: Date.now().toString(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.items.unshift(item); // Add to beginning
        this.saveToStorage();
        this.render();
    }

    // Toggle item completion
    toggleItem(id) {
        const itemIndex = this.items.findIndex(item => item.id === id);

        if (itemIndex !== -1) {
            const item = this.items[itemIndex];
            item.completed = true;
            item.completedAt = new Date().toISOString();

            // Move to completed list
            this.completedItems.unshift(item);
            this.items.splice(itemIndex, 1);
        } else {
            // Check if it's in completed list (to uncomplete)
            const completedIndex = this.completedItems.findIndex(item => item.id === id);
            if (completedIndex !== -1) {
                const item = this.completedItems[completedIndex];
                item.completed = false;
                delete item.completedAt;

                // Move back to active list
                this.items.unshift(item);
                this.completedItems.splice(completedIndex, 1);
            }
        }

        this.saveToStorage();
        this.render();
    }

    // Delete item
    deleteItem(id) {
        // Check active items first
        let itemIndex = this.items.findIndex(item => item.id === id);
        if (itemIndex !== -1) {
            this.items.splice(itemIndex, 1);
        } else {
            // Check completed items
            itemIndex = this.completedItems.findIndex(item => item.id === id);
            if (itemIndex !== -1) {
                this.completedItems.splice(itemIndex, 1);
            }
        }

        this.saveToStorage();
        this.render();
    }

    // Create item HTML
    createItemElement(item, isCompleted = false) {
        const li = document.createElement('li');
        li.className = `item ${isCompleted ? 'completed' : ''}`;
        li.dataset.id = item.id;

        const deleteLabel = window.i18n ? window.i18n.t('ui.actions.delete') : 'Delete item';
        const toggleLabel = window.i18n ?
            (isCompleted ? window.i18n.t('ui.actions.uncomplete') : window.i18n.t('ui.actions.complete'))
            : (isCompleted ? 'Mark as incomplete' : 'Mark as complete');

        li.innerHTML = `
            <div class="item-checkbox ${isCompleted ? 'checked' : ''}"
                 onclick="app.toggleItem('${item.id}')"
                 aria-label="${toggleLabel}"
                 role="button"
                 tabindex="0"></div>
            <span class="item-text">${this.escapeHtml(item.text)}</span>
            <button class="delete-button" onclick="app.deleteItem('${item.id}')" aria-label="${deleteLabel}">×</button>
        `;

        return li;
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Render the lists
    render() {
        const activeList = document.getElementById('shopping-list');
        const completedList = document.getElementById('completed-list');
        const emptyState = document.getElementById('empty-state');
        const completedEmptyState = document.getElementById('completed-empty-state');

        // Clear existing items
        activeList.innerHTML = '';
        completedList.innerHTML = '';

        // Render active items
        if (this.items.length === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            this.items.forEach(item => {
                activeList.appendChild(this.createItemElement(item, false));
            });
        }

        // Render completed items
        if (this.completedItems.length === 0) {
            completedEmptyState.style.display = 'block';
        } else {
            completedEmptyState.style.display = 'none';
            this.completedItems.forEach(item => {
                completedList.appendChild(this.createItemElement(item, true));
            });
        }

        // Update stats
        this.updateStats();
    }

    // Update statistics
    updateStats() {
        const activeCount = document.getElementById('active-count');
        const completedCount = document.getElementById('completed-count');

        if (window.i18n) {
            const activeText = window.i18n.formatCount(
                this.items.length,
                'ui.stats.item',
                'ui.stats.items'
            );
            const completedText = window.i18n.formatCount(
                this.completedItems.length,
                'ui.stats.completed',
                'ui.stats.completed'
            );

            activeCount.textContent = activeText;
            completedCount.textContent = completedText;
        } else {
            // Fallback if i18n is not available
            const activeText = this.items.length === 1 ? '1 item' : `${this.items.length} items`;
            const completedText = this.completedItems.length === 1 ? '1 completed' : `${this.completedItems.length} completed`;

            activeCount.textContent = activeText;
            completedCount.textContent = completedText;
        }
    }

    // Setup service worker
    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./service-worker.js');
                console.log('Service Worker registered successfully:', registration);

                // Listen for updates
                registration.addEventListener('updatefound', () => {
                    console.log('New version available');
                    // You could show a notification to the user here
                });
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }

    // Setup PWA install prompt
    setupPWAInstall() {
        const installPrompt = document.getElementById('install-prompt');
        const installButton = document.getElementById('install-button');
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent the mini-infobar from appearing
            e.preventDefault();
            // Stash the event so it can be triggered later
            deferredPrompt = e;
            // Show the install button
            installPrompt.style.display = 'block';
        });

        installButton.addEventListener('click', async () => {
            if (deferredPrompt) {
                // Show the install prompt
                deferredPrompt.prompt();
                // Wait for the user to respond to the prompt
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to the install prompt: ${outcome}`);
                // We no longer need the prompt. Clear it up.
                deferredPrompt = null;
                installPrompt.style.display = 'none';
            }
        });

        // Hide install button if app is already installed
        window.addEventListener('appinstalled', () => {
            installPrompt.style.display = 'none';
            console.log('PWA was installed');
        });
    }

    // Setup offline indicator
    setupOfflineIndicator() {
        const offlineIndicator = document.getElementById('offline-indicator');

        const updateOnlineStatus = () => {
            if (navigator.onLine) {
                offlineIndicator.style.display = 'none';
            } else {
                offlineIndicator.style.display = 'block';
            }
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        // Initial check
        updateOnlineStatus();
    }

    // Utility method to clear all data (for testing)
    clearAll() {
        this.items = [];
        this.completedItems = [];
        this.saveToStorage();
        this.render();
    }

    // Export data (for backup)
    exportData() {
        const data = {
            items: this.items,
            completedItems: this.completedItems,
            exportDate: new Date().toISOString()
        };
        return JSON.stringify(data, null, 2);
    }

    // Import data (for restore)
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.items && Array.isArray(data.items)) {
                this.items = data.items;
            }
            if (data.completedItems && Array.isArray(data.completedItems)) {
                this.completedItems = data.completedItems;
            }
            this.saveToStorage();
            this.render();
            return true;
        } catch (error) {
            console.error('Failed to import data:', error);
            return false;
        }
    }
}

// Initialize the app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new ShoppingListApp();
});

// Prevent form submission when offline (though it should work offline anyway)
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('add-item-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            // The app handles this, but we ensure it doesn't cause page reload
            e.preventDefault();
        });
    }
});
// Shopping List PWA App
class ShoppingListApp {
    constructor() {
        this.items = [];
        this.completedItems = [];
        this.searchQuery = '';
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

        // Copy button
        const copyButton = document.getElementById('copy-button');
        if (copyButton) {
            copyButton.addEventListener('click', () => this.triggerCopy());
        }

        // Paste button (reads from clipboard)
        const pasteButton = document.getElementById('paste-button');
        if (pasteButton) {
            pasteButton.addEventListener('click', () => this.triggerImportFromPaste());
        }

        // Search input
        const searchInput = document.getElementById('search-input');
        const clearSearch = document.getElementById('clear-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.render();

                // Show/hide clear button
                if (clearSearch) {
                    clearSearch.style.display = this.searchQuery ? 'flex' : 'none';
                }
            });

            // Clear search on escape
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    searchInput.value = '';
                    this.searchQuery = '';
                    this.render();
                    if (clearSearch) {
                        clearSearch.style.display = 'none';
                    }
                }
            });
        }

        // Clear search button
        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.value = '';
                    this.searchQuery = '';
                    this.render();
                    clearSearch.style.display = 'none';
                    searchInput.focus();
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
        const editLabel = window.i18n ? window.i18n.t('ui.actions.edit') : 'Edit';
        const toggleLabel = window.i18n ?
            (isCompleted ? window.i18n.t('ui.actions.uncomplete') : window.i18n.t('ui.actions.complete'))
            : (isCompleted ? 'Mark as incomplete' : 'Mark as complete');

        const quantity = item.quantity || '';
        const price = item.price || '';
        const hasDetails = item.quantity || item.price;

        // Receipt-style display
        let detailsHTML = '';
        if (hasDetails) {
            const qty = item.quantity || 1;
            const priceFormatted = this.formatPrice(item.price || 0);
            const lineTotal = this.formatPrice((item.price || 0) * qty);

            detailsHTML = `
                <div class="item-details">
                    <span class="item-quantity">${qty}×</span>
                    <span class="item-price">${priceFormatted}</span>
                    <span class="item-line-total">${lineTotal}</span>
                </div>
            `;
        }

        li.innerHTML = `
            <div class="item-checkbox ${isCompleted ? 'checked' : ''}"
                 onclick="app.toggleItem('${item.id}')"
                 aria-label="${toggleLabel}"
                 role="button"
                 tabindex="0"></div>
            <div class="item-content">
                <span class="item-text">${this.escapeHtml(item.text)}</span>
                ${detailsHTML}
            </div>
            <button class="edit-button" onclick="app.showEditForm('${item.id}')" aria-label="${editLabel}">✎</button>
            <button class="delete-button" onclick="app.deleteItem('${item.id}')" aria-label="${deleteLabel}">×</button>
        `;

        return li;
    }

    // Show edit form for item
    showEditForm(id) {
        const item = this.items.find(i => i.id === id) || this.completedItems.find(i => i.id === id);
        if (!item) return;

        const listItem = document.querySelector(`.item[data-id="${id}"]`);
        if (!listItem) return;

        const qtyLabel = window.i18n ? window.i18n.t('ui.item.quantity') : 'Qty';
        const priceLabel = window.i18n ? window.i18n.t('ui.item.price') : 'Price';
        const saveLabel = window.i18n ? window.i18n.t('ui.actions.save') : 'Save';
        const cancelLabel = window.i18n ? window.i18n.t('ui.actions.cancel') : 'Cancel';

        const lang = window.i18n?.currentLang || 'en';
        const pricePlaceholder = lang === 'pt' ? '0,00' : '0.00';

        listItem.classList.add('editing');
        listItem.innerHTML = `
            <div class="edit-form">
                <div class="edit-row">
                    <label>${qtyLabel}</label>
                    <input type="number" class="edit-quantity" value="${item.quantity || ''}" min="0" step="1" placeholder="1">
                </div>
                <div class="edit-row">
                    <label>${priceLabel}</label>
                    <input type="text" class="edit-price" value="${item.price || ''}" placeholder="${pricePlaceholder}">
                </div>
                <div class="edit-actions">
                    <button class="save-button">${saveLabel}</button>
                    <button class="cancel-button">${cancelLabel}</button>
                </div>
            </div>
        `;

        // Event handlers
        const saveBtn = listItem.querySelector('.save-button');
        const cancelBtn = listItem.querySelector('.cancel-button');
        const qtyInput = listItem.querySelector('.edit-quantity');
        const priceInput = listItem.querySelector('.edit-price');

        saveBtn.addEventListener('click', () => {
            const quantity = qtyInput.value ? parseInt(qtyInput.value) : null;
            const price = this.parsePrice(priceInput.value);
            this.updateItemDetails(id, quantity, price);
        });

        cancelBtn.addEventListener('click', () => {
            this.render();
        });

        // Auto-focus quantity input
        qtyInput.focus();
    }

    // Escape HTML to prevent XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Format price based on current language
    formatPrice(price) {
        if (!price || price === 0) return '';

        const lang = window.i18n?.currentLang || 'en';

        if (lang === 'pt') {
            // Brazilian Real: R$ 1.234,56
            return 'R$ ' + price.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        } else {
            // US Dollar: $1,234.56
            return '$' + price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
    }

    // Parse price input based on current language
    parsePrice(input) {
        if (!input) return null;

        const lang = window.i18n?.currentLang || 'en';
        let cleaned = input.replace(/[R$\s]/g, '');

        if (lang === 'pt') {
            // Convert PT format (1.234,56) to number
            cleaned = cleaned.replace(/\./g, '').replace(',', '.');
        } else {
            // Convert EN format (1,234.56) to number
            cleaned = cleaned.replace(/,/g, '');
        }

        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
    }

    // Update item quantity and price
    updateItemDetails(id, quantity, price) {
        let item = this.items.find(i => i.id === id);
        if (!item) {
            item = this.completedItems.find(i => i.id === id);
        }

        if (item) {
            item.quantity = quantity || null;
            item.price = price || null;
            this.saveToStorage();
            this.render();
        }
    }

    // Calculate total for a list of items
    calculateTotal(items) {
        return items.reduce((total, item) => {
            const quantity = item.quantity || 1;
            const price = item.price || 0;
            return total + (quantity * price);
        }, 0);
    }

    // Filter items based on search query
    filterItems(items) {
        if (!this.searchQuery) {
            return items;
        }
        return items.filter(item =>
            item.text.toLowerCase().includes(this.searchQuery)
        );
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

        // Filter items based on search query
        const filteredItems = this.filterItems(this.items);
        const filteredCompleted = this.filterItems(this.completedItems);

        // Render active items
        if (this.items.length === 0) {
            emptyState.style.display = 'block';
        } else if (filteredItems.length === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            filteredItems.forEach(item => {
                activeList.appendChild(this.createItemElement(item, false));
            });
        }

        // Render completed items
        if (this.completedItems.length === 0) {
            completedEmptyState.style.display = 'block';
        } else if (filteredCompleted.length === 0) {
            completedEmptyState.style.display = 'block';
        } else {
            completedEmptyState.style.display = 'none';
            filteredCompleted.forEach(item => {
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

        // Update totals
        this.updateTotals();
    }

    updateTotals() {
        const activeTotal = this.calculateTotal(this.items);
        const completedTotal = this.calculateTotal(this.completedItems);

        const activeTotalDiv = document.getElementById('active-total');
        const activeTotalAmount = document.getElementById('active-total-amount');
        const completedTotalDiv = document.getElementById('completed-total');
        const completedTotalAmount = document.getElementById('completed-total-amount');

        // Show/hide active total
        if (activeTotal > 0) {
            activeTotalDiv.style.display = 'flex';
            activeTotalAmount.textContent = this.formatPrice(activeTotal);
        } else {
            activeTotalDiv.style.display = 'none';
        }

        // Show/hide completed total
        if (completedTotal > 0) {
            completedTotalDiv.style.display = 'flex';
            completedTotalAmount.textContent = this.formatPrice(completedTotal);
        } else {
            completedTotalDiv.style.display = 'none';
        }
    }

    // Setup service worker
    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('./service-worker.js');
                console.log('Service Worker registered successfully:', registration);

                // Check for updates every 60 seconds
                setInterval(() => {
                    registration.update();
                }, 60000);

                // Listen for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    console.log('New version found, installing...');

                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New service worker is installed but waiting to activate
                            console.log('New version available!');
                            this.showUpdateBanner(registration);
                        }
                    });
                });

                // Listen for when the new service worker takes control
                navigator.serviceWorker.addEventListener('controllerchange', () => {
                    console.log('New service worker activated, reloading...');
                    window.location.reload();
                });
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }

    // Show update available banner
    showUpdateBanner(registration) {
        const updateBanner = document.getElementById('update-banner');
        const updateButton = document.getElementById('update-button');
        const dismissButton = document.getElementById('dismiss-update');

        if (!updateBanner) return;

        // Show the banner
        updateBanner.style.display = 'block';

        // Update button - activate new service worker
        if (updateButton) {
            updateButton.addEventListener('click', () => {
                const waitingWorker = registration.waiting;
                if (waitingWorker) {
                    // Tell the waiting service worker to skip waiting
                    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
                }
            }, { once: true });
        }

        // Dismiss button - hide banner
        if (dismissButton) {
            dismissButton.addEventListener('click', () => {
                updateBanner.style.display = 'none';
            }, { once: true });
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
        const dismissOffline = document.getElementById('dismiss-offline');

        const updateOnlineStatus = () => {
            if (navigator.onLine) {
                offlineIndicator.style.display = 'none';
            } else {
                offlineIndicator.style.display = 'flex';
            }
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

        // Dismiss button
        if (dismissOffline) {
            dismissOffline.addEventListener('click', () => {
                offlineIndicator.style.display = 'none';
            });
        }

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

    // Export data as plain text (for sharing via message, copy/paste)
    exportAsText() {
        const lines = [];
        this.items.forEach(item => {
            lines.push(`[ ] ${item.text}`);
        });
        this.completedItems.forEach(item => {
            lines.push(`[x] ${item.text}`);
        });
        return lines.join('\n');
    }

    // Trigger export: download .txt file
    // Copy list as text to clipboard (Clipboard API only; requires HTTPS)
    async triggerCopy() {
        const text = this.exportAsText();
        if (!navigator.clipboard || !window.isSecureContext) {
            this.showCopyFallbackMessage();
            return;
        }
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            this.showCopyFallbackMessage();
        }
    }

    showCopyFallbackMessage() {
        const msg = window.i18n?.t('messages.copyRequiresHttps') ?? 'Copy requires a secure connection (HTTPS).';
        alert(msg);
    }

    // Trigger import from clipboard (for pasting shared list from message)
    async triggerImportFromPaste() {
        const showImportError = () => {
            if (window.i18n) {
                alert(window.i18n.t('messages.importError'));
            } else {
                alert('Failed to import. Paste a list with one item per line, or use [ ] and [x] for completed items.');
            }
        };

        try {
            const text = await navigator.clipboard.readText();
            const success = this.importData(text);
            if (!success) showImportError();
        } catch (error) {
            console.error('Failed to read clipboard:', error);
            showImportError();
        }
    }

    // Import data: accepts JSON or plain text ([ ] / [x] item per line)
    importData(text) {
        const trimmed = text.trim();
        if (!trimmed) return false;

        // Try JSON first (backward compatibility)
        if (trimmed.startsWith('{')) {
            try {
                const data = JSON.parse(text);
                const hasItems = Array.isArray(data.items);
                const hasCompletedItems = Array.isArray(data.completedItems);

                if (!hasItems && !hasCompletedItems) return false;

                this.items = hasItems ? data.items : [];
                this.completedItems = hasCompletedItems ? data.completedItems : [];
                this.saveToStorage();
                this.render();
                return true;
            } catch {
                return false;
            }
        }

        // Parse plain text format
        const items = [];
        const completedItems = [];
        const lines = text.split(/\r?\n/);

        for (const line of lines) {
            const t = line.trim();
            if (!t) continue;

            if (t.startsWith('[x] ') || t.startsWith('[X] ')) {
                completedItems.push(this.createItem(t.slice(4).trim(), true));
            } else if (!t.startsWith('[x] ') && !t.startsWith('[X] ')) {
                const itemText = t.startsWith('[ ] ') ? t.slice(4).trim() : t;
                if (itemText) items.push(this.createItem(itemText, false));
            }
        }

        if (items.length > 0 || completedItems.length > 0) {
            this.items = items;
            this.completedItems = completedItems;
            this.saveToStorage();
            this.render();
            return true;
        }

        return false;
    }

    createItem(text, completed = false) {
        const item = {
            id: Date.now().toString() + Math.random().toString(36).slice(2),
            text,
            completed,
            createdAt: new Date().toISOString()
        };
        if (completed) item.completedAt = new Date().toISOString();
        return item;
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

// Internationalization (i18n) Module
class I18n {
    constructor() {
        this.currentLang = 'en';
        this.translations = {};
        this.supportedLanguages = ['en', 'pt'];
        this.fallbackLang = 'en';
    }

    // Initialize i18n system
    async init() {
        // Load saved language preference
        const savedLang = localStorage.getItem('shopping-list-language');
        if (savedLang && this.supportedLanguages.includes(savedLang)) {
            this.currentLang = savedLang;
        } else {
            // Auto-detect browser language
            const browserLang = navigator.language.split('-')[0];
            if (this.supportedLanguages.includes(browserLang)) {
                this.currentLang = browserLang;
            }
        }

        // Load translations for current language
        await this.loadTranslations(this.currentLang);

        // Apply translations to the page
        this.applyTranslations();

        // Update HTML lang attribute
        document.getElementById('html-root').lang = this.currentLang;

        // Update manifest for PWA
        this.updateManifest(this.currentLang);

        // Set language selector value
        const selector = document.getElementById('language-select');
        if (selector) {
            selector.value = this.currentLang;
        }
    }

    // Load translation file
    async loadTranslations(lang) {
        try {
            const response = await fetch(`/locales/${lang}.json`);
            if (response.ok) {
                this.translations[lang] = await response.json();
            } else {
                console.warn(`Failed to load translations for ${lang}`);
                if (lang !== this.fallbackLang) {
                    await this.loadTranslations(this.fallbackLang);
                }
            }
        } catch (error) {
            console.error(`Error loading translations for ${lang}:`, error);
            if (lang !== this.fallbackLang) {
                await this.loadTranslations(this.fallbackLang);
            }
        }
    }

    // Get translation by key
    t(key, params = {}) {
        const translation = this.getNestedValue(this.translations[this.currentLang] || {}, key) ||
                          this.getNestedValue(this.translations[this.fallbackLang] || {}, key) ||
                          key;

        // Replace parameters in translation
        return this.interpolate(translation, params);
    }

    // Get nested object value by dot notation key
    getNestedValue(obj, key) {
        return key.split('.').reduce((o, k) => (o || {})[k], obj);
    }

    // Replace parameters in translation string
    interpolate(str, params) {
        return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    // Apply translations to all elements with data-i18n attributes
    applyTranslations() {
        // Translate text content
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.t(key);
        });

        // Translate placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
            const key = element.getAttribute('data-i18n-placeholder');
            element.placeholder = this.t(key);
        });

        // Translate aria-labels
        document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
            const key = element.getAttribute('data-i18n-aria-label');
            element.setAttribute('aria-label', this.t(key));
        });

        // Update document title
        const titleElement = document.querySelector('title[data-i18n]');
        if (titleElement) {
            document.title = this.t(titleElement.getAttribute('data-i18n'));
        }
    }

    // Change language
    async changeLanguage(newLang) {
        if (!this.supportedLanguages.includes(newLang)) {
            console.warn(`Language ${newLang} is not supported`);
            return false;
        }

        this.currentLang = newLang;
        localStorage.setItem('shopping-list-language', newLang);

        // Load translations if not already loaded
        if (!this.translations[newLang]) {
            await this.loadTranslations(newLang);
        }

        // Apply new translations
        this.applyTranslations();

        // Update HTML lang attribute
        document.getElementById('html-root').lang = newLang;

        // Update manifest link for PWA
        this.updateManifest(newLang);

        // Trigger custom event for other components to react
        window.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: newLang }
        }));

        return true;
    }

    // Get current language
    getCurrentLanguage() {
        return this.currentLang;
    }

    // Get available languages
    getSupportedLanguages() {
        return [...this.supportedLanguages];
    }

    // Format numbers/counts with proper pluralization
    formatCount(count, singularKey, pluralKey) {
        const key = count === 1 ? singularKey : pluralKey;
        return `${count} ${this.t(key)}`;
    }

    // Update manifest file based on language
    updateManifest(lang) {
        const manifestLink = document.querySelector('link[rel="manifest"]');
        if (manifestLink) {
            const manifestPath = lang === 'pt' ? '/manifest-pt.json' : '/manifest.json';
            manifestLink.href = manifestPath;
        }
    }
}

// Create global instance
window.i18n = new I18n();
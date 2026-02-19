/**
 * AI Configuration Manager
 * 
 * Manages AI service configuration including API keys, endpoints, and parameters.
 * Configuration is persisted in localStorage with API keys encoded in Base64.
 */
class AIConfigManager {
    /**
     * Create a new AIConfigManager instance
     */
    constructor() {
        this.STORAGE_KEY = 'ai.config';
        this.config = null;
        this.listeners = [];
        this.loadConfig();
    }

    /**
     * Load configuration from localStorage
     * @returns {Object|null} The loaded configuration or null if not found
     */
    loadConfig() {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                const config = JSON.parse(stored);
                // Decode API key if present
                if (config.apiKey) {
                    config.apiKey = this.decodeApiKey(config.apiKey);
                }
                this.config = { ...this.getDefaultConfig(), ...config };
                return this.config;
            }
        } catch (error) {
            console.error('Failed to load AI configuration:', error);
        }
        this.config = this.getDefaultConfig();
        return this.config;
    }

    /**
     * Save configuration to localStorage
     * @param {Object} config - The configuration to save
     * @returns {boolean} True if save was successful
     */
    saveConfig(config) {
        try {
            // Separate UI state from actual AI configuration
            const { panelCollapsed, panelWidth, ...configToValidate } = config;

            // Validate only AI configuration fields
            const validation = this.validateConfig(configToValidate);
            if (!validation.valid) {
                console.error('Invalid configuration:', validation.errors);
                return false;
            }

            // Merge UI state back for storage
            const fullConfig = { ...configToValidate, panelCollapsed, panelWidth };

            // Encode API key before storing
            const configToSave = { ...fullConfig };
            if (configToSave.apiKey) {
                configToSave.apiKey = this.encodeApiKey(configToSave.apiKey);
            }

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(configToSave));
            this.config = { ...config };
            this.notifyListeners();
            return true;
        } catch (error) {
            console.error('Failed to save AI configuration:', error);
            return false;
        }
    }

    /**
     * Validate configuration
     * @param {Object} config - The configuration to validate
     * @returns {Object} Validation result with valid flag and errors array
     */
    validateConfig(config) {
        const errors = [];

        // Check required fields
        if (!config.provider || !['openai', 'anthropic', 'custom'].includes(config.provider)) {
            errors.push('Invalid provider. Must be one of: openai, anthropic, custom');
        }

        if (!config.apiKey || config.apiKey.trim() === '') {
            errors.push('API key is required');
        }

        if (!config.model || config.model.trim() === '') {
            errors.push('Model name is required');
        }

        // Validate parameter ranges
        if (config.temperature !== undefined) {
            const temp = parseFloat(config.temperature);
            if (isNaN(temp) || temp < 0 || temp > 2) {
                errors.push('Temperature must be between 0 and 2');
            }
        }

        if (config.maxTokens !== undefined) {
            const tokens = parseInt(config.maxTokens);
            if (isNaN(tokens) || tokens < 1 || tokens > 8000) {
                errors.push('Max tokens must be between 1 and 8000');
            }
        }

        if (config.historyLimit !== undefined) {
            const limit = parseInt(config.historyLimit);
            if (isNaN(limit) || limit < 5 || limit > 100) {
                errors.push('History limit must be between 5 and 100');
            }
        }

        // Validate custom endpoint if provider is custom
        if (config.provider === 'custom') {
            if (!config.endpoint || config.endpoint.trim() === '') {
                errors.push('Endpoint is required for custom provider');
            } else {
                try {
                    new URL(config.endpoint);
                } catch (e) {
                    errors.push('Invalid endpoint URL format');
                }
            }
        }

        // Validate panel width
        if (config.panelWidth !== undefined) {
            const width = parseInt(config.panelWidth);
            if (isNaN(width) || width < 200 || width > 600) {
                errors.push('Panel width must be between 200 and 600');
            }
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Get default configuration
     * @returns {Object} Default configuration object
     */
    getDefaultConfig() {
        return {
            provider: 'openai',
            apiKey: '',
            endpoint: 'https://api.openai.com/v1/chat/completions',
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            maxTokens: 2000,
            historyLimit: 20,
            panelWidth: 300,
            panelCollapsed: false
        };
    }

    /**
     * Encode API key using Base64
     * @param {string} apiKey - The API key to encode
     * @returns {string} Base64 encoded API key
     */
    encodeApiKey(apiKey) {
        try {
            return btoa(apiKey);
        } catch (error) {
            console.error('Failed to encode API key:', error);
            return apiKey;
        }
    }

    /**
     * Decode Base64 encoded API key
     * @param {string} encodedKey - The Base64 encoded API key
     * @returns {string} Decoded API key
     */
    decodeApiKey(encodedKey) {
        try {
            return atob(encodedKey);
        } catch (error) {
            console.error('Failed to decode API key:', error);
            return encodedKey;
        }
    }

    /**
     * Get current configuration
     * @returns {Object} Current configuration
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Check if configuration is valid and complete
     * @returns {boolean} True if configuration is valid
     */
    isConfigured() {
        const validation = this.validateConfig(this.config);
        return validation.valid;
    }

    /**
     * Add configuration change listener
     * @param {Function} callback - Callback function to call when config changes
     */
    onChange(callback) {
        this.listeners.push(callback);
    }

    /**
     * Remove configuration change listener
     * @param {Function} callback - Callback function to remove
     */
    offChange(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    /**
     * Notify all listeners of configuration change
     */
    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.config);
            } catch (error) {
                console.error('Error in config change listener:', error);
            }
        });
    }

    /**
     * Reset configuration to defaults
     * @returns {boolean} True if reset was successful
     */
    resetToDefaults() {
        const defaults = this.getDefaultConfig();
        return this.saveConfig(defaults);
    }

    /**
     * Clear API key from configuration
     * @returns {boolean} True if clear was successful
     */
    clearApiKey() {
        const newConfig = { ...this.config, apiKey: '' };
        return this.saveConfig(newConfig);
    }
}

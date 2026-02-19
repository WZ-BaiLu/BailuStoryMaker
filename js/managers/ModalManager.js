/**
 * ModalManager
 * Manages modal dialogs and user interactions
 */
class ModalManager {
    /**
     * Create a ModalManager instance
     * @param {App} app - The main app instance
     * @param {Object} state - The app state manager
     */
    constructor(app, state) {
        this.app = app;
        this.state = state;
    }

    /**
     * Show the new story modal
     */
    showNewStoryModal() {
        document.getElementById('modal-title').textContent = i18n.t('modal.newStory');
        document.getElementById('modal-input').placeholder = i18n.t('placeholder.inputName');
        document.getElementById('modal-input').value = '';
        document.getElementById('modal').classList.remove('hidden');
    }

    /**
     * Hide the modal dialog
     */
    hideModal() {
        document.getElementById('modal').classList.add('hidden');
    }

    /**
     * Handle modal form submission
     * @param {Event} e - The form submit event
     */
    handleModalSubmit(e) {
        e.preventDefault();
        const title = document.getElementById('modal-input').value.trim();
        if (!title) return;

        const newStory = this.state.createStory(title);
        this.state.loadStory(newStory);
        this.hideModal();
        this.app.notificationManager.showSuccess(i18n.t('status.saved'));
    }

    /**
     * Show AI Configuration Modal
     */
    showAIConfigModal() {
        const config = this.app.aiConfigManager.getConfig();

        // Populate form fields with null checks
        const providerEl = document.getElementById('ai-provider');
        const apiKeyEl = document.getElementById('ai-api-key');
        const endpointEl = document.getElementById('ai-endpoint');
        const modelEl = document.getElementById('ai-model');
        const temperatureEl = document.getElementById('ai-temperature');
        const tempValueEl = document.getElementById('ai-temp-value');
        const maxTokensEl = document.getElementById('ai-max-tokens');
        const historyLimitEl = document.getElementById('ai-history-limit');

        if (providerEl) providerEl.value = config.provider || 'openai';
        if (apiKeyEl) apiKeyEl.value = config.apiKey || '';
        if (endpointEl) endpointEl.value = config.endpoint || '';
        if (modelEl) modelEl.value = config.model || '';
        if (temperatureEl) temperatureEl.value = config.temperature || 0.7;
        if (tempValueEl) tempValueEl.textContent = (config.temperature || 0.7).toString();
        if (maxTokensEl) maxTokensEl.value = config.maxTokens || 2000;
        if (historyLimitEl) historyLimitEl.value = config.historyLimit || 20;

        // Show/hide endpoint field based on provider
        this.toggleEndpointField(config.provider || 'openai');

        // Show modal
        const modal = document.getElementById('ai-config-modal');
        if (modal) modal.classList.remove('hidden');
    }

    /**
     * Hide AI Configuration Modal
     */
    hideAIConfigModal() {
        document.getElementById('ai-config-modal').classList.add('hidden');
    }

    /**
     * Toggle endpoint field visibility based on provider
     * @param {string} provider - Provider name
     */
    toggleEndpointField(provider) {
        const endpointGroup = document.getElementById('ai-endpoint-group');
        const endpointInput = document.getElementById('ai-endpoint');

        const defaultEndpoints = {
            'deepseek': 'https://api.deepseek.com/v1/chat/completions',
            'grok': 'https://api.x.ai/v1/chat/completions'
        };

        if (['custom', 'deepseek', 'grok'].includes(provider)) {
            endpointGroup.style.display = 'block';
            // Set default endpoint if provider has a default and input is empty or doesn't match expected pattern
            if (defaultEndpoints[provider] && endpointInput) {
                const currentVal = endpointInput.value.trim();
                if (!currentVal || !currentVal.includes('/chat/completions')) {
                    endpointInput.value = defaultEndpoints[provider];
                }
            }
        } else {
            endpointGroup.style.display = 'none';
        }
    }

    /**
     * Handle AI Configuration form submission
     * @param {Event} e - The form submit event
     */
    handleAIConfigSubmit(e) {
        e.preventDefault();

        const config = {
            provider: document.getElementById('ai-provider').value,
            apiKey: document.getElementById('ai-api-key').value.trim(),
            endpoint: document.getElementById('ai-endpoint').value.trim(),
            model: document.getElementById('ai-model').value.trim(),
            temperature: parseFloat(document.getElementById('ai-temperature').value),
            maxTokens: parseInt(document.getElementById('ai-max-tokens').value),
            historyLimit: parseInt(document.getElementById('ai-history-limit').value)
        };

        const validation = this.app.aiConfigManager.validateConfig(config);

        if (!validation.valid) {
            this.app.notificationManager.showError('配置无效: ' + validation.errors.join(', '));
            return;
        }

        const saved = this.app.aiConfigManager.saveConfig(config);

        if (saved) {
            this.hideAIConfigModal();
            this.app.notificationManager.showSuccess('配置已保存');
        } else {
            this.app.notificationManager.showError('保存配置失败');
        }
    }

    /**
     * Handle Test Connection
     */
    async handleTestConnection() {
        const config = {
            provider: document.getElementById('ai-provider').value,
            apiKey: document.getElementById('ai-api-key').value.trim(),
            endpoint: document.getElementById('ai-endpoint').value.trim(),
            model: document.getElementById('ai-model').value.trim()
        };

        const validation = this.app.aiConfigManager.validateConfig(config);

        if (!validation.valid) {
            this.app.notificationManager.showError('配置无效: ' + validation.errors.join(', '));
            return;
        }

        this.app.notificationManager.showInfo('正在测试连接...');

        const result = await this.app.aiService.testConnection(config);

        if (result.success) {
            this.app.notificationManager.showSuccess('连接测试成功！');
        } else {
            this.app.notificationManager.showError('连接失败: ' + result.error.message);
        }
    }

    /**
     * Handle Reset to Defaults
     */
    handleResetAIConfig() {
        if (!confirm('确定要重置为默认配置吗？')) {
            return;
        }

        const defaults = this.app.aiConfigManager.getDefaultConfig();

        const providerEl = document.getElementById('ai-provider');
        const apiKeyEl = document.getElementById('ai-api-key');
        const endpointEl = document.getElementById('ai-endpoint');
        const modelEl = document.getElementById('ai-model');
        const temperatureEl = document.getElementById('ai-temperature');
        const tempValueEl = document.getElementById('ai-temp-value');
        const maxTokensEl = document.getElementById('ai-max-tokens');
        const historyLimitEl = document.getElementById('ai-history-limit');

        if (providerEl) providerEl.value = defaults.provider;
        if (apiKeyEl) apiKeyEl.value = '';
        if (endpointEl) endpointEl.value = defaults.endpoint;
        if (modelEl) modelEl.value = defaults.model;
        if (temperatureEl) temperatureEl.value = defaults.temperature;
        if (tempValueEl) tempValueEl.textContent = defaults.temperature.toString();
        if (maxTokensEl) maxTokensEl.value = defaults.maxTokens;
        if (historyLimitEl) historyLimitEl.value = defaults.historyLimit;

        this.toggleEndpointField(defaults.provider);

        this.app.notificationManager.showInfo('已重置为默认配置，请点击保存');
    }

    /**
     * Handle Clear API Key
     */
    handleClearAIKey() {
        if (!confirm('确定要清除API密钥吗？')) {
            return;
        }

        document.getElementById('ai-api-key').value = '';
        this.app.notificationManager.showInfo('API密钥已清除');
    }
}


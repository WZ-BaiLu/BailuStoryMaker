/**
 * AI Manager
 * 
 * Manages AI assistant panel, chat interface, and user interactions.
 * Coordinates between AIConfigManager and AIService.
 */
class AIManager {
    /**
     * Create a new AIManager instance
     * @param {App} app - Main application instance
     * @param {Object} state - Application state
     * @param {AIConfigManager} configManager - AI configuration manager
     * @param {AIService} aiService - AI service
     * @param {NotificationManager} notificationManager - Notification manager
     */
    constructor(app, state, configManager, aiService, notificationManager) {
        this.app = app;
        this.state = state;
        this.configManager = configManager;
        this.aiService = aiService;
        this.notificationManager = notificationManager;

        this.STORAGE_KEY_HISTORY = 'ai.history';
        this.currentChatHistory = [];
        this.currentChapterId = null;
        this.lastUserMessage = null;
        this.isRequestPending = false;

        this.elements = {};
    }

    /**
     * Initialize AI Manager
     */
    initialize() {
        this.cacheElements();
        this.bindEvents();
        this.updateWarningBadge();
        this.loadPanelState();
        this.checkResponsiveLayout();

        // Initialize input height
        this.autoResizeInput();

        // Listen for configuration changes
        this.configManager.onChange(() => {
            this.updateWarningBadge();
        });

        // Listen for window resize
        window.addEventListener('resize', () => {
            this.checkResponsiveLayout();
        });
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            panel: document.getElementById('ai-assistant-panel'),
            panelHeader: document.getElementById('ai-panel-header'),
            panelContent: document.getElementById('ai-panel-content'),
            chatArea: document.getElementById('ai-chat-area'),
            inputField: document.getElementById('ai-input'),
            sendButton: document.getElementById('ai-send-button'),
            settingsButton: document.getElementById('ai-settings-button'),
            collapsedSettingsButton: document.getElementById('ai-collapsed-settings-button'),
            collapseButton: document.getElementById('ai-collapse-button'),
            expandButton: document.getElementById('ai-expand-button'),
            expandButtonHeader: document.getElementById('ai-expand-button-header'),
            clearHistoryButton: document.getElementById('ai-clear-history'),
            mobileButton: document.getElementById('ai-mobile-button'),
            drawerBackdrop: document.getElementById('ai-drawer-backdrop'),
            loadingIndicator: document.getElementById('ai-loading-indicator'),
            characterCounter: document.getElementById('ai-character-counter')
        };
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        if (this.elements.sendButton) {
            this.elements.sendButton.addEventListener('click', () => this.sendMessage());
        }

        if (this.elements.inputField) {
            this.elements.inputField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            this.elements.inputField.addEventListener('input', () => {
                this.updateCharacterCounter();
                this.autoResizeInput();
            });
        }

        if (this.elements.settingsButton) {
            this.elements.settingsButton.addEventListener('click', () => {
                this.openConfigModal();
            });
        }

        if (this.elements.collapsedSettingsButton) {
            this.elements.collapsedSettingsButton.addEventListener('click', () => {
                this.openConfigModal();
            });
        }

        if (this.elements.collapseButton) {
            this.elements.collapseButton.addEventListener('click', () => {
                this.togglePanel();
            });
        }

        if (this.elements.expandButton) {
            this.elements.expandButton.addEventListener('click', () => {
                this.togglePanel();
            });
        }

        if (this.elements.expandButtonHeader) {
            this.elements.expandButtonHeader.addEventListener('click', () => {
                this.togglePanel();
            });
        }

        if (this.elements.clearHistoryButton) {
            this.elements.clearHistoryButton.addEventListener('click', () => {
                this.clearHistory();
            });
        }

        if (this.elements.mobileButton) {
            this.elements.mobileButton.addEventListener('click', () => {
                this.showPanel();
            });
        }

        if (this.elements.drawerBackdrop) {
            this.elements.drawerBackdrop.addEventListener('click', () => {
                this.hidePanel();
            });
        }

        // Bind panel resize (if resize handle exists)
        const resizeHandle = document.getElementById('ai-resize-handle');
        if (resizeHandle) {
            this.bindResizeHandle(resizeHandle);
        }
    }

    /**
     * Bind resize handle for panel width adjustment
     */
    bindResizeHandle(handle) {
        let isResizing = false;

        handle.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const panel = this.elements.panel;
            if (!panel) return;

            const rect = panel.getBoundingClientRect();
            const newWidth = Math.max(200, Math.min(600, rect.right - e.clientX));

            this.adjustPanelWidth(newWidth);
        });

        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';

                // Save the new width
                const config = this.configManager.getConfig();
                const panelWidth = this.elements.panel?.offsetWidth || 300;
                this.configManager.saveConfig({ ...config, panelWidth });
            }
        });
    }

    /**
     * Show AI panel
     */
    showPanel() {
        const panel = this.elements.panel;
        if (panel) {
            panel.classList.remove('hidden');
            panel.classList.remove('collapsed');
        }

        // Show drawer backdrop on mobile
        if (this.isMobile()) {
            const backdrop = this.elements.drawerBackdrop;
            if (backdrop) {
                backdrop.classList.remove('hidden');
            }
        }
    }

    /**
     * Hide AI panel
     */
    hidePanel() {
        const panel = this.elements.panel;
        if (panel && this.isMobile()) {
            panel.classList.add('hidden');
        }

        // Hide drawer backdrop
        const backdrop = this.elements.drawerBackdrop;
        if (backdrop) {
            backdrop.classList.add('hidden');
        }
    }

    /**
     * Toggle panel visibility
     */
    togglePanel() {
        const panel = this.elements.panel;
        if (!panel) return;

        if (panel.classList.contains('collapsed')) {
            this.expandPanel();
        } else {
            this.collapsePanel();
        }
    }

    /**
     * Collapse panel
     */
    collapsePanel() {
        const panel = this.elements.panel;
        if (panel) {
            panel.classList.add('collapsed');
        }

        // Save state
        const config = this.configManager.getConfig();
        this.configManager.saveConfig({ ...config, panelCollapsed: true });
    }

    /**
     * Expand panel
     */
    expandPanel() {
        const panel = this.elements.panel;
        if (panel) {
            panel.classList.remove('collapsed');
        }

        // Save state
        const config = this.configManager.getConfig();
        this.configManager.saveConfig({ ...config, panelCollapsed: false });
    }

    /**
     * Adjust panel width
     * @param {number} width - New width in pixels
     */
    adjustPanelWidth(width) {
        const panel = this.elements.panel;
        if (panel) {
            panel.style.width = `${width}px`;
        }
    }

    /**
     * Send message to AI
     */
    async sendMessage() {
        const input = this.elements.inputField;
        if (!input) return;

        const message = input.value.trim();
        if (!message) return;

        if (this.isRequestPending) {
            this.notificationManager.showWarning('请等待当前请求完成');
            return;
        }

        // Check if configured
        if (!this.configManager.isConfigured()) {
            this.notificationManager.showError('请先配置AI服务');
            this.openConfigModal();
            return;
        }

        // Display user message
        this.displayMessage(message, 'user');
        this.lastUserMessage = message;

        // Clear input
        input.value = '';
        this.updateCharacterCounter();
        this.autoResizeInput();

        // Show loading
        this.showLoadingIndicator();
        this.isRequestPending = true;

        // Get context
        const context = this.buildContext();

        // Build message history
        const messages = this.buildMessageHistory(message);

        try {
            const config = this.configManager.getConfig();
            const result = await this.aiService.chat(config, messages, context);

            if (result.success) {
                // Display AI response
                this.displayMessage(result.data.content, 'assistant');
                this.saveHistory();
            } else {
                // Show error
                this.showError(result.error);
            }
        } catch (error) {
            this.showError({
                type: 'unknown_error',
                message: error.message
            });
        } finally {
            this.hideLoadingIndicator();
            this.isRequestPending = false;
        }
    }

    /**
     * Display message in chat area
     * @param {string} content - Message content
     * @param {string} role - Message role (user or assistant)
     */
    displayMessage(content, role) {
        const chatArea = this.elements.chatArea;
        if (!chatArea) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ai-message-${role}`;

        const timestamp = new Date().toLocaleTimeString();

        let actionButtons = '';
        if (role === 'assistant') {
            actionButtons = `
                <div class="ai-message-actions">
                    <button class="ai-action-btn ai-btn-insert" data-content="${this.escapeHtml(content)}">
                        插入到编辑器
                    </button>
                    <button class="ai-action-btn ai-btn-copy" data-content="${this.escapeHtml(content)}">
                        复制
                    </button>
                </div>
            `;
        }

        messageDiv.innerHTML = `
            <div class="ai-message-header">
                <span class="ai-message-role">${role === 'user' ? '您' : 'AI'}</span>
                <span class="ai-message-time">${timestamp}</span>
            </div>
            <div class="ai-message-content">${this.escapeHtml(content)}</div>
            ${actionButtons}
        `;

        chatArea.appendChild(messageDiv);
        this.autoScrollToBottom();

        // Bind action buttons
        if (role === 'assistant') {
            const insertBtn = messageDiv.querySelector('.ai-btn-insert');
            const copyBtn = messageDiv.querySelector('.ai-btn-copy');

            if (insertBtn) {
                insertBtn.addEventListener('click', () => {
                    this.insertToEditor(content);
                });
            }

            if (copyBtn) {
                copyBtn.addEventListener('click', () => {
                    this.copyToClipboard(content);
                });
            }
        }
    }

    /**
     * Show loading indicator
     */
    showLoadingIndicator() {
        const indicator = this.elements.loadingIndicator;
        if (indicator) {
            indicator.classList.remove('hidden');
        }
    }

    /**
     * Hide loading indicator
     */
    hideLoadingIndicator() {
        const indicator = this.elements.loadingIndicator;
        if (indicator) {
            indicator.classList.add('hidden');
        }
    }

    /**
     * Show error in chat area
     * @param {Object} error - Error object
     */
    showError(error) {
        const chatArea = this.elements.chatArea;
        if (!chatArea) return;

        const errorDiv = document.createElement('div');
        errorDiv.className = 'ai-message ai-message-error';

        const errorMessage = this.getErrorMessage(error);

        let retryButton = '';
        if (error.retryable) {
            retryButton = `
                <button class="ai-action-btn ai-btn-retry">重试</button>
            `;
        }

        errorDiv.innerHTML = `
            <div class="ai-message-header">
                <span class="ai-message-role">错误</span>
            </div>
            <div class="ai-message-content">
                <p>${errorMessage}</p>
                <div class="ai-message-actions">
                    ${retryButton}
                </div>
            </div>
        `;

        chatArea.appendChild(errorDiv);
        this.autoScrollToBottom();

        // Bind retry button
        const retryBtn = errorDiv.querySelector('.ai-btn-retry');
        if (retryBtn && this.lastUserMessage) {
            retryBtn.addEventListener('click', () => {
                // Remove error message
                errorDiv.remove();
                // Resend last message
                this.elements.inputField.value = this.lastUserMessage;
                this.sendMessage();
            });
        }
    }

    /**
     * Get error message based on error type
     * @param {Object} error - Error object
     * @returns {string} Error message
     */
    getErrorMessage(error) {
        const messages = {
            timeout: '请求超时，请重试',
            network_error: '网络连接失败，请检查网络',
            config_error: error.message,
            provider_error: error.message,
            unknown_error: error.message || '发生未知错误'
        };

        return messages[error.type] || messages.unknown_error;
    }

    /**
     * Insert content to editor
     * @param {string} content - Content to insert
     */
    insertToEditor(content) {
        // Check if there is a selected chapter
        if (!this.state.selectedChapter) {
            this.notificationManager.showError('请先选择一个章节');
            return;
        }

        let insertBeforeId = null;

        // 1. Check if there is a selected paragraph in UIRenderer
        const uiRenderer = this.app.uiRenderer;
        if (uiRenderer && uiRenderer.selectedParagraph) {
            insertBeforeId = uiRenderer.selectedParagraph;
        }
        // 2. Check if there is an editing paragraph
        else if (uiRenderer && uiRenderer.editingParagraph) {
            insertBeforeId = uiRenderer.editingParagraph;
        }
        // 3. Otherwise, insert at the end (no insertBeforeId needed)

        // Add new paragraph
        const paragraph = this.state.addParagraph(this.state.selectedChapter, insertBeforeId);

        // Set content
        this.state.updateParagraph(this.state.selectedChapter, paragraph.id, { content });

        // Refresh display
        this.app.uiRenderer.renderParagraphs();
        this.app.updateSaveStatus();

        this.notificationManager.showSuccess('已插入为新段落');
    }

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     */
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.notificationManager.showSuccess('已复制到剪贴板');
        } catch (error) {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                document.execCommand('copy');
                this.notificationManager.showSuccess('已复制到剪贴板');
            } catch (e) {
                this.notificationManager.showError('复制失败');
            }
            
            document.body.removeChild(textarea);
        }
    }

    /**
     * Auto scroll to bottom of chat area
     */
    autoScrollToBottom() {
        const chatArea = this.elements.chatArea;
        if (chatArea) {
            chatArea.scrollTop = chatArea.scrollHeight;
        }
    }

    /**
     * Update character counter
     */
    updateCharacterCounter() {
        const input = this.elements.inputField;
        const counter = this.elements.characterCounter;

        if (input && counter) {
            const count = input.value.length;
            counter.textContent = `${count}/4000`;

            if (count > 4000) {
                counter.style.color = 'var(--warning-color)';
            } else {
                counter.style.color = '';
            }
        }
    }

    /**
     * Auto-resize input field based on content
     */
    autoResizeInput() {
        const input = this.elements.inputField;
        if (!input) return;

        // Reset height to auto first to properly calculate
        input.style.height = 'auto';

        // Calculate new height based on scrollHeight
        const newHeight = Math.min(input.scrollHeight, 150);

        // Apply new height with minimum of 60px
        input.style.height = `${Math.max(newHeight, 60)}px`;
    }

    /**
     * Load chat history for chapter
     * @param {string} chapterId - Chapter ID
     */
    loadHistory(chapterId) {
        this.currentChapterId = chapterId;

        try {
            const allHistory = JSON.parse(localStorage.getItem(this.STORAGE_KEY_HISTORY) || '{}');
            this.currentChatHistory = allHistory[chapterId] || [];

            // Clear and reload chat area
            const chatArea = this.elements.chatArea;
            if (chatArea) {
                chatArea.innerHTML = '';
                this.currentChatHistory.forEach(msg => {
                    this.displayMessageWithoutActions(msg.content, msg.role, msg.timestamp);
                });
            }
        } catch (error) {
            console.error('Failed to load chat history:', error);
            this.currentChatHistory = [];
        }
    }

    /**
     * Display message without action buttons (for history loading)
     */
    displayMessageWithoutActions(content, role, timestamp) {
        const chatArea = this.elements.chatArea;
        if (!chatArea) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ai-message-${role}`;

        messageDiv.innerHTML = `
            <div class="ai-message-header">
                <span class="ai-message-role">${role === 'user' ? '您' : 'AI'}</span>
                <span class="ai-message-time">${new Date(timestamp).toLocaleTimeString()}</span>
            </div>
            <div class="ai-message-content">${this.escapeHtml(content)}</div>
        `;

        chatArea.appendChild(messageDiv);
    }

    /**
     * Save chat history
     */
    saveHistory() {
        if (!this.currentChapterId) return;

        try {
            const allHistory = JSON.parse(localStorage.getItem(this.STORAGE_KEY_HISTORY) || '{}');
            const config = this.configManager.getConfig();
            const limit = config.historyLimit || 20;

            // Keep only the most recent messages
            allHistory[this.currentChapterId] = this.currentChatHistory.slice(-limit);
            
            localStorage.setItem(this.STORAGE_KEY_HISTORY, JSON.stringify(allHistory));
        } catch (error) {
            console.error('Failed to save chat history:', error);
        }
    }

    /**
     * Clear current chat history
     */
    clearHistory() {
        if (!this.currentChapterId) return;

        if (!confirm('确定要清空当前会话历史吗？')) {
            return;
        }

        this.currentChatHistory = [];

        try {
            const allHistory = JSON.parse(localStorage.getItem(this.STORAGE_KEY_HISTORY) || '{}');
            delete allHistory[this.currentChapterId];
            localStorage.setItem(this.STORAGE_KEY_HISTORY, JSON.stringify(allHistory));

            // Clear chat area
            const chatArea = this.elements.chatArea;
            if (chatArea) {
                chatArea.innerHTML = '';
            }

            this.notificationManager.showSuccess('已清空历史');
        } catch (error) {
            console.error('Failed to clear chat history:', error);
            this.notificationManager.showError('清空历史失败');
        }
    }

    /**
     * Build message history for API request
     * @param {string} currentMessage - Current user message
     * @returns {Array} Message history array
     */
    buildMessageHistory(currentMessage) {
        const config = this.configManager.getConfig();
        const limit = config.historyLimit || 20;

        const messages = this.currentChatHistory.slice(-limit).map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        messages.push({
            role: 'user',
            content: currentMessage
        });

        return messages;
    }

    /**
     * Build context information
     * @returns {Object} Context object
     */
    buildContext() {
        if (!this.state.currentStory || !this.currentChapterId) {
            return null;
        }

        const chapter = this.state.currentStory.chapters.find(c => c.id === this.currentChapterId);
        if (!chapter) return null;

        const context = {
            chapterTitle: chapter.title || '',
            chapterContent: chapter.paragraphs?.map(p => p.content).join('\n\n') || ''
        };

        // Add characters if they appear in this chapter
        const mentionedCharacters = this.state.currentStory.characters.filter(char => {
            const content = context.chapterContent.toLowerCase();
            return content.includes(char.name.toLowerCase());
        });

        if (mentionedCharacters.length > 0) {
            context.characters = mentionedCharacters.map(c => c.name);
        }

        return context;
    }

    /**
     * Update warning badge on settings button
     */
    updateWarningBadge() {
        const settingsButton = this.elements.settingsButton;
        if (!settingsButton) return;

        const isConfigured = this.configManager.isConfigured();

        // Remove existing badge
        const existingBadge = settingsButton.querySelector('.ai-warning-badge');
        if (existingBadge) {
            existingBadge.remove();
        }

        if (!isConfigured) {
            const badge = document.createElement('span');
            badge.className = 'ai-warning-badge';
            badge.textContent = '⚠️';
            settingsButton.appendChild(badge);
        }
    }

    /**
     * Load panel state from config
     */
    loadPanelState() {
        const config = this.configManager.getConfig();
        const panel = this.elements.panel;

        if (panel && config) {
            // Set width
            if (config.panelWidth) {
                panel.style.width = `${config.panelWidth}px`;
            }

            // Set collapsed state
            if (config.panelCollapsed) {
                panel.classList.add('collapsed');
            }
        }
    }

    /**
     * Check responsive layout
     */
    checkResponsiveLayout() {
        const mobileButton = this.elements.mobileButton;
        if (!mobileButton) return;

        if (this.isMobile()) {
            mobileButton.classList.remove('hidden');
        } else {
            mobileButton.classList.add('hidden');
        }
    }

    /**
     * Check if current device is mobile
     * @returns {boolean} True if mobile
     */
    isMobile() {
        return window.innerWidth < 768;
    }

    /**
     * Escape HTML special characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Open configuration modal
     */
    openConfigModal() {
        // This will be implemented by the ModalManager
        if (this.app && this.app.modalManager) {
            this.app.modalManager.showAIConfigModal();
        }
    }

    /**
     * Update current chapter ID
     * @param {string} chapterId - New chapter ID
     */
    setCurrentChapter(chapterId) {
        if (this.currentChapterId !== chapterId) {
            this.loadHistory(chapterId);
        }
    }

    /**
     * Refresh AI panel
     */
    refresh() {
        this.updateWarningBadge();
    }
}

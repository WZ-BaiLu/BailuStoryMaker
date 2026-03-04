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

        this.tools = {};  // AI tools registry
        this.elements = {};

        // 新的管理器（延迟初始化）
        this.elementManager = null;
        this.stateTimeline = null;
        this.storyViewManager = null;
        this.stateContextCache = null;
        this.aiElementTools = null;
        this.aiPreviewManager = null;
        this.paragraphAnalyzer = null;
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

        // Initialize new Element/Event/State components
        this.initializeElementStateComponents();

        // Register AI tools
        this.registerAITools();

        // Register AI Element Tools (only if aiElementTools was initialized)
        if (this.aiElementTools) {
            this.registerAIElementTools();
        }

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
     * Initialize Element/Event/State components
     */
    initializeElementStateComponents() {
        // 检查这些类是否已经加载
        if (typeof ElementManager === 'undefined') {
            console.warn('[AIManager] ElementManager not loaded yet, skipping initialization');
            return;
        }

        // 检查 AIElementTools 是否已加载
        if (typeof AIElementTools === 'undefined') {
            console.warn('[AIManager] AIElementTools not loaded yet, skipping initialization');
            return;
        }

        // 检查 ParagraphAnalyzer 是否已加载
        if (typeof ParagraphAnalyzer === 'undefined') {
            console.warn('[AIManager] ParagraphAnalyzer not loaded yet, skipping initialization');
            return;
        }

        // 创建管理器实例
        this.elementManager = new ElementManager(this.state.currentStory || { elements: [] });
        this.stateTimeline = new StateTimeline(this.elementManager, this.state.currentStory || { chapters: [] });
        this.storyViewManager = new StoryViewManager(this.elementManager, this.stateTimeline);
        this.stateContextCache = new StateContextCache(this.stateTimeline, this.storyViewManager);
        this.aiElementTools = new AIElementTools(
            this.elementManager,
            this.stateTimeline,
            this.state.currentStory || { chapters: [] }
        );
        this.aiPreviewManager = new AIPreviewManager(
            this.state.currentStory || { chapters: [] },
            this.elementManager,
            this.stateTimeline,
            this.stateContextCache,
            this.aiElementTools
        );

        // Initialize Paragraph Analyzer
        this.paragraphAnalyzer = new ParagraphAnalyzer(
            this.state.currentStory || { chapters: [] },
            this.elementManager,
            this.aiService,
            this.configManager,
            this.aiElementTools
        );
    }

    /**
     * Re-initialize Element/Event/State components after story is loaded
     */
    reloadElementStateComponents() {
        // 检查这些类是否已经加载
        if (typeof ElementManager === 'undefined') {
            console.warn('[AIManager] ElementManager not loaded yet, skipping reload');
            return;
        }

        console.log('[AIManager] Reloading Element/Event/State components');
        console.log('[AIManager] Story elements:', this.state.currentStory?.elements?.length || 0);

        // 重新初始化 ElementManager 以加载迁移后的数据
        this.elementManager = new ElementManager(this.state.currentStory || { elements: [] });
        console.log('[AIManager] ElementManager initialized with elements:', this.elementManager.listElements().length);

        this.stateTimeline = new StateTimeline(this.elementManager, this.state.currentStory || { chapters: [] });
        this.storyViewManager = new StoryViewManager(this.elementManager, this.stateTimeline);
        this.stateContextCache = new StateContextCache(this.stateTimeline, this.storyViewManager);
        this.aiElementTools = new AIElementTools(
            this.elementManager,
            this.stateTimeline,
            this.state.currentStory || { chapters: [] }
        );
        this.aiPreviewManager = new AIPreviewManager(
            this.state.currentStory || { chapters: [] },
            this.elementManager,
            this.stateTimeline,
            this.stateContextCache,
            this.aiElementTools
        );

        // Re-initialize Paragraph Analyzer
        this.paragraphAnalyzer = new ParagraphAnalyzer(
            this.state.currentStory || { chapters: [] },
            this.elementManager,
            this.aiService,
            this.configManager,
            this.aiElementTools
        );

        console.log('[AIManager] Element/Event/State components reloaded');
    }

    /**
     * Register AI Element Tools
     */
    registerAIElementTools() {
        if (!this.aiElementTools) {
            console.warn('AIElementTools not initialized');
            return;
        }

        const toolDefinitions = this.aiElementTools.getToolDefinitions();

        toolDefinitions.forEach(definition => {
            // New format: { type: 'function', function: { name, description, parameters } }
            const funcDef = definition.function || definition;
            const name = funcDef.name;
            const parameters = funcDef.parameters;

            this.registerTool(
                name,
                {
                    type: parameters.type,
                    description: funcDef.description,
                    properties: parameters.properties,
                    required: parameters.required
                },
                (params) => this.aiElementTools[name](params)
            );
        });
    }

    /**
     * Register AI tools
     */
    registerAITools() {
        // Register updateCharacterState tool
        this.registerTool(
            'updateCharacterState',
            {
                type: 'object',
                description: 'Update character state based on story events',
                properties: {
                    characterId: {
                        type: 'string',
                        description: 'The ID of the character to update'
                    },
                    changes: {
                        type: 'object',
                        description: 'Character state changes',
                        properties: {
                            attributes: {
                                type: 'object',
                                description: 'Attribute changes (e.g., { health: "+10" })'
                            },
                            emotionalState: {
                                type: 'string',
                                description: 'Emotional state (e.g., happy, sad, angry, fear, neutral)'
                            }
                        }
                    },
                    paragraphId: {
                        type: 'string',
                        description: 'The paragraph ID where the change occurs'
                    }
                },
                required: ['characterId', 'paragraphId']
            },
            (params) => this.updateCharacterState(params.characterId, params.changes, params.paragraphId)
        );

        // Register updateItemState tool
        this.registerTool(
            'updateItemState',
            {
                type: 'object',
                description: 'Update item state (acquire, lose, transfer, or modify)',
                properties: {
                    itemId: {
                        type: 'string',
                        description: 'The ID of the item to update'
                    },
                    action: {
                        type: 'string',
                        enum: ['acquire', 'lose', 'transfer', 'modify'],
                        description: 'The action to perform'
                    },
                    characterId: {
                        type: 'string',
                        description: 'The character ID (required for acquire, lose, transfer)'
                    },
                    location: {
                        type: 'string',
                        description: 'The location (optional)'
                    },
                    paragraphId: {
                        type: 'string',
                        description: 'The paragraph ID where the change occurs'
                    }
                },
                required: ['itemId', 'action', 'paragraphId']
            },
            (params) => this.updateItemState(params.itemId, params.action, params.characterId, params.location, params.paragraphId)
        );

        console.log(`[AIManager] Registered ${Object.keys(this.tools).length} AI tools`);
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
            previewCreationButton: document.getElementById('ai-preview-creation-btn'),
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
        console.log('[AIManager] bindEvents called');
        console.log('[AIManager] previewCreationButton element:', this.elements.previewCreationButton);

        if (this.elements.sendButton) {
            this.elements.sendButton.addEventListener('click', () => this.sendMessage());
        }

        if (this.elements.previewCreationButton) {
            this.elements.previewCreationButton.addEventListener('click', () => {
                console.log('[AIManager] Preview creation button clicked');
                this.previewCreationRequest();
            });
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

        // 1. Check if there is a selected paragraph
        if (this.state.selectedParagraph) {
            insertBeforeId = this.state.selectedParagraph;
        }
        // 2. Check if there is an editing paragraph
        else if (this.app.uiRenderer && this.app.uiRenderer.editingParagraph) {
            insertBeforeId = this.app.uiRenderer.editingParagraph;
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

        // 使用状态上下文组件
        if (this.stateContextCache && this.elementManager) {
            return this.buildContextWithStateCache(chapter);
        }
    }

    /**
     * Build context with state cache (new Element/Event/State driven)
     */
    buildContextWithStateCache(chapter) {
        const context = {
            chapterTitle: chapter.title || ''
        };

        // 获取当前选中的段落 ID
        const selectedParagraphId = this.state.selectedParagraph;

        if (selectedParagraphId) {
            // 1. 选中段落时：获取当前段落及之前的内容作为参考
            const paragraphIndex = chapter.paragraphs.findIndex(p => p.id === selectedParagraphId);
            if (paragraphIndex >= 0) {
                // 取选中段落及之前的段落（包含选中段落，但不包含之后的段落）
                const previousParagraphs = chapter.paragraphs.slice(0, paragraphIndex + 1);
                context.chapterContent = previousParagraphs.map(p => p.content).join('\n\n') || '';
            } else {
                // 如果找不到段落，回退到全部段落
                context.chapterContent = chapter.paragraphs?.map(p => p.content).join('\n\n') || '';
            }

            // 获取选中段落的状态上下文（不使用缓存，确保获取最新状态）
            const stateContext = this.stateContextCache.getContext(selectedParagraphId, {
                useCache: false,  // 不使用缓存，确保每次都获取最新状态
                useViewLocation: true
            });

            // 添加元素信息
            if (stateContext.elements && stateContext.elements.length > 0) {
                context.elements = stateContext.elements.map(element => ({
                    id: element.id,
                    type: element.type,
                    name: element.name,
                    description: element.description,
                    keywords: element.keywords,
                    location: element.location
                }));
            }

            // 添加在场元素
            if (stateContext.presentElements && stateContext.presentElements.length > 0) {
                context.presentElements = stateContext.presentElements;
            } else {
                // 如果 storyViewManager 没有返回在场元素，使用段落状态总结的逻辑
                const paragraphState = this.getParagraphPresentElements(chapter, selectedParagraphId);
                context.presentElements = paragraphState;
            }

            // 格式化当前段落的元素状态总结（始终生成）
            if (context.presentElements && context.presentElements.length > 0) {
                context.elementStateSummary = this.formatElementStateSummary(context.presentElements);
            } else {
                context.elementStateSummary = '无在场元素';
            }

            // 格式化上下文供 AI 使用
            if (this.stateContextCache.formatContextForAI) {
                context.formattedContext = this.stateContextCache.formatContextForAI(stateContext);
            }
        } else {
            // 2. 没有选中段落时：使用当前章节全部段落为文本参考
            context.chapterContent = chapter.paragraphs?.map(p => p.content).join('\n\n') || '';

            // 获取最后一个段落的状态上下文（包含所有段落的元素状态）
            const lastParagraph = chapter.paragraphs?.[chapter.paragraphs.length - 1];
            if (lastParagraph) {
                const stateContext = this.stateContextCache.getContext(lastParagraph.id, {
                    useCache: false,  // 不使用缓存，确保每次都获取最新状态
                    useViewLocation: true
                });

                // 添加在场元素
                if (stateContext.presentElements && stateContext.presentElements.length > 0) {
                    context.presentElements = stateContext.presentElements;
                } else {
                    // 如果 storyViewManager 没有返回在场元素，使用段落状态总结的逻辑
                    // 使用最后一个段落的 ID，因为它包含了所有段落的元素状态
                    const paragraphState = this.getParagraphPresentElements(chapter, lastParagraph.id);
                    context.presentElements = paragraphState;
                }

                // 格式化当前段落的元素状态总结（始终生成）
                if (context.presentElements && context.presentElements.length > 0) {
                    context.elementStateSummary = this.formatElementStateSummary(context.presentElements);
                } else {
                    context.elementStateSummary = '无在场元素';
                }
            }
        }

        return context;
    }

    /**
     * Format element state summary (as assistant message)
     * @param {Array} presentElements - Array of present elements
     * @returns {string} Formatted element state summary
     */
    formatElementStateSummary(presentElements) {
        if (!presentElements || presentElements.length === 0) {
            return '无在场元素';
        }

        const summary = presentElements.map(element => {
            let statusText = '';

            // 根据元素类型和状态生成状态描述
            if (element.type === 'character') {
                statusText = `角色：${element.name}`;
                if (element.location) {
                    statusText += `，位置：${element.location}`;
                }
            } else if (element.type === 'location') {
                statusText = `地点：${element.name}`;
            } else if (element.type === 'item') {
                statusText = `道具：${element.name}`;
            } else {
                statusText = `${element.name}`;
            }

            return statusText;
        }).join('\n');

        return summary;
    }

    /**
     * Get present elements at a paragraph position (similar to ParagraphStateSummary logic)
     * @param {Object} chapter - Chapter object
     * @param {string} paragraphId - Paragraph ID
     * @returns {Array} Array of present elements
     */
    getParagraphPresentElements(chapter, paragraphId) {
        const paragraphIndex = chapter.paragraphs.findIndex(p => p.id === paragraphId);
        if (paragraphIndex === -1) {
            return [];
        }

        const presentCharacterIds = new Set();
        const presentItemIds = new Set();
        const presentLocationIds = new Set();

        // 收集出现在该段落及之前的元素（包含选中段落本身）
        for (let i = 0; i <= paragraphIndex; i++) {
            const p = chapter.paragraphs[i];
            this._extractElementIdsFromParagraph(p, presentCharacterIds, presentItemIds, presentLocationIds);
        }

        // 构建在场元素列表
        const presentElements = [];

        // 添加角色
        presentCharacterIds.forEach(id => {
            const element = this.elementManager?.getElement(id);
            if (element) {
                presentElements.push({
                    id: element.id,
                    type: 'character',
                    name: element.name,
                    location: element.location
                });
            }
        });

        // 添加道具
        presentItemIds.forEach(id => {
            const element = this.elementManager?.getElement(id);
            if (element) {
                presentElements.push({
                    id: element.id,
                    type: 'item',
                    name: element.name,
                    location: element.location
                });
            }
        });

        // 添加地点
        presentLocationIds.forEach(id => {
            const element = this.elementManager?.getElement(id);
            if (element) {
                presentElements.push({
                    id: element.id,
                    type: 'location',
                    name: element.name
                });
            }
        });

        return presentElements;
    }

    /**
     * Extract element IDs from paragraph (similar to ParagraphStateSummary._extractElementIds)
     * @private
     */
    _extractElementIdsFromParagraph(paragraph, characterIds, itemIds, locationIds) {
        if (!paragraph.changes) return;

        // 使用统一的 elements 系统
        if (paragraph.changes.elements) {
            paragraph.changes.elements.forEach(elementChange => {
                const story = this.state.currentStory;
                const element = story.elements?.find(e =>
                    e.id === elementChange.elementId ||
                    e.name === elementChange.elementName
                );

                if (element) {
                    if (element.type === 'character') {
                        characterIds.add(element.id);
                    } else if (element.type === 'item') {
                        itemIds.add(element.id);
                    } else if (element.type === 'location') {
                        locationIds.add(element.id);
                    }
                }
            });
        }
    }

    /**
     * Format held items for a character (for AI prompts)
     * @param {string} characterId - Character ID
     * @returns {string} Formatted held items string
     */
    formatHeldItems(characterId) {
        const character = this.state.currentStory?.characters.find(c => c.id === characterId);
        if (!character || !character.heldItems || character.heldItems.length === 0) {
            return '  无';
        }

        const items = character.heldItems
            .map(itemId => {
                const item = this.state.currentStory.items.find(i => i.id === itemId);
                if (!item) return null;

                const itemTypes = {
                    weapon: '武器',
                    armor: '护甲',
                    tool: '工具',
                    quest: '任务物品',
                    other: '其他'
                };

                let properties = '';
                if (item.properties && item.properties.current) {
                    const propList = Object.entries(item.properties.current)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ');
                    if (propList) {
                        properties = ` (${propList})`;
                    }
                }

                return `  - ${item.name} [${itemTypes[item.type] || '其他'}]${properties}`;
            })
            .filter(item => item !== null)
            .join('\n');

        return items || '  无';
    }

    /**
     * Preview creation request (生成创作请求的预览)
     */
    previewCreationRequest() {
        console.log('[AIManager] previewCreationRequest called');

        const story = this.state.currentStory;
        if (!story) {
            this.notificationManager.showError(i18n.t('ai.paragraphAnalysis.noStory'));
            console.error('[AIManager] No story loaded');
            return;
        }

        const chapter = story.chapters.find(c => c.id === this.currentChapterId);
        if (!chapter) {
            this.notificationManager.showError(i18n.t('ai.paragraphAnalysis.noChapter'));
            console.error('[AIManager] No chapter found, currentChapterId:', this.currentChapterId);
            return;
        }

        console.log('[AIManager] Chapter found:', chapter.title);

        try {
            // Build creation context
            const context = this.buildContext();
            if (!context) {
                this.notificationManager.showError('无法构建创作上下文，请确保已选择章节');
                console.error('[AIManager] Failed to build context');
                console.error('[AIManager] stateContextCache exists:', !!this.stateContextCache);
                console.error('[AIManager] elementManager exists:', !!this.elementManager);
                return;
            }

            console.log('[AIManager] Context built successfully');

            // Get user input from chat input field (if any)
            const userMessage = this.elements.inputField.value.trim();

            // Build API request object for creation (using same logic as sendMessage)
            // If user has entered a message, preview that; otherwise use default creation prompt
            const apiRequest = this.buildAPIRequestObject(context, userMessage || null);

            // Show preview modal
            this.showCreationPreviewModal(context, apiRequest);

        } catch (error) {
            this.notificationManager.showError(`预览失败: ${error.message}`);
            console.error('[AIManager] Preview creation request error:', error);
        }
    }

    /**
     * Build API request object (used by preview methods to match sendMessage's logic)
     * @param {Object} context - The context object
     * @param {string} userMessage - Optional user message (from chat input field)
     * @returns {Object} API request object
     */
    buildAPIRequestObject(context, userMessage = null) {
        const config = this.configManager.getConfig();

        // If user provided a message, use it; otherwise use default creation prompt
        const promptText = userMessage || '请根据以下故事背景和上下文，创作一个新的段落或续写故事，注意保持故事的连贯性和人物性格的一致性。';

        // Build messages array (mimics sendMessage's logic)
        const messages = [
            { role: 'system', content: '你是一个专业的小说创作助手，擅长根据故事背景和上下文创作符合逻辑、生动的小说内容。' },
            { role: 'user', content: promptText }
        ];

        // Add context to messages (same logic as aiService.addContextToMessages)
        let finalMessages = messages;
        if (context) {
            const contextMessages = [];

            // Add system message with chapter title
            if (context.chapterTitle) {
                contextMessages.push({
                    role: 'assistant',
                    content: `Chapter Title: ${context.chapterTitle}`
                });
            }

            // Add assistant message with chapter content as reference
            if (context.chapterContent && context.chapterContent.trim() !== '') {
                contextMessages.push({
                    role: 'assistant',
                    content: `以下是当前章节已写的内容，作为创作参考：\n\n${context.chapterContent}`
                });
            }

            // Add assistant message with element state summary
            if (context.elementStateSummary) {
                contextMessages.push({
                    role: 'assistant',
                    content: `当前在场元素状态：\n${context.elementStateSummary}`
                });
            }

            finalMessages = [...contextMessages, ...messages];
        }

        // Build API request object (matches what aiService.chat would send)
        const apiRequest = {
            model: config.model,
            temperature: config.temperature,
            max_tokens: config.maxTokens,
            messages: finalMessages
        };

        return apiRequest;
    }

    /**
     * Show creation preview modal
     * @param {Object} context - The creation context
     * @param {Object} apiRequest - The API request object
     */
    showCreationPreviewModal(context, apiRequest) {
        const modal = document.createElement('div');
        modal.className = 'modal prompt-preview-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📝 ${i18n.t('buttons.previewCreationRequest')}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="preview-section">
                        <h4>创作上下文</h4>
                        <p><strong>章节:</strong> ${context.chapterTitle}</p>
                        <p><strong>在场元素:</strong> ${context.presentElements?.map(e => e.name).join(', ') || '无'}</p>
                    </div>
                    <div class="preview-section">
                        <h4>AI创作请求参数</h4>
                        <pre class="api-request-preview">${this.escapeHtml(JSON.stringify(apiRequest, null, 2))}</pre>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-cancel">关闭</button>
                    <button class="btn btn-primary modal-continue">开始创作</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Bind events
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.modal-cancel');
        const continueBtn = modal.querySelector('.modal-continue');

        const closeModal = () => {
            modal.remove();
        };

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);

        continueBtn.addEventListener('click', () => {
            closeModal();
            // Prompt user to input their creation request
            const userInput = this.elements.inputField?.value || '';
            if (userInput.trim()) {
                this.sendMessage();
            } else {
                this.notificationManager.showError('请在输入框中输入创作要求');
            }
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Close on Escape key
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        });
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

    // ==================== AI Tools Methods ====================

    /**
     * Register an AI tool
     * @param {string} name - Tool name
     * @param {Object} parameters - Tool parameter schema
     * @param {Function} handler - Tool handler function
     */
    registerTool(name, parameters, handler) {
        this.tools[name] = {
            name,
            parameters,
            handler
        };
        console.log(`[AIManager] Registered tool: ${name}`);
    }

    /**
     * Get all registered tools
     * @returns {Array} Array of tool definitions
     */
    getTools() {
        return Object.values(this.tools).map(tool => ({
            type: 'function',
            function: {
                name: tool.name,
                description: tool.parameters.description || '',
                parameters: tool.parameters
            }
        }));
    }

    /**
     * Execute a tool call
     * @param {string} toolName - Tool name
     * @param {Object} toolArgs - Tool arguments
     * @returns {Promise<Object>} Tool execution result
     */
    async executeTool(toolName, toolArgs) {
        const tool = this.tools[toolName];
        if (!tool) {
            return {
                success: false,
                error: `Tool not found: ${toolName}`
            };
        }

        try {
            const result = await tool.handler(toolArgs);
            return {
                success: true,
                data: result
            };
        } catch (error) {
            console.error(`[AIManager] Tool execution error:`, error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update character state
     * @param {string} characterId - Character ID
     * @param {Object} changes - Character changes
     * @param {string} paragraphId - Paragraph ID
     * @returns {Promise<Object>} Update result
     */
    async updateCharacterState(characterId, changes, paragraphId) {
        // Validate character ID
        const character = this.state.currentStory?.characters.find(c => c.id === characterId);
        if (!character) {
            throw new Error(`Character not found: ${characterId}`);
        }

        // Validate paragraph ID
        const paragraphIdToUse = paragraphId || this.state.selectedChapter;
        if (!paragraphIdToUse) {
            throw new Error('No paragraph ID specified and no chapter selected');
        }

        // Prepare character change record
        const characterChange = {
            characterId,
            characterName: character.name,
            changes: {},
            type: 'modified'
        };

        // Update character attributes if provided
        if (changes.attributes) {
            Object.assign(character.attributes.current, changes.attributes);
            characterChange.changes.attributes = changes.attributes;
        }

        // Update emotional state if provided
        if (changes.emotionalState) {
            character.emotionalState = changes.emotionalState;
            characterChange.changes.emotionalState = changes.emotionalState;
        }

        // Update character
        this.state.updateCharacter(characterId, character);

        // Add change to paragraph
        const chapter = this.state.currentStory?.chapters.find(c => c.id === this.state.selectedChapter);
        if (chapter && paragraphIdToUse) {
            const paragraph = chapter.paragraphs?.find(p => p.id === paragraphIdToUse);
            if (paragraph) {
                if (!paragraph.changes) {
                    paragraph.changes = { elements: [] };
                }
                if (!paragraph.changes.elements) {
                    paragraph.changes.elements = [];
                }
                // 添加到 elements 数组，并标记为 character 类型
                paragraph.changes.elements.push({
                    ...characterChange,
                    elementType: 'character'
                });
                this.state.updateParagraph(this.state.selectedChapter, paragraphIdToUse, { changes: paragraph.changes });
            }
        }

        // Show success notification
        this.notificationManager.showSuccess(`Character "${character.name}" state updated`);

        return {
            characterId,
            characterName: character.name,
            changes: characterChange.changes,
            message: `Updated ${character.name}: ${Object.keys(characterChange.changes).join(', ')}`
        };
    }

    /**
     * Update item state
     * @param {string} itemId - Item ID
     * @param {string} action - Action type (acquire, lose, transfer, modify)
     * @param {string} characterId - Character ID (optional)
     * @param {string} location - Location (optional)
     * @param {string} paragraphId - Paragraph ID
     * @returns {Promise<Object>} Update result
     */
    async updateItemState(itemId, action, characterId, location, paragraphId) {
        // Validate item ID
        const item = this.state.currentStory?.items.find(i => i.id === itemId);
        if (!item) {
            throw new Error(`Item not found: ${itemId}`);
        }

        // Validate action
        const validActions = ['acquire', 'lose', 'transfer', 'modify'];
        if (!validActions.includes(action)) {
            throw new Error(`Invalid action: ${action}. Must be one of: ${validActions.join(', ')}`);
        }

        // Validate character ID for acquire/lose/transfer actions
        if (['acquire', 'lose', 'transfer'].includes(action) && !characterId) {
            throw new Error('Character ID is required for this action');
        }

        if (characterId) {
            const character = this.state.currentStory?.characters.find(c => c.id === characterId);
            if (!character) {
                throw new Error(`Character not found: ${characterId}`);
            }
        }

        // Validate paragraph ID
        const paragraphIdToUse = paragraphId || this.state.selectedChapter;
        if (!paragraphIdToUse) {
            throw new Error('No paragraph ID specified and no chapter selected');
        }

        // Prepare item change record
        const itemChange = {
            itemId,
            itemName: item.name,
            action,
            characterId: characterId || null,
            location: location || null
        };

        // Update item state based on action
        switch (action) {
            case 'acquire':
                item.owner = characterId;
                itemChange.message = `${item.name} acquired`;
                break;
            case 'lose':
                if (item.owner === characterId) {
                    item.owner = null;
                    itemChange.message = `${item.name} lost`;
                }
                break;
            case 'transfer':
                if (item.owner === characterId) {
                    item.owner = characterId; // In transfer, characterId should be the new owner
                    itemChange.message = `${item.name} transferred`;
                }
                break;
            case 'modify':
                itemChange.message = `${item.name} modified`;
                break;
        }

        // Update item
        this.state.updateItem(itemId, item);

        // Add change to paragraph
        const chapter = this.state.currentStory?.chapters.find(c => c.id === this.state.selectedChapter);
        if (chapter && paragraphIdToUse) {
            const paragraph = chapter.paragraphs?.find(p => p.id === paragraphIdToUse);
            if (paragraph) {
                if (!paragraph.changes) {
                    paragraph.changes = { elements: [] };
                }
                if (!paragraph.changes.elements) {
                    paragraph.changes.elements = [];
                }
                // 添加到 elements 数组，并标记为 item 类型
                paragraph.changes.elements.push({
                    ...itemChange,
                    elementType: 'item'
                });
                this.state.updateParagraph(this.state.selectedChapter, paragraphIdToUse, { changes: paragraph.changes });
            }
        }

        return {
            itemId,
            itemName: item.name,
            action,
            message: itemChange.message
        };
    }

    /**
     * Analyze paragraph to extract elements, events, and state changes
     * @param {Object} paragraph - Paragraph to analyze
     * @param {Object} context - Context information (chapterId, etc.)
     * @returns {Promise<Object>} Analysis result
     */
    async analyzeParagraph(paragraph, context) {
        // Lazy initialize ParagraphAnalyzer if not ready
        if (!this.paragraphAnalyzer) {
            if (typeof ParagraphAnalyzer === 'undefined') {
                throw new Error('Paragraph analyzer module not loaded. Make sure ParagraphAnalyzer.js is included in the HTML.');
            }
            // Create with current story and element manager
            this.paragraphAnalyzer = new ParagraphAnalyzer(
                this.state.currentStory || { chapters: [] },
                this.elementManager || null, // Can be null initially
                this.aiService,
                this.configManager,
                this.aiElementTools
            );

            // Update with element manager if it becomes available
            if (this.elementManager) {
                this.paragraphAnalyzer.updateElementManager(this.elementManager);
            }
        } else {
            // Update story data
            this.paragraphAnalyzer.updateStory(this.state.currentStory || { chapters: [] });
            if (this.elementManager) {
                this.paragraphAnalyzer.updateElementManager(this.elementManager);
            }
        }

        try {
            const analysis = await this.paragraphAnalyzer.analyzeParagraph(paragraph, context);
            return {
                success: true,
                data: analysis
            };
        } catch (error) {
            console.error('[AIManager] Paragraph analysis error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Analyze multiple paragraphs in batch
     * @param {Array<Object>} paragraphs - Paragraphs to analyze
     * @param {Object} context - Context information
     * @returns {Promise<Array<Object>>} Analysis results
     */
    async analyzeParagraphs(paragraphs, context) {
        if (!this.paragraphAnalyzer) {
            throw new Error('Paragraph analyzer not initialized');
        }

        try {
            const results = await this.paragraphAnalyzer.analyzeParagraphs(paragraphs, context);
            return {
                success: true,
                data: results
            };
        } catch (error) {
            console.error('[AIManager] Batch analysis error:', error);
            return {
                success: false,
                error: error.message,
                data: []
            };
        }
    }

    /**
     * Apply paragraph analysis to story
     * @param {Object} analysis - Analysis result
     * @param {string} paragraphId - Paragraph ID
     * @returns {Promise<Object>} Application result
     */
    async applyParagraphAnalysis(paragraphId, analysis) {
        if (!this.paragraphAnalyzer) {
            throw new Error('Paragraph analyzer not initialized');
        }

        try {
            const result = await this.paragraphAnalyzer.applyAnalysis(analysis, paragraphId);
            return {
                success: true,
                data: result
            };
        } catch (error) {
            console.error('[AIManager] Apply analysis error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

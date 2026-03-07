/**
 * AI Manager (Refactored)
 * 
 * Manages AI assistant panel, chat interface, and user interactions.
 * Coordinates between AIConfigManager and AIService.
 * 
 * Refactoring improvements:
 * 1. Extracted AIEventManager - handles all event binding
 * 2. Extracted AIStateManager - handles character/item state updates
 * 3. Added error handling with UIErrorHandler
 * 4. Reduced bindEvents complexity (101 lines -> modular methods)
 * 5. Reduced updateItemState complexity (93 lines -> 20 lines)
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

        this.tools = {};
        this.elements = {};

        // Sub-modules
        this.elementManager = null;
        this.stateTimeline = null;
        this.storyViewManager = null;
        this.stateContextCache = null;
        this.aiElementTools = null;
        this.paragraphAnalyzer = null;
        this.continuousWritingManager = null;
        this.paragraphGenerator = null;

        // Builder components
        this.promptBuilder = null;
        this.messageBuilder = null;
        this.contextBuilder = null;
        this.requestCacheManager = null;

        // Error handler
        this.errorHandler = new UIErrorHandler('AIManager');

        // Extracted managers
        this.eventManager = null;
        this.stateManager = null;
    }

    /**
     * Initialize AI Manager
     */
    initialize() {
        try {
            this.cacheElements();
            
            // Initialize extracted managers
            this.eventManager = new AIEventManager(this);
            this.stateManager = new AIStateManager(this.state);
            
            this.eventManager.bindAll();
            this.updateWarningBadge();
            this.loadPanelState();
            this.checkResponsiveLayout();

            this.autoResizeInput();

            this.initializeElementStateComponents();
            this.registerAITools();

            if (this.aiElementTools) {
                this.registerAIElementTools();
            }

            this.configManager.onChange(() => {
                this.updateWarningBadge();
            });
        } catch (error) {
            this.errorHandler.handleError('initialize', error, {
                silent: false,
                message: 'AI 管理器初始化失败'
            });
        }
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            panel: document.getElementById('ai-assistant-panel'),
            collapseButton: document.getElementById('ai-panel-collapse'),
            sendButton: document.getElementById('ai-send-btn'),
            inputField: document.getElementById('ai-input'),
            chatMessages: document.getElementById('ai-chat-messages'),
            previewPanel: document.getElementById('ai-preview-panel'),
            previewContent: document.getElementById('ai-preview-content'),
            settingsButton: document.getElementById('ai-settings-btn'),
            collapsedSettingsButton: document.getElementById('ai-settings-btn-collapsed'),
            previewCreationButton: document.getElementById('ai-preview-create-btn'),
            continuousWritingButton: document.getElementById('ai-continuous-writing-btn'),
            continuousWritingPreviewButton: document.getElementById('ai-continuous-writing-preview-btn')
        };
    }

    /**
     * Register AI tools
     */
    registerAITools() {
        try {
            this.tools = {
                updateCharacterState: this._registerUpdateCharacterStateTool(),
                updateItemState: this._registerUpdateItemStateTool(),
                addCharacter: this._registerAddCharacterTool(),
                addItem: this._registerAddItemTool(),
                addLocation: this._registerAddLocationTool()
            };
        } catch (error) {
            this.errorHandler.handleError('registerAITools', error, {
                silent: true,
                message: 'AI 工具注册失败'
            });
        }
    }

    /**
     * Register updateCharacterState tool
     * @private
     */
    _registerUpdateCharacterStateTool() {
        return {
            type: 'function',
            function: {
                name: 'updateCharacterState',
                description: 'Update character state (attributes, emotional state, etc.)',
                parameters: {
                    type: 'object',
                    properties: {
                        characterId: {
                            type: 'string',
                            description: 'Character ID'
                        },
                        changes: {
                            type: 'object',
                            description: 'Changes to apply'
                        },
                        paragraphId: {
                            type: 'string',
                            description: 'Paragraph ID to record the change'
                        }
                    },
                    required: ['characterId', 'changes']
                }
            },
            executor: async (params) => 
                this.stateManager.updateCharacterState(params.characterId, params.changes, params.paragraphId)
        };
    }

    /**
     * Register updateItemState tool
     * @private
     */
    _registerUpdateItemStateTool() {
        return {
            type: 'function',
            function: {
                name: 'updateItemState',
                description: 'Update item state (acquire, lose, transfer, modify)',
                parameters: {
                    type: 'object',
                    properties: {
                        itemId: {
                            type: 'string',
                            description: 'Item ID'
                        },
                        action: {
                            type: 'string',
                            description: 'Action type: acquire, lose, transfer, modify',
                            enum: ['acquire', 'lose', 'transfer', 'modify']
                        },
                        characterId: {
                            type: 'string',
                            description: 'Character ID (for acquire/lose/transfer)'
                        },
                        location: {
                            type: 'string',
                            description: 'Location (optional)'
                        },
                        paragraphId: {
                            type: 'string',
                            description: 'Paragraph ID to record the change'
                        }
                    },
                    required: ['itemId', 'action']
                }
            },
            executor: async (params) => 
                this.stateManager.updateItemState(
                    params.itemId, 
                    params.action, 
                    params.characterId, 
                    params.location, 
                    params.paragraphId
                )
        };
    }

    /**
     * Register addCharacter tool
     * @private
     */
    _registerAddCharacterTool() {
        return {
            type: 'function',
            function: {
                name: 'addCharacter',
                description: 'Add a new character to the story',
                parameters: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Character name'
                        },
                        description: {
                            type: 'string',
                            description: 'Character description'
                        }
                    },
                    required: ['name']
                }
            },
            executor: async (params) => {
                const character = this.state.addCharacter(params);
                return { success: true, characterId: character.id };
            }
        };
    }

    /**
     * Register addItem tool
     * @private
     */
    _registerAddItemTool() {
        return {
            type: 'function',
            function: {
                name: 'addItem',
                description: 'Add a new item to the story',
                parameters: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Item name'
                        },
                        description: {
                            type: 'string',
                            description: 'Item description'
                        }
                    },
                    required: ['name']
                }
            },
            executor: async (params) => {
                const item = this.state.addItem(params);
                return { success: true, itemId: item.id };
            }
        };
    }

    /**
     * Register addLocation tool
     * @private
     */
    _registerAddLocationTool() {
        return {
            type: 'function',
            function: {
                name: 'addLocation',
                description: 'Add a new location to the story',
                parameters: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Location name'
                        },
                        description: {
                            type: 'string',
                            description: 'Location description'
                        }
                    },
                    required: ['name']
                }
            },
            executor: async (params) => {
                const location = this.state.addLocation(params);
                return { success: true, locationId: location.id };
            }
        };
    }

    /**
     * Send message to AI
     */
    async sendMessage() {
        try {
            if (this.isRequestPending) {
                this.notificationManager.showWarning('请求正在处理中，请稍候...');
                return;
            }

            const message = this.elements.inputField.value.trim();
            if (!message) {
                this.notificationManager.showWarning('请输入消息');
                return;
            }

            this.isRequestPending = true;
            this.lastUserMessage = message;

            this._appendUserMessage(message);
            this.elements.inputField.value = '';

            const response = await this.aiService.sendMessage({
                message,
                context: this._buildContext(),
                tools: this.tools
            });

            this._appendAIMessage(response);
            this.currentChatHistory.push({ role: 'user', content: message });
            this.currentChatHistory.push({ role: 'assistant', content: response });

        } catch (error) {
            this.errorHandler.handleError('sendMessage', error, {
                silent: false,
                message: '发送消息失败'
            });
        } finally {
            this.isRequestPending = false;
        }
    }

    /**
     * Build context for AI request
     * @private
     */
    _buildContext() {
        return {
            chapterId: this.state.selectedChapter,
            story: this.state.currentStory,
            selectedElement: this.state.selectedElement
        };
    }

    /**
     * Append user message to chat
     * @private
     */
    _appendUserMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'ai-message ai-message-user';
        messageDiv.textContent = message;
        this.elements.chatMessages.appendChild(messageDiv);
        this._scrollToBottom();
    }

    /**
     * Append AI message to chat
     * @private
     */
    _appendAIMessage(message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'ai-message ai-message-ai';
        messageDiv.textContent = message;
        this.elements.chatMessages.appendChild(messageDiv);
        this._scrollToBottom();
    }

    /**
     * Scroll chat to bottom
     * @private
     */
    _scrollToBottom() {
        this.elements.chatMessages.scrollTop = this.elements.chatMessages.scrollHeight;
    }

    /**
     * Update character counter
     */
    updateCharacterCounter() {
        const counter = document.getElementById('ai-character-counter');
        if (counter) {
            const count = this.elements.inputField.value.length;
            counter.textContent = `${count} 字`;
        }
    }

    /**
     * Auto resize input field
     */
    autoResizeInput() {
        if (this.elements.inputField) {
            this.elements.inputField.style.height = 'auto';
            this.elements.inputField.style.height = this.elements.inputField.scrollHeight + 'px';
        }
    }

    /**
     * Check responsive layout
     */
    checkResponsiveLayout() {
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
            this.elements.panel?.classList.add('ai-panel-mobile');
        } else {
            this.elements.panel?.classList.remove('ai-panel-mobile');
        }
    }

    /**
     * Toggle panel collapse
     */
    togglePanel() {
        this.elements.panel?.classList.toggle('collapsed');
        this._savePanelState();
    }

    /**
     * Load panel state from localStorage
     */
    loadPanelState() {
        try {
            const state = localStorage.getItem('ai.panel.state');
            if (state === 'collapsed') {
                this.elements.panel?.classList.add('collapsed');
            }
        } catch (error) {
            console.error('[AIManager] Failed to load panel state:', error);
        }
    }

    /**
     * Save panel state to localStorage
     * @private
     */
    _savePanelState() {
        try {
            const isCollapsed = this.elements.panel?.classList.contains('collapsed');
            localStorage.setItem('ai.panel.state', isCollapsed ? 'collapsed' : 'expanded');
        } catch (error) {
            console.error('[AIManager] Failed to save panel state:', error);
        }
    }

    /**
     * Update warning badge
     */
    updateWarningBadge() {
        const badge = document.getElementById('ai-warning-badge');
        if (!badge) return;

        const hasValidConfig = this.configManager.isConfigured();
        if (hasValidConfig) {
            badge.classList.add('hidden');
        } else {
            badge.classList.remove('hidden');
        }
    }

    /**
     * Switch AI panel tab
     * @param {string} tabId - Tab ID
     */
    switchTab(tabId) {
        document.querySelectorAll('.ai-panel-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        document.querySelectorAll('.ai-panel-content').forEach(content => {
            content.classList.add('hidden');
        });

        document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');
        document.getElementById(`ai-panel-${tabId}`)?.classList.remove('hidden');
    }

    /**
     * Open configuration modal
     */
    openConfigModal() {
        this.configManager.openModal();
    }

    /**
     * Initialize element/state components
     */
    initializeElementStateComponents() {
        if (typeof ElementManager === 'undefined') {
            console.warn('[AIManager] ElementManager not loaded yet, skipping initialization');
            return;
        }

        if (typeof AIElementTools === 'undefined') {
            console.warn('[AIManager] AIElementTools not loaded yet, skipping initialization');
            return;
        }

        try {
            this.elementManager = new ElementManager(this.state);
            this.stateTimeline = new StateTimeline(this.state);
            this.storyViewManager = new StoryViewManager(this.state, this.app.uiRenderer);
            this.stateContextCache = new StateContextCache(this.stateTimeline);
            this.aiElementTools = new AIElementTools(this.elementManager, this.stateTimeline);
            this.initializeBuilderComponents();

            console.log('[AIManager] Element/Event/State components initialized');
        } catch (error) {
            this.errorHandler.handleError('initializeElementStateComponents', error, {
                silent: true,
                message: '元素状态组件初始化失败'
            });
        }
    }

    /**
     * Initialize builder components
     */
    initializeBuilderComponents() {
        if (typeof AIPromptBuilder === 'undefined') {
            console.warn('[AIManager] AIPromptBuilder not loaded yet, skipping initialization');
            return;
        }
        if (typeof AIMessageBuilder === 'undefined') {
            console.warn('[AIManager] AIMessageBuilder not loaded yet, skipping initialization');
            return;
        }
        if (typeof AIContextBuilder === 'undefined') {
            console.warn('[AIManager] AIContextBuilder not loaded yet, skipping initialization');
            return;
        }
        if (typeof RequestCacheManager === 'undefined') {
            console.warn('[AIManager] RequestCacheManager not loaded yet, skipping initialization');
            return;
        }

        try {
            this.promptBuilder = new AIPromptBuilder();
            this.messageBuilder = new AIMessageBuilder(this.promptBuilder);
            this.contextBuilder = new AIContextBuilder(
                this.stateContextCache,
                this.elementManager,
                this.configManager
            );
            this.requestCacheManager = new RequestCacheManager();

            console.log('[AIManager] Builder components initialized');

            if (this.paragraphGenerator) {
                this.paragraphGenerator.promptBuilder = this.promptBuilder;
                this.paragraphGenerator.messageBuilder = this.messageBuilder;
                this.paragraphGenerator.contextBuilder = this.contextBuilder;
            }
            if (this.paragraphAnalyzer) {
                this.paragraphAnalyzer.promptBuilder = this.promptBuilder;
                this.paragraphAnalyzer.messageBuilder = this.messageBuilder;
                this.paragraphAnalyzer.contextBuilder = this.contextBuilder;
            }

            // Initialize Continuous Writing Manager
            if (typeof ContinuousWritingManager !== 'undefined') {
                this.continuousWritingManager = new ContinuousWritingManager(
                    this.state,
                    this,
                    this.notificationManager,
                    this.app.uiRenderer
                );
                console.log('[AIManager] ContinuousWritingManager initialized');
            }
        } catch (error) {
            this.errorHandler.handleError('initializeBuilderComponents', error, {
                silent: true,
                message: 'Builder 组件初始化失败'
            });
        }
    }

    /**
     * Register AI Element Tools
     */
    registerAIElementTools() {
        const tools = this.aiElementTools.getTools();
        Object.assign(this.tools, tools);
    }

    /**
     * Execute AI tool
     * @param {string} toolName - Tool name
     */
    async executeTool(toolName) {
        try {
            const tool = this.tools[toolName];
            if (!tool) {
                throw new Error(`Tool not found: ${toolName}`);
            }

            if (typeof tool.executor === 'function') {
                const result = await tool.executor();
                this.notificationManager.showSuccess(`工具 "${toolName}" 执行成功`);
                return result;
            }
        } catch (error) {
            this.errorHandler.handleError('executeTool', error, {
                silent: false,
                message: `工具 "${toolName}" 执行失败`
            });
        }
    }

    // Proxy methods for backward compatibility
    updateCharacterState(...args) {
        return this.stateManager.updateCharacterState(...args);
    }

    updateItemState(...args) {
        return this.stateManager.updateItemState(...args);
    }

    bindEvents(...args) {
        return this.eventManager.bindAll(...args);
    }
}

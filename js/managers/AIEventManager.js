/**
 * AIEventManager
 * Handles all event binding and unbinding for AIManager
 * Extracted from AIManager to reduce complexity
 */
class AIEventManager {
    constructor(aiManager) {
        this.aiManager = aiManager;
        this.elements = aiManager.elements;
    }

    /**
     * Bind all UI events
     */
    bindUIEvents() {
        this._bindSendButton();
        this._bindPreviewButton();
        this._bindContinuousWritingButtons();
        this._bindInputEvents();
        this._bindSettingsButtons();
        this._bindCollapseButton();
        this._bindTabButtons();
    }

    /**
     * Bind send button events
     */
    _bindSendButton() {
        if (this.elements.sendButton) {
            this.elements.sendButton.addEventListener('click', () => 
                this.aiManager.sendMessage()
            );
        }
    }

    /**
     * Bind preview button events
     */
    _bindPreviewButton() {
        if (this.elements.previewCreationButton) {
            this.elements.previewCreationButton.addEventListener('click', () => {
                console.log('[AIManager] Preview creation button clicked');
                this.aiManager.previewCreationRequest();
            });
        }
    }

    /**
     * Bind continuous writing button events
     */
    _bindContinuousWritingButtons() {
        if (this.elements.continuousWritingButton) {
            this.elements.continuousWritingButton.addEventListener('click', () => {
                console.log('[AIManager] Continuous writing button clicked');
                if (this.aiManager.app?.uiRenderer?.showContinuousWritingInputDialog) {
                    this.aiManager.app.uiRenderer.showContinuousWritingInputDialog();
                } else {
                    this.aiManager.notificationManager.showError('UI渲染器未初始化');
                }
            });
        }

        if (this.elements.continuousWritingPreviewButton) {
            this.elements.continuousWritingPreviewButton.addEventListener('click', () => {
                console.log('[AIManager] Continuous writing preview button clicked');
                this.aiManager.previewContinuousWritingRequest();
            });
        }
    }

    /**
     * Bind input field events
     */
    _bindInputEvents() {
        if (this.elements.inputField) {
            this.elements.inputField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.aiManager.sendMessage();
                }
            });

            this.elements.inputField.addEventListener('input', () => {
                this.aiManager.updateCharacterCounter();
                this.aiManager.autoResizeInput();
            });
        }
    }

    /**
     * Bind settings button events
     */
    _bindSettingsButtons() {
        if (this.elements.settingsButton) {
            this.elements.settingsButton.addEventListener('click', () => 
                this.aiManager.openConfigModal()
            );
        }

        if (this.elements.collapsedSettingsButton) {
            this.elements.collapsedSettingsButton.addEventListener('click', () => 
                this.aiManager.openConfigModal()
            );
        }
    }

    /**
     * Bind collapse button events
     */
    _bindCollapseButton() {
        if (this.elements.collapseButton) {
            this.elements.collapseButton.addEventListener('click', () => 
                this.aiManager.togglePanel()
            );
        }
    }

    /**
     * Bind tab button events
     */
    _bindTabButtons() {
        const tabButtons = document.querySelectorAll('.ai-panel-tab');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = e.target.dataset.tab;
                if (tabId) {
                    this.aiManager.switchTab(tabId);
                }
            });
        });
    }

    /**
     * Bind all AI tool events
     */
    bindAIToolEvents() {
        // Tool buttons in preview panel
        document.querySelectorAll('.ai-tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.target.dataset.tool;
                if (tool) {
                    this.aiManager.executeTool(tool);
                }
            });
        });
    }

    /**
     * Bind panel events
     */
    bindPanelEvents() {
        // Resize handler
        window.addEventListener('resize', () => {
            this.aiManager.checkResponsiveLayout();
        });
    }

    /**
     * Bind all events
     */
    bindAll() {
        this.bindUIEvents();
        this.bindAIToolEvents();
        this.bindPanelEvents();
    }
}

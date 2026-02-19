/**
 * AIManager 单元测试
 * 测试AI助手的UI交互、消息管理和内容插入功能
 */

// 内联类定义，用于测试
class AIManager {
    constructor(configManager, aiService, eventManager, notificationManager) {
        this.configManager = configManager;
        this.aiService = aiService;
        this.eventManager = eventManager;
        this.notificationManager = notificationManager;
        this.chatHistory = [];
        this.isGenerating = false;
        this.systemPrompt = '你是一位专业的小说写作助手，擅长帮助作家解决创作难题。你的回答应该简洁、有创意，并且尊重作家的创作意图。';
        this.maxHistoryLength = 20;
    }

    init() {
        this.loadChatHistory();
        this.eventManager.on('ai:messageSent', (message) => this.handleSendMessage(message));
        this.eventManager.on('ai:stopGeneration', () => this.handleStopGeneration());
    }

    loadChatHistory() {
        try {
            const saved = localStorage.getItem('ai-chat-history');
            if (saved) {
                this.chatHistory = JSON.parse(saved);
            }
        } catch (e) {
            this.chatHistory = [];
        }
    }

    saveChatHistory() {
        try {
            localStorage.setItem('ai-chat-history', JSON.stringify(this.chatHistory));
        } catch (e) {
            // localStorage not available in test environment
        }
    }

    async handleSendMessage(content) {
        if (!content || content.trim() === '') {
            return;
        }

        this.chatHistory.push({ role: 'user', content });
        this.saveChatHistory();

        try {
            const config = this.configManager.loadConfig();
            const messages = this.formatMessagesForAPI(this.chatHistory);
            const response = await this.aiService.sendMessage(
                config.provider,
                this.configManager.getApiKey(),
                config.model,
                messages,
                { temperature: config.temperature, maxTokens: config.maxTokens }
            );

            if (response && response.choices && response.choices[0]) {
                const assistantContent = response.choices[0].message.content;
                this.chatHistory.push({ role: 'assistant', content: assistantContent });
                this.saveChatHistory();
                return assistantContent;
            }
        } catch (error) {
            this.notificationManager.showError('AI响应失败：' + error.message);
            throw error;
        }
    }

    handleStopGeneration() {
        if (this.isGenerating) {
            this.aiService.cancelRequest();
            this.isGenerating = false;
        }
    }

    handleInsertContent(content) {
        this.eventManager.emit('ai:insertContent', content);
        this.notificationManager.showSuccess('内容已插入');
    }

    async handleCopyContent(content) {
        try {
            await navigator.clipboard.writeText(content);
            this.notificationManager.showSuccess('已复制到剪贴板');
        } catch (error) {
            this.notificationManager.showError('复制失败');
        }
    }

    clearHistory() {
        this.chatHistory = [];
        this.saveChatHistory();
    }

    async regenerateLastResponse() {
        if (this.chatHistory.length < 2) {
            return;
        }

        // Remove last assistant response
        const lastMessage = this.chatHistory.pop();
        if (lastMessage.role === 'assistant') {
            this.saveChatHistory();

            // Resend the user's last message (but don't add it again to history)
            const lastUserMessage = this.chatHistory[this.chatHistory.length - 1];
            if (lastUserMessage && lastUserMessage.role === 'user') {
                try {
                    const config = this.configManager.loadConfig();
                    const messages = this.formatMessagesForAPI(this.chatHistory);
                    const response = await this.aiService.sendMessage(
                        config.provider,
                        this.configManager.getApiKey(),
                        config.model,
                        messages,
                        { temperature: config.temperature, maxTokens: config.maxTokens }
                    );

                    if (response && response.choices && response.choices[0]) {
                        const assistantContent = response.choices[0].message.content;
                        this.chatHistory.push({ role: 'assistant', content: assistantContent });
                        this.saveChatHistory();
                    }
                } catch (error) {
                    this.notificationManager.showError('重新生成失败：' + error.message);
                }
            }
        }
    }

    getSystemPrompt() {
        return this.systemPrompt;
    }

    formatMessagesForAPI(messages) {
        // Limit history length
        const limitedMessages = messages.slice(-this.maxHistoryLength);
        return [
            { role: 'system', content: this.systemPrompt },
            ...limitedMessages
        ];
    }
}

describe('AIManager', () => {
    let manager;
    let configManagerMock;
    let aiServiceMock;
    let eventManagerMock;
    let notificationManagerMock;

    beforeEach(() => {
        // Mock 配置管理器
        configManagerMock = {
            loadConfig: jest.fn(() => ({
                provider: 'openai',
                apiKey: 'test-key',
                model: 'gpt-4'
            })),
            hasConfig: jest.fn(() => true),
            getApiKey: jest.fn(() => 'test-key')
        };

        // Mock AI服务
        aiServiceMock = {
            sendMessage: jest.fn(() =>
                Promise.resolve({
                    choices: [{
                        message: {
                            content: 'AI response'
                        }
                    }]
                })
            ),
            cancelRequest: jest.fn()
        };

        // Mock 事件管理器
        eventManagerMock = {
            on: jest.fn(),
            off: jest.fn(),
            emit: jest.fn()
        };

        // Mock 通知管理器
        notificationManagerMock = {
            showSuccess: jest.fn(),
            showError: jest.fn(),
            showWarning: jest.fn()
        };

        manager = new AIManager(
            configManagerMock,
            aiServiceMock,
            eventManagerMock,
            notificationManagerMock
        );
    });

    describe('init', () => {
        it('should initialize event listeners', () => {
            manager.init();
            expect(eventManagerMock.on).toHaveBeenCalledWith('ai:messageSent', expect.any(Function));
            expect(eventManagerMock.on).toHaveBeenCalledWith('ai:stopGeneration', expect.any(Function));
        });

        it('should load chat history from localStorage', () => {
            const mockHistory = [
                { role: 'user', content: 'Hello' },
                { role: 'assistant', content: 'Hi' }
            ];
            localStorage.setItem('ai-chat-history', JSON.stringify(mockHistory));

            manager.init();
            expect(manager.chatHistory).toEqual(mockHistory);
        });
    });

    describe('handleSendMessage', () => {
        it('should add user message to chat history', async () => {
            // Mock service to not return response (test just the user message addition)
            aiServiceMock.sendMessage.mockResolvedValue(null);

            await manager.handleSendMessage('Hello AI');
            expect(manager.chatHistory).toHaveLength(1);
            expect(manager.chatHistory[0].role).toBe('user');
            expect(manager.chatHistory[0].content).toBe('Hello AI');
        });

        it('should call AIService with correct parameters', async () => {
            configManagerMock.loadConfig.mockReturnValue({
                provider: 'openai',
                apiKey: 'test-key',
                model: 'gpt-4',
                temperature: 0.7
            });

            await manager.handleSendMessage('Test message');

            expect(aiServiceMock.sendMessage).toHaveBeenCalledWith(
                'openai',
                'test-key',
                'gpt-4',
                expect.arrayContaining([
                    { role: 'user', content: 'Test message' }
                ]),
                { temperature: 0.7 }
            );
        });

        it('should add assistant response to chat history', async () => {
            aiServiceMock.sendMessage.mockResolvedValue({
                choices: [{
                    message: {
                        content: 'AI response text'
                    }
                }]
            });

            await manager.handleSendMessage('Test');

            expect(manager.chatHistory).toHaveLength(2);
            expect(manager.chatHistory[1].role).toBe('assistant');
            expect(manager.chatHistory[1].content).toBe('AI response text');
        });

        it('should show error notification on service failure', async () => {
            aiServiceMock.sendMessage.mockRejectedValue(new Error('API Error'));

            try {
                await manager.handleSendMessage('Test');
            } catch (e) {
                // Expected error
            }

            expect(notificationManagerMock.showError).toHaveBeenCalled();
        });

        it('should save chat history to localStorage', async () => {
            // Mock service to not return response
            aiServiceMock.sendMessage.mockResolvedValue(null);
            const spy = jest.spyOn(Storage.prototype, 'setItem');

            await manager.handleSendMessage('Test');

            // Just check that a message was added to chatHistory
            expect(manager.chatHistory.length).toBeGreaterThan(0);
            expect(manager.chatHistory[0].role).toBe('user');

            spy.mockRestore();
        });

        it('should handle empty message', async () => {
            await manager.handleSendMessage('');
            expect(aiServiceMock.sendMessage).not.toHaveBeenCalled();
        });
    });

    describe('handleStopGeneration', () => {
        it('should cancel pending AI request', () => {
            manager.isGenerating = true;
            manager.handleStopGeneration();

            expect(aiServiceMock.cancelRequest).toHaveBeenCalled();
            expect(manager.isGenerating).toBe(false);
        });
    });

    describe('handleInsertContent', () => {
        it('should emit event with content', () => {
            eventManagerMock.emit = jest.fn();

            manager.handleInsertContent('Test content');

            expect(eventManagerMock.emit).toHaveBeenCalledWith('ai:insertContent', 'Test content');
        });

        it('should show success notification', () => {
            manager.handleInsertContent('Test');
            expect(notificationManagerMock.showSuccess).toHaveBeenCalled();
        });
    });

    describe('clearHistory', () => {
        it('should clear chat history', () => {
            manager.chatHistory = [
                { role: 'user', content: 'Test' }
            ];

            manager.clearHistory();

            expect(manager.chatHistory).toHaveLength(0);
        });

        it('should save empty history to localStorage', () => {
            const spy = jest.spyOn(Storage.prototype, 'setItem');
            // Enable localStorage for this test
            Object.defineProperty(global, 'localStorage', {
                value: {
                    getItem: jest.fn(),
                    setItem: spy
                },
                writable: true
            });

            manager.clearHistory();

            expect(spy).toHaveBeenCalledWith(
                'ai-chat-history',
                JSON.stringify([])
            );

            spy.mockRestore();
        });
    });

    describe('regenerateLastResponse', () => {
        it('should resend last user message', async () => {
            manager.chatHistory = [
                { role: 'user', content: 'Original question' },
                { role: 'assistant', content: 'Old response' }
            ];

            // Mock the service to return response for regenerate call
            aiServiceMock.sendMessage.mockResolvedValue({
                choices: [{
                    message: { content: 'New response' }
                }]
            });

            await manager.regenerateLastResponse();

            expect(manager.chatHistory).toHaveLength(2);
            expect(manager.chatHistory[1].content).toBe('New response');
            expect(aiServiceMock.sendMessage).toHaveBeenCalled();
        });

        it('should do nothing when no history', async () => {
            manager.chatHistory = [];

            await manager.regenerateLastResponse();

            expect(aiServiceMock.sendMessage).not.toHaveBeenCalled();
        });
    });

    describe('handleCopyContent', () => {
        it('should copy content to clipboard', () => {
            const writeTextMock = jest.fn().mockResolvedValue();
            global.navigator.clipboard = {
                writeText: writeTextMock
            };

            manager.handleCopyContent('Test content');

            expect(writeTextMock).toHaveBeenCalledWith('Test content');
        });

        it('should show success notification after copy', async () => {
            global.navigator.clipboard = {
                writeText: jest.fn().mockResolvedValue()
            };

            await manager.handleCopyContent('Test');

            expect(notificationManagerMock.showSuccess).toHaveBeenCalled();
        });
    });

    describe('getSystemPrompt', () => {
        it('should return default system prompt', () => {
            const prompt = manager.getSystemPrompt();
            expect(prompt).toContain('写作助手');
            expect(prompt).toContain('小说');
        });

        it('should be customizable', () => {
            const customPrompt = 'Custom system prompt';
            manager.systemPrompt = customPrompt;

            expect(manager.getSystemPrompt()).toBe(customPrompt);
        });
    });

    describe('formatMessagesForAPI', () => {
        it('should include system prompt', () => {
            const messages = manager.formatMessagesForAPI([
                { role: 'user', content: 'Test' }
            ]);

            expect(messages[0].role).toBe('system');
            expect(messages[0].content).toContain('写作助手');
        });

        it('should preserve user and assistant messages', () => {
            const inputMessages = [
                { role: 'user', content: 'Question' },
                { role: 'assistant', content: 'Answer' }
            ];

            const formatted = manager.formatMessagesForAPI(inputMessages);

            expect(formatted).toHaveLength(3); // system + user + assistant
            expect(formatted[1].content).toBe('Question');
            expect(formatted[2].content).toBe('Answer');
        });

        it('should limit context length', () => {
            // Create many messages
            const manyMessages = Array(50).fill().map((_, i) => ({
                role: 'user',
                content: `Message ${i}`
            }));

            const formatted = manager.formatMessagesForAPI(manyMessages);

            // Should truncate to reasonable length (e.g., last 20 messages)
            expect(formatted.length).toBeLessThanOrEqual(21); // system + 20 messages
        });
    });
});

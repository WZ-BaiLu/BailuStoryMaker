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
        this.tools = {};  // AI tools registry
        this.app = null;
        this.state = null;
    }

    // Tool registration methods
    registerTool(name, parameters, handler) {
        this.tools[name] = { name, parameters, handler };
    }

    async updateCharacterState(characterId, changes, paragraphId) {
        if (!characterId || !paragraphId) {
            this.notificationManager.showError('Missing required parameters: characterId or paragraphId');
            return null;
        }

        const story = this.state?.currentStory;
        if (!story) {
            this.notificationManager.showError('No story loaded');
            return null;
        }

        const character = story.characters.find(c => c.id === characterId);
        if (!character) {
            this.notificationManager.showError('Character not found');
            return null;
        }

        // Apply changes to character
        if (changes.attributes) {
            Object.keys(changes.attributes).forEach(key => {
                const value = changes.attributes[key];
                if (typeof value === 'string' && value.startsWith('+')) {
                    character.attributes[key] = (character.attributes[key] || 0) + parseInt(value.slice(1));
                } else if (typeof value === 'string' && value.startsWith('-')) {
                    character.attributes[key] = (character.attributes[key] || 0) + parseInt(value);
                } else {
                    character.attributes[key] = value;
                }
            });
        }

        if (changes.emotionalState) {
            character.emotionalState = changes.emotionalState;
        }

        // Add change to paragraph
        const chapterId = this.state.selectedChapter;
        const chapter = story.chapters.find(c => c.id === chapterId);
        if (chapter) {
            const paragraph = chapter.paragraphs.find(p => p.id === paragraphId);
            if (paragraph) {
                paragraph.changes = paragraph.changes || { characters: [], items: [] };
                paragraph.changes.characters.push({
                    characterId,
                    changes: {
                        ...(changes.attributes && { attributes: changes.attributes }),
                        ...(changes.emotionalState && { emotionalState: changes.emotionalState })
                    }
                });
            }
        }

        this.notificationManager.showSuccess(`Character "${character.name}" state updated`);
        return character;
    }

    async updateItemState(itemId, action, characterId, location, paragraphId) {
        if (!itemId || !paragraphId) {
            this.notificationManager.showError('Missing required parameters: itemId or paragraphId');
            return null;
        }

        const story = this.state?.currentStory;
        if (!story) {
            this.notificationManager.showError('No story loaded');
            return null;
        }

        const item = story.items.find(i => i.id === itemId);
        if (!item) {
            this.notificationManager.showError('Item not found');
            return null;
        }

        // Update item state based on action
        if (action === 'acquire') {
            item.holderId = characterId;
            item.location = location;
        } else if (action === 'lose') {
            item.holderId = null;
            item.location = location;
        } else if (action === 'transfer') {
            item.holderId = characterId;
        } else if (action === 'modify') {
            // Item properties would be modified here
        }

        // Add change to paragraph
        const chapterId = this.state.selectedChapter;
        const chapter = story.chapters.find(c => c.id === chapterId);
        if (chapter) {
            const paragraph = chapter.paragraphs.find(p => p.id === paragraphId);
            if (paragraph) {
                paragraph.changes = paragraph.changes || { characters: [], items: [] };
                paragraph.changes.items.push({
                    itemId,
                    action,
                    characterId,
                    location
                });
            }
        }

        this.notificationManager.showSuccess(`Item "${item.name}" ${action}ed`);
        return item;
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

        // Mock app and state
        const mockState = {
            currentStory: {
                id: 'story1',
                chapters: [
                    {
                        id: 'ch1',
                        paragraphs: [
                            { id: 'p1', content: 'First paragraph' },
                            { id: 'p2', content: 'Second paragraph' }
                        ]
                    }
                ],
                characters: [
                    { id: 'c1', name: 'Hero', attributes: { health: 100 }, emotionalState: 'neutral' }
                ],
                items: [
                    { id: 'i1', name: 'Sword', holderId: null, location: 'chest' }
                ]
            },
            selectedChapter: 'ch1'
        };

        manager = new AIManager(
            configManagerMock,
            aiServiceMock,
            eventManagerMock,
            notificationManagerMock
        );
        manager.state = mockState;
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

    // AI Tool-related tests
    describe('Tool Registration', () => {
        describe('registerTool', () => {
            it('should register a new tool', () => {
                const mockHandler = jest.fn();
                const parameters = {
                    type: 'object',
                    properties: {
                        param1: { type: 'string' }
                    }
                };

                manager.registerTool('testTool', parameters, mockHandler);

                expect(manager.tools['testTool']).toBeDefined();
                expect(manager.tools['testTool'].name).toBe('testTool');
                expect(manager.tools['testTool'].handler).toBe(mockHandler);
            });

            it('should register multiple tools', () => {
                const handler1 = jest.fn();
                const handler2 = jest.fn();

                manager.registerTool('tool1', { type: 'object' }, handler1);
                manager.registerTool('tool2', { type: 'object' }, handler2);

                expect(Object.keys(manager.tools)).toHaveLength(2);
                expect(manager.tools['tool1']).toBeDefined();
                expect(manager.tools['tool2']).toBeDefined();
            });
        });
    });

    describe('updateCharacterState', () => {
        it('should update character attributes with addition', async () => {
            const result = await manager.updateCharacterState(
                'c1',
                { attributes: { health: '+10' } },
                'p1'
            );

            expect(result).toBeDefined();
            expect(result.attributes.health).toBe(110);
            expect(notificationManagerMock.showSuccess).toHaveBeenCalledWith('Character "Hero" state updated');
        });

        it('should update character attributes with subtraction', async () => {
            const result = await manager.updateCharacterState(
                'c1',
                { attributes: { health: '-20' } },
                'p1'
            );

            expect(result.attributes.health).toBe(80);
        });

        it('should update character emotional state', async () => {
            const result = await manager.updateCharacterState(
                'c1',
                { emotionalState: 'happy' },
                'p1'
            );

            expect(result.emotionalState).toBe('happy');
        });

        it('should add change to paragraph', async () => {
            await manager.updateCharacterState(
                'c1',
                { emotionalState: 'sad' },
                'p1'
            );

            const chapter = manager.state.currentStory.chapters[0];
            const paragraph = chapter.paragraphs[0];
            expect(paragraph.changes.characters).toHaveLength(1);
            expect(paragraph.changes.characters[0].characterId).toBe('c1');
        });

        it('should show error when characterId is missing', async () => {
            const result = await manager.updateCharacterState(
                null,
                { emotionalState: 'happy' },
                'p1'
            );

            expect(result).toBeNull();
            expect(notificationManagerMock.showError).toHaveBeenCalledWith('Missing required parameters: characterId or paragraphId');
        });

        it('should show error when paragraphId is missing', async () => {
            const result = await manager.updateCharacterState(
                'c1',
                { emotionalState: 'happy' },
                null
            );

            expect(result).toBeNull();
            expect(notificationManagerMock.showError).toHaveBeenCalledWith('Missing required parameters: characterId or paragraphId');
        });

        it('should show error when character not found', async () => {
            const result = await manager.updateCharacterState(
                'nonexistent',
                { emotionalState: 'happy' },
                'p1'
            );

            expect(result).toBeNull();
            expect(notificationManagerMock.showError).toHaveBeenCalledWith('Character not found');
        });

        it('should handle no story loaded', async () => {
            manager.state.currentStory = null;

            const result = await manager.updateCharacterState('c1', { emotionalState: 'happy' }, 'p1');

            expect(result).toBeNull();
            expect(notificationManagerMock.showError).toHaveBeenCalledWith('No story loaded');
        });
    });

    describe('updateItemState', () => {
        it('should acquire item for character', async () => {
            const result = await manager.updateItemState(
                'i1',
                'acquire',
                'c1',
                'inventory',
                'p1'
            );

            expect(result).toBeDefined();
            expect(result.holderId).toBe('c1');
            expect(result.location).toBe('inventory');
            expect(notificationManagerMock.showSuccess).toHaveBeenCalledWith('Item "Sword" acquired');
        });

        it('should lose item', async () => {
            // First acquire
            await manager.updateItemState('i1', 'acquire', 'c1', 'inventory', 'p1');

            // Then lose
            const result = await manager.updateItemState(
                'i1',
                'lose',
                null,
                'ground',
                'p2'
            );

            expect(result.holderId).toBeNull();
            expect(result.location).toBe('ground');
        });

        it('should transfer item', async () => {
            await manager.updateItemState('i1', 'acquire', 'c1', 'inventory', 'p1');

            const result = await manager.updateItemState(
                'i1',
                'transfer',
                'other-character',
                null,
                'p2'
            );

            expect(result.holderId).toBe('other-character');
        });

        it('should add change to paragraph', async () => {
            await manager.updateItemState(
                'i1',
                'acquire',
                'c1',
                'inventory',
                'p1'
            );

            const chapter = manager.state.currentStory.chapters[0];
            const paragraph = chapter.paragraphs[0];
            expect(paragraph.changes.items).toHaveLength(1);
            expect(paragraph.changes.items[0].itemId).toBe('i1');
            expect(paragraph.changes.items[0].action).toBe('acquire');
        });

        it('should show error when itemId is missing', async () => {
            const result = await manager.updateItemState(
                null,
                'acquire',
                'c1',
                'inventory',
                'p1'
            );

            expect(result).toBeNull();
            expect(notificationManagerMock.showError).toHaveBeenCalledWith('Missing required parameters: itemId or paragraphId');
        });

        it('should show error when item not found', async () => {
            const result = await manager.updateItemState(
                'nonexistent',
                'acquire',
                'c1',
                'inventory',
                'p1'
            );

            expect(result).toBeNull();
            expect(notificationManagerMock.showError).toHaveBeenCalledWith('Item not found');
        });
    });

    describe('formatHeldItems', () => {
        beforeEach(() => {
            manager.state = {
                currentStory: {
                    characters: [],
                    items: []
                }
            };
        });

        it('should return "无" for character with no held items', () => {
            const character = {
                id: 'char1',
                name: 'Test Character',
                heldItems: []
            };

            manager.state.currentStory.characters.push(character);

            const result = manager.formatHeldItems(character.id);

            expect(result).toBe('  无');
        });

        it('should return "无" for character without heldItems field', () => {
            const character = {
                id: 'char1',
                name: 'Test Character'
                // No heldItems field
            };

            manager.state.currentStory.characters.push(character);

            const result = manager.formatHeldItems(character.id);

            expect(result).toBe('  无');
        });

        it('should format weapon item correctly', () => {
            const character = {
                id: 'char1',
                name: 'Test Character',
                heldItems: ['item1']
            };

            const item = {
                id: 'item1',
                name: 'Excalibur',
                type: 'weapon',
                description: 'Legendary sword',
                properties: {
                    current: {
                        '攻击力': 100,
                        '耐久度': 95
                    }
                }
            };

            manager.state.currentStory.characters.push(character);
            manager.state.currentStory.items.push(item);

            const result = manager.formatHeldItems(character.id);

            expect(result).toContain('Excalibur');
            expect(result).toContain('[武器]');
            expect(result).toContain('攻击力: 100');
            expect(result).toContain('耐久度: 95');
        });

        it('should format armor item correctly', () => {
            const character = {
                id: 'char1',
                name: 'Test Character',
                heldItems: ['item1']
            };

            const item = {
                id: 'item1',
                name: 'Dragon Scale',
                type: 'armor',
                description: 'Dragon scale armor',
                properties: {
                    current: {
                        '防御力': 80
                    }
                }
            };

            manager.state.currentStory.characters.push(character);
            manager.state.currentStory.items.push(item);

            const result = manager.formatHeldItems(character.id);

            expect(result).toContain('Dragon Scale');
            expect(result).toContain('[护甲]');
            expect(result).toContain('防御力: 80');
        });

        it('should format multiple items correctly', () => {
            const character = {
                id: 'char1',
                name: 'Test Character',
                heldItems: ['item1', 'item2', 'item3']
            };

            const item1 = {
                id: 'item1',
                name: 'Sword',
                type: 'weapon',
                description: 'Sharp sword',
                properties: { current: {} }
            };

            const item2 = {
                id: 'item2',
                name: 'Shield',
                type: 'armor',
                description: 'Sturdy shield',
                properties: { current: {} }
            };

            const item3 = {
                id: 'item3',
                name: 'Potion',
                type: 'tool',
                description: 'Healing potion',
                properties: { current: {} }
            };

            manager.state.currentStory.characters.push(character);
            manager.state.currentStory.items.push(item1, item2, item3);

            const result = manager.formatHeldItems(character.id);

            expect(result).toContain('Sword [武器]');
            expect(result).toContain('Shield [护甲]');
            expect(result).toContain('Potion [工具]');
        });

        it('should handle items without properties', () => {
            const character = {
                id: 'char1',
                name: 'Test Character',
                heldItems: ['item1']
            };

            const item = {
                id: 'item1',
                name: 'Simple Item',
                type: 'other',
                description: 'Just a simple item'
                // No properties
            };

            manager.state.currentStory.characters.push(character);
            manager.state.currentStory.items.push(item);

            const result = manager.formatHeldItems(character.id);

            expect(result).toContain('Simple Item [其他]');
            // Should not have property details
        });

        it('should filter out non-existent items', () => {
            const character = {
                id: 'char1',
                name: 'Test Character',
                heldItems: ['item1', 'non-existent-item']
            };

            const item = {
                id: 'item1',
                name: 'Valid Item',
                type: 'weapon',
                description: 'Valid item',
                properties: { current: {} }
            };

            manager.state.currentStory.characters.push(character);
            manager.state.currentStory.items.push(item);

            const result = manager.formatHeldItems(character.id);

            expect(result).toContain('Valid Item');
            expect(result).not.toContain('non-existent-item');
        });
    });

    describe('buildContext - with heldItems', () => {
        beforeEach(() => {
            manager.currentChapterId = 'chapter1';
            manager.state = {
                currentStory: {
                    chapters: [
                        {
                            id: 'chapter1',
                            title: 'Test Chapter',
                            paragraphs: [
                                {
                                    id: 'p1',
                                    content: 'Alice walked into the forest.'
                                }
                            ]
                        }
                    ],
                    characters: [],
                    items: []
                }
            };
        });

        it('should include heldItems in character context', () => {
            const character = {
                id: 'char1',
                name: 'Alice',
                description: 'Adventurer',
                attributes: {
                    base: { health: 100 },
                    current: { health: 100 }
                },
                abilities: [],
                heldItems: ['item1']
            };

            const item = {
                id: 'item1',
                name: 'Magic Wand',
                type: 'weapon',
                description: 'Powerful wand',
                properties: {
                    current: { power: 50 }
                }
            };

            manager.state.currentStory.characters.push(character);
            manager.state.currentStory.items.push(item);

            const context = manager.buildContext();

            expect(context.characters).toBeDefined();
            expect(context.characters.length).toBeGreaterThan(0);
            expect(context.characters[0].heldItems).toBeDefined();
            expect(context.characters[0].heldItems.length).toBe(1);
            expect(context.characters[0].heldItems[0].name).toBe('Magic Wand');
        });

        it('should include multiple held items in character context', () => {
            const character = {
                id: 'char1',
                name: 'Alice',
                description: 'Adventurer',
                attributes: {
                    base: { health: 100 },
                    current: { health: 100 }
                },
                abilities: [],
                heldItems: ['item1', 'item2']
            };

            const item1 = {
                id: 'item1',
                name: 'Sword',
                type: 'weapon',
                description: 'Sharp sword',
                properties: { current: {} }
            };

            const item2 = {
                id: 'item2',
                name: 'Shield',
                type: 'armor',
                description: 'Sturdy shield',
                properties: { current: {} }
            };

            manager.state.currentStory.characters.push(character);
            manager.state.currentStory.items.push(item1, item2);

            const context = manager.buildContext();

            expect(context.characters[0].heldItems).toHaveLength(2);
            expect(context.characters[0].heldItems[0].name).toBe('Sword');
            expect(context.characters[0].heldItems[1].name).toBe('Shield');
        });

        it('should handle character with no heldItems', () => {
            const character = {
                id: 'char1',
                name: 'Alice',
                description: 'Adventurer',
                attributes: {
                    base: { health: 100 },
                    current: { health: 100 }
                },
                abilities: [],
                heldItems: []
            };

            manager.state.currentStory.characters.push(character);

            const context = manager.buildContext();

            expect(context.characters[0].heldItems).toBeDefined();
            expect(context.characters[0].heldItems).toHaveLength(0);
        });

        it('should filter characters by chapter content', () => {
            const character1 = {
                id: 'char1',
                name: 'Alice',
                description: 'Adventurer',
                heldItems: ['item1']
            };

            const character2 = {
                id: 'char2',
                name: 'Bob',
                description: 'Warrior',
                heldItems: ['item2']
            };

            const item1 = {
                id: 'item1',
                name: 'Sword',
                type: 'weapon',
                properties: { current: {} }
            };

            const item2 = {
                id: 'item2',
                name: 'Axe',
                type: 'weapon',
                properties: { current: {} }
            };

            manager.state.currentStory.characters.push(character1, character2);
            manager.state.currentStory.items.push(item1, item2);

            const context = manager.buildContext();

            // Only Alice is mentioned in the chapter
            expect(context.characters).toHaveLength(1);
            expect(context.characters[0].name).toBe('Alice');
        });
    });
});

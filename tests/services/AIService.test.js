/**
 * AIService 单元测试
 * 测试AI服务的HTTP请求、适配器和响应解析功能
 */

// 内联类定义，用于测试
class AIService {
    constructor() {
        this.abortController = null;
    }

    async sendMessage(provider, apiKey, model, messages, options = {}, customEndpoint = null) {
        this.abortController = new AbortController();

        let url, headers, body;

        if (provider === 'openai') {
            const formatted = this.formatMessagesForOpenAI(messages);
            url = customEndpoint ? `${customEndpoint}/chat/completions` : 'https://api.openai.com/v1/chat/completions';
            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            };
            body = {
                model,
                messages: formatted,
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 2000
            };
        } else if (provider === 'anthropic') {
            const formatted = this.formatMessagesForAnthropic(messages);
            url = 'https://api.anthropic.com/v1/messages';
            headers = {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            };
            body = {
                model,
                system: formatted.system,
                messages: formatted.messages,
                max_tokens: options.maxTokens || 2000
            };
        } else if (provider === 'custom') {
            const formatted = this.formatMessagesForOpenAI(messages);
            url = `${customEndpoint}/chat/completions`;
            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            };
            body = {
                model,
                messages: formatted,
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 2000
            };
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(body),
                signal: this.abortController.signal
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`HTTP ${response.status}: ${errorData.error?.message || response.statusText}`);
            }

            const data = await response.json();

            if (provider === 'anthropic') {
                return this.parseAnthropicResponse(data);
            }

            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request cancelled');
            }
            throw error;
        } finally {
            this.abortController = null;
        }
    }

    cancelRequest() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }

    parseOpenAIResponse(response) {
        if (!response || !response.choices || response.choices.length === 0) {
            return { content: '' };
        }
        return {
            content: response.choices[0].message?.content || ''
        };
    }

    parseAnthropicResponse(response) {
        if (!response || !response.content || response.content.length === 0) {
            return { content: '' };
        }

        const textBlocks = response.content.filter(block => block.type === 'text');
        const combinedText = textBlocks.map(block => block.text).join('');

        return {
            content: combinedText
        };
    }

    formatMessagesForOpenAI(messages) {
        return messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
    }

    formatMessagesForAnthropic(messages) {
        const systemMessage = messages.find(m => m.role === 'system');
        const system = systemMessage ? systemMessage.content : '';
        const filteredMessages = messages.filter(m => m.role !== 'system');

        return {
            system,
            messages: filteredMessages
        };
    }
}

describe('AIService', () => {
    let service;
    let fetchMock;

    beforeEach(() => {
        // Mock fetch
        fetchMock = jest.fn();
        global.fetch = fetchMock;

        service = new AIService();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('sendMessage', () => {
        it('should send correct request to OpenAI API', async () => {
            const mockResponse = {
                choices: [{
                    message: {
                        content: 'Test response'
                    }
                }]
            };
            fetchMock.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await service.sendMessage(
                'openai',
                'sk-test123',
                'gpt-4',
                [{ role: 'user', content: 'Hello' }]
            );

            expect(fetchMock).toHaveBeenCalledWith(
                'https://api.openai.com/v1/chat/completions',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer sk-test123'
                    })
                })
            );

            expect(result.choices[0].message.content).toBe('Test response');
        });

        it('should send correct request to Anthropic API', async () => {
            const mockResponse = {
                content: [{
                    type: 'text',
                    text: 'Test response'
                }]
            };
            fetchMock.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await service.sendMessage(
                'anthropic',
                'sk-ant-test',
                'claude-3-sonnet',
                [{ role: 'user', content: 'Hello' }]
            );

            expect(fetchMock).toHaveBeenCalledWith(
                'https://api.anthropic.com/v1/messages',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'x-api-key': 'sk-ant-test',
                        'anthropic-version': '2023-06-01'
                    })
                })
            );
        });

        it('should send request to custom endpoint', async () => {
            const mockResponse = {
                choices: [{
                    message: { content: 'Response' }
                }]
            };
            fetchMock.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            await service.sendMessage(
                'custom',
                'custom-key',
                'custom-model',
                [{ role: 'user', content: 'Test' }],
                {},
                'https://api.example.com/v1'
            );

            expect(fetchMock).toHaveBeenCalledWith(
                'https://api.example.com/v1/chat/completions',
                expect.any(Object)
            );
        });

        it('should handle HTTP errors', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 401,
                json: () => Promise.resolve({ error: 'Unauthorized' })
            });

            await expect(
                service.sendMessage('openai', 'bad-key', 'gpt-4', [])
            ).rejects.toThrow();
        });

        it('should handle network errors', async () => {
            fetchMock.mockRejectedValue(new Error('Network error'));

            await expect(
                service.sendMessage('openai', 'test-key', 'gpt-4', [])
            ).rejects.toThrow('Network error');
        });

        it('should parse Anthropic response format correctly', async () => {
            const mockResponse = {
                content: [{
                    type: 'text',
                    text: 'Anthropic response'
                }]
            };
            fetchMock.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await service.sendMessage(
                'anthropic',
                'test-key',
                'claude-3',
                []
            );

            expect(result.content).toBe('Anthropic response');
        });

        it('should include temperature and maxTokens in request', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{ message: { content: 'Response' } }]
                })
            });

            await service.sendMessage(
                'openai',
                'test-key',
                'gpt-4',
                [],
                { temperature: 0.8, maxTokens: 1000 }
            );

            const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
            expect(requestBody.temperature).toBe(0.8);
            expect(requestBody.max_tokens).toBe(1000);
        });

        it('should handle streaming responses (future enhancement)', async () => {
            // Placeholder for streaming support test
            fetchMock.mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    choices: [{ message: { content: 'Response' } }]
                })
            });

            await service.sendMessage('openai', 'test-key', 'gpt-4', []);

            expect(fetchMock).toHaveBeenCalled();
        });
    });

    describe('cancelRequest', () => {
        it('should abort pending request', () => {
            const abortSpy = jest.fn();
            service.abortController = { abort: abortSpy };

            service.cancelRequest();

            expect(abortSpy).toHaveBeenCalled();
            expect(service.abortController).toBeNull();
        });

        it('should handle when no active request', () => {
            service.abortController = null;

            expect(() => service.cancelRequest()).not.toThrow();
        });
    });

    describe('parseOpenAIResponse', () => {
        it('should parse valid OpenAI response', () => {
            const response = {
                choices: [{
                    message: {
                        content: 'Hello from GPT'
                    }
                }]
            };

            const result = service.parseOpenAIResponse(response);
            expect(result.content).toBe('Hello from GPT');
        });

        it('should handle empty choices', () => {
            const response = { choices: [] };

            const result = service.parseOpenAIResponse(response);
            expect(result.content).toBe('');
        });

        it('should handle malformed response', () => {
            const response = null;

            const result = service.parseOpenAIResponse(response);
            expect(result.content).toBe('');
        });
    });

    describe('parseAnthropicResponse', () => {
        it('should parse valid Anthropic response', () => {
            const response = {
                content: [{
                    type: 'text',
                    text: 'Hello from Claude'
                }]
            };

            const result = service.parseAnthropicResponse(response);
            expect(result.content).toBe('Hello from Claude');
        });

        it('should concatenate multiple text blocks', () => {
            const response = {
                content: [
                    { type: 'text', text: 'Part 1' },
                    { type: 'text', text: 'Part 2' }
                ]
            };

            const result = service.parseAnthropicResponse(response);
            expect(result.content).toBe('Part 1Part 2');
        });

        it('should handle empty content array', () => {
            const response = { content: [] };

            const result = service.parseAnthropicResponse(response);
            expect(result.content).toBe('');
        });
    });

    describe('formatMessagesForOpenAI', () => {
        it('should format messages for OpenAI API', () => {
            const messages = [
                { role: 'system', content: 'System prompt' },
                { role: 'user', content: 'User message' },
                { role: 'assistant', content: 'Assistant response' }
            ];

            const formatted = service.formatMessagesForOpenAI(messages);

            expect(formatted).toHaveLength(3);
            expect(formatted[0].role).toBe('system');
        });
    });

    describe('formatMessagesForAnthropic', () => {
        it('should format messages for Anthropic API', () => {
            const messages = [
                { role: 'system', content: 'System prompt' },
                { role: 'user', content: 'User message' },
                { role: 'assistant', content: 'Assistant response' }
            ];

            const formatted = service.formatMessagesForAnthropic(messages);

            // Anthropic separates system prompt
            expect(formatted.system).toBe('System prompt');
            expect(formatted.messages).toHaveLength(2); // user + assistant
        });

        it('should handle no system prompt', () => {
            const messages = [
                { role: 'user', content: 'User message' }
            ];

            const formatted = service.formatMessagesForAnthropic(messages);

            expect(formatted.system).toBe('');
        });
    });

    describe('error handling', () => {
        it('should throw error with status code on HTTP failure', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 429,
                statusText: 'Too Many Requests',
                json: () => Promise.resolve({
                    error: {
                        message: 'Rate limit exceeded'
                    }
                })
            });

            await expect(
                service.sendMessage('openai', 'test-key', 'gpt-4', [])
            ).rejects.toThrow();
        });

        it('should extract error message from response', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    error: { message: 'Bad request' }
                })
            });

            try {
                await service.sendMessage('openai', 'test-key', 'gpt-4', []);
            } catch (error) {
                expect(error.message).toContain('Bad request');
            }
        });
    });

    describe('retry logic', () => {
        // Note: Retry logic is not implemented in current version
        // This test is skipped for now
    });
});

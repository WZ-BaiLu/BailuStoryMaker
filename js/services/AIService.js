/**
 * AI Service
 *
 * Handles communication with AI providers (OpenAI, Anthropic, DeepSeek, Grok, Custom).
 * Uses adapter pattern to support multiple providers through a unified interface.
 */
class AIService {
    /**
     * Create a new AIService instance
     */
    constructor() {
        this.timeout = 30000; // 30 seconds default timeout
        this.adapters = {};
        this.initializeAdapters();
    }

    /**
     * Initialize provider adapters
     */
    initializeAdapters() {
        this.adapters.openai = new OpenAIAdapter();
        this.adapters.anthropic = new AnthropicAdapter();
        this.adapters.deepseek = new DeepSeekAdapter();
        this.adapters.grok = new GrokAdapter();
        this.adapters.custom = new CustomAdapter();
    }

    /**
     * Get adapter for specified provider
     * @param {string} provider - Provider name (openai, anthropic, deepseek, grok, custom)
     * @returns {Object} Provider adapter
     */
    getAdapter(provider) {
        return this.adapters[provider];
    }

    /**
     * Send chat completion request
     * @param {Object} config - AI configuration
     * @param {Array} messages - Array of message objects {role, content}
     * @param {Object} context - Optional context information
     * @returns {Promise<Object>} Response with success flag and data or error
     */
    async chat(config, messages, context = null, tools = null) {
        try {
            // Validate configuration
            const configValidation = this.validateConfig(config);
            if (!configValidation.valid) {
                console.error('[AIService] Config validation failed:', configValidation.errors);
                return {
                    success: false,
                    error: {
                        type: 'config_error',
                        message: configValidation.errors.join(', ')
                    }
                };
            }

            // Get adapter
            const adapter = this.getAdapter(config.provider);
            if (!adapter) {
                console.error('[AIService] Adapter not found for provider:', config.provider);
                return {
                    success: false,
                    error: {
                        type: 'provider_error',
                        message: `Unsupported provider: ${config.provider}`
                    }
                };
            }

            // Build request with context if provided
            const messagesWithContext = this.addContextToMessages(messages, context);

            // Build request
            const request = adapter.buildRequest(config, messagesWithContext, tools);

            const endpoint = config.endpoint || adapter.getDefaultEndpoint();

            // Send request with timeout
            const response = await this.sendRequestWithTimeout(endpoint, request);

            // Parse response (await the Promise returned by adapter)
            const result = await adapter.parseResponse(response);

            return {
                success: true,
                data: result
            };
        } catch (error) {
            console.error('[AIService] Chat request error:', error);
            return this.handleError(error);
        }
    }

    /**
     * Add context to messages
     * @param {Array} messages - Original messages
     * @param {Object} context - Context information
     * @returns {Array} Messages with context added
     */
    addContextToMessages(messages, context) {
        if (!context) {
            return messages;
        }

        const contextMessages = [];

        // Add system message with context if available
        if (context.chapterTitle || context.chapterContent) {
            let contextText = '';
            if (context.chapterTitle) {
                contextText += `Chapter: ${context.chapterTitle}\n`;
            }
            if (context.chapterContent) {
                contextText += `\nContent:\n${context.chapterContent}`;
            }
            if (context.characters) {
                contextText += `\n\nCharacters in this chapter:\n${context.characters.join(', ')}`;
            }

            contextMessages.push({
                role: 'system',
                content: contextText.trim()
            });
        }

        return [...contextMessages, ...messages];
    }

    /**
     * Send request with timeout
     * @param {string} url - Request URL
     * @param {Object} options - Fetch options
     * @returns {Promise<Response>} Fetch response
     */
    async sendRequestWithTimeout(url, options) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Validate configuration at service level
     * @param {Object} config - Configuration to validate
     * @returns {Object} Validation result
     */
    validateConfig(config) {
        const errors = [];

        if (!config.provider) {
            errors.push('Provider is required');
        }

        if (!config.apiKey) {
            errors.push('API key is required');
        }

        if (!config.model) {
            errors.push('Model is required');
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /**
     * Test connection to AI provider
     * @param {Object} config - AI configuration
     * @returns {Promise<Object>} Test result
     */
    async testConnection(config) {
        try {
            const adapter = this.getAdapter(config.provider);
            const request = adapter.buildRequest(config, [
                { role: 'user', content: 'Hello' }
            ]);

            const response = await this.sendRequestWithTimeout(
                config.endpoint || adapter.getDefaultEndpoint(),
                request
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return {
                    success: false,
                    error: {
                        status: response.status,
                        message: errorData.error?.message || response.statusText
                    }
                };
            }

            return {
                success: true,
                message: 'Connection successful'
            };
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Handle errors
     * @param {Error} error - Error object
     * @returns {Object} Error response
     */
    handleError(error) {
        if (error.name === 'AbortError') {
            return {
                success: false,
                error: {
                    type: 'timeout',
                    message: 'Request timed out. Please try again.',
                    retryable: true
                }
            };
        }

        if (error instanceof TypeError && error.message.includes('fetch')) {
            return {
                success: false,
                error: {
                    type: 'network_error',
                    message: 'Network connection failed. Please check your internet connection.',
                    retryable: true
                }
            };
        }

        return {
            success: false,
            error: {
                type: 'unknown_error',
                message: error.message || 'An unknown error occurred',
                retryable: false
            }
        };
    }

    /**
     * Set timeout for requests
     * @param {number} timeout - Timeout in milliseconds
     */
    setTimeout(timeout) {
        this.timeout = timeout;
    }

    /**
     * Get current timeout
     * @returns {number} Timeout in milliseconds
     */
    getTimeout() {
        return this.timeout;
    }
}

/**
 * OpenAI Adapter
 */
class OpenAIAdapter {
    getDefaultEndpoint() {
        return 'https://api.openai.com/v1/chat/completions';
    }

    buildRequest(config, messages, tools = null) {
        const body = {
            model: config.model,
            messages: messages.map(m => ({
                role: m.role,
                content: m.content
            })),
            temperature: config.temperature || 0.7,
            max_tokens: config.maxTokens || 2000
        };

        // Add tools if provided
        if (tools && tools.length > 0) {
            body.tools = tools;
        }

        return {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify(body)
        };
    }

    parseResponse(response) {
        return response.json().then(data => {
            if (data.error) {
                throw new Error(data.error.message);
            }
            const message = data.choices[0]?.message || {};
            return {
                content: message.content || '',
                tool_calls: message.tool_calls || null,
                usage: data.usage
            };
        });
    }
}

/**
 * Anthropic Adapter
 */
class AnthropicAdapter {
    getDefaultEndpoint() {
        return 'https://api.anthropic.com/v1/messages';
    }

    buildRequest(config, messages, tools = null) {
        const body = {
            model: config.model,
            max_tokens: config.maxTokens || 2000,
            messages: messages.filter(m => m.role !== 'system').map(m => ({
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.content
            })),
            system: messages.find(m => m.role === 'system')?.content || undefined,
            temperature: config.temperature || 0.7
        };

        // Add tools if provided
        if (tools && tools.length > 0) {
            body.tools = tools;
        }

        return {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(body)
        };
    }

    parseResponse(response) {
        return response.json().then(data => {
            if (data.error) {
                throw new Error(data.error.message);
            }

            // Parse content for text and tool calls
            let content = '';
            let toolCalls = [];

            if (data.content && Array.isArray(data.content)) {
                for (const block of data.content) {
                    if (block.type === 'text') {
                        content += block.text;
                    } else if (block.type === 'tool_use') {
                        toolCalls.push({
                            id: block.id,
                            type: 'function',
                            function: {
                                name: block.name,
                                arguments: JSON.stringify(block.input)
                            }
                        });
                    }
                }
            }

            return {
                content: content,
                tool_calls: toolCalls.length > 0 ? toolCalls : null,
                usage: data.usage
            };
        });
    }
}

/**
 * DeepSeek Adapter (OpenAI-compatible)
 */
class DeepSeekAdapter {
    getDefaultEndpoint() {
        return 'https://api.deepseek.com/v1/chat/completions';
    }

    buildRequest(config, messages, tools = null) {
        // DeepSeek max_tokens limit: 8192
        const maxTokens = Math.min(config.maxTokens || 2000, 8192);
        const body = {
            model: config.model,
            messages: messages.map(m => ({
                role: m.role,
                content: m.content
            })),
            temperature: config.temperature || 0.7,
            max_tokens: maxTokens
        };

        // Add tools if provided
        if (tools && tools.length > 0) {
            body.tools = tools;
        }

        return {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify(body)
        };
    }

    parseResponse(response) {
        return response.json().then(data => {
            if (data.error) {
                throw new Error(data.error.message);
            }
            const message = data.choices[0]?.message || {};
            return {
                content: message.content || '',
                tool_calls: message.tool_calls || null,
                usage: data.usage
            };
        });
    }
}

/**
 * Grok Adapter (OpenAI-compatible)
 */
class GrokAdapter {
    getDefaultEndpoint() {
        return 'https://api.x.ai/v1/chat/completions';
    }

    buildRequest(config, messages, tools = null) {
        const body = {
            model: config.model,
            messages: messages.map(m => ({
                role: m.role,
                content: m.content
            })),
            temperature: config.temperature || 0.7,
            max_tokens: config.maxTokens || 2000
        };

        // Add tools if provided
        if (tools && tools.length > 0) {
            body.tools = tools;
        }

        return {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify(body)
        };
    }

    parseResponse(response) {
        return response.json().then(data => {
            if (data.error) {
                throw new Error(data.error.message);
            }
            const message = data.choices[0]?.message || {};
            return {
                content: message.content || '',
                tool_calls: message.tool_calls || null,
                usage: data.usage
            };
        });
    }
}

/**
 * Custom Adapter (OpenAI-compatible)
 */
class CustomAdapter {
    getDefaultEndpoint() {
        // No default, must be provided by user
        throw new Error('Custom provider requires endpoint to be specified');
    }

    buildRequest(config, messages, tools = null) {
        const body = {
            model: config.model,
            messages: messages.map(m => ({
                role: m.role,
                content: m.content
            })),
            temperature: config.temperature || 0.7,
            max_tokens: config.maxTokens || 2000
        };

        // Add tools if provided
        if (tools && tools.length > 0) {
            body.tools = tools;
        }

        return {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify(body)
        };
    }

    parseResponse(response) {
        return response.json().then(data => {
            if (data.error) {
                throw new Error(data.error.message);
            }
            const message = data.choices[0]?.message || {};
            return {
                content: message.content || '',
                tool_calls: message.tool_calls || null,
                usage: data.usage
            };
        });
    }
}

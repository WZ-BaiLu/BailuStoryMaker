/**
 * AI Message Builder Module
 *
 * Constructs message arrays for AI requests in the format required by LLM APIs.
 * This module is responsible for converting AIRequest objects (which contain
 * context as intermediate data) into the final message array format.
 */

class AIMessageBuilder {
    constructor(promptBuilder) {
        this.promptBuilder = promptBuilder;
    }

    /**
     * Set prompt builder (for late injection)
     * @param {Object} promptBuilder - AIPromptBuilder instance
     */
    setPromptBuilder(promptBuilder) {
        this.promptBuilder = promptBuilder;
    }

    /**
     * Build messages from AIRequest object
     * @param {Object} request - AIRequest object
     * @param {string} request.type - Request type ('paragraph-generation' | 'paragraph-analysis')
     * @param {Object} request.config - Model configuration {model, temperature, maxTokens}
     * @param {Object} request.context - Context object (intermediate data)
     * @param {Array} [request.tools] - Optional tool definitions
     * @param {string} request.userPrompt - User's prompt
     * @returns {Array} Message array in format [{role, content}]
     */
    buildMessages(request) {
        const messages = [];

        // Get prompt content based on request type
        let promptContent;
        if (request.type === 'paragraph-generation') {
            promptContent = this.promptBuilder.buildParagraphPrompt(
                request.userPrompt,
                request.context
            );
        } else if (request.type === 'paragraph-analysis') {
            promptContent = this.promptBuilder.buildAnalysisPrompt(
                request.paragraph,
                request.context
            );
        } else {
            throw new Error(`Unknown request type: ${request.type}`);
        }

        // Add system message
        if (promptContent.system) {
            messages.push({
                role: 'system',
                content: promptContent.system
            });
        }

        // Add context messages (convert context fields to assistant messages)
        if (request.context) {
            const contextMessages = this.buildContextMessages(request.context);
            messages.push(...contextMessages);
        }

        // Add additional assistant messages from prompt builder
        if (promptContent.assistants && promptContent.assistants.length > 0) {
            promptContent.assistants.forEach(assistantContent => {
                messages.push({
                    role: 'assistant',
                    content: assistantContent
                });
            });
        }

        // Add user message
        if (promptContent.user) {
            messages.push({
                role: 'user',
                content: promptContent.user
            });
        }

        // Add tools if present (note: tools are passed separately to AIService, not in messages)
        // Tools will be handled by the service layer

        return messages;
    }

    /**
     * Build context messages from context object
     * @param {Object} context - Context object
     * @returns {Array} Context messages
     */
    buildContextMessages(context) {
        const contextMessages = [];

        if (context.chapterTitle) {
            contextMessages.push({
                role: 'assistant',
                content: `Chapter Title: ${context.chapterTitle}`
            });
        }

        if (context.chapterContent && context.chapterContent.trim() !== '') {
            contextMessages.push({
                role: 'assistant',
                content: `以下是当前章节已写的内容，作为创作参考：\n\n${context.chapterContent}`
            });
        }

        if (context.elementStateSummary && context.elementStateSummary.trim() !== '') {
            contextMessages.push({
                role: 'assistant',
                content: `当前在场元素状态：\n${context.elementStateSummary}`
            });
        }

        return contextMessages;
    }

    /**
     * Validate message array
     * @param {Array} messages - Message array
     * @returns {Object} Validation result {valid: boolean, errors: string[]}
     */
    validateMessages(messages) {
        const errors = [];

        // Check if messages is an array
        if (!Array.isArray(messages)) {
            return {
                valid: false,
                errors: ['Messages must be an array']
            };
        }

        // Check if messages is not empty
        if (messages.length === 0) {
            errors.push('Message array is empty');
        }

        const validRoles = ['system', 'user', 'assistant'];

        // Validate each message
        messages.forEach((message, index) => {
            // Check if message has role field
            if (!message.hasOwnProperty('role') || message.role === undefined) {
                errors.push(`Message ${index}: missing role field`);
            } else if (!validRoles.includes(message.role)) {
                errors.push(`Message ${index}: invalid role "${message.role}". Must be one of: ${validRoles.join(', ')}`);
            }

            // Check if message has content field
            if (!message.hasOwnProperty('content') || message.content === undefined) {
                errors.push(`Message ${index}: missing content field`);
            } else if (typeof message.content === 'string' && message.content.trim() === '') {
                errors.push(`Message ${index}: content is empty`);
            }
        });

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIMessageBuilder;
}

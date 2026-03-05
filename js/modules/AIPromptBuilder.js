/**
 * AI Prompt Builder Module
 *
 * Generates prompt content for different AI task types (paragraph generation, paragraph analysis).
 * Supports configurable system prompts for customization.
 */

class AIPromptBuilder {
    constructor() {
        // Default system prompts
        this.systemPrompts = {
            'paragraph-generation': '你是一个专业的小说创作助手。一次只生成一个段落。只有调节阅读节奏的极小段落允许一次生成多行。',
            'paragraph-analysis': '你是一个专业的小说分析助手。分析段落内容，识别新出现的元素、元素状态变化等信息。'
        };

        // Load custom prompts from config if available
        this.loadCustomPrompts();
    }

    /**
     * Load custom system prompts from configuration
     */
    loadCustomPrompts() {
        // Check if there's a global config manager
        if (typeof ConfigManager !== 'undefined' && window.configManager) {
            try {
                const aiConfig = window.configManager.getAIConfig();
                if (aiConfig && aiConfig.systemPrompts) {
                    // Override default prompts with custom ones
                    Object.keys(aiConfig.systemPrompts).forEach(type => {
                        if (this.systemPrompts[type]) {
                            this.systemPrompts[type] = aiConfig.systemPrompts[type];
                        }
                    });
                }
            } catch (error) {
                console.warn('[AIPromptBuilder] Failed to load custom prompts:', error);
            }
        }
    }

    /**
     * Build prompt for paragraph generation
     * @param {string} userPrompt - User's generation prompt
     * @param {Object} context - Context object
     * @param {string} context.chapterTitle - Chapter title
     * @param {string} context.elementStateSummary - Element state summary
     * @returns {Object} Prompt object {system: string, assistants: string[], user: string}
     */
    buildParagraphPrompt(userPrompt, context) {
        const assistants = [];

        // Add element state summary as assistant message
        if (context && context.elementStateSummary) {
            assistants.push(context.elementStateSummary);
        }

        // Add existing text as assistant message (if provided in context)
        if (context && context.precedingText) {
            assistants.push(`以下是截至所选段落的已有文本：\n\n${context.precedingText}`);
        }

        return {
            system: this.getSystemPrompt('paragraph-generation'),
            assistants: assistants,
            user: userPrompt || '请根据以上上下文创作段落。'
        };
    }

    /**
     * Build prompt for paragraph analysis
     * @param {Object} paragraph - Paragraph object to analyze
     * @param {Object} context - Context object
     * @param {string} context.chapterTitle - Chapter title
     * @param {string} context.elementStateSummary - Element state summary
     * @returns {Object} Prompt object {system: string, assistants: string[], user: string}
     */
    buildAnalysisPrompt(paragraph, context) {
        const assistants = [];

        // Add instruction to check for new elements
        assistants.push('检查段落里出现新元素，则添加到元素列表中');

        // Add instruction to check for element state changes
        assistants.push('检查段落里已有元素的状态改变');

        // Add element state summary as assistant message
        if (context && context.elementStateSummary) {
            assistants.push(`当前故事里已经记录的全部元素状态：\n${context.elementStateSummary}`);
        }

        // Add paragraph content to analyze
        const userPrompt = `请分析以下段落：\n\n${paragraph.content}`;

        return {
            system: this.getSystemPrompt('paragraph-analysis'),
            assistants: assistants,
            user: userPrompt
        };
    }

    /**
     * Get system prompt template for specified type
     * @param {string} type - Prompt type ('paragraph-generation' | 'paragraph-analysis')
     * @returns {string} System prompt content
     */
    getSystemPrompt(type) {
        if (!this.systemPrompts[type]) {
            console.warn(`[AIPromptBuilder] Unknown prompt type: ${type}, using paragraph-generation`);
            return this.systemPrompts['paragraph-generation'];
        }
        return this.systemPrompts[type];
    }

    /**
     * Set custom prompt template for specified type
     * @param {string} type - Prompt type
     * @param {string} template - Custom prompt template
     */
    setTemplate(type, template) {
        if (!this.systemPrompts.hasOwnProperty(type)) {
            console.warn(`[AIPromptBuilder] Cannot set template for unknown type: ${type}`);
            return;
        }
        this.systemPrompts[type] = template;
    }

    /**
     * Get all available system prompts
     * @returns {Object} All system prompts
     */
    getAllSystemPrompts() {
        return { ...this.systemPrompts };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIPromptBuilder;
}

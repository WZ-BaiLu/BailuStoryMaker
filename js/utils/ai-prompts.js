/**
 * AI System Prompts
 *
 * Centralized storage for AI system prompts and configuration
 */

const AIPrompts = {
    /**
     * Paragraph generation system prompt
     */
    PARAGRAPH_GENERATION: '你是一个专业的小说创作助手。一次只生成一个段落。只有调节阅读节奏的极小段落允许一次生成多行。',

    /**
     * Default generation prompt when no user input provided
     */
    DEFAULT_GENERATION: '请根据以下故事背景和上下文创作段落。',

    /**
     * Get paragraph generation messages
     * @param {string} userPrompt - User's prompt
     * @returns {Array} Messages array
     */
    getParagraphMessages(userPrompt) {
        return [
            {
                role: 'system',
                content: this.PARAGRAPH_GENERATION
            },
            { role: 'user', content: userPrompt || this.DEFAULT_GENERATION }
        ];
    }
};

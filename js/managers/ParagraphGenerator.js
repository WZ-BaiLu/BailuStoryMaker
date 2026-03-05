/**
 * ParagraphGenerator
 *
 * Handles paragraph generation and analysis by calling LLM API.
 * Designed to be reused by both single paragraph generation (chat UI) and
 * continuous writing (batch generation).
 *
 * Responsibilities:
 * 1. Build generation context based on selected paragraph
 * 2. Generate paragraph content using LLM
 * 3. Generate paragraph analysis (event changes)
 * 4. Support preview mode for user confirmation
 */
class ParagraphGenerator {
    /**
     * Create a new ParagraphGenerator instance
     * @param {Object} state - Application state
     * @param {AIManager} aiManager - AI manager instance
     * @param {AIService} aiService - AI service instance
     * @param {AIConfigManager} configManager - Configuration manager
     */
    constructor(state, aiManager, aiService, configManager) {
        this.state = state;
        this.aiManager = aiManager;
        this.aiService = aiService;
        this.configManager = configManager;
    }

    /**
     * Generate a paragraph with optional analysis
     * @param {string} userPrompt - User's prompt/guidance
     * @param {Object} options - Generation options
     * @param {boolean} options.includeAnalysis - Whether to generate analysis (default: true)
     * @param {string} options.selectedParagraphId - Paragraph ID to use as context (default: state.selectedParagraph)
     * @returns {Promise<Object>} Generation result { content, analysis, paragraphId, context }
     */
    async generateParagraph(userPrompt, options = {}) {
        const {
            includeAnalysis = true,
            selectedParagraphId = this.state.selectedParagraph
        } = options;

        console.log('[ParagraphGenerator] Generating paragraph with analysis:', includeAnalysis);

        // 1. Build context based on selected paragraph
        const context = this.aiManager.buildContextWithSelectedParagraph(selectedParagraphId);
        if (!context) {
            throw new Error('无法构建创作上下文，请确保已选择章节');
        }

        // 2. Generate paragraph content
        const content = await this.generateParagraphContent(userPrompt, context);
        if (!content) {
            throw new Error('AI返回空内容');
        }

        // 3. Generate paragraph analysis (if requested)
        let analysis = null;
        if (includeAnalysis) {
            analysis = await this.generateParagraphAnalysis(content, context);
        }

        return {
            content,
            analysis,
            paragraphId: selectedParagraphId,
            context
        };
    }

    /**
     * Generate paragraph content only
     * @param {string} userPrompt - User's prompt
     * @param {Object} context - Generation context
     * @returns {Promise<string>} Generated content
     */
    async generateParagraphContent(userPrompt, context) {
        const config = this.configManager.getConfig();

        // Use centralized AI prompts
        const messages = AIPrompts.getParagraphMessages(userPrompt);

        const result = await this.aiService.chat(config, messages, context, null);

        if (!result.success) {
            throw new Error(result.error?.message || 'AI生成失败');
        }

        return result.data.content || result.data.message?.content;
    }

    /**
     * Generate paragraph analysis (event changes, element state changes)
     * @param {string} content - Paragraph content to analyze
     * @param {Object} context - Generation context
     * @returns {Promise<Object|null>} Analysis result or null if failed
     */
    async generateParagraphAnalysis(content, context) {
        try {
            // Create a temporary paragraph object for analysis
            const tempParagraph = {
                id: `temp-${Date.now()}`,
                content: content
            };

            // Use AIManager's analyzeParagraph method
            const result = await this.aiManager.analyzeParagraph(tempParagraph, context);

            if (!result || !result.success) {
                console.warn('[ParagraphGenerator] Analysis failed:', result?.error);
                return null;
            }

            return result.data;
        } catch (error) {
            console.error('[ParagraphGenerator] Analysis error:', error);
            return null;
        }
    }

    /**
     * Preview generation request without executing
     * @param {string} userPrompt - User's prompt
     * @param {Object} options - Generation options
     * @returns {Object} Preview data { context, userPrompt, messages }
     */
    previewGenerationRequest(userPrompt, options = {}) {
        const {
            selectedParagraphId = this.state.selectedParagraph,
            includeAnalysis = true
        } = options;

        const context = this.aiManager.buildContextWithSelectedParagraph(selectedParagraphId);

        // Use centralized AI prompts
        const messages = AIPrompts.getParagraphMessages(userPrompt);

        return {
            context,
            userPrompt: userPrompt || AIPrompts.DEFAULT_GENERATION,
            messages,
            includeAnalysis
        };
    }

    /**
     * Insert generated paragraph to story
     * @param {string} content - Paragraph content
     * @param {string} insertBeforeId - Paragraph ID to insert before (null = append at end)
     * @returns {Object} Created paragraph
     */
    insertParagraphToStory(content, insertBeforeId = null) {
        if (!this.state.selectedChapter) {
            throw new Error('请先选择章节');
        }

        // Add new paragraph
        const paragraph = this.state.addParagraph(this.state.selectedChapter, insertBeforeId);
        this.state.updateParagraph(this.state.selectedChapter, paragraph.id, { content });

        console.log('[ParagraphGenerator] Inserted paragraph:', paragraph.id);
        return paragraph;
    }

    /**
     * Apply analysis to a paragraph
     * @param {string} paragraphId - Paragraph ID
     * @param {Object} analysis - Analysis result
     * @returns {Promise<Object>} Application result
     */
    async applyAnalysisToParagraph(paragraphId, analysis) {
        if (!paragraphId) {
            throw new Error('请先选择段落以应用分析');
        }

        const result = await this.aiManager.applyParagraphAnalysis(paragraphId, analysis);

        if (!result || !result.success) {
            throw new Error(result?.error?.message || '应用分析失败');
        }

        return result;
    }
}

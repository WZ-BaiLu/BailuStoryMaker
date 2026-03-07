/**
 * Paragraph Analyzer Module (Refactored)
 *
 * Analyzes existing paragraph text to extract and suggest:
 * - Story elements (characters, items, locations, memories)
 * - Events and actions
 * - State changes
 *
 * Refactoring improvements:
 * 1. Extracted ToolExecutor - handles tool call execution
 * 2. Extracted CacheManager - handles analysis caching
 * 3. Added comprehensive error handling
 * 4. Reduced processToolCallResult complexity (15 -> <5)
 * 5. Separated concerns: analysis, caching, tool execution
 */

class ParagraphAnalyzer {
    constructor(story, elementManager, aiService, configManager, aiElementTools = null, promptBuilder = null, messageBuilder = null, contextBuilder = null) {
        this.story = story;
        this.elementManager = elementManager;
        this.aiService = aiService;
        this.configManager = configManager;
        this.aiElementTools = aiElementTools;

        this.promptBuilder = promptBuilder || new AIPromptBuilder();
        this.messageBuilder = messageBuilder || new AIMessageBuilder(this.promptBuilder);
        this.contextBuilder = contextBuilder;

        this.cacheManager = new CacheManager('paragraph-analysis-cache');
        this.toolExecutor = new ToolExecutor(elementManager);

        this.loadCacheFromStorage();
    }

    // ==================== Analysis Methods ====================

    /**
     * Analyze a single paragraph
     */
    async analyzeParagraph(paragraph, context) {
        try {
            const analysisContext = this.buildAnalysisContext(paragraph, context);
            const cacheKey = this.getCacheKey(paragraph, analysisContext);

            const cached = this.cacheManager.get(cacheKey);
            if (cached && this.isValidAnalysis(cached)) {
                console.log(`[ParagraphAnalyzer] Using cached analysis for ${paragraph.id}`);
                return cached;
            }

            const promptMessages = this.generateAnalysisPrompt(paragraph, analysisContext);
            const tools = this.aiElementTools ? this.aiElementTools.getToolDefinitions() : null;
            const aiResponse = await this.callAIForAnalysisWithTools(promptMessages, tools);
            const analysis = this.parseAnalysisResult(aiResponse, paragraph.id);

            this.cacheManager.set(cacheKey, analysis);
            this.saveCacheToStorage();

            return analysis;
        } catch (error) {
            console.error(`[ParagraphAnalyzer] Analysis failed for ${paragraph.id}:`, error);
            throw error;
        }
    }

    /**
     * Analyze multiple paragraphs in batch
     */
    async analyzeParagraphs(paragraphs, context) {
        const results = [];

        for (const paragraph of paragraphs) {
            try {
                const analysis = await this.analyzeParagraph(paragraph, context);
                results.push(analysis);
            } catch (error) {
                console.error(`Error analyzing paragraph ${paragraph.id}:`, error);
                results.push(this._createErrorAnalysis(paragraph.id, error));
            }
        }

        return results;
    }

    /**
     * Create error analysis result
     * @private
     */
    _createErrorAnalysis(paragraphId, error) {
        return {
            paragraphId,
            error: error.message,
            elements: [],
            events: [],
            stateChanges: []
        };
    }

    // ==================== AI Communication ====================

    /**
     * Call AI for analysis with tools
     */
    async callAIForAnalysisWithTools(messages, tools) {
        try {
            return await this.aiService.sendMessage({
                messages,
                tools: tools || undefined
            });
        } catch (error) {
            console.error('[ParagraphAnalyzer] AI call failed:', error);
            throw new Error(`AI analysis failed: ${error.message}`);
        }
    }

    /**
     * Parse analysis result from AI
     */
    parseAnalysisResult(aiResponse, paragraphId) {
        try {
            const analysisData = this._initializeAnalysisData(paragraphId);

            if (aiResponse.toolCalls && Array.isArray(aiResponse.toolCalls)) {
                aiResponse.toolCalls.forEach(toolCall => {
                    if (toolCall.result && toolCall.result.success) {
                        this.toolExecutor.process(toolCall, analysisData);
                    }
                });
            }

            return this._finalizeAnalysis(analysisData);
        } catch (error) {
            console.error('[ParagraphAnalyzer] Parse failed:', error);
            throw new Error(`Failed to parse analysis: ${error.message}`);
        }
    }

    /**
     * Initialize analysis data structure
     * @private
     */
    _initializeAnalysisData(paragraphId) {
        return {
            paragraphId,
            elements: [],
            events: [],
            stateChanges: [],
            metadata: {
                analyzedAt: new Date().toISOString()
            }
        };
    }

    /**
     * Finalize analysis result
     * @private
     */
    _finalizeAnalysis(analysisData) {
        return {
            ...analysisData,
            elementCount: analysisData.elements.length,
            eventCount: analysisData.events.length,
            stateChangeCount: analysisData.stateChanges.length
        };
    }

    // ==================== Context Building ====================

    /**
     * Build analysis context
     */
    buildAnalysisContext(paragraph, userContext) {
        const chapter = this.getChapter(userContext?.chapterId);
        const previousParagraphs = this.getPreviousParagraphs(paragraph, chapter);

        return {
            chapter,
            previousParagraphs,
            currentParagraph: paragraph,
            selectedElement: userContext?.selectedElement
        };
    }

    /**
     * Generate analysis prompt
     */
    generateAnalysisPrompt(paragraph, context) {
        const systemPrompt = this._buildSystemPrompt(context);
        const userPrompt = this._buildUserPrompt(paragraph, context);

        return this.messageBuilder.buildMessages([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
        ]);
    }

    /**
     * Build system prompt
     * @private
     */
    _buildSystemPrompt(context) {
        return `你是一个专业的小说分析助手。你的任务是分析段落文本，识别出：
1. 故事元素（人物、道具、地点、记忆、设定）
2. 事件和动作
3. 状态变化

请使用提供的工具来记录这些信息。`;
    }

    /**
     * Build user prompt
     * @private
     */
    _buildUserPrompt(paragraph, context) {
        let prompt = `请分析以下段落：\n\n${paragraph.content}\n\n`;

        if (context.previousParagraphs.length > 0) {
            prompt += `前文：\n${context.previousParagraphs.map(p => p.content).join('\n')}\n\n`;
        }

        return prompt;
    }

    // ==================== Helper Methods ====================

    /**
     * Get cache key
     */
    getCacheKey(paragraph, context) {
        const previousContent = context.previousParagraphs
            .map(p => p.content)
            .join('|||');
        return `${paragraph.id}_${paragraph.content}_${previousContent}`.substring(0, 200);
    }

    /**
     * Validate analysis structure
     */
    isValidAnalysis(analysis) {
        return analysis &&
               typeof analysis === 'object' &&
               Array.isArray(analysis.elements) &&
               Array.isArray(analysis.events) &&
               Array.isArray(analysis.stateChanges);
    }

    /**
     * Get chapter by ID
     */
    getChapter(chapterId) {
        if (!this.story || !this.story.chapters) {
            return null;
        }
        return this.story.chapters.find(c => c.id === chapterId) || null;
    }

    /**
     * Get previous paragraphs
     */
    getPreviousParagraphs(paragraph, chapter) {
        if (!chapter || !chapter.paragraphs) {
            return [];
        }

        const index = chapter.paragraphs.findIndex(p => p.id === paragraph.id);
        if (index === -1) {
            return [];
        }

        return chapter.paragraphs.slice(0, index);
    }

    /**
     * Format elements for AI prompt
     */
    formatElementsForPrompt(elements) {
        if (!Array.isArray(elements) || elements.length === 0) {
            return '（无）';
        }

        return elements.map(el => {
            const prefix = this._getElementPrefix(el.type);
            const description = el.description 
                ? ` - ${el.description.substring(0, 100)}${el.description.length > 100 ? '...' : ''}` 
                : '';
            return `- ${prefix}: ${el.name}${description}`;
        }).join('\n');
    }

    /**
     * Get element prefix
     * @private
     */
    _getElementPrefix(type) {
        const prefixes = {
            character: '角色',
            item: '道具',
            location: '地点',
            memory: '记忆',
            base: '设定'
        };
        return prefixes[type] || '元素';
    }

    // ==================== Cache Management ====================

    /**
     * Load cache from storage
     */
    loadCacheFromStorage() {
        try {
            const saved = localStorage.getItem(this.cacheManager.storageKey);
            if (saved) {
                this.cacheManager.load(JSON.parse(saved));
            }
        } catch (error) {
            console.error('[ParagraphAnalyzer] Failed to load cache:', error);
        }
    }

    /**
     * Save cache to storage
     */
    saveCacheToStorage() {
        try {
            const cacheData = this.cacheManager.serialize();
            localStorage.setItem(this.cacheManager.storageKey, JSON.stringify(cacheData));
        } catch (error) {
            console.error('[ParagraphAnalyzer] Failed to save cache:', error);
        }
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cacheManager.clear();
    }

    // ==================== Update Methods ====================

    /**
     * Update story data
     */
    updateStory(story) {
        this.story = story;
    }

    /**
     * Update element manager
     */
    updateElementManager(elementManager) {
        this.elementManager = elementManager;
        this.toolExecutor.updateElementManager(elementManager);
    }
}

/**
 * Cache Manager
 * Handles caching of analysis results
 */
class CacheManager {
    constructor(storageKey) {
        this.cache = new Map();
        this.storageKey = storageKey;
    }

    get(key) {
        return this.cache.get(key);
    }

    set(key, value) {
        this.cache.set(key, value);
    }

    has(key) {
        return this.cache.has(key);
    }

    delete(key) {
        this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }

    load(data) {
        this.cache = new Map(Object.entries(data));
    }

    serialize() {
        return Object.fromEntries(this.cache);
    }
}

/**
 * Tool Executor
 * Handles tool call execution and result processing
 */
class ToolExecutor {
    constructor(elementManager) {
        this.elementManager = elementManager;
        this.handlers = {
            listElements: this._handleListElements.bind(this),
            getContextInfo: this._handleGetContextInfo.bind(this),
            addElement: this._handleAddElement.bind(this),
            updateElementLocation: this._handleUpdateElementLocation.bind(this),
            updateElementDescription: this._handleUpdateElementDescription.bind(this),
            updateParagraphTimestamp: this._handleUpdateTimestamp.bind(this)
        };
    }

    updateElementManager(elementManager) {
        this.elementManager = elementManager;
    }

    process(toolCall, analysisData) {
        const handler = this.handlers[toolCall.name];
        if (handler) {
            handler(toolCall, analysisData);
        } else {
            console.warn(`[ToolExecutor] Unknown tool: ${toolCall.name}`);
        }
    }

    _handleListElements(toolCall, analysisData) {
        if (toolCall.result?.data) {
            console.log('[ToolExecutor] Elements listed:', toolCall.result.data);
        }
    }

    _handleGetContextInfo(toolCall, analysisData) {
        if (toolCall.result?.data) {
            console.log('[ToolExecutor] Context info retrieved:', toolCall.result.data);
        }
    }

    _handleAddElement(toolCall, analysisData) {
        if (toolCall.result?.element) {
            analysisData.elements.push({
                id: toolCall.result.element.id,
                type: toolCall.result.element.type,
                name: toolCall.result.element.name,
                isNew: true
            });

            const typeMap = {
                character: '人物',
                item: '道具',
                location: '地点',
                memory: '记忆',
                base: '设定'
            };

            analysisData.events.push({
                description: `新增${typeMap[toolCall.arguments.type] || '元素'}: ${toolCall.arguments.name}`,
                type: 'discovery',
                participants: [toolCall.result.element.id],
                location: null
            });
        }
    }

    _handleUpdateElementLocation(toolCall, analysisData) {
        if (toolCall.arguments) {
            const element = this._findElement(toolCall.arguments.elementId);
            const elementId = element?.id || toolCall.arguments.elementId;

            analysisData.stateChanges.push({
                elementId,
                elementName: element?.name || toolCall.arguments.elementId,
                property: 'location',
                from: '当前位置',
                to: toolCall.arguments.location,
                changes: { location: toolCall.arguments.location }
            });

            analysisData.events.push({
                description: `${element?.name || toolCall.arguments.elementId} 移动到了 ${toolCall.arguments.location || '未知'}`,
                type: 'action',
                participants: [elementId],
                location: toolCall.arguments.location
            });
        }
    }

    _handleUpdateElementDescription(toolCall, analysisData) {
        if (toolCall.arguments && toolCall.result?.changes) {
            const element = this._findElement(toolCall.arguments.elementId);
            const elementId = element?.id || toolCall.arguments.elementId;

            analysisData.stateChanges.push({
                elementId,
                elementName: element?.name || toolCall.arguments.elementId,
                property: 'description',
                from: '原有描述',
                to: JSON.stringify(toolCall.result.changes),
                changes: toolCall.result.changes
            });
        }
    }

    _handleUpdateTimestamp(toolCall, analysisData) {
        if (toolCall.result?.timestamp) {
            analysisData.events.push({
                description: `段落时间戳更新为 ${toolCall.result.timestamp.narrativeType || '线性'}`,
                type: 'state_change',
                participants: [],
                location: null
            });
        }
    }

    _findElement(identifier) {
        let element = this.elementManager?.getElement(identifier);
        if (!element && this.elementManager) {
            element = this.elementManager.findElementByName(identifier);
        }
        return element;
    }
}

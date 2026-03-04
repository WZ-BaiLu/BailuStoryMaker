/**
 * Paragraph Analyzer Module
 *
 * Analyzes existing paragraph text to extract and suggest:
 * - Story elements (characters, items, locations, memories)
 * - Events and actions
 * - State changes
 *
 * This module works with AI to understand the content of existing paragraphs
 * and generate structured metadata about the story elements and changes.
 */
class ParagraphAnalyzer {
    /**
     * Create a new ParagraphAnalyzer instance
     * @param {Object} story - Current story data
     * @param {ElementManager} elementManager - Element manager (optional)
     * @param {AIService} aiService - AI service for analysis
     * @param {AIConfigManager} configManager - AI config manager
     * @param {AIElementTools} aiElementTools - AI element tools (optional)
     */
    constructor(story, elementManager, aiService, configManager, aiElementTools = null) {
        this.story = story;
        this.elementManager = elementManager;
        this.aiService = aiService;
        this.configManager = configManager;
        this.aiElementTools = aiElementTools;

        // Analysis cache
        this.analysisCache = new Map();
    }

    /**
     * Update the story data (called when story changes)
     * @param {Object} story - New story data
     */
    updateStory(story) {
        this.story = story;
        this.clearCache();
    }

    /**
     * Update the element manager (called when it becomes available)
     * @param {ElementManager} elementManager - Element manager instance
     */
    updateElementManager(elementManager) {
        this.elementManager = elementManager;
        this.clearCache();
    }

    /**
     * Analyze a single paragraph
     * @param {Object} paragraph - The paragraph to analyze
     * @param {Object} context - Context information
     * @returns {Promise<Object>} Analysis result
     */
    async analyzeParagraph(paragraph, context) {
        const cacheKey = this.getCacheKey(paragraph.id);

        // Check cache - only cache if no tools are available
        if (this.aiElementTools && this.analysisCache.has(cacheKey)) {
            return this.analysisCache.get(cacheKey);
        }

        // Build analysis context
        const analysisContext = this.buildAnalysisContext(paragraph, context);

        // Generate prompt messages
        const promptMessages = this.generateAnalysisPrompt(paragraph, analysisContext);

        // Call AI with tools if available
        const tools = this.aiElementTools ? this.aiElementTools.getToolDefinitions() : null;
        const aiResponse = await this.callAIForAnalysisWithTools(promptMessages, tools);

        // Parse response
        const analysis = this.parseAnalysisResult(aiResponse, paragraph.id);

        // Cache result only if no tools were used (tools modify state, so we shouldn't cache)
        if (!tools || tools.length === 0) {
            this.analysisCache.set(cacheKey, analysis);
        }

        return analysis;
    }

    /**
     * Analyze multiple paragraphs in batch
     * @param {Array<Object>} paragraphs - Array of paragraphs to analyze
     * @param {Object} context - Context information
     * @returns {Promise<Array<Object>>} Array of analysis results
     */
    async analyzeParagraphs(paragraphs, context) {
        const results = [];

        for (const paragraph of paragraphs) {
            try {
                const analysis = await this.analyzeParagraph(paragraph, context);
                results.push(analysis);
            } catch (error) {
                console.error(`Error analyzing paragraph ${paragraph.id}:`, error);
                results.push({
                    paragraphId: paragraph.id,
                    error: error.message,
                    elements: [],
                    events: [],
                    stateChanges: []
                });
            }
        }

        return results;
    }

    /**
     * Build context for paragraph analysis
     * @param {Object} paragraph - The paragraph being analyzed
     * @param {Object} context - User-provided context
     * @returns {Object} Analysis context
     */
    buildAnalysisContext(paragraph, context) {
        const chapter = this.getChapter(context.chapterId);
        const previousParagraphs = this.getPreviousParagraphs(paragraph, chapter);

        return {
            paragraph: paragraph,
            chapter: chapter,
            previousParagraphs: previousParagraphs.slice(-3), // Last 3 paragraphs
            existingElements: this.elementManager ? this.elementManager.listElements() : [],
            currentLocation: this.getCurrentLocation(chapter),
            storyContext: this.getStoryContext(chapter)
        };
    }

    /**
     * Generate AI prompt for paragraph analysis
     * @param {Object} paragraph - The paragraph to analyze
     * @param {Object} analysisContext - Analysis context
     * @returns {Object} Object with system, assistant and user messages
     */
    generateAnalysisPrompt(paragraph, analysisContext) {
        // Count existing elements by type and name
        const elementCounts = {};
        for (const element of analysisContext.existingElements) {
            const key = `${element.type}:${element.name.toLowerCase()}`;
            elementCounts[key] = (elementCounts[key] || 0) + 1;
        }

        // System message with analysis requirements
        const systemMessage = `你是一个专业的小说分析助手，负责分析小说段落并通过工具调用来更新故事元素和状态。

请分析段落内容，并在一次响应中完成以下所有操作（非常重要）：

## 分析流程

### 第一步：识别段落中的元素
- 识别段落中提到的人物、地点、道具、记忆、设定等元素
- 特别注意地点信息（当前场景发生的地方）

### 第二步：检查元素是否存在
- 根据提供的已存在元素列表，检查段落中提到的元素是否已存在
- 如果元素已存在，直接使用现有元素
- 如果元素不存在，需要创建新元素

### 第三步：创建新元素（如果需要）
- 使用 addElement 工具创建段落中提到但不存在的新元素
- 元素类型：character（人物）、location（地点）、item（道具）、memory（记忆）、base（设定）

### 第四步：设置元素位置
- 使用 updateElementLocation 工具设置元素的位置
- 如果段落提到某人在某个地点，使用该工具设置关系

## 关键要求

1. **直接使用已提供的元素信息**：
   - 编辑器已提供完整的已存在元素列表
   - 不需要调用 listElements 工具查询
   - 根据提供的列表判断元素是否存在

2. **所有工具调用必须在同一个响应中完成**：
   - 不要等待工具返回后再调用下一个
   - 一次性列出所有需要的工具调用

3. **避免重复创建元素**：
   - 根据已提供的元素列表检查元素是否已存在
   - 已存在的元素直接使用，不要再创建

4. **updateElementLocation 支持使用名称**：
   - 可以使用元素名称而不是 ID
   - 系统会自动查找对应的元素

## 示例

### 示例 1：分析"张无忌来到光明顶"

假设已存在元素列表中有"张无忌"，但没有"光明顶"

工具调用顺序：
1. addElement(type: "location", name: "光明顶", description: "明教总坛所在地", keywords: ["山峰", "明教"])
2. updateElementLocation(elementId: "张无忌", location: "光明顶")

### 示例 2：分析"赵敏在大殿里看到周芷若"

假设已存在元素列表中有"赵敏"和"周芷若"，但没有"大殿"

工具调用顺序：
1. addElement(type: "location", name: "大殿", description: "建筑", keywords: ["大殿"])
2. updateElementLocation(elementId: "赵敏", location: "大殿")
3. updateElementLocation(elementId: "周芷若", location: "大殿")

### 示例 3：分析"段誉来到一座山"

假设已存在元素列表中有"段誉"，没有任何地点

工具调用顺序：
1. addElement(type: "location", name: "一座山", description: "地点", keywords: [])
2. updateElementLocation(elementId: "段誉", location: "一座山")

## 注意事项

- 完成分析后，不要返回任何文字说明，只通过工具调用更新状态
- 编辑器已提供完整的已存在元素列表，无需查询
- 地点是理解段落的关键信息，请特别注意识别`;

        // Assistant message with context information
        const assistantMessage = `## 当前故事背景
- 章节: ${analysisContext.chapter ? analysisContext.chapter.title : '未知'}

## 分析提示

请仔细阅读段落内容，识别其中提到的人物、地点、道具等元素，并使用工具进行操作。

关键步骤：
1. 根据已提供的元素列表检查元素是否存在
2. 创建新元素（如果需要）
3. 设置元素位置关系

## 已存在的元素（完整列表，请直接使用）
${this.formatElementsForPrompt(analysisContext.existingElements)}

## 前几个段落（上下文）
${analysisContext.previousParagraphs.map((p, i) => `${i + 1}. ${p.content}`).join('\n')}`;

        // User message with only paragraph content
        const userMessage = paragraph.content;

        return {
            system: systemMessage,
            assistant: assistantMessage,
            user: userMessage
        };
    }

    /**
     * Call AI for analysis with tools support
     * @param {Object} promptMessages - Object with system, assistant and user messages
     * @param {Array} tools - Array of tool definitions
     * @returns {Promise<Object>} AI response with tool calls executed
     */
    async callAIForAnalysisWithTools(promptMessages, tools = null) {
        try {
            const config = this.configManager.getConfig();
            const messages = [
                { role: 'system', content: promptMessages.system },
                { role: 'assistant', content: promptMessages.assistant },
                { role: 'user', content: promptMessages.user }
            ];

            const result = await this.aiService.chat(config, messages, null, tools);

            if (!result.success) {
                throw new Error(result.error || 'AI service error');
            }

            const message = result.data;

            // Execute tool calls if present
            let allExecutedToolCalls = [];
            if (message.tool_calls && Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
                // Execute all tool calls in single round
                for (const toolCall of message.tool_calls) {
                    const functionName = toolCall.function?.name || toolCall.name;
                    const functionArgs = toolCall.function?.arguments ?
                        JSON.parse(toolCall.function.arguments) :
                        toolCall.arguments;

                    // Execute tool
                    const toolResult = await this.executeTool(functionName, functionArgs);

                    allExecutedToolCalls.push({
                        name: functionName,
                        arguments: functionArgs,
                        result: toolResult
                    });

                    // Log tool result for debugging
                    console.log(`[ParagraphAnalyzer] Tool executed: ${functionName}`, {
                        args: functionArgs,
                        result: toolResult
                    });
                }
            }

            return {
                content: message.content || '',
                tool_calls: allExecutedToolCalls
            };
        } catch (error) {
            console.error('AI analysis with tools failed:', error);
            throw new Error(`AI 分析失败: ${error.message}`);
        }
    }

    /**
     * Execute a tool by name with arguments
     * @param {string} toolName - Name of the tool to execute
     * @param {Object} args - Tool arguments
     * @returns {Promise<Object>} Tool execution result
     */
    async executeTool(toolName, args) {
        if (!this.aiElementTools) {
            return {
                success: false,
                error: 'AIElementTools not initialized'
            };
        }

        const toolMap = {
            'listElements': 'listElements',
            'getContextInfo': 'getContextInfo',
            'addElement': 'addElement',
            'updateElementLocation': 'updateElementLocation',
            'updateElementDescription': 'updateElementDescription',
            'updateParagraphTimestamp': 'updateParagraphTimestamp'
        };

        const methodName = toolMap[toolName];
        if (!methodName) {
            return {
                success: false,
                error: `Unknown tool: ${toolName}`
            };
        }

        try {
            const result = await this.aiElementTools[methodName](args);
            return result;
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Parse AI analysis result
     * @param {Object} aiResponse - AI response with executed tool calls
     * @param {string} paragraphId - Paragraph ID
     * @returns {Object} Parsed analysis
     */
    parseAnalysisResult(aiResponse, paragraphId) {
        try {
            // AI response contains tool_calls which have been executed
            const analysisData = {
                elements: [],
                events: [],
                stateChanges: [],
                toolCalls: []
            };

            // Extract tool calls if present
            if (aiResponse.tool_calls && Array.isArray(aiResponse.tool_calls)) {
                for (const toolCall of aiResponse.tool_calls) {
                    analysisData.toolCalls.push({
                        name: toolCall.name,
                        args: toolCall.arguments,
                        result: toolCall.result
                    });

                    // Build state changes and events from successful tool calls
                    if (toolCall.result && toolCall.result.success) {
                        this.processToolCallResult(toolCall, analysisData);
                    } else if (toolCall.result && !toolCall.result.success) {
                        // Log failed tool calls
                        console.warn(`[ParagraphAnalyzer] Tool call failed: ${toolCall.name}`, {
                            args: toolCall.arguments,
                            error: toolCall.result.error
                        });
                    }
                }
            }

            return {
                paragraphId: paragraphId,
                timestamp: new Date().toISOString(),
                elements: analysisData.elements,
                events: analysisData.events,
                stateChanges: analysisData.stateChanges,
                rawAnalysis: analysisData
            };
        } catch (error) {
            console.error('Failed to parse AI analysis:', error);
            return {
                paragraphId: paragraphId,
                error: '解析 AI 返回结果失败',
                elements: [],
                events: [],
                stateChanges: []
            };
        }
    }

    /**
     * Process tool call result to build analysis data
     * @param {Object} toolCall - Tool call with result
     * @param {Object} analysisData - Analysis data to update
     */
    processToolCallResult(toolCall, analysisData) {
        switch (toolCall.name) {
            case 'listElements':
                // List elements is used for query, doesn't generate events
                if (toolCall.result && toolCall.result.data) {
                    console.log('[ParagraphAnalyzer] Elements listed:', toolCall.result.data);
                }
                break;

            case 'getContextInfo':
                // Context info is used internally, doesn't generate events
                if (toolCall.result && toolCall.result.data) {
                    console.log('[ParagraphAnalyzer] Context info retrieved:', toolCall.result.data);
                }
                break;

            case 'addElement':
                if (toolCall.result.element) {
                    analysisData.elements.push({
                        id: toolCall.result.element.id,
                        type: toolCall.result.element.type,
                        name: toolCall.result.element.name,
                        isNew: true
                    });

                    // Adding a new element is itself an event
                    const typeMap = {
                        'character': '人物',
                        'item': '道具',
                        'location': '地点',
                        'memory': '记忆',
                        'base': '设定'
                    };
                    const typeName = typeMap[toolCall.arguments.type] || '元素';

                    analysisData.events.push({
                        description: `新增${typeName}: ${toolCall.arguments.name}`,
                        type: 'discovery',
                        participants: [toolCall.result.element.id],
                        location: null
                    });
                }
                break;

            case 'updateElementLocation':
                if (toolCall.arguments) {
                    // Try to find element by ID first, then by name
                    let element = this.elementManager?.getElement(toolCall.arguments.elementId);
                    if (!element && this.elementManager) {
                        element = this.elementManager.findElementByName(toolCall.arguments.elementId);
                    }

                    const elementId = element?.id || toolCall.arguments.elementId;

                    analysisData.stateChanges.push({
                        elementId: elementId,
                        elementName: element?.name || toolCall.arguments.elementId,
                        property: 'location',
                        from: '当前位置',
                        to: toolCall.arguments.location,
                        changes: {
                            location: toolCall.arguments.location
                        }
                    });

                    // Location change is an event
                    analysisData.events.push({
                        description: `${element?.name || toolCall.arguments.elementId} 移动到了 ${toolCall.arguments.location || '未知'}`,
                        type: 'action',
                        participants: [elementId],
                        location: toolCall.arguments.location
                    });
                }
                break;

            case 'updateElementDescription':
                if (toolCall.arguments && toolCall.result && toolCall.result.changes) {
                    // Try to find element by ID first, then by name
                    let element = this.elementManager?.getElement(toolCall.arguments.elementId);
                    if (!element && this.elementManager) {
                        element = this.elementManager.findElementByName(toolCall.arguments.elementId);
                    }

                    const elementId = element?.id || toolCall.arguments.elementId;

                    analysisData.stateChanges.push({
                        elementId: elementId,
                        elementName: element?.name || toolCall.arguments.elementId,
                        property: 'description',
                        from: '原有描述',
                        to: JSON.stringify(toolCall.result.changes),
                        changes: toolCall.result.changes
                    });
                }
                break;

            case 'updateParagraphTimestamp':
                if (toolCall.result && toolCall.result.timestamp) {
                    analysisData.events.push({
                        description: `段落时间戳更新为 ${toolCall.result.timestamp.narrativeType || '线性'}`,
                        type: 'state_change',
                        participants: [],
                        location: null
                    });
                }
                break;
        }
    }

    /**
     * Format elements for AI prompt
     * @param {Array} elements - List of elements
     * @returns {string} Formatted element list
     */
    formatElementsForPrompt(elements) {
        if (!Array.isArray(elements) || elements.length === 0) {
            return '（无）';
        }

        return elements.map(el => {
            const prefix = el.type === 'character' ? '角色' :
                          el.type === 'item' ? '道具' :
                          el.type === 'location' ? '地点' :
                          el.type === 'memory' ? '记忆' : '设定';
            const description = el.description ? ` - ${el.description.substring(0, 100)}${el.description.length > 100 ? '...' : ''}` : '';
            return `- ${prefix}: ${el.name}${description}`;
        }).join('\n');
    }

    /**
     * Get chapter by ID
     * @param {string} chapterId - Chapter ID
     * @returns {Object|null} Chapter or null
     */
    getChapter(chapterId) {
        if (!this.story || !this.story.chapters) {
            return null;
        }
        return this.story.chapters.find(c => c.id === chapterId) || null;
    }

    /**
     * Get previous paragraphs
     * @param {Object} paragraph - Current paragraph
     * @param {Object} chapter - Chapter
     * @returns {Array<Object>} Previous paragraphs
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
     * Get current location from previous paragraphs
     * @param {Object} chapter - Chapter
     * @returns {string|null} Current location
     */
    getCurrentLocation(chapter) {
        if (!chapter || !chapter.paragraphs) {
            return null;
        }

        // Search backwards for location change
        for (let i = chapter.paragraphs.length - 1; i >= 0; i--) {
            const p = chapter.paragraphs[i];
            if (p.changes && p.changes.elements) {
                for (const elementChange of p.changes.elements) {
                    if (elementChange.stateChanges?.location) {
                        return elementChange.stateChanges.location;
                    }
                }
            }
        }

        return null;
    }

    /**
     * Get story context
     * @param {Object} chapter - Chapter
     * @returns {Object} Story context
     */
    getStoryContext(chapter) {
        return {
            chapterTitle: chapter ? chapter.title : '未知',
            paragraphCount: chapter ? chapter.paragraphs.length : 0
        };
    }

    /**
     * Generate cache key for paragraph
     * @param {string} paragraphId - Paragraph ID
     * @returns {string} Cache key
     */
    getCacheKey(paragraphId) {
        return `paragraph-analysis-${paragraphId}`;
    }

    /**
     * Clear analysis cache
     */
    clearCache() {
        this.analysisCache.clear();
    }

    /**
     * Invalidate cache for specific paragraph
     * @param {string} paragraphId - Paragraph ID
     */
    invalidateCache(paragraphId) {
        const cacheKey = this.getCacheKey(paragraphId);
        this.analysisCache.delete(cacheKey);
    }

    /**
     * Apply analysis results to the story
     * @param {Object} analysis - Analysis result
     * @param {string} paragraphId - Paragraph ID
     * @returns {Promise<Object>} Application result with created elements
     */
    async applyAnalysis(analysis, paragraphId) {
        const result = {
            paragraphId: paragraphId,
            createdElements: [],
            updatedElements: [],
            errors: []
        };

        // Note: Elements are already created by tool calls during analysis
        // We just need to record them and apply state changes to the paragraph
        for (const element of analysis.elements) {
            if (element.isNew) {
                // Element was already created by the tool call
                result.createdElements.push({
                    elementId: element.id,
                    name: element.name,
                    type: element.type
                });
            }
        }

        // Apply state changes to paragraph
        try {
            const paragraph = this.findParagraph(paragraphId);
            if (paragraph) {
                if (!paragraph.changes) {
                    paragraph.changes = { elements: [] };
                }

                // Add state changes
                for (const stateChange of analysis.stateChanges) {
                    paragraph.changes.elements.push(stateChange);
                }

                result.updatedElements = analysis.stateChanges.length;
            }
        } catch (error) {
            result.errors.push({
                type: 'updateParagraph',
                paragraphId: paragraphId,
                error: error.message
            });
        }

        // Invalidate cache for this paragraph
        this.invalidateCache(paragraphId);

        return result;
    }

    /**
     * Find paragraph in story
     * @param {string} paragraphId - Paragraph ID
     * @returns {Object|null} Paragraph or null
     */
    findParagraph(paragraphId) {
        if (!this.story || !this.story.chapters) {
            return null;
        }

        for (const chapter of this.story.chapters) {
            if (!chapter.paragraphs) continue;
            const paragraph = chapter.paragraphs.find(p => p.id === paragraphId);
            if (paragraph) {
                return paragraph;
            }
        }

        return null;
    }
}

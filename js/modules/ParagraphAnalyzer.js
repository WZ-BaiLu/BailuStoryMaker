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

第一步：检查元素是否已存在
- 查看下方的"已存在的元素"列表
- 如果元素已存在，直接使用其名称，不要再创建
- 如果元素不存在，使用 addElement 工具创建

第二步：更新元素状态
- 对于已存在或新创建的元素，如果段落中提到它们的位置，使用 updateElementLocation 设置位置

关键要求：
- 必须在同一个响应中调用所有必要的工具（不能分多次）
- AI 工具调用不支持多轮对话，必须在一次响应中完成所有操作
- 重复创建相同的元素会导致错误，请务必先检查"已存在的元素"列表
- 在 updateElementLocation 中，可以使用元素名称而不是 ID（系统会自动查找）

示例 1（分析"段誉来到一座山"，段誉已存在，山不存在）：
1. addElement(type: "location", name: "一座山", description: "地点", keywords: [])
2. updateElementLocation(elementId: "段誉", location: "一座山")

示例 2（分析"段誉来到一座山"，两者都已存在）：
1. updateElementLocation(elementId: "段誉", location: "一座山")

示例 3（分析"段誉来到一座山"，两者都不存在）：
1. addElement(type: "character", name: "段誉", description: "小说人物", keywords: [])
2. addElement(type: "location", name: "一座山", description: "地点", keywords: [])
3. updateElementLocation(elementId: "段誉", location: "一座山")

注意事项：
- 不要等待工具返回结果后再调用下一个工具
- 在同一个响应中一次性调用所有需要的工具
- 在 updateElementLocation 中，可以使用元素名称代替 ID
- 完成分析后，不要返回任何文字说明，只通过工具调用更新状态`;

        // Assistant message with context information
        const assistantMessage = `## 当前故事背景
- 章节: ${analysisContext.chapter ? analysisContext.chapter.title : '未知'}
- 当前所在地: ${analysisContext.currentLocation || '未知'}

## 已存在的元素（不要再创建这些元素）
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
     * Call AI for analysis
     * @param {string} prompt - AI prompt
     * @returns {Promise<Object>} AI response
     */
    async callAIForAnalysis(prompt) {
        try {
            const config = this.configManager.getConfig();
            const messages = [{ role: 'user', content: prompt }];

            const result = await this.aiService.chat(config, messages, null, null);

            if (!result.success) {
                throw new Error(result.error || 'AI service error');
            }

            return result.data;
        } catch (error) {
            console.error('AI analysis failed:', error);
            throw new Error(`AI 分析失败: ${error.message}`);
        }
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
                    // Use getElement instead of getElementById to be consistent with ElementManager API
                    const element = this.elementManager?.getElement(toolCall.arguments.elementId);

                    analysisData.stateChanges.push({
                        elementId: toolCall.arguments.elementId,
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
                        participants: [toolCall.arguments.elementId],
                        location: toolCall.arguments.location
                    });
                }
                break;

            case 'updateElementDescription':
                if (toolCall.arguments && toolCall.result && toolCall.result.changes) {
                    // Use getElement instead of getElementById to be consistent with ElementManager API
                    const element = this.elementManager?.getElement(toolCall.arguments.elementId);

                    analysisData.stateChanges.push({
                        elementId: toolCall.arguments.elementId,
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
     * Process elements from analysis
     * @param {Array} elements - Raw elements from AI
     * @returns {Array} Processed elements
     */
    processElements(elements) {
        if (!Array.isArray(elements)) {
            return [];
        }

        return elements.map(element => {
            // Check if it's a new element or existing
            if (element.id && !element.id.startsWith('NEW:')) {
                // Existing element - get element info from ElementManager
                const existingElement = this.elementManager?.getElementById(element.id);
                return {
                    id: element.id,
                    type: element.type,
                    name: existingElement?.name || element.name || element.id,
                    isNew: false
                };
            } else {
                // New element - mark for creation
                return {
                    temporaryId: element.id || `NEW:${element.name}`,
                    type: element.type,
                    name: element.name,
                    description: element.description,
                    keywords: element.keywords || [],
                    isNew: true
                };
            }
        });
    }

    /**
     * Process events from analysis
     * @param {Array} events - Raw events from AI
     * @returns {Array} Processed events
     */
    processEvents(events) {
        if (!Array.isArray(events)) {
            return [];
        }

        return events.map(event => ({
            description: event.description || '',
            type: this.validateEventType(event.type),
            participants: Array.isArray(event.participants) ? event.participants : [],
            location: event.location || null
        }));
    }

    /**
     * Process state changes from analysis
     * @param {Array} stateChanges - Raw state changes from AI
     * @returns {Array} Processed state changes
     */
    processStateChanges(stateChanges) {
        if (!Array.isArray(stateChanges)) {
            return [];
        }

        return stateChanges.map(change => {
            const elementId = change.elementId || '';
            const element = this.elementManager?.getElementById(elementId);
            const elementName = element?.name || elementId;

            const fromValue = change.from !== undefined ? change.from : 'undefined';
            const toValue = change.to !== undefined ? change.to : 'undefined';
            const property = change.property || 'state';

            return {
                elementId,
                elementName,
                property,
                from: fromValue,
                to: toValue,
                changes: {
                    location: change.changes?.location,
                    description: change.changes?.description,
                    owner: change.changes?.owner,
                    status: change.changes?.status,
                    keywords: Array.isArray(change.changes?.keywords) ? change.changes.keywords : undefined
                }
            };
        });
    }

    /**
     * Validate event type
     * @param {string} type - Event type from AI
     * @returns {string} Validated event type
     */
    validateEventType(type) {
        const validTypes = ['action', 'dialogue', 'discovery', 'conflict', 'emotional', 'state_change'];
        return validTypes.includes(type) ? type : 'action';
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
            return `- ${prefix}: ${el.name} (ID: ${el.id})`;
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
     * Update state change element IDs after creating new elements
     * @param {Array} stateChanges - State changes to update
     * @param {string} temporaryId - Temporary element ID
     * @param {string} newElementId - New element ID
     */
    updateStateChangeElementIds(stateChanges, temporaryId, newElementId) {
        if (!stateChanges) return;

        stateChanges.forEach(change => {
            if (change.elementId === temporaryId) {
                change.elementId = newElementId;
            }
            // Also update to/from values if they reference the temporary ID
            if (change.to === temporaryId) {
                change.to = newElementId;
            }
        });
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

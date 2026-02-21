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
     */
    constructor(story, elementManager, aiService, configManager) {
        this.story = story;
        this.elementManager = elementManager;
        this.aiService = aiService;
        this.configManager = configManager;

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

        // Check cache
        if (this.analysisCache.has(cacheKey)) {
            return this.analysisCache.get(cacheKey);
        }

        // Build analysis context
        const analysisContext = this.buildAnalysisContext(paragraph, context);

        // Generate prompt
        const prompt = this.generateAnalysisPrompt(paragraph, analysisContext);

        // Call AI
        const aiResponse = await this.callAIForAnalysis(prompt);

        // Parse response
        const analysis = this.parseAnalysisResult(aiResponse, paragraph.id);

        // Cache result
        this.analysisCache.set(cacheKey, analysis);

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
     * @returns {string} AI prompt
     */
    generateAnalysisPrompt(paragraph, analysisContext) {
        let prompt = `请分析以下段落内容，提取故事元素、事件和状态变化。

## 段落内容
${paragraph.content}

## 当前故事背景
- 章节: ${analysisContext.chapter ? analysisContext.chapter.title : '未知'}
- 当前所在地: ${analysisContext.currentLocation || '未知'}

## 已存在的元素
${this.formatElementsForPrompt(analysisContext.existingElements)}

## 前几个段落（上下文）
${analysisContext.previousParagraphs.map((p, i) => `${i + 1}. ${p.content}`).join('\n')}

## 分析要求
请严格以 JSON 格式返回分析结果（不要包含任何其他文字），包含以下字段：

1. **elements**: 段落中提到或新增的故事元素数组
   - 对于已存在的元素，返回: {"id": "existing_id", "type": "character"}
   - 对于新元素，返回: {"id": "NEW:元素名称", "type": "character", "name": "元素名称", "description": "描述", "keywords": []}
   - 类型包括: character(人物), item(道具), location(地点), memory(记忆), base(基础设定)

2. **events**: 段落中发生的事件数组
   - 每个事件: {"description": "事件描述", "type": "action", "participants": [], "location": null}
   - type: action, dialogue, discovery, conflict, emotional, state_change

3. **stateChanges**: 元素状态变化数组
   - 每个变化: {"elementId": "元素ID", "property": "location", "from": "旧值", "to": "新值"}
   - property 可以是: location, description, owner, status, keywords

示例返回格式：
\`\`\`json
{
  "elements": [
    {"id": "char_1", "type": "character"},
    {"id": "NEW:山", "type": "location", "name": "山", "description": "一座山", "keywords": ["山", "山峰"]}
  ],
  "events": [
    {"description": "角色到达目的地", "type": "action", "participants": ["char_1"], "location": "NEW:山"}
  ],
  "stateChanges": [
    {"elementId": "char_1", "property": "location", "from": "在路上", "to": "NEW:山"}
  ]
}
\`\`\`

重要：只返回 JSON 代码，不要添加任何解释性文字。`;

        return prompt;
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

            const result = await this.aiService.chat(config, messages);

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
     * Parse AI analysis result
     * @param {Object} aiResponse - AI response
     * @param {string} paragraphId - Paragraph ID
     * @returns {Object} Parsed analysis
     */
    parseAnalysisResult(aiResponse, paragraphId) {
        try {
            // Extract JSON from AI response
            let jsonContent = aiResponse.content;

            // Try to extract JSON from markdown code blocks
            const jsonMatch = jsonContent.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                jsonContent = jsonMatch[1];
            }

            const analysisData = JSON.parse(jsonContent);

            return {
                paragraphId: paragraphId,
                timestamp: new Date().toISOString(),
                elements: this.processElements(analysisData.elements),
                events: this.processEvents(analysisData.events),
                stateChanges: this.processStateChanges(analysisData.stateChanges),
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

        // Create new elements
        for (const element of analysis.elements) {
            if (element.isNew) {
                try {
                    if (!this.elementManager) {
                        throw new Error('ElementManager not initialized');
                    }
                    const newElement = await this.elementManager.addElement({
                        type: element.type,
                        name: element.name,
                        description: element.description,
                        keywords: element.keywords
                    });

                    result.createdElements.push({
                        temporaryId: element.temporaryId,
                        elementId: newElement.id,
                        name: newElement.name
                    });

                    // Update stateChanges to use new elementId
                    this.updateStateChangeElementIds(
                        analysis.stateChanges,
                        element.temporaryId,
                        newElement.id
                    );
                } catch (error) {
                    result.errors.push({
                        type: 'createElement',
                        element: element.temporaryId,
                        error: error.message
                    });
                }
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

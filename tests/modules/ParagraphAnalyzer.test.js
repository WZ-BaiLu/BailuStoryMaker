/**
 * Unit tests for ParagraphAnalyzer module
 */

const ParagraphAnalyzer = require('../../js/modules/ParagraphAnalyzer');
const ElementManager = require('../../js/managers/ElementManager');

// Mock dependencies
jest.mock('../../js/managers/ElementManager');

describe('ParagraphAnalyzer', () => {
    let mockStory;
    let mockElementManager;
    let mockAIService;
    let paragraphAnalyzer;

    beforeEach(() => {
        // Mock story data
        mockStory = {
            id: 'story-1',
            chapters: [
                {
                    id: 'chapter-1',
                    title: '第一章',
                    paragraphs: [
                        {
                            id: 'paragraph-1-1',
                            content: '这是第一个段落。',
                            createdAt: '2024-01-01T00:00:00.000Z'
                        },
                        {
                            id: 'paragraph-1-2',
                            content: '这是第二个段落。',
                            createdAt: '2024-01-01T00:01:00.000Z'
                        },
                        {
                            id: 'paragraph-1-3',
                            content: '李明走进房间，看到了桌上的宝剑。',
                            createdAt: '2024-01-01T00:02:00.000Z'
                        }
                    ]
                }
            ]
        };

        // Mock element manager
        mockElementManager = {
            listElements: jest.fn(() => [
                {
                    id: 'character-1',
                    type: 'character',
                    name: '李明',
                    description: '主角',
                    keywords: ['人物', '李明']
                }
            ]),
            addElement: jest.fn((elementData) => {
                return {
                    id: `new-${elementData.type}-1`,
                    ...elementData
                };
            })
        };

        // Mock AI service
        mockAIService = {
            getConfig: jest.fn(() => ({
                model: 'gpt-4',
                apiKey: 'test-key'
            })),
            sendMessage: jest.fn()
        };

        // Create analyzer instance
        paragraphAnalyzer = new ParagraphAnalyzer(
            mockStory,
            mockElementManager,
            mockAIService
        );
    });

    describe('constructor', () => {
        it('should initialize with correct dependencies', () => {
            expect(paragraphAnalyzer.story).toBe(mockStory);
            expect(paragraphAnalyzer.elementManager).toBe(mockElementManager);
            expect(paragraphAnalyzer.aiService).toBe(mockAIService);
            expect(paragraphAnalyzer.analysisCache).toBeInstanceOf(Map);
        });
    });

    describe('buildAnalysisContext', () => {
        it('should build correct analysis context', () => {
            const paragraph = mockStory.chapters[0].paragraphs[2];
            const context = {
                chapterId: 'chapter-1'
            };

            const result = paragraphAnalyzer.buildAnalysisContext(paragraph, context);

            expect(result.paragraph).toBe(paragraph);
            expect(result.chapter).toBe(mockStory.chapters[0]);
            expect(result.previousParagraphs).toHaveLength(2);
            expect(result.existingElements).toEqual(
                mockElementManager.listElements()
            );
        });

        it('should handle missing chapter', () => {
            const paragraph = { id: 'test-p', content: 'Test' };
            const context = { chapterId: 'invalid-chapter' };

            const result = paragraphAnalyzer.buildAnalysisContext(paragraph, context);

            expect(result.chapter).toBeNull();
            expect(result.previousParagraphs).toEqual([]);
        });
    });

    describe('generateAnalysisPrompt', () => {
        it('should generate prompt with paragraph content', () => {
            const paragraph = mockStory.chapters[0].paragraphs[2];
            const analysisContext = paragraphAnalyzer.buildAnalysisContext(
                paragraph,
                { chapterId: 'chapter-1' }
            );

            const prompt = paragraphAnalyzer.generateAnalysisPrompt(
                paragraph,
                analysisContext
            );

            expect(prompt).toContain('李明走进房间，看到了桌上的宝剑。');
            expect(prompt).toContain('第一章');
            expect(prompt).toContain('分析要求');
            expect(prompt).toContain('elements');
            expect(prompt).toContain('events');
            expect(prompt).toContain('stateChanges');
        });
    });

    describe('formatElementsForPrompt', () => {
        it('should format elements correctly', () => {
            const elements = [
                {
                    id: 'char-1',
                    type: 'character',
                    name: '李明',
                    description: '主角'
                },
                {
                    id: 'item-1',
                    type: 'item',
                    name: '宝剑',
                    description: '一把锋利的剑'
                }
            ];

            const result = paragraphAnalyzer.formatElementsForPrompt(elements);

            expect(result).toContain('CHARACTER');
            expect(result).toContain('ITEM');
            expect(result).toContain('李明');
            expect(result).toContain('宝剑');
            expect(result).toContain('ID: char-1');
            expect(result).toContain('ID: item-1');
        });

        it('should handle empty elements', () => {
            const result = paragraphAnalyzer.formatElementsForPrompt([]);
            expect(result).toBe('暂无元素');
        });

        it('should handle null elements', () => {
            const result = paragraphAnalyzer.formatElementsForPrompt(null);
            expect(result).toBe('暂无元素');
        });
    });

    describe('processElements', () => {
        it('should process existing elements correctly', () => {
            const elements = [
                {
                    id: 'character-1',
                    type: 'character',
                    name: '李明'
                }
            ];

            const result = paragraphAnalyzer.processElements(elements);

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('character-1');
            expect(result[0].type).toBe('character');
            expect(result[0].isNew).toBe(false);
        });

        it('should process new elements correctly', () => {
            const elements = [
                {
                    id: 'NEW:character',
                    type: 'character',
                    name: '王强',
                    description: '新角色',
                    keywords: ['人物', '王强']
                }
            ];

            const result = paragraphAnalyzer.processElements(elements);

            expect(result).toHaveLength(1);
            expect(result[0].temporaryId).toBe('NEW:character');
            expect(result[0].type).toBe('character');
            expect(result[0].name).toBe('王强');
            expect(result[0].description).toBe('新角色');
            expect(result[0].isNew).toBe(true);
        });

        it('should handle invalid input', () => {
            const result = paragraphAnalyzer.processElements(null);
            expect(result).toEqual([]);
        });
    });

    describe('processEvents', () => {
        it('should process events correctly', () => {
            const events = [
                {
                    description: '李明拿起宝剑',
                    type: 'action',
                    participants: ['character-1'],
                    location: 'room-1'
                },
                {
                    description: '李明说：我找到了。',
                    type: 'dialogue',
                    participants: ['character-1']
                }
            ];

            const result = paragraphAnalyzer.processEvents(events);

            expect(result).toHaveLength(2);
            expect(result[0].description).toBe('李明拿起宝剑');
            expect(result[0].type).toBe('action');
            expect(result[0].participants).toEqual(['character-1']);
            expect(result[0].location).toBe('room-1');
            expect(result[1].type).toBe('dialogue');
        });

        it('should validate event types', () => {
            const events = [
                {
                    description: '测试事件',
                    type: 'invalid_type'
                }
            ];

            const result = paragraphAnalyzer.processEvents(events);

            expect(result[0].type).toBe('action');
        });

        it('should handle invalid input', () => {
            const result = paragraphAnalyzer.processEvents(null);
            expect(result).toEqual([]);
        });
    });

    describe('processStateChanges', () => {
        it('should process state changes correctly', () => {
            const stateChanges = [
                {
                    elementId: 'item-1',
                    changes: {
                        location: 'character-1',
                        owner: 'character-1',
                        status: '已获取'
                    }
                }
            ];

            const result = paragraphAnalyzer.processStateChanges(stateChanges);

            expect(result).toHaveLength(1);
            expect(result[0].elementId).toBe('item-1');
            expect(result[0].changes.location).toBe('character-1');
            expect(result[0].changes.owner).toBe('character-1');
            expect(result[0].changes.status).toBe('已获取');
        });

        it('should handle invalid input', () => {
            const result = paragraphAnalyzer.processStateChanges(null);
            expect(result).toEqual([]);
        });
    });

    describe('validateEventType', () => {
        it('should accept valid event types', () => {
            const validTypes = ['action', 'dialogue', 'discovery', 'conflict', 'emotional', 'state_change'];

            validTypes.forEach(type => {
                const result = paragraphAnalyzer.validateEventType(type);
                expect(result).toBe(type);
            });
        });

        it('should default to action for invalid types', () => {
            const result = paragraphAnalyzer.validateEventType('invalid_type');
            expect(result).toBe('action');
        });
    });

    describe('getChapter', () => {
        it('should return correct chapter', () => {
            const chapter = paragraphAnalyzer.getChapter('chapter-1');
            expect(chapter).toBe(mockStory.chapters[0]);
        });

        it('should return null for invalid chapter ID', () => {
            const chapter = paragraphAnalyzer.getChapter('invalid-chapter');
            expect(chapter).toBeNull();
        });

        it('should handle missing story', () => {
            paragraphAnalyzer.story = null;
            const chapter = paragraphAnalyzer.getChapter('chapter-1');
            expect(chapter).toBeNull();
        });
    });

    describe('getPreviousParagraphs', () => {
        it('should return previous paragraphs', () => {
            const paragraph = mockStory.chapters[0].paragraphs[2];
            const chapter = mockStory.chapters[0];

            const result = paragraphAnalyzer.getPreviousParagraphs(paragraph, chapter);

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('paragraph-1-1');
            expect(result[1].id).toBe('paragraph-1-2');
        });

        it('should return empty array for first paragraph', () => {
            const paragraph = mockStory.chapters[0].paragraphs[0];
            const chapter = mockStory.chapters[0];

            const result = paragraphAnalyzer.getPreviousParagraphs(paragraph, chapter);

            expect(result).toEqual([]);
        });
    });

    describe('caching', () => {
        it('should cache analysis results', () => {
            const paragraph = mockStory.chapters[0].paragraphs[0];
            const cacheKey = paragraphAnalyzer.getCacheKey(paragraph.id);

            paragraphAnalyzer.analysisCache.set(cacheKey, { cached: true });
            const cached = paragraphAnalyzer.analysisCache.get(cacheKey);

            expect(cached).toEqual({ cached: true });
        });

        it('should generate correct cache keys', () => {
            const key1 = paragraphAnalyzer.getCacheKey('paragraph-1-1');
            const key2 = paragraphAnalyzer.getCacheKey('paragraph-1-2');

            expect(key1).toBe('paragraph-analysis-paragraph-1-1');
            expect(key2).toBe('paragraph-analysis-paragraph-1-2');
            expect(key1).not.toBe(key2);
        });

        it('should clear cache', () => {
            paragraphAnalyzer.analysisCache.set('test-key', { data: 'test' });
            paragraphAnalyzer.clearCache();

            expect(paragraphAnalyzer.analysisCache.size).toBe(0);
        });

        it('should invalidate specific cache entry', () => {
            paragraphAnalyzer.analysisCache.set('paragraph-analysis-p1', { data: 'test' });
            paragraphAnalyzer.invalidateCache('p1');

            expect(paragraphAnalyzer.analysisCache.has('paragraph-analysis-p1')).toBe(false);
        });
    });

    describe('parseAnalysisResult', () => {
        it('should parse valid AI response', () => {
            const aiResponse = {
                content: JSON.stringify({
                    elements: [
                        {
                            id: 'character-1',
                            type: 'character'
                        }
                    ],
                    events: [
                        {
                            description: '测试事件',
                            type: 'action'
                        }
                    ],
                    stateChanges: []
                })
            };

            const result = paragraphAnalyzer.parseAnalysisResult(aiResponse, 'p1');

            expect(result.paragraphId).toBe('p1');
            expect(result.elements).toHaveLength(1);
            expect(result.events).toHaveLength(1);
            expect(result.error).toBeUndefined();
        });

        it('should extract JSON from markdown code blocks', () => {
            const aiResponse = {
                content: '```json\n{"elements": [], "events": [], "stateChanges": []}\n```'
            };

            const result = paragraphAnalyzer.parseAnalysisResult(aiResponse, 'p1');

            expect(result.elements).toEqual([]);
            expect(result.events).toEqual([]);
            expect(result.stateChanges).toEqual([]);
        });

        it('should handle invalid JSON', () => {
            const aiResponse = {
                content: 'invalid json'
            };

            const result = paragraphAnalyzer.parseAnalysisResult(aiResponse, 'p1');

            expect(result.error).toBeDefined();
            expect(result.elements).toEqual([]);
        });
    });

    describe('findParagraph', () => {
        it('should find paragraph in story', () => {
            const paragraph = paragraphAnalyzer.findParagraph('paragraph-1-2');

            expect(paragraph).toBeDefined();
            expect(paragraph.id).toBe('paragraph-1-2');
        });

        it('should return null for invalid paragraph ID', () => {
            const paragraph = paragraphAnalyzer.findParagraph('invalid-id');
            expect(paragraph).toBeNull();
        });
    });

    describe('applyAnalysis integration', () => {
        it('should apply analysis with new elements', async () => {
            const analysis = {
                paragraphId: 'paragraph-1-3',
                elements: [
                    {
                        temporaryId: 'NEW:item',
                        type: 'item',
                        name: '宝剑',
                        description: '一把锋利的剑',
                        keywords: ['道具', '宝剑'],
                        isNew: true
                    }
                ],
                events: [],
                stateChanges: [
                    {
                        elementId: 'NEW:item',
                        changes: {
                            location: 'character-1',
                            owner: 'character-1'
                        }
                    }
                ]
            };

            mockElementManager.addElement.mockResolvedValue({
                id: 'item-1',
                name: '宝剑',
                type: 'item'
            });

            const result = await paragraphAnalyzer.applyAnalysis(
                analysis,
                'paragraph-1-3'
            );

            expect(result.createdElements).toHaveLength(1);
            expect(result.createdElements[0].temporaryId).toBe('NEW:item');
            expect(result.createdElements[0].elementId).toBe('item-1');
            expect(mockElementManager.addElement).toHaveBeenCalled();
        });

        it('should apply analysis with existing elements only', async () => {
            const analysis = {
                paragraphId: 'paragraph-1-3',
                elements: [
                    {
                        id: 'character-1',
                        type: 'character',
                        isNew: false
                    }
                ],
                events: [],
                stateChanges: [
                    {
                        elementId: 'character-1',
                        changes: {
                            location: 'room-1'
                        }
                    }
                ]
            };

            const result = await paragraphAnalyzer.applyAnalysis(
                analysis,
                'paragraph-1-3'
            );

            expect(result.createdElements).toHaveLength(0);
            expect(result.updatedElements).toBe(1);
            expect(mockElementManager.addElement).not.toHaveBeenCalled();
        });
    });

    describe('updateStateChangeElementIds', () => {
        it('should update element IDs in state changes', () => {
            const stateChanges = [
                {
                    elementId: 'NEW:item',
                    changes: { location: 'character-1' }
                },
                {
                    elementId: 'character-1',
                    changes: { location: 'room-1' }
                }
            ];

            paragraphAnalyzer.updateStateChangeElementIds(
                stateChanges,
                'NEW:item',
                'item-1'
            );

            expect(stateChanges[0].elementId).toBe('item-1');
            expect(stateChanges[1].elementId).toBe('character-1');
        });
    });
});

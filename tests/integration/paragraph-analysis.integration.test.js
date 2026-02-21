/**
 * End-to-End Integration Test for Paragraph Analysis Feature
 *
 * This test verifies the complete workflow of paragraph analysis:
 * 1. Analyze paragraph text
 * 2. Extract elements, events, and state changes
 * 3. Apply analysis results to story
 */

const ParagraphAnalyzer = require('../../js/modules/ParagraphAnalyzer');

// Mock dependencies
class MockElementManager {
    constructor() {
        this.elements = [];
        this.nextId = 1;
    }

    listElements() {
        return this.elements;
    }

    addElement(elementData) {
        const newElement = {
            id: `element-${this.nextId++}`,
            type: elementData.type,
            name: elementData.name,
            description: elementData.description,
            keywords: elementData.keywords || [],
            location: null,
            stateHistory: []
        };
        this.elements.push(newElement);
        return newElement;
    }
}

class MockAIService {
    constructor() {
        this.getResponseCount = 0;
    }

    getConfig() {
        return {
            model: 'gpt-4',
            apiKey: 'test-key'
        };
    }

    async sendMessage({ content }) {
        this.getResponseCount++;

        // Simulate AI analysis response
        const mockResponse = {
            content: JSON.stringify({
                elements: [
                    {
                        id: 'character-1',
                        type: 'character'
                    },
                    {
                        id: 'NEW:item',
                        type: 'item',
                        name: '宝剑',
                        description: '一把锋利的剑',
                        keywords: ['道具', '宝剑']
                    }
                ],
                events: [
                    {
                        description: '李明拿起宝剑',
                        type: 'action',
                        participants: ['character-1'],
                        location: 'room-1'
                    }
                ],
                stateChanges: [
                    {
                        elementId: 'character-1',
                        changes: {
                            location: 'room-1'
                        }
                    },
                    {
                        elementId: 'NEW:item',
                        changes: {
                            owner: 'character-1',
                            location: 'character-1'
                        }
                    }
                ]
            })
        };

        return mockResponse;
    }
}

describe('Paragraph Analysis - End-to-End Integration', () => {
    let mockStory;
    let mockElementManager;
    let mockAIService;
    let paragraphAnalyzer;

    beforeEach(() => {
        // Setup mock story
        mockStory = {
            id: 'story-1',
            chapters: [
                {
                    id: 'chapter-1',
                    title: '第一章',
                    paragraphs: [
                        {
                            id: 'paragraph-1-1',
                            content: '李明走进房间，看到了桌上的宝剑。他拿起宝剑，发现它很锋利。',
                            createdAt: '2024-01-01T00:00:00.000Z',
                            changes: { elements: [] }
                        }
                    ]
                }
            ]
        };

        // Initialize mocks
        mockElementManager = new MockElementManager();
        mockAIService = new MockAIService();

        // Add existing element
        mockElementManager.elements.push({
            id: 'character-1',
            type: 'character',
            name: '李明',
            description: '主角',
            keywords: ['人物', '李明'],
            location: null,
            stateHistory: []
        });

        // Create analyzer
        paragraphAnalyzer = new ParagraphAnalyzer(
            mockStory,
            mockElementManager,
            mockAIService
        );
    });

    describe('Complete Analysis Workflow', () => {
        it('should analyze paragraph and extract elements', async () => {
            const paragraph = mockStory.chapters[0].paragraphs[0];
            const context = {
                chapterId: 'chapter-1'
            };

            // Step 1: Analyze paragraph
            const analysis = await paragraphAnalyzer.analyzeParagraph(paragraph, context);

            expect(analysis).toBeDefined();
            expect(analysis.paragraphId).toBe('paragraph-1-1');
            expect(analysis.elements).toHaveLength(2);
            expect(analysis.events).toHaveLength(1);
            expect(analysis.stateChanges).toHaveLength(2);

            // Step 2: Verify elements
            const existingElement = analysis.elements.find(e => !e.isNew);
            const newElement = analysis.elements.find(e => e.isNew);

            expect(existingElement).toBeDefined();
            expect(existingElement.id).toBe('character-1');
            expect(existingElement.type).toBe('character');

            expect(newElement).toBeDefined();
            expect(newElement.temporaryId).toBe('NEW:item');
            expect(newElement.type).toBe('item');
            expect(newElement.name).toBe('宝剑');
        });

        it('should analyze paragraph and extract events', async () => {
            const paragraph = mockStory.chapters[0].paragraphs[0];
            const context = {
                chapterId: 'chapter-1'
            };

            const analysis = await paragraphAnalyzer.analyzeParagraph(paragraph, context);

            expect(analysis.events).toBeDefined();
            expect(analysis.events).toHaveLength(1);

            const event = analysis.events[0];
            expect(event.description).toBe('李明拿起宝剑');
            expect(event.type).toBe('action');
            expect(event.participants).toContain('character-1');
            expect(event.location).toBe('room-1');
        });

        it('should analyze paragraph and extract state changes', async () => {
            const paragraph = mockStory.chapters[0].paragraphs[0];
            const context = {
                chapterId: 'chapter-1'
            };

            const analysis = await paragraphAnalyzer.analyzeParagraph(paragraph, context);

            expect(analysis.stateChanges).toBeDefined();
            expect(analysis.stateChanges).toHaveLength(2);

            const characterChange = analysis.stateChanges.find(sc => sc.elementId === 'character-1');
            const itemChange = analysis.stateChanges.find(sc => sc.elementId === 'NEW:item');

            expect(characterChange).toBeDefined();
            expect(characterChange.changes.location).toBe('room-1');

            expect(itemChange).toBeDefined();
            expect(itemChange.changes.owner).toBe('character-1');
            expect(itemChange.changes.location).toBe('character-1');
        });
    });

    describe('Apply Analysis Results', () => {
        it('should apply analysis and create new element', async () => {
            const paragraph = mockStory.chapters[0].paragraphs[0];
            const context = { chapterId: 'chapter-1' };

            // Analyze
            const analysis = await paragraphAnalyzer.analyzeParagraph(paragraph, context);

            // Apply
            const result = await paragraphAnalyzer.applyAnalysis(analysis, paragraph.id);

            expect(result).toBeDefined();
            expect(result.paragraphId).toBe('paragraph-1-1');
            expect(result.createdElements).toHaveLength(1);
            expect(result.updatedElements).toBe(2);

            const createdElement = result.createdElements[0];
            expect(createdElement.temporaryId).toBe('NEW:item');
            expect(createdElement.elementId).toMatch(/^element-\d+$/);
            expect(createdElement.name).toBe('宝剑');

            // Verify element was actually created
            expect(mockElementManager.elements).toHaveLength(2);
            const newElement = mockElementManager.elements.find(e => e.name === '宝剑');
            expect(newElement).toBeDefined();
        });

        it('should apply analysis and update paragraph changes', async () => {
            const paragraph = mockStory.chapters[0].paragraphs[0];
            const context = { chapterId: 'chapter-1' };

            // Analyze
            const analysis = await paragraphAnalyzer.analyzeParagraph(paragraph, context);

            // Apply
            await paragraphAnalyzer.applyAnalysis(analysis, paragraph.id);

            // Verify paragraph changes were updated
            expect(paragraph.changes).toBeDefined();
            expect(paragraph.changes.elements).toBeDefined();
            expect(paragraph.changes.elements.length).toBeGreaterThan(0);

            // Find the state change for character
            const characterChange = paragraph.changes.elements.find(sc =>
                sc.elementId === 'character-1'
            );
            expect(characterChange).toBeDefined();
            expect(characterChange.changes.location).toBe('room-1');
        });
    });

    describe('Caching', () => {
        it('should use cache for repeated analysis', async () => {
            const paragraph = mockStory.chapters[0].paragraphs[0];
            const context = { chapterId: 'chapter-1' };

            // First analysis
            const firstCallCount = mockAIService.getResponseCount;
            await paragraphAnalyzer.analyzeParagraph(paragraph, context);

            // Second analysis (should use cache)
            await paragraphAnalyzer.analyzeParagraph(paragraph, context);

            // AI should only be called once
            expect(mockAIService.getResponseCount).toBe(firstCallCount + 1);
        });

        it('should invalidate cache on demand', async () => {
            const paragraph = mockStory.chapters[0].paragraphs[0];
            const context = { chapterId: 'chapter-1' };

            // First analysis
            await paragraphAnalyzer.analyzeParagraph(paragraph, context);
            const firstCallCount = mockAIService.getResponseCount;

            // Invalidate cache
            paragraphAnalyzer.invalidateCache(paragraph.id);

            // Second analysis (should not use cache)
            await paragraphAnalyzer.analyzeParagraph(paragraph, context);

            // AI should be called again
            expect(mockAIService.getResponseCount).toBe(firstCallCount + 1);
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid paragraph ID gracefully', async () => {
            const invalidParagraph = { id: 'invalid-id', content: 'Test' };
            const context = { chapterId: 'chapter-1' };

            const analysis = await paragraphAnalyzer.analyzeParagraph(invalidParagraph, context);

            // Should still return analysis result
            expect(analysis).toBeDefined();
            expect(analysis.paragraphId).toBe('invalid-id');
        });

        it('should handle missing chapter gracefully', async () => {
            const paragraph = mockStory.chapters[0].paragraphs[0];
            const context = { chapterId: 'non-existent-chapter' };

            const analysis = await paragraphAnalyzer.analyzeParagraph(paragraph, context);

            // Should still return analysis result
            expect(analysis).toBeDefined();
            expect(analysis.paragraphId).toBe('paragraph-1-1');
        });
    });

    describe('Complete Integration Workflow', () => {
        it('should complete full workflow: analyze -> review -> apply', async () => {
            const paragraph = mockStory.chapters[0].paragraphs[0];
            const context = { chapterId: 'chapter-1' };

            // Step 1: Analyze
            const analysis = await paragraphAnalyzer.analyzeParagraph(paragraph, context);
            expect(analysis.error).toBeUndefined();

            // Step 2: Review (simulated)
            // In real scenario, user would review and potentially modify analysis
            const hasNewElements = analysis.elements.some(e => e.isNew);
            const hasEvents = analysis.events.length > 0;
            const hasStateChanges = analysis.stateChanges.length > 0;

            expect(hasNewElements).toBe(true);
            expect(hasEvents).toBe(true);
            expect(hasStateChanges).toBe(true);

            // Step 3: Apply
            const result = await paragraphAnalyzer.applyAnalysis(analysis, paragraph.id);
            expect(result.errors).toHaveLength(0);
            expect(result.createdElements.length).toBeGreaterThan(0);

            // Verify final state
            expect(mockElementManager.elements.length).toBe(2);
            expect(paragraph.changes.elements.length).toBeGreaterThan(0);
        });
    });
});

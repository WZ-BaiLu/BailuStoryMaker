/**
 * Unit Tests for AIPreviewManager
 *
 * Tests AI preview and confirmation workflow
 */

const ElementManager = require('../../js/managers/ElementManager');
const AIPreviewManager = require('../../js/managers/AIPreviewManager');

describe('AIPreviewManager', () => {
    let elementManager;
    let aiPreviewManager;
    let mockStory;

    beforeEach(() => {
        mockStory = {
            id: 'story-1',
            title: 'Test Story',
            elements: [],
            chapters: [
                {
                    id: 'chapter-1',
                    order: 1,
                    title: 'Chapter 1',
                    paragraphs: []
                }
            ]
        };

        elementManager = new ElementManager(mockStory);
        aiPreviewManager = new AIPreviewManager(elementManager, mockStory);
    });

    afterEach(() => {
        mockStory = null;
        elementManager = null;
        aiPreviewManager = null;
    });

    describe('constructor', () => {
        test('should initialize with elementManager and story', () => {
            expect(aiPreviewManager).toBeDefined();
            expect(aiPreviewManager.elementManager).toBe(elementManager);
            expect(aiPreviewManager.story).toBe(mockStory);
        });

        test('should initialize with null current suggestion', () => {
            expect(aiPreviewManager.currentSuggestion).toBeNull();
        });

        test('should initialize with empty suggestions history', () => {
            expect(Array.isArray(aiPreviewManager.suggestionsHistory)).toBe(true);
            expect(aiPreviewManager.suggestionsHistory.length).toBe(0);
        });
    });

    describe('generateParagraph', () => {
        test('should generate paragraph suggestion', () => {
            const suggestion = aiPreviewManager.generateParagraph({
                content: 'Test paragraph content',
                chapterId: 'chapter-1'
            });

            expect(suggestion).toBeDefined();
            expect(suggestion.content).toBe('Test paragraph content');
            expect(suggestion.chapterId).toBe('chapter-1');
        });

        test('should include element changes in suggestion', () => {
            const suggestion = aiPreviewManager.generateParagraph({
                content: 'Test content',
                elementChanges: [
                    { elementId: 'test-1', changes: { location: 'location-1' } }
                ]
            });

            expect(suggestion.elementChanges).toBeDefined();
            expect(suggestion.elementChanges.length).toBe(1);
        });

        test('should include storyTimestamp if provided', () => {
            const suggestion = aiPreviewManager.generateParagraph({
                content: 'Test content',
                storyTimestamp: {
                    chapterId: 'chapter-1',
                    sequence: 1,
                    narrativeType: 'linear'
                }
            });

            expect(suggestion.storyTimestamp).toBeDefined();
        });

        test('should set suggestion status to pending', () => {
            const suggestion = aiPreviewManager.generateParagraph({
                content: 'Test content',
                chapterId: 'chapter-1'
            });

            expect(suggestion.status).toBe('pending');
        });
    });

    describe('showPreview', () => {
        test('should set current suggestion', () => {
            const suggestion = aiPreviewManager.generateParagraph({
                content: 'Test content',
                chapterId: 'chapter-1'
            });

            aiPreviewManager.showPreview(suggestion);

            expect(aiPreviewManager.currentSuggestion).toEqual(suggestion);
        });

        test('should add to suggestions history', () => {
            const suggestion = aiPreviewManager.generateParagraph({
                content: 'Test content',
                chapterId: 'chapter-1'
            });

            aiPreviewManager.showPreview(suggestion);

            expect(aiPreviewManager.suggestionsHistory.length).toBe(1);
            expect(aiPreviewManager.suggestionsHistory[0]).toEqual(suggestion);
        });

        test('should limit history size', () => {
            const maxHistory = 10;
            // Generate many suggestions
            for (let i = 0; i < maxHistory + 5; i++) {
                const suggestion = aiPreviewManager.generateParagraph({
                    content: `Content ${i}`,
                    chapterId: 'chapter-1'
                });
                aiPreviewManager.showPreview(suggestion);
            }

            expect(aiPreviewManager.suggestionsHistory.length).toBeLessThanOrEqual(maxHistory);
        });
    });

    describe('applyChanges', () => {
        test('should apply paragraph to story', () => {
            const suggestion = aiPreviewManager.generateParagraph({
                content: 'Test paragraph',
                chapterId: 'chapter-1'
            });

            aiPreviewManager.showPreview(suggestion);
            const result = aiPreviewManager.applyChanges();

            expect(result.success).toBe(true);
        });

        test('should clear current suggestion after apply', () => {
            const suggestion = aiPreviewManager.generateParagraph({
                content: 'Test content',
                chapterId: 'chapter-1'
            });

            aiPreviewManager.showPreview(suggestion);
            aiPreviewManager.applyChanges();

            expect(aiPreviewManager.currentSuggestion).toBeNull();
        });

        test('should return error when no current suggestion', () => {
            const result = aiPreviewManager.applyChanges();

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('rejectChanges', () => {
        test('should clear current suggestion', () => {
            const suggestion = aiPreviewManager.generateParagraph({
                content: 'Test content',
                chapterId: 'chapter-1'
            });

            aiPreviewManager.showPreview(suggestion);
            aiPreviewManager.rejectChanges();

            expect(aiPreviewManager.currentSuggestion).toBeNull();
        });

        test('should not modify story', () => {
            const initialParagraphCount = mockStory.chapters[0].paragraphs.length;

            const suggestion = aiPreviewManager.generateParagraph({
                content: 'Test content',
                chapterId: 'chapter-1'
            });

            aiPreviewManager.showPreview(suggestion);
            aiPreviewManager.rejectChanges();

            expect(mockStory.chapters[0].paragraphs.length).toBe(initialParagraphCount);
        });
    });

    describe('getCurrentSuggestion', () => {
        test('should return current suggestion', () => {
            const suggestion = aiPreviewManager.generateParagraph({
                content: 'Test content',
                chapterId: 'chapter-1'
            });

            aiPreviewManager.showPreview(suggestion);
            const current = aiPreviewManager.getCurrentSuggestion();

            expect(current).toEqual(suggestion);
        });

        test('should return null when no suggestion', () => {
            const current = aiPreviewManager.getCurrentSuggestion();
            expect(current).toBeNull();
        });
    });

    describe('getSuggestionHistory', () => {
        test('should return suggestions history', () => {
            const suggestion = aiPreviewManager.generateParagraph({
                content: 'Test content',
                chapterId: 'chapter-1'
            });

            aiPreviewManager.showPreview(suggestion);
            const history = aiPreviewManager.getSuggestionHistory();

            expect(Array.isArray(history)).toBe(true);
            expect(history.length).toBe(1);
        });

        test('should return empty array when no history', () => {
            const history = aiPreviewManager.getSuggestionHistory();
            expect(history).toEqual([]);
        });
    });
});

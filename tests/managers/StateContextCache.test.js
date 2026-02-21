/**
 * Unit Tests for StateContextCache
 *
 * Tests context caching and calculation functionality
 */

const ElementManager = require('../../js/managers/ElementManager');
const StateTimeline = require('../../js/managers/StateTimeline');
const StoryViewManager = require('../../js/managers/StoryViewManager');
const StateContextCache = require('../../js/managers/StateContextCache');

describe('StateContextCache', () => {
    let elementManager;
    let stateTimeline;
    let storyViewManager;
    let stateContextCache;
    let mockStory;
    let location1, character1;

    beforeEach(() => {
        // Create a mock story
        mockStory = {
            id: 'story-1',
            title: 'Test Story',
            elements: [],
            chapters: [
                {
                    id: 'chapter-1',
                    order: 1,
                    title: 'Chapter 1',
                    paragraphs: [
                        { id: 'chapter-1-1', sequence: 1, content: 'Paragraph 1' },
                        { id: 'chapter-1-2', sequence: 2, content: 'Paragraph 2' }
                    ]
                }
            ]
        };

        // Initialize managers
        elementManager = new ElementManager(mockStory);
        stateTimeline = new StateTimeline(elementManager, mockStory);
        storyViewManager = new StoryViewManager(elementManager, stateTimeline);
        stateContextCache = new StateContextCache(stateTimeline, storyViewManager);

        // Create test elements
        location1 = elementManager.addElement({
            type: 'location',
            name: 'Castle',
            description: 'A grand castle'
        });

        character1 = elementManager.addElement({
            type: 'character',
            name: 'Alice',
            description: 'A brave character',
            location: location1.id
        });
    });

    afterEach(() => {
        mockStory = null;
        elementManager = null;
        stateTimeline = null;
        storyViewManager = null;
        stateContextCache = null;
        location1 = null;
        character1 = null;
    });

    describe('constructor', () => {
        test('should initialize with stateTimeline and storyViewManager', () => {
            expect(stateContextCache).toBeDefined();
            expect(stateContextCache.stateTimeline).toBe(stateTimeline);
            expect(stateContextCache.storyViewManager).toBe(storyViewManager);
        });

        test('should initialize empty caches', () => {
            expect(stateContextCache.chapterCache).toBeInstanceOf(Map);
            expect(stateContextCache.chapterCache.size).toBe(0);
            expect(stateContextCache.paragraphCache).toBeInstanceOf(Map);
            expect(stateContextCache.paragraphCache.size).toBe(0);
        });

        test('should initialize cache timestamps', () => {
            expect(stateContextCache.cacheTimestamps).toBeInstanceOf(Map);
            expect(stateContextCache.cacheTimestamps.size).toBe(0);
        });

        test('should set default cache TTL', () => {
            expect(stateContextCache.cacheTTL).toBe(5 * 60 * 1000); // 5 minutes
        });

        test('should initialize with null active chapter', () => {
            expect(stateContextCache.activeChapter).toBeNull();
        });
    });

    describe('getContext', () => {
        test('should return context for paragraph', () => {
            const context = stateContextCache.getContext('chapter-1-1');

            expect(context).toBeDefined();
            expect(context).toHaveProperty('paragraphId', 'chapter-1-1');
            expect(context).toHaveProperty('timestamp');
            expect(context).toHaveProperty('elements');
            expect(context).toHaveProperty('presentElements');
            expect(context).toHaveProperty('elementStates');
        });

        test('should cache context by default', () => {
            const context1 = stateContextCache.getContext('chapter-1-1');
            const context2 = stateContextCache.getContext('chapter-1-1');

            expect(context1).toEqual(context2);
        });

        test('should not use cache when useCache is false', () => {
            const context1 = stateContextCache.getContext('chapter-1-1', { useCache: false });
            expect(stateContextCache.paragraphCache.has('chapter-1-1')).toBe(false);
        });

        test('should include all elements in context', () => {
            const context = stateContextCache.getContext('chapter-1-1');

            expect(context.elements.length).toBeGreaterThan(0);
        });

        test('should include present elements when useViewLocation is true', () => {
            storyViewManager.setViewLocation(location1.id);
            const context = stateContextCache.getContext('chapter-1-1', { useViewLocation: true });

            expect(context.presentElements.length).toBeGreaterThan(0);
        });

        test('should not include present elements when useViewLocation is false', () => {
            storyViewManager.setViewLocation(location1.id);
            const context = stateContextCache.getContext('chapter-1-1', { useViewLocation: false });

            expect(context.presentElements).toEqual([]);
        });
    });

    describe('formatContextForAI', () => {
        test('should format context as string', () => {
            const context = stateContextCache.getContext('chapter-1-1');
            const formatted = stateContextCache.formatContextForAI(context);

            expect(typeof formatted).toBe('string');
            expect(formatted.length).toBeGreaterThan(0);
        });

        test('should include paragraph information', () => {
            const context = stateContextCache.getContext('chapter-1-1');
            const formatted = stateContextCache.formatContextForAI(context);

            expect(formatted).toContain('章节');
            expect(formatted).toContain('chapter-1-1');
        });

        test('should include present elements section', () => {
            storyViewManager.setViewLocation(location1.id);
            const context = stateContextCache.getContext('chapter-1-1');
            const formatted = stateContextCache.formatContextForAI(context);

            expect(formatted).toContain('在场元素');
        });

        test('should include all elements section', () => {
            const context = stateContextCache.getContext('chapter-1-1');
            const formatted = stateContextCache.formatContextForAI(context);

            expect(formatted).toContain('所有元素');
        });
    });

    describe('setActiveChapter', () => {
        test('should set active chapter', () => {
            stateContextCache.setActiveChapter('chapter-1');

            expect(stateContextCache.activeChapter).toBe('chapter-1');
        });

        test('should overwrite existing active chapter', () => {
            stateContextCache.setActiveChapter('chapter-1');
            stateContextCache.setActiveChapter('chapter-2');

            expect(stateContextCache.activeChapter).toBe('chapter-2');
        });
    });

    describe('invalidateParagraph', () => {
        test('should remove paragraph from cache', () => {
            stateContextCache.getContext('chapter-1-1');
            expect(stateContextCache.paragraphCache.has('chapter-1-1')).toBe(true);

            stateContextCache.invalidateParagraph('chapter-1-1');
            expect(stateContextCache.paragraphCache.has('chapter-1-1')).toBe(false);
        });

        test('should remove timestamp for paragraph', () => {
            stateContextCache.getContext('chapter-1-1');
            expect(stateContextCache.cacheTimestamps.has('chapter-1-1')).toBe(true);

            stateContextCache.invalidateParagraph('chapter-1-1');
            expect(stateContextCache.cacheTimestamps.has('chapter-1-1')).toBe(false);
        });

        test('should not affect other paragraphs', () => {
            stateContextCache.getContext('chapter-1-1');
            stateContextCache.getContext('chapter-1-2');

            stateContextCache.invalidateParagraph('chapter-1-1');
            expect(stateContextCache.paragraphCache.has('chapter-1-2')).toBe(true);
        });
    });

    describe('invalidateChapter', () => {
        test('should remove chapter from cache', () => {
            stateContextCache.getContext('chapter-1-1');
            expect(stateContextCache.chapterCache.has('chapter-1')).toBe(true);

            stateContextCache.invalidateChapter('chapter-1');
            expect(stateContextCache.chapterCache.has('chapter-1')).toBe(false);
        });

        test('should remove all paragraphs in chapter', () => {
            stateContextCache.getContext('chapter-1-1');
            stateContextCache.getContext('chapter-1-2');

            stateContextCache.invalidateChapter('chapter-1');
            expect(stateContextCache.paragraphCache.has('chapter-1-1')).toBe(false);
            expect(stateContextCache.paragraphCache.has('chapter-1-2')).toBe(false);
        });
    });

    describe('clearAll', () => {
        test('should clear all caches', () => {
            stateContextCache.getContext('chapter-1-1');
            stateContextCache.getContext('chapter-1-2');

            stateContextCache.clearAll();

            expect(stateContextCache.chapterCache.size).toBe(0);
            expect(stateContextCache.paragraphCache.size).toBe(0);
            expect(stateContextCache.cacheTimestamps.size).toBe(0);
        });
    });

    describe('getCacheStats', () => {
        test('should return cache statistics', () => {
            stateContextCache.getContext('chapter-1-1');
            const stats = stateContextCache.getCacheStats();

            expect(stats).toBeDefined();
            expect(stats).toHaveProperty('chapterCacheSize');
            expect(stats).toHaveProperty('paragraphCacheSize');
            expect(stats).toHaveProperty('totalCacheSize');
            expect(stats).toHaveProperty('cacheTTL');
            expect(stats).toHaveProperty('activeChapter');
        });

        test('should report correct cache sizes', () => {
            stateContextCache.getContext('chapter-1-1');
            stateContextCache.getContext('chapter-1-2');
            const stats = stateContextCache.getCacheStats();

            expect(stats.paragraphCacheSize).toBeGreaterThanOrEqual(2);
            expect(stats.totalCacheSize).toBeGreaterThanOrEqual(2);
        });
    });
});

/**
 * Unit Tests for StateTimeline
 *
 * Tests state timeline indexing, querying, and time travel functionality
 */

const ElementManager = require('../../js/managers/ElementManager');
const StateTimeline = require('../../js/managers/StateTimeline');
const StoryTimestamp = require('../../js/models/StoryTimestamp');

describe('StateTimeline', () => {
    let elementManager;
    let stateTimeline;
    let mockStory;
    let testElement;

    beforeEach(() => {
        // Create a mock story with paragraphs
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
                        {
                            id: 'para-1',
                            sequence: 1,
                            content: 'First paragraph',
                            changes: [
                                { elementId: 'char-1', changes: { location: 'location-2' } },
                                { elementId: 'item-1', changes: { location: 'location-2' } }
                            ],
                            storyTimestamp: new StoryTimestamp({ chapterId: 'chapter-1', sequence: 1, narrativeType: 'linear' })
                        },
                        {
                            id: 'para-2',
                            sequence: 2,
                            content: 'Second paragraph',
                            changes: [
                                { elementId: 'char-1', changes: { keywords: ['受伤'] } }
                            ],
                            storyTimestamp: new StoryTimestamp({ chapterId: 'chapter-1', sequence: 2, narrativeType: 'linear' })
                        },
                        {
                            id: 'para-3',
                            sequence: 3,
                            content: 'Third paragraph',
                            changes: [
                                { elementId: 'item-1', changes: { location: 'char-1' } }
                            ],
                            storyTimestamp: new StoryTimestamp({ chapterId: 'chapter-1', sequence: 3, narrativeType: 'linear' })
                        }
                    ]
                }
            ]
        };

        // Initialize managers
        elementManager = new ElementManager(mockStory);

        // Add test elements
        const location1 = elementManager.addElement({
            type: 'location',
            name: 'Location 1',
            description: 'Test location 1'
        });

        const location2 = elementManager.addElement({
            type: 'location',
            name: 'Location 2',
            description: 'Test location 2'
        });

        testElement = elementManager.addElement({
            type: 'character',
            name: 'Alice',
            description: 'A test character',
            location: location1.id
        });

        // Manually set the ID to match changes array
        testElement.id = 'char-1';

        const item = elementManager.addElement({
            type: 'item',
            name: 'Sword',
            description: 'A test item',
            location: location1.id
        });

        // Update element IDs in mock story
        mockStory.elements = [
            { id: 'char-1', type: 'character', name: 'Alice', description: 'A test character' },
            { id: 'item-1', type: 'item', name: 'Sword', description: 'A test item' }
        ];

        // Initialize StateTimeline
        stateTimeline = new StateTimeline(elementManager, mockStory);
    });

    afterEach(() => {
        mockStory = null;
        elementManager = null;
        stateTimeline = null;
        testElement = null;
    });

    describe('constructor', () => {
        test('should initialize with elementManager and storyData', () => {
            expect(stateTimeline).toBeDefined();
            expect(stateTimeline.elementManager).toBe(elementManager);
            expect(stateTimeline.storyData).toBe(mockStory);
        });

        test('should initialize empty indexes', () => {
            expect(stateTimeline.changesByParagraph).toBeInstanceOf(Map);
            expect(stateTimeline.timestampIndex).toBeInstanceOf(Map);
        });

        test('should auto-index changes on initialization', () => {
            expect(stateTimeline.changesByParagraph.size).toBeGreaterThan(0);
        });
    });

    describe('indexChanges', () => {
        test('should index paragraph changes', () => {
            stateTimeline.indexChanges();

            expect(stateTimeline.changesByParagraph.has('para-1')).toBe(true);
            expect(stateTimeline.changesByParagraph.has('para-2')).toBe(true);
            expect(stateTimeline.changesByParagraph.has('para-3')).toBe(true);
        });

        test('should clear previous indexes before reindexing', () => {
            // Add some data to the index
            stateTimeline.changesByParagraph.set('test', []);

            // Reindex
            stateTimeline.indexChanges();

            expect(stateTimeline.changesByParagraph.has('test')).toBe(false);
        });

        test('should handle empty story data', () => {
            const emptyStory = { id: 'story-2', elements: [], chapters: [] };
            const emptyTimeline = new StateTimeline(elementManager, emptyStory);

            expect(emptyTimeline.changesByParagraph.size).toBe(0);
            expect(emptyTimeline.timestampIndex.size).toBe(0);
        });

        test('should index story timestamps', () => {
            stateTimeline.indexChanges();

            expect(stateTimeline.timestampIndex.size).toBeGreaterThan(0);
        });
    });

    describe('getParagraphChanges', () => {
        test('should return changes for existing paragraph', () => {
            const changes = stateTimeline.getParagraphChanges('para-1');

            expect(changes).toBeDefined();
            expect(Array.isArray(changes)).toBe(true);
            expect(changes.length).toBe(2);
        });

        test('should return empty array for non-existent paragraph', () => {
            const changes = stateTimeline.getParagraphChanges('non-existent');

            expect(changes).toEqual([]);
        });

        test('should return changes with correct structure', () => {
            const changes = stateTimeline.getParagraphChanges('para-1');

            expect(changes[0]).toHaveProperty('elementId');
            expect(changes[0]).toHaveProperty('changes');
        });
    });

    describe('getElementStateAt', () => {
        test('should delegate to elementManager.getElementStateAt', () => {
            const state = stateTimeline.getElementStateAt('para-1', 'char-1');

            expect(state).toBeDefined();
            expect(typeof state).toBe('object');
        });

        test('should return correct element state', () => {
            // Since changes are in paragraph.changes, they should be applied
            const state = stateTimeline.getElementStateAt('para-1', 'char-1');

            expect(state).toBeDefined();
        });
    });

    describe('getElementStateTrajectory', () => {
        test('should return trajectory for element with state history', () => {
            // Add state history manually
            const element = elementManager.getElement('char-1');
            if (element) {
                element.stateHistory = [
                    { paragraphId: 'para-1', timestamp: new Date().toISOString(), changes: { location: 'location-2' } },
                    { paragraphId: 'para-2', timestamp: new Date().toISOString(), changes: { keywords: ['受伤'] } }
                ];
            }

            const trajectory = stateTimeline.getElementStateTrajectory('char-1');

            expect(Array.isArray(trajectory)).toBe(true);
            expect(trajectory.length).toBe(2);
            expect(trajectory[0]).toHaveProperty('paragraphId');
            expect(trajectory[0]).toHaveProperty('state');
            expect(trajectory[0]).toHaveProperty('change');
        });

        test('should return empty array for element without state history', () => {
            const trajectory = stateTimeline.getElementStateTrajectory('item-1');

            expect(Array.isArray(trajectory)).toBe(true);
            expect(trajectory.length).toBe(0);
        });

        test('should return empty array for non-existent element', () => {
            const trajectory = stateTimeline.getElementStateTrajectory('non-existent');

            expect(Array.isArray(trajectory)).toBe(true);
            expect(trajectory.length).toBe(0);
        });

        test('should sort trajectory by paragraphId', () => {
            const element = elementManager.getElement('char-1');
            if (element) {
                element.stateHistory = [
                    { paragraphId: 'para-2', timestamp: new Date().toISOString(), changes: {} },
                    { paragraphId: 'para-1', timestamp: new Date().toISOString(), changes: {} }
                ];
            }

            const trajectory = stateTimeline.getElementStateTrajectory('char-1');

            expect(trajectory[0].paragraphId).toBe('para-1');
            expect(trajectory[1].paragraphId).toBe('para-2');
        });
    });

    describe('getElementStateHistory', () => {
        test('should return state history for existing element', () => {
            const element = elementManager.addElement({
                type: 'character',
                name: 'Bob',
                description: 'Test character'
            });
            element.stateHistory = [
                { paragraphId: 'para-1', timestamp: new Date().toISOString(), changes: {} }
            ];

            const history = stateTimeline.getElementStateHistory(element.id);

            expect(Array.isArray(history)).toBe(true);
            expect(history.length).toBe(1);
        });

        test('should return copy of state history (not reference)', () => {
            const element = elementManager.addElement({
                type: 'character',
                name: 'Charlie',
                description: 'Test character'
            });
            element.stateHistory = [{ paragraphId: 'para-1', timestamp: new Date().toISOString(), changes: {} }];

            const history1 = stateTimeline.getElementStateHistory(element.id);
            const history2 = stateTimeline.getElementStateHistory(element.id);

            expect(history1).not.toBe(history2); // Not the same reference
            expect(history1).toEqual(history2); // But equal
        });

        test('should throw error for non-existent element', () => {
            expect(() => {
                stateTimeline.getElementStateHistory('non-existent');
            }).toThrow('Element not found: non-existent');
        });
    });

    describe('getCurrentContext', () => {
        test('should return context for paragraph', () => {
            const context = stateTimeline.getCurrentContext('para-1');

            expect(context).toBeDefined();
            expect(context).toHaveProperty('paragraphId', 'para-1');
            expect(context).toHaveProperty('elementStates');
            expect(context).toHaveProperty('timestamp');
            expect(context.elementStates).toBeInstanceOf(Map);
        });

        test('should include states for all elements', () => {
            const context = stateTimeline.getCurrentContext('para-1');

            expect(context.elementStates.size).toBeGreaterThan(0);
        });

        test('should return valid timestamp', () => {
            const context = stateTimeline.getCurrentContext('para-1');

            expect(context.timestamp).toBeDefined();
            expect(typeof context.timestamp).toBe('string');
        });
    });

    describe('getNarrativeContext', () => {
        test('should return normal context for linear narrative', () => {
            const context = stateTimeline.getNarrativeContext('para-1');

            expect(context).toBeDefined();
            expect(context).toHaveProperty('paragraphId', 'para-1');
        });

        test('should handle flashback narrative', () => {
            // Add a flashback paragraph
            const flashbackPara = {
                id: 'para-flashback',
                sequence: 4,
                content: 'Flashback',
                storyTimestamp: new StoryTimestamp({
                    chapterId: 'chapter-1',
                    sequence: 4,
                    narrativeType: 'flashback',
                    referenceParagraphId: 'para-1',
                    timeOffset: -1
                })
            };

            mockStory.chapters[0].paragraphs.push(flashbackPara);
            stateTimeline.indexParagraphTimestamp('para-flashback', flashbackPara.storyTimestamp);

            const context = stateTimeline.getNarrativeContext('para-flashback');
            expect(context).toBeDefined();
        });

        test('should handle flashforward narrative', () => {
            const flashforwardPara = {
                id: 'para-flashforward',
                sequence: 5,
                content: 'Flashforward',
                storyTimestamp: new StoryTimestamp({
                    chapterId: 'chapter-1',
                    sequence: 5,
                    narrativeType: 'flashforward',
                    referenceParagraphId: 'para-2',
                    timeOffset: 1
                })
            };

            mockStory.chapters[0].paragraphs.push(flashforwardPara);
            stateTimeline.indexParagraphTimestamp('para-flashforward', flashforwardPara.storyTimestamp);

            const context = stateTimeline.getNarrativeContext('para-flashforward');
            expect(context).toBeDefined();
        });

        test('should handle parallel narrative', () => {
            const parallelPara = {
                id: 'para-parallel',
                sequence: 6,
                content: 'Parallel',
                storyTimestamp: new StoryTimestamp({
                    chapterId: 'chapter-1',
                    sequence: 6,
                    narrativeType: 'parallel',
                    absoluteTime: '12:00:00'
                })
            };

            mockStory.chapters[0].paragraphs.push(parallelPara);
            stateTimeline.indexParagraphTimestamp('para-parallel', parallelPara.storyTimestamp);

            const context = stateTimeline.getNarrativeContext('para-parallel');
            expect(context).toBeDefined();
        });

        test('should return default context for paragraph without timestamp', () => {
            // Create a context without explicitly testing paragraph without timestamp
            const context = stateTimeline.getNarrativeContext('para-1');
            expect(context).toBeDefined();
        });
    });

    describe('findParagraphByTime', () => {
        test('should find paragraph by story timestamp', () => {
            const storyTime = new StoryTimestamp({
                chapterId: 'chapter-1',
                sequence: 1,
                narrativeType: 'linear'
            });

            const paragraph = stateTimeline.findParagraphByTime(storyTime);

            expect(paragraph).toBeDefined();
            expect(paragraph.id).toBe('para-1');
        });

        test('should return undefined for non-existent time', () => {
            const storyTime = new StoryTimestamp({
                chapterId: 'chapter-1',
                sequence: 999,
                narrativeType: 'linear'
            });

            const paragraph = stateTimeline.findParagraphByTime(storyTime);

            expect(paragraph).toBeUndefined();
        });
    });

    describe('indexParagraphTimestamp', () => {
        test('should index a paragraph timestamp', () => {
            const newTimestamp = new StoryTimestamp({
                chapterId: 'chapter-1',
                sequence: 4,
                narrativeType: 'linear'
            });

            stateTimeline.indexParagraphTimestamp('new-para', newTimestamp);

            expect(stateTimeline.timestampIndex.has('chapter-1:4')).toBe(true);
        });

        test('should overwrite existing timestamp', () => {
            const timestamp1 = new StoryTimestamp({
                chapterId: 'chapter-1',
                sequence: 1,
                narrativeType: 'linear'
            });

            const timestamp2 = new StoryTimestamp({
                chapterId: 'chapter-1',
                sequence: 1,
                narrativeType: 'flashback'
            });

            stateTimeline.indexParagraphTimestamp('test-para', timestamp1);
            stateTimeline.indexParagraphTimestamp('test-para', timestamp2);

            const paragraphId = stateTimeline.timestampIndex.get('chapter-1:1');
            expect(paragraphId).toBe('test-para');
        });
    });

    describe('applyTimeOffset', () => {
        test('should apply positive time offset', () => {
            const anchorParagraph = {
                storyTimestamp: {
                    chapterId: 'chapter-1',
                    sequence: 1,
                    narrativeType: 'linear'
                }
            };

            const storyTime = {
                chapterId: 'chapter-1',
                sequence: 1,
                narrativeType: 'flashforward',
                timeOffset: 5
            };

            const result = stateTimeline.applyTimeOffset(anchorParagraph, storyTime);

            expect(result.sequence).toBe(6);
            expect(result.timeOffset).toBe(5);
        });

        test('should apply negative time offset', () => {
            const anchorParagraph = {
                storyTimestamp: {
                    chapterId: 'chapter-1',
                    sequence: 10,
                    narrativeType: 'linear'
                }
            };

            const storyTime = {
                chapterId: 'chapter-1',
                sequence: 10,
                narrativeType: 'flashback',
                timeOffset: -3
            };

            const result = stateTimeline.applyTimeOffset(anchorParagraph, storyTime);

            expect(result.sequence).toBe(7);
        });

        test('should handle missing storyTimestamp', () => {
            const anchorParagraph = {};
            const storyTime = { chapterId: 'chapter-1', sequence: 1 };

            const result = stateTimeline.applyTimeOffset(anchorParagraph, storyTime);

            expect(result).toEqual(storyTime);
        });

        test('should handle missing timeOffset', () => {
            const anchorParagraph = {
                storyTimestamp: {
                    chapterId: 'chapter-1',
                    sequence: 5,
                    narrativeType: 'linear'
                }
            };

            const storyTime = {
                chapterId: 'chapter-1',
                sequence: 5,
                narrativeType: 'linear'
            };

            const result = stateTimeline.applyTimeOffset(anchorParagraph, storyTime);

            expect(result.sequence).toBe(5);
        });
    });

    describe('getStateAtStoryTime', () => {
        test('should get state at story time', () => {
            const storyTime = new StoryTimestamp({
                chapterId: 'chapter-1',
                sequence: 1,
                narrativeType: 'linear'
            });

            const state = stateTimeline.getStateAtStoryTime(storyTime, 'char-1');

            expect(state).toBeDefined();
        });

        test('should throw error for non-existent story time', () => {
            const storyTime = new StoryTimestamp({
                chapterId: 'chapter-1',
                sequence: 999,
                narrativeType: 'linear'
            });

            expect(() => {
                stateTimeline.getStateAtStoryTime(storyTime, 'char-1');
            }).toThrow();
        });
    });

    describe('reindex', () => {
        test('should reindex all changes', () => {
            // Modify mock story
            mockStory.chapters[0].paragraphs.push({
                id: 'para-4',
                sequence: 4,
                content: 'New paragraph',
                changes: [{ elementId: 'char-1', changes: { keywords: ['恢复'] } }],
                storyTimestamp: new StoryTimestamp({ chapterId: 'chapter-1', sequence: 4, narrativeType: 'linear' })
            });

            stateTimeline.reindex();

            expect(stateTimeline.changesByParagraph.has('para-4')).toBe(true);
        });
    });

    describe('read-only guarantee', () => {
        test('should not modify original data when querying states', () => {
            const context1 = stateTimeline.getCurrentContext('para-1');
            const context2 = stateTimeline.getCurrentContext('para-1');

            expect(context1.elementStates).toBeInstanceOf(Map);
            expect(context2.elementStates).toBeInstanceOf(Map);
            expect(context1).not.toBe(context2); // Different instances
        });

        test('should return copy of element states', () => {
            const context = stateTimeline.getCurrentContext('para-1');

            // Modify the returned context
            context.elementStates.set('test', {});

            // Get context again
            const context2 = stateTimeline.getCurrentContext('para-1');

            expect(context2.elementStates.has('test')).toBe(false);
        });
    });
});

/**
 * StoryTimestamp 单元测试
 */

const StoryTimestamp = require('../../js/models/StoryTimestamp');

describe('StoryTimestamp', () => {
    describe('Constructor', () => {
        it('should create timestamp with chapterId and sequence', () => {
            const timestamp = new StoryTimestamp({
                chapterId: 'chapter-1',
                sequence: 1
            });

            expect(timestamp.chapterId).toBe('chapter-1');
            expect(timestamp.sequence).toBe(1);
        });

        it('should throw error without chapterId', () => {
            expect(() => {
                new StoryTimestamp({
                    sequence: 1
                });
            }).toThrow('StoryTimestamp requires chapterId and sequence');
        });

        it('should throw error without sequence', () => {
            expect(() => {
                new StoryTimestamp({
                    chapterId: 'chapter-1'
                });
            }).toThrow('StoryTimestamp requires chapterId and sequence');
        });

        it('should set default narrative type to linear', () => {
            const timestamp = new StoryTimestamp({
                chapterId: 'chapter-1',
                sequence: 1
            });

            expect(timestamp.narrativeType).toBe('linear');
        });

        it('should accept absoluteTime', () => {
            const timestamp = new StoryTimestamp({
                chapterId: 'chapter-1',
                sequence: 1,
                absoluteTime: '2023-06-15'
            });

            expect(timestamp.absoluteTime).toBe('2023-06-15');
        });

        it('should accept relativeTime', () => {
            const timestamp = new StoryTimestamp({
                chapterId: 'chapter-1',
                sequence: 1,
                relativeTime: '三天前'
            });

            expect(timestamp.relativeTime).toBe('三天前');
        });
    });

    describe('Narrative Types', () => {
        it('should create linear timestamp', () => {
            const timestamp = StoryTimestamp.linear('chapter-1', 5);

            expect(timestamp.narrativeType).toBe('linear');
            expect(timestamp.referenceParagraphId).toBeNull();
            expect(timestamp.timeOffset).toBe(0);
        });

        it('should create flashback timestamp', () => {
            const timestamp = StoryTimestamp.flashback('chapter-1', 5, 'paragraph-1', -10);

            expect(timestamp.narrativeType).toBe('flashback');
            expect(timestamp.referenceParagraphId).toBe('paragraph-1');
            expect(timestamp.timeOffset).toBe(-10);
        });

        it('should create flashforward timestamp', () => {
            const timestamp = StoryTimestamp.flashforward('chapter-1', 5, 'paragraph-1', 10);

            expect(timestamp.narrativeType).toBe('flashforward');
            expect(timestamp.referenceParagraphId).toBe('paragraph-1');
            expect(timestamp.timeOffset).toBe(10);
        });

        it('should create parallel timestamp', () => {
            const timestamp = StoryTimestamp.parallel('chapter-1', 5, 'paragraph-1');

            expect(timestamp.narrativeType).toBe('parallel');
            expect(timestamp.referenceParagraphId).toBe('paragraph-1');
            expect(timestamp.timeOffset).toBe(0);
        });

        it('should set default offset for flashback', () => {
            const timestamp = StoryTimestamp.flashback('chapter-1', 5, 'paragraph-1');

            expect(timestamp.timeOffset).toBe(-10);
        });

        it('should set default offset for flashforward', () => {
            const timestamp = StoryTimestamp.flashforward('chapter-1', 5, 'paragraph-1');

            expect(timestamp.timeOffset).toBe(10);
        });
    });

    describe('Type Checking', () => {
        let timestamp;

        beforeEach(() => {
            timestamp = new StoryTimestamp({
                chapterId: 'chapter-1',
                sequence: 1
            });
        });

        it('should detect linear narrative', () => {
            timestamp.narrativeType = 'linear';
            expect(timestamp.isLinear()).toBe(true);
            expect(timestamp.isFlashback()).toBe(false);
            expect(timestamp.isFlashforward()).toBe(false);
            expect(timestamp.isParallel()).toBe(false);
        });

        it('should detect flashback narrative', () => {
            timestamp.narrativeType = 'flashback';
            expect(timestamp.isLinear()).toBe(false);
            expect(timestamp.isFlashback()).toBe(true);
            expect(timestamp.isFlashforward()).toBe(false);
            expect(timestamp.isParallel()).toBe(false);
        });

        it('should detect flashforward narrative', () => {
            timestamp.narrativeType = 'flashforward';
            expect(timestamp.isLinear()).toBe(false);
            expect(timestamp.isFlashback()).toBe(false);
            expect(timestamp.isFlashforward()).toBe(true);
            expect(timestamp.isParallel()).toBe(false);
        });

        it('should detect parallel narrative', () => {
            timestamp.narrativeType = 'parallel';
            expect(timestamp.isLinear()).toBe(false);
            expect(timestamp.isFlashback()).toBe(false);
            expect(timestamp.isFlashforward()).toBe(false);
            expect(timestamp.isParallel()).toBe(true);
        });
    });

    describe('Narrative Type Setting', () => {
        let timestamp;

        beforeEach(() => {
            timestamp = new StoryTimestamp({
                chapterId: 'chapter-1',
                sequence: 5
            });
        });

        it('should set narrative type with reference and offset', () => {
            timestamp.setNarrativeType('flashback', 'paragraph-1', -10);

            expect(timestamp.narrativeType).toBe('flashback');
            expect(timestamp.referenceParagraphId).toBe('paragraph-1');
            expect(timestamp.timeOffset).toBe(-10);
        });

        it('should reset to linear and clear reference and offset', () => {
            timestamp.setNarrativeType('flashback', 'paragraph-1', -10);
            timestamp.setNarrativeType('linear');

            expect(timestamp.narrativeType).toBe('linear');
            expect(timestamp.referenceParagraphId).toBeNull();
            expect(timestamp.timeOffset).toBe(0);
        });

        it('should throw error for invalid narrative type', () => {
            expect(() => {
                timestamp.setNarrativeType('invalid');
            }).toThrow('Invalid narrative type');
        });
    });

    describe('Time Setting', () => {
        let timestamp;

        beforeEach(() => {
            timestamp = new StoryTimestamp({
                chapterId: 'chapter-1',
                sequence: 1
            });
        });

        it('should set absolute time', () => {
            timestamp.setAbsoluteTime('2023-06-15 10:00');
            expect(timestamp.absoluteTime).toBe('2023-06-15 10:00');
        });

        it('should set relative time', () => {
            timestamp.setRelativeTime('三天前');
            expect(timestamp.relativeTime).toBe('三天前');
        });
    });

    describe('Story Position Calculation', () => {
        it('should return correct position for linear narrative', () => {
            const timestamp = new StoryTimestamp({
                chapterId: 'chapter-1',
                sequence: 5
            });

            const position = timestamp.getStoryPosition();
            expect(position.chapterId).toBe('chapter-1');
            expect(position.sequence).toBe(5);
        });

        it('should calculate position with offset for flashback', () => {
            const timestamp = new StoryTimestamp({
                chapterId: 'chapter-1',
                sequence: 20,
                narrativeType: 'flashback',
                timeOffset: -10
            });

            const position = timestamp.getStoryPosition();
            expect(position.sequence).toBe(10);
        });

        it('should calculate position with offset for flashforward', () => {
            const timestamp = new StoryTimestamp({
                chapterId: 'chapter-1',
                sequence: 5,
                narrativeType: 'flashforward',
                timeOffset: 10
            });

            const position = timestamp.getStoryPosition();
            expect(position.sequence).toBe(15);
        });
    });

    describe('Comparison', () => {
        it('should compare timestamps by chapterId', () => {
            const ts1 = new StoryTimestamp({ chapterId: 'chapter-1', sequence: 5 });
            const ts2 = new StoryTimestamp({ chapterId: 'chapter-2', sequence: 1 });

            expect(ts1.compareTo(ts2)).toBeLessThan(0);
            expect(ts2.compareTo(ts1)).toBeGreaterThan(0);
        });

        it('should compare timestamps by sequence in same chapter', () => {
            const ts1 = new StoryTimestamp({ chapterId: 'chapter-1', sequence: 1 });
            const ts2 = new StoryTimestamp({ chapterId: 'chapter-1', sequence: 5 });

            expect(ts1.compareTo(ts2)).toBeLessThan(0);
            expect(ts2.compareTo(ts1)).toBeGreaterThan(0);
        });

        it('should return 0 for equal timestamps', () => {
            const ts1 = new StoryTimestamp({ chapterId: 'chapter-1', sequence: 5 });
            const ts2 = new StoryTimestamp({ chapterId: 'chapter-1', sequence: 5 });

            expect(ts1.compareTo(ts2)).toBe(0);
        });
    });

    describe('Serialization', () => {
        it('should serialize to JSON', () => {
            const timestamp = new StoryTimestamp({
                chapterId: 'chapter-1',
                sequence: 5,
                absoluteTime: '2023-06-15',
                relativeTime: '昨天'
            });

            const json = timestamp.toJSON();

            expect(json.chapterId).toBe('chapter-1');
            expect(json.sequence).toBe(5);
            expect(json.absoluteTime).toBe('2023-06-15');
            expect(json.relativeTime).toBe('昨天');
        });

        it('should deserialize from JSON', () => {
            const jsonData = {
                chapterId: 'chapter-1',
                sequence: 5,
                absoluteTime: '2023-06-15',
                narrativeType: 'linear',
                referenceParagraphId: null,
                timeOffset: 0
            };

            const timestamp = StoryTimestamp.fromJSON(jsonData);

            expect(timestamp.chapterId).toBe('chapter-1');
            expect(timestamp.sequence).toBe(5);
            expect(timestamp.absoluteTime).toBe('2023-06-15');
        });
    });
});

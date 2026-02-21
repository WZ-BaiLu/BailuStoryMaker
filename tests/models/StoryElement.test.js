/**
 * StoryElement 单元测试
 */

const StoryElement = require('../../js/models/StoryElement');

describe('StoryElement', () => {
    describe('Constructor', () => {
        it('should create element with required fields', () => {
            const element = new StoryElement({
                type: 'character',
                name: '张三',
                description: '一个勇敢的战士'
            });

            expect(element.type).toBe('character');
            expect(element.name).toBe('张三');
            expect(element.description).toBe('一个勇敢的战士');
            expect(element.id).toBeDefined();
        });

        it('should add default keywords', () => {
            const element = new StoryElement({
                type: 'character',
                name: '李四',
                description: '智慧法师'
            });

            expect(element.keywords).toContain('人物');
            expect(element.keywords).toContain('李四');
        });

        it('should add item keywords for item type', () => {
            const element = new StoryElement({
                type: 'item',
                name: '剑',
                description: '锋利的剑'
            });

            expect(element.keywords).toContain('道具');
            expect(element.keywords).toContain('剑');
        });

        it('should add location keywords for location type', () => {
            const element = new StoryElement({
                type: 'location',
                name: '城堡',
                description: '古老的城堡'
            });

            expect(element.keywords).toContain('地点');
            expect(element.keywords).toContain('城堡');
        });

        it('should add memory keywords for memory type', () => {
            const element = new StoryElement({
                type: 'memory',
                name: '童年回忆',
                description: '美好的童年'
            });

            expect(element.keywords).toContain('记忆');
        });

        it('should throw error for invalid type', () => {
            expect(() => {
                new StoryElement({
                    type: 'invalid',
                    name: '测试',
                    description: '测试描述'
                });
            }).toThrow('Invalid element type');
        });

        it('should throw error for missing required fields', () => {
            expect(() => {
                new StoryElement({
                    type: 'character',
                    name: '测试'
                });
            }).toThrow('StoryElement requires type, name, and description');
        });
    });

    describe('Keyword Management', () => {
        let element;

        beforeEach(() => {
            element = new StoryElement({
                type: 'character',
                name: '王五',
                description: '测试角色'
            });
        });

        it('should add keyword', () => {
            element.addKeyword('勇敢');
            expect(element.keywords).toContain('勇敢');
        });

        it('should not add duplicate keyword', () => {
            element.addKeyword('勇敢');
            element.addKeyword('勇敢');
            const count = element.keywords.filter(k => k === '勇敢').length;
            expect(count).toBe(1);
        });

        it('should remove keyword', () => {
            element.addKeyword('勇敢');
            element.removeKeyword('勇敢');
            expect(element.keywords).not.toContain('勇敢');
        });

        it('should merge custom keywords with default keywords', () => {
            const element2 = new StoryElement({
                type: 'character',
                name: '赵六',
                description: '测试角色',
                keywords: ['勇敢', '正义']
            });

            expect(element2.keywords).toContain('人物');
            expect(element2.keywords).toContain('赵六');
            expect(element2.keywords).toContain('勇敢');
            expect(element2.keywords).toContain('正义');
        });
    });

    describe('State Change Recording', () => {
        let element;

        beforeEach(() => {
            element = new StoryElement({
                type: 'character',
                name: '孙七',
                description: '测试角色',
                location: 'location-1'
            });
        });

        it('should record state change', () => {
            element.recordStateChange('paragraph-1', {
                location: 'location-2'
            });

            expect(element.stateHistory.length).toBe(1);
            expect(element.stateHistory[0].paragraphId).toBe('paragraph-1');
            expect(element.stateHistory[0].changes.location).toBe('location-2');
        });

        it('should get state at paragraph', () => {
            element.recordStateChange('paragraph-1', {
                location: 'location-2'
            });

            const state = element.getStateAt('paragraph-1');

            expect(state.location).toBe('location-2');
        });

        it('should return current state for future paragraph', () => {
            element.recordStateChange('paragraph-1', {
                location: 'location-2'
            });

            const state = element.getStateAt('paragraph-2');

            expect(state.location).toBe('location-2');
        });

        it('should return initial state for past paragraph', () => {
            element.recordStateChange('paragraph-2', {
                location: 'location-2'
            });

            const state = element.getStateAt('paragraph-1');

            expect(state.location).toBe('location-1');
        });

        it('should apply multiple changes chronologically', () => {
            element.recordStateChange('paragraph-1', {
                location: 'location-2'
            });
            element.recordStateChange('paragraph-2', {
                description: '新的描述'
            });
            element.recordStateChange('paragraph-3', {
                location: 'location-3'
            });

            const state = element.getStateAt('paragraph-3');

            expect(state.location).toBe('location-3');
            expect(state.description).toBe('新的描述');
        });
    });

    describe('Serialization', () => {
        it('should serialize to JSON', () => {
            const element = new StoryElement({
                type: 'character',
                name: '周八',
                description: '测试角色',
                keywords: ['勇敢']
            });

            const json = element.toJSON();

            expect(json.id).toBeDefined();
            expect(json.type).toBe('character');
            expect(json.name).toBe('周八');
            expect(json.keywords).toContain('勇敢');
        });

        it('should deserialize from JSON', () => {
            const jsonData = {
                id: 'character-zhou-ba-123',
                type: 'character',
                name: '周八',
                description: '测试角色',
                keywords: ['人物', '周八', '勇敢'],
                location: 'location-1',
                stateDescription: {},
                stateHistory: []
            };

            const element = StoryElement.fromJSON(jsonData);

            expect(element.id).toBe('character-zhou-ba-123');
            expect(element.type).toBe('character');
            expect(element.name).toBe('周八');
        });
    });
});

/**
 * ElementManager 单元测试
 */

const StoryElement = require('../../js/models/StoryElement');
const ElementManager = require('../../js/managers/ElementManager');

describe('ElementManager', () => {
    let elementManager;
    let storyData;

    beforeEach(() => {
        storyData = { elements: [] };
        elementManager = new ElementManager(storyData);
    });

    describe('Add Element', () => {
        it('should add character element', () => {
            const element = elementManager.addElement({
                type: 'character',
                name: '张三',
                description: '勇敢的战士'
            });

            expect(element).toBeDefined();
            expect(element.name).toBe('张三');
            expect(element.type).toBe('character');
            expect(element.keywords).toContain('人物');
            expect(storyData.elements.length).toBe(1);
        });

        it('should add item element', () => {
            const element = elementManager.addElement({
                type: 'item',
                name: '剑',
                description: '锋利的剑'
            });

            expect(element.type).toBe('item');
            expect(element.keywords).toContain('道具');
        });

        it('should add location element', () => {
            const element = elementManager.addElement({
                type: 'location',
                name: '城堡',
                description: '古老的城堡'
            });

            expect(element.type).toBe('location');
            expect(element.keywords).toContain('地点');
        });

        it('should add memory element', () => {
            const element = elementManager.addElement({
                type: 'memory',
                name: '童年回忆',
                description: '美好的童年'
            });

            expect(element.type).toBe('memory');
            expect(element.keywords).toContain('记忆');
        });

        it('should generate unique ID', () => {
            const element1 = elementManager.addElement({
                type: 'character',
                name: '角色',
                description: '角色1'
            });

            const element2 = elementManager.addElement({
                type: 'character',
                name: '角色',
                description: '角色2'
            });

            expect(element1.id).not.toBe(element2.id);
        });

        it('should throw error for missing required fields', () => {
            expect(() => {
                elementManager.addElement({
                    type: 'character',
                    name: '测试'
                });
            }).toThrow('Element requires type, name, and description');
        });

        it('should allow elements with same name but different IDs', () => {
            const element1 = elementManager.addElement({
                type: 'character',
                name: '张三',
                description: '测试角色'
            });

            const element2 = elementManager.addElement({
                type: 'character',
                name: '张三',
                description: '另一个描述'
            });

            // 两个元素应该有不同的 ID
            expect(element1.id).not.toBe(element2.id);

            // 但是应该有不同的序列号
            const seq1 = element1.id.split('-').pop();
            const seq2 = element2.id.split('-').pop();
            expect(parseInt(seq1)).not.toBe(parseInt(seq2));
        });

        it('should merge custom keywords with default keywords', () => {
            const element = elementManager.addElement({
                type: 'character',
                name: '李四',
                description: '测试角色',
                keywords: ['勇敢', '正义']
            });

            expect(element.keywords).toContain('人物');
            expect(element.keywords).toContain('李四');
            expect(element.keywords).toContain('勇敢');
            expect(element.keywords).toContain('正义');
        });
    });

    describe('Get Element', () => {
        it('should get element by ID', () => {
            const added = elementManager.addElement({
                type: 'character',
                name: '张三',
                description: '测试角色'
            });

            const found = elementManager.getElement(added.id);

            expect(found).toBeDefined();
            expect(found.id).toBe(added.id);
            expect(found.name).toBe('张三');
        });

        it('should return undefined for non-existent element', () => {
            const found = elementManager.getElement('non-existent-id');
            expect(found).toBeUndefined();
        });

        it('should find element by name', () => {
            elementManager.addElement({
                type: 'character',
                name: '张三',
                description: '测试角色'
            });

            const found = elementManager.findElementByName('张三');

            expect(found).toBeDefined();
            expect(found.name).toBe('张三');
        });

        it('should return undefined for non-existent name', () => {
            const found = elementManager.findElementByName('不存在的角色');
            expect(found).toBeUndefined();
        });
    });

    describe('List Elements', () => {
        beforeEach(() => {
            elementManager.addElement({ type: 'character', name: '张三', description: '角色1' });
            elementManager.addElement({ type: 'character', name: '李四', description: '角色2' });
            elementManager.addElement({ type: 'item', name: '剑', description: '道具1' });
            elementManager.addElement({ type: 'location', name: '城堡', description: '地点1' });
        });

        it('should list all elements', () => {
            const all = elementManager.listElements();
            expect(all.length).toBe(4);
        });

        it('should filter by type', () => {
            const characters = elementManager.listElements('character');
            expect(characters.length).toBe(2);
            expect(characters.every(e => e.type === 'character')).toBe(true);

            const items = elementManager.listElements('item');
            expect(items.length).toBe(1);
            expect(items[0].type).toBe('item');
        });
    });

    describe('Update Element', () => {
        it('should update element description', () => {
            const added = elementManager.addElement({
                type: 'character',
                name: '张三',
                description: '原始描述'
            });

            const updated = elementManager.updateElement(added.id, {
                description: '新的描述'
            });

            expect(updated.description).toBe('新的描述');
        });

        it('should update element keywords', () => {
            const added = elementManager.addElement({
                type: 'character',
                name: '张三',
                description: '测试角色'
            });

            const updated = elementManager.updateElement(added.id, {
                keywords: ['勇敢', '正义']
            });

            expect(updated.keywords).toContain('勇敢');
            expect(updated.keywords).toContain('正义');
        });

        it('should throw error for non-existent element', () => {
            expect(() => {
                elementManager.updateElement('non-existent-id', {
                    description: '新的描述'
                });
            }).toThrow('Element not found');
        });
    });

    describe('Delete Element', () => {
        it('should delete element', () => {
            const added = elementManager.addElement({
                type: 'character',
                name: '张三',
                description: '测试角色'
            });

            elementManager.deleteElement(added.id);

            const found = elementManager.getElement(added.id);
            expect(found).toBeUndefined();
            expect(storyData.elements.length).toBe(0);
        });

        it('should throw error for non-existent element', () => {
            expect(() => {
                elementManager.deleteElement('non-existent-id');
            }).toThrow('Element not found');
        });
    });

    describe('Keyword Management', () => {
        let element;

        beforeEach(() => {
            element = elementManager.addElement({
                type: 'character',
                name: '张三',
                description: '测试角色'
            });
        });

        it('should add keyword', () => {
            elementManager.addKeyword(element.id, '勇敢');
            const found = elementManager.getElement(element.id);
            expect(found.keywords).toContain('勇敢');
        });

        it('should remove keyword', () => {
            elementManager.addKeyword(element.id, '勇敢');
            elementManager.removeKeyword(element.id, '勇敢');
            const found = elementManager.getElement(element.id);
            expect(found.keywords).not.toContain('勇敢');
        });

        it('should query by single keyword', () => {
            elementManager.addKeyword(element.id, '勇敢');

            const results = elementManager.queryByKeywords('勇敢');

            expect(results.length).toBe(1);
            expect(results[0].id).toBe(element.id);
        });

        it('should query by multiple keywords', () => {
            elementManager.addKeyword(element.id, '勇敢');
            elementManager.addKeyword(element.id, '正义');

            const results = elementManager.queryByKeywords(['勇敢', '正义']);

            expect(results.length).toBe(1);
            expect(results[0].id).toBe(element.id);
        });

        it('should return empty array for no matches', () => {
            const results = elementManager.queryByKeywords('不存在的关键词');
            expect(results).toEqual([]);
        });
    });

    describe('Location Management', () => {
        let character, location;

        beforeEach(() => {
            location = elementManager.addElement({
                type: 'location',
                name: '城堡',
                description: '地点'
            });

            character = elementManager.addElement({
                type: 'character',
                name: '张三',
                description: '角色'
            });
        });

        it('should update element location', () => {
            elementManager.updateElementLocation(character.id, location.id);

            const found = elementManager.getElement(character.id);
            expect(found.location).toBe(location.id);
        });

        it('should set location to null', () => {
            elementManager.updateElementLocation(character.id, location.id);
            elementManager.updateElementLocation(character.id, null);

            const found = elementManager.getElement(character.id);
            expect(found.location).toBeNull();
        });

        it('should throw error for non-existent element', () => {
            expect(() => {
                elementManager.updateElementLocation('non-existent-id', location.id);
            }).toThrow('Element not found');
        });

        it('should throw error for non-existent location', () => {
            expect(() => {
                elementManager.updateElementLocation(character.id, 'non-existent-location');
            }).toThrow('Location not found');
        });

        it('should throw error when target is not a location', () => {
            const item = elementManager.addElement({
                type: 'item',
                name: '剑',
                description: '道具'
            });

            expect(() => {
                elementManager.updateElementLocation(character.id, item.id);
            }).toThrow('Element ' + item.id + ' is not a location');
        });

        it('should get elements at location', () => {
            const character2 = elementManager.addElement({
                type: 'character',
                name: '李四',
                description: '角色2'
            });

            elementManager.updateElementLocation(character.id, location.id);
            elementManager.updateElementLocation(character2.id, location.id);

            const atLocation = elementManager.getElementsAtLocation(location.id);

            expect(atLocation.length).toBe(2);
            expect(atLocation.every(e => e.location === location.id)).toBe(true);
        });
    });

    describe('State History Management', () => {
        let element;

        beforeEach(() => {
            element = elementManager.addElement({
                type: 'character',
                name: '张三',
                description: '测试角色'
            });
            // 设置初始位置
            element.location = 'location-1';
        });

        it('should record state change', () => {
            elementManager.recordStateChange(element.id, 'paragraph-1', {
                location: 'location-2'
            });

            const state = elementManager.getElementStateAt(element.id, 'paragraph-1');

            expect(state.location).toBe('location-2');
        });

        it('should get element current state', () => {
            const currentState = elementManager.getElementCurrentState(element.id);

            expect(currentState.location).toBe('location-1');
            expect(currentState.description).toBe('测试角色');
        });
    });
});

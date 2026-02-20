/**
 * Tests for AppState heldItems functionality
 */
describe('AppState - Held Items', () => {
    let testStory;

    beforeEach(() => {
        // Reset state
        appState.currentStory = null;
        appState.selectedChapter = null;
        appState.selectedCharacter = null;
        appState.selectedItem = null;

        // Create test story
        testStory = {
            metadata: {
                id: 'test-story-1',
                title: 'Test Story',
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
                author: 'Test Author'
            },
            settings: {
                theme: 'light',
                autoSave: true,
                autoSaveInterval: 300
            },
            chapters: [],
            characters: [],
            items: [],
            settings: [],
            timeline: []
        };
        appState.loadStory(testStory);
    });

    afterEach(() => {
        // Cleanup
        appState.currentStory = null;
    });

    describe('getHeldItems', () => {
        it('should return empty array for character with no held items', () => {
            const character = appState.addCharacter({
                name: 'Test Character',
                description: 'Test description'
            });

            const heldItems = appState.getHeldItems(character.id);

            expect(heldItems).toEqual([]);
        });

        it('should return held items for character', () => {
            const character = appState.addCharacter({
                name: 'Test Character',
                description: 'Test description'
            });

            const item1 = appState.addItem({
                name: 'Test Item 1',
                type: 'weapon',
                description: 'Test weapon'
            });

            const item2 = appState.addItem({
                name: 'Test Item 2',
                type: 'armor',
                description: 'Test armor'
            });

            // Add items to character
            character.heldItems = [item1.id, item2.id];

            const heldItems = appState.getHeldItems(character.id);

            expect(heldItems).toHaveLength(2);
            expect(heldItems).toContain(item1.id);
            expect(heldItems).toContain(item2.id);
        });

        it('should initialize heldItems for legacy characters without the field', () => {
            const character = appState.addCharacter({
                name: 'Test Character',
                description: 'Test description'
            });

            // Remove heldItems field (simulate legacy data)
            delete character.heldItems;

            const heldItems = appState.getHeldItems(character.id);

            expect(heldItems).toEqual([]);
            expect(character.heldItems).toBeDefined();
        });

        it('should return empty array for non-existent character', () => {
            const heldItems = appState.getHeldItems('non-existent-id');

            expect(heldItems).toEqual([]);
        });
    });

    describe('addItemToCharacter', () => {
        it('should add item to character inventory', () => {
            const character = appState.addCharacter({
                name: 'Test Character',
                description: 'Test description'
            });

            const item = appState.addItem({
                name: 'Test Item',
                type: 'weapon',
                description: 'Test weapon'
            });

            appState.addItemToCharacter(character.id, item.id);

            expect(character.heldItems).toContain(item.id);
            expect(item.owner).toBe(character.id);
        });

        it('should not add duplicate item to character', () => {
            const character = appState.addCharacter({
                name: 'Test Character',
                description: 'Test description'
            });

            const item = appState.addItem({
                name: 'Test Item',
                type: 'weapon',
                description: 'Test weapon'
            });

            // Add item twice
            appState.addItemToCharacter(character.id, item.id);
            appState.addItemToCharacter(character.id, item.id);

            expect(character.heldItems).toHaveLength(1);
            expect(character.heldItems[0]).toBe(item.id);
        });

        it('should remove item from previous owner when transferring', () => {
            const character1 = appState.addCharacter({
                name: 'Character 1',
                description: 'First character'
            });

            const character2 = appState.addCharacter({
                name: 'Character 2',
                description: 'Second character'
            });

            const item = appState.addItem({
                name: 'Test Item',
                type: 'weapon',
                description: 'Test weapon'
            });

            // Add item to character1
            appState.addItemToCharacter(character1.id, item.id);
            expect(character1.heldItems).toContain(item.id);

            // Add item to character2 (should remove from character1)
            appState.addItemToCharacter(character2.id, item.id);

            expect(character1.heldItems).not.toContain(item.id);
            expect(character2.heldItems).toContain(item.id);
            expect(item.owner).toBe(character2.id);
        });

        it('should throw error for non-existent character', () => {
            const item = appState.addItem({
                name: 'Test Item',
                type: 'weapon',
                description: 'Test weapon'
            });

            expect(() => {
                appState.addItemToCharacter('non-existent-id', item.id);
            }).toThrow('角色不存在');
        });

        it('should throw error for non-existent item', () => {
            const character = appState.addCharacter({
                name: 'Test Character',
                description: 'Test description'
            });

            expect(() => {
                appState.addItemToCharacter(character.id, 'non-existent-item-id');
            }).toThrow('道具不存在');
        });

        it('should initialize heldItems array if not present', () => {
            const character = appState.addCharacter({
                name: 'Test Character',
                description: 'Test description'
            });

            const item = appState.addItem({
                name: 'Test Item',
                type: 'weapon',
                description: 'Test weapon'
            });

            // Remove heldItems field
            delete character.heldItems;

            appState.addItemToCharacter(character.id, item.id);

            expect(character.heldItems).toBeDefined();
            expect(character.heldItems).toContain(item.id);
        });
    });

    describe('removeItemFromCharacter', () => {
        it('should remove item from character inventory', () => {
            const character = appState.addCharacter({
                name: 'Test Character',
                description: 'Test description'
            });

            const item = appState.addItem({
                name: 'Test Item',
                type: 'weapon',
                description: 'Test weapon'
            });

            // Add item to character
            appState.addItemToCharacter(character.id, item.id);
            expect(character.heldItems).toContain(item.id);

            // Remove item
            appState.removeItemFromCharacter(character.id, item.id);

            expect(character.heldItems).not.toContain(item.id);
            expect(item.owner).toBeNull();
        });

        it('should do nothing if item not in character inventory', () => {
            const character = appState.addCharacter({
                name: 'Test Character',
                description: 'Test description'
            });

            const item = appState.addItem({
                name: 'Test Item',
                type: 'weapon',
                description: 'Test weapon'
            });

            // Remove item without adding it first
            appState.removeItemFromCharacter(character.id, item.id);

            expect(character.heldItems).toEqual([]);
        });

        it('should set heldItems to empty array when removing last item', () => {
            const character = appState.addCharacter({
                name: 'Test Character',
                description: 'Test description'
            });

            const item = appState.addItem({
                name: 'Test Item',
                type: 'weapon',
                description: 'Test weapon'
            });

            // Add and remove item
            appState.addItemToCharacter(character.id, item.id);
            appState.removeItemFromCharacter(character.id, item.id);

            expect(character.heldItems).toEqual([]);
        });
    });

    describe('transferItem', () => {
        it('should transfer item between characters', () => {
            const character1 = appState.addCharacter({
                name: 'Character 1',
                description: 'First character'
            });

            const character2 = appState.addCharacter({
                name: 'Character 2',
                description: 'Second character'
            });

            const item = appState.addItem({
                name: 'Test Item',
                type: 'weapon',
                description: 'Test weapon'
            });

            // Add item to character1
            appState.addItemToCharacter(character1.id, item.id);

            // Transfer to character2
            appState.transferItem(item.id, character1.id, character2.id);

            expect(character1.heldItems).not.toContain(item.id);
            expect(character2.heldItems).toContain(item.id);
            expect(item.owner).toBe(character2.id);
        });

        it('should do nothing when transferring to same character', () => {
            const character1 = appState.addCharacter({
                name: 'Character 1',
                description: 'First character'
            });

            const item = appState.addItem({
                name: 'Test Item',
                type: 'weapon',
                description: 'Test weapon'
            });

            // Add item to character
            appState.addItemToCharacter(character1.id, item.id);

            const originalHeldItems = [...character1.heldItems];

            // Transfer to same character
            appState.transferItem(item.id, character1.id, character1.id);

            expect(character1.heldItems).toEqual(originalHeldItems);
            expect(item.owner).toBe(character1.id);
        });

        it('should throw error for non-existent item', () => {
            const character1 = appState.addCharacter({
                name: 'Character 1',
                description: 'First character'
            });

            const character2 = appState.addCharacter({
                name: 'Character 2',
                description: 'Second character'
            });

            expect(() => {
                appState.transferItem('non-existent-item-id', character1.id, character2.id);
            }).toThrow('道具不存在');
        });
    });

    describe('validateItemsConsistency', () => {
        it('should return true for consistent data', () => {
            const character = appState.addCharacter({
                name: 'Test Character',
                description: 'Test description'
            });

            const item = appState.addItem({
                name: 'Test Item',
                type: 'weapon',
                description: 'Test weapon'
            });

            // Add item to character
            appState.addItemToCharacter(character.id, item.id);

            const result = appState.validateItemsConsistency();

            expect(result.isConsistent).toBe(true);
            expect(result.issues).toHaveLength(0);
        });

        it('should detect item owner pointing to non-existent character', () => {
            const item = appState.addItem({
                name: 'Test Item',
                type: 'weapon',
                description: 'Test weapon'
            });

            // Set owner to non-existent character
            item.owner = 'non-existent-character-id';

            const result = appState.validateItemsConsistency();

            expect(result.isConsistent).toBe(false);
            expect(result.issues.length).toBeGreaterThan(0);
            expect(result.issues[0].itemId).toBe(item.id);
        });

        it('should detect item not in character heldItems', () => {
            const character = appState.addCharacter({
                name: 'Test Character',
                description: 'Test description'
            });

            const item = appState.addItem({
                name: 'Test Item',
                type: 'weapon',
                description: 'Test weapon'
            });

            // Set owner but not in heldItems
            item.owner = character.id;
            character.heldItems = [];

            const result = appState.validateItemsConsistency();

            expect(result.isConsistent).toBe(false);
            expect(result.issues.length).toBeGreaterThan(0);
        });

        it('should detect item in heldItems but owner mismatch', () => {
            const character1 = appState.addCharacter({
                name: 'Character 1',
                description: 'First character'
            });

            const character2 = appState.addCharacter({
                name: 'Character 2',
                description: 'Second character'
            });

            const item = appState.addItem({
                name: 'Test Item',
                type: 'weapon',
                description: 'Test weapon'
            });

            // Item in character1's heldItems but owner is character2
            character1.heldItems = [item.id];
            item.owner = character2.id;

            const result = appState.validateItemsConsistency();

            expect(result.isConsistent).toBe(false);
            expect(result.issues.length).toBeGreaterThan(0);
        });
    });

    describe('repairItemsConsistency', () => {
        it('should repair inconsistent data based on item.owner', () => {
            const character1 = appState.addCharacter({
                name: 'Character 1',
                description: 'First character'
            });

            const character2 = appState.addCharacter({
                name: 'Character 2',
                description: 'Second character'
            });

            const item = appState.addItem({
                name: 'Test Item',
                type: 'weapon',
                description: 'Test weapon'
            });

            // Create inconsistency: owner points to character1, but item is in character2's heldItems
            item.owner = character1.id;
            character2.heldItems = [item.id];

            // Repair
            appState.repairItemsConsistency();

            expect(character1.heldItems).toContain(item.id);
            expect(character2.heldItems).not.toContain(item.id);
        });

        it('should reset owner to null if character does not exist', () => {
            const item = appState.addItem({
                name: 'Test Item',
                type: 'weapon',
                description: 'Test weapon'
            });

            // Set owner to non-existent character
            item.owner = 'non-existent-character-id';

            // Repair
            appState.repairItemsConsistency();

            expect(item.owner).toBeNull();
        });

        it('should rebuild all heldItems based on item.owner', () => {
            const character = appState.addCharacter({
                name: 'Test Character',
                description: 'Test description'
            });

            const item1 = appState.addItem({
                name: 'Item 1',
                type: 'weapon',
                description: 'Weapon'
            });

            const item2 = appState.addItem({
                name: 'Item 2',
                type: 'armor',
                description: 'Armor'
            });

            // Set owners
            item1.owner = character.id;
            item2.owner = character.id;

            // Clear heldItems
            character.heldItems = [];

            // Repair
            appState.repairItemsConsistency();

            expect(character.heldItems).toHaveLength(2);
            expect(character.heldItems).toContain(item1.id);
            expect(character.heldItems).toContain(item2.id);
        });
    });

    describe('updateItem - owner synchronization', () => {
        it('should update character heldItems when item owner changes', () => {
            const character1 = appState.addCharacter({
                name: 'Character 1',
                description: 'First character'
            });

            const character2 = appState.addCharacter({
                name: 'Character 2',
                description: 'Second character'
            });

            const item = appState.addItem({
                name: 'Test Item',
                type: 'weapon',
                description: 'Test weapon'
            });

            // Add to character1
            appState.addItemToCharacter(character1.id, item.id);

            // Update owner to character2
            appState.updateItem(item.id, { owner: character2.id });

            expect(character1.heldItems).not.toContain(item.id);
            expect(character2.heldItems).toContain(item.id);
            expect(item.owner).toBe(character2.id);
        });

        it('should remove from heldItems when owner is set to null', () => {
            const character = appState.addCharacter({
                name: 'Test Character',
                description: 'Test description'
            });

            const item = appState.addItem({
                name: 'Test Item',
                type: 'weapon',
                description: 'Test weapon'
            });

            // Add to character
            appState.addItemToCharacter(character.id, item.id);

            // Remove owner
            appState.updateItem(item.id, { owner: null });

            expect(character.heldItems).not.toContain(item.id);
            expect(item.owner).toBeNull();
        });

        it('should not modify heldItems when owner does not change', () => {
            const character = appState.addCharacter({
                name: 'Test Character',
                description: 'Test description'
            });

            const item = appState.addItem({
                name: 'Test Item',
                type: 'weapon',
                description: 'Test weapon'
            });

            // Add to character
            appState.addItemToCharacter(character.id, item.id);

            const originalHeldItems = [...character.heldItems];

            // Update other properties (not owner)
            appState.updateItem(item.id, { type: 'armor' });

            expect(character.heldItems).toEqual(originalHeldItems);
            expect(item.type).toBe('armor');
        });
    });
});

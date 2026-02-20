/**
 * Console API Tests for StateManager
 * 
 * Tests the convenience methods added for console-based operations:
 * - listParagraphs()
 * - listCharacters()
 * - listItems()
 * - findCharacterByName()
 * - findItemByName()
 * - addCharacterToParagraph()
 * - removeCharacterFromParagraph()
 * - giveItemToCharacter()
 * - createAndGiveItem()
 * - getParagraphInfo()
 */

describe('StateManager - Console API', () => {
    let appState;

    beforeEach(() => {
        appState = new AppState();
        appState.loadStory({
            id: 'story-1',
            title: 'Test Story',
            chapters: [{
                id: 'chapter-1',
                title: 'Chapter 1',
                paragraphs: [
                    { id: 'para-1', content: 'First paragraph', changes: {} },
                    { id: 'para-2', content: 'Second paragraph', changes: { characters: [] } }
                ]
            }],
            characters: [
                { id: 'char-1', name: 'Alice', heldItems: [] },
                { id: 'char-2', name: 'Bob', heldItems: [] }
            ],
            items: [
                { id: 'item-1', name: 'Sword', type: 'weapon', owner: null },
                { id: 'item-2', name: 'Shield', type: 'armor', owner: null }
            ]
        });
        appState.selectChapter('chapter-1');
    });

    describe('listParagraphs', () => {
        it('should list all paragraphs in current chapter', () => {
            const paragraphs = appState.listParagraphs();
            
            expect(paragraphs).toHaveLength(2);
            expect(paragraphs[0].id).toBe('para-1');
            expect(paragraphs[1].id).toBe('para-2');
        });

        it('should return empty array when no chapter is selected', () => {
            appState.selectedChapter = null;
            const paragraphs = appState.listParagraphs();
            
            expect(paragraphs).toEqual([]);
        });

        it('should truncate long content', () => {
            const longContent = 'A'.repeat(100);
            const paragraph = { id: 'para-3', content: longContent, changes: {} };
            appState.currentStory.chapters[0].paragraphs.push(paragraph);

            const paragraphs = appState.listParagraphs();
            const longPara = paragraphs.find(p => p.id === 'para-3');
            
            expect(longPara.content).toHaveLength(53); // 50 + '...'
            expect(longPara.content).toContain('...');
        });
    });

    describe('listCharacters', () => {
        it('should list all characters with their held items', () => {
            const characters = appState.listCharacters();
            
            expect(characters).toHaveLength(2);
            expect(characters[0]).toMatchObject({
                id: 'char-1',
                name: 'Alice',
                heldItems: []
            });
        });

        it('should return empty array when no story is loaded', () => {
            appState.currentStory = null;
            const characters = appState.listCharacters();
            
            expect(characters).toEqual([]);
        });

        it('should include heldItems in the result', () => {
            appState.addItemToCharacter('char-1', 'item-1');
            
            const characters = appState.listCharacters();
            const alice = characters.find(c => c.id === 'char-1');
            
            expect(alice.heldItems).toContain('item-1');
        });
    });

    describe('listItems', () => {
        it('should list all items with owner info', () => {
            const items = appState.listItems();
            
            expect(items).toHaveLength(2);
            expect(items[0]).toMatchObject({
                id: 'item-1',
                name: 'Sword',
                type: 'weapon',
                owner: null
            });
        });

        it('should return empty array when no story is loaded', () => {
            appState.currentStory = null;
            const items = appState.listItems();
            
            expect(items).toEqual([]);
        });

        it('should show owner when item is held', () => {
            appState.addItemToCharacter('char-1', 'item-1');
            
            const items = appState.listItems();
            const sword = items.find(i => i.id === 'item-1');
            
            expect(sword.owner).toBe('char-1');
        });
    });

    describe('findCharacterByName', () => {
        it('should find character by name', () => {
            const character = appState.findCharacterByName('Alice');
            
            expect(character).not.toBeNull();
            expect(character.id).toBe('char-1');
        });

        it('should return null when character not found', () => {
            const character = appState.findCharacterByName('Unknown');
            
            expect(character).toBeNull();
        });

        it('should return null when no story is loaded', () => {
            appState.currentStory = null;
            const character = appState.findCharacterByName('Alice');
            
            expect(character).toBeNull();
        });
    });

    describe('findItemByName', () => {
        it('should find item by name', () => {
            const item = appState.findItemByName('Sword');
            
            expect(item).not.toBeNull();
            expect(item.id).toBe('item-1');
        });

        it('should return null when item not found', () => {
            const item = appState.findItemByName('Unknown');
            
            expect(item).toBeNull();
        });

        it('should return null when no story is loaded', () => {
            appState.currentStory = null;
            const item = appState.findItemByName('Sword');
            
            expect(item).toBeNull();
        });
    });

    describe('addCharacterToParagraph', () => {
        it('should add character to paragraph changes', () => {
            appState.addCharacterToParagraph('para-1', 'char-1');
            
            const paragraph = appState.currentStory.chapters[0].paragraphs.find(p => p.id === 'para-1');
            expect(paragraph.changes.characters).toContain('char-1');
        });

        it('should not duplicate character if already present', () => {
            appState.addCharacterToParagraph('para-1', 'char-1');
            appState.addCharacterToParagraph('para-1', 'char-1');
            
            const paragraph = appState.currentStory.chapters[0].paragraphs.find(p => p.id === 'para-1');
            const count = paragraph.changes.characters.filter(id => id === 'char-1').length;
            
            expect(count).toBe(1);
        });

        it('should throw error when paragraph does not exist', () => {
            expect(() => {
                appState.addCharacterToParagraph('invalid-para', 'char-1');
            }).toThrow('段落不存在');
        });

        it('should throw error when character does not exist', () => {
            expect(() => {
                appState.addCharacterToParagraph('para-1', 'invalid-char');
            }).toThrow('角色不存在');
        });

        it('should save state before change', () => {
            jest.spyOn(appState, 'saveStateBeforeChange');
            
            appState.addCharacterToParagraph('para-1', 'char-1');
            
            expect(appState.saveStateBeforeChange).toHaveBeenCalledWith('添加段落角色');
        });
    });

    describe('removeCharacterFromParagraph', () => {
        beforeEach(() => {
            appState.addCharacterToParagraph('para-1', 'char-1');
            appState.addCharacterToParagraph('para-1', 'char-2');
        });

        it('should remove character from paragraph changes', () => {
            appState.removeCharacterFromParagraph('para-1', 'char-1');
            
            const paragraph = appState.currentStory.chapters[0].paragraphs.find(p => p.id === 'para-1');
            expect(paragraph.changes.characters).not.toContain('char-1');
            expect(paragraph.changes.characters).toContain('char-2');
        });

        it('should do nothing when character not in paragraph', () => {
            appState.removeCharacterFromParagraph('para-1', 'char-1');
            appState.removeCharacterFromParagraph('para-1', 'char-1'); // remove again
            
            const paragraph = appState.currentStory.chapters[0].paragraphs.find(p => p.id === 'para-1');
            expect(paragraph.changes.characters).not.toContain('char-1');
        });

        it('should do nothing when paragraph does not exist', () => {
            expect(() => {
                appState.removeCharacterFromParagraph('invalid-para', 'char-1');
            }).not.toThrow();
        });

        it('should do nothing when changes object does not exist', () => {
            const para2 = appState.currentStory.chapters[0].paragraphs.find(p => p.id === 'para-2');
            delete para2.changes;
            
            expect(() => {
                appState.removeCharacterFromParagraph('para-2', 'char-1');
            }).not.toThrow();
        });
    });

    describe('giveItemToCharacter', () => {
        it('should add character to paragraph and give item', () => {
            appState.giveItemToCharacter('para-1', 'char-1', 'item-1');
            
            const paragraph = appState.currentStory.chapters[0].paragraphs.find(p => p.id === 'para-1');
            const character = appState.currentStory.characters.find(c => c.id === 'char-1');
            const item = appState.currentStory.items.find(i => i.id === 'item-1');
            
            expect(paragraph.changes.characters).toContain('char-1');
            expect(character.heldItems).toContain('item-1');
            expect(item.owner).toBe('char-1');
        });
    });

    describe('createAndGiveItem', () => {
        it('should create item and give to character in paragraph', () => {
            const item = appState.createAndGiveItem('para-1', 'char-1', {
                name: 'Potion',
                type: 'consumable',
                description: 'Heals 50 HP'
            });
            
            const paragraph = appState.currentStory.chapters[0].paragraphs.find(p => p.id === 'para-1');
            const character = appState.currentStory.characters.find(c => c.id === 'char-1');
            
            expect(item.id).toMatch(/^item-/);
            expect(item.name).toBe('Potion');
            expect(paragraph.changes.characters).toContain('char-1');
            expect(character.heldItems).toContain(item.id);
        });
    });

    describe('getParagraphInfo', () => {
        beforeEach(() => {
            appState.addCharacterToParagraph('para-1', 'char-1');
            appState.addItemToCharacter('char-1', 'item-1');
        });

        it('should return paragraph info with resolved character details', () => {
            const info = appState.getParagraphInfo('para-1');
            
            expect(info.id).toBe('para-1');
            expect(info.characters).toHaveLength(1);
            expect(info.characters[0]).toMatchObject({
                id: 'char-1',
                name: 'Alice'
            });
        });

        it('should include held items in character details', () => {
            const info = appState.getParagraphInfo('para-1');
            
            expect(info.characters[0].heldItems).toContain('item-1');
        });

        it('should return null when paragraph does not exist', () => {
            const info = appState.getParagraphInfo('invalid-para');
            
            expect(info).toBeNull();
        });

        it('should return empty arrays when no changes', () => {
            const info = appState.getParagraphInfo('para-2');
            
            expect(info.characters).toEqual([]);
            expect(info.items).toEqual([]);
        });
    });
});

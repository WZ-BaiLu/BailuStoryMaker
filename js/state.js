// Application State Management

class AppState {
    constructor() {
        this.currentStory = null;
        this.selectedChapter = null;
        this.selectedCharacter = null;
        this.selectedItem = null;
        this.selectedSetting = null;
        this.selectedElement = null;
        this.autoSaveTimer = null;
        this.listeners = [];
        this.history = new HistoryManager(50);
        this.historyEnabled = true;
    }

    // Load story
    loadStory(storyData) {
        try {
            // Migrate old format (characters/items) to new format (elements)
            if ((storyData.characters || storyData.items) && !storyData.elements) {
                storyData = this._migrateStoryData(storyData);
            }

            // Fix any existing elements with empty/null descriptions or names
            if (storyData.elements && Array.isArray(storyData.elements)) {
                storyData.elements.forEach(element => {
                    if (!element.name || element.name.trim() === '') {
                        element.name = '未命名元素';
                        console.log(`[AppState] Fixed empty name for element: ${element.id}`);
                    }
                    if (!element.description || element.description.trim() === '') {
                        element.description = '暂无描述';
                        console.log(`[AppState] Fixed empty description for element: ${element.name} (${element.id})`);
                    }
                    if (!element.type || element.type.trim() === '') {
                        element.type = 'base';
                        console.log(`[AppState] Fixed empty type for element: ${element.name} (${element.id})`);
                    }
                });
            }

            this.currentStory = storyData;
            this.selectedChapter = null;
            this.selectedCharacter = null;
            this.selectedItem = null;
            this.selectedSetting = null;
            this.selectedElement = null;
            this.history.clear(); // Clear history when loading new story
            // Save to localStorage after loading
            this.saveToLocalStorage();
            this.notify('storyLoaded', storyData);
            return true;
        } catch (error) {
            console.error('Load story failed:', error);
            return false;
        }
    }

    /**
     * Migrate old story format (characters/items) to new format (elements)
     * @private
     */
    _migrateStoryData(storyData) {
        const migrated = { ...storyData };
        migrated.elements = [];

        // Migrate characters to elements
        if (migrated.characters && Array.isArray(migrated.characters)) {
            migrated.characters.forEach(char => {
                const element = {
                    id: char.id,
                    type: 'character',
                    name: char.name,
                    description: char.description?.trim() || '暂无描述',
                    keywords: [],
                    attributes: char.attributes,
                    abilities: char.abilities,
                    notes: char.notes
                };
                console.log(`[AppState] Migrating character: ${char.name}, description: "${element.description}"`);
                migrated.elements.push(element);
            });
            console.log(`[AppState] Migrated ${migrated.characters.length} characters to elements`);
        }

        // Migrate items to elements
        if (migrated.items && Array.isArray(migrated.items)) {
            migrated.items.forEach(item => {
                const element = {
                    id: item.id,
                    type: 'item',
                    name: item.name,
                    description: item.description?.trim() || '暂无描述',
                    keywords: [],
                    properties: item.properties,
                    owner: item.owner
                };
                console.log(`[AppState] Migrating item: ${item.name}, description: "${element.description}"`);
                migrated.elements.push(element);
            });
            console.log(`[AppState] Migrated ${migrated.items.length} items to elements`);
        }

        // Update paragraph changes format if needed
        if (migrated.chapters) {
            migrated.chapters.forEach(chapter => {
                if (chapter.paragraphs) {
                    chapter.paragraphs.forEach(paragraph => {
                        // Old format: { characters: [], items: [] }
                        // New format: { elements: [] }
                        if (paragraph.changes && (paragraph.changes.characters || paragraph.changes.items)) {
                            paragraph.changes = { elements: [] };
                        }
                    });
                }
            });
        }

        return migrated;
    }

    // Create new story
    createStory(title) {
        const newStory = {
            ...Constants.DEFAULT_STORY,
            metadata: {
                id: Formatters.generateId('story'),
                title: title,
                createdAt: Formatters.formatDate(),
                updatedAt: Formatters.formatDate(),
                author: ''
            }
        };
        this.history.clear(); // Clear history for new story
        // Load the new story which will save to localStorage
        this.loadStory(newStory);
        return newStory;
    }

    // Save current story
    saveStory() {
        if (!this.currentStory) {
            throw new Error('没有加载的故事');
        }

        this.currentStory.metadata.updatedAt = Formatters.formatDate();
        this.notify('storySaved', this.currentStory);
        return this.currentStory;
    }

    // Chapter management
    addChapter(title) {
        if (!this.currentStory) {
            throw new Error('没有加载的故事');
        }

        this.saveStateBeforeChange('添加章节');

        const chapter = {
            id: Formatters.generateId('chapter'),
            title: title || '新章节',
            order: this.currentStory.chapters.length + 1,
            paragraphs: [],
            createdAt: Formatters.formatDate(),
            updatedAt: Formatters.formatDate()
        };

        this.currentStory.chapters.push(chapter);
        this.notify('chapterAdded', chapter);
        return chapter;
    }

    updateChapter(chapterId, updates) {
        if (!this.currentStory) return;

        this.saveStateBeforeChange('编辑章节');

        const chapter = this.currentStory.chapters.find(c => c.id === chapterId);
        if (chapter) {
            Object.assign(chapter, updates, { updatedAt: Formatters.formatDate() });
            this.notify('chapterUpdated', chapter);
            // Auto-save to localStorage when content changes
            this.saveToLocalStorage();
        }
    }

    deleteChapter(chapterId) {
        if (!this.currentStory) return;

        this.saveStateBeforeChange('删除章节');

        const index = this.currentStory.chapters.findIndex(c => c.id === chapterId);
        if (index !== -1) {
            this.currentStory.chapters.splice(index, 1);
            // Reorder chapters
            this.currentStory.chapters.forEach((ch, i) => ch.order = i + 1);
            this.notify('chapterDeleted', chapterId);
        }
    }

    selectChapter(chapterId) {
        this.selectedChapter = chapterId;
        this.notify('chapterSelected', chapterId);
        // Auto-save to localStorage when selection changes
        this.saveToLocalStorage();
    }

    // Paragraph management
    addParagraph(chapterId, insertBeforeId = null) {
        if (!this.currentStory) {
            throw new Error('没有加载的故事');
        }

        const chapter = this.currentStory.chapters.find(c => c.id === chapterId);
        if (!chapter) {
            throw new Error('章节不存在');
        }

        this.saveStateBeforeChange('添加段落');

        const paragraph = {
            id: Formatters.generateId('paragraph'),
            content: '',
            changes: {
                characters: [],
                items: []
            },
            createdAt: Formatters.formatDate()
        };

        if (!chapter.paragraphs) {
            chapter.paragraphs = [];
        }

        // Insert before specified paragraph, or at the end
        if (insertBeforeId) {
            const insertIndex = chapter.paragraphs.findIndex(p => p.id === insertBeforeId);
            if (insertIndex !== -1) {
                chapter.paragraphs.splice(insertIndex, 0, paragraph);
            } else {
                chapter.paragraphs.push(paragraph);
            }
        } else {
            chapter.paragraphs.push(paragraph);
        }

        this.notify('paragraphAdded', { chapterId, paragraph });
        this.updateChapter(chapterId, { updatedAt: Formatters.formatDate() });
        return paragraph;
    }

    updateParagraph(chapterId, paragraphId, updates) {
        if (!this.currentStory) return;

        const chapter = this.currentStory.chapters.find(c => c.id === chapterId);
        if (!chapter || !chapter.paragraphs) return;

        const paragraph = chapter.paragraphs.find(p => p.id === paragraphId);
        if (paragraph) {
            this.saveStateBeforeChange('编辑段落');
            Object.assign(paragraph, updates);
            this.notify('paragraphUpdated', { chapterId, paragraph });
            this.saveToLocalStorage();
        }
    }

    deleteParagraph(chapterId, paragraphId) {
        if (!this.currentStory) return;

        const chapter = this.currentStory.chapters.find(c => c.id === chapterId);
        if (!chapter || !chapter.paragraphs) return;

        this.saveStateBeforeChange('删除段落');

        const index = chapter.paragraphs.findIndex(p => p.id === paragraphId);
        if (index !== -1) {
            chapter.paragraphs.splice(index, 1);
            this.notify('paragraphDeleted', { chapterId, paragraphId });
            this.saveToLocalStorage();
        }
    }

    // Character management
    addCharacter(characterData) {
        if (!this.currentStory) {
            throw new Error('没有加载的故事');
        }

        this.saveStateBeforeChange('添加角色');

        const character = {
            id: Formatters.generateId('char'),
            name: characterData.name || '新角色',
            description: characterData.description || '',
            attributes: characterData.attributes || { base: {}, current: {} },
            abilities: characterData.abilities || [],
            notes: characterData.notes || '',
            heldItems: characterData.heldItems || []
        };

        this.currentStory.characters.push(character);
        this.notify('characterAdded', character);
        return character;
    }

    updateCharacter(characterId, updates) {
        if (!this.currentStory) return;

        this.saveStateBeforeChange('编辑角色');

        const character = this.currentStory.characters.find(c => c.id === characterId);
        if (character) {
            Object.assign(character, updates);
            this.notify('characterUpdated', character);
            // Auto-save to localStorage when content changes
            this.saveToLocalStorage();
        }
    }

    deleteCharacter(characterId) {
        if (!this.currentStory) return;

        this.saveStateBeforeChange('删除角色');

        const index = this.currentStory.characters.findIndex(c => c.id === characterId);
        if (index !== -1) {
            this.currentStory.characters.splice(index, 1);
            this.notify('characterDeleted', characterId);
        }
    }

    selectCharacter(characterId) {
        this.selectedCharacter = characterId;
        this.notify('characterSelected', characterId);
        // Auto-save to localStorage when selection changes
        this.saveToLocalStorage();
    }

    // Get items held by a character
    getHeldItems(characterId) {
        if (!this.currentStory) return [];

        const character = this.currentStory.characters.find(c => c.id === characterId);
        if (!character) return [];

        // Initialize heldItems if not present (for backward compatibility)
        if (!character.heldItems) {
            character.heldItems = [];
        }

        return character.heldItems;
    }

    // Add an item to a character's inventory
    addItemToCharacter(characterId, itemId) {
        if (!this.currentStory) {
            throw new Error('没有加载的故事');
        }

        const character = this.currentStory.characters.find(c => c.id === characterId);
        if (!character) {
            throw new Error('角色不存在');
        }

        const item = this.currentStory.items.find(i => i.id === itemId);
        if (!item) {
            throw new Error('道具不存在');
        }

        // Initialize heldItems if not present
        if (!character.heldItems) {
            character.heldItems = [];
        }

        // If item is already held by this character, do nothing
        if (character.heldItems.includes(itemId)) {
            return;
        }

        // If item is held by another character, remove it from their inventory
        if (item.owner && item.owner !== characterId) {
            this.removeItemFromCharacter(item.owner, itemId);
        }

        // Add item to character's heldItems
        character.heldItems.push(itemId);

        // Update item's owner
        item.owner = characterId;

        this.notify('characterItemAdded', { characterId, itemId });
        this.saveToLocalStorage();
    }

    // Remove an item from a character's inventory
    removeItemFromCharacter(characterId, itemId) {
        if (!this.currentStory) return;

        const character = this.currentStory.characters.find(c => c.id === characterId);
        if (!character || !character.heldItems) return;

        const index = character.heldItems.indexOf(itemId);
        if (index === -1) return;

        // Remove from character's heldItems
        character.heldItems.splice(index, 1);

        // Update item's owner to null
        const item = this.currentStory.items.find(i => i.id === itemId);
        if (item) {
            item.owner = null;
        }

        this.notify('characterItemRemoved', { characterId, itemId });
        this.saveToLocalStorage();
    }

    // Transfer an item from one character to another
    transferItem(itemId, fromCharacterId, toCharacterId) {
        if (!this.currentStory) {
            throw new Error('没有加载的故事');
        }

        const item = this.currentStory.items.find(i => i.id === itemId);
        if (!item) {
            throw new Error('道具不存在');
        }

        // If transferring to the same character, do nothing
        if (fromCharacterId === toCharacterId) return;

        this.saveStateBeforeChange('转移道具');

        // Remove from source character
        this.removeItemFromCharacter(fromCharacterId, itemId);

        // Add to destination character
        this.addItemToCharacter(toCharacterId, itemId);

        this.notify('itemTransferred', { itemId, fromCharacterId, toCharacterId });
    }

    // Validate consistency between item.owner and character.heldItems
    validateItemsConsistency() {
        if (!this.currentStory) return { isConsistent: true, issues: [] };

        const issues = [];

        // Check each item
        this.currentStory.items.forEach(item => {
            if (item.owner) {
                const character = this.currentStory.characters.find(c => c.id === item.owner);
                if (!character) {
                    issues.push({
                        itemId: item.id,
                        issue: `道具 ${item.name} 的 owner ${item.owner} 指向不存在的角色`
                    });
                } else if (!character.heldItems || !character.heldItems.includes(item.id)) {
                    issues.push({
                        itemId: item.id,
                        issue: `道具 ${item.name} 的 owner 指向 ${character.name}，但不在其 heldItems 中`
                    });
                }
            }
        });

        // Check each character's heldItems
        this.currentStory.characters.forEach(character => {
            if (character.heldItems) {
                character.heldItems.forEach(itemId => {
                    const item = this.currentStory.items.find(i => i.id === itemId);
                    if (!item) {
                        issues.push({
                            itemId: itemId,
                            issue: `角色 ${character.name} 的 heldItems 包含不存在的道具 ${itemId}`
                        });
                    } else if (item.owner !== character.id) {
                        issues.push({
                            itemId: itemId,
                            issue: `道具 ${item.name} 在 ${character.name} 的 heldItems 中，但 owner 指向其他角色`
                        });
                    }
                });
            }
        });

        return {
            isConsistent: issues.length === 0,
            issues
        };
    }

    // Repair inconsistent item-owner relationships
    repairItemsConsistency() {
        if (!this.currentStory) return;

        this.saveStateBeforeChange('修复数据一致性');

        // Rebuild heldItems arrays based on item.owner
        this.currentStory.characters.forEach(character => {
            character.heldItems = [];
        });

        this.currentStory.items.forEach(item => {
            if (item.owner) {
                const character = this.currentStory.characters.find(c => c.id === item.owner);
                if (character) {
                    if (!character.heldItems) {
                        character.heldItems = [];
                    }
                    character.heldItems.push(item.id);
                } else {
                    // Owner doesn't exist, reset owner
                    item.owner = null;
                }
            }
        });

        this.notify('dataRepaired', {});
        this.saveToLocalStorage();
    }

    // Item management
    addItem(itemData) {
        if (!this.currentStory) {
            throw new Error('没有加载的故事');
        }

        this.saveStateBeforeChange('添加道具');

        const item = {
            id: Formatters.generateId('item'),
            name: itemData.name || '新道具',
            type: itemData.type || 'other',
            description: itemData.description || '',
            properties: itemData.properties || { base: {}, current: {} },
            owner: itemData.owner || null,
            changeHistory: []
        };

        this.currentStory.items.push(item);
        this.notify('itemAdded', item);
        return item;
    }

    updateItem(itemId, updates) {
        if (!this.currentStory) return;

        this.saveStateBeforeChange('编辑道具');

        const item = this.currentStory.items.find(i => i.id === itemId);
        if (item) {
            // If owner is being changed, update heldItems
            if (updates.hasOwnProperty('owner')) {
                const oldOwner = item.owner;
                const newOwner = updates.owner;

                // Remove from old owner's heldItems
                if (oldOwner) {
                    const oldCharacter = this.currentStory.characters.find(c => c.id === oldOwner);
                    if (oldCharacter && oldCharacter.heldItems) {
                        const index = oldCharacter.heldItems.indexOf(itemId);
                        if (index !== -1) {
                            oldCharacter.heldItems.splice(index, 1);
                        }
                    }
                }

                // Add to new owner's heldItems
                if (newOwner) {
                    const newCharacter = this.currentStory.characters.find(c => c.id === newOwner);
                    if (newCharacter) {
                        if (!newCharacter.heldItems) {
                            newCharacter.heldItems = [];
                        }
                        if (!newCharacter.heldItems.includes(itemId)) {
                            newCharacter.heldItems.push(itemId);
                        }
                    }
                }
            }

            Object.assign(item, updates);
            this.notify('itemUpdated', item);
            // Auto-save to localStorage when content changes
            this.saveToLocalStorage();
        }
    }

    deleteItem(itemId) {
        if (!this.currentStory) return;

        this.saveStateBeforeChange('删除道具');

        const index = this.currentStory.items.findIndex(i => i.id === itemId);
        if (index !== -1) {
            this.currentStory.items.splice(index, 1);
            this.notify('itemDeleted', itemId);
        }
    }

    selectItem(itemId) {
        this.selectedItem = itemId;
        this.notify('itemSelected', itemId);
        // Auto-save to localStorage when selection changes
        this.saveToLocalStorage();
    }

    // Setting management
    addSetting(settingData) {
        if (!this.currentStory) {
            throw new Error('没有加载的故事');
        }

        this.saveStateBeforeChange('添加设定');

        const setting = {
            id: Formatters.generateId('setting'),
            name: settingData.name || '新设定',
            type: settingData.type || 'location',
            parentId: settingData.parentId || null,
            description: settingData.description || '',
            details: settingData.details || {}
        };

        this.currentStory.settings.push(setting);
        this.notify('settingAdded', setting);
        return setting;
    }

    updateSetting(settingId, updates) {
        if (!this.currentStory) return;

        this.saveStateBeforeChange('编辑设定');

        const setting = this.currentStory.settings.find(s => s.id === settingId);
        if (setting) {
            Object.assign(setting, updates);
            this.notify('settingUpdated', setting);
            // Auto-save to localStorage when content changes
            this.saveToLocalStorage();
        }
    }

    deleteSetting(settingId) {
        if (!this.currentStory) return;

        this.saveStateBeforeChange('删除设定');

        const index = this.currentStory.settings.findIndex(s => s.id === settingId);
        if (index !== -1) {
            this.currentStory.settings.splice(index, 1);
            this.notify('settingDeleted', settingId);
        }
    }

    selectSetting(settingId) {
        this.selectedSetting = settingId;
        this.notify('settingSelected', settingId);
        // Auto-save to localStorage when selection changes
        this.saveToLocalStorage();
    }

    // Element management
    addElement(elementData) {
        if (!this.currentStory) {
            throw new Error('没有加载的故事');
        }

        if (!this.currentStory.elements) {
            this.currentStory.elements = [];
        }

        this.saveStateBeforeChange('添加元素');

        const element = {
            id: Formatters.generateId('element'),
            type: elementData.type,
            name: elementData.name,
            description: elementData.description || '',
            keywords: elementData.keywords || [],
            ...elementData
        };

        this.currentStory.elements.push(element);
        this.notify('elementAdded', element);
        // Auto-save to localStorage when content changes
        this.saveToLocalStorage();

        return element;
    }

    deleteElement(elementId) {
        if (!this.currentStory) return;

        this.saveStateBeforeChange('删除元素');

        const index = this.currentStory.elements.findIndex(el => el.id === elementId);
        if (index !== -1) {
            this.currentStory.elements.splice(index, 1);
            this.notify('elementDeleted', elementId);
        }
    }

    selectElement(elementId) {
        this.selectedElement = elementId;
        this.notify('elementSelected', elementId);
        // Auto-save to localStorage when selection changes
        this.saveToLocalStorage();
    }

    // Auto-save
    enableAutoSave(interval = 300000) {
        this.disableAutoSave();
        this.autoSaveTimer = setInterval(() => {
            if (this.currentStory) {
                this.saveStory();
                // Also save to localStorage
                FileManager.saveToLocalStorage(Constants.STORAGE_KEYS.CURRENT_STORY, this.currentStory);
            }
        }, interval);
    }

    disableAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
        }
    }

    // Manual save to localStorage
    saveToLocalStorage() {
        if (this.currentStory) {
            // Save complete state including selected items and current view
            const stateToSave = {
                story: this.currentStory,
                selectedChapter: this.selectedChapter,
                selectedCharacter: this.selectedCharacter,
                selectedItem: this.selectedItem,
                selectedSetting: this.selectedSetting
            };
            return FileManager.saveToLocalStorage(Constants.STORAGE_KEYS.CURRENT_STORY, stateToSave);
        }
        return false;
    }

    // Load from localStorage
    loadFromLocalStorage() {
        const data = FileManager.loadFromLocalStorage(Constants.STORAGE_KEYS.CURRENT_STORY);
        if (data) {
            // Check if data is in old format (story only) or new format (with selected items)
            if (data.story) {
                // New format: contains selected items
                this.currentStory = data.story;
                this.selectedChapter = data.selectedChapter || null;
                this.selectedCharacter = data.selectedCharacter || null;
                this.selectedItem = data.selectedItem || null;
                this.selectedSetting = data.selectedSetting || null;
            } else {
                // Old format: story data only
                this.currentStory = data;
                this.selectedChapter = null;
                this.selectedCharacter = null;
                this.selectedItem = null;
                this.selectedSetting = null;
            }
            // Also save to localStorage after loading to ensure format consistency
            this.saveToLocalStorage();
            this.notify('storyLoaded', this.currentStory);
            return true;
        }
        return false;
    }

    // Event listeners
    on(event, callback) {
        this.listeners.push({ event, callback });
    }

    notify(event, data) {
        this.listeners
            .filter(l => l.event === event)
            .forEach(l => l.callback(data));
    }

    // Get current state (for history saving)
    getState() {
        return {
            story: this.currentStory,
            selectedChapter: this.selectedChapter,
            selectedCharacter: this.selectedCharacter,
            selectedItem: this.selectedItem,
            selectedSetting: this.selectedSetting
        };
    }

    // Add character to paragraph (for console convenience)
    addCharacterToParagraph(paragraphId, characterId) {
        if (!this.currentStory) {
            throw new Error('没有加载的故事');
        }

        const chapter = this.currentStory.chapters.find(c => c.id === this.selectedChapter);
        if (!chapter) {
            throw new Error('当前章节不存在');
        }

        const paragraph = chapter.paragraphs.find(p => p.id === paragraphId);
        if (!paragraph) {
            throw new Error('段落不存在');
        }

        const character = this.currentStory.characters.find(c => c.id === characterId);
        if (!character) {
            throw new Error('角色不存在');
        }

        this.saveStateBeforeChange('添加段落角色');

        // Initialize changes object if not present
        if (!paragraph.changes) {
            paragraph.changes = { characters: [], items: [], settings: [] };
        }

        // Add character to paragraph if not already present
        if (!paragraph.changes.characters.includes(characterId)) {
            paragraph.changes.characters.push(characterId);
        }

        this.notify('paragraphUpdated', { chapterId: this.selectedChapter, paragraph });
        this.saveToLocalStorage();
    }

    // Remove character from paragraph
    removeCharacterFromParagraph(paragraphId, characterId) {
        if (!this.currentStory) return;

        const chapter = this.currentStory.chapters.find(c => c.id === this.selectedChapter);
        if (!chapter || !chapter.paragraphs) return;

        const paragraph = chapter.paragraphs.find(p => p.id === paragraphId);
        if (!paragraph || !paragraph.changes || !paragraph.changes.characters) return;

        this.saveStateBeforeChange('移除段落角色');

        const index = paragraph.changes.characters.indexOf(characterId);
        if (index !== -1) {
            paragraph.changes.characters.splice(index, 1);
            this.notify('paragraphUpdated', { chapterId: this.selectedChapter, paragraph });
            this.saveToLocalStorage();
        }
    }

    // Convenience method: give item to character in paragraph
    giveItemToCharacter(paragraphId, characterId, itemId) {
        this.addCharacterToParagraph(paragraphId, characterId);
        this.addItemToCharacter(characterId, itemId);
    }

    // Convenience method: create item and give to character
    createAndGiveItem(paragraphId, characterId, itemData) {
        const item = this.addItem(itemData);
        this.addCharacterToParagraph(paragraphId, characterId);
        this.addItemToCharacter(characterId, item.id);
        return item;
    }

    // Get paragraph info (for console convenience)
    getParagraphInfo(paragraphId) {
        if (!this.currentStory) return null;

        const chapter = this.currentStory.chapters.find(c => c.id === this.selectedChapter);
        if (!chapter) return null;

        const paragraph = chapter.paragraphs.find(p => p.id === paragraphId);
        if (!paragraph) return null;

        const info = {
            id: paragraph.id,
            content: paragraph.content,
            changes: paragraph.changes || { characters: [], items: [], settings: [] },
            characters: [],
            items: []
        };

        // Resolve character details
        if (paragraph.changes && paragraph.changes.characters) {
            info.characters = paragraph.changes.characters
                .map(charId => this.currentStory.characters.find(c => c.id === charId))
                .filter(c => c)
                .map(c => ({
                    id: c.id,
                    name: c.name,
                    heldItems: c.heldItems || []
                }));
        }

        // Resolve item details
        if (paragraph.changes && paragraph.changes.items) {
            info.items = paragraph.changes.items
                .map(itemId => this.currentStory.items.find(i => i.id === itemId))
                .filter(i => i)
                .map(i => ({
                    id: i.id,
                    name: i.name,
                    owner: i.owner
                }));
        }

        return info;
    }

    // Console helper: list all paragraphs in current chapter
    listParagraphs() {
        if (!this.currentStory) return [];

        const chapter = this.currentStory.chapters.find(c => c.id === this.selectedChapter);
        if (!chapter) return [];

        return chapter.paragraphs.map(p => ({
            id: p.id,
            content: p.content.substring(0, 50) + (p.content.length > 50 ? '...' : ''),
            characters: (p.changes && p.changes.characters) || []
        }));
    }

    // Console helper: list all characters
    listCharacters() {
        if (!this.currentStory) return [];

        return this.currentStory.characters.map(c => ({
            id: c.id,
            name: c.name,
            heldItems: c.heldItems || []
        }));
    }

    // Console helper: list all items
    listItems() {
        if (!this.currentStory) return [];

        return this.currentStory.items.map(i => ({
            id: i.id,
            name: i.name,
            type: i.type,
            owner: i.owner
        }));
    }

    // Console helper: find character by name
    findCharacterByName(name) {
        if (!this.currentStory) return null;

        return this.currentStory.characters.find(c => c.name === name);
    }

    // Console helper: find item by name
    findItemByName(name) {
        if (!this.currentStory) return null;

        return this.currentStory.items.find(i => i.name === name);
    }

    // Undo/Redo support
    saveStateBeforeChange(description = 'Action') {
        if (!this.historyEnabled || !this.currentStory) return;

        const stateSnapshot = {
            story: this.currentStory,
            selectedChapter: this.selectedChapter,
            selectedCharacter: this.selectedCharacter,
            selectedItem: this.selectedItem,
            selectedSetting: this.selectedSetting
        };

        this.history.pushState(stateSnapshot, description);
    }

    undo() {
        if (!this.currentStory) return false;

        const previousState = this.history.undo(this.getState());

        if (previousState && previousState.story) {
            this.currentStory = previousState.story;
            this.selectedChapter = previousState.selectedChapter;
            this.selectedCharacter = previousState.selectedCharacter;
            this.selectedItem = previousState.selectedItem;
            this.selectedSetting = previousState.selectedSetting;
            this.notify('stateRestored', { direction: 'undo', state: previousState });
            return true;
        }
        return false;
    }

    redo() {
        if (!this.currentStory) return false;

        const nextState = this.history.redo(this.getState());

        if (nextState && nextState.story) {
            this.currentStory = nextState.story;
            this.selectedChapter = nextState.selectedChapter;
            this.selectedCharacter = nextState.selectedCharacter;
            this.selectedItem = nextState.selectedItem;
            this.selectedSetting = nextState.selectedSetting;
            this.notify('stateRestored', { direction: 'redo', state: nextState });
            return true;
        }
        return false;
    }

    enableHistory() {
        this.historyEnabled = true;
    }

    disableHistory() {
        this.historyEnabled = false;
    }

    getHistoryStatus() {
        return this.history.getStatus();
    }
}

// Initialize global state
const appState = new AppState();

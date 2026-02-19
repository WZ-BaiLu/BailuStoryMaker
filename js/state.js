// Application State Management

class AppState {
    constructor() {
        this.currentStory = null;
        this.selectedChapter = null;
        this.selectedCharacter = null;
        this.selectedItem = null;
        this.selectedSetting = null;
        this.autoSaveTimer = null;
        this.listeners = [];
        this.history = new HistoryManager(50);
        this.historyEnabled = true;
    }

    // Load story
    loadStory(storyData) {
        try {
            this.currentStory = storyData;
            this.selectedChapter = null;
            this.selectedCharacter = null;
            this.selectedItem = null;
            this.selectedSetting = null;
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
    addParagraph(chapterId) {
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
        chapter.paragraphs.push(paragraph);

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
            notes: characterData.notes || ''
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

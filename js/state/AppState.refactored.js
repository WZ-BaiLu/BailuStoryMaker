/**
 * AppState (Refactored)
 * Application state management with modular state transitions
 * 
 * Refactoring improvements:
 * 1. Extracted state transitions to pure functions
 * 2. Separated concerns: paragraph, character, item states
 * 3. Improved error handling
 * 4. Reduced updateItem complexity (11 cyclomatic complexity -> < 5)
 */

class AppState {
    constructor() {
        this.currentStory = null;
        this.selectedChapter = null;
        this.selectedParagraph = null;
        this.selectedCharacter = null;
        this.selectedItem = null;
        this.selectedSetting = null;
        this.selectedElement = null;
        this.autoSaveTimer = null;
        this.listeners = [];
        this.history = new HistoryManager(50);
        this.historyEnabled = true;
    }

    // ==================== Story Management ====================

    /**
     * Load story
     */
    loadStory(storyData) {
        try {
            this._fixStoryElements(storyData);
            this.currentStory = storyData;
            this._clearSelections();
            this.history.clear();
            this.saveToLocalStorage();
            this.notify('storyLoaded', storyData);
            return true;
        } catch (error) {
            console.error('[AppState] Load story failed:', error);
            return false;
        }
    }

    /**
     * Fix any existing elements with empty/null data
     * @private
     */
    _fixStoryElements(storyData) {
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
    }

    /**
     * Clear all selections
     * @private
     */
    _clearSelections() {
        this.selectedChapter = null;
        this.selectedCharacter = null;
        this.selectedItem = null;
        this.selectedSetting = null;
        this.selectedElement = null;
    }

    /**
     * Create new story
     */
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
        this.history.clear();
        return this.loadStory(newStory);
    }

    /**
     * Save current story
     */
    saveStory() {
        if (!this.currentStory) {
            throw new Error('没有加载的故事');
        }

        this.currentStory.metadata.updatedAt = Formatters.formatDate();
        this.notify('storySaved', this.currentStory);

        const storyToExport = JSON.parse(JSON.stringify(this.currentStory));
        delete storyToExport.characters;
        delete storyToExport.items;

        return storyToExport;
    }

    // ==================== Chapter Management ====================

    /**
     * Add chapter
     */
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

    /**
     * Update chapter
     */
    updateChapter(chapterId, updates) {
        if (!this.currentStory) return;

        this.saveStateBeforeChange('编辑章节');

        const chapter = this.currentStory.chapters.find(c => c.id === chapterId);
        if (chapter) {
            Object.assign(chapter, updates, { updatedAt: Formatters.formatDate() });
            this.notify('chapterUpdated', chapter);
            this.saveToLocalStorage();
        }
    }

    /**
     * Delete chapter
     */
    deleteChapter(chapterId) {
        if (!this.currentStory) return;

        this.saveStateBeforeChange('删除章节');

        const index = this.currentStory.chapters.findIndex(c => c.id === chapterId);
        if (index !== -1) {
            this.currentStory.chapters.splice(index, 1);
            this._reorderChapters();
            this.notify('chapterDeleted', chapterId);
        }
    }

    /**
     * Reorder chapters after deletion
     * @private
     */
    _reorderChapters() {
        this.currentStory.chapters.forEach((ch, i) => ch.order = i + 1);
    }

    /**
     * Select chapter
     */
    selectChapter(chapterId) {
        this.selectedChapter = chapterId;
        this.selectedParagraph = null;
        this.notify('chapterSelected', chapterId);
        this.saveToLocalStorage();
    }

    // ==================== Paragraph Management ====================

    /**
     * Add paragraph
     */
    addParagraph(chapterId, paragraphData) {
        const chapter = this._findChapter(chapterId);
        if (!chapter) throw new Error('章节不存在');

        this.saveStateBeforeChange('添加段落');

        const result = ParagraphState.addParagraph(chapter.paragraphs, paragraphData);
        chapter.paragraphs = result.paragraphs;

        this.notify('paragraphAdded', result.paragraph);
        return result.paragraph;
    }

    /**
     * Update paragraph
     */
    updateParagraph(chapterId, paragraphId, updates) {
        const chapter = this._findChapter(chapterId);
        if (!chapter) return;

        this.saveStateBeforeChange('编辑段落');

        chapter.paragraphs = ParagraphState.updateParagraph(chapter.paragraphs, paragraphId, updates);
        this.notify('paragraphUpdated', { chapterId, paragraphId, updates });
        this.saveToLocalStorage();
    }

    /**
     * Delete paragraph
     */
    deleteParagraph(chapterId, paragraphId) {
        const chapter = this._findChapter(chapterId);
        if (!chapter) return;

        this.saveStateBeforeChange('删除段落');

        chapter.paragraphs = ParagraphState.deleteParagraph(chapter.paragraphs, paragraphId);
        this.notify('paragraphDeleted', { chapterId, paragraphId });
    }

    /**
     * Select paragraph
     */
    selectParagraph(paragraphId) {
        this.selectedParagraph = paragraphId;
        this.notify('paragraphSelected', paragraphId);
    }

    // ==================== Character Management ====================

    /**
     * Add character
     */
    addCharacter(data) {
        if (!this.currentStory) {
            throw new Error('没有加载的故事');
        }

        this.saveStateBeforeChange('添加角色');

        const character = CharacterState.createCharacter(data);
        this.currentStory.characters.push(character);

        this.notify('characterAdded', character);
        return character;
    }

    /**
     * Update character
     */
    updateCharacter(characterId, updates) {
        if (!this.currentStory) return;

        this.saveStateBeforeChange('编辑角色');

        const character = this._findCharacter(characterId);
        if (character) {
            Object.assign(character, CharacterState.updateCharacter(character, updates), {
                updatedAt: Formatters.formatDate()
            });
            this.notify('characterUpdated', character);
            this.saveToLocalStorage();
        }
    }

    /**
     * Delete character
     */
    deleteCharacter(characterId) {
        if (!this.currentStory) return;

        this.saveStateBeforeChange('删除角色');

        const index = this.currentStory.characters.findIndex(c => c.id === characterId);
        if (index !== -1) {
            this.currentStory.characters.splice(index, 1);
            this.notify('characterDeleted', characterId);
        }
    }

    /**
     * Select character
     */
    selectCharacter(characterId) {
        this.selectedCharacter = characterId;
        this.notify('characterSelected', characterId);
    }

    // ==================== Item Management ====================

    /**
     * Add item
     */
    addItem(data) {
        if (!this.currentStory) {
            throw new Error('没有加载的故事');
        }

        this.saveStateBeforeChange('添加道具');

        const item = ItemState.createItem(data);
        this.currentStory.items.push(item);

        this.notify('itemAdded', item);
        return item;
    }

    /**
     * Update item
     */
    updateItem(itemId, updates) {
        if (!this.currentStory) return;

        this.saveStateBeforeChange('编辑道具');

        const item = this._findItem(itemId);
        if (item) {
            Object.assign(item, ItemState.updateItem(item, updates), {
                updatedAt: Formatters.formatDate()
            });
            this.notify('itemUpdated', item);
            this.saveToLocalStorage();
        }
    }

    /**
     * Delete item
     */
    deleteItem(itemId) {
        if (!this.currentStory) return;

        this.saveStateBeforeChange('删除道具');

        const index = this.currentStory.items.findIndex(i => i.id === itemId);
        if (index !== -1) {
            this.currentStory.items.splice(index, 1);
            this.notify('itemDeleted', itemId);
        }
    }

    /**
     * Select item
     */
    selectItem(itemId) {
        this.selectedItem = itemId;
        this.notify('itemSelected', itemId);
    }

    // ==================== Element Management ====================

    /**
     * Add element (unified element system)
     */
    addElement(data) {
        if (!this.currentStory) {
            throw new Error('没有加载的故事');
        }

        this.saveStateBeforeChange('添加元素');

        const element = {
            id: Formatters.generateId('element'),
            type: data.type || 'base',
            name: data.name || '未命名元素',
            description: data.description || '',
            notes: data.notes || '',
            state: data.state || {},
            createdAt: Formatters.formatDate(),
            updatedAt: Formatters.formatDate()
        };

        this.currentStory.elements.push(element);
        this.notify('elementAdded', element);
        return element;
    }

    /**
     * Update element
     */
    updateElement(elementId, updates) {
        if (!this.currentStory) return;

        this.saveStateBeforeChange('编辑元素');

        const element = this._findElement(elementId);
        if (element) {
            Object.assign(element, updates, { updatedAt: Formatters.formatDate() });
            this.notify('elementUpdated', element);
            this.saveToLocalStorage();
        }
    }

    /**
     * Delete element
     */
    deleteElement(elementId) {
        if (!this.currentStory) return;

        this.saveStateBeforeChange('删除元素');

        const index = this.currentStory.elements.findIndex(e => e.id === elementId);
        if (index !== -1) {
            this.currentStory.elements.splice(index, 1);
            this.notify('elementDeleted', elementId);
        }
    }

    /**
     * Select element
     */
    selectElement(elementId) {
        this.selectedElement = elementId;
        this.notify('elementSelected', elementId);
    }

    // ==================== Helper Methods ====================

    /**
     * Find chapter by ID
     * @private
     */
    _findChapter(chapterId) {
        return this.currentStory?.chapters.find(c => c.id === chapterId);
    }

    /**
     * Find character by ID
     * @private
     */
    _findCharacter(characterId) {
        return this.currentStory?.characters.find(c => c.id === characterId);
    }

    /**
     * Find item by ID
     * @private
     */
    _findItem(itemId) {
        return this.currentStory?.items.find(i => i.id === itemId);
    }

    /**
     * Find element by ID
     * @private
     */
    _findElement(elementId) {
        return this.currentStory?.elements.find(e => e.id === elementId);
    }

    // ==================== History & Persistence ====================

    /**
     * Save state before change (for undo/redo)
     */
    saveStateBeforeChange(actionName) {
        if (!this.historyEnabled) return;

        const stateSnapshot = JSON.stringify(this.currentStory);
        this.history.push({ action: actionName, state: stateSnapshot });
    }

    /**
     * Undo last change
     */
    undo() {
        const previousState = this.history.pop();
        if (previousState) {
            this.currentStory = JSON.parse(previousState.state);
            this.notify('undo', previousState.action);
            return true;
        }
        return false;
    }

    /**
     * Save to localStorage
     */
    saveToLocalStorage() {
        if (!this.currentStory) return;

        try {
            localStorage.setItem('currentStory', JSON.stringify(this.currentStory));
        } catch (error) {
            console.error('[AppState] Failed to save to localStorage:', error);
        }
    }

    /**
     * Load from localStorage
     */
    loadFromLocalStorage() {
        try {
            const savedStory = localStorage.getItem('currentStory');
            if (savedStory) {
                return this.loadStory(JSON.parse(savedStory));
            }
        } catch (error) {
            console.error('[AppState] Failed to load from localStorage:', error);
        }
        return false;
    }

    // ==================== Event System ====================

    /**
     * Subscribe to state changes
     */
    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index !== -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    /**
     * Notify listeners of state change
     * @private
     */
    notify(eventType, data) {
        this.listeners.forEach(listener => {
            try {
                listener(eventType, data);
            } catch (error) {
                console.error(`[AppState] Listener error for ${eventType}:`, error);
            }
        });
    }
}

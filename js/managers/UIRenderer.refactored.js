/**
 * UIRenderer (Refactored)
 * Handles rendering of all UI components and views
 * 
 * Refactoring improvements:
 * 1. Extracted ChangeEditor - handles element change modals
 * 2. Extracted ElementListRenderer - handles element list rendering
 * 3. Added error handling with UIErrorHandler
 * 4. Reduced code duplication
 * 5. Reduced complexity in renderElements (99 lines -> ~10 lines)
 */
class UIRenderer {
    /**
     * Create a UIRenderer instance
     * @param {App} app - The main app instance
     * @param {Object} state - The app state manager
     */
    constructor(app, state) {
        this.app = app;
        this.state = state;
        this.selectedParagraph = null;
        this.editingParagraph = null;
        this.expandedTimelines = new Set();
        this.timelineCacheKey = 'timeline-expanded-state';

        // Initialize sub-modules
        this.changeEditor = new ChangeEditor(state, app);
        this.elementListRenderer = new ElementListRenderer(state);
        this.errorHandler = new UIErrorHandler('UIRenderer');

        // Load expanded timelines from localStorage
        this.loadTimelineStateFromStorage();

        // Initialize global timeline controls after DOM is ready
        setTimeout(() => {
            this.initGlobalTimelineControls();
        }, 100);
    }

    // ==================== Story and Paragraph Rendering ====================

    /**
     * Render the chapters list
     */
    renderChapters() {
        try {
            const container = document.getElementById('chapters');
            const story = this.state.currentStory;
            if (!story) return;

            container.innerHTML = story.chapters
                .sort((a, b) => a.order - b.order)
                .map(chapter => `
                    <div class="list-item ${this.state.selectedChapter === chapter.id ? 'active' : ''}"
                         data-chapter-id="${chapter.id}">
                        <div class="list-item-header">
                            <span class="list-item-title">${chapter.order}. ${chapter.title}</span>
                            <div class="list-item-actions">
                                <button class="btn btn-sm btn-delete" data-action="delete-chapter" data-chapter-id="${chapter.id}">删除</button>
                            </div>
                        </div>
                    </div>
                `).join('');

            this.bindChapterEvents(container);

            if (story.chapters.length === 0) {
                container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📖</div><div class="empty-state-text">${i18n.t('messages.noChapters')}</div></div>`;
            }
        } catch (error) {
            this.errorHandler.handleError('renderChapters', error, {
                silent: false,
                message: '章节列表渲染失败'
            });
        }
    }

    /**
     * Bind chapter-related events
     * @param {HTMLElement} container - The chapters container
     */
    bindChapterEvents(container) {
        container.querySelectorAll('.list-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn-delete')) {
                    const chapterId = item.dataset.chapterId;
                    this.state.selectChapter(chapterId);
                    this.renderChapters();
                    this.renderChapterEditor(chapterId);
                }
            });
        });

        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const chapterId = btn.dataset.chapterId;
                if (confirm(i18n.t('messages.confirmDeleteChapter'))) {
                    this.state.deleteChapter(chapterId);
                    this.renderChapters();
                    if (this.state.selectedChapter === chapterId) {
                        this.state.selectChapter(null);
                        this.renderChapterEditor(null);
                    }
                }
            });
        });
    }

    /**
     * Render the chapter editor
     * @param {string|null} chapterId - The chapter ID to render
     */
    renderChapterEditor(chapterId) {
        try {
            const contentPanel = document.getElementById('chapter-editor-content');
            const placeholderPanel = document.getElementById('chapter-editor-placeholder');
            const titleInput = document.getElementById('chapter-title');
            const story = this.state.currentStory;

            if (!chapterId || !story) {
                contentPanel.classList.add('hidden');
                placeholderPanel.classList.add('active');
                document.getElementById('changes-tracker').classList.remove('visible');
                return;
            }

            const chapter = story.chapters.find(c => c.id === chapterId);
            if (chapter) {
                contentPanel.classList.remove('hidden');
                placeholderPanel.classList.remove('active');

                titleInput.value = chapter.title;
                titleInput.disabled = false;

                titleInput.oninput = () => {
                    this.state.updateChapter(chapterId, { title: titleInput.value });
                };

                this.renderParagraphs();
            }
        } catch (error) {
            this.errorHandler.handleError('renderChapterEditor', error, {
                silent: false,
                message: '章节编辑器渲染失败'
            });
        }
    }

    /**
     * Render paragraphs list
     */
    renderParagraphs() {
        try {
            const container = document.getElementById('paragraphs');
            const story = this.state.currentStory;
            if (!story) return;

            const chapter = story.chapters.find(c => c.id === this.state.selectedChapter);
            if (!chapter) return;

            container.innerHTML = chapter.paragraphs
                .sort((a, b) => a.order - b.order)
                .map(paragraph => this._renderParagraphItem(paragraph))
                .join('');

            this.bindParagraphEvents(container);

            if (chapter.paragraphs.length === 0) {
                container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📝</div><div class="empty-state-text">${i18n.t('messages.noParagraphs')}</div></div>`;
            }
        } catch (error) {
            this.errorHandler.handleError('renderParagraphs', error, {
                silent: false,
                message: '段落列表渲染失败'
            });
        }
    }

    /**
     * Render single paragraph item
     * @param {Object} paragraph - Paragraph object
     * @returns {string} HTML string
     */
    _renderParagraphItem(paragraph) {
        const contentPreview = paragraph.content.length > 100
            ? paragraph.content.substring(0, 100) + '...'
            : paragraph.content;

        const timelineHtml = this.renderParagraphChanges(paragraph);

        return `
            <div class="list-item paragraph-item ${this.selectedParagraph === paragraph.id ? 'active' : ''}"
                 data-paragraph-id="${paragraph.id}">
                <div class="list-item-header">
                    <span class="list-item-title">${contentPreview}</span>
                    <div class="list-item-actions">
                        <button class="btn btn-sm btn-delete" data-action="delete-paragraph" data-paragraph-id="${paragraph.id}">删除</button>
                    </div>
                </div>
                ${timelineHtml}
            </div>
        `;
    }

    /**
     * Bind paragraph events
     * @param {HTMLElement} container - Paragraphs container
     */
    bindParagraphEvents(container) {
        container.querySelectorAll('.list-item').forEach(item => {
            const paragraphId = item.dataset.paragraphId;

            // Edit button
            const editBtn = item.querySelector('.btn-edit');
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.editParagraph(paragraphId);
                });
            }

            // Delete button
            const deleteBtn = item.querySelector('.btn-delete');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm(i18n.t('messages.confirmDeleteParagraph'))) {
                        this.state.deleteParagraph(paragraphId);
                        this.renderParagraphs();
                    }
                });
            }

            // Edit change buttons
            item.querySelectorAll('.btn-edit-change').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const type = btn.dataset.type;
                    if (type === 'character') {
                        this.changeEditor.showEditCharacterChangeModal(paragraphId, btn.dataset.characterId);
                    } else if (type === 'item') {
                        // TODO: Implement item change editing
                        console.warn('[UIRenderer] Item change editing not yet implemented');
                    }
                });
            });

            // Summarize state button
            const summarizeBtn = item.querySelector('.btn-summarize-state');
            if (summarizeBtn) {
                summarizeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.summarizeParagraphState(paragraphId);
                });
            }

            // Toggle timeline expansion
            const timelineContent = item.querySelector('.paragraph-timeline-content');
            if (timelineContent) {
                timelineContent.addEventListener('click', (e) => {
                    e.stopPropagation();

                    if (e.target.closest('button')) return;
                    if (e.target.closest('.timeline-empty-message')) return;
                    if (e.target.closest('.timeline-actions')) return;

                    const isCollapsed = timelineContent.classList.contains('collapsed');
                    if (isCollapsed) {
                        timelineContent.classList.remove('collapsed');
                        this.expandedTimelines.add(paragraphId);
                    } else {
                        timelineContent.classList.add('collapsed');
                        this.expandedTimelines.delete(paragraphId);
                    }

                    this.saveTimelineStateToStorage();
                });
            }
        });
    }

    /**
     * Render paragraph timeline (characters and items changes)
     * @param {Object} paragraph - The paragraph object
     * @returns {string} HTML string for timeline
     */
    renderParagraphChanges(paragraph) {
        console.log('[UIRenderer] renderParagraphChanges called for paragraph:', paragraph.id);
        console.log('[UIRenderer] Paragraph changes:', paragraph.changes);

        const story = this.state.currentStory;
        const changes = [];

        // Element changes (unified element system)
        if (paragraph.changes && paragraph.changes.elements) {
            paragraph.changes.elements.forEach(elementChange => {
                const elementId = elementChange.elementId;

                if (elementChange.elementType === 'character') {
                    const character = story?.characters?.find(c => c.id === elementId);
                    if (character) {
                        const changeDetails = this.formatCharacterChange({
                            characterId: elementId,
                            changes: elementChange.changes
                        });
                        changes.push(`
                            <div class="timeline-change-item character" data-change-type="character" data-character-id="${elementId}">
                                <span class="timeline-change-icon">👤</span>
                                <div class="timeline-change-content">
                                    <div class="timeline-change-name">${character.name} <button class="btn-edit-change" data-type="character" data-paragraph-id="${paragraph.id}" data-character-id="${elementId}">✏️</button></div>
                                    ${changeDetails}
                                </div>
                            </div>
                        `);
                    }
                } else if (elementChange.elementType === 'item') {
                    const item = story?.items?.find(i => i.id === elementId);
                    if (item) {
                        const changeDetails = this.formatItemChange({
                            itemId: elementId,
                            changes: elementChange.changes
                        });
                        changes.push(`
                            <div class="timeline-change-item item" data-change-type="item" data-item-id="${elementId}">
                                <span class="timeline-change-icon">🎒</span>
                                <div class="timeline-change-content">
                                    <div class="timeline-change-name">${item.name} <button class="btn-edit-change" data-type="item" data-paragraph-id="${paragraph.id}" data-item-id="${elementId}">✏️</button></div>
                                    ${changeDetails}
                                </div>
                            </div>
                        `);
                    }
                }
            });
        }

        if (changes.length === 0) {
            return '';
        }

        const isExpanded = this.expandedTimelines.has(paragraph.id);
        const collapsedClass = isExpanded ? '' : 'collapsed';

        return `
            <div class="paragraph-timeline">
                <div class="timeline-toggle" data-paragraph-id="${paragraph.id}">
                    <span class="timeline-toggle-icon">${isExpanded ? '▼' : '▶'}</span>
                    <span>时间线 (${changes.length})</span>
                </div>
                <div class="paragraph-timeline-content ${collapsedClass}">
                    ${changes.join('')}
                </div>
            </div>
        `;
    }

    /**
     * Format character change for display
     * @param {Object} change - Character change object
     * @returns {string} HTML string
     */
    formatCharacterChange(change) {
        const details = [];

        if (change.changes?.attributes) {
            Object.entries(change.changes.attributes).forEach(([key, value]) => {
                details.push(`<div class="timeline-change-detail">📊 ${key}: ${value}</div>`);
            });
        }

        if (change.changes?.emotionalState) {
            const emotionLabels = {
                happy: '😊 开心',
                sad: '😢 悲伤',
                angry: '😠 愤怒',
                fear: '😨 恐惧',
                neutral: '😐 平静'
            };
            details.push(`<div class="timeline-change-detail">😊 ${emotionLabels[change.changes.emotionalState] || change.changes.emotionalState}</div>`);
        }

        return details.join('');
    }

    /**
     * Format item change for display
     * @param {Object} change - Item change object
     * @returns {string} HTML string
     */
    formatItemChange(change) {
        const details = [];

        if (change.changes?.properties) {
            Object.entries(change.changes.properties).forEach(([key, value]) => {
                details.push(`<div class="timeline-change-detail">📊 ${key}: ${value}</div>`);
            });
        }

        if (change.changes?.state) {
            details.push(`<div class="timeline-change-detail">🔄 状态: ${change.changes.state}</div>`);
        }

        return details.join('');
    }

    // ==================== Element Rendering ====================

    /**
     * Render all elements - delegated to ElementListRenderer
     * Reduced from 99 lines to ~10 lines
     */
    renderElements() {
        try {
            this.elementListRenderer.renderAllElements();
            this.bindElementEvents();
        } catch (error) {
            this.errorHandler.handleError('renderElements', error, {
                silent: false,
                message: '元素列表渲染失败'
            });
        }
    }

    /**
     * Bind element events for all containers
     */
    bindElementEvents() {
        const containers = [
            document.getElementById('all-elements'),
            document.getElementById('characters'),
            document.getElementById('items'),
            document.getElementById('settings')
        ].filter(c => c);

        containers.forEach(container => {
            container.querySelectorAll('.list-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    if (!e.target.classList.contains('btn-delete')) {
                        const elementId = item.dataset.elementId;
                        this.state.selectElement(elementId);
                        this.renderElements();
                        this.renderElementEditor(elementId);
                    }
                });
            });

            container.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const elementId = btn.dataset.elementId;
                    if (confirm('确定要删除这个元素吗？')) {
                        this.state.deleteElement(elementId);
                        this.renderElements();
                        if (this.state.selectedElement === elementId) {
                            this.state.selectElement(null);
                            this.renderElementEditor(null);
                        }
                    }
                });
            });
        });
    }

    /**
     * Render character editor
     * @param {string|null} characterId - The character ID to render
     */
    renderCharacterEditor(characterId) {
        try {
            const contentPanel = document.getElementById('character-editor-content');
            const placeholderPanel = document.getElementById('character-editor-placeholder');
            const story = this.state.currentStory;

            if (!characterId || !story) {
                contentPanel.classList.add('hidden');
                placeholderPanel.classList.add('active');
                this.clearCharacterForm();
                return;
            }

            const character = story.characters.find(c => c.id === characterId);
            if (character) {
                contentPanel.classList.remove('hidden');
                placeholderPanel.classList.remove('active');

                document.getElementById('char-name').value = character.name;
                document.getElementById('char-description').value = character.description || '';
                document.getElementById('char-notes').value = character.notes || '';
                this.renderAttributes(character.attributes);
                this.renderAbilities(character.abilities);
                this.renderElementState(character, 'character');
            } else {
                contentPanel.classList.add('hidden');
                placeholderPanel.classList.add('active');
                this.clearCharacterForm();
            }
        } catch (error) {
            this.errorHandler.handleError('renderCharacterEditor', error, {
                silent: false,
                message: '角色编辑器渲染失败'
            });
        }
    }

    /**
     * Render attributes list
     * @param {Object} attributes - Attributes object
     */
    renderAttributes(attributes) {
        const container = document.getElementById('char-attributes');
        container.innerHTML = '';

        if (!attributes) return;

        Object.entries(attributes).forEach(([key, value]) => {
            const entry = document.createElement('div');
            entry.className = 'attribute-entry';
            entry.innerHTML = `
                <input type="text" class="input-field attr-name" value="${key}" placeholder="${i18n.t('placeholders.attributeName')}">
                <input type="text" class="input-field attr-value" value="${value}" placeholder="${i18n.t('placeholders.attributeValue')}">
                <button type="button" class="btn btn-delete">${i18n.t('placeholders.delete')}</button>
            `;
            container.appendChild(entry);

            entry.querySelector('.btn-delete').addEventListener('click', () => {
                entry.remove();
            });
        });
    }

    /**
     * Render abilities list
     * @param {Array} abilities - Abilities array
     */
    renderAbilities(abilities) {
        const container = document.getElementById('char-abilities');
        container.innerHTML = '';

        if (!abilities) return;

        abilities.forEach((ability, index) => {
            const entry = document.createElement('div');
            entry.className = 'ability-entry';
            entry.innerHTML = `
                <input type="text" class="input-field ability-name" value="${ability.name}" placeholder="${i18n.t('placeholders.abilityName')}">
                <input type="text" class="input-field ability-level" value="${ability.level}" placeholder="${i18n.t('placeholders.abilityLevel')}">
                <button type="button" class="btn btn-delete">${i18n.t('placeholders.delete')}</button>
            `;
            container.appendChild(entry);

            entry.querySelector('.btn-delete').addEventListener('click', () => {
                entry.remove();
            });
        });
    }

    /**
     * Render element state
     * @param {Object} element - Element object
     * @param {string} type - Element type
     */
    renderElementState(element, type) {
        const container = document.getElementById(`element-state-${type}`);
        if (!container) return;

        container.innerHTML = '';

        if (!element.state) return;

        Object.entries(element.state).forEach(([key, value]) => {
            const entry = document.createElement('div');
            entry.className = 'state-entry';
            entry.innerHTML = `
                <input type="text" class="input-field state-name" value="${key}" placeholder="${i18n.t('placeholders.stateName')}">
                <input type="text" class="input-field state-value" value="${value}" placeholder="${i18n.t('placeholders.stateValue')}">
                <button type="button" class="btn btn-delete">${i18n.t('placeholders.delete')}</button>
            `;
            container.appendChild(entry);

            entry.querySelector('.btn-delete').addEventListener('click', () => {
                entry.remove();
            });
        });
    }

    /**
     * Clear character form
     */
    clearCharacterForm() {
        document.getElementById('char-name').value = '';
        document.getElementById('char-description').value = '';
        document.getElementById('char-notes').value = '';
        document.getElementById('char-attributes').innerHTML = '';
        document.getElementById('char-abilities').innerHTML = '';
        
        const stateContainer = document.getElementById('element-state-character');
        if (stateContainer) {
            stateContainer.innerHTML = '';
        }
    }

    // ==================== Item Rendering ====================

    /**
     * Render item editor
     * @param {string|null} itemId - The item ID to render
     */
    renderItemEditor(itemId) {
        try {
            const contentPanel = document.getElementById('item-editor-content');
            const placeholderPanel = document.getElementById('item-editor-placeholder');
            const story = this.state.currentStory;

            if (!itemId || !story) {
                contentPanel.classList.add('hidden');
                placeholderPanel.classList.add('active');
                this.clearItemForm();
                return;
            }

            const item = story.items.find(i => i.id === itemId);
            if (item) {
                contentPanel.classList.remove('hidden');
                placeholderPanel.classList.remove('active');

                document.getElementById('item-name').value = item.name;
                document.getElementById('item-description').value = item.description || '';
                document.getElementById('item-notes').value = item.notes || '';
                this.renderItemProperties(item.properties);
                this.renderElementState(item, 'item');
            } else {
                contentPanel.classList.add('hidden');
                placeholderPanel.classList.add('active');
                this.clearItemForm();
            }
        } catch (error) {
            this.errorHandler.handleError('renderItemEditor', error, {
                silent: false,
                message: '道具编辑器渲染失败'
            });
        }
    }

    /**
     * Render item properties
     * @param {Object} properties - The properties object
     */
    renderItemProperties(properties) {
        const container = document.getElementById('item-properties');
        container.innerHTML = '';
        if (!properties) return;

        Object.entries(properties.current || {}).forEach(([key, value]) => {
            const entry = document.createElement('div');
            entry.className = 'property-entry';
            entry.innerHTML = `
                <input type="text" class="input-field prop-name" value="${key}" placeholder="${i18n.t('placeholders.propertyName')}">
                <input type="text" class="input-field prop-value value-input" value="${value}" placeholder="${i18n.t('placeholders.propertyValue')}">
                <button type="button" class="btn btn-delete">${i18n.t('placeholders.delete')}</button>
            `;
            container.appendChild(entry);

            entry.querySelector('.btn-delete').addEventListener('click', () => {
                entry.remove();
            });
        });
    }

    /**
     * Clear item form
     */
    clearItemForm() {
        document.getElementById('item-name').value = '';
        document.getElementById('item-description').value = '';
        document.getElementById('item-notes').value = '';
        document.getElementById('item-properties').innerHTML = '';

        const stateContainer = document.getElementById('element-state-item');
        if (stateContainer) {
            stateContainer.innerHTML = '';
        }
    }

    // ==================== Timeline State Management ====================

    /**
     * Load timeline state from localStorage
     */
    loadTimelineStateFromStorage() {
        try {
            const savedState = localStorage.getItem(this.timelineCacheKey);
            if (savedState) {
                const expanded = JSON.parse(savedState);
                this.expandedTimelines = new Set(expanded);
            }
        } catch (error) {
            console.error('[UIRenderer] Failed to load timeline state:', error);
        }
    }

    /**
     * Save timeline state to localStorage
     */
    saveTimelineStateToStorage() {
        try {
            const state = Array.from(this.expandedTimelines);
            localStorage.setItem(this.timelineCacheKey, JSON.stringify(state));
        } catch (error) {
            console.error('[UIRenderer] Failed to save timeline state:', error);
        }
    }

    /**
     * Initialize global timeline controls
     */
    initGlobalTimelineControls() {
        const expandAllBtn = document.getElementById('expand-all-timelines');
        const collapseAllBtn = document.getElementById('collapse-all-timelines');

        if (expandAllBtn) {
            expandAllBtn.addEventListener('click', () => {
                document.querySelectorAll('.paragraph-timeline-content').forEach(el => {
                    el.classList.remove('collapsed');
                });
                const allParagraphs = document.querySelectorAll('[data-paragraph-id]');
                allParagraphs.forEach(el => {
                    this.expandedTimelines.add(el.dataset.paragraphId);
                });
                this.saveTimelineStateToStorage();
            });
        }

        if (collapseAllBtn) {
            collapseAllBtn.addEventListener('click', () => {
                document.querySelectorAll('.paragraph-timeline-content').forEach(el => {
                    el.classList.add('collapsed');
                });
                this.expandedTimelines.clear();
                this.saveTimelineStateToStorage();
            });
        }
    }

    // ==================== Paragraph Editing ====================

    /**
     * Edit paragraph
     * @param {string} paragraphId - Paragraph ID
     */
    editParagraph(paragraphId) {
        try {
            const story = this.state.currentStory;
            const chapter = story.chapters.find(c => c.id === this.state.selectedChapter);
            const paragraph = chapter.paragraphs.find(p => p.id === paragraphId);

            if (paragraph) {
                this.editingParagraph = paragraphId;
                const paragraphItem = document.querySelector(`[data-paragraph-id="${paragraphId}"]`);
                if (paragraphItem) {
                    paragraphItem.classList.add('editing');
                }
            }
        } catch (error) {
            this.errorHandler.handleError('editParagraph', error, {
                silent: false,
                message: '编辑段落失败'
            });
        }
    }

    /**
     * Summarize paragraph state
     * @param {string} paragraphId - Paragraph ID
     */
    summarizeParagraphState(paragraphId) {
        try {
            // TODO: Implement paragraph state summarization
            console.log('[UIRenderer] Summarizing state for paragraph:', paragraphId);
        } catch (error) {
            this.errorHandler.handleError('summarizeParagraphState', error, {
                silent: true,
                message: '总结段落状态失败'
            });
        }
    }
}

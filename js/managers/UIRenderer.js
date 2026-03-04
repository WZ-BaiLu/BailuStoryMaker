/**
 * UIRenderer
 * Handles rendering of all UI components and views
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
        this.expandedTimelines = new Set(); // Track which timeline sections are expanded

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
            this.renderViewLocationSelector();
        } else {
            contentPanel.classList.add('hidden');
            placeholderPanel.classList.add('active');
        }
    }

    /**
     * Render view location selector (新架构: Story View Management)
     */
    renderViewLocationSelector() {
        const selector = document.getElementById('view-location-select');
        const indicator = document.getElementById('present-elements-count');
        const story = this.state.currentStory;

        if (!selector || !story) {
            return;
        }

        // Get all locations from story settings
        const locations = story.settings?.filter(s => s.type === 'location') || [];
        const optionsHtml = `
            <option value="" data-i18n="story.viewLocationAny">全知视角</option>
            ${locations.map(loc => `<option value="${loc.id}">${loc.name}</option>`).join('')}
        `;

        // Update selector only if options changed
        if (selector.innerHTML !== optionsHtml) {
            selector.innerHTML = optionsHtml;
        }

        // Get current view location from StoryViewManager (if available)
        const currentView = this.app.aiManager?.storyViewManager?.getViewLocation() || '';

        // Set current value without triggering change event
        selector.value = currentView;

        // Update present elements count
        const presentCount = this._getPresentElementsCount(currentView);
        if (indicator) {
            indicator.textContent = presentCount;
        }
    }

    /**
     * Get count of present elements at view location
     * @private
     * @param {string} viewLocationId - View location ID
     * @returns {number} Count of present elements
     */
    _getPresentElementsCount(viewLocationId) {
        const story = this.state.currentStory;
        if (!story || !viewLocationId) {
            return 0;
        }

        // Count elements at the view location
        const elementsAtLocation = story.characters?.filter(c => c.location === viewLocationId).length || 0;
        const itemsAtLocation = story.items?.filter(i => i.owner === viewLocationId).length || 0;

        return elementsAtLocation + itemsAtLocation;
    }

    /**
     * Render the paragraphs list
     */
    renderParagraphs() {
        const container = document.getElementById('paragraphs-list');
        const story = this.state.currentStory;
        const changesTracker = document.getElementById('changes-tracker');

        if (!this.state.selectedChapter || !story) {
            container.innerHTML = '';
            changesTracker.classList.remove('visible');
            return;
        }

        const chapter = story.chapters.find(c => c.id === this.state.selectedChapter);
        if (!chapter) {
            container.innerHTML = '';
            changesTracker.classList.remove('visible');
            return;
        }

        const paragraphs = chapter.paragraphs || [];

        container.innerHTML = paragraphs.map((paragraph, index) => `
            <div class="paragraph-bubble ${this.selectedParagraph === paragraph.id ? 'selected' : ''}"
                 data-paragraph-id="${paragraph.id}">
                <div class="paragraph-bubble-header">
                    <span class="paragraph-bubble-number">段落 ${index + 1}</span>
                    <div class="paragraph-bubble-actions">
                        <button class="btn btn-sm btn-preview-prompt" data-action="preview-prompt" title="${i18n.t('buttons.previewAnalysisRequest')}">👁️</button>
                        <button class="btn btn-sm btn-analyze-paragraph" data-action="analyze-paragraph" title="${i18n.t('ai.paragraphAnalysis.analyzeButton')}">🤖</button>
                        <button class="btn btn-sm" data-action="edit-paragraph">编辑</button>
                        <button class="btn btn-sm btn-delete" data-action="delete-paragraph">删除</button>
                    </div>
                </div>
                <div class="paragraph-bubble-content ${this.editingParagraph === paragraph.id ? 'editing' : ''}">
                    ${paragraph.content || '点击编辑添加内容...'}
                </div>
                <textarea class="paragraph-bubble-textarea ${this.editingParagraph === paragraph.id ? 'editing' : ''}"
                          placeholder="输入段落内容...">${paragraph.content || ''}</textarea>
                ${this.renderParagraphChanges(paragraph)}
            </div>
        `).join('');

        this.bindParagraphEvents(container);

        // Show/hide changes tracker
        if (paragraphs.some(p => p.changes && (p.changes.characters?.length > 0 || p.changes.items?.length > 0))) {
            changesTracker.classList.add('visible');
            this.renderChangesTracker();
        } else {
            changesTracker.classList.remove('visible');
        }

        if (paragraphs.length === 0) {
            container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">💬</div><div class="empty-state-text">开始输入内容来添加段落...</div></div>`;
        }

        // Update timeline status after rendering paragraphs
        this.updateTimelineStatus();
    }

    /**
     * Bind paragraph-related events
     * @param {HTMLElement} container - The paragraphs container
     */
    bindParagraphEvents(container) {
        container.querySelectorAll('.paragraph-bubble').forEach(bubble => {
            const paragraphId = bubble.dataset.paragraphId;

            // Textarea events
            const textarea = bubble.querySelector('.paragraph-bubble-textarea');
            if (textarea) {
                textarea.addEventListener('click', (e) => {
                    e.stopPropagation();
                });

                textarea.addEventListener('input', () => {
                    // Just update state, don't re-render
                    this.state.updateParagraph(this.state.selectedChapter, paragraphId, { content: textarea.value });
                });

                textarea.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        this.editingParagraph = null;
                        this.renderParagraphs();
                    }
                    if (e.key === 'Enter' && e.ctrlKey) {
                        e.preventDefault();
                        this.editingParagraph = null;
                        this.renderParagraphs();
                    }
                });

                textarea.addEventListener('blur', () => {
                    this.editingParagraph = null;
                    this.renderParagraphs();
                });
            }

            // Click to select (or deselect if already selected)
            bubble.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn') && e.target !== textarea) {
                    // If clicking the already selected paragraph, deselect it
                    if (this.selectedParagraph === paragraphId) {
                        this.state.selectParagraph(null);
                        this.selectedParagraph = null;
                        this.renderParagraphs();
                    } else {
                        this.state.selectParagraph(paragraphId);
                        this.selectedParagraph = paragraphId;
                        this.renderParagraphs();
                    }
                }
            });

            // Edit button
            const editBtn = bubble.querySelector('[data-action="edit-paragraph"]');
            if (editBtn) {
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.editingParagraph = paragraphId;
                    this.renderParagraphs();
                    setTimeout(() => {
                        const newBubble = container.querySelector(`[data-paragraph-id="${paragraphId}"]`);
                        const newTextarea = newBubble?.querySelector('.paragraph-bubble-textarea');
                        if (newTextarea) {
                            newTextarea.focus();
                            newTextarea.setSelectionRange(newTextarea.value.length, newTextarea.value.length);
                        }
                    }, 0);
                });
            }

            // Analyze button
            const analyzeBtn = bubble.querySelector('[data-action="analyze-paragraph"]');
            if (analyzeBtn) {
                analyzeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.app.analyzeParagraph(paragraphId);
                });
            }

            // Preview prompt button
            const previewBtn = bubble.querySelector('[data-action="preview-prompt"]');
            if (previewBtn) {
                previewBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.app.previewAnalysisPrompt(paragraphId);
                });
            }

            // Delete button
            const deleteBtn = bubble.querySelector('[data-action="delete-paragraph"]');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm('确定删除这个段落吗？')) {
                        this.state.deleteParagraph(this.state.selectedChapter, paragraphId);
                        if (this.selectedParagraph === paragraphId) {
                            this.state.selectParagraph(null);
                            this.selectedParagraph = null;
                        }
                    }
                });
            }



            // Add change buttons
            const addChangeBtns = bubble.querySelectorAll('.btn-add-change');
            addChangeBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const type = btn.dataset.type;
                    this.showAddChangeModal(paragraphId, type);
                });
            });

            // Edit change buttons
            const editChangeBtns = bubble.querySelectorAll('.btn-edit-change');
            editChangeBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const type = btn.dataset.type;
                    const changeParagraphId = btn.dataset.paragraphId;
                    if (type === 'character') {
                        this.showEditCharacterChangeModal(changeParagraphId, btn.dataset.characterId);
                    } else if (type === 'item') {
                        this.showEditItemChangeModal(changeParagraphId, btn.dataset.itemId);
                    }
                });
            });

            // Summarize state button
            const summarizeBtn = bubble.querySelector('.btn-summarize-state');
            if (summarizeBtn) {
                summarizeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.summarizeParagraphState(paragraphId);
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
        // Always show timeline for demo purposes
        // Comment out the next line to only show timeline when there are changes
        // if (!paragraph.changes || (paragraph.changes.characters?.length === 0 && paragraph.changes.items?.length === 0)) {
        //     return '';
        // }

        const story = this.state.currentStory;
        const changes = [];

        // Character changes
        if (paragraph.changes && paragraph.changes.characters) {
            paragraph.changes.characters.forEach(charChange => {
                const character = story?.characters.find(c => c.id === charChange.characterId);
                if (character) {
                    const changeDetails = this.formatCharacterChange(charChange);
                    changes.push(`
                        <div class="timeline-change-item character" data-change-type="character" data-character-id="${charChange.characterId}">
                            <span class="timeline-change-icon">👤</span>
                            <div class="timeline-change-content">
                                <div class="timeline-change-name">${character.name} <button class="btn-edit-change" data-type="character" data-paragraph-id="${paragraph.id}" data-character-id="${charChange.characterId}">✏️</button></div>
                                <div class="timeline-change-detail">${changeDetails}</div>
                            </div>
                        </div>
                    `);
                }
            });
        }

        // Item changes
        if (paragraph.changes && paragraph.changes.items) {
            paragraph.changes.items.forEach(itemChange => {
                const item = story?.items.find(i => i.id === itemChange.itemId);
                if (item) {
                    const actionLabel = this.getItemActionLabel(itemChange.action);
                    const changeDetails = this.formatItemChange(itemChange);
                    changes.push(`
                        <div class="timeline-change-item item" data-change-type="item" data-item-id="${itemChange.itemId}">
                            <span class="timeline-change-icon">🎒</span>
                            <div class="timeline-change-content">
                                <div class="timeline-change-name">${item.name} <span class="timeline-change-action">${actionLabel}</span> <button class="btn-edit-change" data-type="item" data-paragraph-id="${paragraph.id}" data-item-id="${itemChange.itemId}">✏️</button></div>
                                <div class="timeline-change-detail">${changeDetails}</div>
                            </div>
                        </div>
                    `);
                }
            });
        }

        // Element changes (new unified element system)
        if (paragraph.changes && paragraph.changes.elements) {
            paragraph.changes.elements.forEach(elementChange => {
                // Resolve element ID or name
                const elementId = elementChange.elementId;
                const elementName = elementChange.elementName || elementId;

                // Find element in story.elements
                const element = story?.elements?.find(e => e.id === elementId);

                // Format change based on property
                let changeDetail = '';
                let icon = '📦';

                if (elementChange.property === 'location') {
                    icon = '📍';
                    const fromLocation = elementChange.from || '未知';
                    const toLocation = elementChange.to || elementChange.changes?.location || '未知';
                    changeDetail = `位置: ${fromLocation} → ${toLocation}`;
                } else if (elementChange.property === 'description') {
                    icon = '📝';
                    changeDetail = `描述已更新`;
                } else {
                    changeDetail = JSON.stringify(elementChange.changes || {});
                }

                const displayName = element?.name || elementName;

                changes.push(`
                    <div class="timeline-change-item element" data-change-type="element" data-element-id="${elementId}">
                        <span class="timeline-change-icon">${icon}</span>
                        <div class="timeline-change-content">
                            <div class="timeline-change-name">${displayName}</div>
                            <div class="timeline-change-detail">${changeDetail}</div>
                        </div>
                    </div>
                `);
            });
        }

        // Show empty message if no changes
        if (changes.length === 0) {
            changes.push(`
                <div class="timeline-empty-message">
                    <span class="timeline-empty-icon">📝</span>
                    <span class="timeline-empty-text">${i18n.t('timeline.empty')}</span>
                </div>
            `);
        }

        const isExpanded = this.expandedTimelines.has(paragraph.id);
        return `
            <div class="paragraph-timeline">
                <div class="paragraph-timeline-content ${isExpanded ? '' : 'collapsed'}" data-paragraph-id="${paragraph.id}">
                    <div class="timeline-actions">
                        <button class="btn-add-change" data-paragraph-id="${paragraph.id}" data-type="character">👤 ${i18n.t('timeline.addCharacterChange')}</button>
                        <button class="btn-add-change" data-paragraph-id="${paragraph.id}" data-type="item">🎒 ${i18n.t('timeline.addItemChange')}</button>
                        <button class="btn-summarize-state" data-paragraph-id="${paragraph.id}">📋 ${i18n.t('timeline.summarizeState')}</button>
                    </div>
                    <div class="timeline-changes-list">
                        ${changes.join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render the changes tracker panel
     */
    renderChangesTracker() {
        const container = document.getElementById('changes-content');
        const story = this.state.currentStory;

        if (!this.state.selectedChapter || !story) {
            container.innerHTML = '';
            return;
        }

        const chapter = story.chapters.find(c => c.id === this.state.selectedChapter);
        if (!chapter) return;

        const paragraphs = chapter.paragraphs || [];
        const allChanges = [];

        paragraphs.forEach((paragraph, index) => {
            if (!paragraph.changes) return;

            paragraph.changes.characters?.forEach(charId => {
                const character = story.characters.find(c => c.id === charId);
                if (character) {
                    allChanges.push({
                        type: 'character',
                        name: character.name,
                        id: charId,
                        paragraphIndex: index,
                        paragraphId: paragraph.id
                    });
                }
            });

            paragraph.changes.items?.forEach(itemId => {
                const item = story.items.find(i => i.id === itemId);
                if (item) {
                    allChanges.push({
                        type: 'item',
                        name: item.name,
                        id: itemId,
                        paragraphIndex: index,
                        paragraphId: paragraph.id
                    });
                }
            });
        });

        if (allChanges.length === 0) {
            container.innerHTML = '<div style="text-align:center;color:var(--secondary-color);font-size:0.8rem;padding:20px;">暂无修改记录</div>';
            return;
        }

        container.innerHTML = allChanges.map(change => `
            <div class="change-item" data-change-type="${change.type}" data-change-id="${change.id}" data-paragraph-id="${change.paragraphId}">
                <div class="change-item-header ${change.type}">
                    <span class="type-icon">${change.type === 'character' ? '👤' : '🎒'}</span>
                    <span class="change-item-name">${change.name}</span>
                </div>
                <div class="change-item-paragraph">段落 ${change.paragraphIndex + 1}</div>
            </div>
        `).join('');
    }

    // ==================== Character Rendering ====================

    /**
     * Render the characters list
     */
    /**
     * Render the elements view (unified elements page)
     */
    renderElements() {
        const allContainer = document.getElementById('all-elements');
        const charactersContainer = document.getElementById('characters');
        const itemsContainer = document.getElementById('items');
        const settingsContainer = document.getElementById('settings');
        const story = this.state.currentStory;
        if (!story) return;

        const elements = story.elements || [];

        // Render all elements
        if (allContainer) {
            allContainer.innerHTML = elements.map(element => `
                <div class="list-item"
                     data-element-id="${element.id}" data-element-type="${element.type}">
                    <div class="list-item-header">
                        <span class="list-item-title">${element.name}</span>
                        <span class="tag">${element.type}</span>
                        <div class="list-item-actions">
                            <button class="btn btn-sm btn-delete" data-action="delete-element" data-element-id="${element.id}">删除</button>
                        </div>
                    </div>
                </div>
            `).join('');

            if (elements.length === 0) {
                allContainer.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📦</div><div class="empty-state-text">${i18n.t('messages.noCharacters')}</div></div>`;
            }
        }

        // Render characters (sub-tab)
        const characterElements = elements.filter(el => el.type === 'character');
        if (charactersContainer) {
            charactersContainer.innerHTML = characterElements.map(element => `
                <div class="list-item"
                     data-element-id="${element.id}" data-element-type="character">
                    <div class="list-item-header">
                        <span class="list-item-title">${element.name}</span>
                        <span class="tag">角色</span>
                        <div class="list-item-actions">
                            <button class="btn btn-sm btn-delete" data-action="delete-element" data-element-id="${element.id}">删除</button>
                        </div>
                    </div>
                </div>
            `).join('');

            if (characterElements.length === 0) {
                charactersContainer.innerHTML = `<div class="empty-state"><div class="empty-state-icon">👤</div><div class="empty-state-text">${i18n.t('messages.noCharacters')}</div></div>`;
            }
        }

        // Render items (sub-tab)
        const itemElements = elements.filter(el => el.type === 'item');
        if (itemsContainer) {
            itemsContainer.innerHTML = itemElements.map(element => `
                <div class="list-item"
                     data-element-id="${element.id}" data-element-type="item">
                    <div class="list-item-header">
                        <span class="list-item-title">${element.name}</span>
                        <span class="tag">道具</span>
                        <div class="list-item-actions">
                            <button class="btn btn-sm btn-delete" data-action="delete-element" data-element-id="${element.id}">删除</button>
                        </div>
                    </div>
                </div>
            `).join('');

            if (itemElements.length === 0) {
                itemsContainer.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🎒</div><div class="empty-state-text">${i18n.t('messages.noItems')}</div></div>`;
            }
        }

        // Render settings (sub-tab)
        const settingElements = elements.filter(el => el.type === 'base' || el.type === 'location');
        if (settingsContainer) {
            settingsContainer.innerHTML = settingElements.map(element => `
                <div class="list-item"
                     data-element-id="${element.id}" data-element-type="${element.type}">
                    <div class="list-item-header">
                        <span class="list-item-title">${element.name}</span>
                        <span class="tag">${element.type === 'location' ? '地点' : '设定'}</span>
                        <div class="list-item-actions">
                            <button class="btn btn-sm btn-delete" data-action="delete-element" data-element-id="${element.id}">删除</button>
                        </div>
                    </div>
                </div>
            `).join('');

            if (settingElements.length === 0) {
                settingsContainer.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🏰</div><div class="empty-state-text">${i18n.t('messages.noSettings')}</div></div>`;
            }
        }

        // Bind events for all containers
        this.bindElementEvents(allContainer);
        this.bindElementEvents(charactersContainer);
        this.bindElementEvents(itemsContainer);
        this.bindElementEvents(settingsContainer);
    }

    /**
     * Render element editor based on element type
     * @param {string} elementId - The element ID
     * @param {string} elementType - The element type
     */
    renderElementEditor(elementId, elementType) {
        if (!elementId) {
            // Show placeholder
            const allEditorPanel = document.getElementById('element-editor-content');
            if (allEditorPanel) {
                allEditorPanel.classList.add('hidden');
                const placeholder = document.getElementById('element-editor-placeholder');
                if (placeholder) {
                    placeholder.classList.add('active');
                }
            }
            return;
        }

        // Call the appropriate editor based on element type
        switch (elementType) {
            case 'character':
                this.state.selectCharacter(elementId);
                this.renderCharacterEditor(elementId);
                break;
            case 'item':
                this.state.selectItem(elementId);
                this.renderItemEditor(elementId);
                break;
            case 'base':
            case 'location':
                this.state.selectSetting(elementId);
                this.renderSettingEditor(elementId);
                break;
            default:
                console.warn('[UIRenderer] Unknown element type:', elementType);
        }
    }

    /**
     * Bind element-related events
     * @param {HTMLElement} container - The elements container
     */
    bindElementEvents(container) {
        if (!container) return;

        container.querySelectorAll('.list-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn-delete')) {
                    const elementId = item.dataset.elementId;
                    const elementType = item.dataset.elementType;
                    this.state.selectElement(elementId);
                    this.renderElementEditor(elementId, elementType);
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
                }
            });
        });
    }

    renderCharacters() {
        const container = document.getElementById('characters');
        const story = this.state.currentStory;
        if (!story) return;

        // Get all elements and filter by character type
        const elements = (story.elements || []).filter(el => el.type === 'character');

        container.innerHTML = elements.map(element => `
            <div class="list-item ${this.state.selectedCharacter === element.id ? 'active' : ''}"
                 data-element-id="${element.id}">
                <div class="list-item-header">
                    <span class="list-item-title">${element.name}</span>
                    <div class="list-item-actions">
                        <button class="btn btn-sm btn-delete" data-action="delete-character" data-element-id="${element.id}">删除</button>
                    </div>
                </div>
            </div>
        `).join('');

        this.bindCharacterEvents(container);

        if (elements.length === 0) {
            container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">👤</div><div class="empty-state-text">${i18n.t('messages.noCharacters')}</div></div>`;
        }
    }

    /**
     * Bind character-related events
     * @param {HTMLElement} container - The characters container
     */
    bindCharacterEvents(container) {
        container.querySelectorAll('.list-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn-delete')) {
                    const characterId = item.dataset.characterId;
                    this.state.selectCharacter(characterId);
                    this.renderCharacters();
                    this.renderCharacterEditor(characterId);
                }
            });
        });

        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const characterId = btn.dataset.characterId;
                if (confirm(i18n.t('messages.confirmDeleteCharacter'))) {
                    this.state.deleteCharacter(characterId);
                    this.renderCharacters();
                    if (this.state.selectedCharacter === characterId) {
                        this.state.selectCharacter(null);
                        this.renderCharacterEditor(null);
                    }
                }
            });
        });
    }

    /**
     * Render the character editor
     * @param {string|null} characterId - The character ID to render
     */
    renderCharacterEditor(characterId) {
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

            // Render element state (新架构支持)
            this.renderElementState(character, 'character');
        } else {
            contentPanel.classList.add('hidden');
            placeholderPanel.classList.add('active');
            this.clearCharacterForm();
        }
    }

    /**
     * Render element state display (新架构: Element/Event/State 驱动)
     * @param {Object} element - The element object
     * @param {string} elementType - The element type (character/item/location)
     */
    renderElementState(element, elementType) {
        // Check if state container exists, if not create it
        let stateContainer = document.getElementById(`element-state-${elementType}`);
        if (!stateContainer) {
            stateContainer = document.createElement('div');
            stateContainer.id = `element-state-${elementType}`;
            stateContainer.className = 'element-state-section';

            // Find the form and insert state section before the submit button
            const form = document.getElementById(`${elementType === 'character' ? 'character' : elementType === 'item' ? 'item' : 'setting'}-form`);
            if (form) {
                const submitButton = form.querySelector('button[type="submit"]');
                if (submitButton) {
                    form.insertBefore(stateContainer, submitButton);
                } else {
                    form.appendChild(stateContainer);
                }
            }
        }

        // Render element location
        const locationHtml = `
            <div class="element-state-item">
                <label>当前位置:</label>
                <span class="element-state-value">${this._formatLocation(element.location)}</span>
            </div>
        `;

        // Render element keywords
        const keywordsHtml = `
            <div class="element-state-item">
                <label>关键字:</label>
                <div class="element-keywords">
                    ${element.keywords && element.keywords.length > 0
                        ? element.keywords.map(kw => `<span class="tag">${kw}</span>`).join('')
                        : '<span class="no-keywords">无关键字</span>'}
                </div>
            </div>
        `;

        // Render state history
        const stateHistoryHtml = `
            <div class="element-state-item">
                <label>状态历史:</label>
                ${this._renderStateHistory(element.stateHistory)}
            </div>
        `;

        stateContainer.innerHTML = `
            <div class="element-state-header">
                <h4>元素状态</h4>
            </div>
            <div class="element-state-content">
                ${locationHtml}
                ${keywordsHtml}
                ${stateHistoryHtml}
            </div>
        `;
    }

    /**
     * Format location for display
     * @private
     * @param {string} location - The location ID or null
     * @returns {string} Formatted location
     */
    _formatLocation(location) {
        if (!location) {
            return '<span class="no-location">未知位置</span>';
        }

        // Try to find location name from story elements
        const story = this.state.currentStory;
        if (story && story.elements) {
            const locationElement = story.elements.find(e => e.id === location);
            if (locationElement) {
                return `<span class="location-name">${locationElement.name}</span>`;
            }
        }

        // Fallback to location ID
        return `<span class="location-name">${location}</span>`;
    }

    /**
     * Render state history for element
     * @private
     * @param {Array} stateHistory - The state history array
     * @returns {string} HTML string
     */
    _renderStateHistory(stateHistory) {
        if (!stateHistory || stateHistory.length === 0) {
            return '<div class="no-history">暂无状态变化</div>';
        }

        return `
            <div class="state-history-list">
                ${stateHistory.map((entry, index) => `
                    <div class="state-history-entry">
                        <div class="state-history-header">
                            <span class="state-history-index">#${index + 1}</span>
                            <span class="state-history-paragraph">${entry.paragraphId}</span>
                        </div>
                        <div class="state-history-changes">
                            ${this._renderStateChanges(entry.changes)}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render state changes
     * @private
     * @param {Object} changes - The changes object
     * @returns {string} HTML string
     */
    _renderStateChanges(changes) {
        if (!changes) {
            return '<span class="no-changes">无变化</span>';
        }

        const changeItems = [];

        if (changes.location) {
            changeItems.push(`<div class="state-change-item"><strong>位置:</strong> ${this._formatLocation(changes.location)}</div>`);
        }

        if (changes.description) {
            changeItems.push(`<div class="state-change-item"><strong>描述:</strong> ${changes.description}</div>`);
        }

        if (changes.keywords && changes.keywords.length > 0) {
            changeItems.push(`<div class="state-change-item"><strong>关键字:</strong> ${changes.keywords.map(k => `<span class="tag">${k}</span>`).join(' ')}</div>`);
        }

        if (changeItems.length === 0) {
            return '<span class="no-changes">无变化</span>';
        }

        return changeItems.join('');
    }

    /**
     * Clear the character form
     */
    clearCharacterForm() {
        document.getElementById('char-name').value = '';
        document.getElementById('char-description').value = '';
        document.getElementById('char-notes').value = '';
        document.getElementById('char-attributes').innerHTML = '';
        document.getElementById('char-abilities').innerHTML = '';

        // Clear element state
        const stateContainer = document.getElementById('element-state-character');
        if (stateContainer) {
            stateContainer.innerHTML = '';
        }
    }

    /**
     * Render character attributes
     * @param {Object} attributes - The attributes object
     */
    renderAttributes(attributes) {
        const container = document.getElementById('char-attributes');
        container.innerHTML = '';
        if (!attributes) return;

        Object.entries(attributes.current || {}).forEach(([key, value]) => {
            const entry = document.createElement('div');
            entry.className = 'attribute-entry';
            entry.innerHTML = `
                <input type="text" class="input-field attr-name" value="${key}" placeholder="${i18n.t('placeholders.attributeName')}">
                <input type="text" class="input-field attr-value value-input" value="${value}" placeholder="${i18n.t('placeholders.attributeValue')}">
                <button type="button" class="btn btn-delete">${i18n.t('placeholders.delete')}</button>
            `;
            container.appendChild(entry);

            entry.querySelector('.btn-delete').addEventListener('click', () => {
                entry.remove();
            });
        });
    }

    /**
     * Render character abilities
     * @param {Array} abilities - The abilities array
     */
    renderAbilities(abilities) {
        const container = document.getElementById('char-abilities');
        container.innerHTML = '';
        if (!abilities) return;

        abilities.forEach(ability => {
            const entry = document.createElement('div');
            entry.className = 'ability-entry';
            entry.innerHTML = `
                <div class="ability-header">
                    <input type="text" class="input-field ability-name" value="${ability.name}" placeholder="${i18n.t('placeholders.abilityName')}">
                    <input type="number" class="input-field ability-level" placeholder="${i18n.t('placeholders.abilityLevel')}" min="1" value="${ability.level}">
                    <button type="button" class="btn btn-delete">${i18n.t('placeholders.delete')}</button>
                </div>
                <input type="text" class="input-field ability-desc" value="${ability.description || ''}" placeholder="${i18n.t('placeholders.abilityDesc')}">
            `;
            container.appendChild(entry);

            entry.querySelector('.btn-delete').addEventListener('click', () => {
                entry.remove();
            });
        });
    }

    // ==================== Item Rendering ====================

    /**
     * Render the items list
     */
    renderItems() {
        const container = document.getElementById('items');
        const story = this.state.currentStory;
        if (!story) return;

        // Get all elements and filter by item type
        const elements = (story.elements || []).filter(el => el.type === 'item');

        container.innerHTML = elements.map(element => `
            <div class="list-item ${this.state.selectedItem === element.id ? 'active' : ''}"
                 data-element-id="${element.id}">
                <div class="list-item-header">
                    <span class="list-item-title">${element.name}</span>
                    <span class="tag">道具</span>
                    <div class="list-item-actions">
                        <button class="btn btn-sm btn-delete" data-action="delete-item" data-element-id="${element.id}">删除</button>
                    </div>
                </div>
            </div>
        `).join('');

        this.bindItemEvents(container);

        if (elements.length === 0) {
            container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🎒</div><div class="empty-state-text">${i18n.t('messages.noItems')}</div></div>`;
        }
    }

    /**
     * Bind item-related events
     * @param {HTMLElement} container - The items container
     */
    bindItemEvents(container) {
        container.querySelectorAll('.list-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn-delete')) {
                    const itemId = item.dataset.itemId;
                    this.state.selectItem(itemId);
                    this.renderItems();
                    this.renderItemEditor(itemId);
                }
            });
        });

        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const itemId = btn.dataset.itemId;
                if (confirm(i18n.t('messages.confirmDeleteItem'))) {
                    this.state.deleteItem(itemId);
                    this.renderItems();
                    if (this.state.selectedItem === itemId) {
                        this.state.selectItem(null);
                        this.renderItemEditor(null);
                    }
                }
            });
        });
    }

    /**
     * Render the item editor
     * @param {string|null} itemId - The item ID to render
     */
    renderItemEditor(itemId) {
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
            document.getElementById('item-type').value = item.type;
            document.getElementById('item-description').value = item.description || '';
            this.renderItemProperties(item.properties);

            // Render element state (新架构支持)
            this.renderElementState(item, 'item');
        } else {
            contentPanel.classList.add('hidden');
            placeholderPanel.classList.add('active');
            this.clearItemForm();
        }
    }

    /**
     * Clear the item form
     */
    clearItemForm() {
        document.getElementById('item-name').value = '';
        document.getElementById('item-type').value = 'other';
        document.getElementById('item-description').value = '';
        document.getElementById('item-properties').innerHTML = '';

        // Clear element state
        const stateContainer = document.getElementById('element-state-item');
        if (stateContainer) {
            stateContainer.innerHTML = '';
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

    // ==================== Setting Rendering ====================

    /**
     * Render all elements list
     */
    renderAllElements() {
        const container = document.getElementById('all-elements');
        const story = this.state.currentStory;
        if (!story) return;

        // Get all elements
        const elements = story.elements || [];

        const typeLabels = {
            'character': '人物',
            'item': '道具',
            'location': '地点',
            'memory': '记忆',
            'base': '设定'
        };

        container.innerHTML = elements.map(element => `
            <div class="list-item ${this.state.selectedElement === element.id ? 'active' : ''}"
                 data-element-id="${element.id}">
                <div class="list-item-header">
                    <span class="list-item-title">${element.name}</span>
                    <span class="tag">${typeLabels[element.type] || element.type}</span>
                    <div class="list-item-actions">
                        <button class="btn btn-sm btn-delete" data-action="delete-element" data-element-id="${element.id}">删除</button>
                    </div>
                </div>
            </div>
        `).join('');

        this.bindAllElementsEvents(container);

        if (elements.length === 0) {
            container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">📦</div><div class="empty-state-text">暂无元素</div></div>`;
        }
    }

    /**
     * Bind all elements events
     * @param {HTMLElement} container - The all elements container
     */
    bindAllElementsEvents(container) {
        container.querySelectorAll('.list-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn-delete')) {
                    const elementId = item.dataset.elementId;
                    this.state.selectElement(elementId);
                    this.renderAllElements();
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
                    this.renderAllElements();
                    if (this.state.selectedElement === elementId) {
                        this.state.selectElement(null);
                        this.renderElementEditor(null);
                    }
                }
            });
        });
    }

    /**
     * Render element editor
     * @param {string|null} elementId - The element ID to render
     */
    renderElementEditor(elementId) {
        const contentPanel = document.getElementById('element-editor-content');
        const placeholderPanel = document.getElementById('element-editor-placeholder');
        const story = this.state.currentStory;

        if (!elementId || !story) {
            contentPanel.classList.add('hidden');
            placeholderPanel.classList.add('active');
            this.clearElementForm();
            return;
        }

        const element = story.elements.find(el => el.id === elementId);
        if (element) {
            contentPanel.classList.remove('hidden');
            placeholderPanel.classList.remove('active');

            document.getElementById('element-type').value = element.type;
            document.getElementById('element-name').value = element.name;
            document.getElementById('element-description').value = element.description || '';
            document.getElementById('element-keywords').value = (element.keywords || []).join(', ');
        }
    }

    /**
     * Clear element form
     */
    clearElementForm() {
        document.getElementById('element-type').value = 'character';
        document.getElementById('element-name').value = '';
        document.getElementById('element-description').value = '';
        document.getElementById('element-keywords').value = '';
    }

    /**
     * Render the settings list
     */
    renderSettings() {
        const container = document.getElementById('settings');
        const story = this.state.currentStory;
        if (!story) return;

        // Get all elements and filter by base/location type
        const elements = (story.elements || []).filter(el => el.type === 'base' || el.type === 'location');

        container.innerHTML = elements.map(element => `
            <div class="list-item ${this.state.selectedSetting === element.id ? 'active' : ''}"
                 data-element-id="${element.id}">
                <div class="list-item-header">
                    <span class="list-item-title">${element.name}</span>
                    <span class="tag">${element.type === 'location' ? '地点' : '设定'}</span>
                    <div class="list-item-actions">
                        <button class="btn btn-sm btn-delete" data-action="delete-setting" data-element-id="${element.id}">删除</button>
                    </div>
                </div>
            </div>
        `).join('');

        this.bindSettingEvents(container);

        if (elements.length === 0) {
            container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🏰</div><div class="empty-state-text">${i18n.t('messages.noSettings')}</div></div>`;
        }
    }

    /**
     * Bind setting-related events
     * @param {HTMLElement} container - The settings container
     */
    bindSettingEvents(container) {
        container.querySelectorAll('.list-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn-delete')) {
                    const settingId = item.dataset.settingId;
                    this.state.selectSetting(settingId);
                    this.renderSettings();
                    this.renderSettingEditor(settingId);
                }
            });
        });

        container.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const settingId = btn.dataset.settingId;
                if (confirm(i18n.t('messages.confirmDeleteSetting'))) {
                    this.state.deleteSetting(settingId);
                    this.renderSettings();
                    if (this.state.selectedSetting === settingId) {
                        this.state.selectSetting(null);
                        this.renderSettingEditor(null);
                    }
                }
            });
        });
    }

    /**
     * Render the setting editor
     * @param {string|null} settingId - The setting ID to render
     */
    renderSettingEditor(settingId) {
        const contentPanel = document.getElementById('setting-editor-content');
        const placeholderPanel = document.getElementById('setting-editor-placeholder');
        const story = this.state.currentStory;

        if (!settingId || !story) {
            contentPanel.classList.add('hidden');
            placeholderPanel.classList.add('active');
            this.clearSettingForm();
            return;
        }

        const setting = story.settings.find(s => s.id === settingId);
        if (setting) {
            contentPanel.classList.remove('hidden');
            placeholderPanel.classList.remove('active');

            document.getElementById('setting-name').value = setting.name;
            document.getElementById('setting-type').value = setting.type;
            document.getElementById('setting-parent').value = setting.parentId || '';
            document.getElementById('setting-description').value = setting.description || '';

            // Render element state (新架构支持)
            this.renderElementState(setting, 'setting');
        } else {
            contentPanel.classList.add('hidden');
            placeholderPanel.classList.add('active');
            this.clearSettingForm();
        }
    }

    /**
     * Clear the setting form
     */
    clearSettingForm() {
        document.getElementById('setting-name').value = '';
        document.getElementById('setting-type').value = 'location';
        document.getElementById('setting-parent').value = '';
        document.getElementById('setting-description').value = '';

        // Clear element state
        const stateContainer = document.getElementById('element-state-setting');
        if (stateContainer) {
            stateContainer.innerHTML = '';
        }
    }

    // ==================== Prompt View Rendering ====================

    /**
     * Render prompt options (chapter and template selectors)
     */
    renderPromptOptions() {
        const story = this.state.currentStory;
        if (!story) return;

        const chapterSelect = document.getElementById('prompt-chapter');
        chapterSelect.innerHTML = story.chapters
            .sort((a, b) => a.order - b.order)
            .map(ch => `<option value="${ch.id}">${ch.order}. ${ch.title}</option>`)
            .join('');
    }

    // ==================== Timeline Panel Rendering ====================

    /**
     * Render the timeline panel
     */
    renderTimelinePanel() {
        const timelinePanel = document.getElementById('timeline-panel');
        if (!timelinePanel) return;

        const story = this.state.currentStory;
        const chapterId = this.state.selectedChapter;

        if (!chapterId || !story) {
            timelinePanel.classList.add('hidden');
            return;
        }

        timelinePanel.classList.remove('hidden');

        const chapter = story.chapters.find(c => c.id === chapterId);
        if (!chapter || !chapter.paragraphs || chapter.paragraphs.length === 0) {
            this.renderTimelineEmpty();
            return;
        }

        this.renderTimelineNodes(chapter.paragraphs);
        this.renderTimelineControls();
    }

    /**
     * Render timeline nodes for paragraphs
     * @param {Array} paragraphs - Array of paragraph objects
     */
    renderTimelineNodes(paragraphs) {
        const nodesContainer = document.getElementById('timeline-nodes');
        const emptyContainer = document.getElementById('timeline-empty');

        if (!nodesContainer) return;

        if (paragraphs.length === 0) {
            this.renderTimelineEmpty();
            return;
        }

        emptyContainer?.classList.add('hidden');
        nodesContainer.classList.remove('hidden');

        const filter = this.getTimelineFilter();
        const story = this.state.currentStory;

        nodesContainer.innerHTML = paragraphs.map((paragraph, index) => {
            return this.renderTimelineNode(paragraph, index, filter, story);
        }).join('');
    }

    /**
     * Render a single timeline node
     * @param {Object} paragraph - Paragraph object
     * @param {number} index - Paragraph index
     * @param {string} filter - Current filter ('all', 'characters', 'items')
     * @param {Object} story - Story object
     * @returns {string} HTML string for the node
     */
    renderTimelineNode(paragraph, index, filter, story) {
        const changes = paragraph.changes || { characters: [], items: [] };

        // Check if this paragraph has relevant changes based on filter
        const hasCharacters = changes.characters && changes.characters.length > 0;
        const hasItems = changes.items && changes.items.length > 0;

        const shouldShow = filter === 'all' ||
            (filter === 'characters' && hasCharacters) ||
            (filter === 'items' && hasItems);

        if (filter !== 'all' && !shouldShow) {
            return '';
        }

        // Generate change items HTML
        let changeItemsHtml = '';

        // Render character changes (旧模型支持)
        if (filter === 'all' || filter === 'characters') {
            changes.characters?.forEach(charChange => {
                const character = story?.characters?.find(c => c.id === charChange.characterId);
                const charName = character?.name || charChange.characterId;
                changeItemsHtml += `
                    <div class="timeline-change-item character">
                        <span class="timeline-change-type-icon new">+</span>
                        <span class="timeline-change-name">${charName}</span>
                        <span class="timeline-change-detail">${this.formatCharacterChange(charChange)}</span>
                    </div>
                `;
            });
        }

        // Render item changes (旧模型支持)
        if (filter === 'all' || filter === 'items') {
            changes.items?.forEach(itemChange => {
                const item = story?.items?.find(i => i.id === itemChange.itemId);
                const itemName = item?.name || itemChange.itemId;
                const actionIcon = this.getItemActionIcon(itemChange.action);
                changeItemsHtml += `
                    <div class="timeline-change-item item">
                        <span class="timeline-change-type-icon ${itemChange.action}">${actionIcon}</span>
                        <span class="timeline-change-name">${itemName}</span>
                        <span class="timeline-change-detail">${this.formatItemChange(itemChange)}</span>
                    </div>
                `;
            });
        }

        // Render element state changes (新架构支持)
        if (paragraph.elementStateChanges && paragraph.elementStateChanges.length > 0) {
            changeItemsHtml += this._renderElementStateChanges(paragraph.elementStateChanges, story);
        }

        // Render narrative type indicator (新架构支持)
        const narrativeTypeHtml = paragraph.storyTimestamp
            ? `<div class="timeline-narrative-type">${this._formatNarrativeType(paragraph.storyTimestamp)}</div>`
            : '';

        const isActive = this.selectedParagraph === paragraph.id;

        return `
            <div class="timeline-node ${isActive ? 'active' : ''}"
                 data-paragraph-id="${paragraph.id}"
                 data-paragraph-index="${index}">
                <div class="timeline-node-header">
                    <div class="timeline-node-number">${index + 1}</div>
                    <div class="timeline-node-summary">
                        ${hasCharacters || hasItems ? i18n.t('story.changesTracker') : i18n.t('timeline.empty')}
                    </div>
                    ${narrativeTypeHtml}
                </div>
                ${changeItemsHtml ? `<div class="timeline-node-changes">${changeItemsHtml}</div>` : ''}
            </div>
        `;
    }

    /**
     * Render element state changes (新架构)
     * @private
     * @param {Array} stateChanges - Array of state changes
     * @param {Object} story - Story object
     * @returns {string} HTML string
     */
    _renderElementStateChanges(stateChanges, story) {
        return stateChanges.map(change => {
            const element = story?.elements?.find(e => e.id === change.elementId);
            const elementName = element?.name || change.elementId;
            const elementType = element?.type || change.elementType || 'unknown';

            const typeIcon = this._getElementTypeIcon(elementType);

            return `
                <div class="timeline-change-item element-state">
                    <span class="timeline-change-type-icon ${elementType}">${typeIcon}</span>
                    <span class="timeline-change-name">${elementName}</span>
                    <span class="timeline-change-detail">${this._formatElementStateChange(change)}</span>
                </div>
            `;
        }).join('');
    }

    /**
     * Format element state change for display
     * @private
     * @param {Object} change - State change object
     * @returns {string} Formatted change string
     */
    _formatElementStateChange(change) {
        const parts = [];

        if (change.changes?.location) {
            parts.push(`位置: ${this._formatLocation(change.changes.location)}`);
        }

        if (change.changes?.keywords && change.changes.keywords.length > 0) {
            parts.push(`关键字: ${change.changes.keywords.join(', ')}`);
        }

        if (change.changes?.description) {
            parts.push(`描述: ${change.changes.description}`);
        }

        return parts.join(' | ') || '状态更新';
    }

    /**
     * Get icon for element type
     * @private
     * @param {string} type - Element type
     * @returns {string} Icon character
     */
    _getElementTypeIcon(type) {
        const icons = {
            character: '👤',
            item: '🎒',
            location: '📍',
            base: '🏰',
            memory: '💭'
        };
        return icons[type] || '📄';
    }

    /**
     * Format narrative type for display
     * @private
     * @param {Object} storyTimestamp - Story timestamp object
     * @returns {string} Formatted narrative type
     */
    _formatNarrativeType(storyTimestamp) {
        if (!storyTimestamp || !storyTimestamp.narrativeType || storyTimestamp.narrativeType === 'linear') {
            return '';
        }

        const typeLabels = {
            flashback: '🔄 倒叙',
            flashforward: '⏭️ 插叙',
            parallel: '⏸️ 平行'
        };

        const label = typeLabels[storyTimestamp.narrativeType] || storyTimestamp.narrativeType;
        const offset = storyTimestamp.timeOffset ? ` (${storyTimestamp.timeOffset > 0 ? '+' : ''}${storyTimestamp.timeOffset})` : '';

        return `<span class="narrative-badge ${storyTimestamp.narrativeType}">${label}${offset}</span>`;
    }

    /**
     * Render timeline controls (collapse/expand buttons, filter)
     */
    renderTimelineControls() {
        // Filter buttons are already in HTML, just need to update active state
        const filter = this.getTimelineFilter();
        const filterBtns = document.querySelectorAll('.timeline-filter-btn');
        filterBtns.forEach(btn => {
            if (btn.dataset.filter === filter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    /**
     * Render empty timeline state
     */
    renderTimelineEmpty() {
        const nodesContainer = document.getElementById('timeline-nodes');
        const emptyContainer = document.getElementById('timeline-empty');

        if (nodesContainer) {
            nodesContainer.classList.add('hidden');
            nodesContainer.innerHTML = '';
        }

        if (emptyContainer) {
            emptyContainer.classList.remove('hidden');
        }
    }

    /**
     * Get current timeline filter from localStorage or default to 'all'
     * @returns {string} Current filter
     */
    getTimelineFilter() {
        try {
            const state = JSON.parse(localStorage.getItem('timeline.state') || '{}');
            return state.filter || 'all';
        } catch {
            return 'all';
        }
    }

    /**
     * Format character change for display
     * @param {Object} charChange - Character change object
     * @returns {string} Formatted change string
     */
    formatCharacterChange(charChange) {
        const parts = [];

        if (charChange.changes?.attributes) {
            const attrChanges = Object.entries(charChange.changes.attributes)
                .map(([key, value]) => `${key}: ${value}`)
                .join(', ');
            if (attrChanges) {
                parts.push(attrChanges);
            }
        }

        if (charChange.changes?.emotionalState) {
            parts.push(i18n.t('timeline.characterEmotion') + ': ' + this.translateEmotion(charChange.changes.emotionalState));
        }

        return parts.join(' | ') || i18n.t('timeline.changeModified');
    }

    /**
     * Format item change for display
     * @param {Object} itemChange - Item change object
     * @returns {string} Formatted change string
     */
    formatItemChange(itemChange) {
        const actionMap = {
            acquire: i18n.t('timeline.changeAcquire'),
            lose: i18n.t('timeline.changeLose'),
            transfer: i18n.t('timeline.changeTransfer'),
            modify: i18n.t('timeline.changeModified')
        };

        let message = actionMap[itemChange.action] || itemChange.action;

        if (itemChange.characterId) {
            const character = this.state.currentStory?.characters?.find(c => c.id === itemChange.characterId);
            const charName = character?.name || itemChange.characterId;
            message += ` (${charName})`;
        }

        if (itemChange.location) {
            message += ` [${itemChange.location}]`;
        }

        return message;
    }

    /**
     * Get icon for item action
     * @param {string} action - Action type
     * @returns {string} Icon character
     */
    getItemActionIcon(action) {
        const icons = {
            acquire: '+',
            lose: '-',
            transfer: '→',
            modify: '~'
        };
        return icons[action] || '~';
    }

    /**
     * Get label for item action
     * @param {string} action - Action type
     * @returns {string} Action label
     */
    getItemActionLabel(action) {
        const labels = {
            acquire: i18n.t('timeline.changeAcquire'),
            lose: i18n.t('timeline.changeLose'),
            transfer: i18n.t('timeline.changeTransfer'),
            modify: i18n.t('timeline.changeModified')
        };
        return labels[action] || action;
    }

    /**
     * Translate emotion state
     * @param {string} emotion - Emotion state
     * @returns {string} Translated emotion
     */
    translateEmotion(emotion) {
        const emotionMap = {
            happy: i18n.t('timeline.emotionHappy'),
            sad: i18n.t('timeline.emotionSad'),
            angry: i18n.t('timeline.emotionAngry'),
            fear: i18n.t('timeline.emotionFear'),
            neutral: i18n.t('timeline.emotionNeutral')
        };
        return emotionMap[emotion] || emotion;
    }

    // ==================== Timeline State Management ====================

    /**
     * Load timeline state from localStorage
     * @returns {Object} Timeline state
     */
    loadTimelineState() {
        try {
            return JSON.parse(localStorage.getItem('timeline.state') || '{}');
        } catch {
            return { isExpanded: true, filter: 'all' };
        }
    }

    /**
     * Save timeline state to localStorage
     * @param {Object} state - State to save
     */
    saveTimelineState(state) {
        try {
            const currentState = this.loadTimelineState();
            const newState = { ...currentState, ...state };
            localStorage.setItem('timeline.state', JSON.stringify(newState));
        } catch (error) {
            console.error('Failed to save timeline state:', error);
        }
    }

    // ==================== Timeline Interaction Methods ====================

    /**
     * Scroll to paragraph
     * @param {string} paragraphId - Paragraph ID to scroll to
     */
    scrollToParagraph(paragraphId) {
        const paragraphEl = document.querySelector(`[data-paragraph-id="${paragraphId}"]`);
        if (!paragraphEl) return;

        const paragraphsContainer = document.getElementById('paragraphs-list');
        if (!paragraphsContainer) return;

        // Scroll paragraph into view
        paragraphEl.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Highlight the paragraph briefly
        paragraphEl.classList.add('highlighted');
        setTimeout(() => {
            paragraphEl.classList.remove('highlighted');
        }, 2000);
    }

    /**
     * Highlight timeline node
     * @param {string} paragraphId - Paragraph ID to highlight
     */
    highlightTimelineNode(paragraphId) {
        const nodes = document.querySelectorAll('.timeline-node');
        nodes.forEach(node => {
            if (node.dataset.paragraphId === paragraphId) {
                node.classList.add('active');
            } else {
                node.classList.remove('active');
            }
        });
    }

    /**
     * Update active node based on scroll
     */
    updateActiveNodeOnScroll() {
        const paragraphsContainer = document.getElementById('paragraphs-list');
        if (!paragraphsContainer) return;

        const containerRect = paragraphsContainer.getBoundingClientRect();
        const paragraphs = paragraphsContainer.querySelectorAll('[data-paragraph-id]');

        let activeParagraphId = null;
        let minDistance = Infinity;

        paragraphs.forEach(p => {
            const rect = p.getBoundingClientRect();
            const distance = Math.abs(rect.top - containerRect.top);

            // Find the paragraph closest to the center of the viewport
            if (distance < minDistance) {
                minDistance = distance;
                activeParagraphId = p.dataset.paragraphId;
            }
        });

        if (activeParagraphId) {
            this.state.selectParagraph(activeParagraphId);
            this.selectedParagraph = activeParagraphId;
            this.highlightTimelineNode(activeParagraphId);
        }
    }

    /**
     * Toggle timeline panel expansion
     */
    toggleTimelinePanel() {
        const timelinePanel = document.getElementById('timeline-panel');
        if (!timelinePanel) return;

        const state = this.loadTimelineState();
        const isExpanded = !state.isExpanded;

        if (isExpanded) {
            timelinePanel.classList.remove('collapsed');
        } else {
            timelinePanel.classList.add('collapsed');
        }

        this.saveTimelineState({ isExpanded });
    }

    /**
     * Set timeline filter
     * @param {string} filter - Filter to set ('all', 'characters', 'items')
     */
    setTimelineFilter(filter) {
        this.saveTimelineState({ filter });
        this.renderTimelinePanel();
    }

    // ==================== Change Edit Methods ====================

    /**
     * Show modal to add character change
     * @param {string} paragraphId - Paragraph ID
     */
    showAddCharacterChangeModal(paragraphId) {
        const story = this.state.currentStory;
        if (!story) return;

        // Get available characters
        const characters = story.characters.map(c => `
            <option value="${c.id}">${c.name}</option>
        `).join('');

        const modalHtml = `
            <div class="modal-overlay" id="change-modal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>${i18n.t('timeline.addCharacterChange')}</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>${i18n.t('timeline.selectCharacter')}</label>
                            <select id="change-character-select" class="input-field">
                                <option value="">${i18n.t('timeline.selectCharacter')}</option>
                                ${characters}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${i18n.t('timeline.attributeName')}</label>
                            <input type="text" id="change-attr-name" class="input-field" placeholder="${i18n.t('placeholders.attributeName')}">
                        </div>
                        <div class="form-group">
                            <label>${i18n.t('timeline.attributeValue')}</label>
                            <input type="text" id="change-attr-value" class="input-field" placeholder="${i18n.t('placeholders.attributeValue')}">
                        </div>
                        <div class="form-group">
                            <label>${i18n.t('timeline.emotionalState')}</label>
                            <select id="change-emotion" class="input-field">
                                <option value="">${i18n.t('timeline.noChange')}</option>
                                <option value="happy">${i18n.t('timeline.emotionHappy')}</option>
                                <option value="sad">${i18n.t('timeline.emotionSad')}</option>
                                <option value="angry">${i18n.t('timeline.emotionAngry')}</option>
                                <option value="fear">${i18n.t('timeline.emotionFear')}</option>
                                <option value="neutral">${i18n.t('timeline.emotionNeutral')}</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">${i18n.t('buttons.cancel')}</button>
                        <button class="btn btn-primary" id="save-character-change">${i18n.t('buttons.save')}</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Bind save button
        const saveBtn = document.getElementById('save-character-change');
        saveBtn.addEventListener('click', () => {
            const characterId = document.getElementById('change-character-select').value;
            const attrName = document.getElementById('change-attr-name').value.trim();
            const attrValue = document.getElementById('change-attr-value').value.trim();
            const emotion = document.getElementById('change-emotion').value;

            if (!characterId) {
                this.app.notificationManager.showError(i18n.t('timeline.pleaseSelectCharacter'));
                return;
            }

            this.addCharacterChange(paragraphId, characterId, attrName, attrValue, emotion);
            document.getElementById('change-modal').remove();
        });
    }

    /**
     * Show modal to add item change
     * @param {string} paragraphId - Paragraph ID
     */
    showAddItemChangeModal(paragraphId) {
        const story = this.state.currentStory;
        if (!story) return;

        // Get available items
        const items = story.items.map(i => `
            <option value="${i.id}">${i.name}</option>
        `).join('');

        const modalHtml = `
            <div class="modal-overlay" id="change-modal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>${i18n.t('timeline.addItemChange')}</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>${i18n.t('timeline.selectItem')}</label>
                            <select id="change-item-select" class="input-field">
                                <option value="">${i18n.t('timeline.selectItem')}</option>
                                ${items}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${i18n.t('timeline.action')}</label>
                            <select id="change-item-action" class="input-field">
                                <option value="acquire">${i18n.t('timeline.changeAcquire')}</option>
                                <option value="lose">${i18n.t('timeline.changeLose')}</option>
                                <option value="transfer">${i18n.t('timeline.changeTransfer')}</option>
                                <option value="modify">${i18n.t('timeline.changeModified')}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${i18n.t('timeline.propertyName')}</label>
                            <input type="text" id="change-prop-name" class="input-field" placeholder="${i18n.t('placeholders.propertyName')}">
                        </div>
                        <div class="form-group">
                            <label>${i18n.t('timeline.propertyValue')}</label>
                            <input type="text" id="change-prop-value" class="input-field" placeholder="${i18n.t('placeholders.propertyValue')}">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">${i18n.t('buttons.cancel')}</button>
                        <button class="btn btn-primary" id="save-item-change">${i18n.t('buttons.save')}</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Bind save button
        const saveBtn = document.getElementById('save-item-change');
        saveBtn.addEventListener('click', () => {
            const itemId = document.getElementById('change-item-select').value;
            const action = document.getElementById('change-item-action').value;
            const propName = document.getElementById('change-prop-name').value.trim();
            const propValue = document.getElementById('change-prop-value').value.trim();

            if (!itemId) {
                this.app.notificationManager.showError(i18n.t('timeline.pleaseSelectItem'));
                return;
            }

            this.addItemChange(paragraphId, itemId, action, propName, propValue);
            document.getElementById('change-modal').remove();
        });
    }

    /**
     * Show modal to edit existing character change
     * @param {string} paragraphId - Paragraph ID
     * @param {string} characterId - Character ID
     */
    showEditCharacterChangeModal(paragraphId, characterId) {
        const story = this.state.currentStory;
        if (!story) return;

        const chapter = story.chapters.find(c => c.id === this.state.selectedChapter);
        if (!chapter) return;

        const paragraph = chapter.paragraphs.find(p => p.id === paragraphId);
        if (!paragraph || !paragraph.changes) return;

        const charChange = paragraph.changes.characters?.find(c => c.characterId === characterId);
        if (!charChange) {
            this.showAddCharacterChangeModal(paragraphId);
            return;
        }

        const character = story.characters.find(c => c.id === characterId);
        const attrName = charChange.changes?.attributes ? Object.keys(charChange.changes.attributes)[0] || '' : '';
        const attrValue = charChange.changes?.attributes?.[attrName] || '';
        const emotion = charChange.changes?.emotionalState || '';

        const modalHtml = `
            <div class="modal-overlay" id="change-modal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>${i18n.t('timeline.editCharacterChange')} - ${character?.name || characterId}</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>${i18n.t('timeline.attributeName')}</label>
                            <input type="text" id="change-attr-name" class="input-field" value="${attrName}" placeholder="${i18n.t('placeholders.attributeName')}">
                        </div>
                        <div class="form-group">
                            <label>${i18n.t('timeline.attributeValue')}</label>
                            <input type="text" id="change-attr-value" class="input-field" value="${attrValue}" placeholder="${i18n.t('placeholders.attributeValue')}">
                        </div>
                        <div class="form-group">
                            <label>${i18n.t('timeline.emotionalState')}</label>
                            <select id="change-emotion" class="input-field">
                                <option value="">${i18n.t('timeline.noChange')}</option>
                                <option value="happy" ${emotion === 'happy' ? 'selected' : ''}>${i18n.t('timeline.emotionHappy')}</option>
                                <option value="sad" ${emotion === 'sad' ? 'selected' : ''}>${i18n.t('timeline.emotionSad')}</option>
                                <option value="angry" ${emotion === 'angry' ? 'selected' : ''}>${i18n.t('timeline.emotionAngry')}</option>
                                <option value="fear" ${emotion === 'fear' ? 'selected' : ''}>${i18n.t('timeline.emotionFear')}</option>
                                <option value="neutral" ${emotion === 'neutral' ? 'selected' : ''}>${i18n.t('timeline.emotionNeutral')}</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-danger" id="delete-character-change">${i18n.t('timeline.deleteChange')}</button>
                        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">${i18n.t('buttons.cancel')}</button>
                        <button class="btn btn-primary" id="save-character-change">${i18n.t('buttons.save')}</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Bind save button
        const saveBtn = document.getElementById('save-character-change');
        saveBtn.addEventListener('click', () => {
            const newAttrName = document.getElementById('change-attr-name').value.trim();
            const newAttrValue = document.getElementById('change-attr-value').value.trim();
            const newEmotion = document.getElementById('change-emotion').value;

            this.updateCharacterChange(paragraphId, characterId, newAttrName, newAttrValue, newEmotion);
            document.getElementById('change-modal').remove();
        });

        // Bind delete button
        const deleteBtn = document.getElementById('delete-character-change');
        deleteBtn.addEventListener('click', () => {
            if (confirm(i18n.t('timeline.confirmDeleteChange'))) {
                this.deleteCharacterChange(paragraphId, characterId);
                document.getElementById('change-modal').remove();
            }
        });
    }

    /**
     * Show modal to edit existing item change
     * @param {string} paragraphId - Paragraph ID
     * @param {string} itemId - Item ID
     */
    showEditItemChangeModal(paragraphId, itemId) {
        const story = this.state.currentStory;
        if (!story) return;

        const chapter = story.chapters.find(c => c.id === this.state.selectedChapter);
        if (!chapter) return;

        const paragraph = chapter.paragraphs.find(p => p.id === paragraphId);
        if (!paragraph || !paragraph.changes) return;

        const itemChange = paragraph.changes.items?.find(i => i.itemId === itemId);
        if (!itemChange) {
            this.showAddItemChangeModal(paragraphId);
            return;
        }

        const item = story.items.find(i => i.id === itemId);
        const propName = itemChange.changes?.properties ? Object.keys(itemChange.changes.properties)[0] || '' : '';
        const propValue = itemChange.changes?.properties?.[propName] || '';

        const modalHtml = `
            <div class="modal-overlay" id="change-modal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>${i18n.t('timeline.editItemChange')} - ${item?.name || itemId}</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>${i18n.t('timeline.action')}</label>
                            <select id="change-item-action" class="input-field">
                                <option value="acquire" ${itemChange.action === 'acquire' ? 'selected' : ''}>${i18n.t('timeline.changeAcquire')}</option>
                                <option value="lose" ${itemChange.action === 'lose' ? 'selected' : ''}>${i18n.t('timeline.changeLose')}</option>
                                <option value="transfer" ${itemChange.action === 'transfer' ? 'selected' : ''}>${i18n.t('timeline.changeTransfer')}</option>
                                <option value="modify" ${itemChange.action === 'modify' ? 'selected' : ''}>${i18n.t('timeline.changeModified')}</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>${i18n.t('timeline.propertyName')}</label>
                            <input type="text" id="change-prop-name" class="input-field" value="${propName}" placeholder="${i18n.t('placeholders.propertyName')}">
                        </div>
                        <div class="form-group">
                            <label>${i18n.t('timeline.propertyValue')}</label>
                            <input type="text" id="change-prop-value" class="input-field" value="${propValue}" placeholder="${i18n.t('placeholders.propertyValue')}">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-danger" id="delete-item-change">${i18n.t('timeline.deleteChange')}</button>
                        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">${i18n.t('buttons.cancel')}</button>
                        <button class="btn btn-primary" id="save-item-change">${i18n.t('buttons.save')}</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Bind save button
        const saveBtn = document.getElementById('save-item-change');
        saveBtn.addEventListener('click', () => {
            const action = document.getElementById('change-item-action').value;
            const propName = document.getElementById('change-prop-name').value.trim();
            const propValue = document.getElementById('change-prop-value').value.trim();

            this.updateItemChange(paragraphId, itemId, action, propName, propValue);
            document.getElementById('change-modal').remove();
        });

        // Bind delete button
        const deleteBtn = document.getElementById('delete-item-change');
        deleteBtn.addEventListener('click', () => {
            if (confirm(i18n.t('timeline.confirmDeleteChange'))) {
                this.deleteItemChange(paragraphId, itemId);
                document.getElementById('change-modal').remove();
            }
        });
    }

    /**
     * Add character change to paragraph
     * @param {string} paragraphId - Paragraph ID
     * @param {string} characterId - Character ID
     * @param {string} attrName - Attribute name
     * @param {string} attrValue - Attribute value
     * @param {string} emotion - Emotional state
     */
    addCharacterChange(paragraphId, characterId, attrName, attrValue, emotion) {
        const chapter = this.state.currentStory?.chapters.find(c => c.id === this.state.selectedChapter);
        if (!chapter) return;

        const paragraph = chapter.paragraphs.find(p => p.id === paragraphId);
        if (!paragraph) return;

        if (!paragraph.changes) {
            paragraph.changes = { characters: [], items: [] };
        }

        // Check if character change already exists
        const existingChange = paragraph.changes.characters.find(c => c.characterId === characterId);
        if (existingChange) {
            this.app.notificationManager.showError(i18n.t('timeline.characterChangeExists'));
            return;
        }

        const charChange = {
            characterId,
            changes: {}
        };

        if (attrName && attrValue) {
            charChange.changes.attributes = { [attrName]: attrValue };
        }

        if (emotion) {
            charChange.changes.emotionalState = emotion;
        }

        paragraph.changes.characters.push(charChange);
        this.state.saveToLocalStorage();
        this.renderParagraphs();
        this.app.notificationManager.showSuccess(i18n.t('timeline.characterChangeAdded'));
    }

    /**
     * Update character change in paragraph
     * @param {string} paragraphId - Paragraph ID
     * @param {string} characterId - Character ID
     * @param {string} attrName - Attribute name
     * @param {string} attrValue - Attribute value
     * @param {string} emotion - Emotional state
     */
    updateCharacterChange(paragraphId, characterId, attrName, attrValue, emotion) {
        const chapter = this.state.currentStory?.chapters.find(c => c.id === this.state.selectedChapter);
        if (!chapter) return;

        const paragraph = chapter.paragraphs.find(p => p.id === paragraphId);
        if (!paragraph || !paragraph.changes) return;

        const charChange = paragraph.changes.characters.find(c => c.characterId === characterId);
        if (!charChange) return;

        charChange.changes = {};

        if (attrName && attrValue) {
            charChange.changes.attributes = { [attrName]: attrValue };
        }

        if (emotion) {
            charChange.changes.emotionalState = emotion;
        }

        this.state.saveToLocalStorage();
        this.renderParagraphs();
        this.app.notificationManager.showSuccess(i18n.t('timeline.characterChangeUpdated'));
    }

    /**
     * Delete character change from paragraph
     * @param {string} paragraphId - Paragraph ID
     * @param {string} characterId - Character ID
     */
    deleteCharacterChange(paragraphId, characterId) {
        const chapter = this.state.currentStory?.chapters.find(c => c.id === this.state.selectedChapter);
        if (!chapter) return;

        const paragraph = chapter.paragraphs.find(p => p.id === paragraphId);
        if (!paragraph || !paragraph.changes) return;

        paragraph.changes.characters = paragraph.changes.characters.filter(c => c.characterId !== characterId);
        this.state.saveToLocalStorage();
        this.renderParagraphs();
        this.app.notificationManager.showSuccess(i18n.t('timeline.characterChangeDeleted'));
    }

    /**
     * Add item change to paragraph
     * @param {string} paragraphId - Paragraph ID
     * @param {string} itemId - Item ID
     * @param {string} action - Action type
     * @param {string} propName - Property name
     * @param {string} propValue - Property value
     */
    addItemChange(paragraphId, itemId, action, propName, propValue) {
        const chapter = this.state.currentStory?.chapters.find(c => c.id === this.state.selectedChapter);
        if (!chapter) return;

        const paragraph = chapter.paragraphs.find(p => p.id === paragraphId);
        if (!paragraph) return;

        if (!paragraph.changes) {
            paragraph.changes = { characters: [], items: [] };
        }

        // Check if item change already exists
        const existingChange = paragraph.changes.items.find(i => i.itemId === itemId);
        if (existingChange) {
            this.app.notificationManager.showError(i18n.t('timeline.itemChangeExists'));
            return;
        }

        const itemChange = {
            itemId,
            action,
            changes: {}
        };

        if (propName && propValue) {
            itemChange.changes.properties = { [propName]: propValue };
        }

        paragraph.changes.items.push(itemChange);
        this.state.saveToLocalStorage();
        this.renderParagraphs();
        this.app.notificationManager.showSuccess(i18n.t('timeline.itemChangeAdded'));
    }

    /**
     * Update item change in paragraph
     * @param {string} paragraphId - Paragraph ID
     * @param {string} itemId - Item ID
     * @param {string} action - Action type
     * @param {string} propName - Property name
     * @param {string} propValue - Property value
     */
    updateItemChange(paragraphId, itemId, action, propName, propValue) {
        const chapter = this.state.currentStory?.chapters.find(c => c.id === this.state.selectedChapter);
        if (!chapter) return;

        const paragraph = chapter.paragraphs.find(p => p.id === paragraphId);
        if (!paragraph || !paragraph.changes) return;

        const itemChange = paragraph.changes.items.find(i => i.itemId === itemId);
        if (!itemChange) return;

        itemChange.action = action;
        itemChange.changes = {};

        if (propName && propValue) {
            itemChange.changes.properties = { [propName]: propValue };
        }

        this.state.saveToLocalStorage();
        this.renderParagraphs();
        this.app.notificationManager.showSuccess(i18n.t('timeline.itemChangeUpdated'));
    }

    /**
     * Delete item change from paragraph
     * @param {string} paragraphId - Paragraph ID
     * @param {string} itemId - Item ID
     */
    deleteItemChange(paragraphId, itemId) {
        const chapter = this.state.currentStory?.chapters.find(c => c.id === this.state.selectedChapter);
        if (!chapter) return;

        const paragraph = chapter.paragraphs.find(p => p.id === paragraphId);
        if (!paragraph || !paragraph.changes) return;

        paragraph.changes.items = paragraph.changes.items.filter(i => i.itemId !== itemId);
        this.state.saveToLocalStorage();
        this.renderParagraphs();
        this.app.notificationManager.showSuccess(i18n.t('timeline.itemChangeDeleted'));
    }

    /**
     * Summarize character and item states at a specific paragraph
     * @param {string} paragraphId - Paragraph ID
/**
     * Summarize character and item states at a specific paragraph
     * @param {string} paragraphId - Paragraph ID
     */
    summarizeParagraphState(paragraphId) {
        const story = this.state.currentStory;
        if (!story) return;

        const chapterId = this.state.selectedChapter;
        if (!chapterId) return;

        // 检查是否已有弹窗显示，如果有则隐藏它（toggle行为）
        const existingModal = document.getElementById('state-summary-modal');
        if (existingModal) {
            existingModal.classList.toggle('hidden');
            return;
        }

        // 创建状态总结器
        const summary = new ParagraphStateSummary(story);

        // 计算状态
        const { characterStates, itemStates, locationStates } = summary.calculateStates(chapterId, paragraphId);

        // 生成 HTML
        const summaryHtml = summary.formatAsHTML(
            characterStates,
            itemStates,
            locationStates,
            (key) => i18n.t(key),
            (emotion) => this.translateEmotion(emotion),
            (action) => this.getItemActionLabel(action)
        );

        // 显示模态框
        document.body.insertAdjacentHTML('beforeend', summaryHtml);
    }
    /**
     * Show add change modal (redirects to specific type)
     * @param {string} paragraphId - Paragraph ID
     * @param {string} type - Type of change ('character' or 'item')
     */
    showAddChangeModal(paragraphId, type) {
        if (type === 'character') {
            this.showAddCharacterChangeModal(paragraphId);
        } else if (type === 'item') {
            this.showAddItemChangeModal(paragraphId);
        }
    }

    /**
     * Initialize global timeline controls
     */
    initGlobalTimelineControls() {
        const toggleBtn = document.getElementById('toggle-all-timelines');

        if (!toggleBtn) return;

        toggleBtn.addEventListener('click', () => {
            this.toggleAllTimelines();
        });
    }

    /**
     * Toggle all timeline sections
     */
    toggleAllTimelines() {
        const timelines = document.querySelectorAll('.paragraph-timeline-content');
        const toggleBtn = document.getElementById('toggle-all-timelines');
        const icon = toggleBtn.querySelector('.timeline-toggle-icon');

        if (timelines.length === 0) return;

        // Check current state (if any timeline is expanded)
        const anyExpanded = Array.from(timelines).some(tl => !tl.classList.contains('collapsed'));

        // Toggle all timelines and update internal state
        timelines.forEach(timeline => {
            const paragraphId = timeline.getAttribute('data-paragraph-id');
            if (anyExpanded) {
                // Collapse all
                timeline.classList.add('collapsed');
                this.expandedTimelines.delete(paragraphId);
            } else {
                // Expand all
                timeline.classList.remove('collapsed');
                this.expandedTimelines.add(paragraphId);
            }
        });

        // Update button icon
        icon.textContent = anyExpanded ? '▶' : '▼';

        // Update status
        this.updateTimelineStatus();
    }

    /**
     * Update timeline status text
     */
    updateTimelineStatus() {
        const toggleBtn = document.getElementById('toggle-all-timelines');
        const icon = toggleBtn?.querySelector('.timeline-toggle-icon');

        if (!icon) return;

        const timelines = document.querySelectorAll('.paragraph-timeline-content');
        if (timelines.length === 0) {
            icon.textContent = '▶';
            return;
        }

        const expandedCount = Array.from(timelines).filter(tl => !tl.classList.contains('collapsed')).length;
        const totalCount = timelines.length;

        if (expandedCount === 0) {
            icon.textContent = '▶';
        } else if (expandedCount === totalCount) {
            icon.textContent = '▼';
        } else {
            icon.textContent = '▼';
        }
    }

}

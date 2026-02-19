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
        } else {
            contentPanel.classList.add('hidden');
            placeholderPanel.classList.add('active');
        }
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

            // Click to select
            bubble.addEventListener('click', (e) => {
                if (!e.target.classList.contains('btn') && e.target !== textarea) {
                    this.selectedParagraph = paragraphId;
                    this.renderParagraphs();
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

            // Delete button
            const deleteBtn = bubble.querySelector('[data-action="delete-paragraph"]');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (confirm('确定删除这个段落吗？')) {
                        this.state.deleteParagraph(this.state.selectedChapter, paragraphId);
                        if (this.selectedParagraph === paragraphId) {
                            this.selectedParagraph = null;
                        }
                    }
                });
            }
        });
    }

    /**
     * Render paragraph changes (characters and items)
     * @param {Object} paragraph - The paragraph object
     * @returns {string} HTML string for changes
     */
    renderParagraphChanges(paragraph) {
        if (!paragraph.changes || (paragraph.changes.characters?.length === 0 && paragraph.changes.items?.length === 0)) {
            return '';
        }

        const story = this.state.currentStory;
        const changes = [];

        paragraph.changes.characters?.forEach(charId => {
            const character = story?.characters.find(c => c.id === charId);
            if (character) {
                changes.push(`<span class="change-badge character">👤 ${character.name}</span>`);
            }
        });

        paragraph.changes.items?.forEach(itemId => {
            const item = story?.items.find(i => i.id === itemId);
            if (item) {
                changes.push(`<span class="change-badge item">🎒 ${item.name}</span>`);
            }
        });

        if (changes.length === 0) {
            return '';
        }

        return `
            <div class="paragraph-changes">
                <div class="paragraph-changes-label">涉及修改：</div>
                <div class="paragraph-changes-list">${changes.join('')}</div>
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
    renderCharacters() {
        const container = document.getElementById('characters');
        const story = this.state.currentStory;
        if (!story) return;

        container.innerHTML = story.characters.map(character => `
            <div class="list-item ${this.state.selectedCharacter === character.id ? 'active' : ''}"
                 data-character-id="${character.id}">
                <div class="list-item-header">
                    <span class="list-item-title">${character.name}</span>
                    <div class="list-item-actions">
                        <button class="btn btn-sm btn-delete" data-action="delete-character" data-character-id="${character.id}">删除</button>
                    </div>
                </div>
            </div>
        `).join('');

        this.bindCharacterEvents(container);

        if (story.characters.length === 0) {
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
        } else {
            contentPanel.classList.add('hidden');
            placeholderPanel.classList.add('active');
            this.clearCharacterForm();
        }
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

        container.innerHTML = story.items.map(item => `
            <div class="list-item ${this.state.selectedItem === item.id ? 'active' : ''}"
                 data-item-id="${item.id}">
                <div class="list-item-header">
                    <span class="list-item-title">${item.name}</span>
                    <span class="tag">${Constants.ITEM_TYPES[item.type] || item.type}</span>
                    <div class="list-item-actions">
                        <button class="btn btn-sm btn-delete" data-action="delete-item" data-item-id="${item.id}">删除</button>
                    </div>
                </div>
            </div>
        `).join('');

        this.bindItemEvents(container);

        if (story.items.length === 0) {
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
     * Render the settings list
     */
    renderSettings() {
        const container = document.getElementById('settings');
        const story = this.state.currentStory;
        if (!story) return;

        // Update parent dropdown
        const parentSelect = document.getElementById('setting-parent');
        parentSelect.innerHTML = '<option value="">无父级</option>' +
            story.settings.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

        container.innerHTML = story.settings.map(setting => `
            <div class="list-item ${this.state.selectedSetting === setting.id ? 'active' : ''}"
                 data-setting-id="${setting.id}">
                <div class="list-item-header">
                    <span class="list-item-title">${setting.name}</span>
                    <span class="tag">${Constants.SETTING_TYPES[setting.type] || setting.type}</span>
                    <div class="list-item-actions">
                        <button class="btn btn-sm btn-delete" data-action="delete-setting" data-setting-id="${setting.id}">删除</button>
                    </div>
                </div>
            </div>
        `).join('');

        this.bindSettingEvents(container);

        if (story.settings.length === 0) {
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
}

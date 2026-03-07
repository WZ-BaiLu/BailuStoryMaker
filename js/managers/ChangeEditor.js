/**
 * ChangeEditor
 * Handles editing of element changes (character/item/location)
 * Extracted from UIRenderer to reduce complexity
 */
class ChangeEditor {
    constructor(state, app) {
        this.state = state;
        this.app = app;
    }

    /**
     * Show modal to edit a character change
     * @param {string} paragraphId - Paragraph ID
     * @param {string} characterId - Character ID
     */
    showEditCharacterChangeModal(paragraphId, characterId) {
        const story = this.state.currentStory;
        if (!story) {
            this.app.notificationManager.showError('无法加载故事数据');
            return;
        }

        const chapter = story.chapters.find(c => c.id === this.state.selectedChapter);
        if (!chapter) {
            this.app.notificationManager.showError('无法加载章节');
            return;
        }

        const paragraph = chapter.paragraphs.find(p => p.id === paragraphId);
        if (!paragraph || !paragraph.changes) {
            this.app.notificationManager.showError('无法加载段落数据');
            return;
        }

        const charChange = paragraph.changes.elements?.find(e => e.elementId === characterId && e.elementType === 'character');
        if (!charChange) {
            this.showAddCharacterChangeModal(paragraphId);
            return;
        }

        const character = story.characters.find(c => c.id === characterId);
        const attrName = charChange.changes?.attributes ? Object.keys(charChange.changes.attributes)[0] || '' : '';
        const attrValue = charChange.changes?.attributes?.[attrName] || '';
        const emotion = charChange.changes?.emotionalState || '';

        const modalHtml = this._createCharacterChangeModalHtml(character, attrName, attrValue, emotion);
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const modal = document.getElementById('change-modal');
        
        // Bind save button
        const saveBtn = document.getElementById('save-character-change');
        saveBtn.addEventListener('click', () => {
            const newAttrName = document.getElementById('change-attr-name').value.trim();
            const newAttrValue = document.getElementById('change-attr-value').value.trim();
            const newEmotion = document.getElementById('change-emotion').value;

            this._handleCharacterChangeSave(paragraphId, characterId, newAttrName, newAttrValue, newEmotion, modal);
        });

        // Bind delete button
        const deleteBtn = document.getElementById('delete-character-change');
        deleteBtn.addEventListener('click', () => {
            if (confirm(i18n.t('timeline.confirmDeleteChange'))) {
                this._handleCharacterChangeDelete(paragraphId, characterId, modal);
            }
        });
    }

    /**
     * Show modal to add a new character change
     * @param {string} paragraphId - Paragraph ID
     */
    showAddCharacterChangeModal(paragraphId) {
        const story = this.state.currentStory;
        if (!story) {
            this.app.notificationManager.showError('无法加载故事数据');
            return;
        }

        const chapter = story.chapters.find(c => c.id === this.state.selectedChapter);
        if (!chapter) {
            this.app.notificationManager.showError('无法加载章节');
            return;
        }

        const paragraph = chapter.paragraphs.find(p => p.id === paragraphId);
        if (!paragraph) {
            this.app.notificationManager.showError('无法加载段落');
            return;
        }

        const existingCharacterIds = paragraph.changes?.elements
            ?.filter(e => e.elementType === 'character')
            .map(e => e.elementId) || [];
        
        const availableCharacters = story.characters.filter(c => !existingCharacterIds.includes(c.id));
        
        if (availableCharacters.length === 0) {
            this.app.notificationManager.showWarning('没有可用的人物');
            return;
        }

        const characterOptions = availableCharacters.map(c => 
            `<option value="${c.id}">${c.name}</option>`
        ).join('');

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
                                ${characterOptions}
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

        const modal = document.getElementById('change-modal');
        const saveBtn = document.getElementById('save-character-change');
        saveBtn.addEventListener('click', () => {
            const characterId = document.getElementById('change-character-select').value;
            const attrName = document.getElementById('change-attr-name').value.trim();
            const attrValue = document.getElementById('change-attr-value').value.trim();
            const emotion = document.getElementById('change-emotion').value;

            this._handleCharacterChangeSave(paragraphId, characterId, attrName, attrValue, emotion, modal);
        });
    }

    /**
     * Create HTML for character change modal
     */
    _createCharacterChangeModalHtml(character, attrName, attrValue, emotion) {
        return `
            <div class="modal-overlay" id="change-modal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>${i18n.t('timeline.editCharacterChange')} - ${character?.name || ''}</h3>
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
    }

    /**
     * Handle character change save
     */
    _handleCharacterChangeSave(paragraphId, characterId, attrName, attrValue, emotion, modal) {
        try {
            this.updateCharacterChange(paragraphId, characterId, attrName, attrValue, emotion);
            modal.remove();
            this.app.notificationManager.showSuccess('保存成功');
        } catch (error) {
            console.error('[ChangeEditor] Failed to save character change:', error);
            this.app.notificationManager.showError('保存失败: ' + error.message);
        }
    }

    /**
     * Handle character change delete
     */
    _handleCharacterChangeDelete(paragraphId, characterId, modal) {
        try {
            this.deleteCharacterChange(paragraphId, characterId);
            modal.remove();
            this.app.notificationManager.showSuccess('删除成功');
        } catch (error) {
            console.error('[ChangeEditor] Failed to delete character change:', error);
            this.app.notificationManager.showError('删除失败: ' + error.message);
        }
    }

    /**
     * Update character change
     */
    updateCharacterChange(paragraphId, characterId, attrName, attrValue, emotion) {
        const chapter = this.state.currentStory.chapters.find(c => c.id === this.state.selectedChapter);
        const paragraph = chapter.paragraphs.find(p => p.id === paragraphId);
        
        if (!paragraph.changes) {
            paragraph.changes = { elements: [] };
        }
        if (!paragraph.changes.elements) {
            paragraph.changes.elements = [];
        }

        const existingChange = paragraph.changes.elements.find(
            e => e.elementId === characterId && e.elementType === 'character'
        );

        if (existingChange) {
            // Update existing change
            existingChange.changes = {
                attributes: attrName ? { [attrName]: attrValue } : undefined,
                emotionalState: emotion || undefined
            };
        } else {
            // Add new change
            paragraph.changes.elements.push({
                elementId: characterId,
                elementType: 'character',
                changes: {
                    attributes: attrName ? { [attrName]: attrValue } : undefined,
                    emotionalState: emotion || undefined
                }
            });
        }

        this.state.updateParagraph(paragraphId, paragraph);
        this.app.uiRenderer.renderParagraphs();
    }

    /**
     * Delete character change
     */
    deleteCharacterChange(paragraphId, characterId) {
        const chapter = this.state.currentStory.chapters.find(c => c.id === this.state.selectedChapter);
        const paragraph = chapter.paragraphs.find(p => p.id === paragraphId);

        if (!paragraph.changes || !paragraph.changes.elements) return;

        paragraph.changes.elements = paragraph.changes.elements.filter(
            e => !(e.elementId === characterId && e.elementType === 'character')
        );

        this.state.updateParagraph(paragraphId, paragraph);
        this.app.uiRenderer.renderParagraphs();
    }
}

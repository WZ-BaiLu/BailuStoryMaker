/**
 * AIStateManager
 * Handles character and item state updates for AIManager
 * Extracted from AIManager to reduce complexity
 */
class AIStateManager {
    constructor(state) {
        this.state = state;
    }

    /**
     * Update character state
     * @param {string} characterId - Character ID
     * @param {Object} changes - Changes to apply
     * @param {string} paragraphId - Paragraph ID
     * @returns {Object} Result
     */
    async updateCharacterState(characterId, changes, paragraphId) {
        // Validate character ID
        const character = this.state.currentStory?.characters.find(c => c.id === characterId);
        if (!character) {
            throw new Error(`Character not found: ${characterId}`);
        }

        // Apply changes
        if (changes.attributes) {
            if (!character.attributes) {
                character.attributes = {};
            }
            Object.assign(character.attributes, changes.attributes);
        }

        if (changes.emotionalState) {
            character.emotionalState = changes.emotionalState;
        }

        // Update character
        this.state.updateCharacter(characterId, character);

        // Add change to paragraph
        this._addCharacterChangeToParagraph(characterId, changes, paragraphId);

        return {
            characterId,
            changes,
            message: `Character state updated`
        };
    }

    /**
     * Update item state
     * @param {string} itemId - Item ID
     * @param {string} action - Action type (acquire, lose, transfer, modify)
     * @param {string} characterId - Character ID (for acquire/lose/transfer)
     * @param {string} location - Location
     * @param {string} paragraphId - Paragraph ID
     * @returns {Object} Result
     */
    async updateItemState(itemId, action, characterId, location, paragraphId) {
        const item = this.state.currentStory?.items.find(i => i.id === itemId);
        if (!item) {
            throw new Error(`Item not found: ${itemId}`);
        }

        // Validate action
        const validActions = ['acquire', 'lose', 'transfer', 'modify'];
        if (!validActions.includes(action)) {
            throw new Error(`Invalid action: ${action}. Must be one of: ${validActions.join(', ')}`);
        }

        // Validate character ID for acquire/lose/transfer actions
        if (['acquire', 'lose', 'transfer'].includes(action) && !characterId) {
            throw new Error('Character ID is required for this action');
        }

        if (characterId) {
            const character = this.state.currentStory?.characters.find(c => c.id === characterId);
            if (!character) {
                throw new Error(`Character not found: ${characterId}`);
            }
        }

        // Validate paragraph ID
        const paragraphIdToUse = paragraphId || this.state.selectedChapter;
        if (!paragraphIdToUse) {
            throw new Error('No paragraph ID specified and no chapter selected');
        }

        // Apply action to item
        const result = this._applyItemAction(item, action, characterId);
        
        // Update item
        this.state.updateItem(itemId, item);

        // Add change to paragraph
        this._addItemChangeToParagraph(itemId, action, characterId, location, paragraphIdToUse);

        return {
            itemId,
            itemName: item.name,
            action,
            message: result.message
        };
    }

    /**
     * Apply action to item
     * @private
     */
    _applyItemAction(item, action, characterId) {
        switch (action) {
            case 'acquire':
                item.owner = characterId;
                return { message: `${item.name} acquired` };
            case 'lose':
                if (item.owner === characterId) {
                    item.owner = null;
                }
                return { message: `${item.name} lost` };
            case 'transfer':
                item.owner = characterId;
                return { message: `${item.name} transferred` };
            case 'modify':
                return { message: `${item.name} modified` };
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    /**
     * Add character change to paragraph
     * @private
     */
    _addCharacterChangeToParagraph(characterId, changes, paragraphId) {
        const chapter = this.state.currentStory?.chapters.find(c => c.id === this.state.selectedChapter);
        if (!chapter) return;

        const paragraph = chapter.paragraphs?.find(p => p.id === paragraphId);
        if (!paragraph) return;

        if (!paragraph.changes) {
            paragraph.changes = { elements: [] };
        }
        if (!paragraph.changes.elements) {
            paragraph.changes.elements = [];
        }

        paragraph.changes.elements.push({
            elementId: characterId,
            elementType: 'character',
            changes
        });

        this.state.updateParagraph(this.state.selectedChapter, paragraphId, { changes: paragraph.changes });
    }

    /**
     * Add item change to paragraph
     * @private
     */
    _addItemChangeToParagraph(itemId, action, characterId, location, paragraphId) {
        const chapter = this.state.currentStory?.chapters.find(c => c.id === this.state.selectedChapter);
        if (!chapter) return;

        const paragraph = chapter.paragraphs?.find(p => p.id === paragraphId);
        if (!paragraph) return;

        const item = this.state.currentStory.items.find(i => i.id === itemId);

        if (!paragraph.changes) {
            paragraph.changes = { elements: [] };
        }
        if (!paragraph.changes.elements) {
            paragraph.changes.elements = [];
        }

        paragraph.changes.elements.push({
            elementId: itemId,
            itemName: item?.name || itemId,
            action,
            characterId: characterId || null,
            location: location || null,
            elementType: 'item'
        });

        this.state.updateParagraph(this.state.selectedChapter, paragraphId, { changes: paragraph.changes });
    }
}

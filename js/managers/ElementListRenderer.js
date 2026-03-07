/**
 * ElementListRenderer
 * Handles rendering of element lists (characters, items, locations, settings)
 * Extracted from UIRenderer to reduce complexity and code duplication
 */
class ElementListRenderer {
    constructor(state) {
        this.state = state;
    }

    /**
     * Render elements list with error handling
     * @param {string} containerId - Container element ID
     * @param {Array} elements - Elements to render
     * @param {Object} options - Rendering options
     */
    renderElementsList(containerId, elements, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!elements || elements.length === 0) {
            this._renderEmptyState(container, options.emptyIcon || '📦', options.emptyText || '暂无元素');
            return;
        }

        const { selectedId, tagMap, actionLabel } = options;

        const html = elements.map(element => {
            const isSelected = selectedId === element.id ? 'active' : '';
            const tag = tagMap ? tagMap[element.type] || element.type : element.type;
            const action = actionLabel || '删除';
            
            return `
                <div class="list-item ${isSelected}"
                     data-element-id="${element.id}"
                     data-element-type="${element.type}">
                    <div class="list-item-header">
                        <span class="list-item-title">${element.name}</span>
                        <span class="tag">${tag}</span>
                        <div class="list-item-actions">
                            <button class="btn btn-sm btn-delete" data-action="delete-element" data-element-id="${element.id}">${action}</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    /**
     * Render filtered elements by type
     * @param {string} containerId - Container element ID
     * @param {string} elementType - Element type to filter
     * @param {Object} options - Rendering options
     */
    renderElementsByType(containerId, elementType, options = {}) {
        const story = this.state.currentStory;
        if (!story) return;

        const allElements = story.elements || [];
        const filteredElements = allElements.filter(el => el.type === elementType);

        const defaultOptions = {
            selectedId: this.state.selectedElement,
            tagMap: {
                character: '角色',
                item: '道具',
                location: '地点',
                memory: '记忆',
                base: '设定'
            },
            emptyIcon: this._getEmptyIcon(elementType),
            emptyText: this._getEmptyText(elementType)
        };

        this.renderElementsList(containerId, filteredElements, { ...defaultOptions, ...options });
    }

    /**
     * Render all elements in main container
     */
    renderAllElements() {
        const allContainer = document.getElementById('all-elements');
        const charactersContainer = document.getElementById('characters');
        const itemsContainer = document.getElementById('items');
        const settingsContainer = document.getElementById('settings');

        const story = this.state.currentStory;
        if (!story) return;

        const elements = story.elements || [];

        // Render all elements
        const allOptions = {
            selectedId: this.state.selectedElement,
            tagMap: {
                character: '角色',
                item: '道具',
                location: '地点',
                memory: '记忆',
                base: '设定'
            },
            emptyIcon: '📦',
            emptyText: i18n.t('messages.noCharacters')
        };
        this.renderElementsList('all-elements', elements, allOptions);

        // Render by type
        this.renderElementsByType('characters', 'character', { selectedId: this.state.selectedCharacter });
        this.renderElementsByType('items', 'item');
        this.renderElementsByType('settings', 'base');
        this.renderElementsByType('settings', 'location');
    }

    /**
     * Render empty state
     */
    _renderEmptyState(container, icon, text) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${icon}</div>
                <div class="empty-state-text">${text}</div>
            </div>
        `;
    }

    /**
     * Get empty icon for element type
     */
    _getEmptyIcon(elementType) {
        const icons = {
            character: '👤',
            item: '🎒',
            location: '🏰',
            memory: '💭',
            base: '🏰'
        };
        return icons[elementType] || '📦';
    }

    /**
     * Get empty text for element type
     */
    _getEmptyText(elementType) {
        const texts = {
            character: i18n.t('messages.noCharacters'),
            item: i18n.t('messages.noItems'),
            location: i18n.t('messages.noSettings'),
            memory: '暂无记忆',
            base: i18n.t('messages.noSettings')
        };
        return texts[elementType] || '暂无元素';
    }
}

/**
 * Paragraph State Transitions
 * Pure functions for paragraph state transformations
 */

/**
 * Add a new paragraph to a chapter
 * @param {Array} paragraphs - Current paragraphs array
 * @param {Object} paragraphData - Paragraph data
 * @returns {Object} Result with new array and created paragraph
 */
export function addParagraph(paragraphs, paragraphData = {}) {
    const newParagraph = {
        id: paragraphData.id || generateId('paragraph'),
        order: paragraphs.length + 1,
        content: paragraphData.content || '',
        analysis: paragraphData.analysis || null,
        changes: paragraphData.changes || null,
        createdAt: paragraphData.createdAt || formatDate(),
        updatedAt: paragraphData.updatedAt || formatDate()
    };

    return {
        paragraphs: [...paragraphs, newParagraph],
        paragraph: newParagraph
    };
}

/**
 * Update a paragraph
 * @param {Array} paragraphs - Current paragraphs array
 * @param {string} paragraphId - Paragraph ID to update
 * @param {Object} updates - Updates to apply
 * @returns {Array} New paragraphs array
 */
export function updateParagraph(paragraphs, paragraphId, updates) {
    return paragraphs.map(p => {
        if (p.id === paragraphId) {
            return {
                ...p,
                ...updates,
                updatedAt: formatDate()
            };
        }
        return p;
    });
}

/**
 * Delete a paragraph
 * @param {Array} paragraphs - Current paragraphs array
 * @param {string} paragraphId - Paragraph ID to delete
 * @returns {Array} New paragraphs array
 */
export function deleteParagraph(paragraphs, paragraphId) {
    return paragraphs.filter(p => p.id !== paragraphId);
}

/**
 * Reorder paragraphs
 * @param {Array} paragraphs - Current paragraphs array
 * @param {number} oldIndex - Old index
 * @param {number} newIndex - New index
 * @returns {Array} New reordered paragraphs array
 */
export function reorderParagraphs(paragraphs, oldIndex, newIndex) {
    const result = [...paragraphs];
    const [removed] = result.splice(oldIndex, 1);
    result.splice(newIndex, 0, removed);
    
    return result.map((p, i) => ({
        ...p,
        order: i + 1
    }));
}

/**
 * Add character change to paragraph
 * @param {Array} paragraphs - Current paragraphs array
 * @param {string} paragraphId - Paragraph ID
 * @param {string} characterId - Character ID
 * @param {Object} changes - Changes to apply
 * @returns {Array} New paragraphs array
 */
export function addCharacterChangeToParagraph(paragraphs, paragraphId, characterId, changes) {
    return paragraphs.map(p => {
        if (p.id === paragraphId) {
            const changesArray = p.changes?.elements || [];
            return {
                ...p,
                changes: {
                    ...p.changes,
                    elements: [
                        ...changesArray,
                        {
                            elementId: characterId,
                            elementType: 'character',
                            changes
                        }
                    ]
                }
            };
        }
        return p;
    });
}

/**
 * Add item change to paragraph
 * @param {Array} paragraphs - Current paragraphs array
 * @param {string} paragraphId - Paragraph ID
 * @param {Object} itemChange - Item change data
 * @returns {Array} New paragraphs array
 */
export function addItemChangeToParagraph(paragraphs, paragraphId, itemChange) {
    return paragraphs.map(p => {
        if (p.id === paragraphId) {
            const changesArray = p.changes?.elements || [];
            return {
                ...p,
                changes: {
                    ...p.changes,
                    elements: [
                        ...changesArray,
                        {
                            ...itemChange,
                            elementType: 'item'
                        }
                    ]
                }
            };
        }
        return p;
    });
}

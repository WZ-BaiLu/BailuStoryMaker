/**
 * Item State Transitions
 * Pure functions for item state transformations
 */

/**
 * Create a new item
 * @param {Object} data - Item data
 * @returns {Object} Created item
 */
export function createItem(data = {}) {
    return {
        id: data.id || generateId('item'),
        name: data.name || '未命名道具',
        description: data.description || '',
        notes: data.notes || '',
        type: data.type || 'item',
        properties: data.properties || { current: {}, previous: {} },
        state: data.state || {},
        owner: data.owner || null,
        location: data.location || null,
        createdAt: data.createdAt || formatDate(),
        updatedAt: data.updatedAt || formatDate()
    };
}

/**
 * Update an item
 * @param {Object} item - Current item
 * @param {Object} updates - Updates to apply
 * @returns {Object} Updated item
 */
export function updateItem(item, updates) {
    return {
        ...item,
        ...updates,
        updatedAt: formatDate()
    };
}

/**
 * Update item properties
 * @param {Object} item - Current item
 * @param {Object} properties - New properties
 * @returns {Object} Updated item
 */
export function updateItemProperties(item, properties) {
    return {
        ...item,
        properties: {
            current: {
                ...item.properties.current,
                ...properties
            },
            previous: { ...item.properties.current }
        },
        updatedAt: formatDate()
    };
}

/**
 * Transfer item to character
 * @param {Object} item - Current item
 * @param {string} characterId - New owner character ID
 * @returns {Object} Updated item
 */
export function transferItemToCharacter(item, characterId) {
    return {
        ...item,
        owner: characterId,
        location: null,
        state: {
            ...item.state,
            location: 'held'
        },
        updatedAt: formatDate()
    };
}

/**
 * Remove item from character
 * @param {Object} item - Current item
 * @returns {Object} Updated item
 */
export function removeItemFromCharacter(item) {
    return {
        ...item,
        owner: null,
        state: {
            ...item.state,
            location: 'dropped'
        },
        updatedAt: formatDate()
    };
}

/**
 * Set item location
 * @param {Object} item - Current item
 * @param {string} location - New location
 * @returns {Object} Updated item
 */
export function setItemLocation(item, location) {
    return {
        ...item,
        location: location,
        state: {
            ...item.state,
            location: location
        },
        updatedAt: formatDate()
    };
}

/**
 * Update item state
 * @param {Object} item - Current item
 * @param {string} key - State key
 * @param {any} value - State value
 * @returns {Object} Updated item
 */
export function updateItemState(item, key, value) {
    return {
        ...item,
        state: {
            ...item.state,
            [key]: value
        },
        updatedAt: formatDate()
    };
}

/**
 * Clone item (for branching storylines)
 * @param {Object} item - Current item
 * @returns {Object} Cloned item
 */
export function cloneItem(item) {
    return {
        ...item,
        id: generateId('item'),
        createdAt: formatDate(),
        updatedAt: formatDate()
    };
}

/**
 * Apply item action (acquire, lose, transfer, modify)
 * @param {Object} item - Current item
 * @param {string} action - Action type
 * @param {string} characterId - Character ID (for acquire/lose/transfer)
 * @returns {Object} Result with updated item and message
 */
export function applyItemAction(item, action, characterId = null) {
    switch (action) {
        case 'acquire':
            return {
                item: transferItemToCharacter(item, characterId),
                message: `${item.name} 被 ${characterId} 获得`
            };
        case 'lose':
            return {
                item: removeItemFromCharacter(item),
                message: `${item.name} 被丢弃`
            };
        case 'transfer':
            return {
                item: transferItemToCharacter(item, characterId),
                message: `${item.name} 转移给 ${characterId}`
            };
        case 'modify':
            return {
                item: updateItem(item, {}),
                message: `${item.name} 被修改`
            };
        default:
            throw new Error(`Unknown action: ${action}`);
    }
}

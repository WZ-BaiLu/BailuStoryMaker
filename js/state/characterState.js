/**
 * Character State Transitions
 * Pure functions for character state transformations
 */

/**
 * Create a new character
 * @param {Object} data - Character data
 * @returns {Object} Created character
 */
export function createCharacter(data = {}) {
    return {
        id: data.id || generateId('character'),
        name: data.name || '未命名角色',
        description: data.description || '',
        notes: data.notes || '',
        attributes: data.attributes || {},
        abilities: data.abilities || [],
        state: data.state || {},
        emotionalState: data.emotionalState || 'neutral',
        createdAt: data.createdAt || formatDate(),
        updatedAt: data.updatedAt || formatDate()
    };
}

/**
 * Update a character
 * @param {Object} character - Current character
 * @param {Object} updates - Updates to apply
 * @returns {Object} Updated character
 */
export function updateCharacter(character, updates) {
    return {
        ...character,
        ...updates,
        updatedAt: formatDate()
    };
}

/**
 * Update character attributes
 * @param {Object} character - Current character
 * @param {Object} attributes - New attributes
 * @returns {Object} Updated character
 */
export function updateCharacterAttributes(character, attributes) {
    return {
        ...character,
        attributes: {
            ...character.attributes,
            ...attributes
        },
        updatedAt: formatDate()
    };
}

/**
 * Update character emotional state
 * @param {Object} character - Current character
 * @param {string} emotion - New emotional state
 * @returns {Object} Updated character
 */
export function updateCharacterEmotion(character, emotion) {
    return {
        ...character,
        emotionalState: emotion,
        updatedAt: formatDate()
    };
}

/**
 * Add ability to character
 * @param {Object} character - Current character
 * @param {Object} ability - Ability data
 * @returns {Object} Updated character
 */
export function addAbilityToCharacter(character, ability) {
    return {
        ...character,
        abilities: [
            ...character.abilities,
            {
                id: ability.id || generateId('ability'),
                name: ability.name || '未命名技能',
                level: ability.level || '普通',
                description: ability.description || ''
            }
        ],
        updatedAt: formatDate()
    };
}

/**
 * Remove ability from character
 * @param {Object} character - Current character
 * @param {string} abilityId - Ability ID to remove
 * @returns {Object} Updated character
 */
export function removeAbilityFromCharacter(character, abilityId) {
    return {
        ...character,
        abilities: character.abilities.filter(a => a.id !== abilityId),
        updatedAt: formatDate()
    };
}

/**
 * Update character state property
 * @param {Object} character - Current character
 * @param {string} key - State key
 * @param {any} value - State value
 * @returns {Object} Updated character
 */
export function updateCharacterState(character, key, value) {
    return {
        ...character,
        state: {
            ...character.state,
            [key]: value
        },
        updatedAt: formatDate()
    };
}

/**
 * Clone character state (for branching storylines)
 * @param {Object} character - Current character
 * @returns {Object} Cloned character
 */
export function cloneCharacter(character) {
    return {
        ...character,
        id: generateId('character'),
        createdAt: formatDate(),
        updatedAt: formatDate()
    };
}

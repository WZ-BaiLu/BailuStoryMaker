/**
 * AI Context Builder Module
 *
 * Generates context information for AI requests based on selected paragraph.
 * Ensures element and state information is accurate up to the selected paragraph.
 */

class AIContextBuilder {
    constructor(stateContextCache, elementManager, configManager) {
        this.stateContextCache = stateContextCache;
        this.elementManager = elementManager;
        this.configManager = configManager;
    }

    /**
     * Set state context cache (for late injection)
     * @param {Object} stateContextCache - StateContextCache instance
     */
    setStateContextCache(stateContextCache) {
        this.stateContextCache = stateContextCache;
    }

    /**
     * Set element manager (for late injection)
     * @param {Object} elementManager - ElementManager instance
     */
    setElementManager(elementManager) {
        this.elementManager = elementManager;
    }

    /**
     * Set config manager (for late injection)
     * @param {Object} configManager - ConfigManager instance
     */
    setConfigManager(configManager) {
        this.configManager = configManager;
    }

    /**
     * Build complete context object based on selected paragraph
     * @param {string} selectedParagraphId - Selected paragraph ID
     * @param {Object} options - Optional configuration
     * @param {number} options.includePreviousParagraphsWithChanges - Number of previous paragraphs with element changes to include (0 = all)
     * @param {Object} chapter - Chapter object (optional, can be fetched from DataManager)
     * @returns {Object} Context object (intermediate data structure)
     */
    buildContext(selectedParagraphId, options = {}, chapter = null) {
        // Get chapter from DataManager if not provided
        if (!chapter && window.dataManager) {
            const story = window.dataManager.getStory();
            if (story) {
                chapter = story.chapters.find(c => c.id === window.chapterManager?.currentChapterId);
            }
        }

        if (!chapter) {
            console.error('[AIContextBuilder] Cannot build context: chapter not found');
            return null;
        }

        if (!chapter.paragraphs || !Array.isArray(chapter.paragraphs)) {
            console.error('[AIContextBuilder] Cannot build context: chapter has no paragraphs', chapter);
            return null;
        }

        const context = {
            chapterTitle: chapter.title || '',
            selectedParagraphId: selectedParagraphId,
            totalParagraphs: chapter.paragraphs.length
        };

        // Get configuration for context paragraph range
        const contextParagraphRange = options.includePreviousParagraphsWithChanges !== undefined
            ? options.includePreviousParagraphsWithChanges
            : this.getContextParagraphRangeConfig();

        // Get paragraph content up to selected paragraph
        context.precedingText = this.getPrecedingText(
            chapter,
            selectedParagraphId,
            contextParagraphRange
        );

        // Set chapterContent (same as precedingText for now)
        context.chapterContent = context.precedingText;

        // Get element state summary up to selected paragraph
        if (this.stateContextCache) {
            try {
                const stateContext = this.stateContextCache.getContext(selectedParagraphId, {
                    useCache: false,
                    useViewLocation: true
                });

                if (stateContext && stateContext.elements) {
                    // Get present elements up to selected paragraph
                    const presentElements = this.getParagraphPresentElements(
                        chapter,
                        selectedParagraphId
                    );

                    // Build element state summary
                    context.elementStateSummary = this.buildElementStateSummary(
                        presentElements,
                        stateContext.elements
                    );
                }
            } catch (error) {
                console.error('[AIContextBuilder] Error getting state context:', error);
                context.elementStateSummary = '无在场元素';
            }
        } else {
            context.elementStateSummary = '无在场元素';
        }

        return context;
    }

    /**
     * Get context paragraph range configuration
     * @returns {number} Context paragraph range (0 = all, >0 = number of paragraphs with changes)
     */
    getContextParagraphRangeConfig() {
        try {
            const aiConfig = this.configManager?.getAIConfig();
            return aiConfig?.contextParagraphRange || 0; // Default to 0 (all paragraphs)
        } catch (error) {
            console.warn('[AIContextBuilder] Failed to get context paragraph range config:', error);
            return 0;
        }
    }

    /**
     * Get text content before specified paragraph
     * @param {Object} chapter - Chapter object
     * @param {string} paragraphId - Paragraph ID
     * @param {number} includePreviousParagraphsWithChanges - Number of previous paragraphs with element changes to include
     * @returns {string} Concatenated text content
     */
    getPrecedingText(chapter, paragraphId, includePreviousParagraphsWithChanges = 0) {
        const paragraphIndex = chapter.paragraphs.findIndex(p => p.id === paragraphId);
        if (paragraphIndex === -1) {
            console.warn(`[AIContextBuilder] Paragraph ${paragraphId} not found`);
            return '';
        }

        let startIndex = 0;

        if (includePreviousParagraphsWithChanges > 0) {
            // Find the Nth previous paragraph with element state changes
            const changeIndex = this.findParagraphWithElementChanges(
                chapter,
                paragraphIndex,
                includePreviousParagraphsWithChanges
            );
            startIndex = changeIndex >= 0 ? changeIndex : 0;
        }

        // Include paragraphs from startIndex to current paragraph
        const paragraphsToInclude = chapter.paragraphs.slice(startIndex, paragraphIndex + 1);
        return paragraphsToInclude.map(p => p.content).join('\n\n');
    }

    /**
     * Find paragraph with element changes
     * @param {Object} chapter - Chapter object
     * @param {number} currentIndex - Current paragraph index
     * @param {number} count - Number of paragraphs with changes to go back
     * @returns {number} Index of found paragraph, or -1 if not found
     */
    findParagraphWithElementChanges(chapter, currentIndex, count) {
        let foundCount = 0;

        for (let i = currentIndex; i >= 0; i--) {
            const paragraph = chapter.paragraphs[i];
            if (paragraph.changes && paragraph.changes.elements && paragraph.changes.elements.length > 0) {
                foundCount++;
                if (foundCount > count) {
                    // Found the (count+1)th paragraph with changes, return the next one
                    return i + 1;
                }
            }
        }

        // Didn't find enough paragraphs with changes, return 0 (from beginning)
        return -1;
    }

    /**
     * Get present elements up to specified paragraph
     * @param {Object} chapter - Chapter object
     * @param {string} paragraphId - Paragraph ID
     * @returns {Array} Array of present elements
     */
    getParagraphPresentElements(chapter, paragraphId) {
        if (!chapter || !chapter.paragraphs || !Array.isArray(chapter.paragraphs)) {
            return [];
        }

        const paragraphIndex = chapter.paragraphs.findIndex(p => p.id === paragraphId);
        if (paragraphIndex === -1) {
            return [];
        }

        const presentCharacterIds = new Set();
        const presentItemIds = new Set();
        const presentLocationIds = new Set();

        // Collect elements that appear up to and including the selected paragraph
        for (let i = 0; i <= paragraphIndex; i++) {
            const p = chapter.paragraphs[i];
            this._extractElementIdsFromParagraph(
                p,
                presentCharacterIds,
                presentItemIds,
                presentLocationIds
            );
        }

        // Build present elements list
        const presentElements = [];

        // Add characters
        presentCharacterIds.forEach(id => {
            const element = this.elementManager?.getElement(id);
            if (element) {
                presentElements.push({
                    id: element.id,
                    type: 'character',
                    name: element.name,
                    location: element.location
                });
            }
        });

        // Add items
        presentItemIds.forEach(id => {
            const element = this.elementManager?.getElement(id);
            if (element) {
                presentElements.push({
                    id: element.id,
                    type: 'item',
                    name: element.name,
                    location: element.location
                });
            }
        });

        // Add locations
        presentLocationIds.forEach(id => {
            const element = this.elementManager?.getElement(id);
            if (element) {
                presentElements.push({
                    id: element.id,
                    type: 'location',
                    name: element.name
                });
            }
        });

        return presentElements;
    }

    /**
     * Extract element IDs from paragraph
     * @private
     * @param {Object} paragraph - Paragraph object
     * @param {Set} characterIds - Set to collect character IDs
     * @param {Set} itemIds - Set to collect item IDs
     * @param {Set} locationIds - Set to collect location IDs
     */
    _extractElementIdsFromParagraph(paragraph, characterIds, itemIds, locationIds) {
        // Extract from changes.elements
        if (paragraph.changes && paragraph.changes.elements) {
            paragraph.changes.elements.forEach(elementChange => {
                if (elementChange.type === 'character' || elementChange.elementType === 'character') {
                    characterIds.add(elementChange.elementId);
                } else if (elementChange.type === 'item' || elementChange.elementType === 'item') {
                    itemIds.add(elementChange.elementId);
                } else if (elementChange.type === 'location' || elementChange.elementType === 'location') {
                    locationIds.add(elementChange.elementId);
                }
            });
        }

        // Extract from element appearances (if any)
        if (paragraph.elementAppearances) {
            paragraph.elementAppearances.forEach(appearance => {
                const type = appearance.elementType || appearance.type;
                if (type === 'character') {
                    characterIds.add(appearance.elementId);
                } else if (type === 'item') {
                    itemIds.add(appearance.elementId);
                } else if (type === 'location') {
                    locationIds.add(appearance.elementId);
                }
            });
        }
    }

    /**
     * Build element state summary
     * @param {Array} presentElements - Array of present elements up to selected paragraph
     * @param {Array} allElements - Array of all elements (from state context)
     * @returns {string} Formatted element state summary
     */
    buildElementStateSummary(presentElements, allElements) {
        if (!presentElements || presentElements.length === 0) {
            return '无在场元素';
        }

        // Get element states from state context cache if available
        const elementStates = {};
        if (this.stateContextCache && allElements) {
            allElements.forEach(element => {
                if (element) {
                    const currentState = this.stateContextCache.getCurrentElementState(element.id);
                    if (currentState) {
                        elementStates[element.id] = currentState;
                    }
                }
            });
        }

        // Group elements by type
        const characters = presentElements.filter(e => e.type === 'character');
        const items = presentElements.filter(e => e.type === 'item');
        const locations = presentElements.filter(e => e.type === 'location');

        const summaryLines = [];

        // Add characters
        if (characters.length > 0) {
            characters.forEach(char => {
                let statusText = `角色：${char.name}`;
                if (char.location) {
                    statusText += `，位置：${char.location}`;
                }
                // Add state information if available
                const state = elementStates[char.id];
                if (state && Object.keys(state).length > 0) {
                    const stateInfo = Object.entries(state)
                        .map(([key, value]) => `${key}=${value}`)
                        .join('，');
                    statusText += `，状态：${stateInfo}`;
                }
                summaryLines.push(statusText);
            });
        }

        // Add items
        if (items.length > 0) {
            items.forEach(item => {
                let statusText = `道具：${item.name}`;
                if (item.location) {
                    statusText += `，位置：${item.location}`;
                }
                summaryLines.push(statusText);
            });
        }

        // Add locations
        if (locations.length > 0) {
            locations.forEach(loc => {
                summaryLines.push(`地点：${loc.name}`);
            });
        }

        return summaryLines.join('\n');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIContextBuilder;
}

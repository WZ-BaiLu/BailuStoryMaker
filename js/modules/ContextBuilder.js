// Context Building Module

class ContextBuilder {
    constructor(story, stateContextCache = null) {
        this.story = story;
        this.stateContextCache = stateContextCache;
    }

    // Set state context cache (for late injection)
    setStateContextCache(stateContextCache) {
        this.stateContextCache = stateContextCache;
    }

    // Build complete context for prompt generation
    async buildContext(chapterId) {
        // If StateContextCache is available, use it for enhanced context
        if (this.stateContextCache) {
            return this.buildContextWithCache(chapterId);
        }

        // Fallback to traditional context building
        return this.buildTraditionalContext(chapterId);
    }

    // Build context using StateContextCache (new architecture)
    async buildContextWithCache(chapterId) {
        const chapter = this.getChapter(chapterId);
        if (!chapter) {
            return null;
        }

        // Get cached context with present elements
        const storyContext = await this.stateContextCache.getContext(chapterId);
        if (!storyContext) {
            return this.buildTraditionalContext(chapterId);
        }

        // Format for AI
        const context = {
            chapter: chapter,
            viewLocation: storyContext.viewLocation,
            presentElements: storyContext.presentElements,
            characters: this.formatPresentCharacters(storyContext),
            items: this.formatPresentItems(storyContext),
            setting: this.formatPresentSetting(storyContext),
            recentEvents: this.getRecentEvents(chapterId),
            narrativeContext: this.buildNarrativeContext(chapterId)
        };

        return context;
    }

    // Format present characters from story context
    formatPresentCharacters(storyContext) {
        const characterElements = storyContext.presentElements.filter(e => e.type === 'character');
        return characterElements.map(element => {
            const currentState = this.stateContextCache.getCurrentElementState(element.id) || {};
            return {
                id: element.id,
                name: element.name,
                description: element.description || '',
                location: element.location,
                keywords: element.keywords || [],
                state: currentState
            };
        });
    }

    // Format present items from story context
    formatPresentItems(storyContext) {
        const itemElements = storyContext.presentElements.filter(e => e.type === 'item');
        return itemElements.map(element => {
            const currentState = this.stateContextCache.getCurrentElementState(element.id) || {};
            return {
                id: element.id,
                name: element.name,
                type: element.elementType || 'item',
                description: element.description || '',
                location: element.location,
                keywords: element.keywords || [],
                state: currentState
            };
        });
    }

    // Format present setting from story context
    formatPresentSetting(storyContext) {
        const locationElements = storyContext.presentElements.filter(e => e.type === 'location' || e.type === 'base');
        if (locationElements.length === 0) {
            return null;
        }

        // Return the first location element (typically the view location)
        const location = locationElements[0];
        return {
            id: location.id,
            name: location.name,
            type: location.elementType || 'location',
            description: location.description || ''
        };
    }

    // Build narrative context (non-linear narrative support)
    buildNarrativeContext(chapterId) {
        const chapter = this.getChapter(chapterId);
        if (!chapter || !chapter.paragraphs || chapter.paragraphs.length === 0) {
            return null;
        }

        // Get first paragraph with storyTimestamp
        const firstParagraphWithTimestamp = chapter.paragraphs.find(p => p.storyTimestamp);
        if (!firstParagraphWithTimestamp || !firstParagraphWithTimestamp.storyTimestamp) {
            return { type: 'linear' };
        }

        const timestamp = firstParagraphWithTimestamp.storyTimestamp;
        return {
            type: timestamp.narrativeType || 'linear',
            referenceParagraph: timestamp.referenceParagraphId,
            timeOffset: timestamp.timeOffset,
            absoluteTime: timestamp.absoluteTime,
            relativeTime: timestamp.relativeTime
        };
    }

    // Build traditional context (fallback for old architecture)
    buildTraditionalContext(chapterId) {
        const context = {
            chapter: this.getChapter(chapterId),
            characters: this.getRelevantCharacters(chapterId),
            items: this.getRelevantItems(chapterId),
            setting: this.getCurrentSetting(chapterId),
            recentEvents: this.getRecentEvents(chapterId)
        };
        return context;
    }

    // Get chapter by ID
    getChapter(chapterId) {
        if (!chapterId || !this.story) return null;
        return this.story.chapters.find(c => c.id === chapterId) || null;
    }

    // Get all chapters up to specified chapter
    getPreviousChapters(chapterId) {
        if (!chapterId || !this.story) return [];

        const targetChapter = this.story.chapters.find(c => c.id === chapterId);
        if (!targetChapter) return [];

        return this.story.chapters
            .filter(c => c.order < targetChapter.order)
            .sort((a, b) => a.order - b.order);
    }

    // Get relevant characters (characters appearing in or before this chapter)
    getRelevantCharacters(chapterId) {
        if (!this.story || !this.story.characters) return [];

        // For now, return all characters
        // In a full implementation, track which characters appear in each chapter
        return this.story.characters.map(char => ({
            id: char.id,
            name: char.name,
            description: char.description || '',
            attributes: char.attributes || { base: {}, current: {} },
            abilities: char.abilities || [],
            notes: char.notes || ''
        }));
    }

    // Get relevant items (items relevant to this chapter)
    getRelevantItems(chapterId) {
        if (!this.story || !this.story.items) return [];

        // For now, return all items
        // In a full implementation, track which items are relevant to each chapter
        return this.story.items.map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            description: item.description || '',
            properties: item.properties || { base: {}, current: {} },
            owner: item.owner || null,
            changeHistory: item.changeHistory || []
        }));
    }

    // Get current setting for chapter
    getCurrentSetting(chapterId) {
        if (!this.story || !this.story.settings || this.story.settings.length === 0) {
            return null;
        }

        // Return the first world-level setting, or the first setting
        const worldSetting = this.story.settings.find(s => s.type === 'world');
        if (worldSetting) {
            return {
                id: worldSetting.id,
                name: worldSetting.name,
                type: worldSetting.type,
                description: worldSetting.description || '',
                details: worldSetting.details || {}
            };
        }

        // Fallback to first setting
        const firstSetting = this.story.settings[0];
        return {
            id: firstSetting.id,
            name: firstSetting.name,
            type: firstSetting.type,
            description: firstSetting.description || '',
            details: firstSetting.details || {}
        };
    }

    // Get recent events up to this chapter
    getRecentEvents(chapterId, limit = 10) {
        if (!this.story || !this.story.timeline) return [];

        const targetChapter = this.story.chapters.find(c => c.id === chapterId);
        if (!targetChapter) return [];

        // Get timeline events from chapters up to this one
        const allEvents = [];
        this.story.timeline.forEach(timelineEntry => {
            const chapter = this.story.chapters.find(c => c.id === timelineEntry.chapter);
            if (chapter && chapter.order <= targetChapter.order) {
                (timelineEntry.events || []).forEach(event => {
                    allEvents.push({
                        type: event.type,
                        description: event.description,
                        chapter: chapter.title,
                        timestamp: event.timestamp
                    });
                });
            }
        });

        // Sort by timestamp descending (most recent first) and limit
        return allEvents
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    // Get chapter summary for context
    getChapterSummary(chapterId) {
        const chapter = this.getChapter(chapterId);
        if (!chapter) return '';

        // Simple summary: first paragraph or first 200 characters
        const content = chapter.content || '';
        if (content.length <= 200) return content;

        // Try to split by paragraph
        const paragraphs = content.split('\n\n');
        if (paragraphs.length > 1) {
            return paragraphs[0];
        }

        // Fallback to first 200 characters
        return content.substring(0, 200) + '...';
    }

    // Get character state summary
    getCharacterStateSummary(characterId) {
        const character = this.story.characters?.find(c => c.id === characterId);
        if (!character) return '';

        const attributes = character.attributes?.current || {};
        const abilities = character.abilities || [];

        let summary = `${character.name}: `;

        // Add attributes
        const attrEntries = Object.entries(attributes);
        if (attrEntries.length > 0) {
            summary += attrEntries.map(([k, v]) => `${k}=${v}`).join(', ') + '. ';
        }

        // Add abilities
        if (abilities.length > 0) {
            summary += `Abilities: ${abilities.map(a => `${a.name} (Lv.${a.level})`).join(', ')}.`;
        }

        return summary;
    }

    // Get item state summary
    getItemStateSummary(itemId) {
        const item = this.story.items?.find(i => i.id === itemId);
        if (!item) return '';

        const properties = item.properties?.current || {};

        let summary = `${item.name} (${Constants.ITEM_TYPES[item.type] || item.type}): `;

        // Add properties
        const propEntries = Object.entries(properties);
        if (propEntries.length > 0) {
            summary += propEntries.map(([k, v]) => `${k}=${v}`).join(', ');
        }

        return summary;
    }

    // Build minimal context for low token usage
    buildMinimalContext(chapterId) {
        const context = {
            chapter: this.getChapter(chapterId),
            characters: this.getRelevantCharacters(chapterId)
                .slice(0, 3) // Limit to 3 characters
                .map(char => ({
                    name: char.name,
                    attributes: char.attributes?.current || {}
                })),
            items: this.getRelevantItems(chapterId)
                .slice(0, 2) // Limit to 2 items
                .map(item => ({
                    name: item.name,
                    properties: item.properties?.current || {}
                })),
            setting: this.getCurrentSetting(chapterId),
            recentEvents: this.getRecentEvents(chapterId, 5) // Limit to 5 events
        };
        return context;
    }
}

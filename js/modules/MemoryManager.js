// Memory Management Module for Token Optimization

class MemoryManager {
    constructor(story) {
        this.story = story;
        this.maxTokens = 2000; // Default max tokens
        this.chapterSummaries = new Map();
    }

    // Estimate token count (rough approximation)
    estimateTokens(text) {
        if (!text) return 0;
        // Chinese: ~1.5 tokens per character, English: ~0.25 tokens per word
        const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
        return Math.floor(chineseChars * 1.5 + englishWords * 0.25);
    }

    // Generate concise summary of a chapter
    summarizeChapter(chapter) {
        if (!chapter) return '';

        const content = chapter.content || '';
        if (content.length === 0) return chapter.title;

        // Check if we have cached summary
        const cacheKey = chapter.id;
        if (this.chapterSummaries.has(cacheKey)) {
            return this.chapterSummaries.get(cacheKey);
        }

        // Generate summary
        let summary = '';

        // If content is short, use it directly
        if (content.length <= 300) {
            summary = content;
        } else {
            // Try to extract key sentences
            const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 10);
            if (sentences.length > 0) {
                // Take first and last sentences for context
                summary = sentences[0].trim();
                if (sentences.length > 1) {
                    summary += ' ... ' + sentences[sentences.length - 1].trim();
                }
            } else {
                // Fallback: first paragraph
                const paragraphs = content.split('\n\n');
                summary = paragraphs[0].substring(0, 200);
            }
        }

        // Cache the summary
        this.chapterSummaries.set(cacheKey, summary);
        return summary;
    }

    // Generate character state summary
    summarizeCharacterState(character) {
        if (!character) return '';

        const attributes = character.attributes?.current || {};
        const abilities = character.abilities || [];

        let summary = `${character.name}`;

        // Add key attributes (limit to top 5)
        const attrEntries = Object.entries(attributes);
        if (attrEntries.length > 0) {
            const topAttrs = attrEntries.slice(0, 5);
            summary += ' - ' + topAttrs.map(([k, v]) => `${k}:${v}`).join(', ');
        }

        // Add abilities (limit to top 3)
        if (abilities.length > 0) {
            const topAbilities = abilities.slice(0, 3);
            summary += ' | ' + topAbilities.map(a => a.name).join(', ');
        }

        return summary;
    }

    // Generate item state summary
    summarizeItemState(item) {
        if (!item) return '';

        const properties = item.properties?.current || {};

        let summary = `${item.name}`;

        // Add key properties (limit to top 3)
        const propEntries = Object.entries(properties);
        if (propEntries.length > 0) {
            const topProps = propEntries.slice(0, 3);
            summary += ' - ' + topProps.map(([k, v]) => `${k}:${v}`).join(', ');
        }

        return summary;
    }

    // Compress context to fit within token limit
    compressContext(context, maxTokens = this.maxTokens) {
        let compressed = {
            chapter: null,
            characters: [],
            items: [],
            setting: null,
            recentEvents: []
        };

        // Chapter summary (always include)
        if (context.chapter) {
            const chapterSummary = {
                title: context.chapter.title,
                summary: this.summarizeChapter(context.chapter)
            };
            compressed.chapter = chapterSummary;
        }

        // Estimate remaining tokens
        const chapterTokens = this.estimateTokens(JSON.stringify(chapterSummary));
        let remainingTokens = maxTokens - chapterTokens - 200; // Reserve 200 for setting and events

        // Compress characters
        if (context.characters && context.characters.length > 0) {
            // Prioritize characters with more attributes/abilities
            const sortedCharacters = [...context.characters].sort((a, b) => {
                const aScore = Object.keys(a.attributes?.current || {}).length + (a.abilities?.length || 0);
                const bScore = Object.keys(b.attributes?.current || {}).length + (b.abilities?.length || 0);
                return bScore - aScore;
            });

            for (const char of sortedCharacters) {
                const charSummary = this.summarizeCharacterState(char);
                const charTokens = this.estimateTokens(charSummary);

                if (remainingTokens - charTokens >= 0) {
                    compressed.characters.push(charSummary);
                    remainingTokens -= charTokens;
                } else {
                    break;
                }
            }
        }

        // Compress items
        if (context.items && context.items.length > 0) {
            // Prioritize items with more properties
            const sortedItems = [...context.items].sort((a, b) => {
                const aScore = Object.keys(a.properties?.current || {}).length;
                const bScore = Object.keys(b.properties?.current || {}).length;
                return bScore - aScore;
            });

            for (const item of sortedItems) {
                const itemSummary = this.summarizeItemState(item);
                const itemTokens = this.estimateTokens(itemSummary);

                if (remainingTokens - itemTokens >= 0) {
                    compressed.items.push(itemSummary);
                    remainingTokens -= itemTokens;
                } else {
                    break;
                }
            }
        }

        // Add setting if possible
        if (context.setting && remainingTokens > 100) {
            compressed.setting = {
                name: context.setting.name,
                description: context.setting.description?.substring(0, 100) || ''
            };
            remainingTokens -= this.estimateTokens(JSON.stringify(compressed.setting));
        }

        // Add recent events
        if (context.recentEvents && context.recentEvents.length > 0 && remainingTokens > 0) {
            const events = context.recentEvents.slice(0, 5); // Limit to 5 events
            compressed.recentEvents = events.map(e => ({
                type: e.type,
                description: e.description?.substring(0, 50) || ''
            }));
        }

        return compressed;
    }

    // Selective context loading based on chapter
    loadSelectiveContext(chapterId, contextType = 'full') {
        if (!this.story) {
            return null;
        }

        const chapter = this.story.chapters?.find(c => c.id === chapterId);
        if (!chapter) {
            return null;
        }

        let context;
        const contextBuilder = new ContextBuilder(this.story);

        switch (contextType) {
            case 'minimal':
                context = contextBuilder.buildMinimalContext(chapterId);
                break;
            case 'compressed':
                const fullContext = contextBuilder.buildContext(chapterId);
                context = this.compressContext(fullContext);
                break;
            case 'full':
            default:
                context = contextBuilder.buildContext(chapterId);
                break;
        }

        return context;
    }

    // Optimize context for specific use cases
    optimizeContextForUseCase(context, useCase) {
        switch (useCase) {
            case 'dialogue':
                // Focus on characters
                return {
                    characters: context.characters,
                    setting: context.setting,
                    recentEvents: context.recentEvents?.slice(0, 3)
                };

            case 'action':
                // Focus on character abilities and items
                return {
                    characters: context.characters.map(c => ({
                        name: c.name,
                        abilities: c.abilities
                    })),
                    items: context.items,
                    setting: context.setting
                };

            case 'description':
                // Focus on setting and description
                return {
                    setting: context.setting,
                    characters: context.characters.map(c => ({ name: c.name })),
                    items: context.items
                };

            case 'plot':
                // Focus on events and chapter summary
                return {
                    chapter: context.chapter,
                    recentEvents: context.recentEvents,
                    characters: context.characters.map(c => ({ name: c.name }))
                };

            default:
                return context;
        }
    }

    // Cache management
    clearCache() {
        this.chapterSummaries.clear();
    }

    // Set max token limit
    setMaxTokens(tokens) {
        this.maxTokens = Math.max(500, tokens); // Minimum 500 tokens
    }

    // Get current token usage estimate
    estimateContextTokens(context) {
        if (!context) return 0;
        return this.estimateTokens(JSON.stringify(context));
    }
}

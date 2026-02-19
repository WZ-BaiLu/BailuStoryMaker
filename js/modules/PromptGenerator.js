// Prompt Generation Module

class PromptGenerator {
    constructor(templates) {
        this.templates = templates || Constants.PROMPT_TEMPLATES;
    }

    // Generate prompt using specified template
    generatePrompt(context, templateName = 'default') {
        const template = this.templates[templateName] || this.templates['default'];
        let prompt = template;

        // Replace chapter placeholders
        prompt = this.replaceChapterPlaceholders(prompt, context.chapter);

        // Replace character placeholders
        prompt = this.replaceCharacterPlaceholders(prompt, context.characters);

        // Replace item placeholders
        prompt = this.replaceItemPlaceholders(prompt, context.items);

        // Replace setting placeholders
        prompt = this.replaceSettingPlaceholders(prompt, context.setting);

        // Replace event placeholders
        prompt = this.replaceEventPlaceholders(prompt, context.recentEvents);

        return prompt;
    }

    // Replace chapter-related placeholders
    replaceChapterPlaceholders(template, chapter) {
        if (!chapter) {
            return template
                .replace('{{chapterTitle}}', '未选择章节')
                .replace('{{chapterContent}}', '')
                .replace('{{chapterSummary}}', '');
        }

        let result = template;
        result = result.replace('{{chapterTitle}}', chapter.title || '');
        result = result.replace('{{chapterContent}}', chapter.content || chapter.summary || '');
        result = result.replace('{{chapterSummary}}', chapter.summary || chapter.content || '');
        return result;
    }

    // Replace character-related placeholders
    replaceCharacterPlaceholders(template, characters) {
        if (!characters || characters.length === 0) {
            return template.replace('{{characters}}', '暂无角色信息');
        }

        let result = template;

        // Format character list
        const characterList = characters.map(c => {
            let text = `• ${c.name || '未知'}`;

            // Add attributes
            if (c.attributes && typeof c.attributes === 'string') {
                text += `: ${c.attributes}`;
            } else if (c.attributes && c.attributes.current) {
                const attrs = Object.entries(c.attributes.current);
                if (attrs.length > 0) {
                    text += ` - ${attrs.map(([k, v]) => `${k}:${v}`).join(', ')}`;
                }
            }

            // Add abilities
            if (c.abilities && c.abilities.length > 0) {
                if (typeof c.abilities === 'string') {
                    text += ` | ${c.abilities}`;
                } else {
                    text += ` | 能力: ${c.abilities.map(a => a.name).join(', ')}`;
                }
            }

            return text;
        }).join('\n');

        result = result.replace('{{characters}}', characterList);

        // Replace individual character placeholders (if any)
        for (let i = 0; i < characters.length; i++) {
            const c = characters[i];
            result = result.replace(new RegExp(`\\{\\{character${i + 1}\\}\\}`, 'g'), c.name || '');
        }

        return result;
    }

    // Replace item-related placeholders
    replaceItemPlaceholders(template, items) {
        if (!items || items.length === 0) {
            return template.replace('{{items}}', '暂无道具信息');
        }

        let result = template;

        // Format item list
        const itemList = items.map(i => {
            let text = `• ${i.name || '未知'}`;

            // Add type
            if (i.type) {
                const typeName = typeof i.type === 'string' ? i.type : 'unknown';
                text += ` (${Constants.ITEM_TYPES[typeName] || typeName})`;
            }

            // Add properties
            if (i.properties && typeof i.properties === 'string') {
                text += `: ${i.properties}`;
            } else if (i.properties && i.properties.current) {
                const props = Object.entries(i.properties.current);
                if (props.length > 0) {
                    text += ` - ${props.map(([k, v]) => `${k}:${v}`).join(', ')}`;
                }
            }

            return text;
        }).join('\n');

        result = result.replace('{{items}}', itemList);

        return result;
    }

    // Replace setting-related placeholders
    replaceSettingPlaceholders(template, setting) {
        if (!setting) {
            return template
                .replace('{{setting}}', '暂无设定信息')
                .replace('{{settingName}}', '未知场景')
                .replace('{{settingDescription}}', '');
        }

        let result = template;
        result = result.replace('{{setting}}', setting.name || '未知场景');
        result = result.replace('{{settingName}}', setting.name || '未知场景');
        result = result.replace('{{settingDescription}}', setting.description || '');
        return result;
    }

    // Replace event-related placeholders
    replaceEventPlaceholders(template, events) {
        if (!events || events.length === 0) {
            return template.replace('{{recentEvents}}', '暂无事件记录');
        }

        let result = template;

        // Format event list
        const eventList = events.map(e => {
            let text = `• ${e.description || e.type || '事件'}`;

            // Add chapter reference if available
            if (e.chapter) {
                text += ` [${e.chapter}]`;
            }

            return text;
        }).join('\n');

        result = result.replace('{{recentEvents}}', eventList);

        return result;
    }

    // Add custom template
    addTemplate(name, template) {
        this.templates[name] = template;
    }

    // Get available templates
    getTemplates() {
        return Object.keys(this.templates);
    }

    // Validate template syntax
    validateTemplate(template) {
        const errors = [];

        // Check for unbalanced braces (basic validation)
        const openBraces = (template.match(/\{\{/g) || []).length;
        const closeBraces = (template.match(/\}\}/g) || []).length;

        if (openBraces !== closeBraces) {
            errors.push('模板中的占位符大括号不匹配');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    // Generate prompt with custom variables
    generatePromptWithVariables(template, variables) {
        let prompt = template;

        for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{{${key}}}`;
            prompt = prompt.replace(new RegExp(placeholder, 'g'), value || '');
        }

        return prompt;
    }

    // Create scenario-specific prompt
    createScenarioPrompt(scenario, context) {
        const scenarios = {
            'combat': '战斗场景',
            'dialogue': '对话场景',
            'exploration': '探索场景',
            'romance': '浪漫场景',
            'mystery': '悬疑场景',
            'action': '动作场景'
        };

        const scenarioName = scenarios[scenario] || scenario;

        let prompt = `请根据以下信息编写一个${scenarioName}：\n\n`;
        prompt += this.generatePrompt(context, 'default');

        // Add scenario-specific instructions
        const instructions = {
            'combat': '\n\n请重点描写战斗的紧张感和角色之间的攻防互动。',
            'dialogue': '\n\n请重点描写角色之间的对话、表情和情感交流。',
            'exploration': '\n\n请重点描写环境的细节、氛围和角色的发现过程。',
            'romance': '\n\n请重点描写角色之间的情感互动和浪漫氛围。',
            'mystery': '\n\n请制造悬念，注意细节描写，引导读者思考。',
            'action': '\n\n请保持节奏紧凑，描写动作要生动有力。'
        };

        prompt += instructions[scenario] || '';

        return prompt;
    }

    // Generate prompt with memory optimization
    generateOptimizedPrompt(context, templateName = 'default', maxTokens = 2000) {
        const memoryManager = new MemoryManager(null);
        const compressedContext = memoryManager.compressContext(context, maxTokens);
        return this.generatePrompt(compressedContext, templateName);
    }
}

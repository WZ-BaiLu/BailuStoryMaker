// Data formatting utilities

const Formatters = {
    // Format date to ISO string
    formatDate(date = new Date()) {
        return date.toISOString();
    },

    // Format display date
    formatDisplayDate(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleString('zh-CN');
    },

    // Generate unique ID
    generateId(prefix = '') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
    },

    // Format attributes for display
    formatAttributes(attributes) {
        if (!attributes) return '';
        const entries = Object.entries(attributes);
        if (entries.length === 0) return '无属性';
        return entries.map(([key, value]) => `${key}: ${value}`).join(', ');
    },

    // Format abilities for display
    formatAbilities(abilities) {
        if (!abilities || abilities.length === 0) return '无能力';
        return abilities.map(a => `${a.name} (Lv.${a.level})`).join(', ');
    },

    // Format item properties for display
    formatItemProperties(properties) {
        if (!properties) return '';
        const entries = Object.entries(properties);
        if (entries.length === 0) return '无属性';
        return entries.map(([key, value]) => `${key}: ${value}`).join(', ');
    },

    // Format prompt for AI
    formatPrompt(context, template) {
        let prompt = template;

        // Replace chapter context
        if (context.chapter) {
            prompt = prompt.replace('{{chapterTitle}}', context.chapter.title || '');
            prompt = prompt.replace('{{chapterContent}}', context.chapter.content || '');
        }

        // Replace characters context
        if (context.characters && context.characters.length > 0) {
            const charactersText = context.characters
                .map(c => `• ${c.name}: ${this.formatAttributes(c.attributes?.current)}`)
                .join('\n');
            prompt = prompt.replace('{{characters}}', charactersText);
        } else {
            prompt = prompt.replace('{{characters}}', '暂无角色信息');
        }

        // Replace items context
        if (context.items && context.items.length > 0) {
            const itemsText = context.items
                .map(i => `• ${i.name}: ${this.formatItemProperties(i.properties?.current)}`)
                .join('\n');
            prompt = prompt.replace('{{items}}', itemsText);
        } else {
            prompt = prompt.replace('{{items}}', '暂无道具信息');
        }

        // Replace setting context
        if (context.setting) {
            prompt = prompt.replace('{{setting}}', context.setting.name);
        } else {
            prompt = prompt.replace('{{setting}}', '暂无设定信息');
        }

        // Replace recent events
        if (context.recentEvents && context.recentEvents.length > 0) {
            const eventsText = context.recentEvents
                .map(e => `• ${e.description}`)
                .join('\n');
            prompt = prompt.replace('{{recentEvents}}', eventsText);
        } else {
            prompt = prompt.replace('{{recentEvents}}', '暂无事件记录');
        }

        return prompt;
    }
};

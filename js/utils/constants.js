// Application constants

const Constants = {
    // Item types
    ITEM_TYPES: {
        weapon: '武器',
        armor: '护甲',
        tool: '工具',
        quest: '任务物品',
        other: '其他'
    },

    // Setting types
    SETTING_TYPES: {
        location: '地点',
        region: '区域',
        world: '世界'
    },

    // Prompt templates
    PROMPT_TEMPLATES: {
        default: `请根据以下信息继续编写故事：

章节: {{chapterTitle}}

当前角色状态:
{{characters}}

当前道具状态:
{{items}}

场景设定: {{setting}}

最近事件:
{{recentEvents}}

请基于以上背景信息，自然地延续故事情节。`,

        'character-focus': `请根据以下信息编写角色场景：

章节: {{chapterTitle}}

角色状态:
{{characters}}

相关道具:
{{items}}

场景设定: {{setting}}

最近事件:
{{recentEvents}}

请聚焦于角色之间的互动和情感描写。`,

        'scene-setup': `请根据以下信息设定场景：

章节: {{chapterTitle}}

场景设定: {{setting}}

在场角色:
{{characters}}

相关道具:
{{items}}

背景事件:
{{recentEvents}}

请详细描述场景的氛围和环境细节。`
    },

    // Default story structure
    DEFAULT_STORY: {
        metadata: {
            id: '',
            title: '',
            createdAt: '',
            updatedAt: '',
            author: ''
        },
        settings: {
            theme: 'light',
            autoSave: true,
            autoSaveInterval: 300
        },
        chapters: [],
        characters: [],
        items: [],
        settings: [],
        timeline: []
    },

    // Storage keys
    STORAGE_KEYS: {
        CURRENT_STORY: 'bailustory_current',
        STORY_LIST: 'bailustory_list',
        THEME: 'bailustory_theme',
        CURRENT_VIEW: 'bailustory_current_view'
    },

    // Validation rules
    VALIDATION: {
        MAX_TITLE_LENGTH: 100,
        MAX_DESCRIPTION_LENGTH: 1000,
        MAX_NAME_LENGTH: 50,
        AUTO_SAVE_INTERVAL: 300000 // 5 minutes
    }
};

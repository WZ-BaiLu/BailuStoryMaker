// Data validation utilities

const Validators = {
    // Validate story data structure
    validateStoryData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('无效的故事数据');
        }

        // Check required top-level properties
        if (!data.metadata || typeof data.metadata !== 'object') {
            throw new Error('缺少元数据');
        }

        if (!data.metadata.title || typeof data.metadata.title !== 'string') {
            throw new Error('缺少故事标题');
        }

        // Validate chapters array
        if (!Array.isArray(data.chapters)) {
            data.chapters = [];
        }

        // Validate characters array
        if (!Array.isArray(data.characters)) {
            data.characters = [];
        }

        // Validate items array
        if (!Array.isArray(data.items)) {
            data.items = [];
        }

        // Validate settings array
        if (!Array.isArray(data.settings)) {
            data.settings = [];
        }

        // Validate timeline array
        if (!Array.isArray(data.timeline)) {
            data.timeline = [];
        }

        return true;
    },

    // Validate chapter data
    validateChapter(chapter) {
        if (!chapter.id || typeof chapter.id !== 'string') {
            throw new Error('章节缺少有效的ID');
        }
        if (!chapter.title || typeof chapter.title !== 'string') {
            throw new Error('章节缺少标题');
        }
        if (typeof chapter.order !== 'number') {
            throw new Error('章节缺少序号');
        }
        return true;
    },

    // Validate character data
    validateCharacter(character) {
        if (!character.id || typeof character.id !== 'string') {
            throw new Error('角色缺少有效的ID');
        }
        if (!character.name || typeof character.name !== 'string') {
            throw new Error('角色缺少名称');
        }
        if (!character.attributes || typeof character.attributes !== 'object') {
            character.attributes = { base: {}, current: {} };
        }
        return true;
    },

    // Validate item data
    validateItem(item) {
        if (!item.id || typeof item.id !== 'string') {
            throw new Error('道具缺少有效的ID');
        }
        if (!item.name || typeof item.name !== 'string') {
            throw new Error('道具缺少名称');
        }
        if (!item.properties || typeof item.properties !== 'object') {
            item.properties = { base: {}, current: {} };
        }
        return true;
    },

    // Validate setting data
    validateSetting(setting) {
        if (!setting.id || typeof setting.id !== 'string') {
            throw new Error('设定缺少有效的ID');
        }
        if (!setting.name || typeof setting.name !== 'string') {
            throw new Error('设定缺少名称');
        }
        return true;
    }
};

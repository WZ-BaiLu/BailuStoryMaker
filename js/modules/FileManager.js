// File I/O Module

class FileManager {
    // Save story as JSON file
    static async saveAsJSON(data, filename = 'story.json') {
        try {
            // Try using File System Access API first (modern browsers)
            if ('showSaveFilePicker' in window) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'JSON Files',
                        accept: { 'application/json': ['.json'] }
                    }]
                });

                const writable = await handle.createWritable();
                await writable.write(JSON.stringify(data, null, 2));
                await writable.close();
                return true;
            }

            // Fallback to traditional download (older browsers)
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            // User cancelled the file picker
            if (error.name === 'AbortError') {
                return false;
            }
            console.error('Save failed:', error);
            throw new Error(`保存失败: ${error.message}`);
        }
    }

    // Load story from JSON file
    static loadFromJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    this.validateStoryData(data);
                    resolve(data);
                } catch (error) {
                    reject(new Error(`文件解析失败: ${error.message}`));
                }
            };

            reader.onerror = () => {
                reject(new Error('文件读取失败'));
            };

            reader.readAsText(file);
        });
    }

    // Validate story data structure
    static validateStoryData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('无效的故事数据');
        }

        // Check metadata
        if (!data.metadata || typeof data.metadata !== 'object') {
            throw new Error('缺少元数据');
        }

        if (!data.metadata.title || typeof data.metadata.title !== 'string') {
            throw new Error('缺少故事标题');
        }

        // Initialize missing arrays
        if (!Array.isArray(data.chapters)) {
            data.chapters = [];
        }

        if (!Array.isArray(data.characters)) {
            data.characters = [];
        }

        if (!Array.isArray(data.items)) {
            data.items = [];
        }

        if (!Array.isArray(data.settings)) {
            data.settings = [];
        }

        if (!Array.isArray(data.timeline)) {
            data.timeline = [];
        }

        // Validate each item in arrays
        data.chapters.forEach(chapter => this.validateChapter(chapter));
        data.characters.forEach(char => this.validateCharacter(char));
        data.items.forEach(item => this.validateItem(item));
        data.settings.forEach(setting => this.validateSetting(setting));

        return true;
    }

    // Validate chapter
    static validateChapter(chapter) {
        if (!chapter.id || typeof chapter.id !== 'string') {
            throw new Error('章节缺少有效的ID');
        }
        if (!chapter.title || typeof chapter.title !== 'string') {
            throw new Error('章节缺少标题');
        }
        if (typeof chapter.order !== 'number') {
            chapter.order = 0;
        }
        return true;
    }

    // Validate character
    static validateCharacter(character) {
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
    }

    // Validate item
    static validateItem(item) {
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
    }

    // Validate setting
    static validateSetting(setting) {
        if (!setting.id || typeof setting.id !== 'string') {
            throw new Error('设定缺少有效的ID');
        }
        if (!setting.name || typeof setting.name !== 'string') {
            throw new Error('设定缺少名称');
        }
        return true;
    }

    // Create backup
    static createBackup(data) {
        const backup = {
            ...data,
            metadata: {
                ...data.metadata,
                id: `${data.metadata.id}-backup-${Date.now()}`
            }
        };
        return backup;
    }

    // Save to localStorage
    static saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('LocalStorage save failed:', error);
            return false;
        }
    }

    // Load from localStorage
    static loadFromLocalStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('LocalStorage load failed:', error);
            return null;
        }
    }

    // Clear localStorage
    static clearLocalStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('LocalStorage clear failed:', error);
            return false;
        }
    }
}

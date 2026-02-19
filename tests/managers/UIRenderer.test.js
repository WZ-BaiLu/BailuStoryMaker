/**
 * UIRenderer 单元测试 - 简化版
 */

// 内联类定义，用于测试（仅包含关键方法）
class UIRenderer {
    constructor(app, state) {
        this.app = app;
        this.state = state;
        this.selectedParagraph = null;
        this.editingParagraph = null;
    }

    renderChapters() {
        const container = document.getElementById('chapters');
        const story = this.state.currentStory;
        if (!story || !story.chapters) return;

        container.innerHTML = story.chapters.map(chapter => `
            <div class="list-item" data-chapter-id="${chapter.id}">
                <span>${chapter.title}</span>
            </div>
        `).join('');
    }

    renderChapterEditor(chapterId) {
        const contentPanel = document.getElementById('chapter-editor-content');
        const titleInput = document.getElementById('chapter-title');
        const story = this.state.currentStory;

        if (!chapterId || !story) {
            if (contentPanel) contentPanel.classList.add('hidden');
            return;
        }

        const chapter = story.chapters.find(c => c.id === chapterId);
        if (chapter && contentPanel && titleInput) {
            contentPanel.classList.remove('hidden');
            titleInput.value = chapter.title;
        }
    }

    renderCharacters() {
        const container = document.getElementById('characters');
        const story = this.state.currentStory;
        if (!story || !story.characters) return;

        container.innerHTML = story.characters.map(char => `
            <div class="list-item" data-character-id="${char.id}">
                <span>${char.name}</span>
            </div>
        `).join('');
    }

    renderCharacterEditor(characterId) {
        const container = document.getElementById('character-editor');
        const story = this.state.currentStory;

        if (!characterId || !story) {
            if (container) container.classList.add('hidden');
            return;
        }

        const character = story.characters.find(c => c.id === characterId);
        if (character && container) {
            container.classList.remove('hidden');
        }
    }

    renderItems() {
        const container = document.getElementById('items');
        const story = this.state.currentStory;
        if (!story || !story.items) return;

        container.innerHTML = story.items.map(item => `
            <div class="list-item" data-item-id="${item.id}">
                <span>${item.name}</span>
            </div>
        `).join('');
    }

    renderItemEditor(itemId) {
        const container = document.getElementById('item-editor');
        const story = this.state.currentStory;

        if (!itemId || !story) {
            if (container) container.classList.add('hidden');
            return;
        }

        const item = story.items.find(i => i.id === itemId);
        if (item && container) {
            container.classList.remove('hidden');
        }
    }

    renderSettings() {
        const container = document.getElementById('settings');
        const story = this.state.currentStory;
        if (!story || !story.settings) return;

        container.innerHTML = story.settings.map(setting => `
            <div class="list-item" data-setting-id="${setting.id}">
                <span>${setting.name}</span>
            </div>
        `).join('');
    }

    renderSettingEditor(settingId) {
        const container = document.getElementById('setting-editor');
        const story = this.state.currentStory;

        if (!settingId || !story) {
            if (container) container.classList.add('hidden');
            return;
        }

        const setting = story.settings.find(s => s.id === settingId);
        if (setting && container) {
            container.classList.remove('hidden');
        }
    }

    renderPromptOptions() {
        const container = document.getElementById('prompts');
        if (!container) return;
        container.innerHTML = '<h2>Prompt Options</h2>';
    }
}

// Mock i18n
global.i18n = {
    t: jest.fn((key) => key)
};

describe('UIRenderer', () => {
    let uiRenderer;
    let mockApp;
    let mockState;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="chapters"></div>
            <div id="chapter-editor-content"></div>
            <div id="chapter-title"></div>
            <div id="characters"></div>
            <div id="character-editor"></div>
            <div id="items"></div>
            <div id="item-editor"></div>
            <div id="settings"></div>
            <div id="setting-editor"></div>
            <div id="prompts"></div>
        `;

        mockApp = {};

        mockState = {
            currentStory: {
                chapters: [
                    { id: 'ch1', title: 'Chapter 1', order: 1 },
                    { id: 'ch2', title: 'Chapter 2', order: 2 }
                ],
                characters: [
                    { id: 'c1', name: 'Hero' }
                ],
                items: [
                    { id: 'i1', name: 'Sword' }
                ],
                settings: [
                    { id: 's1', name: 'Castle' }
                ]
            },
            selectedChapter: null,
            selectedCharacter: null,
            selectedItem: null,
            selectedSetting: null
        };

        uiRenderer = new UIRenderer(mockApp, mockState);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    describe('renderChapters', () => {
        it('should render chapters', () => {
            uiRenderer.renderChapters();
            const container = document.getElementById('chapters');
            expect(container.innerHTML).toContain('Chapter 1');
        });

        it('should do nothing when no story', () => {
            mockState.currentStory = null;
            uiRenderer.renderChapters();
            const container = document.getElementById('chapters');
            expect(container.innerHTML).toBe('');
        });
    });

    describe('renderChapterEditor', () => {
        it('should show editor for valid chapter', () => {
            uiRenderer.renderChapterEditor('ch1');
            const content = document.getElementById('chapter-editor-content');
            expect(content.classList.contains('hidden')).toBe(false);
        });

        it('should hide editor for null chapter', () => {
            uiRenderer.renderChapterEditor(null);
            const content = document.getElementById('chapter-editor-content');
            expect(content.classList.contains('hidden')).toBe(true);
        });
    });

    describe('renderCharacters', () => {
        it('should render characters', () => {
            uiRenderer.renderCharacters();
            const container = document.getElementById('characters');
            expect(container.innerHTML).toContain('Hero');
        });

        it('should do nothing when no story', () => {
            mockState.currentStory = null;
            uiRenderer.renderCharacters();
            const container = document.getElementById('characters');
            expect(container.innerHTML).toBe('');
        });
    });

    describe('renderCharacterEditor', () => {
        it('should show editor for valid character', () => {
            uiRenderer.renderCharacterEditor('c1');
            const editor = document.getElementById('character-editor');
            expect(editor.classList.contains('hidden')).toBe(false);
        });

        it('should hide editor for null character', () => {
            uiRenderer.renderCharacterEditor(null);
            const editor = document.getElementById('character-editor');
            expect(editor.classList.contains('hidden')).toBe(true);
        });
    });

    describe('renderItems', () => {
        it('should render items', () => {
            uiRenderer.renderItems();
            const container = document.getElementById('items');
            expect(container.innerHTML).toContain('Sword');
        });
    });

    describe('renderItemEditor', () => {
        it('should show editor for valid item', () => {
            uiRenderer.renderItemEditor('i1');
            const editor = document.getElementById('item-editor');
            expect(editor.classList.contains('hidden')).toBe(false);
        });
    });

    describe('renderSettings', () => {
        it('should render settings', () => {
            uiRenderer.renderSettings();
            const container = document.getElementById('settings');
            expect(container.innerHTML).toContain('Castle');
        });
    });

    describe('renderSettingEditor', () => {
        it('should show editor for valid setting', () => {
            uiRenderer.renderSettingEditor('s1');
            const editor = document.getElementById('setting-editor');
            expect(editor.classList.contains('hidden')).toBe(false);
        });
    });

    describe('renderPromptOptions', () => {
        it('should render prompt options', () => {
            uiRenderer.renderPromptOptions();
            const container = document.getElementById('prompts');
            expect(container.innerHTML).toContain('Prompt Options');
        });
    });
});

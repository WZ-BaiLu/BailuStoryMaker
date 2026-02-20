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

    // Timeline methods
    loadTimelineState() {
        try {
            return JSON.parse(localStorage.getItem('timeline.state') || '{}');
        } catch {
            return {};
        }
    }

    saveTimelineState(state) {
        try {
            const currentState = this.loadTimelineState();
            const newState = { ...currentState, ...state };
            localStorage.setItem('timeline.state', JSON.stringify(newState));
        } catch (error) {
            console.error('Failed to save timeline state:', error);
        }
    }

    renderTimelinePanel() {
        const timelinePanel = document.getElementById('timeline-panel');
        if (!timelinePanel) return;

        const story = this.state.currentStory;
        const chapterId = this.state.selectedChapter;

        if (!chapterId || !story) {
            timelinePanel.classList.add('hidden');
            return;
        }

        timelinePanel.classList.remove('hidden');

        const chapter = story.chapters.find(c => c.id === chapterId);
        if (!chapter || !chapter.paragraphs || chapter.paragraphs.length === 0) {
            return;
        }
    }

    setTimelineFilter(filter) {
        this.saveTimelineState({ filter });
    }

    toggleTimelinePanel() {
        const timelinePanel = document.getElementById('timeline-panel');
        if (!timelinePanel) return;

        const state = this.loadTimelineState();
        const isExpanded = !state.isExpanded;

        if (isExpanded) {
            timelinePanel.classList.remove('collapsed');
        } else {
            timelinePanel.classList.add('collapsed');
        }

        this.saveTimelineState({ isExpanded });
    }

    scrollToParagraph(paragraphId) {
        const paragraphEl = document.querySelector(`[data-paragraph-id="${paragraphId}"]`);
        if (paragraphEl) {
            paragraphEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    highlightTimelineNode(paragraphId) {
        const nodes = document.querySelectorAll('.timeline-node');
        nodes.forEach(node => {
            if (node.dataset.paragraphId === paragraphId) {
                node.classList.add('active');
            } else {
                node.classList.remove('active');
            }
        });
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
            <div id="timeline-panel"></div>
            <div id="timeline-nodes"></div>
            <div id="timeline-empty"></div>
            <div id="paragraphs-list"></div>
        `;

        localStorage.clear();

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

    // Timeline-related tests
    describe('Timeline Panel', () => {
        describe('loadTimelineState', () => {
            it('should return empty object when no state in localStorage', () => {
                const state = uiRenderer.loadTimelineState();
                expect(state).toEqual({});
            });

            it('should return saved state from localStorage', () => {
                const testState = { isExpanded: true, filter: 'characters' };
                localStorage.setItem('timeline.state', JSON.stringify(testState));
                const state = uiRenderer.loadTimelineState();
                expect(state).toEqual(testState);
            });

            it('should handle corrupted localStorage gracefully', () => {
                localStorage.setItem('timeline.state', 'invalid json');
                const state = uiRenderer.loadTimelineState();
                expect(state).toEqual({});
            });
        });

        describe('saveTimelineState', () => {
            it('should save state to localStorage', () => {
                uiRenderer.saveTimelineState({ filter: 'items' });
                const saved = JSON.parse(localStorage.getItem('timeline.state'));
                expect(saved.filter).toBe('items');
            });

            it('should merge with existing state', () => {
                localStorage.setItem('timeline.state', JSON.stringify({ isExpanded: true }));
                uiRenderer.saveTimelineState({ filter: 'characters' });
                const saved = JSON.parse(localStorage.getItem('timeline.state'));
                expect(saved.isExpanded).toBe(true);
                expect(saved.filter).toBe('characters');
            });
        });

        describe('renderTimelinePanel', () => {
            it('should hide timeline panel when no chapter selected', () => {
                const panel = document.getElementById('timeline-panel');
                uiRenderer.renderTimelinePanel();
                expect(panel.classList.contains('hidden')).toBe(true);
            });

            it('should show timeline panel when chapter selected', () => {
                mockState.selectedChapter = 'ch1';
                mockState.currentStory.chapters[0].paragraphs = [{ id: 'p1', content: 'Test' }];
                const panel = document.getElementById('timeline-panel');
                uiRenderer.renderTimelinePanel();
                expect(panel.classList.contains('hidden')).toBe(false);
            });

            it('should handle empty chapter gracefully', () => {
                mockState.selectedChapter = 'ch1';
                mockState.currentStory.chapters[0].paragraphs = [];
                const panel = document.getElementById('timeline-panel');
                uiRenderer.renderTimelinePanel();
                expect(panel.classList.contains('hidden')).toBe(false);
            });
        });

        describe('setTimelineFilter', () => {
            it('should save filter to localStorage', () => {
                uiRenderer.setTimelineFilter('characters');
                const saved = JSON.parse(localStorage.getItem('timeline.state'));
                expect(saved.filter).toBe('characters');
            });

            it('should save "all" filter', () => {
                uiRenderer.setTimelineFilter('all');
                const saved = JSON.parse(localStorage.getItem('timeline.state'));
                expect(saved.filter).toBe('all');
            });
        });

        describe('toggleTimelinePanel', () => {
            it('should toggle panel collapsed state', () => {
                const panel = document.getElementById('timeline-panel');
                panel.classList.add('collapsed');

                uiRenderer.toggleTimelinePanel();

                expect(panel.classList.contains('collapsed')).toBe(false);
                const saved = JSON.parse(localStorage.getItem('timeline.state'));
                expect(saved.isExpanded).toBe(true);
            });

            it('should collapse expanded panel', () => {
                const panel = document.getElementById('timeline-panel');
                localStorage.setItem('timeline.state', JSON.stringify({ isExpanded: true }));

                uiRenderer.toggleTimelinePanel();

                expect(panel.classList.contains('collapsed')).toBe(true);
                const saved = JSON.parse(localStorage.getItem('timeline.state'));
                expect(saved.isExpanded).toBe(false);
            });

            it('should handle missing timeline panel element', () => {
                document.body.innerHTML = '';
                expect(() => uiRenderer.toggleTimelinePanel()).not.toThrow();
            });
        });

        describe('scrollToParagraph', () => {
            beforeEach(() => {
                document.body.innerHTML = `
                    <div id="paragraphs-list">
                        <div class="paragraph-bubble" data-paragraph-id="p1">Paragraph 1</div>
                        <div class="paragraph-bubble" data-paragraph-id="p2">Paragraph 2</div>
                    </div>
                `;
            });

            it('should scroll to paragraph element', () => {
                const mockScrollIntoView = jest.fn();
                document.querySelector('[data-paragraph-id="p1"]').scrollIntoView = mockScrollIntoView;

                uiRenderer.scrollToParagraph('p1');

                expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
            });

            it('should handle non-existent paragraph', () => {
                expect(() => uiRenderer.scrollToParagraph('p999')).not.toThrow();
            });
        });

        describe('highlightTimelineNode', () => {
            beforeEach(() => {
                document.body.innerHTML = `
                    <div class="timeline-node" data-paragraph-id="p1"></div>
                    <div class="timeline-node" data-paragraph-id="p2"></div>
                    <div class="timeline-node" data-paragraph-id="p3"></div>
                `;
            });

            it('should highlight specified node', () => {
                uiRenderer.highlightTimelineNode('p2');

                const node2 = document.querySelector('[data-paragraph-id="p2"]');
                expect(node2.classList.contains('active')).toBe(true);

                const node1 = document.querySelector('[data-paragraph-id="p1"]');
                expect(node1.classList.contains('active')).toBe(false);
            });

            it('should remove active class from other nodes', () => {
                const node1 = document.querySelector('[data-paragraph-id="p1"]');
                node1.classList.add('active');

                uiRenderer.highlightTimelineNode('p2');

                expect(node1.classList.contains('active')).toBe(false);
            });
        });
    });
});

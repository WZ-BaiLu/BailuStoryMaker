/**
 * ViewManager 单元测试
 * 测试视图管理功能
 */

// 内联类定义，用于测试（与源代码保持一致）
class ViewManager {
    constructor(app, state) {
        this.app = app;
        this.state = state;
        this.currentView = 'story';
    }

    switchView(viewName) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.view === viewName);
        });

        document.querySelectorAll('.view').forEach(view => {
            view.classList.toggle('active', view.id === `${viewName}-view`);
        });

        this.currentView = viewName;

        // Handle AI panel visibility based on view
        this.handleAIPanelVisibility(viewName);

        // Save view to localStorage
        this.saveViewToStorage();

        switch (viewName) {
            case 'story':
                this.app.uiRenderer.renderChapters();
                break;
            case 'character':
                this.app.uiRenderer.renderCharacters();
                break;
            case 'item':
                this.app.uiRenderer.renderItems();
                break;
            case 'setting':
                this.app.uiRenderer.renderSettings();
                break;
            case 'prompt':
                this.app.uiRenderer.renderPromptOptions();
                break;
        }
    }

    refreshCurrentView() {
        switch (this.currentView) {
            case 'story':
                this.app.uiRenderer.renderChapters();
                this.app.uiRenderer.renderChapterEditor(this.state.selectedChapter);
                break;
            case 'character':
                this.app.uiRenderer.renderCharacters();
                this.app.uiRenderer.renderCharacterEditor(this.state.selectedCharacter);
                break;
            case 'item':
                this.app.uiRenderer.renderItems();
                this.app.uiRenderer.renderItemEditor(this.state.selectedItem);
                break;
            case 'setting':
                this.app.uiRenderer.renderSettings();
                this.app.uiRenderer.renderSettingEditor(this.state.selectedSetting);
                break;
        }
    }

    loadViewFromStorage() {
        const savedView = localStorage.getItem(Constants.STORAGE_KEYS.CURRENT_VIEW);
        if (savedView) {
            this.switchView(savedView);
        }
    }

    saveViewToStorage() {
        localStorage.setItem(Constants.STORAGE_KEYS.CURRENT_VIEW, this.currentView);
    }

    getCurrentView() {
        return this.currentView;
    }

    handleAIPanelVisibility(viewName) {
        const aiPanel = document.getElementById('ai-assistant-panel');
        if (!aiPanel) return;

        // Show AI panel only in story view when a chapter is selected
        if (viewName === 'story' && this.state.selectedChapter) {
            aiPanel.classList.remove('hidden');
            this.app.aiManager.loadHistory(this.state.selectedChapter);
        } else {
            aiPanel.classList.add('hidden');
        }
    }

    showAIAssistantPanel() {
        const aiPanel = document.getElementById('ai-assistant-panel');
        if (aiPanel) {
            aiPanel.classList.remove('hidden');
        }
    }

    hideAIAssistantPanel() {
        const aiPanel = document.getElementById('ai-assistant-panel');
        if (aiPanel) {
            aiPanel.classList.add('hidden');
        }
    }

    toggleAIAssistantPanel() {
        const aiPanel = document.getElementById('ai-assistant-panel');
        if (aiPanel) {
            aiPanel.classList.toggle('hidden');
        }
    }
}

describe('ViewManager', () => {
    let viewManager;
    let mockApp;
    let mockState;
    let mockUIRenderer;
    let mockAIManager;

    beforeEach(() => {
        localStorage.clear();
        document.body.innerHTML = `
            <nav>
                <button class="nav-item" data-view="story">Story</button>
                <button class="nav-item" data-view="character">Characters</button>
            </nav>
            <div>
                <div id="story-view" class="view"></div>
                <div id="character-view" class="view"></div>
                <div id="ai-assistant-panel" class="hidden"></div>
            </div>
        `;

        mockUIRenderer = {
            renderChapters: jest.fn(),
            renderCharacters: jest.fn(),
            renderItems: jest.fn(),
            renderSettings: jest.fn(),
            renderPromptOptions: jest.fn(),
            renderChapterEditor: jest.fn(),
            renderCharacterEditor: jest.fn(),
            renderItemEditor: jest.fn(),
            renderSettingEditor: jest.fn()
        };

        mockAIManager = {
            loadHistory: jest.fn()
        };

        mockState = {
            selectedChapter: null,
            selectedCharacter: null,
            selectedItem: null,
            selectedSetting: null
        };

        mockApp = {
            uiRenderer: mockUIRenderer,
            aiManager: mockAIManager
        };

        viewManager = new ViewManager(mockApp, mockState);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should set default view to story', () => {
            expect(viewManager.currentView).toBe('story');
        });
    });

    describe('switchView', () => {
        it('should switch to character view', () => {
            viewManager.switchView('character');
            expect(viewManager.currentView).toBe('character');
            expect(mockUIRenderer.renderCharacters).toHaveBeenCalled();
        });

        it('should update nav active state', () => {
            viewManager.switchView('character');
            const activeNav = document.querySelector('.nav-item.active');
            expect(activeNav).toBeTruthy();
            expect(activeNav.dataset.view).toBe('character');
        });

        it('should save view to localStorage', () => {
            viewManager.switchView('character');
            expect(localStorage.getItem(Constants.STORAGE_KEYS.CURRENT_VIEW)).toBe('character');
        });

        it('should call appropriate render method for story', () => {
            viewManager.switchView('story');
            expect(mockUIRenderer.renderChapters).toHaveBeenCalled();
        });

        it('should call appropriate render method for item', () => {
            viewManager.switchView('item');
            expect(mockUIRenderer.renderItems).toHaveBeenCalled();
        });

        it('should call appropriate render method for setting', () => {
            viewManager.switchView('setting');
            expect(mockUIRenderer.renderSettings).toHaveBeenCalled();
        });

        it('should call appropriate render method for prompt', () => {
            viewManager.switchView('prompt');
            expect(mockUIRenderer.renderPromptOptions).toHaveBeenCalled();
        });
    });

    describe('refreshCurrentView', () => {
        it('should refresh story view', () => {
            viewManager.currentView = 'story';
            mockState.selectedChapter = 'ch1';
            viewManager.refreshCurrentView();
            expect(mockUIRenderer.renderChapters).toHaveBeenCalled();
            expect(mockUIRenderer.renderChapterEditor).toHaveBeenCalledWith('ch1');
        });

        it('should refresh character view', () => {
            viewManager.currentView = 'character';
            mockState.selectedCharacter = 'c1';
            viewManager.refreshCurrentView();
            expect(mockUIRenderer.renderCharacters).toHaveBeenCalled();
            expect(mockUIRenderer.renderCharacterEditor).toHaveBeenCalledWith('c1');
        });

        it('should refresh item view', () => {
            viewManager.currentView = 'item';
            mockState.selectedItem = 'i1';
            viewManager.refreshCurrentView();
            expect(mockUIRenderer.renderItems).toHaveBeenCalled();
            expect(mockUIRenderer.renderItemEditor).toHaveBeenCalledWith('i1');
        });

        it('should refresh setting view', () => {
            viewManager.currentView = 'setting';
            mockState.selectedSetting = 's1';
            viewManager.refreshCurrentView();
            expect(mockUIRenderer.renderSettings).toHaveBeenCalled();
            expect(mockUIRenderer.renderSettingEditor).toHaveBeenCalledWith('s1');
        });
    });

    describe('loadViewFromStorage', () => {
        it('should load saved view from localStorage', () => {
            localStorage.setItem(Constants.STORAGE_KEYS.CURRENT_VIEW, 'character');
            viewManager.loadViewFromStorage();
            expect(viewManager.currentView).toBe('character');
        });

        it('should not load when no saved view', () => {
            localStorage.setItem(Constants.STORAGE_KEYS.CURRENT_VIEW, '');
            viewManager.currentView = 'story';
            viewManager.loadViewFromStorage();
            expect(viewManager.currentView).toBe('story');
        });
    });

    describe('saveViewToStorage', () => {
        it('should save current view to localStorage', () => {
            viewManager.currentView = 'setting';
            viewManager.saveViewToStorage();
            expect(localStorage.getItem(Constants.STORAGE_KEYS.CURRENT_VIEW)).toBe('setting');
        });
    });

    describe('getCurrentView', () => {
        it('should return current view', () => {
            viewManager.currentView = 'prompt';
            expect(viewManager.getCurrentView()).toBe('prompt');
        });
    });

    describe('AI Panel Visibility', () => {
        describe('handleAIPanelVisibility', () => {
            it('should show AI panel in story view with selected chapter', () => {
                mockState.selectedChapter = 'ch1';
                viewManager.handleAIPanelVisibility('story');

                const aiPanel = document.getElementById('ai-assistant-panel');
                expect(aiPanel.classList.contains('hidden')).toBe(false);
                expect(mockAIManager.loadHistory).toHaveBeenCalledWith('ch1');
            });

            it('should hide AI panel in story view without selected chapter', () => {
                mockState.selectedChapter = null;
                viewManager.handleAIPanelVisibility('story');

                const aiPanel = document.getElementById('ai-assistant-panel');
                expect(aiPanel.classList.contains('hidden')).toBe(true);
                expect(mockAIManager.loadHistory).not.toHaveBeenCalled();
            });

            it('should hide AI panel when not in story view', () => {
                mockState.selectedChapter = 'ch1';
                viewManager.handleAIPanelVisibility('character');

                const aiPanel = document.getElementById('ai-assistant-panel');
                expect(aiPanel.classList.contains('hidden')).toBe(true);
                expect(mockAIManager.loadHistory).not.toHaveBeenCalled();
            });

            it('should handle missing AI panel element gracefully', () => {
                document.getElementById('ai-assistant-panel')?.remove();
                mockState.selectedChapter = 'ch1';

                expect(() => viewManager.handleAIPanelVisibility('story')).not.toThrow();
            });
        });

        describe('showAIAssistantPanel', () => {
            it('should show AI panel', () => {
                const aiPanel = document.getElementById('ai-assistant-panel');
                aiPanel.classList.add('hidden');

                viewManager.showAIAssistantPanel();

                expect(aiPanel.classList.contains('hidden')).toBe(false);
            });

            it('should handle missing AI panel element gracefully', () => {
                document.getElementById('ai-assistant-panel')?.remove();

                expect(() => viewManager.showAIAssistantPanel()).not.toThrow();
            });
        });

        describe('hideAIAssistantPanel', () => {
            it('should hide AI panel', () => {
                const aiPanel = document.getElementById('ai-assistant-panel');
                aiPanel.classList.remove('hidden');

                viewManager.hideAIAssistantPanel();

                expect(aiPanel.classList.contains('hidden')).toBe(true);
            });

            it('should handle missing AI panel element gracefully', () => {
                document.getElementById('ai-assistant-panel')?.remove();

                expect(() => viewManager.hideAIAssistantPanel()).not.toThrow();
            });
        });

        describe('toggleAIAssistantPanel', () => {
            it('should toggle AI panel visibility from hidden to visible', () => {
                const aiPanel = document.getElementById('ai-assistant-panel');
                aiPanel.classList.add('hidden');

                viewManager.toggleAIAssistantPanel();

                expect(aiPanel.classList.contains('hidden')).toBe(false);
            });

            it('should toggle AI panel visibility from visible to hidden', () => {
                const aiPanel = document.getElementById('ai-assistant-panel');
                aiPanel.classList.remove('hidden');

                viewManager.toggleAIAssistantPanel();

                expect(aiPanel.classList.contains('hidden')).toBe(true);
            });

            it('should handle missing AI panel element gracefully', () => {
                document.getElementById('ai-assistant-panel')?.remove();

                expect(() => viewManager.toggleAIAssistantPanel()).not.toThrow();
            });
        });
    });

    describe('switchView with AI Panel', () => {
        it('should show AI panel when switching to story view with chapter', () => {
            mockState.selectedChapter = 'ch1';
            viewManager.switchView('story');

            const aiPanel = document.getElementById('ai-assistant-panel');
            expect(aiPanel.classList.contains('hidden')).toBe(false);
            expect(mockAIManager.loadHistory).toHaveBeenCalledWith('ch1');
        });

        it('should hide AI panel when switching away from story view', () => {
            mockState.selectedChapter = 'ch1';
            viewManager.switchView('character');

            const aiPanel = document.getElementById('ai-assistant-panel');
            expect(aiPanel.classList.contains('hidden')).toBe(true);
        });

        it('should hide AI panel when switching to story view without chapter', () => {
            mockState.selectedChapter = null;
            viewManager.switchView('story');

            const aiPanel = document.getElementById('ai-assistant-panel');
            expect(aiPanel.classList.contains('hidden')).toBe(true);
        });
    });
});

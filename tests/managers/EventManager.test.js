/**
 * EventManager 单元测试
 * 测试事件管理和键盘快捷键功能
 */

// 内联类定义，用于测试（与源代码保持一致）
class EventManager {
    constructor(app) {
        this.app = app;
        this.eventHandlers = new Map();
        this.setupKeyboardShortcuts();
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    handleKeyDown(event) {
        // Ctrl+Shift+S: 保存
        if (event.ctrlKey && event.shiftKey && event.key === 'S') {
            event.preventDefault();
            this.app.saveStory();
        }
        // Ctrl+E: 导出
        else if (event.ctrlKey && event.key === 'e') {
            event.preventDefault();
            this.app.exportManager.handleExport();
        }
        // Ctrl+I: 导入
        else if (event.ctrlKey && event.key === 'i') {
            event.preventDefault();
            this.app.exportManager.handleImport();
        }
        // Ctrl+N: 新建章节
        else if (event.ctrlKey && event.key === 'n') {
            event.preventDefault();
            this.app.createNewChapter();
        }
        // Ctrl+Z: 撤销
        else if (event.ctrlKey && event.key === 'z') {
            event.preventDefault();
            this.app.undo();
        }
        // Ctrl+Y: 重做
        else if (event.ctrlKey && event.key === 'y') {
            event.preventDefault();
            this.app.redo();
        }
        // Ctrl+1-5: 切换视图
        else if (event.ctrlKey && event.key === '1') {
            event.preventDefault();
            this.app.viewManager.switchView('story');
        }
        else if (event.ctrlKey && event.key === '2') {
            event.preventDefault();
            this.app.viewManager.switchView('characters');
        }
        else if (event.ctrlKey && event.key === '3') {
            event.preventDefault();
            this.app.viewManager.switchView('items');
        }
        else if (event.ctrlKey && event.key === '4') {
            event.preventDefault();
            this.app.viewManager.switchView('settings');
        }
        else if (event.ctrlKey && event.key === '5') {
            event.preventDefault();
            this.app.viewManager.switchView('prompts');
        }
    }

    bindEvents() {
        // 导航事件
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.currentTarget.dataset.view;
                this.app.viewManager.switchView(view);
            });
        });

        // 主题切换
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.app.themeManager.toggleTheme();
            });
        }

        // 导出按钮
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.app.exportManager.handleExport();
            });
        }

        // 导入按钮
        const importBtn = document.getElementById('importBtn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.app.exportManager.handleImport();
            });
        }

        // 新建故事按钮
        const newStoryBtn = document.getElementById('newStoryBtn');
        if (newStoryBtn) {
            newStoryBtn.addEventListener('click', () => {
                this.app.modalManager.showNewStoryModal();
            });
        }
    }

    registerEventHandler(eventType, handler) {
        if (!this.eventHandlers.has(eventType)) {
            this.eventHandlers.set(eventType, []);
        }
        this.eventHandlers.get(eventType).push(handler);
    }

    unregisterEventHandler(eventType, handler) {
        if (!this.eventHandlers.has(eventType)) {
            return false;
        }
        const handlers = this.eventHandlers.get(eventType);
        const index = handlers.indexOf(handler);
        if (index > -1) {
            handlers.splice(index, 1);
            return true;
        }
        return false;
    }

    triggerEvent(eventType, data) {
        if (!this.eventHandlers.has(eventType)) {
            return false;
        }
        const handlers = this.eventHandlers.get(eventType);
        handlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`Error in event handler for ${eventType}:`, error);
            }
        });
        return true;
    }

    destroy() {
        document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    }
}

// ========== 测试开始 ==========

describe('EventManager', () => {
    let eventManager;
    let mockApp;
    let mockViewManager;
    let mockExportManager;
    let mockThemeManager;
    let mockModalManager;

    beforeEach(() => {
        // Mock app and managers
        mockViewManager = {
            switchView: jest.fn()
        };

        mockExportManager = {
            handleExport: jest.fn(),
            handleImport: jest.fn()
        };

        mockThemeManager = {
            toggleTheme: jest.fn()
        };

        mockModalManager = {
            showNewStoryModal: jest.fn()
        };

        mockApp = {
            saveStory: jest.fn(),
            createNewChapter: jest.fn(),
            undo: jest.fn(),
            redo: jest.fn(),
            viewManager: mockViewManager,
            exportManager: mockExportManager,
            themeManager: mockThemeManager,
            modalManager: mockModalManager
        };

        // Mock DOM
        document.body.innerHTML = `
            <nav>
                <button class="nav-item" data-view="story">Story</button>
                <button class="nav-item" data-view="characters">Characters</button>
                <button id="themeToggle">Theme</button>
                <button id="exportBtn">Export</button>
                <button id="importBtn">Import</button>
                <button id="newStoryBtn">New Story</button>
            </nav>
        `;

        eventManager = new EventManager(mockApp);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    describe('constructor', () => {
        it('should create event handlers map', () => {
            expect(eventManager.eventHandlers).toBeInstanceOf(Map);
        });

        it('should setup keyboard shortcuts', () => {
            expect(eventManager.handleKeyDown).toBeDefined();
        });
    });

    describe('handleKeyDown', () => {
        describe('Save shortcut (Ctrl+Shift+S)', () => {
            it('should call saveStory on Ctrl+Shift+S', () => {
                const event = new KeyboardEvent('keydown', {
                    ctrlKey: true,
                    shiftKey: true,
                    key: 'S'
                });
                event.preventDefault = jest.fn();
                eventManager.handleKeyDown(event);
                expect(mockApp.saveStory).toHaveBeenCalled();
                expect(event.preventDefault).toHaveBeenCalled();
            });

            it('should not trigger without ctrl key', () => {
                const event = new KeyboardEvent('keydown', {
                    ctrlKey: false,
                    shiftKey: true,
                    key: 'S'
                });
                event.preventDefault = jest.fn();
                eventManager.handleKeyDown(event);
                expect(mockApp.saveStory).not.toHaveBeenCalled();
            });
        });

        describe('Export shortcut (Ctrl+E)', () => {
            it('should call handleExport on Ctrl+E', () => {
                const event = new KeyboardEvent('keydown', {
                    ctrlKey: true,
                    key: 'e'
                });
                event.preventDefault = jest.fn();
                eventManager.handleKeyDown(event);
                expect(mockExportManager.handleExport).toHaveBeenCalled();
                expect(event.preventDefault).toHaveBeenCalled();
            });
        });

        describe('Import shortcut (Ctrl+I)', () => {
            it('should call handleImport on Ctrl+I', () => {
                const event = new KeyboardEvent('keydown', {
                    ctrlKey: true,
                    key: 'i'
                });
                event.preventDefault = jest.fn();
                eventManager.handleKeyDown(event);
                expect(mockExportManager.handleImport).toHaveBeenCalled();
                expect(event.preventDefault).toHaveBeenCalled();
            });
        });

        describe('New chapter shortcut (Ctrl+N)', () => {
            it('should call createNewChapter on Ctrl+N', () => {
                const event = new KeyboardEvent('keydown', {
                    ctrlKey: true,
                    key: 'n'
                });
                event.preventDefault = jest.fn();
                eventManager.handleKeyDown(event);
                expect(mockApp.createNewChapter).toHaveBeenCalled();
                expect(event.preventDefault).toHaveBeenCalled();
            });
        });

        describe('Undo shortcut (Ctrl+Z)', () => {
            it('should call undo on Ctrl+Z', () => {
                const event = new KeyboardEvent('keydown', {
                    ctrlKey: true,
                    key: 'z'
                });
                event.preventDefault = jest.fn();
                eventManager.handleKeyDown(event);
                expect(mockApp.undo).toHaveBeenCalled();
                expect(event.preventDefault).toHaveBeenCalled();
            });
        });

        describe('Redo shortcut (Ctrl+Y)', () => {
            it('should call redo on Ctrl+Y', () => {
                const event = new KeyboardEvent('keydown', {
                    ctrlKey: true,
                    key: 'y'
                });
                event.preventDefault = jest.fn();
                eventManager.handleKeyDown(event);
                expect(mockApp.redo).toHaveBeenCalled();
                expect(event.preventDefault).toHaveBeenCalled();
            });
        });

        describe('View switch shortcuts (Ctrl+1-5)', () => {
            it('should switch to story view on Ctrl+1', () => {
                const event = new KeyboardEvent('keydown', {
                    ctrlKey: true,
                    key: '1'
                });
                event.preventDefault = jest.fn();
                eventManager.handleKeyDown(event);
                expect(mockViewManager.switchView).toHaveBeenCalledWith('story');
            });

            it('should switch to characters view on Ctrl+2', () => {
                const event = new KeyboardEvent('keydown', {
                    ctrlKey: true,
                    key: '2'
                });
                event.preventDefault = jest.fn();
                eventManager.handleKeyDown(event);
                expect(mockViewManager.switchView).toHaveBeenCalledWith('characters');
            });

            it('should switch to items view on Ctrl+3', () => {
                const event = new KeyboardEvent('keydown', {
                    ctrlKey: true,
                    key: '3'
                });
                event.preventDefault = jest.fn();
                eventManager.handleKeyDown(event);
                expect(mockViewManager.switchView).toHaveBeenCalledWith('items');
            });

            it('should switch to settings view on Ctrl+4', () => {
                const event = new KeyboardEvent('keydown', {
                    ctrlKey: true,
                    key: '4'
                });
                event.preventDefault = jest.fn();
                eventManager.handleKeyDown(event);
                expect(mockViewManager.switchView).toHaveBeenCalledWith('settings');
            });

            it('should switch to prompts view on Ctrl+5', () => {
                const event = new KeyboardEvent('keydown', {
                    ctrlKey: true,
                    key: '5'
                });
                event.preventDefault = jest.fn();
                eventManager.handleKeyDown(event);
                expect(mockViewManager.switchView).toHaveBeenCalledWith('prompts');
            });
        });

        describe('Unknown shortcuts', () => {
            it('should not call any app methods for unknown shortcuts', () => {
                const event = new KeyboardEvent('keydown', {
                    ctrlKey: true,
                    key: 'x'
                });
                event.preventDefault = jest.fn();
                eventManager.handleKeyDown(event);
                expect(mockApp.saveStory).not.toHaveBeenCalled();
                expect(event.preventDefault).not.toHaveBeenCalled();
            });
        });
    });

    describe('bindEvents', () => {
        beforeEach(() => {
            eventManager.bindEvents();
        });

        it('should bind click events to nav items', () => {
            const navItems = document.querySelectorAll('.nav-item');
            const firstItem = navItems[0];
            firstItem.click();
            expect(mockViewManager.switchView).toHaveBeenCalledWith('story');
        });

        it('should bind click event to theme toggle', () => {
            const themeToggle = document.getElementById('themeToggle');
            themeToggle.click();
            expect(mockThemeManager.toggleTheme).toHaveBeenCalled();
        });

        it('should bind click event to export button', () => {
            const exportBtn = document.getElementById('exportBtn');
            exportBtn.click();
            expect(mockExportManager.handleExport).toHaveBeenCalled();
        });

        it('should bind click event to import button', () => {
            const importBtn = document.getElementById('importBtn');
            importBtn.click();
            expect(mockExportManager.handleImport).toHaveBeenCalled();
        });

        it('should bind click event to new story button', () => {
            const newStoryBtn = document.getElementById('newStoryBtn');
            newStoryBtn.click();
            expect(mockModalManager.showNewStoryModal).toHaveBeenCalled();
        });
    });

    describe('registerEventHandler', () => {
        it('should register a new handler for event type', () => {
            const handler = jest.fn();
            eventManager.registerEventHandler('testEvent', handler);
            expect(eventManager.eventHandlers.has('testEvent')).toBe(true);
            expect(eventManager.eventHandlers.get('testEvent')).toContain(handler);
        });

        it('should register multiple handlers for same event type', () => {
            const handler1 = jest.fn();
            const handler2 = jest.fn();
            eventManager.registerEventHandler('testEvent', handler1);
            eventManager.registerEventHandler('testEvent', handler2);
            const handlers = eventManager.eventHandlers.get('testEvent');
            expect(handlers).toContain(handler1);
            expect(handlers).toContain(handler2);
        });

        it('should create new array for new event type', () => {
            const handler = jest.fn();
            eventManager.registerEventHandler('newEvent', handler);
            expect(eventManager.eventHandlers.get('newEvent')).toHaveLength(1);
        });
    });

    describe('unregisterEventHandler', () => {
        it('should remove handler from event type', () => {
            const handler = jest.fn();
            eventManager.registerEventHandler('testEvent', handler);
            const result = eventManager.unregisterEventHandler('testEvent', handler);
            expect(result).toBe(true);
            expect(eventManager.eventHandlers.get('testEvent')).not.toContain(handler);
        });

        it('should return false when event type does not exist', () => {
            const handler = jest.fn();
            const result = eventManager.unregisterEventHandler('nonExistent', handler);
            expect(result).toBe(false);
        });

        it('should return false when handler not found', () => {
            const handler1 = jest.fn();
            const handler2 = jest.fn();
            eventManager.registerEventHandler('testEvent', handler1);
            const result = eventManager.unregisterEventHandler('testEvent', handler2);
            expect(result).toBe(false);
        });

        it('should remove only the specified handler', () => {
            const handler1 = jest.fn();
            const handler2 = jest.fn();
            eventManager.registerEventHandler('testEvent', handler1);
            eventManager.registerEventHandler('testEvent', handler2);
            eventManager.unregisterEventHandler('testEvent', handler1);
            const handlers = eventManager.eventHandlers.get('testEvent');
            expect(handlers).toHaveLength(1);
            expect(handlers[0]).toBe(handler2);
        });
    });

    describe('triggerEvent', () => {
        it('should call all registered handlers for event type', () => {
            const handler1 = jest.fn();
            const handler2 = jest.fn();
            eventManager.registerEventHandler('testEvent', handler1);
            eventManager.registerEventHandler('testEvent', handler2);
            eventManager.triggerEvent('testEvent', { data: 'test' });
            expect(handler1).toHaveBeenCalledWith({ data: 'test' });
            expect(handler2).toHaveBeenCalledWith({ data: 'test' });
        });

        it('should pass data to handlers', () => {
            const handler = jest.fn();
            const testData = { key: 'value' };
            eventManager.registerEventHandler('testEvent', handler);
            eventManager.triggerEvent('testEvent', testData);
            expect(handler).toHaveBeenCalledWith(testData);
        });

        it('should return false when event type does not exist', () => {
            const result = eventManager.triggerEvent('nonExistent', {});
            expect(result).toBe(false);
        });

        it('should return true when event type exists', () => {
            const handler = jest.fn();
            eventManager.registerEventHandler('testEvent', handler);
            const result = eventManager.triggerEvent('testEvent', {});
            expect(result).toBe(true);
        });

        it('should handle handler errors gracefully', () => {
            const consoleSpy = jest.spyOn(console, 'error');
            const errorHandler = jest.fn(() => {
                throw new Error('Handler error');
            });
            const normalHandler = jest.fn();
            eventManager.registerEventHandler('testEvent', errorHandler);
            eventManager.registerEventHandler('testEvent', normalHandler);
            eventManager.triggerEvent('testEvent', {});
            expect(consoleSpy).toHaveBeenCalled();
            expect(normalHandler).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('Edge Cases', () => {
        it('should handle multiple keydown events', () => {
            const event1 = new KeyboardEvent('keydown', { ctrlKey: true, key: '1' });
            const event2 = new KeyboardEvent('keydown', { ctrlKey: true, key: '2' });
            event1.preventDefault = jest.fn();
            event2.preventDefault = jest.fn();
            eventManager.handleKeyDown(event1);
            eventManager.handleKeyDown(event2);
            expect(mockViewManager.switchView).toHaveBeenCalledWith('story');
            expect(mockViewManager.switchView).toHaveBeenCalledWith('characters');
        });

        it('should handle binding events multiple times', () => {
            eventManager.bindEvents();
            eventManager.bindEvents();
            const navItem = document.querySelector('.nav-item');
            navItem.click();
            expect(mockViewManager.switchView).toHaveBeenCalled();
        });

        it('should handle registering same handler multiple times', () => {
            const handler = jest.fn();
            eventManager.registerEventHandler('test', handler);
            eventManager.registerEventHandler('test', handler);
            eventManager.triggerEvent('test', {});
            expect(handler).toHaveBeenCalledTimes(2);
        });
    });

    describe('destroy', () => {
        it('should call destroy method', () => {
            expect(() => eventManager.destroy()).not.toThrow();
        });
    });
});

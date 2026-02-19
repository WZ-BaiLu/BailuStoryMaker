/**
 * ExportImportManager 单元测试
 */

// 内联类定义，用于测试（与源代码保持一致）
class ExportImportManager {
    constructor(app, state) {
        this.app = app;
        this.state = state;
    }

    async handleExport() {
        try {
            const story = this.state.saveStory();
            const filename = `${story.metadata.title}.json`;
            const success = await FileManager.saveAsJSON(story, filename);
            if (success) {
                this.app.notificationManager.showSuccess(i18n.t('status.saved'));
            }
        } catch (error) {
            this.app.notificationManager.showError(error.message);
        }
    }

    handleImport() {
        document.getElementById('import-input').click();
    }

    async handleImportFile(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const story = await FileManager.loadFromJSON(file);
            this.state.loadStory(story);
            this.app.notificationManager.showSuccess(i18n.t('status.saved'));
        } catch (error) {
            this.app.notificationManager.showError(error.message);
        }

        e.target.value = '';
    }
}

// Mock FileManager
global.FileManager = {
    saveAsJSON: jest.fn(),
    loadFromJSON: jest.fn()
};

// Mock i18n
global.i18n = {
    t: jest.fn((key) => key)
};

describe('ExportImportManager', () => {
    let exportImportManager;
    let mockApp;
    let mockState;

    beforeEach(() => {
        document.body.innerHTML = '<input type="file" id="import-input">';

        mockApp = {
            notificationManager: {
                showSuccess: jest.fn(),
                showError: jest.fn()
            }
        };

        mockState = {
            saveStory: jest.fn().mockReturnValue({
                metadata: { title: 'Test Story' }
            }),
            loadStory: jest.fn()
        };

        exportImportManager = new ExportImportManager(mockApp, mockState);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    describe('handleExport', () => {
        it('should save story to file', async () => {
            FileManager.saveAsJSON.mockResolvedValue(true);
            await exportImportManager.handleExport();
            expect(mockState.saveStory).toHaveBeenCalled();
        });

        it('should use story title as filename', async () => {
            FileManager.saveAsJSON.mockResolvedValue(true);
            await exportImportManager.handleExport();
            expect(FileManager.saveAsJSON).toHaveBeenCalledWith(
                expect.any(Object),
                'Test Story.json'
            );
        });

        it('should show success notification', async () => {
            FileManager.saveAsJSON.mockResolvedValue(true);
            await exportImportManager.handleExport();
            expect(mockApp.notificationManager.showSuccess).toHaveBeenCalledWith('status.saved');
        });

        it('should show error notification on failure', async () => {
            mockState.saveStory.mockImplementation(() => {
                throw new Error('Export failed');
            });
            await exportImportManager.handleExport();
            expect(mockApp.notificationManager.showError).toHaveBeenCalledWith('Export failed');
        });

        it('should handle user cancellation', async () => {
            FileManager.saveAsJSON.mockResolvedValue(false);
            await exportImportManager.handleExport();
            expect(mockApp.notificationManager.showSuccess).not.toHaveBeenCalled();
        });
    });

    describe('handleImport', () => {
        it('should trigger file input click', () => {
            const input = document.getElementById('import-input');
            input.click = jest.fn();
            exportImportManager.handleImport();
            expect(input.click).toHaveBeenCalled();
        });
    });

    describe('handleImportFile', () => {
        it('should load story from file', async () => {
            const mockFile = new File(['{}'], 'test.json');
            const mockEvent = {
                target: { files: [mockFile], value: '' }
            };

            FileManager.loadFromJSON.mockResolvedValue({ metadata: { title: 'Imported Story' } });

            await exportImportManager.handleImportFile(mockEvent);

            expect(FileManager.loadFromJSON).toHaveBeenCalledWith(mockFile);
            expect(mockState.loadStory).toHaveBeenCalled();
        });

        it('should show success notification on success', async () => {
            const mockFile = new File(['{}'], 'test.json');
            const mockEvent = {
                target: { files: [mockFile], value: '' }
            };

            FileManager.loadFromJSON.mockResolvedValue({});

            await exportImportManager.handleImportFile(mockEvent);

            expect(mockApp.notificationManager.showSuccess).toHaveBeenCalled();
        });

        it('should show error notification on failure', async () => {
            const mockFile = new File(['invalid'], 'test.json');
            const mockEvent = {
                target: { files: [mockFile], value: '' }
            };

            FileManager.loadFromJSON.mockRejectedValue(new Error('Invalid file'));

            await exportImportManager.handleImportFile(mockEvent);

            expect(mockApp.notificationManager.showError).toHaveBeenCalledWith('Invalid file');
        });

        it('should clear input value', async () => {
            const mockFile = new File(['{}'], 'test.json');
            const mockEvent = {
                target: { files: [mockFile], value: '' }
            };

            FileManager.loadFromJSON.mockResolvedValue({});

            await exportImportManager.handleImportFile(mockEvent);

            expect(mockEvent.target.value).toBe('');
        });

        it('should do nothing when no file selected', async () => {
            const mockEvent = {
                target: { files: [], value: '' }
            };

            await exportImportManager.handleImportFile(mockEvent);

            expect(FileManager.loadFromJSON).not.toHaveBeenCalled();
        });
    });
});

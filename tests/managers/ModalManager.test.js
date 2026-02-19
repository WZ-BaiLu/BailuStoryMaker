/**
 * ModalManager 单元测试
 */

// 内联类定义，用于测试（与源代码保持一致）
class ModalManager {
    constructor(app, state) {
        this.app = app;
        this.state = state;
    }

    showNewStoryModal() {
        document.getElementById('modal-title').textContent = i18n.t('modal.newStory');
        document.getElementById('modal-input').placeholder = i18n.t('placeholder.inputName');
        document.getElementById('modal-input').value = '';
        document.getElementById('modal').classList.remove('hidden');
    }

    hideModal() {
        document.getElementById('modal').classList.add('hidden');
    }

    handleModalSubmit(e) {
        e.preventDefault();
        const title = document.getElementById('modal-input').value.trim();
        if (!title) return;

        const newStory = this.state.createStory(title);
        this.state.loadStory(newStory);
        this.hideModal();
        this.app.notificationManager.showSuccess(i18n.t('status.saved'));
    }
}

// Mock i18n
global.i18n = {
    t: jest.fn((key) => key)
};

describe('ModalManager', () => {
    let modalManager;
    let mockApp;
    let mockState;

    beforeEach(() => {
        document.body.innerHTML = `
            <div id="modal" class="hidden">
                <h2 id="modal-title"></h2>
                <input id="modal-input" />
            </div>
        `;

        mockApp = {
            notificationManager: {
                showSuccess: jest.fn()
            }
        };

        mockState = {
            createStory: jest.fn().mockReturnValue({ id: 's1' }),
            loadStory: jest.fn()
        };

        modalManager = new ModalManager(mockApp, mockState);
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    describe('showNewStoryModal', () => {
        it('should set modal title', () => {
            modalManager.showNewStoryModal();
            const title = document.getElementById('modal-title');
            expect(i18n.t).toHaveBeenCalledWith('modal.newStory');
        });

        it('should set input placeholder', () => {
            modalManager.showNewStoryModal();
            expect(i18n.t).toHaveBeenCalledWith('placeholder.inputName');
        });

        it('should clear input value', () => {
            const input = document.getElementById('modal-input');
            input.value = 'test';
            modalManager.showNewStoryModal();
            expect(input.value).toBe('');
        });

        it('should show modal', () => {
            modalManager.showNewStoryModal();
            const modal = document.getElementById('modal');
            expect(modal.classList.contains('hidden')).toBe(false);
        });
    });

    describe('hideModal', () => {
        it('should hide modal', () => {
            const modal = document.getElementById('modal');
            modal.classList.remove('hidden');
            modalManager.hideModal();
            expect(modal.classList.contains('hidden')).toBe(true);
        });
    });

    describe('handleModalSubmit', () => {
        it('should create story with title', () => {
            const input = document.getElementById('modal-input');
            input.value = '  Test Story  ';

            const event = new Event('submit', { bubbles: true });
            event.preventDefault = jest.fn();

            modalManager.handleModalSubmit(event);

            expect(mockState.createStory).toHaveBeenCalledWith('Test Story');
        });

        it('should load created story', () => {
            const input = document.getElementById('modal-input');
            input.value = 'Test Story';

            const event = new Event('submit', { bubbles: true });
            event.preventDefault = jest.fn();

            mockState.createStory.mockReturnValue({ id: 's1', title: 'Test Story' });
            modalManager.handleModalSubmit(event);

            expect(mockState.loadStory).toHaveBeenCalledWith({ id: 's1', title: 'Test Story' });
        });

        it('should hide modal after submit', () => {
            const input = document.getElementById('modal-input');
            input.value = 'Test Story';

            const event = new Event('submit', { bubbles: true });
            event.preventDefault = jest.fn();

            modalManager.handleModalSubmit(event);

            const modal = document.getElementById('modal');
            expect(modal.classList.contains('hidden')).toBe(true);
        });

        it('should show success notification', () => {
            const input = document.getElementById('modal-input');
            input.value = 'Test Story';

            const event = new Event('submit', { bubbles: true });
            event.preventDefault = jest.fn();

            modalManager.handleModalSubmit(event);

            expect(mockApp.notificationManager.showSuccess).toHaveBeenCalledWith('status.saved');
        });

        it('should prevent default form submission', () => {
            const input = document.getElementById('modal-input');
            input.value = 'Test Story';

            const event = new Event('submit', { bubbles: true });
            event.preventDefault = jest.fn();

            modalManager.handleModalSubmit(event);

            expect(event.preventDefault).toHaveBeenCalled();
        });

        it('should not submit when title is empty', () => {
            const input = document.getElementById('modal-input');
            input.value = '   ';

            const event = new Event('submit', { bubbles: true });
            event.preventDefault = jest.fn();

            modalManager.handleModalSubmit(event);

            expect(mockState.createStory).not.toHaveBeenCalled();
            expect(mockState.loadStory).not.toHaveBeenCalled();
        });

        it('should not submit when title is only whitespace', () => {
            const input = document.getElementById('modal-input');
            input.value = '';

            const event = new Event('submit', { bubbles: true });
            event.preventDefault = jest.fn();

            modalManager.handleModalSubmit(event);

            expect(mockState.createStory).not.toHaveBeenCalled();
            expect(mockState.loadStory).not.toHaveBeenCalled();
        });
    });
});

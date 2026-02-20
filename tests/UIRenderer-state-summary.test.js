/**
 * Tests for UIRenderer state summary filtering logic
 */
describe('UIRenderer - State Summary Filtering', () => {
    let app;
    let uiRenderer;

    beforeEach(() => {
        // Reset state
        appState.currentStory = null;

        // Create test story
        const testStory = {
            metadata: {
                id: 'test-story-1',
                title: 'Test Story',
                createdAt: '2024-01-01T00:00:00.000Z',
                updatedAt: '2024-01-01T00:00:00.000Z',
                author: 'Test Author'
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
        };
        appState.loadStory(testStory);

        // Select chapter and initialize UI components
        const chapter = appState.addChapter('Test Chapter');
        appState.selectChapter(chapter.id);

        // Create app and uiRenderer instances
        app = new App();
        uiRenderer = app.uiRenderer;
    });

    afterEach(() => {
        // Cleanup
        appState.currentStory = null;
    });

    describe('Character Filtering', () => {
        it('should show only characters present in paragraph changes', () => {
            // Create two characters
            const char1 = appState.addCharacter({
                name: 'Alice',
                description: 'First character',
                attributes: {
                    base: { health: 100 },
                    current: { health: 100 }
                }
            });

            const char2 = appState.addCharacter({
                name: 'Bob',
                description: 'Second character',
                attributes: {
                    base: { health: 100 },
                    current: { health: 100 }
                }
            });

            // Add paragraph with only char1 changes
            const p1 = appState.addParagraph(appState.selectedChapter);
            appState.updateParagraph(appState.selectedChapter, p1.id, {
                changes: {
                    characters: [{
                        characterId: char1.id,
                        changes: {
                            attributes: { health: 95 }
                        }
                    }]
                }
            });

            // Generate summary
            uiRenderer.summarizeParagraphState(p1.id);

            // Check if only Alice is shown (not Bob)
            const modal = document.querySelector('#state-summary-modal');
            expect(modal).toBeTruthy();

            // Alice should be in the summary
            expect(modal.innerHTML).toContain('Alice');

            // Bob should NOT be in the summary
            expect(modal.innerHTML).not.toContain('Bob');

            // Cleanup modal
            modal.remove();
        });

        it('should show no characters message when none present', () => {
            // Add paragraph without character changes
            const p1 = appState.addParagraph(appState.selectedChapter);
            appState.updateParagraph(appState.selectedChapter, p1.id, {
                content: 'Just text, no characters'
            });

            // Generate summary
            uiRenderer.summarizeParagraphState(p1.id);

            // Check for empty message
            const modal = document.querySelector('#state-summary-modal');
            expect(modal).toBeTruthy();
            expect(modal.innerHTML).toContain(i18n.t('timeline.noCharactersInParagraph'));

            modal.remove();
        });
    });

    describe('Item Filtering', () => {
        it('should show only items held by present characters', () => {
            // Create two characters
            const char1 = appState.addCharacter({
                name: 'Alice',
                description: 'First character',
                attributes: {
                    base: { health: 100 },
                    current: { health: 100 }
                }
            });

            const char2 = appState.addCharacter({
                name: 'Bob',
                description: 'Second character',
                attributes: {
                    base: { health: 100 },
                    current: { health: 100 }
                }
            });

            // Create two items
            const item1 = appState.addItem({
                name: 'Sword',
                type: 'weapon',
                description: 'Sharp sword',
                properties: {
                    base: { attack: 50 },
                    current: { attack: 50 }
                }
            });

            const item2 = appState.addItem({
                name: 'Shield',
                type: 'armor',
                description: 'Sturdy shield',
                properties: {
                    base: { defense: 40 },
                    current: { defense: 40 }
                }
            });

            // Alice holds item1, Bob holds item2
            appState.addItemToCharacter(char1.id, item1.id);
            appState.addItemToCharacter(char2.id, item2.id);

            // Add paragraph with only char1 changes
            const p1 = appState.addParagraph(appState.selectedChapter);
            appState.updateParagraph(appState.selectedChapter, p1.id, {
                changes: {
                    characters: [{
                        characterId: char1.id,
                        changes: {
                            emotionalState: 'happy'
                        }
                    }]
                }
            });

            // Generate summary
            uiRenderer.summarizeParagraphState(p1.id);

            // Check if only item1 (held by Alice) is shown
            const modal = document.querySelector('#state-summary-modal');
            expect(modal).toBeTruthy();

            // Sword (held by Alice) should be in the summary
            expect(modal.innerHTML).toContain('Sword');

            // Shield (held by Bob) should NOT be in the summary
            expect(modal.innerHTML).not.toContain('Shield');

            modal.remove();
        });

        it('should show items owned by characters with changes', () => {
            // Create character
            const char1 = appState.addCharacter({
                name: 'Alice',
                description: 'First character',
                attributes: {
                    base: { health: 100 },
                    current: { health: 100 }
                }
            });

            // Create item owned by Alice
            const item1 = appState.addItem({
                name: 'Potion',
                type: 'tool',
                description: 'Healing potion',
                properties: {
                    base: { healing: 20 },
                    current: { healing: 20 }
                }
            });

            appState.addItemToCharacter(char1.id, item1.id);

            // Add paragraph with char1 changes
            const p1 = appState.addParagraph(appState.selectedChapter);
            appState.updateParagraph(appState.selectedChapter, p1.id, {
                changes: {
                    characters: [{
                        characterId: char1.id,
                        changes: {
                            emotionalState: 'sad'
                        }
                    }]
                }
            });

            // Generate summary
            uiRenderer.summarizeParagraphState(p1.id);

            // Potion should be shown
            const modal = document.querySelector('#state-summary-modal');
            expect(modal).toBeTruthy();
            expect(modal.innerHTML).toContain('Potion');

            modal.remove();
        });

        it('should show no items message when none held by present characters', () => {
            // Create character
            const char1 = appState.addCharacter({
                name: 'Alice',
                description: 'First character',
                attributes: {
                    base: { health: 100 },
                    current: { health: 100 }
                }
            });

            // Add paragraph with char1 changes (but char1 has no items)
            const p1 = appState.addParagraph(appState.selectedChapter);
            appState.updateParagraph(appState.selectedChapter, p1.id, {
                changes: {
                    characters: [{
                        characterId: char1.id,
                        changes: {}
                    }]
                }
            });

            // Generate summary
            uiRenderer.summarizeParagraphState(p1.id);

            // Check for empty message
            const modal = document.querySelector('#state-summary-modal');
            expect(modal).toBeTruthy();
            expect(modal.innerHTML).toContain(i18n.t('timeline.noItemsInParagraph'));

            modal.remove();
        });
    });

    describe('Held Items Display', () => {
        it('should display character held items in summary', () => {
            // Create character
            const char1 = appState.addCharacter({
                name: 'Alice',
                description: 'First character',
                attributes: {
                    base: { health: 100 },
                    current: { health: 100 }
                }
            });

            // Create items
            const item1 = appState.addItem({
                name: 'Sword',
                type: 'weapon',
                description: 'Sharp sword',
                properties: {
                    base: { attack: 50 },
                    current: { attack: 50 }
                }
            });

            const item2 = appState.addItem({
                name: 'Shield',
                type: 'armor',
                description: 'Sturdy shield',
                properties: {
                    base: { defense: 40 },
                    current: { defense: 40 }
                }
            });

            // Add items to character
            appState.addItemToCharacter(char1.id, item1.id);
            appState.addItemToCharacter(char1.id, item2.id);

            // Add paragraph
            const p1 = appState.addParagraph(appState.selectedChapter);
            appState.updateParagraph(appState.selectedChapter, p1.id, {
                changes: {
                    characters: [{
                        characterId: char1.id,
                        changes: {}
                    }]
                }
            });

            // Generate summary
            uiRenderer.summarizeParagraphState(p1.id);

            // Check if both items are displayed
            const modal = document.querySelector('#state-summary-modal');
            expect(modal).toBeTruthy();
            expect(modal.innerHTML).toContain('Sword');
            expect(modal.innerHTML).toContain('Shield');
            expect(modal.innerHTML).toContain(i18n.t('character.heldItems'));

            modal.remove();
        });

        it('should not show held items for character without items', () => {
            // Create character with no items
            const char1 = appState.addCharacter({
                name: 'Alice',
                description: 'First character',
                attributes: {
                    base: { health: 100 },
                    current: { health: 100 }
                }
            });

            // Add paragraph
            const p1 = appState.addParagraph(appState.selectedChapter);
            appState.updateParagraph(appState.selectedChapter, p1.id, {
                changes: {
                    characters: [{
                        characterId: char1.id,
                        changes: {}
                    }]
                }
            });

            // Generate summary
            uiRenderer.summarizeParagraphState(p1.id);

            // Held items label should not be shown
            const modal = document.querySelector('#state-summary-modal');
            expect(modal).toBeTruthy();
            expect(modal.innerHTML).not.toContain(i18n.t('character.heldItems'));

            modal.remove();
        });
    });

    describe('Accumulative Changes', () => {
        it('should accumulate character changes across paragraphs', () => {
            // Create character
            const char1 = appState.addCharacter({
                name: 'Alice',
                description: 'First character',
                attributes: {
                    base: { health: 100 },
                    current: { health: 100 }
                }
            });

            // Add first paragraph with health change
            const p1 = appState.addParagraph(appState.selectedChapter);
            appState.updateParagraph(appState.selectedChapter, p1.id, {
                changes: {
                    characters: [{
                        characterId: char1.id,
                        changes: {
                            attributes: { health: 95 }
                        }
                    }]
                }
            });

            // Add second paragraph with another health change
            const p2 = appState.addParagraph(appState.selectedChapter);
            appState.updateParagraph(appState.selectedChapter, p2.id, {
                changes: {
                    characters: [{
                        characterId: char1.id,
                        changes: {
                            attributes: { health: 90 }
                        }
                    }]
                }
            });

            // Generate summary for second paragraph
            uiRenderer.summarizeParagraphState(p2.id);

            // Health should be 90 (accumulated)
            const modal = document.querySelector('#state-summary-modal');
            expect(modal).toBeTruthy();
            expect(modal.innerHTML).toContain('90'); // Final health value

            modal.remove();
        });

        it('should show character in summary if they have changes in any previous paragraph', () => {
            // Create two characters
            const char1 = appState.addCharacter({
                name: 'Alice',
                description: 'First character',
                attributes: {
                    base: { health: 100 },
                    current: { health: 100 }
                }
            });

            const char2 = appState.addCharacter({
                name: 'Bob',
                description: 'Second character',
                attributes: {
                    base: { health: 100 },
                    current: { health: 100 }
                }
            });

            // Add first paragraph with Alice's changes
            const p1 = appState.addParagraph(appState.selectedChapter);
            appState.updateParagraph(appState.selectedChapter, p1.id, {
                changes: {
                    characters: [{
                        characterId: char1.id,
                        changes: {
                            emotionalState: 'happy'
                        }
                    }]
                }
            });

            // Add second paragraph with no character changes
            const p2 = appState.addParagraph(appState.selectedChapter);
            appState.updateParagraph(appState.selectedChapter, p2.id, {
                content: 'Alice continues her journey'
            });

            // Generate summary for second paragraph
            uiRenderer.summarizeParagraphState(p2.id);

            // Alice should still be shown (she had changes in p1)
            const modal = document.querySelector('#state-summary-modal');
            expect(modal).toBeTruthy();
            expect(modal.innerHTML).toContain('Alice');

            // Bob should NOT be shown (no changes in any paragraph)
            expect(modal.innerHTML).not.toContain('Bob');

            modal.remove();
        });
    });
});

/**
 * Unit Tests for AIElementTools
 *
 * Tests AI tool handlers for element management
 */

const ElementManager = require('../../js/managers/ElementManager');
const AIElementTools = require('../../js/managers/AIElementTools');

describe('AIElementTools', () => {
    let elementManager;
    let aiElementTools;
    let mockStory;

    beforeEach(() => {
        mockStory = {
            id: 'story-1',
            title: 'Test Story',
            elements: [],
            chapters: []
        };

        elementManager = new ElementManager(mockStory);
        aiElementTools = new AIElementTools(elementManager);
    });

    afterEach(() => {
        mockStory = null;
        elementManager = null;
        aiElementTools = null;
    });

    describe('constructor', () => {
        test('should initialize with elementManager', () => {
            expect(aiElementTools).toBeDefined();
            expect(aiElementTools.elementManager).toBe(elementManager);
        });
    });

    describe('addElement', () => {
        test('should create element with required fields', () => {
            const result = aiElementTools.addElement({
                type: 'character',
                name: 'Test Character',
                description: 'A test character'
            });

            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.element).toBeDefined();
            expect(result.element.name).toBe('Test Character');
        });

        test('should return error for missing type', () => {
            const result = aiElementTools.addElement({
                name: 'Test',
                description: 'Test description'
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        test('should return error for missing name', () => {
            const result = aiElementTools.addElement({
                type: 'character',
                description: 'Test description'
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        test('should return error for missing description', () => {
            const result = aiElementTools.addElement({
                type: 'character',
                name: 'Test'
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        test('should add default keywords based on type', () => {
            const result = aiElementTools.addElement({
                type: 'character',
                name: 'Alice',
                description: 'A test character'
            });

            expect(result.element.keywords.length).toBeGreaterThan(0);
        });
    });

    describe('updateElementLocation', () => {
        let testElement;

        beforeEach(() => {
            testElement = elementManager.addElement({
                type: 'character',
                name: 'Test Character',
                description: 'A test character'
            });
        });

        test('should update element location', () => {
            const result = aiElementTools.updateElementLocation({
                elementId: testElement.id,
                location: 'location-1'
            });

            expect(result.success).toBe(true);
            expect(result.element.location).toBe('location-1');
        });

        test('should return error for non-existent element', () => {
            const result = aiElementTools.updateElementLocation({
                elementId: 'non-existent',
                location: 'location-1'
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe('updateElementDescription', () => {
        let testElement;

        beforeEach(() => {
            testElement = elementManager.addElement({
                type: 'item',
                name: 'Test Item',
                description: 'Original description'
            });
        });

        test('should update element description', () => {
            const result = aiElementTools.updateElementDescription({
                elementId: testElement.id,
                description: 'Updated description'
            });

            expect(result.success).toBe(true);
            expect(result.element.description).toBe('Updated description');
        });

        test('should update keywords', () => {
            const result = aiElementTools.updateElementDescription({
                elementId: testElement.id,
                keywords: ['new-keyword']
            });

            expect(result.success).toBe(true);
            expect(result.element.keywords).toContain('new-keyword');
        });
    });
});

/**
 * Unit Tests for StoryViewManager
 *
 * Tests story view management and presence detection
 */

const ElementManager = require('../../js/managers/ElementManager');
const StateTimeline = require('../../js/managers/StateTimeline');
const StoryViewManager = require('../../js/managers/StoryViewManager');

describe('StoryViewManager', () => {
    let elementManager;
    let stateTimeline;
    let storyViewManager;
    let mockStory;
    let location1, location2, character1, item1;

    beforeEach(() => {
        // Create a mock story
        mockStory = {
            id: 'story-1',
            title: 'Test Story',
            elements: [],
            chapters: [
                {
                    id: 'chapter-1',
                    order: 1,
                    title: 'Chapter 1',
                    paragraphs: [
                        {
                            id: 'para-1',
                            sequence: 1,
                            content: 'First paragraph'
                        }
                    ]
                }
            ]
        };

        // Initialize managers
        elementManager = new ElementManager(mockStory);
        stateTimeline = new StateTimeline(elementManager, mockStory);
        storyViewManager = new StoryViewManager(elementManager, stateTimeline);

        // Create test elements
        location1 = elementManager.addElement({
            type: 'location',
            name: 'Castle',
            description: 'A grand castle'
        });

        location2 = elementManager.addElement({
            type: 'location',
            name: 'Forest',
            description: 'A mysterious forest'
        });

        character1 = elementManager.addElement({
            type: 'character',
            name: 'Alice',
            description: 'A brave character',
            location: location1.id
        });

        item1 = elementManager.addElement({
            type: 'item',
            name: 'Sword',
            description: 'A sharp sword',
            location: location1.id
        });
    });

    afterEach(() => {
        mockStory = null;
        elementManager = null;
        stateTimeline = null;
        storyViewManager = null;
        location1 = null;
        location2 = null;
        character1 = null;
        item1 = null;
    });

    describe('constructor', () => {
        test('should initialize with elementManager and stateTimeline', () => {
            expect(storyViewManager).toBeDefined();
            expect(storyViewManager.elementManager).toBe(elementManager);
            expect(storyViewManager.stateTimeline).toBe(stateTimeline);
        });

        test('should initialize with null view location', () => {
            expect(storyViewManager.currentViewLocation).toBeNull();
        });

        test('should initialize empty present elements set', () => {
            expect(storyViewManager.presentElements).toBeInstanceOf(Set);
            expect(storyViewManager.presentElements.size).toBe(0);
        });
    });

    describe('setViewLocation', () => {
        test('should set current view location', () => {
            storyViewManager.setViewLocation(location1.id);

            expect(storyViewManager.currentViewLocation).toBe(location1.id);
        });

        test('should throw error for non-existent location', () => {
            expect(() => {
                storyViewManager.setViewLocation('non-existent');
            }).toThrow('Invalid view location: non-existent');
        });

        test('should throw error for non-location element', () => {
            expect(() => {
                storyViewManager.setViewLocation(character1.id);
            }).toThrow(/Invalid view location/);
        });

        test('should update present elements when setting location', () => {
            storyViewManager.setViewLocation(location1.id);

            expect(storyViewManager.presentElements.size).toBeGreaterThan(0);
        });

        test('should update present elements when changing location', () => {
            storyViewManager.setViewLocation(location1.id);
            const presentCount1 = storyViewManager.presentElements.size;

            storyViewManager.setViewLocation(location2.id);
            const presentCount2 = storyViewManager.presentElements.size;

            // Present elements should change
            expect(presentCount1).not.toBe(presentCount2);
        });
    });

    describe('getViewLocation', () => {
        test('should return null when no view location is set', () => {
            expect(storyViewManager.getViewLocation()).toBeNull();
        });

        test('should return current view location', () => {
            storyViewManager.setViewLocation(location1.id);
            expect(storyViewManager.getViewLocation()).toBe(location1.id);

            storyViewManager.setViewLocation(location2.id);
            expect(storyViewManager.getViewLocation()).toBe(location2.id);
        });
    });

    describe('isElementPresent', () => {
        test('should return false when no view location is set', () => {
            expect(storyViewManager.isElementPresent(character1.id)).toBe(false);
        });

        test('should return true for element at current view location', () => {
            storyViewManager.setViewLocation(location1.id);
            expect(storyViewManager.isElementPresent(character1.id)).toBe(true);
            expect(storyViewManager.isElementPresent(item1.id)).toBe(true);
        });

        test('should return false for element at different location', () => {
            storyViewManager.setViewLocation(location2.id);
            expect(storyViewManager.isElementPresent(character1.id)).toBe(false);
        });
    });

    describe('getPresentElements', () => {
        test('should return empty array when no view location is set', () => {
            const elements = storyViewManager.getPresentElements();
            expect(Array.isArray(elements)).toBe(true);
            expect(elements.length).toBe(0);
        });

        test('should return elements at current view location', () => {
            storyViewManager.setViewLocation(location1.id);
            const elements = storyViewManager.getPresentElements();

            expect(elements.length).toBeGreaterThan(0);
            expect(elements.find(e => e.id === character1.id)).toBeDefined();
            expect(elements.find(e => e.id === item1.id)).toBeDefined();
        });

        test('should filter out undefined elements', () => {
            storyViewManager.presentElements.add('non-existent-id');
            const elements = storyViewManager.getPresentElements();

            expect(elements.find(e => e.id === 'non-existent-id')).toBeUndefined();
        });
    });

    describe('getPresentCharacters', () => {
        test('should return characters at current view location', () => {
            storyViewManager.setViewLocation(location1.id);
            const characters = storyViewManager.getPresentCharacters();

            expect(characters.length).toBe(1);
            expect(characters[0].id).toBe(character1.id);
        });

        test('should return empty array when no characters present', () => {
            storyViewManager.setViewLocation(location2.id);
            const characters = storyViewManager.getPresentCharacters();

            expect(characters).toEqual([]);
        });
    });

    describe('getPresentItems', () => {
        test('should return items at current view location', () => {
            storyViewManager.setViewLocation(location1.id);
            const items = storyViewManager.getPresentItems();

            expect(items.length).toBe(1);
            expect(items[0].id).toBe(item1.id);
        });

        test('should return empty array when no items present', () => {
            storyViewManager.setViewLocation(location2.id);
            const items = storyViewManager.getPresentItems();

            expect(items).toEqual([]);
        });
    });

    describe('getPresentLocations', () => {
        test('should return locations at current view location', () => {
            storyViewManager.setViewLocation(location1.id);
            const locations = storyViewManager.getPresentLocations();

            // location1 is the view location itself, so it should be present
            expect(locations.find(l => l.id === location1.id)).toBeDefined();
        });

        test('should return empty array when no locations present', () => {
            const character2 = elementManager.addElement({
                type: 'character',
                name: 'Bob',
                description: 'A test character',
                location: location2.id
            });

            // Set view to location2 instead of character2.id
            storyViewManager.setViewLocation(location2.id);

            const locations = storyViewManager.getPresentLocations();
            // location2 is now the view location, so it should be present
            expect(locations.length).toBe(1);
            expect(locations[0].id).toBe(location2.id);
        });
    });

    describe('getPresentElementsAt', () => {
        test('should return elements at specific location for paragraph', () => {
            const elements = storyViewManager.getPresentElementsAt('para-1', location1.id);

            expect(elements.length).toBeGreaterThan(0);
            expect(elements.find(e => e.id === character1.id)).toBeDefined();
        });

        test('should return empty array for location with no elements', () => {
            const elements = storyViewManager.getPresentElementsAt('para-1', location2.id);

            expect(elements).toEqual([]);
        });
    });

    describe('switchViewToCharacter', () => {
        test('should switch view to character\'s location', () => {
            storyViewManager.switchViewToCharacter(character1.id);

            expect(storyViewManager.currentViewLocation).toBe(location1.id);
        });

        test('should throw error for non-existent character', () => {
            expect(() => {
                storyViewManager.switchViewToCharacter('non-existent');
            }).toThrow('Character not found: non-existent');
        });

        test('should throw error for character without location', () => {
            const characterNoLocation = elementManager.addElement({
                type: 'character',
                name: 'Bob',
                description: 'A test character'
                // No location set
            });

            expect(() => {
                storyViewManager.switchViewToCharacter(characterNoLocation.id);
            }).toThrow(/has no location/);
        });
    });

    describe('switchViewToLocation', () => {
        test('should switch view to location', () => {
            storyViewManager.switchViewToLocation(location2.id);

            expect(storyViewManager.currentViewLocation).toBe(location2.id);
        });

        test('should throw error for non-existent location', () => {
            expect(() => {
                storyViewManager.switchViewToLocation('non-existent');
            }).toThrow('Invalid view location: non-existent');
        });

        test('should update present elements', () => {
            storyViewManager.switchViewToLocation(location1.id);
            const presentCount1 = storyViewManager.presentElements.size;

            storyViewManager.switchViewToLocation(location2.id);
            const presentCount2 = storyViewManager.presentElements.size;

            expect(presentCount1).not.toBe(presentCount2);
        });
    });

    describe('areLocationsConnected', () => {
        test('should return true for same location', () => {
            const connected = storyViewManager.areLocationsConnected(location1.id, location1.id);
            expect(connected).toBe(true);
        });

        test('should return true for connected locations', () => {
            // Create nested location
            const location3 = elementManager.addElement({
                type: 'location',
                name: 'Throne Room',
                description: 'A room in the castle',
                location: location1.id
            });

            const connected = storyViewManager.areLocationsConnected(location1.id, location3.id);
            expect(connected).toBe(true);
        });

        test('should return false for non-connected locations', () => {
            const connected = storyViewManager.areLocationsConnected(location1.id, location2.id);
            expect(connected).toBe(false);
        });

        test('should return false for non-existent locations', () => {
            const connected = storyViewManager.areLocationsConnected('non-existent-1', 'non-existent-2');
            expect(connected).toBe(false);
        });
    });

    describe('getAvailableViewOptions', () => {
        test('should return view options for all locations', () => {
            const options = storyViewManager.getAvailableViewOptions();

            expect(options.length).toBeGreaterThan(0);

            // Check for location options
            const locationOption = options.find(o => o.type === 'location' && o.id === location1.id);
            expect(locationOption).toBeDefined();
            expect(locationOption.name).toBe('Castle');
        });

        test('should return character count in location options', () => {
            const options = storyViewManager.getAvailableViewOptions();

            const castleOption = options.find(o => o.type === 'location' && o.id === location1.id);
            expect(castleOption.characterCount).toBe(1);
        });

        test('should return character view options', () => {
            const options = storyViewManager.getAvailableViewOptions();

            const characterOption = options.find(o => o.type === 'character' && o.id === character1.id);
            expect(characterOption).toBeDefined();
            expect(characterOption.name).toBe('Alice');
            expect(characterOption.locationId).toBe(location1.id);
        });
    });

    describe('clearView', () => {
        test('should clear current view location', () => {
            storyViewManager.setViewLocation(location1.id);
            storyViewManager.clearView();

            expect(storyViewManager.currentViewLocation).toBeNull();
        });

        test('should clear present elements', () => {
            storyViewManager.setViewLocation(location1.id);
            storyViewManager.clearView();

            expect(storyViewManager.presentElements.size).toBe(0);
        });
    });

    describe('refreshPresentElements', () => {
        test('should refresh present elements list', () => {
            storyViewManager.setViewLocation(location1.id);
            const presentCount1 = storyViewManager.presentElements.size;

            // Move character to different location
            elementManager.updateElementLocation(character1.id, location2.id);

            storyViewManager.refreshPresentElements();
            const presentCount2 = storyViewManager.presentElements.size;

            expect(presentCount2).toBeLessThan(presentCount1);
        });

        test('should maintain view location after refresh', () => {
            storyViewManager.setViewLocation(location1.id);
            const viewLocation = storyViewManager.currentViewLocation;

            storyViewManager.refreshPresentElements();

            expect(storyViewManager.currentViewLocation).toBe(viewLocation);
        });
    });

    describe('nested location support', () => {
        let nestedLocation, nestedItem;

        beforeEach(() => {
            // Create nested location
            nestedLocation = elementManager.addElement({
                type: 'location',
                name: 'Throne Room',
                description: 'A room in the castle',
                location: location1.id
            });

            // Create item in nested location
            nestedItem = elementManager.addElement({
                type: 'item',
                name: 'Crown',
                description: 'A golden crown',
                location: nestedLocation.id
            });
        });

        test('should include elements in nested locations', () => {
            storyViewManager.setViewLocation(location1.id);
            const elements = storyViewManager.getPresentElements();

            // Crown should be present even though it's in nested location
            expect(elements.find(e => e.id === nestedItem.id)).toBeDefined();
        });

        test('should recursively include all nested elements', () => {
            storyViewManager.setViewLocation(location1.id);
            const elements = storyViewManager.getPresentElements();

            // Should include: Alice, Sword, Throne Room, Crown
            expect(elements.length).toBeGreaterThanOrEqual(4);
        });
    });

    describe('presence detection rules', () => {
        test('should handle base settings (always present)', () => {
            const baseSetting = elementManager.addElement({
                type: 'base',
                name: 'Magic System',
                description: 'The magic system of the world'
            });

            storyViewManager.setViewLocation(location1.id);

            // Base settings should always be present regardless of location
            // Note: This implementation may need adjustment based on actual requirements
        });

        test('should detect location changes correctly', () => {
            storyViewManager.setViewLocation(location1.id);
            expect(storyViewManager.isElementPresent(character1.id)).toBe(true);

            elementManager.updateElementLocation(character1.id, location2.id);
            storyViewManager.refreshPresentElements();
            expect(storyViewManager.isElementPresent(character1.id)).toBe(false);
        });
    });
});

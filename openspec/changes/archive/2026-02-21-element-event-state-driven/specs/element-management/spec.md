# Element Management Specification

## Purpose
提供统一的故事元素管理功能,所有类型的人物、道具、地点、记忆、基础设定都继承自 StoryElement,提供统一的 CRUD 接口。

## ADDED Requirements

### Requirement: StoryElement data model
The system SHALL provide a unified StoryElement data model for all story element types.

#### Scenario: Create character element
- **WHEN** creating a new character
- **THEN** system creates a StoryElement with type "character"
- **AND** id follows format "character-<name>-<sequence>"
- **AND** includes base fields (name, description, keywords, location, stateHistory)

#### Scenario: Create item element
- **WHEN** creating a new item
- **THEN** system creates a StoryElement with type "item"
- **AND** id follows format "item-<name>-<sequence>"
- **AND** includes base fields and type-specific fields

#### Scenario: Create location element
- **WHEN** creating a new location
- **THEN** system creates a StoryElement with type "location"
- **AND** id follows format "location-<name>-<sequence>"

#### Scenario: Create memory element
- **WHEN** creating a new memory
- **THEN** system creates a StoryElement with type "memory"
- **AND** id follows format "memory-<name>-<sequence>"

#### Scenario: Create base setting element
- **WHEN** creating a new base setting
- **THEN** system creates a StoryElement with type "base"
- **AND** id follows format "base-<name>-<sequence>"

### Requirement: Element keywords management
The system SHALL provide keyword management for each StoryElement to enable AI-driven filtering.

#### Scenario: Add default keywords on creation
- **WHEN** creating a StoryElement
- **THEN** system adds default keywords based on type
- **AND** character type adds ["人物", element.name]
- **AND** item type adds ["道具", element.name]
- **AND** location type adds ["地点", element.name]
- **AND** memory type adds ["记忆"]
- **AND** base type adds ["基础设定"]

#### Scenario: Add custom keywords
- **WHEN** calling addKeyword(elementId, keyword)
- **THEN** system adds keyword to element.keywords array
- **AND** ignores duplicate keywords
- **AND** notifies keywordAdded event

#### Scenario: Remove keyword
- **WHEN** calling removeKeyword(elementId, keyword)
- **THEN** system removes keyword from element.keywords array
- **AND** notifies keywordRemoved event

#### Scenario: Query elements by keywords
- **WHEN** calling queryByKeywords(keywords)
- **THEN** system returns elements matching ANY of the keywords
- **AND** respects "基础设定" keyword (always included)
- **AND** respects "被遗忘" keyword (only when recall event exists)

### Requirement: Element CRUD operations
The system SHALL provide unified CRUD operations for all StoryElement types.

#### Scenario: Add element to story
- **WHEN** calling addElement(elementData)
- **THEN** system validates element type and required fields
- **AND** generates unique ID using type-name-sequence format
- **AND** adds element to story.elements array
- **AND** notifies elementAdded event
- **AND** returns created element

#### Scenario: Update element
- **WHEN** calling updateElement(elementId, updates)
- **THEN** system finds element by ID
- **AND** applies updates to element fields
- **AND** validates updated fields
- **AND** notifies elementUpdated event

#### Scenario: Delete element
- **WHEN** calling deleteElement(elementId)
- **THEN** system removes element from story.elements array
- **AND** removes all references in paragraphs.changes.elements
- **AND** notifies elementDeleted event

#### Scenario: Get element by ID
- **WHEN** calling getElement(elementId)
- **THEN** system returns element with matching ID
- **AND** returns null if element not found

#### Scenario: List elements by type
- **WHEN** calling listElements(type)
- **THEN** system returns all elements of specified type
- **AND** returns empty array if type has no elements

### Requirement: Element state history management
The system SHALL maintain state history for each StoryElement to track all changes over time.

#### Scenario: Record state change
- **WHEN** an element's state changes (location, owner, status, etc.)
- **THEN** system creates StateChange record
- **AND** includes current paragraphId
- **AND** includes timestamp
- **AND** includes only changed fields
- **AND** appends to element.stateHistory array

#### Scenario: Get element state at paragraph
- **WHEN** calling getElementStateAt(elementId, paragraphId)
- **THEN** system searches stateHistory for changes before paragraphId
- **AND** applies all changes in chronological order
- **AND** returns calculated state at that point

#### Scenario: Get current element state
- **WHEN** calling getElementCurrentState(elementId)
- **THEN** system returns element's current state
- **AND** includes location, description, owner, status

#### Scenario: Empty state history
- **WHEN** querying state for element with no history
- **THEN** system returns initial/default state
- **AND** location is null
- **AND** description is empty object
- **AND** status is null

## API

```javascript
class StoryElement {
  // Base fields
  id: string;
  type: 'character'|'item'|'location'|'memory'|'base';
  name: string;
  description: string;
  keywords: string[];
  location: string;  // elementId of current location
  stateHistory: StateChange[];

  // Type-specific fields (subclasses)
}

interface StateChange {
  paragraphId: string;
  timestamp: string;
  changes: {
    location?: string;
    description?: Record<string, any>;
    owner?: string;
    status?: string;
    keywords?: string[];
  };
}

class ElementManager {
  // CRUD operations
  addElement(elementData: StoryElementData): StoryElement;
  updateElement(elementId: string, updates: Partial<StoryElement>): void;
  deleteElement(elementId: string): void;
  getElement(elementId: string): StoryElement | null;
  listElements(type: ElementType): StoryElement[];

  // Keyword management
  addKeyword(elementId: string, keyword: string): void;
  removeKeyword(elementId: string, keyword: string): void;
  queryByKeywords(keywords: string[]): StoryElement[];

  // State history
  recordStateChange(elementId: string, changes: StateChange): void;
  getElementStateAt(elementId: string, paragraphId: string): ElementState;
  getElementCurrentState(elementId: string): ElementState;
}
```

## Dependencies
- `state`: 应用状态管理器
- `Formatters`: ID 生成和格式化

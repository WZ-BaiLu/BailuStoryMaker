# Story View Management Specification

## Purpose
提供故事视角管理功能,控制当前所在地,实现"在场"元素的智能筛选。

## ADDED Requirements

### Requirement: StoryViewManager initialization
The system SHALL initialize StoryViewManager to track current story viewpoint location.

#### Scenario: Initialize with null view
- **WHEN** StoryViewManager is created
- **THEN** system sets currentView to null
- **AND** system initializes listeners array
- **AND** system notifies viewInitialized event

#### Scenario: Set initial view location
- **WHEN** calling setViewLocation(locationElementId)
- **THEN** system validates location is a 'location' type element
- **AND** system sets currentView to locationId
- **AND** system notifies viewChanged event

### Requirement: View location management
The system SHALL allow users to change story viewpoint location.

#### Scenario: Change view location
- **WHEN** calling setViewLocation(locationElementId)
- **THEN** system validates location exists and is type 'location'
- **AND** system updates currentView to new location
- **AND** system notifies viewChanged event with old and new location

#### Scenario: Get current view location
- **WHEN** calling getCurrentView()
- **THEN** system returns currentView elementId
- **AND** returns null if no view set

#### Scenario: View location validation
- **WHEN** setting view to non-existent location
- **THEN** system throws error "Location not found"
- **WHEN** setting view to non-location element
- **THEN** system throws error "Element is not a location"

### Requirement: Element presence detection
The system SHALL determine if an element is "present" in the current story viewpoint.

#### Scenario: Base setting always present
- **WHEN** checking presence of element with keyword "基础设定"
- **THEN** system returns true
- **AND** ignores location and status

#### Scenario: Element at current view location
- **WHEN** checking presence of element at current view location
- **THEN** system returns true
- **AND** checks element.location === currentView

#### Scenario: Element at different location
- **WHEN** checking presence of element at different location
- **THEN** system returns false
- **AND** element.location !== currentView

#### Scenario: Forgotten element without recall
- **WHEN** checking presence of element with keyword "被遗忘" and no recall event
- **THEN** system returns false
- **AND** excludes from context

#### Scenario: Forgotten element with recall
- **WHEN** checking presence of element with keyword "被遗忘" and recall event in paragraph
- **THEN** system returns true
- **AND** checks hasRecallEvent(paragraphId, elementId)

#### Scenario: Memory element with trigger
- **WHEN** checking presence of memory type element with trigger event in paragraph
- **THEN** system returns true
- **AND** checks hasTriggerEvent(paragraphId, elementId)

#### Scenario: Memory element without trigger
- **WHEN** checking presence of memory type element without trigger event
- **THEN** system returns false
- **AND** excludes from context

### Requirement: Recall event detection
The system SHALL detect recall events for forgotten elements.

#### Scenario: Recall event in paragraph
- **WHEN** paragraph includes element change with keyword "追忆" for forgotten element
- **THEN** system recognizes as recall event
- **AND** hasRecallEvent() returns true

#### Scenario: No recall event
- **WHEN** paragraph has no mention of forgotten element
- **THEN** hasRecallEvent() returns false
- **AND** element remains absent

#### Scenario: Multiple recall events
- **WHEN** multiple paragraphs have recall events for same element
- **THEN** system tracks each event separately
- **AND** element is present in each of those paragraphs

### Requirement: Trigger event detection for memories
The system SHALL detect trigger events for memory elements.

#### Scenario: Memory triggered by element
- **WHEN** paragraph references memory element in context
- **THEN** system recognizes as trigger event
- **AND** hasTriggerEvent() returns true

#### Scenario: Memory not triggered
- **WHEN** paragraph has no reference to memory element
- **THEN** hasTriggerEvent() returns false
- **AND** memory remains absent

### Requirement: Present elements query
The system SHALL provide query methods to get all present elements for a paragraph.

#### Scenario: Get all present elements
- **WHEN** calling getPresentElements(paragraphId)
- **THEN** system returns array of elements where isElementPresent() is true
- **AND** includes base settings
- **AND** includes elements at current view location
- **AND** includes recalled forgotten elements
- **AND** excludes absent elements

#### Scenario: Get present elements by type
- **WHEN** calling getPresentElementsByType(paragraphId, type)
- **THEN** system returns array of present elements with matching type
- **AND** returns empty array if no elements of that type are present

#### Scenario: Filter present characters
- **WHEN** calling getPresentElementsByType(paragraphId, 'character')
- **THEN** system returns present characters
- **AND** includes characters at current view location
- **AND** excludes characters at different locations

#### Scenario: Filter present items
- **WHEN** calling getPresentElementsByType(paragraphId, 'item')
- **THEN** system returns present items
- **AND** includes items held by present characters
- **AND** includes items at current view location
- **AND** excludes items held by absent characters

## API

```javascript
class StoryViewManager {
  constructor();

  // View management
  setViewLocation(locationElementId: string): void;
  getCurrentView(): string | null;

  // Presence detection
  isElementPresent(elementId: string, paragraphId: string): boolean;

  // Event detection
  hasRecallEvent(paragraphId: string, elementId: string): boolean;
  hasTriggerEvent(paragraphId: string, elementId: string): boolean;

  // Query
  getPresentElements(paragraphId: string): StoryElement[];
  getPresentElementsByType(paragraphId: string, type: ElementType): StoryElement[];
}
```

## Dependencies
- `element-management`: StoryElement data model
- `state-tracking`: Element state queries

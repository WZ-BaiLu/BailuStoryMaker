# Props State Tracking Specification (Delta)

## Purpose
整合道具状态跟踪到新的 StateTimeline 系统,移除对 item.owner 字段的依赖。

## MODIFIED Requirements

### Requirement: Props state tracking display
**From**: The system SHALL display props (items) state changes in timeline nodes.
**To**: The system SHALL display item state changes in timeline nodes based on Element.stateHistory.

#### Scenario: Display item location changes
- **WHEN** an item's location changed
- **THEN** timeline node displays new location or owner
- **AND** indicates transfer or movement

#### Scenario: Display item status changes
- **WHEN** an item's status changed (e.g., "破损", "被遗忘")
- **THEN** timeline node displays status keyword
- **AND** shows relevant icon or color

#### Scenario: Display item description changes
- **WHEN** an item's description changed
- **THEN** timeline node displays description field changes
- **AND** shows before/after values if applicable

### Requirement: Props state data structure
**From**: Items have owner field to track ownership.
**To**: Items have location field and state.owner in stateHistory to track ownership.

#### Scenario: Read item state from history
- **WHEN** rendering a timeline node for a paragraph
- **THEN** system reads item.stateHistory
- **AND** filters changes before paragraphId
- **AND** calculates current state including location and owner

#### Scenario: Item with owner field (legacy data)
- **WHEN** loading an item with owner field (migrated data)
- **THEN** system migrates owner to location field
- **AND** creates initial state change in stateHistory
- **AND** removes owner field from item

#### Scenario: Item without owner field (new data)
- **WHEN** loading an item without owner field
- **THEN** system uses item.location for current location
- **AND** queries stateHistory for owner information

### Requirement: Item ownership tracking
**From**: Item ownership is tracked through item.owner field.
**To**: Item ownership is tracked through item.location and stateHistory.

#### Scenario: Track item transfer to character
- **WHEN** item is transferred to a character
- **THEN** system records state change in item.stateHistory
- **AND** sets location to character's elementId
- **AND** includes owner field in state changes
- **AND** updates character's state if needed

#### Scenario: Track item transfer to location
- **WHEN** item is moved to a location
- **THEN** system records state change in item.stateHistory
- **AND** sets location to location's elementId
- **AND** sets owner to null

#### Scenario: Track item forgotten
- **WHEN** item is forgotten
- **THEN** system adds "被遗忘" keyword to item.keywords
- **AND** records state change in item.stateHistory
- **AND** sets location to null or current location
- **AND** sets owner to null

## REMOVED Requirements

### Requirement: Item ownership via owner field
**Reason**: Item ownership is now tracked through item.location and stateHistory.state.owner.

**Migration**: Update all code that accesses item.owner to use item.location and query stateHistory for owner history.

### Requirement: Validate item-owner consistency
**Reason**: Consistency validation is now handled by StateTimeline, not by checking item.owner.

**Migration**: Remove validation logic that checks item.owner against character.heldItems.

## API

```javascript
class PropsStateManager {
  // Modified methods
  getItemStateAtParagraph(paragraphId: string, itemId: string): ItemState;
  // Now uses StateTimeline.getStateAt() instead of manual calculation

  // Removed methods
  // validateItemsConsistency() - Removed, no longer needed
  // repairItemsConsistency() - Removed, no longer needed

  // Owner migration (one-time)
  migrateItemOwnerToState(item: Item): void;
}

// Item model no longer has owner field
interface Item {
  id: string;
  name: string;
  type: string;
  description: string;
  properties: {
    base: Record<string, number>;
    current: Record<string, number>;
  };
  keywords: string[];  // NEW
  location: string;    // NEW - replaces owner
  stateHistory: StateChange[];  // NEW
  changeHistory: Array<any>;  // Keep for compatibility
  // owner: string | null;  // REMOVED - replaced by location
}

interface ItemState {
  itemId: string;
  location: string;
  owner: string | null;  // Derived from stateHistory
  status: string | null;
  description: Record<string, any>;
}
```

## Dependencies
- `element-management`: StoryElement data model
- `state-tracking`: StateTimeline for state queries

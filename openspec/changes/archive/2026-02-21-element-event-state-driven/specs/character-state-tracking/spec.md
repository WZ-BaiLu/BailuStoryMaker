# Character State Tracking Specification (Delta)

## Purpose
整合角色状态跟踪到新的 StateTimeline 系统,移除对 character.heldItems 的依赖。

## MODIFIED Requirements

### Requirement: Character state changes display
**From**: The system SHALL display character state changes in timeline nodes based on paragraph changes.
**To**: The system SHALL display character state changes in timeline nodes based on Element.stateHistory.

#### Scenario: Display character attribute changes
- **WHEN** a character has state changes before paragraphId
- **THEN** timeline node displays character name
- **AND** shows state changes from ElementState (attributes, status, description)

#### Scenario: Display character location changes
- **WHEN** a character's location changed
- **THEN** timeline node displays new location name
- **AND** indicates movement from previous location

#### Scenario: Display character emotional state
- **WHEN** a character's emotional state changed
- **THEN** timeline node displays emotional state from stateDescription
- **AND** shows state (e.g., "心态": "良好")

### Requirement: Character change data structure
**From**: The system SHALL use paragraph's `changes.characters` array to store character state changes, and characters SHALL include a `heldItems` field for tracking held items.
**To**: The system SHALL use Element.stateHistory to store character state changes. Characters no longer have `heldItems` field.

#### Scenario: Read character state from history
- **WHEN** rendering a timeline node for a paragraph
- **THEN** system reads character.stateHistory
- **AND** filters changes before paragraphId
- **AND** displays changes according to state data structure

#### Scenario: Character without heldItems field
- **WHEN** loading a character without `heldItems` field (new data)
- **THEN** system does not initialize `heldItems` array
- **AND** system uses element.location and state.owner for ownership

#### Scenario: Character with heldItems field (legacy data)
- **WHEN** loading a character with `heldItems` field (migrated data)
- **THEN** system migrates `heldItems` to stateHistory
- **AND** system removes `heldItems` field from character
- **AND** system creates state changes for ownership

### Requirement: Character state tracking
**From**: Character states are tracked through paragraph.changes.characters array.
**To**: Character states are tracked through Element.stateHistory and StateTimeline.

#### Scenario: Track character location change
- **WHEN** character moves to new location
- **THEN** system records state change in character.stateHistory
- **AND** includes location field with new location elementId
- **AND** includes paragraphId and timestamp

#### Scenario: Track character attribute change
- **WHEN** character's attributes change
- **THEN** system records state change in character.stateHistory
- **AND** includes description field with attribute changes
- **AND** updates character.attributes.current if applicable

#### Scenario: Track character ownership of items
- **WHEN** character acquires or loses items
- **THEN** system records state change in character.stateHistory
- **AND** includes owner field in item's stateHistory
- **AND** does NOT use character.heldItems array

## REMOVED Requirements

### Requirement: Display held items changes
**Reason**: Held items are now tracked through item.location and state.owner, not through character.heldItems.

**Migration**: Update timeline display to show item ownership changes based on item.stateHistory, not character.heldItems.

### Requirement: Character with heldItems field
**Reason**: Held items are now tracked through element.location and state.owner relationships.

**Migration**: During data migration, convert character.heldItems to item.stateHistory with owner field.

## API

```javascript
class CharacterStateManager {
  // Modified methods
  getCharacterChanges(paragraphId: string): Array<CharacterChange>;
  // Now reads from character.stateHistory instead of paragraph.changes.characters

  getCharacterStateAtParagraph(paragraphId: string, characterId: string): CharacterState;
  // Now uses StateTimeline.getStateAt() instead of manual calculation

  // Removed methods
  // getHeldItems(characterId) - Removed, use state.owner instead
}

// Character model no longer has heldItems field
interface Character {
  id: string;
  name: string;
  description: string;
  attributes: {
    base: Record<string, number>;
    current: Record<string, number>;
  };
  abilities: Array<{...}>;
  notes: string;
  keywords: string[];  // NEW
  location: string;    // NEW
  stateHistory: StateChange[];  // NEW
  // heldItems: string[];  // REMOVED
}
```

## Dependencies
- `element-management`: StoryElement data model
- `state-tracking`: StateTimeline for state queries

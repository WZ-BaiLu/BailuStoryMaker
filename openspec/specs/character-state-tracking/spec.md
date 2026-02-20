# Character State Tracking Specification

## Purpose
提供角色状态跟踪功能，记录角色属性、情绪状态、持有道具等变化，并在时间线上显示这些变化。

## Requirements

### Requirement: Character state changes display
The system SHALL display character state changes in timeline nodes based on paragraph changes.

#### Scenario: Display character attribute changes
- **WHEN** a paragraph has character attribute changes in its `changes.characters` array
- **THEN** timeline node displays character name
- **AND** shows attribute changes (e.g., "+10 HP", "Strength: 5→6")

#### Scenario: Display character emotional state
- **WHEN** a paragraph records a character's emotional state change
- **THEN** timeline node displays emotional state (e.g., "happy", "angry", "sad")

#### Scenario: Multiple characters in one paragraph
- **WHEN** a paragraph affects multiple characters
- **THEN** timeline node displays all affected characters
- **AND** each character's changes are listed separately

#### Scenario: Node without character changes
- **WHEN** a paragraph has no character changes
- **THEN** timeline node displays a default state icon
- **AND** indicates no character changes

### Requirement: Character change type visualization
The system SHALL use visual indicators to show different types of character changes.

#### Scenario: New character appearance
- **WHEN** a paragraph introduces a character for first time
- **THEN** timeline node displays a "new" indicator (e.g., green "+" icon)
- **AND** shows character's name

#### Scenario: Character attribute modification
- **WHEN** a paragraph modifies an existing character's attributes
- **THEN** timeline node displays a "modified" indicator (e.g., blue "~" icon)
- **AND** shows specific attribute changes

#### Scenario: Character removed from scene
- **WHEN** a paragraph indicates a character leaves scene
- **THEN** timeline node displays a "removed" indicator (e.g., red "-" icon)
- **AND** shows character's name

### Requirement: Character change details view
The system SHALL allow users to view detailed character state changes, including held items.

#### Scenario: Expand node for details
- **WHEN** user clicks on a timeline node (without navigating to paragraph)
- **THEN** node expands to show detailed change information
- **AND** displays all character changes with full context
- **AND** shows character's held items if applicable

#### Scenario: View attribute changes in detail
- **WHEN** a node is expanded showing character attribute changes
- **THEN** system displays both previous and new values
- **AND** shows change direction (increase/decrease)

#### Scenario: View held items changes
- **WHEN** a node is expanded showing character with held items changes
- **THEN** system displays which items were added or removed
- **AND** shows item names and brief description
- **AND** indicates acquisition or loss with icons

#### Scenario: Collapse node to hide details
- **WHEN** user clicks on an expanded timeline node
- **THEN** node collapses back to its default view
- **AND** only summary information is shown

### Requirement: Character change data structure
The system SHALL use paragraph's `changes.characters` array to store character state changes, and characters SHALL include a `heldItems` field for tracking held items.

#### Scenario: Read character changes from paragraph
- **WHEN** rendering a timeline node for a paragraph
- **THEN** system reads `changes.characters` array from paragraph data
- **AND** displays changes according to data structure

#### Scenario: Handle missing changes field
- **WHEN** a paragraph does not have a `changes.characters` field (legacy data)
- **THEN** system treats it as having no character changes
- **AND** displays default node styling

#### Scenario: Character with heldItems field
- **WHEN** loading a character with `heldItems` field
- **THEN** system parses the array of item IDs
- **AND** stores the list in character object
- **AND** can query character's held items via `getHeldItems(characterId)`

#### Scenario: Character without heldItems field (legacy data)
- **WHEN** loading a character without `heldItems` field
- **THEN** system initializes `heldItems` as an empty array `[]`
- **AND** character can be used normally

## API

```javascript
class CharacterStateManager {
    // Get character changes for a paragraph
    getCharacterChanges(paragraphId: string): Array<CharacterChange>;

    // Add character change to paragraph
    addCharacterChange(paragraphId: string, change: CharacterChange): void;

    // Update character change in paragraph
    updateCharacterChange(paragraphId: string, change: CharacterChange): void;

    // Delete character change from paragraph
    deleteCharacterChange(paragraphId: string, characterId: string): void;

    // Get character state at specific paragraph (cumulative)
    getCharacterStateAtParagraph(paragraphId: string, characterId: string): CharacterState;
}

interface CharacterChange {
    characterId: string;
    changes: {
        attributes?: Record<string, string>;
        emotionalState?: string;
    };
}

interface CharacterState {
    attributes: Record<string, string>;
    emotionalState: string;
    heldItems: string[];
}

interface Character {
    id: string;
    name: string;
    description: string;
    attributes: {
        base: Record<string, number>;
        current: Record<string, number>;
    };
    abilities: Array<{
        name: string;
        description: string;
        level: number;
        acquiredAt: string;
        evolutionHistory: Array<any>;
    }>;
    notes: string;
    heldItems: string[];
}
```

## Dependencies
- `state`: 应用状态管理器
- `localStorage`: 用于持久化角色变化数据

## ADDED Requirements

### Requirement: Character state changes display
The system SHALL display character state changes in timeline nodes based on paragraph changes.

#### Scenario: Display character attribute changes
- **WHEN** a paragraph has character attribute changes in its `changes.characters` array
- **THEN** the timeline node displays the character name
- **AND** shows the attribute changes (e.g., "+10 HP", "Strength: 5→6")

#### Scenario: Display character emotional state
- **WHEN** a paragraph records a character's emotional state change
- **THEN** the timeline node displays the emotional state (e.g., "happy", "angry", "sad")

#### Scenario: Multiple characters in one paragraph
- **WHEN** a paragraph affects multiple characters
- **THEN** the timeline node displays all affected characters
- **AND** each character's changes are listed separately

#### Scenario: Node without character changes
- **WHEN** a paragraph has no character changes
- **THEN** the timeline node displays a default state icon
- **AND** indicates no character changes

### Requirement: Character change type visualization
The system SHALL use visual indicators to show different types of character changes.

#### Scenario: New character appearance
- **WHEN** a paragraph introduces a character for the first time
- **THEN** the timeline node displays a "new" indicator (e.g., green "+" icon)
- **AND** shows the character's name

#### Scenario: Character attribute modification
- **WHEN** a paragraph modifies an existing character's attributes
- **THEN** the timeline node displays a "modified" indicator (e.g., blue "~" icon)
- **AND** shows the specific attribute changes

#### Scenario: Character removed from scene
- **WHEN** a paragraph indicates a character leaves the scene
- **THEN** the timeline node displays a "removed" indicator (e.g., red "-" icon)
- **AND** shows the character's name

### Requirement: Character change details view
The system SHALL allow users to view detailed character state changes.

#### Scenario: Expand node for details
- **WHEN** user clicks on a timeline node (without navigating to paragraph)
- **THEN** the node expands to show detailed change information
- **AND** displays all character changes with full context

#### Scenario: View attribute changes in detail
- **WHEN** a node is expanded showing character attribute changes
- **THEN** system displays both previous and new values
- **AND** shows the change direction (increase/decrease)

#### Scenario: Collapse node to hide details
- **WHEN** user clicks on an expanded timeline node
- **THEN** the node collapses back to its default view
- **AND** only summary information is shown

### Requirement: Character change data structure
The system SHALL use the paragraph's `changes.characters` array to store character state changes.

#### Scenario: Read character changes from paragraph
- **WHEN** rendering a timeline node for a paragraph
- **THEN** system reads the `changes.characters` array from the paragraph data
- **AND** displays the changes according to the data structure

#### Scenario: Handle missing changes field
- **WHEN** a paragraph does not have a `changes.characters` field (legacy data)
- **THEN** system treats it as having no character changes
- **AND** displays default node styling

# Character State Tracking Specification - Delta

## MODIFIED Requirements

### Requirement: Character state data structure
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

### Requirement: Character state summary
The system SHALL generate paragraph state summary showing only characters present in the paragraph.

#### Scenario: Generate summary for paragraph with characters
- **WHEN** generating state summary for a paragraph
- **THEN** system identifies characters in `changes.characters` array
- **AND** displays only those characters' states
- **AND** shows their attributes and emotional states

#### Scenario: Generate summary with held items
- **WHEN** generating state summary for a paragraph with characters
- **THEN** system displays each character's held items
- **AND** shows item names and types
- **AND** limits display to items currently held by the character

#### Scenario: Generate summary for paragraph without characters
- **WHEN** generating state summary for a paragraph with no character changes
- **THEN** system displays "No characters in this paragraph" message
- **AND** does not show any character or item states

#### Scenario: Exclude non-present characters from summary
- **WHEN** generating state summary
- **THEN** system excludes characters not in `changes.characters` array
- **AND** does not display their states or held items

## ADDED Requirements

### Requirement: Character held items in paragraph changes
The system SHALL support tracking character held items changes in paragraph's `changes.characters`.

#### Scenario: Add held items change to paragraph
- **WHEN** a character acquires or loses items in a paragraph
- **THEN** paragraph's `changes.characters` entry includes `heldItems` changes
- **AND** system records which items were added or removed

#### Scenario: Display held items change in timeline
- **WHEN** rendering timeline node with held items changes
- **THEN** node shows which items were acquired or lost
- **AND** uses appropriate icons (e.g., "+" for acquisition, "-" for loss)

#### Scenario: Cumulative held items state
- **WHEN** calculating character's held items at a specific paragraph
- **THEN** system aggregates all held items changes from previous paragraphs
- **AND** returns the current held items state

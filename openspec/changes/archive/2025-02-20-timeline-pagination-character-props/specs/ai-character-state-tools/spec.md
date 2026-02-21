## ADDED Requirements

### Requirement: AI character state update tool
The system SHALL provide an AI tool to update character states based on story content.

#### Scenario: AI updates character attribute
- **WHEN** AI invokes the `updateCharacterState` tool
- **THEN** system updates the specified character's attributes
- **AND** records the change in the paragraph's `changes.characters` array
- **AND** notifies the user of the update

#### Scenario: AI updates character emotional state
- **WHEN** AI invokes the `updateCharacterState` tool with emotional state
- **THEN** system updates the character's emotional state
- **AND** records the change in the paragraph's `changes.characters` array

#### Scenario: AI updates multiple characters
- **WHEN** AI invokes the `updateCharacterState` tool for multiple characters
- **THEN** system updates each character's state
- **AND** records all changes in the paragraph's `changes.characters` array

### Requirement: AI item state update tool
The system SHALL provide an AI tool to update item states based on story content.

#### Scenario: AI records item acquisition
- **WHEN** AI invokes the `updateItemState` tool with "acquire" action
- **THEN** system records the item being acquired by a character
- **AND** adds the change to the paragraph's `changes.items` array

#### Scenario: AI records item loss
- **WHEN** AI invokes the `updateItemState` tool with "lose" action
- **THEN** system records the item being lost by a character
- **AND** adds the change to the paragraph's `changes.items` array

#### Scenario: AI records item transfer
- **WHEN** AI invokes the `updateItemState` tool with "transfer" action
- **THEN** system records the item transfer between characters or locations
- **AND** adds the change to the paragraph's `changes.items` array

### Requirement: AI tool parameter validation
The system SHALL validate AI tool parameters before applying changes.

#### Scenario: Validate character ID
- **WHEN** AI invokes `updateCharacterState` with an invalid character ID
- **THEN** system returns an error
- **AND** does not apply any changes

#### Scenario: Validate item ID
- **WHEN** AI invokes `updateItemState` with an invalid item ID
- **THEN** system returns an error
- **AND** does not apply any changes

#### Scenario: Validate paragraph ID
- **WHEN** AI invokes state update tools without specifying a paragraph ID
- **THEN** system uses the current selected paragraph
- **AND** if no paragraph is selected, returns an error

### Requirement: AI state change undo/redo
The system SHALL support undo and redo of AI-initiated state changes.

#### Scenario: Undo AI character state update
- **WHEN** user triggers undo after AI updated character state
- **THEN** system restores character state to previous values
- **AND** removes the change from paragraph's `changes.characters` array

#### Scenario: Redo AI item state update
- **WHEN** user triggers redo after undoing an AI item state update
- **THEN** system reapplies the item state changes
- **AND** restores the change in paragraph's `changes.items` array

### Requirement: AI state change notification
The system SHALL notify users when AI makes state changes.

#### Scenario: Notify on character state update
- **WHEN** AI successfully updates character state
- **THEN** system displays a success notification
- **AND** shows summary of changes (e.g., "Updated health of Character A: +10")

#### Scenario: Notify on item state update
- **WHEN** AI successfully updates item state
- **THEN** system displays a success notification
- **AND** shows summary of changes (e.g., "Character A acquired Sword")

#### Scenario: Notify on validation error
- **WHEN** AI tool validation fails
- **THEN** system displays an error notification
- **AND** provides details about the validation failure

### Requirement: AI tool interface definition
The system SHALL define clear interfaces for AI state update tools.

#### Scenario: updateCharacterState tool interface
- **WHEN** AI tool is defined
- **THEN** tool accepts parameters: characterId (string), changes (object with attributes and emotionalState), paragraphId (string)
- **AND** returns success status and updated state

#### Scenario: updateItemState tool interface
- **WHEN** AI tool is defined
- **THEN** tool accepts parameters: itemId (string), action (string: 'acquire', 'lose', 'transfer', 'modify'), characterId (string, optional), location (string, optional), paragraphId (string)
- **AND** returns success status and updated state

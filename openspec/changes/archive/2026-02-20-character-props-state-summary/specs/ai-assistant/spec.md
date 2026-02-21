# AI Assistant Specification - Delta

## MODIFIED Requirements

### Requirement: Character information in prompts
The system SHALL include character information in AI prompts, including held items.

#### Scenario: Include character attributes and abilities
- **WHEN** generating AI prompt for a paragraph
- **THEN** system includes character's name, description
- **AND** includes character's current attributes
- **AND** includes character's abilities and their levels

#### Scenario: Include character held items
- **WHEN** generating AI prompt for a paragraph
- **THEN** system includes character's held items
- **AND** lists item names, types, and key properties
- **AND** indicates which items are available to the character

#### Scenario: Include character emotional state
- **WHEN** generating AI prompt for a paragraph
- **THEN** system includes character's current emotional state
- **AND** provides context for character behavior

#### Scenario: Include multiple characters
- **WHEN** multiple characters are present in a paragraph
- **THEN** system includes information for each character
- **AND** organizes information by character ID
- **AND** shows each character's held items separately

### Requirement: Props information in prompts
The system SHALL include props information in AI prompts, focusing on items held by present characters.

#### Scenario: Include items held by present characters
- **WHEN** generating AI prompt for a paragraph
- **THEN** system includes items held by characters in `changes.characters`
- **AND** provides item details (name, type, properties, description)
- **AND** excludes items held by non-present characters

#### Scenario: Include item ownership context
- **WHEN** including item information in prompts
- **THEN** system indicates which character holds each item
- **AND** shows item's current owner
- **AND** provides item's acquisition history if relevant

#### Scenario: Exclude items not relevant to paragraph
- **WHEN** generating AI prompt for a paragraph
- **THEN** system excludes items not held by present characters
- **AND** does not include items with no owner
- **AND** does not include items in locations (unless relevant to paragraph)

### Requirement: Context-aware prompt generation
The system SHALL generate context-aware prompts based on paragraph changes.

#### Scenario: Generate prompt for character interaction paragraph
- **WHEN** a paragraph involves multiple characters interacting
- **THEN** system includes all present characters' information
- **AND** includes items held by each character
- **AND** highlights potential item-related interactions

#### Scenario: Generate prompt for combat paragraph
- **WHEN** a paragraph involves combat or action
- **THEN** system includes character's combat-related abilities
- **AND** includes weapons and equipment from `heldItems`
- **AND** provides item properties relevant to combat (attack, defense, etc.)

#### Scenario: Generate prompt for puzzle-solving paragraph
- **WHEN** a paragraph involves puzzle or mystery
- **THEN** system includes key items from `heldItems`
- **AND** provides item descriptions that might be relevant to puzzle
- **AND** suggests potential item combinations or uses

## ADDED Requirements

### Requirement: Held items in prompt context
The system SHALL provide structured held items information in AI prompts.

#### Scenario: Format held items in prompt
- **WHEN** including held items in prompt
- **THEN** system formats items as structured list
- **AND** includes: item name, type, key properties, brief description
- **AND** organizes items by owner character

#### Scenario: Include item availability
- **WHEN** including held items in prompt
- **THEN** system indicates which items are available for use
- **AND** marks items that have been used recently (if applicable)
- **AND** suggests potential item interactions

#### Scenario: Contextual item suggestions
- **WHEN** generating prompt for action scene
- **THEN** system suggests items that might be relevant to the action
- **AND** highlights weapons, tools, or special items in `heldItems`
- **AND** provides item properties that support the action

## API

```javascript
class AIManager {
    // Existing methods...

    /**
     * Generate AI prompt with character and held items context
     * @param {string} paragraphId - Paragraph ID
     * @param {Object} options - Prompt generation options
     * @returns {string} Generated prompt
     */
    generatePrompt(paragraphId: string, options?: PromptOptions): string;

    /**
     * Format character held items for AI prompt
     * @param {string} characterId - Character ID
     * @returns {string} Formatted held items string
     */
    formatHeldItems(characterId: string): string;
}

interface PromptOptions {
    includeHeldItems?: boolean;
    includeCharacterDetails?: boolean;
    includeItemDetails?: boolean;
    contextType?: 'general' | 'combat' | 'puzzle' | 'dialogue';
}
```

## Dependencies
- `state`: 应用状态管理器
- `character-state-tracking`: 角色状态跟踪，需要 `heldItems` 信息
- `props-state-tracking`: 道具状态跟踪

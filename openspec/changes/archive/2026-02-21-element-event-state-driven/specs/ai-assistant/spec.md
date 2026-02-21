# AI Assistant Specification (Delta)

## Purpose
整合新的 AI tools 到 AI Assistant,更新 prompt 构建逻辑使用 StateContext,实现"预览-确认"插入流程。

## ADDED Requirements

### Requirement: Register AI element tools
The system SHALL register new AI tools (addElement, updateElementLocation, updateElementDescription) in AIManager.

#### Scenario: Register addElement tool
- **WHEN** AIManager initializes
- **THEN** system calls registerTool('addElement', addElementHandler)
- **AND** AI can invoke addElement tool

#### Scenario: Register updateElementLocation tool
- **WHEN** AIManager initializes
- **THEN** system calls registerTool('updateElementLocation', updateElementLocationHandler)
- **AND** AI can invoke updateElementLocation tool

#### Scenario: Register updateElementDescription tool
- **WHEN** AIManager initializes
- **THEN** system calls registerTool('updateElementDescription', updateElementDescriptionHandler)
- **AND** AI can invoke updateElementDescription tool

### Requirement: Build context from StateContextCache
The system SHALL use StateContextCache to build AI prompt context instead of manual context building.

#### Scenario: Get context for paragraph generation
- **WHEN** building AI prompt for paragraph generation
- **THEN** system calls stateContextCache.getContext(chapterId)
- **AND** system receives cached StoryContext
- **AND** system formats context for AI using formatContextForAI()

#### Scenario: Include present elements in context
- **WHEN** building context
- **THEN** system includes all present elements from StoryContext
- **AND** includes element names, descriptions, states
- **AND** excludes absent elements

#### Scenario: Include view location in context
- **WHEN** building context
- **THEN** system includes current view location
- **AND** includes location element details

### Requirement: Preview-confirm workflow integration
The system SHALL integrate preview-confirm workflow into AIManager's message handling.

#### Scenario: Generate paragraph suggestion (no tool calls)
- **WHEN** AI generates paragraph in response to user prompt
- **THEN** system instructs AI to return JSON format suggestion
- **AND** suggestion includes content and element changes
- **AND** system does NOT call tools during generation

#### Scenario: Display preview to user
- **WHEN** AI returns suggestion
- **THEN** system displays paragraph content in preview
- **AND** system shows list of element changes
- **AND** system provides "Confirm" and "Reject" buttons

#### Scenario: User confirms suggestion
- **WHEN** user clicks "Confirm"
- **THEN** system inserts paragraph into story
- **AND** system calls AI tools to apply element changes
- **AND** system updates StateContextCache

#### Scenario: User rejects suggestion
- **WHEN** user clicks "Reject"
- **THEN** system discards suggestion
- **AND** system does NOT insert paragraph
- **AND** system does NOT call AI tools

#### Scenario: User modifies suggestion
- **WHEN** user edits suggestion before confirming
- **THEN** system applies modified content and changes
- **AND** system calls AI tools with modified parameters

## MODIFIED Requirements

### Requirement: AAR-20: Context-Aware Prompt Generation
**From**: The system SHALL generate context-aware prompts based on paragraph changes.
**To**: The system SHALL generate context-aware prompts using StateContextCache, which automatically includes present elements based on story view and keywords.

#### Scenario: Generate prompt for paragraph
- **WHEN** building AI prompt for paragraph generation
- **THEN** system retrieves StoryContext from StateContextCache
- **AND** system includes context.paragraphs.presentElements
- **AND** system formats elements with their states
- **AND** system includes view location and active memories

#### Scenario: Include present characters
- **WHEN** building prompt
- **THEN** system includes characters where element.location === currentView
- **AND** includes character.name, character.description, character.stateDescription
- **AND** excludes characters at different locations

#### Scenario: Include present items
- **WHEN** building prompt
- **THEN** system includes items owned by present characters
- **AND** includes items at current view location
- **AND** excludes items held by absent characters

#### Scenario: Include recalled forgotten items
- **WHEN** building prompt and paragraph has recall event
- **THEN** system includes forgotten items with recall events
- **AND** marks them as "被遗忘" in context

### Requirement: AAR-21: Held Items in Prompt Context
**From**: The system SHALL provide structured held items information in AI prompts.
**To**: **REMOVED** - Held items are now represented by location and ownership relationships in ElementState.

**Reason**: Held items are now tracked through element.location and state changes, not as a separate array.

**Migration**: Use element.state.location and state.owner to determine item ownership.

## REMOVED Requirements

### Requirement: AAR-18: Held Items in Prompt Context
**Reason**: Held items are now tracked through element.location and ownership relationships, not as a separate field.

**Migration**: Update prompt generation to use element.state.location and state.owner instead of character.heldItems array.

### Requirement: AAR-19: Props Information in Prompts
**Reason**: "Props" concept is unified with "elements". Use present elements query instead.

**Migration**: Use stateContext.getContext() to get present elements, which automatically includes props/items at current view location.

## API

```javascript
class AIManager {
  // New methods
  registerAIElementTools(): void;

  // Modified methods
  buildContext(): object;  // Now uses StateContextCache
  handleAISuggestion(suggestion: ParagraphSuggestion): Promise<void>;

  // Preview workflow
  generateSuggestion(userPrompt: string): Promise<ParagraphSuggestion>;
  showPreview(suggestion: ParagraphSuggestion): Promise<boolean>;
  applySuggestion(suggestion: ParagraphSuggestion): Promise<void>;
}

interface ParagraphSuggestion {
  content: string;
  elementChanges: Array<{
    tool: 'addElement'|'updateElementLocation'|'updateElementDescription';
    params: any;
    description: string;
  }>;
}
```

## Dependencies
- `ai-element-tools`: AI tool implementations
- `state-context`: StateContextCache for context building
- `element-management`: Element operations
- `state-tracking`: StateTimeline updates

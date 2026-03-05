# Paragraph Analysis

## ADDED Requirements

### Requirement: System shall analyze paragraph with standardized message structure and tool calls
The system SHALL analyze paragraphs using a standardized message structure with specific assistant messages for context and tool definitions for element management.

#### Scenario: Analyze paragraph with default message structure
- **WHEN** user requests paragraph analysis
- **THEN** system SHALL build messages with following structure:
  1. System: analysis base prompt (configurable)
  2. Assistant[0]: "检查段落里出现新元素，则添加到元素列表中"
  3. Assistant[1]: "段落里出现已有元素的状态改变"
  4. User: user input prompt (or analysis instruction)
- **AND** system SHALL include tool definitions:
  - Tool: add_element - for adding new elements
  - Tool: update_element_state - for updating element states
- **AND** system SHALL use `AIPromptBuilder.buildAnalysisPrompt()` to generate prompt
- **AND** system SHALL use `AIMessageBuilder.buildMessages()` to convert to message array
- **AND** system SHALL send messages with tools to AI provider via `AIService.chat()`

#### Scenario: Analyze paragraph with custom system prompt
- **WHEN** system is configured with custom paragraph analysis system prompt
- **THEN** system SHALL use custom prompt as system message
- **AND** system SHALL not use default built-in prompt

#### Scenario: Analyze paragraph at specific position
- **WHEN** user selects a paragraph and requests analysis
- **THEN** system SHALL build context up to selected paragraph
- **AND** system SHALL include only element states up to selected paragraph
- **AND** system SHALL include only text up to selected paragraph in context
- **AND** system SHALL ensure correct timeline (later elements don't appear earlier)

#### Scenario: Analyze paragraph with configurable context range
- **WHEN** system is configured with `contextParagraphRange = 2`
- **AND** user selects paragraph and requests analysis
- **THEN** system SHALL include text from 2nd previous paragraph with element state changes to current paragraph
- **AND** system SHALL call `AIContextBuilder.getPrecedingText(paragraphId, 2)`

### Requirement: System shall provide tool definitions for paragraph analysis
The system SHALL provide tool definitions that allow AI to add new elements and update element states during paragraph analysis.

#### Scenario: Include add_element tool in request
- **WHEN** system builds paragraph analysis request
- **THEN** system SHALL include `add_element` tool definition
- **AND** tool SHALL have following structure:
  - name: "add_element"
  - description: "Add a new element to the story"
  - parameters: {type, name, description, location, keywords}
- **AND** AI SHALL be able to call this tool to add new elements found in paragraph

#### Scenario: Include update_element_state tool in request
- **WHEN** system builds paragraph analysis request
- **THEN** system SHALL include `update_element_state` tool definition
- **AND** tool SHALL have following structure:
  - name: "update_element_state"
  - description: "Update the state of an existing element"
  - parameters: {elementId, stateChanges}
- **AND** AI SHALL be able to call this tool to update element states

#### Scenario: Process tool calls from AI response
- **WHEN** AI returns response with tool calls
- **THEN** system SHALL execute tool calls in order
- **AND** system SHALL apply changes to element list
- **AND** system SHALL update paragraph changes record
- **AND** system SHALL save changes to data store

### Requirement: System shall preview paragraph analysis request
The system SHALL provide preview for paragraph analysis requests before sending to AI.

#### Scenario: Preview paragraph analysis request
- **WHEN** user clicks "Preview" for paragraph analysis
- **THEN** system SHALL generate preview showing:
  - Request type: "paragraph-analysis"
  - Model configuration (model, temperature, maxTokens)
  - System prompt
  - Element state summary (collapsible)
  - Existing text context (collapsible)
  - Tool definitions (collapsible)
  - User prompt or analysis instruction
- **AND** system SHALL display preview UI
- **AND** system SHALL save preview to cache

#### Scenario: Preview shows available tools
- **WHEN** preview is displayed for paragraph analysis
- **THEN** preview SHALL show tool definitions section
- **AND** section SHALL list available tools:
  - add_element
  - update_element_state
- **AND** section SHALL be collapsible to reduce visual clutter

### Requirement: System shall send paragraph analysis request after confirmation
The system SHALL send paragraph analysis request to AI provider only after user confirms preview.

#### Scenario: Send request after user confirms preview
- **WHEN** user confirms paragraph analysis preview
- **THEN** system SHALL extract messages and tools from preview object
- **AND** system SHALL call `AIService.chat(config, messages, context, tools)`
- **AND** system SHALL await AI response
- **AND** system SHALL save result to cache
- **AND** system SHALL process tool calls if present

#### Scenario: Handle successful paragraph analysis
- **WHEN** AI successfully analyzes paragraph
- **THEN** system SHALL extract analysis content from response
- **AND** IF response contains tool calls:
  - System SHALL execute tool calls
  - System SHALL add new elements to story
  - System SHALL update element states
- **AND** system SHALL display analysis result to user
- **AND** system SHALL save result to cache for potential recovery

#### Scenario: Handle failed paragraph analysis
- **WHEN** AI fails to analyze paragraph (network error, API error, etc.)
- **THEN** system SHALL display error message to user
- **AND** system SHALL NOT apply any tool call changes
- **AND** preview cache SHALL remain for retry

### Requirement: System shall apply element changes from analysis
The system SHALL apply element changes (new elements, state updates) discovered during paragraph analysis.

#### Scenario: Add new element from analysis
- **WHEN** AI calls `add_element` tool during analysis
- **THEN** system SHALL create new element with specified parameters
- **AND** system SHALL assign unique element ID
- **AND** system SHALL add element to story's element list
- **AND** system SHALL record change in paragraph's changes.elements array

#### Scenario: Update element state from analysis
- **WHEN** AI calls `update_element_state` tool during analysis
- **THEN** system SHALL find existing element by ID
- **AND** system SHALL apply state changes to element
- **AND** system SHALL record change in paragraph's changes.elements array

#### Scenario: Record element changes in paragraph
- **WHEN** element changes are applied from analysis
- **THEN** system SHALL record change in paragraph's changes.elements array
- **AND** record SHALL include:
  - elementId: ID of affected element
  - elementName: name of affected element
  - action: "add" or "update"
  - timestamp: change timestamp
- **AND** system SHALL use this record for context range calculation

### Requirement: System shall allow paragraph analysis without preview (optional)
The system SHALL support direct paragraph analysis without preview for power users who choose to skip preview step.

#### Scenario: Analyze paragraph without preview when user prefers
- **WHEN** user has selected "Remember choice, don't preview" option
- **AND** user requests paragraph analysis
- **THEN** system SHALL skip preview step
- **AND** system SHALL directly build and send request
- **AND** system SHALL use same message building logic as preview

### Requirement: System shall provide recovery for paragraph analysis results
The system SHALL allow users to recover paragraph analysis results if accidentally closed.

#### Scenario: Recover analysis result
- **WHEN** user accidentally closes paragraph analysis result UI
- **THEN** system SHALL provide "Recover Result" option
- **AND** system SHALL display list of recent analysis results
- **AND** WHEN user clicks a result
- **THEN** system SHALL restore result UI with analysis content
- **AND** system SHALL allow user to apply or discard element changes

#### Scenario: Recover expired analysis result
- **WHEN** user tries to recover analysis result that has expired (> 30 minutes)
- **THEN** system SHALL display error message
- **AND** system SHALL not restore the result
- **AND** system SHALL suggest re-analyzing paragraph

### Requirement: System shall validate paragraph analysis request
The system SHALL validate paragraph analysis request before sending to AI.

#### Scenario: Validate before preview
- **WHEN** user requests paragraph analysis preview
- **THEN** system SHALL validate request parameters:
  - Selected paragraph ID is valid
  - Paragraph content is not empty
  - Model configuration is valid
  - Tool definitions are valid
- **AND** IF validation fails, system SHALL display error message
- **AND** system SHALL not generate preview

#### Scenario: Validate before sending
- **WHEN** user confirms preview and sends request
- **THEN** system SHALL validate messages before sending:
  - Message array is not empty
  - Each message has role and content
  - Role values are valid (system, user, assistant)
  - Content fields are not empty
  - Tool definitions are valid and complete
- **AND** IF validation fails, system SHALL display error message
- **AND** system SHALL not send request

### Requirement: System shall handle analysis conflicts
The system SHALL handle potential conflicts when applying element changes from analysis.

#### Scenario: Handle element name conflict
- **WHEN** AI tries to add element with existing name
- **THEN** system SHALL detect conflict
- **AND** system SHALL either:
  - Use existing element instead of creating duplicate
  - Prompt user to resolve conflict
- **AND** system SHALL record decision in analysis result

#### Scenario: Handle element ID conflict
- **WHEN** AI tries to update element with invalid ID
- **THEN** system SHALL detect error
- **AND** system SHALL skip this update
- **AND** system SHALL log error
- **AND** system SHALL notify user in analysis result

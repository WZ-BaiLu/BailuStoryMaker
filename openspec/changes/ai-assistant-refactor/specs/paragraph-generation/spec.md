# Paragraph Generation

## ADDED Requirements

### Requirement: System shall generate paragraph with standardized message structure
The system SHALL generate paragraphs using a standardized message structure with specific assistant messages for context.

#### Scenario: Generate paragraph with default message structure
- **WHEN** user requests paragraph generation
- **THEN** system SHALL build messages with following structure:
  1. System: generation base prompt (configurable)
  2. Assistant[0]: "截至所选段落) 当前出场的元素和状态"
  3. Assistant[1]: "(截止所选段落) 已有的文本"
  4. User: user input prompt
- **AND** system SHALL use `AIPromptBuilder.buildParagraphPrompt()` to generate prompt
- **AND** system SHALL use `AIMessageBuilder.buildMessages()` to convert to message array
- **AND** system SHALL send messages to AI provider via `AIService.chat()`

#### Scenario: Generate paragraph with custom system prompt
- **WHEN** system is configured with custom paragraph generation system prompt
- **THEN** system SHALL use custom prompt as system message
- **AND** system SHALL not use default built-in prompt

#### Scenario: Generate paragraph at specific paragraph position
- **WHEN** user selects a paragraph and requests generation after it
- **THEN** system SHALL build context up to selected paragraph
- **AND** system SHALL include only element states up to selected paragraph
- **AND** system SHALL include only text up to selected paragraph in context
- **AND** system SHALL ensure correct timeline (later elements don't appear earlier)

#### Scenario: Generate paragraph with configurable context range
- **WHEN** system is configured with `contextParagraphRange = 2`
- **AND** user selects paragraph and requests generation
- **THEN** system SHALL include text from 2nd previous paragraph with element state changes to current paragraph
- **AND** system SHALL call `AIContextBuilder.getPrecedingText(paragraphId, 2)`

#### Scenario: Generate paragraph with full chapter context (range = 0)
- **WHEN** system is configured with `contextParagraphRange = 0`
- **AND** user requests paragraph generation
- **THEN** system SHALL include all paragraphs from chapter start to current position
- **AND** system SHALL call `AIContextBuilder.getPrecedingText(paragraphId, 0)`

### Requirement: System shall preview paragraph generation request
The system SHALL provide preview for paragraph generation requests before sending to AI.

#### Scenario: Preview paragraph generation request
- **WHEN** user clicks "Preview" for paragraph generation
- **THEN** system SHALL generate preview showing:
  - Request type: "paragraph-generation"
  - Model configuration (model, temperature, maxTokens)
  - System prompt
  - Element state summary (collapsible)
  - Existing text context (collapsible)
  - User prompt
- **AND** system SHALL display preview UI
- **AND** system SHALL save preview to cache

#### Scenario: Preview shows accurate element states
- **WHEN** preview is displayed for paragraph generation
- **THEN** element state summary SHALL show only elements up to selected paragraph
- **AND** summary SHALL show correct current states for each element
- **AND** summary SHALL NOT include elements that appear later in story

#### Scenario: Preview shows accurate chapter content
- **WHEN** preview is displayed for paragraph generation
- **THEN** chapter content SHALL show only text up to selected paragraph (not full chapter)
- **AND** content SHALL respect `contextParagraphRange` configuration

### Requirement: System shall send paragraph generation request after confirmation
The system SHALL send paragraph generation request to AI provider only after user confirms preview.

#### Scenario: Send request after user confirms preview
- **WHEN** user confirms paragraph generation preview
- **THEN** system SHALL extract messages from preview object
- **AND** system SHALL call `AIService.chat(config, messages, context, null)` (no tools)
- **AND** system SHALL await AI response
- **AND** system SHALL save result to cache
- **AND** system SHALL return generated paragraph content

#### Scenario: Handle successful paragraph generation
- **WHEN** AI successfully generates paragraph
- **THEN** system SHALL extract generated content from response
- **AND** system SHALL display result to user
- **AND** system SHALL save result to cache for potential recovery

#### Scenario: Handle failed paragraph generation
- **WHEN** AI fails to generate paragraph (network error, API error, etc.)
- **THEN** system SHALL display error message to user
- **AND** system SHALL NOT save any partial result
- **AND** preview cache SHALL remain for retry

### Requirement: System shall allow paragraph generation without preview (optional)
The system SHALL support direct paragraph generation without preview for power users who choose to skip preview step.

#### Scenario: Generate paragraph without preview when user prefers
- **WHEN** user has selected "Remember choice, don't preview" option
- **AND** user requests paragraph generation
- **THEN** system SHALL skip preview step
- **AND** system SHALL directly build and send request
- **AND** system SHALL use same message building logic as preview

#### Scenario: Re-enable preview after disabling
- **WHEN** user who disabled preview changes preference
- **THEN** system SHALL show preview for all subsequent requests
- **AND** system SHALL respect new preference immediately

### Requirement: System shall provide recovery for paragraph generation results
The system SHALL allow users to recover paragraph generation results if accidentally closed.

#### Scenario: Recover generated paragraph
- **WHEN** user accidentally closes paragraph generation result UI
- **THEN** system SHALL provide "Recover Result" option
- **AND** system SHALL display list of recent paragraph generation results
- **AND** WHEN user clicks a result
- **THEN** system SHALL restore result UI with generated paragraph
- **AND** system SHALL allow user to save paragraph to story

#### Scenario: Recover expired paragraph generation result
- **WHEN** user tries to recover paragraph generation result that has expired (> 30 minutes)
- **THEN** system SHALL display error message
- **AND** system SHALL not restore the result
- **AND** system SHALL suggest regenerating paragraph

### Requirement: System shall validate paragraph generation request
The system SHALL validate paragraph generation request before sending to AI.

#### Scenario: Validate before preview
- **WHEN** user requests paragraph generation preview
- **THEN** system SHALL validate request parameters:
  - Selected paragraph ID is valid
  - User prompt is not empty
  - Model configuration is valid
- **AND** IF validation fails, system SHALL display error message
- **AND** system SHALL not generate preview

#### Scenario: Validate before sending
- **WHEN** user confirms preview and sends request
- **THEN** system SHALL validate messages before sending:
  - Message array is not empty
  - Each message has role and content
  - Role values are valid (system, user, assistant)
  - Content fields are not empty
- **AND** IF validation fails, system SHALL display error message
- **AND** system SHALL not send request

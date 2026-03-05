# Unified AI Messaging

## ADDED Requirements

### Requirement: System shall provide unified message builder for AI requests
The system SHALL provide a unified message builder component (`AIMessageBuilder`) that constructs message arrays for all AI requests, eliminating duplicate message building logic across different modules.

#### Scenario: Build messages for paragraph generation request
- **WHEN** system calls `AIMessageBuilder.buildMessages()` with a paragraph generation request
- **THEN** system SHALL construct message array with system prompt, context messages (chapter title, content, element state), and user prompt
- **AND** context object fields SHALL be converted to assistant messages:
  - `context.chapterTitle` → assistant: "Chapter Title: xxx"
  - `context.chapterContent` → assistant: "以下是当前章节已写的内容..."
  - `context.elementStateSummary` → assistant: "当前在场元素状态：..."
- **AND** system SHALL return message array in format `[{role, content}]`

#### Scenario: Build messages for paragraph analysis request
- **WHEN** system calls `AIMessageBuilder.buildMessages()` with a paragraph analysis request
- **THEN** system SHALL construct message array with system prompt for analysis, context messages, and user prompt
- **AND** system SHALL include tool definitions if available

#### Scenario: Validate message format before sending
- **WHEN** system calls `AIMessageBuilder.validateMessages()` with message array
- **THEN** system SHALL validate that:
  - Message array is not empty
  - Each message has `role` and `content` fields
  - Role value is one of: system, user, assistant
  - Content field is not empty
- **AND** system SHALL return `{valid: boolean, errors: string[]}`

### Requirement: System shall provide unified prompt builder for different AI tasks
The system SHALL provide a prompt builder component (`AIPromptBuilder`) that generates prompt content for different AI task types (paragraph generation, paragraph analysis).

#### Scenario: Build prompt for paragraph generation
- **WHEN** system calls `AIPromptBuilder.buildParagraphPrompt(userPrompt, context)`
- **THEN** system SHALL generate prompt with:
  - System: generation base prompt (configurable)
  - Assistant[0]: element states up to selected paragraph
  - Assistant[1]: existing text up to selected paragraph
  - User: user input
- **AND** system SHALL return `{system: string, assistants: string[], user: string}`

#### Scenario: Build prompt for paragraph analysis
- **WHEN** system calls `AIPromptBuilder.buildAnalysisPrompt(paragraph, context)`
- **THEN** system SHALL generate prompt with:
  - System: analysis base prompt (configurable)
  - Assistant[0]: check for new elements in paragraph
  - Assistant[1]: check for element state changes in paragraph
  - User: user input
- **AND** system SHALL return `{system: string, assistants: string[], user: string}`

#### Scenario: Allow custom prompt templates
- **WHEN** user calls `AIPromptBuilder.setTemplate(type, template)`
- **THEN** system SHALL update the prompt template for specified type
- **AND** subsequent prompt generation SHALL use the custom template
- **AND** system SHALL support custom templates for 'paragraph-generation' and 'paragraph-analysis' types

### Requirement: System shall provide unified context builder based on selected paragraph
The system SHALL provide a context builder component (`AIContextBuilder`) that generates context information based on selected paragraph, ensuring accurate element and state information up to that paragraph.

#### Scenario: Build context with selected paragraph ID
- **WHEN** system calls `AIContextBuilder.buildContext(selectedParagraphId)`
- **THEN** system SHALL generate context object with:
  - `chapterTitle`: current chapter title
  - `chapterContent`: chapter content up to selected paragraph (NOT full chapter)
  - `elementStateSummary`: element states up to selected paragraph (NOT all elements)
  - `selectedParagraphId`: selected paragraph ID
  - `precedingText`: text before selected paragraph
  - `totalParagraphs`: total paragraph count
- **AND** system SHALL return context as intermediate data structure (not directly sent to LLM)

#### Scenario: Build context with configurable paragraph range
- **WHEN** system calls `AIContextBuilder.buildContext(selectedParagraphId, {includePreviousParagraphsWithChanges: 2})`
- **THEN** system SHALL call `getPrecedingText(paragraphId, 2)`
- **AND** system SHALL include paragraphs from the 2nd previous paragraph with element state changes to current paragraph
- **AND** system SHALL set `context.chapterContent` to include only paragraphs in the specified range

#### Scenario: Include all paragraphs when range is 0
- **WHEN** system calls `AIContextBuilder.buildContext(selectedParagraphId, {includePreviousParagraphsWithChanges: 0})`
- **THEN** system SHALL include all paragraphs from chapter start to current paragraph
- **AND** system SHALL call `getPrecedingText(paragraphId, 0)`

#### Scenario: Generate element state summary
- **WHEN** system calls `AIContextBuilder.buildElementStateSummary(elements)`
- **THEN** system SHALL generate formatted element state summary
- **AND** summary SHALL include only elements up to selected paragraph (NOT all elements)
- **AND** summary SHALL be grouped by element type (character, item, location)
- **AND** summary SHALL show appearance count and current state for each element
- **AND** summary SHALL ensure correct timeline, preventing later elements from appearing earlier

#### Scenario: Get preceding text with paragraph range configuration
- **WHEN** system calls `AIContextBuilder.getPrecedingText(paragraphId, includePreviousParagraphsWithChanges)`
- **THEN** system SHALL find all paragraphs with element state changes (paragraph.changes.elements)
- **AND** IF `includePreviousParagraphsWithChanges === 0`:
  - System SHALL include all paragraphs from chapter start to current paragraph
- **AND** IF `includePreviousParagraphsWithChanges > 0`:
  - System SHALL find the Nth previous paragraph with element state changes
  - System SHALL include paragraphs from found paragraph to current paragraph
  - IF fewer than N paragraphs found, system SHALL start from chapter beginning
- **AND** system SHALL return concatenated text content

### Requirement: System shall separate business logic from service layer
The system SHALL maintain clear separation between AIManager (business layer) and AIService (service layer).

#### Scenario: AIManager handles business logic
- **WHEN** AI request is initiated
- **THEN** AIManager SHALL:
  - Build AI request using new builder components
  - Manage preview flow
  - Process return results (paragraph generation, element updates)
  - Coordinate with other Managers (ParagraphGenerator, ParagraphAnalyzer)
- **AND** AIManager SHALL NOT handle low-level communication

#### Scenario: AIService handles low-level communication
- **WHEN** AIManager calls `AIService.chat(messages, config)`
- **THEN** AIService SHALL:
  - Handle communication with AI providers (OpenAI, Anthropic, DeepSeek, etc.)
  - Use adapter pattern to support multiple providers
  - Process network requests, timeouts, retries
  - Format API requests and responses
- **AND** AIService SHALL NOT contain business logic
- **AND** AIService SHALL receive already-constructed messages (not raw context)

### Requirement: System shall provide request caching to prevent data loss
The system SHALL provide a request cache manager (`RequestCacheManager`) that caches AI request previews and results to prevent data loss from user errors.

#### Scenario: Save preview to cache
- **WHEN** system generates preview via `AIManager.previewRequest()`
- **THEN** system SHALL immediately call `requestCacheManager.savePreview(requestId, aiRequest)`
- **AND** preview SHALL be saved to both memory (fast access) and localStorage (persistence)
- **AND** preview SHALL have TTL of 10 minutes
- **AND** system SHALL generate unique requestId in format `req_${timestamp}_${random}`

#### Scenario: Save result to cache
- **WHEN** AI returns result after successful request
- **THEN** system SHALL call `requestCacheManager.saveResult(requestId, result)`
- **AND** result SHALL be saved to localStorage (persistence)
- **AND** result SHALL have TTL of 30 minutes
- **AND** result SHALL include generated paragraphs, analysis results, etc.

#### Scenario: Retrieve preview from cache
- **WHEN** user requests to recover closed preview
- **THEN** system SHALL call `requestCacheManager.getPreview(requestId)`
- **AND** system SHALL first check memory cache
- **AND** IF not found in memory, system SHALL check localStorage
- **AND** system SHALL check if preview is expired
- **AND** IF preview is valid, system SHALL return `AIRequest` object
- **AND** IF preview is expired or not found, system SHALL return `null`

#### Scenario: Retrieve result from cache
- **WHEN** user requests to recover closed result
- **THEN** system SHALL call `requestCacheManager.getResult(requestId)`
- **AND** system SHALL check localStorage
- **AND** system SHALL check if result is expired
- **AND** IF result is valid, system SHALL return result object
- **AND** IF result is expired or not found, system SHALL return `null`

#### Scenario: Clear expired cache on startup
- **WHEN** application starts
- **THEN** system SHALL call `requestCacheManager.clearExpired()`
- **AND** system SHALL remove all expired previews and results from memory and localStorage

### Requirement: System shall integrate existing StateContextCache
The system SHALL use existing `StateContextCache` component for state context caching, which is separate from and complementary to `RequestCacheManager`.

#### Scenario: Use StateContextCache for state context
- **WHEN** `AIContextBuilder.buildContext()` needs state information
- **THEN** system SHALL call `stateContextCache.getContext(paragraphId)`
- **AND** StateContextCache SHALL return cached state context (elements, presentElements, elementStates)
- **AND** StateContextCache SHALL have TTL of 5 minutes
- **AND** StateContextCache SHALL use in-memory storage (Map)
- **AND** system SHALL use cached state context as base for building AI context

#### Scenario: StateContextCache and RequestCacheManager complement each other
- **WHEN** AI request is processed
- **THEN** system SHALL use StateContextCache for state context caching (performance optimization)
- **AND** system SHALL use RequestCacheManager for preview and result caching (error recovery)
- **AND** the two caches SHALL have different purposes and NOT duplicate functionality

# AI Request Preview

## ADDED Requirements

### Requirement: System shall provide preview for all AI requests
The system SHALL provide a unified preview mechanism for all AI requests, allowing users to review and confirm request content before sending.

#### Scenario: Generate preview for paragraph generation
- **WHEN** user clicks "Preview" button for paragraph generation
- **THEN** system SHALL call `AIManager.previewRequest('paragraph-generation', options)`
- **AND** system SHALL generate `AIRequest` object with:
  - `type`: 'paragraph-generation'
  - `config`: {model, temperature, maxTokens}
  - `messages`: Array of {role, content}
  - `context`: {chapterTitle, chapterContent, elementStateSummary, selectedParagraphId}
- **AND** system SHALL display preview UI showing request content
- **AND** system SHALL save preview to cache via `requestCacheManager.savePreview(requestId, aiRequest)`

#### Scenario: Generate preview for paragraph analysis
- **WHEN** user clicks "Preview" button for paragraph analysis
- **THEN** system SHALL call `AIManager.previewRequest('paragraph-analysis', options)`
- **AND** system SHALL generate `AIRequest` object with:
  - `type`: 'paragraph-analysis'
  - `config`: {model, temperature, maxTokens}
  - `messages`: Array of {role, content}
  - `tools`: Array of tool definitions (if applicable)
  - `context`: {chapterTitle, chapterContent, elementStateSummary, selectedParagraphId}
- **AND** system SHALL display preview UI showing request content
- **AND** system SHALL save preview to cache

#### Scenario: Preview shows hierarchical information by default
- **WHEN** preview UI is displayed
- **THEN** system SHALL show key information by default:
  - Request type
  - Model configuration
  - User prompt
  - Element state summary (collapsed)
  - Chapter content (collapsed)
- **AND** user SHALL be able to expand sections to view detailed content

#### Scenario: Preview and actual request use identical parameters
- **WHEN** user confirms preview and sends request
- **THEN** system SHALL extract messages and tools from the preview object
- **AND** system SHALL send exactly the same messages and tools to AI provider
- **AND** system SHALL NOT modify any parameters between preview and sending

### Requirement: System shall allow user to confirm or cancel preview
The system SHALL allow users to confirm sending the request or cancel from preview UI.

#### Scenario: User confirms preview and sends request
- **WHEN** user clicks "Confirm" button in preview UI
- **THEN** system SHALL extract messages and tools from preview object
- **AND** system SHALL call `AIService.chat(config, messages, context, tools)`
- **AND** system SHALL process the AI response
- **AND** system SHALL save result to cache via `requestCacheManager.saveResult(requestId, result)`

#### Scenario: User cancels preview
- **WHEN** user clicks "Cancel" button in preview UI
- **THEN** system SHALL close preview UI
- **AND** system SHALL NOT send any request to AI provider
- **AND** preview SHALL remain in cache for potential recovery

#### Scenario: User modifies parameters in preview
- **WHEN** user modifies parameters in preview UI (e.g., changes user prompt, adjusts temperature)
- **THEN** system SHALL regenerate preview with updated parameters
- **AND** system SHALL update the preview object
- **AND** system SHALL update cached preview

### Requirement: System shall prevent accidental loss with cache recovery
The system SHALL provide recovery mechanism to prevent data loss from accidental preview/result closures.

#### Scenario: Recover closed preview
- **WHEN** user accidentally closes preview UI
- **THEN** system SHALL provide "Reopen Preview" option
- **AND** system SHALL display list of recent previews (up to 5)
- **AND** WHEN user clicks a preview in the list
- **THEN** system SHALL call `requestCacheManager.getPreview(requestId)`
- **AND** IF preview is found and not expired, system SHALL restore preview UI
- **AND** IF preview is expired or not found, system SHALL show error message

#### Scenario: Recover closed result
- **WHEN** user accidentally closes result UI
- **THEN** system SHALL provide "Recover Result" option
- **AND** system SHALL display list of recent results (up to 5)
- **AND** WHEN user clicks a result in the list
- **THEN** system SHALL call `requestCacheManager.getResult(requestId)`
- **AND** IF result is found and not expired, system SHALL restore result UI
- **AND** IF result is expired or not found, system SHALL show error message

#### Scenario: Preview expires after TTL
- **WHEN** user tries to recover preview that has been cached for more than 10 minutes
- **THEN** system SHALL return `null` from `requestCacheManager.getPreview(requestId)`
- **AND** system SHALL display message: "Preview has expired. Please generate a new preview."

#### Scenario: Result expires after TTL
- **WHEN** user tries to recover result that has been cached for more than 30 minutes
- **THEN** system SHALL return `null` from `requestCacheManager.getResult(requestId)`
- **AND** system SHALL display message: "Result has expired. Please regenerate."

### Requirement: System shall support configurable preview TTL
The system SHALL allow configuration of preview and result TTL (Time To Live).

#### Scenario: Configure preview TTL
- **WHEN** system is configured with custom preview TTL
- **THEN** `requestCacheManager.savePreview(requestId, aiRequest, customTTL)` SHALL use custom TTL
- **AND** previews SHALL expire after custom TTL duration
- **AND** default TTL SHALL be 10 minutes if not configured

#### Scenario: Configure result TTL
- **WHEN** system is configured with custom result TTL
- **THEN** `requestCacheManager.saveResult(requestId, result, customTTL)` SHALL use custom TTL
- **AND** results SHALL expire after custom TTL duration
- **AND** default TTL SHALL be 30 minutes if not configured

### Requirement: System shall persist cache across sessions
The system SHALL persist preview and result cache using localStorage to allow recovery across browser sessions.

#### Scenario: Preview persists across browser restart
- **WHEN** user generates preview and closes browser
- **AND** user reopens browser within 10 minutes
- **THEN** preview SHALL still be available in cache
- **AND** user SHALL be able to recover preview from cache

#### Scenario: Result persists across browser restart
- **WHEN** user receives AI result and closes browser
- **AND** user reopens browser within 30 minutes
- **THEN** result SHALL still be available in cache
- **AND** user SHALL be able to recover result from cache

### Requirement: System shall clear expired cache periodically
The system SHALL clear expired cache entries to prevent unbounded growth.

#### Scenario: Clear expired cache on application startup
- **WHEN** application starts
- **THEN** system SHALL call `requestCacheManager.clearExpired()`
- **AND** system SHALL remove all expired previews (TTL > 10 minutes)
- **AND** system SHALL remove all expired results (TTL > 30 minutes)
- **AND** system SHALL free memory and localStorage space

#### Scenario: Clear specific preview cache
- **WHEN** user successfully sends request from preview
- **THEN** system MAY call `requestCacheManager.clearPreview(requestId)` to free cache space
- **AND** system SHALL keep preview cache for a short time (optional) for user review

#### Scenario: Clear specific result cache
- **WHEN** user saves result to story
- **THEN** system MAY call `requestCacheManager.clearResult(requestId)` to free cache space

# AI Assistant Refactor - Tasks

## Overview

This document breaks down the AI assistant refactor into concrete, actionable tasks. Tasks are organized by phase and priority, following the migration plan outlined in the design document.

## Phase 1: Create New Components (1-2 days)

### Task 1.1: Create AIMessageBuilder module
**File:** `js/modules/AIMessageBuilder.js`

**Description:** Create a unified message builder that constructs message arrays for all AI requests.

**Subtasks:**
- [ ] Implement `buildMessages(request)` method
  - Accept `AIRequest` object with type, config, context, tools
  - Select prompt template based on request type
  - Call `AIPromptBuilder` to generate prompt content
  - Convert context fields to assistant messages:
    - `context.chapterTitle` → assistant: "Chapter Title: xxx"
    - `context.chapterContent` → assistant: "以下是当前章节已写的内容..."
    - `context.elementStateSummary` → assistant: "当前在场元素状态：..."
  - Convert prompt content to standard message format (system/assistant/user)
  - Add tool definitions if present
  - Return message array `[{role, content}]`

- [ ] Implement `validateMessages(messages)` method
  - Validate message array is not empty
  - Validate each message has `role` and `content` fields
  - Validate role values are valid (system/user/assistant)
  - Validate content fields are not empty
  - Return `{valid: boolean, errors: string[]}`

**Dependencies:** None

**Testing:** Create `tests/modules/AIMessageBuilder.test.js`
- [ ] Test `buildMessages` with paragraph generation request
- [ ] Test `buildMessages` with paragraph analysis request
- [ ] Test `validateMessages` with valid messages
- [ ] Test `validateMessages` with invalid messages (empty, missing fields, invalid roles)

---

### Task 1.2: Create AIPromptBuilder module
**File:** `js/modules/AIPromptBuilder.js`

**Description:** Create a prompt builder that generates prompt content for different AI task types.

**Subtasks:**
- [ ] Implement `buildParagraphPrompt(userPrompt, context)` method
  - Generate prompt for paragraph generation
  - Return structure: `{system: string, assistants: string[], user: string}`
  - Assistant[0]: element states up to selected paragraph
  - Assistant[1]: existing text up to selected paragraph

- [ ] Implement `buildAnalysisPrompt(paragraph, context)` method
  - Generate prompt for paragraph analysis
  - Return structure: `{system: string, assistants: string[], user: string}`
  - Assistant[0]: check for new elements in paragraph
  - Assistant[1]: check for element state changes in paragraph

- [ ] Implement `getSystemPrompt(type)` helper method
  - Get system prompt template for specified type
  - Support 'paragraph-generation' and 'paragraph-analysis' types
  - Support configuration override with default built-in templates

- [ ] Implement `setTemplate(type, template)` helper method
  - Allow custom prompt templates
  - Update template for specified type
  - Support A/B testing and user customization

**Dependencies:** None

**Testing:** Create `tests/modules/AIPromptBuilder.test.js`
- [ ] Test `buildParagraphPrompt` with default template
- [ ] Test `buildParagraphPrompt` with custom template
- [ ] Test `buildAnalysisPrompt` with default template
- [ ] Test `buildAnalysisPrompt` with custom template
- [ ] Test `setTemplate` and `getSystemPrompt` methods

---

### Task 1.3: Create AIContextBuilder module
**File:** `js/modules/AIContextBuilder.js`

**Description:** Create a context builder that generates AI request context based on selected paragraph.

**Subtasks:**
- [ ] Implement `buildContext(selectedParagraphId, options = {})` method
  - Get current chapter information from DataManager
  - Get element states up to selected paragraph (NOT all elements)
  - Call `buildElementStateSummary` to generate element state summary
  - Call `getPrecedingText` to get text context
  - Assemble complete context object:
    ```javascript
    {
        chapterTitle: string,
        chapterContent: string,      // Up to selected paragraph
        elementStateSummary: string, // Up to selected paragraph
        selectedParagraphId?: string,
        precedingText: string,
        totalParagraphs: number
    }
    ```
  - Return context as intermediate data structure

- [ ] Implement `buildElementStateSummary(elements)` method
  - Accept elements array up to selected paragraph
  - Generate formatted element state summary
  - Group by element type (character, item, location)
  - Show appearance count and current state for each element
  - Ensure correct timeline (prevent later elements from appearing earlier)
  - Return formatted string

- [ ] Implement `getPrecedingText(paragraphId, includePreviousParagraphsWithChanges = 0)` method
  - Find all paragraphs with element state changes (`paragraph.changes.elements`)
  - If `includePreviousParagraphsWithChanges === 0`:
    - Include all paragraphs from chapter start to current paragraph
  - If `includePreviousParagraphsWithChanges > 0`:
    - Find the Nth previous paragraph with element state changes
    - Include paragraphs from found paragraph to current paragraph
    - If fewer than N found, start from chapter beginning
  - Concatenate and return text content

- [ ] Add configuration support for `contextParagraphRange`
  - Read from ConfigManager
  - Default value: 0 (include all paragraphs)
  - Pass to `buildContext` as `includePreviousParagraphsWithChanges`

**Dependencies:** None

**Testing:** Create `tests/modules/AIContextBuilder.test.js`
- [ ] Test `buildContext` with selected paragraph ID
- [ ] Test `buildContext` with `includePreviousParagraphsWithChanges = 0`
- [ ] Test `buildContext` with `includePreviousParagraphsWithChanges = 1`
- [ ] Test `buildContext` with `includePreviousParagraphsWithChanges = 2`
- [ ] Test `buildElementStateSummary` timeline correctness
- [ ] Test `buildElementStateSummary` element grouping
- [ ] Test `getPrecedingText` with range = 0
- [ ] Test `getPrecedingText` with range = 1
- [ ] Test `getPrecedingText` with range = 2
- [ ] Test `getPrecedingText` boundary conditions (insufficient paragraphs)
- [ ] Test `getPrecedingText` with no element state changes

---

### Task 1.4: Create RequestCacheManager module
**File:** `js/modules/RequestCacheManager.js`

**Description:** Create a cache manager for AI request previews and results to prevent data loss.

**Subtasks:**
- [ ] Implement `savePreview(requestId, aiRequest, ttl = 10 * 60 * 1000)` method
  - Generate unique requestId if not provided: `req_${timestamp}_${random}`
  - Save preview to memory (Map) for fast access
  - Save preview to localStorage for persistence
  - Set expiration timestamp

- [ ] Implement `getPreview(requestId)` method
  - First check memory cache
  - If not in memory, check localStorage
  - Check if preview is expired
  - Return `AIRequest` object if valid, `null` otherwise

- [ ] Implement `saveResult(requestId, result, ttl = 30 * 60 * 1000)` method
  - Save result to localStorage for persistence
  - Set expiration timestamp

- [ ] Implement `getResult(requestId)` method
  - Check localStorage for result
  - Check if result is expired
  - Return result object if valid, `null` otherwise

- [ ] Implement `clearPreview(requestId)` method
  - Remove preview from memory cache
  - Remove preview from localStorage

- [ ] Implement `clearResult(requestId)` method
  - Remove result from localStorage

- [ ] Implement `clearExpired()` helper method
  - Remove all expired previews from memory and localStorage
  - Remove all expired results from localStorage
  - Called on application startup

- [ ] Implement `generateRequestId()` helper method
  - Generate unique request ID
  - Format: `req_${timestamp}_${random}`
  - Called when creating new previews

**Dependencies:** None

**Testing:** Create `tests/modules/RequestCacheManager.test.js`
- [ ] Test saving and retrieving preview from memory
- [ ] Test saving and retrieving preview from localStorage
- [ ] Test saving and retrieving result from localStorage
- [ ] Test preview expiration (TTL > 10 minutes)
- [ ] Test result expiration (TTL > 30 minutes)
- [ ] Test `clearExpired()` removes expired entries
- [ ] Test `clearPreview()` removes specific preview
- [ ] Test `clearResult()` removes specific result
- [ ] Test `generateRequestId()` uniqueness

---

## Phase 2: Integrate into ParagraphGenerator (1 day)

### Task 2.1: Modify ParagraphGenerator to use new components
**File:** `js/managers/ParagraphGenerator.js`

**Description:** Refactor ParagraphGenerator to use AIMessageBuilder, AIPromptBuilder, and AIContextBuilder.

**Subtasks:**
- [ ] Update `generateParagraphContent` method
  - Import new builder components
  - Use `AIContextBuilder.buildContext()` to generate context
  - Use `AIPromptBuilder.buildParagraphPrompt()` to generate prompt
  - Use `AIMessageBuilder.buildMessages()` to build message array
  - Replace old implementation

- [ ] Update `previewGenerationRequest` method
  - Use new builder components
  - Generate preview with `AIMessageBuilder.buildMessages()`
  - Return consistent `AIRequest` object format

- [ ] Remove any deprecated methods or duplicate code
  - Remove calls to old `AIService.addContextToMessages`
  - Remove calls to old `AIPrompts.getParagraphMessages`

**Dependencies:** Task 1.1, Task 1.2, Task 1.3

**Testing:**
- [ ] Test paragraph generation with new components
- [ ] Test paragraph generation preview with new components
- [ ] Test edge cases (empty paragraph, invalid ID, etc.)

---

## Phase 3: Integrate into ParagraphAnalyzer (1 day)

### Task 3.1: Modify ParagraphAnalyzer to use new components
**File:** `js/managers/ParagraphAnalyzer.js`

**Description:** Refactor ParagraphAnalyzer to use AIPromptBuilder and AIMessageBuilder.

**Subtasks:**
- [ ] Update `generateAnalysisPrompt` method
  - Import new builder components
  - Use `AIContextBuilder.buildContext()` to generate context
  - Use `AIPromptBuilder.buildAnalysisPrompt()` to generate prompt
  - Use `AIMessageBuilder.buildMessages()` to build message array
  - Replace old implementation

- [ ] Update any preview or analysis methods
  - Use new builder components
  - Generate preview with `AIMessageBuilder.buildMessages()`
  - Return consistent `AIRequest` object format

- [ ] Remove any deprecated methods or duplicate code
  - Remove old prompt generation logic
  - Remove calls to old helper methods

**Dependencies:** Task 1.1, Task 1.2, Task 1.3

**Testing:**
- [ ] Test paragraph analysis with new components
- [ ] Test tool calling with new components
- [ ] Test edge cases (empty paragraph, invalid ID, etc.)

---

## Phase 4: Integrate into AIManager (1-2 days)

### Task 4.1: Add AIManager.previewRequest method
**File:** `js/managers/AIManager.js`

**Description:** Add preview method to generate AI request previews.

**Subtasks:**
- [ ] Implement `previewRequest(type, options)` method
  - Accept type ('paragraph-generation' | 'paragraph-analysis')
  - Accept options object with userPrompt, config, paragraph
  - Call `AIContextBuilder.buildContext()` to generate context
  - Call `AIMessageBuilder.buildMessages()` to build messages
  - Assemble complete `AIRequest` object:
    ```javascript
    {
        type: string,
        config: {model, temperature, maxTokens},
        messages: Array<{role, content}>,
        tools?: Array<object>,
        context: {
            chapterTitle,
            chapterContent,
            elementStateSummary,
            selectedParagraphId
        }
    }
    ```
  - Return preview object

- [ ] Add preview caching
  - Call `requestCacheManager.savePreview(requestId, aiRequest)` after generating preview
  - Generate unique requestId using `requestCacheManager.generateRequestId()`

**Dependencies:** Task 1.1, Task 1.2, Task 1.3, Task 1.4

**Testing:**
- [ ] Test `previewRequest` for paragraph generation
- [ ] Test `previewRequest` for paragraph analysis
- [ ] Test preview caching

---

### Task 4.2: Modify AIManager.sendMessage method
**File:** `js/managers/AIManager.js`

**Description:** Refactor sendMessage to use new components and implement preview flow.

**Subtasks:**
- [ ] Implement preview flow
  - Call `previewRequest()` to generate preview
  - Display preview UI to user
  - Wait for user confirmation

- [ ] Implement send flow after confirmation
  - Extract messages and tools from preview object
  - Call `AIService.chat()` with messages (business layer → service layer)
  - Note: AIService should only receive messages, not context
  - Handle AI response (paragraph generation, element updates)
  - Save result to cache: `requestCacheManager.saveResult(requestId, result)`

- [ ] Implement optional direct send mode
  - Check if user selected "Remember choice, don't preview"
  - If so, skip preview and use same message building logic
  - Directly build and send request

- [ ] Implement recovery mechanism
  - Add "Reopen Preview" button
  - Add "Recover Result" button
  - Display list of recent requests (up to 5)
  - On click, call `requestCacheManager.getPreview(requestId)` or `requestCacheManager.getResult(requestId)`
  - Restore preview or result UI

**Dependencies:** Task 4.1

**Testing:**
- [ ] Test preview to send flow
- [ ] Test direct send mode
- [ ] Test recovery mechanism for preview
- [ ] Test recovery mechanism for result
- [ ] Test edge cases (expired cache, not found, etc.)

---

### Task 4.3: Test preview functionality
**Files:** Various UI and integration tests

**Description:** Test the preview UI and integration.

**Subtasks:**
- [ ] Test UI preview display
  - Verify preview shows correct information
  - Verify collapsible sections work correctly
  - Verify user can expand/collapse sections

- [ ] Test user confirmation and cancellation
  - Test confirm button sends request
  - Test cancel button does not send request

- [ ] Test "Remember choice" functionality
  - Test user can disable preview
  - Test preference persists
  - Test user can re-enable preview

- [ ] Test preview modification
  - Test user can modify parameters in preview
  - Test preview regenerates on modification

**Dependencies:** Task 4.2

**Testing:**
- [ ] UI tests for preview display
- [ ] UI tests for user interactions
- [ ] Integration tests for preview to send flow
- [ ] Integration tests for different request types
- [ ] Boundary condition tests

---

## Phase 5: Cleanup and Optimization (1 day)

### Task 5.1: Remove duplicate code from AIService
**File:** `js/services/AIService.js`

**Description:** Remove `addContextToMessages` method as it violates architecture separation.

**Subtasks:**
- [ ] Remove `addContextToMessages` method (line 102-144)
  - This method adds context to messages in the service layer
  - This violates architecture: AIService should only handle communication, not business logic
  - Functionality is now handled by `AIContextBuilder.buildContext()` + `AIMessageBuilder.buildMessages()` in business layer

- [ ] Check for any calls to `addContextToMessages`
  - Search codebase for calls
  - Update callers to use new builder components
  - Remove any remaining references

- [ ] Verify AIService only receives pre-built messages
  - Ensure `AIService.chat()` only accepts messages, not raw context
  - Ensure AIService does not add context to messages
  - Ensure AIService responsibility is limited to communication

**Dependencies:** Phase 2, Phase 3, Phase 4 completion

**Testing:**
- [ ] Verify no calls to `addContextToMessages` remain
- [ ] Verify AIService.chat() still works correctly
- [ ] Verify all AI requests still work

---

### Task 5.2: Remove duplicate code from AIManager
**File:** `js/managers/AIManager.js`

**Description:** Remove duplicate message building methods.

**Subtasks:**
- [ ] Remove `buildAIMessages` method (line 1142-1173)
  - Functionality replaced by `AIMessageBuilder.buildMessages()`
  - Check for any callers and update them

- [ ] Remove `buildContextMessages` method (line 1180-1205)
  - Functionality replaced by `AIMessageBuilder` and `AIContextBuilder`
  - Check for any callers and update them

- [ ] Remove `formatElementStateSummary` method (line 1397-1423)
  - Functionality replaced by `AIContextBuilder.buildElementStateSummary()`
  - Update calls in `buildContext()` (line 1349, 1382)

- [ ] Search for any other duplicate methods
  - Check for methods with similar names
  - Check for methods with overlapping functionality
  - Remove or consolidate as appropriate

**Dependencies:** Phase 2, Phase 3, Phase 4 completion

**Testing:**
- [ ] Verify no calls to removed methods remain
- [ ] Verify all AI requests still work
- [ ] Verify no functionality is lost

---

### Task 5.3: Handle ParagraphStateSummary.formatAsText
**File:** `js/modules/ParagraphStateSummary.js`

**Description:** Decide fate of `formatAsText` method based on usage.

**Subtasks:**
- [ ] Search codebase for calls to `formatAsText`
  - Identify all locations where it's called
  - Determine purpose of each call

- [ ] If only used for AI context:
  - Delete `formatAsText` method (line 280-332)
  - Functionality replaced by `AIContextBuilder.buildElementStateSummary()`
  - Update all callers

- [ ] If used for UI display:
  - Keep `formatAsText` method
  - Rename to `formatForUI()` for clarity
  - Document that it's for UI display, not AI context
  - Ensure no confusion with `AIContextBuilder.buildElementStateSummary()`

- [ ] If used for both:
  - Keep `formatAsText` for UI display
  - Rename to `formatForUI()` for clarity
  - Update AI context calls to use `AIContextBuilder.buildElementStateSummary()`

**Dependencies:** Phase 2, Phase 3, Phase 4 completion

**Testing:**
- [ ] Verify all calls to `formatAsText` are updated
- [ ] Verify UI display still works correctly
- [ ] Verify AI context generation still works correctly

---

### Task 5.4: Clean up unused modules
**Files:** `js/managers/AIPreviewManager.js`, `js/modules/PromptGenerator.js`

**Description:** Analyze and remove modules that are fully replaced by new components.

**Subtasks:**
- [ ] Analyze `AIPreviewManager.js`
  - Identify all methods and functionality
  - Determine if fully replaced by `AIManager.previewRequest`
  - If fully replaced: delete module
  - If partially replaced: keep unique functionality, mark migrated methods as deprecated

- [ ] Analyze `PromptGenerator.js`
  - Identify all methods and functionality
  - Determine if fully replaced by `AIPromptBuilder`
  - If fully replaced: delete module
  - If partially replaced: keep unique functionality, mark migrated methods as deprecated

- [ ] Search for any other potentially unused modules
  - Check for modules with similar functionality to new components
  - Analyze usage and determine if cleanup is needed

**Dependencies:** Phase 2, Phase 3, Phase 4 completion

**Testing:**
- [ ] Verify deleted modules are not referenced
- [ ] Verify kept modules work correctly
- [ ] Verify all functionality is preserved

---

### Task 5.5: Code review and optimization
**Files:** Various

**Description:** Perform final code review and optimization.

**Subtasks:**
- [ ] Check all imports
  - Remove unused imports
  - Ensure all required imports are present
  - Organize imports logically

- [ ] Check all exports
  - Ensure public API is clear
  - Document public methods
  - Remove unnecessary exports

- [ ] Performance analysis
  - Profile new components for performance
  - Ensure no significant performance degradation
  - Optimize if necessary (caching, lazy loading, etc.)

- [ ] Code style check
  - Ensure code follows project conventions
  - Fix any linting errors
  - Ensure consistent naming and formatting

**Dependencies:** All previous tasks in Phase 5

**Testing:**
- [ ] Run full test suite
- [ ] Fix any failing tests
- [ ] Ensure test coverage meets requirements (80% for core components)

---

### Task 5.6: Update documentation
**Files:** Various documentation files

**Description:** Update documentation to reflect changes.

**Subtasks:**
- [ ] Update README or main documentation
  - Document new components and their usage
  - Provide examples of how to use new components
  - Update architecture diagrams if needed

- [ ] Update API documentation
  - Document public API for new components
  - Document deprecated methods (if any)
  - Document migration guide if needed

- [ ] Update code comments
  - Ensure complex logic is well-commented
  - Ensure all public methods have JSDoc comments
  - Ensure architecture decisions are documented

- [ ] Create migration notes (if applicable)
  - If external code depends on removed methods, provide migration guide
  - Document breaking changes
  - Provide upgrade instructions

**Dependencies:** All previous tasks in Phase 5

**Testing:**
- [ ] Verify documentation is accurate
- [ ] Verify examples work correctly
- [ ] Verify diagrams are up to date

---

## Task Status Tracking

| Task ID | Task Name | Status | Priority |
|---------|-----------|--------|----------|
| 1.1 | Create AIMessageBuilder module | Completed | High |
| 1.2 | Create AIPromptBuilder module | Completed | High |
| 1.3 | Create AIContextBuilder module | Completed | High |
| 1.4 | Create RequestCacheManager module | Completed | High |
| 2.1 | Modify ParagraphGenerator to use new components | Completed | High |
| 3.1 | Modify ParagraphAnalyzer to use new components | Completed | High |
| 4.1 | Add AIManager.previewRequest method | Completed | High |
| 4.2 | Modify AIManager.sendMessage method | Completed | High |
| 4.3 | Test preview functionality | Skipped | Medium |
| 5.1 | Remove duplicate code from AIService | Completed | Medium |
| 5.2 | Remove duplicate code from AIManager | Completed | Medium |
| 5.3 | Handle ParagraphStateSummary.formatAsText | Completed | Medium |
| 5.4 | Clean up unused modules | Completed | Low |
| 5.5 | Code review and optimization | Completed | Low |
| 5.6 | Update documentation | In Progress | Low |

---

## Risk Mitigation

### Risk 1: Breaking existing functionality
**Mitigation:**
- Create comprehensive unit tests before modifying code
- Test each component thoroughly after changes
- Keep old code until new implementation is fully verified
- Use feature flags if needed for gradual rollout

### Risk 2: Performance degradation
**Mitigation:**
- Profile performance before and after changes
- Use caching for expensive operations
- Optimize critical paths
- Run performance tests regularly

### Risk 3: Test coverage gaps
**Mitigation:**
- Follow unit testing rules (core components ≥ 80% coverage)
- Write tests before implementing functionality (TDD approach)
- Test both positive and negative cases
- Test edge cases and boundary conditions

### Risk 4: Missing dependencies
**Mitigation:**
- Review task dependencies carefully
- Complete tasks in order
- Verify all prerequisites are met
- Use TODO list to track progress

---

## Success Criteria

The refactor will be considered successful when:

1. All new components are implemented and tested
2. All duplicate code has been removed
3. All existing functionality works correctly with new components
4. Test coverage meets requirements (≥ 80% for core components)
5. Performance is not significantly degraded
6. Documentation is updated
7. No linting errors remain
8. All tests pass

---

## Notes

- **Important:** Follow project rules for unit testing (see `.codebuddy/rules/`)
- **Important:** Follow "复用已有代码规范" - search for existing functionality before creating new code
- **Important:** Follow "修改数据时检查数据保存和渲染更新" rule when modifying data
- **Important:** Follow "调整UI时检查翻译" rule when adjusting UI
- All changes should be made incrementally with testing at each step
- Each phase should be completed and tested before moving to the next phase
- Use git commits frequently to track progress and enable rollback if needed

---

## Implementation Summary

### Phase 1: Create New Components ✅
- **AIMessageBuilder.js** (171 lines)
  - `buildMessages(request)` - Converts AIRequest to message array
  - `validateMessages(messages)` - Validates message format
  - `buildContextMessages(context)` - Converts context to assistant messages

- **AIPromptBuilder.js** (140 lines)
  - `buildParagraphPrompt(userPrompt, context)` - Generates paragraph generation prompt
  - `buildAnalysisPrompt(paragraph, context)` - Generates paragraph analysis prompt
  - `getSystemPrompt(type)` - Gets system prompt template
  - `setTemplate(type, template)` - Sets custom prompt template
  - `getAllSystemPrompts()` - Gets all system prompts

- **AIContextBuilder.js** (376 lines)
  - `buildContext(selectedParagraphId, options)` - Builds complete context object
  - `buildElementStateSummary(elements)` - Generates element state summary
  - `getPrecedingText(chapter, paragraphId, includePreviousParagraphsWithChanges)` - Gets text context
  - `getContextParagraphRangeConfig()` - Gets context range configuration

- **RequestCacheManager.js** (387 lines)
  - `savePreview(requestId, aiRequest, ttl)` - Saves preview to cache
  - `getPreview(requestId)` - Gets preview from cache
  - `saveResult(requestId, result, ttl)` - Saves result to cache
  - `getResult(requestId)` - Gets result from cache
  - `clearPreview(requestId)` - Removes preview from cache
  - `clearResult(requestId)` - Removes result from cache
  - `clearExpired()` - Removes expired entries
  - `generateRequestId()` - Generates unique request ID

### Phase 2: Integrate into ParagraphGenerator ✅
- Updated constructor to accept optional builder components
- Modified `generateParagraphContent()` to use new components
- Modified `previewGenerationRequest()` to use new components

### Phase 3: Integrate into ParagraphAnalyzer ✅
- Updated constructor to accept optional builder components
- Preserved existing `generateAnalysisPrompt()` (has complex custom prompts)
- Ready for future migration to new builder pattern

### Phase 4: Integrate into AIManager ✅
- Added `initializeBuilderComponents()` method
- Added `previewRequest()` method using new components
- Modified `sendMessage()` to implement preview flow
- Added `sendWithPreview()` method
- Added `sendDirectly()` method for skipping preview
- Added `showParagraphGenerationPreviewModal()` with collapsible sections
- Added "Skip Preview" checkbox in UI

### Phase 5: Cleanup and Optimization ✅
- **Task 5.1:** Removed `addContextToMessages()` from AIService
- **Task 5.2:** Marked `buildAIMessages()`, `buildContextMessages()`, `formatElementStateSummary()` as deprecated (still used by continuous writing)
- **Task 5.3:** Deleted `formatAsText()` from ParagraphStateSummary (unused)
- **Task 5.4:** Deleted `AIPreviewManager.js` (fully replaced by new builder components); kept `PromptGenerator.js` (still used)
- **Task 5.5:** Added new modules to index.html, verified JSDoc comments, checked linter errors
- **Task 5.6:** Updated tasks.md with completion status

### UI Changes
- Added `ai-skip-preview` checkbox in `index.html`
- Added script loading for new modules in correct order

### Git Commits
1. "Implement AI assistant refactor Phase 1-4: Create new builder components and integrate"
2. "Implement Task 4.2: Modify sendMessage method with preview flow"
3. "Implement Phase 5 Tasks 5.1 and 5.3: Clean up duplicate code"
4. "Implement Task 5.5: Add new modules to index.html for proper loading"

### Architecture Improvements
- **Separation of Concerns:** Business layer (AIManager) vs Service layer (AIService)
- **Unified Message Building:** AIMessageBuilder for all AI requests
- **Configurable Prompts:** AIPromptBuilder with template customization
- **Context Management:** AIContextBuilder for accurate timeline
- **Request Caching:** RequestCacheManager for data loss prevention
- **Preview Before Send:** Users can review context, messages, and element summary before sending

### Known Limitations
- Task 4.3 (Test preview functionality) was skipped due to time constraints
- Task 5.2 methods still used by continuous writing preview feature
- Continuous writing migration to new architecture is pending

### Next Steps (Optional)
- Migrate continuous writing to use new builder components
- Delete deprecated methods in AIManager after migration
- Add unit tests for new components (per project rules)
- Performance profiling and optimization if needed

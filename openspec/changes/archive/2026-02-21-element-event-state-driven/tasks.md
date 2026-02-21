# Element/Event/State Driven Architecture - Implementation Tasks

## 1. Data Model Setup

- [ ] 1.1 Create StoryElement base class (`js/models/StoryElement.js`)
  - Define base fields: id, type, name, description, keywords, location, stateHistory
  - Implement Element type enum: 'character', 'item', 'location', 'memory', 'base'

- [ ] 1.2 Create element subclasses (`js/models/elements/`)
  - Create CharacterElement extending StoryElement
  - Create ItemElement extending StoryElement
  - Create LocationElement extending StoryElement
  - Create MemoryElement extending StoryElement
  - Create BaseSettingElement extending StoryElement

- [ ] 1.3 Define StateChange interface (`js/models/StateChange.js`)
  - Define paragraphId, timestamp, changes fields
  - Define change types: location, description, owner, status, keywords

- [ ] 1.4 Define StoryTimestamp interface (`js/models/StoryTimestamp.js`)
  - Define chapterId, sequence fields
  - Define optional fields: absoluteTime, relativeTime
  - Define narrativeType enum: 'linear', 'flashback', 'flashforward', 'parallel'
  - Define referenceParagraphId and timeOffset for time offset calculation

- [ ] 1.5 Extend Paragraph model with storyTimestamp
  - Add storyTimestamp field to Paragraph interface
  - Set default narrativeType to 'linear'
  - Initialize with chapterId and sequence from paragraph position

## 2. Element Management Implementation

- [ ] 2.1 Create ElementManager class (`js/managers/ElementManager.js`)
  - Implement addElement() with ID generation
  - Implement updateElement()
  - Implement deleteElement()
  - Implement getElement() and listElements()

- [ ] 2.2 Implement keyword management in ElementManager
  - Implement addKeyword() with default keywords on creation
  - Implement removeKeyword()
  - Implement queryByKeywords()

- [ ] 2.3 Implement state history management
  - Implement recordStateChange() for tracking changes
  - Implement getElementStateAt() for historical queries
  - Implement getElementCurrentState()

- [ ] 2.4 Write unit tests for ElementManager (`tests/managers/ElementManager.test.js`)
  - Test CRUD operations
  - Test keyword management
  - Test state history recording and querying

## 3. State Timeline Implementation

- [ ] 3.1 Create StateTimeline class (`js/managers/StateTimeline.js`)
  - Initialize with elements array
  - Implement indexChanges() for paragraph-level indexing
  - Implement changesByParagraph Map structure
  - Implement timestampIndex Map for story time queries

- [ ] 3.2 Implement basic state query methods
  - Implement getStateAt(paragraphId, elementId)
  - Implement getParagraphChanges(paragraphId)
  - Implement getCurrentContext(paragraphId)

- [ ] 3.3 Implement time travel query methods
  - Implement getElementStateAt(paragraphId, elementId) for historical states
  - Implement getElementStateTrajectory(elementId) for full state trajectory
  - Implement getElementStateHistory(elementId) for change history
  - Implement getCurrentContext(paragraphId) for historical contexts

- [ ] 3.4 Implement narrative-type aware state queries
  - Implement getNarrativeContext(paragraphId) with narrative type support
  - Handle flashback type (use historical state)
  - Handle flashforward type (use future state)
  - Handle parallel type (use absoluteTime)

- [ ] 3.5 Implement story timestamp indexing
  - Implement indexParagraphTimestamp(paragraphId, timestamp)
  - Implement findParagraphByTime(storyTime) for time-based lookup
  - Implement applyTimeOffset(anchorParagraph, storyTime) for time offset calculation

- [ ] 3.6 Implement state calculation logic
  - Implement filtering stateHistory before paragraphId
  - Implement applying changes chronologically
  - Handle empty history and partial history cases
  - Apply time offset calculations for non-linear narratives

- [ ] 3.7 Write unit tests for StateTimeline (`tests/managers/StateTimeline.test.js`)
  - Test state indexing
  - Test single element state queries
  - Test paragraph change queries
  - Test current context generation
  - Test time travel queries (historical states)
  - Test element state trajectory
  - Test narrative-type aware queries
  - Test story timestamp indexing
  - Test time offset calculations

## 4. Story View Management Implementation

- [ ] 4.1 Create StoryViewManager class (`js/managers/StoryViewManager.js`)
  - Initialize with null currentView
  - Implement setViewLocation() with validation
  - Implement getCurrentView()

- [ ] 4.2 Implement presence detection logic
  - Implement isElementPresent() with all rules:
    - Base settings always present
    - Elements at current view location
    - Forgotten elements with recall events
    - Memories with trigger events

- [ ] 4.3 Implement event detection helpers
  - Implement hasRecallEvent(paragraphId, elementId)
  - Implement hasTriggerEvent(paragraphId, elementId)

- [ ] 4.4 Implement present elements query
  - Implement getPresentElements(paragraphId)
  - Implement getPresentElementsByType(paragraphId, type)

- [ ] 4.5 Write unit tests for StoryViewManager (`tests/managers/StoryViewManager.test.js`)
  - Test view location management
  - Test presence detection for all rules
  - Test recall and trigger event detection
  - Test present elements queries

## 5. State Context Cache Implementation

- [ ] 5.1 Create StateContextCache class (`js/managers/StateContextCache.js`)
  - Initialize with StateTimeline and StoryViewManager
  - Implement cache as Map<chapterId, StoryContext>

- [ ] 5.2 Implement context calculation with caching
  - Implement getContext() with cache lookup
  - Implement calculateContext() for on-demand calculation

- [ ] 5.3 Implement context calculation logic (pure rules)
  - Retrieve chapter paragraphs
  - Get present elements for each paragraph
  - Build StoryContext with element states
  - Include chapter info, view location, present elements

- [ ] 5.4 Implement cache invalidation
  - Implement invalidate(chapterId)
  - Implement invalidateElement(elementId)
  - Implement clearCache()

- [ ] 5.5 Implement AI formatting methods
  - Implement formatContextForAI()
  - Implement formatMinimalContext() with options
  - Implement formatParagraphContext()

- [ ] 5.6 Write unit tests for StateContextCache (`tests/managers/StateContextCache.test.js`)
  - Test context caching
  - Test context calculation
  - Test cache invalidation
  - Test AI formatting

## 6. Story Timestamp and Narrative Management

- [ ] 6.1 Implement StoryTimestamp model (`js/models/StoryTimestamp.js`)
  - Create StoryTimestamp interface with all required fields
  - Add validation for narrativeType values
  - Add validation for timeOffset ranges

- [ ] 6.2 Implement story timestamp indexing in StateTimeline
  - Add indexParagraphTimestamp(paragraphId, timestamp) method
  - Create timestampIndex Map for fast lookup
  - Index by chapterId, sequence, and narrativeType

- [ ] 6.3 Implement time-based paragraph lookup
  - Implement findParagraphByTime(storyTime) method
  - Search by absoluteTime
  - Search by referenceParagraphId and timeOffset combination
  - Handle multiple matches (return first or all)

- [ ] 6.4 Implement time offset calculation
  - Implement applyTimeOffset(anchorParagraph, storyTime) method
  - Calculate effective time based on positive/negative offset
  - Handle offset application across chapter boundaries
  - Return new StoryTimestamp with calculated time

- [ ] 6.5 Implement narrative-type aware state queries
  - Implement getNarrativeContext(paragraphId) method
  - Detect narrativeType from paragraph.storyTimestamp
  - Route to appropriate query method based on type:
    - linear: use getCurrentContext()
    - flashback: use historical state via timeOffset
    - flashforward: use future state via timeOffset
    - parallel: use absoluteTime for context

- [ ] 6.6 Implement time travel query methods
  - Implement getElementStateAt(paragraphId, elementId) for historical queries
  - Implement getElementStateTrajectory(elementId) for full trajectory
  - Implement getElementStateHistory(elementId) for change history
  - Ensure all methods are read-only (no data modification)

- [ ] 6.7 Write unit tests for story timestamp management
  - Test StoryTimestamp creation and validation
  - Test timestamp indexing
  - Test paragraph lookup by time
  - Test time offset calculation
  - Test narrative-type aware queries
  - Test time travel query methods
  - Test read-only guarantee

## 7. AI Tools Implementation

- [ ] 7.1 Create AIElementTools class (`js/managers/AIElementTools.js`)
  - Implement addElement() tool handler
  - Implement updateElementLocation() tool handler
  - Implement updateElementDescription() tool handler
  - Implement updateParagraphTimestamp() tool handler

- [ ] 7.2 Implement addElement tool logic
  - Validate required fields (type, name, description)
  - Generate ID with type-name-sequence format
  - Add default keywords based on type
  - Handle custom keywords
  - Return created element

- [ ] 7.3 Implement updateElementLocation tool logic
  - Validate elementId and locationId exist
  - Validate target is type 'location'
  - Update element.location
  - Record state change
  - Handle location=null case

- [ ] 7.4 Implement updateElementDescription tool logic
  - Validate elementId exists
  - Update element.description or element.stateDescription
  - Update element.keywords array
  - Handle status keywords ("破损", "被遗忘")
  - Record state change

- [ ] 7.5 Implement updateParagraphTimestamp tool logic
  - Validate paragraphId exists
  - Validate referenceParagraphId exists (if provided)
  - Validate narrativeType (if provided)
  - Set storyTimestamp.narrativeType for flashback/flashforward/parallel
  - Set storyTimestamp.referenceParagraphId and timeOffset
  - Calculate time offset automatically if not provided
  - Handle absoluteTime and relativeTime updates
  - Reset to linear (clear reference and offset) when narrativeType="linear"
  - Update StateTimeline index
  - Return updated StoryTimestamp

- [ ] 7.6 Implement error handling
  - Validation error responses
  - Tool execution error handling
  - Timeout handling

- [ ] 7.7 Write unit tests for AIElementTools (`tests/managers/AIElementTools.test.js`)
  - Test addElement for all element types
  - Test updateElementLocation
  - Test updateElementDescription
  - Test updateParagraphTimestamp for all narrative types
  - Test automatic time offset calculation
  - Test absoluteTime and relativeTime updates
  - Test narrative type reset to linear
  - Test error handling

## 8. Preview-Confirm Workflow Implementation

- [ ] 8.1 Create AIPreviewManager class (`js/managers/AIPreviewManager.js`)
  - Implement generateParagraph() for AI suggestion
  - Implement showPreview() for user confirmation
  - Implement applyChanges() for applying confirmed changes

- [ ] 8.2 Implement suggestion data structure
  - Define ParagraphSuggestion interface
  - Include content and elementChanges array
  - Include tool, params, description for each change
  - Include optional storyTimestamp field for narrative scenarios

- [ ] 8.3 Implement preview UI display
  - Display paragraph content preview
  - Display list of element changes
  - Display storyTimestamp if present (narrative type, reference, offset)
  - Show before/after values for changes
  - Allow user to modify storyTimestamp in preview
  - Implement "Confirm" and "Reject" buttons

- [ ] 8.4 Implement change application
  - Insert paragraph into story
  - Call AI tools to apply element changes
  - Call updateParagraphTimestamp if storyTimestamp is present
  - Update StateTimeline
  - Invalidate StateContextCache

- [ ] 8.5 Write unit tests for AIPreviewManager (`tests/managers/AIPreviewManager.test.js`)
  - Test suggestion generation
  - Test change application with storyTimestamp
  - Test user modification of storyTimestamp in preview
  - Test user confirm/reject workflow
  - Test automatic timestamp application on confirmation

## 9. AIManager Integration

- [ ] 9.1 Register AI element tools in AIManager
  - Add registerAIElementTools() method
  - Register addElement tool
  - Register updateElementLocation tool
  - Register updateElementDescription tool

- [ ] 9.2 Update buildContext() to use StateContextCache
  - Replace manual context building with stateContextCache.getContext()
  - Use formatContextForAI() for prompt formatting
  - Include present elements from StoryContext

- [ ] 9.3 Integrate preview-confirm workflow
  - Update handleAIResponse() to handle ParagraphSuggestion
  - Show preview for AI suggestions
  - Apply changes on user confirmation

- [ ] 9.4 Update AIManager tests (`tests/managers/AIManager.test.js`)
  - Test tool registration
  - Test context building with StateContextCache
  - Test preview-confirm workflow
  - Test AI tool invocations

## 10. State Migration and Refactoring

- [ ] 10.1 Create migration utility (`js/utils/migration.js`)
  - Implement migrateStory() function
  - Migrate characters to CharacterElement
  - Migrate items to ItemElement
  - Migrate settings to LocationElement/BaseSettingElement

- [ ] 10.2 Migrate paragraph timestamps
  - Add storyTimestamp to all existing paragraphs
  - Set narrativeType to 'linear' (default)
  - Set chapterId and sequence from paragraph position
  - Set absoluteTime based on chapter order if available

- [ ] 10.3 Migrate character data
  - Convert character.heldItems to stateHistory owner changes
  - Add default keywords ["人物", name]
  - Set initial location to null
  - Remove heldItems field

- [ ] 10.4 Migrate item data
  - Convert item.owner to location field
  - Add initial state change for owner
  - Add default keywords ["道具", name]
  - Remove owner field

- [ ] 10.5 Migrate setting data
  - Convert settings to LocationElement or BaseSettingElement
  - Add default keywords based on type
  - Set location to null

- [ ] 10.6 Refactor state.js
  - Remove characters[], items[], settings[] arrays
  - Add elements[] array
  - Update addCharacter() to call elementManager.addElement()
  - Update addItem() to call elementManager.addElement()
  - Update addSetting() to call elementManager.addElement()

- [ ] 10.7 Remove old field access
  - Remove character.heldItems references
  - Remove item.owner references
  - Update queries to use element.location and stateHistory

- [ ] 10.8 Write migration tests (`tests/utils/migration.test.js`)
  - Test character migration
  - Test item migration
  - Test setting migration
  - Test paragraph timestamp migration
  - Test complete story migration

## 11. ContextBuilder Integration

- [ ] 11.1 Update ContextBuilder to use StateContextCache
  - Initialize with stateContextCache
  - Replace getRelevantCharacters() with stateContextCache queries
  - Replace getRelevantItems() with stateContextCache queries
  - Replace getCurrentSetting() with view location query

- [ ] 11.2 Update buildContext() method
  - Use stateContextCache.getContext(chapterId)
  - Format context using formatContextForAI()
  - Include present elements and their states

- [ ] 11.3 Update ContextBuilder tests (`tests/modules/ContextBuilder.test.js`)
  - Test context building with StateContextCache
  - Test present elements filtering
  - Test AI context formatting

## 12. UI Updates

- [ ] 12.1 Update UIRenderer to display element states
  - Display element location in detail view
  - Display element status keywords
  - Display element state history

- [ ] 12.2 Update timeline display for state changes
  - Display character location changes
  - Display item ownership changes
  - Display element status changes
  - Remove heldItems display

- [ ] 12.3 Add story view location selector
  - UI for selecting current view location
  - Display current view location
  - Show present elements at view

- [ ] 12.4 Add narrative type display
  - Display paragraph narrative type (linear/flashback/flashforward/parallel)
  - Display reference paragraph and time offset if applicable

- [ ] 12.5 Update UIRenderer tests (`tests/managers/UIRenderer.test.js`)
  - Test element state display
  - Test timeline state changes display
  - Test view location selector
  - Test narrative type display

## 13. Integration Testing

- [ ] 13.1 Write end-to-end test for element creation workflow
  - Create element via AI tool
  - Verify element appears in story.elements
  - Verify keywords and stateHistory

- [ ] 13.2 Write end-to-end test for state tracking workflow
  - Change element location
  - Verify state change recorded
  - Query state at different paragraphs

- [ ] 13.3 Write end-to-end test for AI generation workflow
  - Generate paragraph with element changes
  - Preview suggestion
  - Confirm and apply changes
  - Verify state updates

- [ ] 13.4 Write end-to-end test for data migration workflow
  - Migrate old story data
  - Verify all elements converted
  - Verify state history recorded
  - Verify paragraph timestamps created
  - Verify no data loss

- [ ] 13.5 Write end-to-end test for time travel queries
  - Query element state at historical paragraph
  - Verify correct state returned
  - Verify no data modified (read-only)
  - Test element state trajectory query

- [ ] 13.6 Write end-to-end test for non-linear narrative queries
  - Create flashback paragraph with referenceParagraphId and timeOffset
  - Query narrative context for flashback
  - Verify historical state returned
  - Create flashforward paragraph
  - Verify future state returned
  - Create parallel narrative paragraph
  - Verify context from different time point

- [ ] 13.7 Performance testing
  - Test state query performance for large stories (100+ paragraphs)
  - Test time travel query performance with many historical states
  - Test narrative-type aware query performance
  - Test cache hit rates
  - Test memory usage with state history

## 14. Documentation and Cleanup

- [ ] 14.1 Update code documentation
  - Add JSDoc comments for all new classes
  - Update API documentation
  - Document state management architecture

- [ ] 14.2 Update user documentation
  - Document new element management features
  - Document story view management
  - Document AI tools usage
  - Document time travel features
  - Document narrative type support

- [ ] 14.3 Clean up legacy code
  - Remove unused imports
  - Remove deprecated methods
  - Remove old tests for replaced functionality

- [ ] 14.4 Final validation
  - Run all unit tests
  - Run all integration tests
  - Verify no linter errors
  - Verify no console warnings

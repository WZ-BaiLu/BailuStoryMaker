# Spec: Continuous Writing

## ADDED Requirements

### Requirement: Configure paragraph count for continuous writing
The system SHALL allow users to specify the number of paragraphs to generate in a continuous writing session.

#### Scenario: User sets paragraph count
- **WHEN** user opens continuous writing input dialog
- **THEN** system displays a number input field with default value of 1
- **AND** minimum value is 1
- **AND** maximum value is 20
- **AND** user can adjust the value

#### Scenario: User provides invalid paragraph count
- **WHEN** user enters value less than 1
- **THEN** system automatically adjusts to minimum value of 1
- **WHEN** user enters value greater than 20
- **THEN** system automatically adjusts to maximum value of 20

### Requirement: Determine starting paragraph for context
The system SHALL determine the starting paragraph based on user selection, falling back to the most recent paragraph.

#### Scenario: Starting paragraph based on selected paragraph
- **WHEN** user has selected a paragraph in the current chapter
- **AND** user starts continuous writing
- **THEN** system uses the selected paragraph as the starting point for context building

#### Scenario: Starting paragraph based on latest when none selected
- **WHEN** user has not selected any paragraph
- **AND** user starts continuous writing
- **THEN** system uses the most recent paragraph in the chapter as the starting point

#### Scenario: No paragraphs exist in chapter
- **WHEN** chapter contains no paragraphs
- **AND** user starts continuous writing
- **THEN** system uses chapter title and description as initial context
- **AND** system notifies user that this is the first paragraph

### Requirement: Build context for paragraph generation
The system SHALL build context information for each paragraph generation using the starting paragraph and preceding paragraphs.

#### Scenario: Build context from starting paragraph
- **WHEN** system starts continuous writing
- **THEN** system collects content of the starting paragraph
- **AND** system collects content of preceding paragraphs (up to a configurable limit)
- **AND** system includes character information from the story
- **AND** system includes location information from the story
- **AND** system includes relevant events from the story

#### Scenario: Update context for subsequent paragraphs
- **WHEN** system generates paragraph N+1
- **THEN** system includes paragraph N in the context
- **AND** system maintains sliding window of recent paragraphs
- **AND** context reflects the most recent story state

### Requirement: Generate paragraphs in sequence
The system SHALL generate paragraphs one at a time in sequential order.

#### Scenario: Generate first paragraph
- **WHEN** system starts continuous writing with count N
- **THEN** system generates paragraph 1 using initial context
- **AND** system adds the paragraph to the chapter
- **AND** system displays the paragraph in UI

#### Scenario: Generate subsequent paragraphs
- **WHEN** system completes paragraph i (where i < N)
- **THEN** system generates paragraph i+1 using updated context
- **AND** system appends paragraph i+1 to the chapter
- **AND** system displays paragraph i+1 in UI

#### Scenario: Display generation progress
- **WHEN** system is generating paragraphs
- **THEN** system displays current progress (e.g., "3/10 paragraphs")
- **AND** progress updates after each paragraph is generated

### Requirement: Update UI during continuous writing
The system SHALL update the user interface in real-time during continuous writing.

#### Scenario: Update paragraph list after generation
- **WHEN** a new paragraph is generated
- **THEN** system immediately adds the paragraph to the paragraph list
- **AND** system scrolls the view to show the new paragraph
- **AND** system highlights the new paragraph temporarily

#### Scenario: Update progress indicator
- **WHEN** a paragraph generation completes
- **THEN** system updates the progress indicator (e.g., "3/10 paragraphs")
- **AND** system updates the percentage (e.g., "30%")

#### Scenario: Disable controls during generation
- **WHEN** continuous writing is in progress
- **THEN** system disables edit controls for existing paragraphs
- **AND** system enables interrupt button
- **AND** system prevents starting another continuous writing session

### Requirement: Notify completion of continuous writing
The system SHALL notify the user when continuous writing completes successfully.

#### Scenario: Successful completion
- **WHEN** system generates all requested paragraphs (N paragraphs)
- **THEN** system sends a web browser notification
- **AND** notification displays "连续写作完成"
- **AND** notification includes paragraph count (e.g., "已生成 10 个段落")
- **AND** notification includes total time spent

#### Scenario: Completion with interruptions
- **WHEN** system generates some paragraphs but is interrupted
- **THEN** system sends a notification
- **AND** notification indicates partial completion
- **AND** notification shows how many paragraphs were actually generated

#### Scenario: System notification permission
- **WHEN** continuous writing completes
- **AND** browser notification permission is not granted
- **THEN** system displays in-app notification instead
- **AND** in-app notification shows the same information

### Requirement: Handle errors during generation
The system SHALL handle errors gracefully and provide options for recovery.

#### Scenario: AI service error
- **WHEN** AI service returns an error during paragraph generation
- **THEN** system displays error message to user
- **AND** system prompts user to "Continue" or "Abort"
- **WHEN** user chooses "Continue"
- **THEN** system skips the failed paragraph and continues with next
- **WHEN** user chooses "Abort"
- **THEN** system stops continuous writing
- **AND** system sends notification with partial results

#### Scenario: Context building error
- **WHEN** system fails to build context
- **THEN** system displays error message
- **AND** system uses minimal context (starting paragraph only)
- **AND** system logs the error for debugging

#### Scenario: UI update error
- **WHEN** system fails to update UI
- **THEN** system logs the error
- **AND** system continues with next paragraph generation
- **AND** system displays warning in console

### Requirement: Save story after each paragraph
The system SHALL save the story after each paragraph is generated to prevent data loss.

#### Scenario: Auto-save after generation
- **WHEN** a new paragraph is generated and added to story
- **THEN** system saves the story data
- **AND** system updates the "last saved" indicator
- **AND** system displays "Saving..." status during save

#### Scenario: Save failure handling
- **WHEN** story save fails
- **THEN** system displays warning to user
- **AND** system keeps paragraph in memory
- **AND** system continues with next paragraph
- **AND** system queues retry save attempt

### Requirement: Continuous writing button in AI toolbar
The system SHALL provide a continuous writing button in the AI toolbar.

#### Scenario: Display continuous writing button
- **WHEN** AI toolbar is displayed
- **THEN** system shows "连续写作" button
- **AND** button is positioned alongside other AI tools
- **AND** button is enabled when a chapter is open

#### Scenario: Button click opens input dialog
- **WHEN** user clicks "连续写作" button
- **THEN** system opens input modal dialog
- **AND** dialog displays paragraph count input
- **AND** dialog displays "开始" and "取消" buttons

#### Scenario: Button disabled during continuous writing
- **WHEN** continuous writing is in progress
- **THEN** "连续写作" button is disabled
- **AND** button displays "正在进行..." text
- **AND** button is re-enabled after completion or interruption

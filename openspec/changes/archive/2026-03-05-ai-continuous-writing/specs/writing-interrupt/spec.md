# Spec: Writing Interrupt

## ADDED Requirements

### Requirement: Configurable wait time between paragraphs
The system SHALL allow users to configure the wait time between paragraph generations.

#### Scenario: Default wait time
- **WHEN** user starts continuous writing
- **AND** user has not configured wait time
- **THEN** system uses default wait time of 5 seconds

#### Scenario: User configured wait time
- **WHEN** user has set wait time in settings
- **THEN** system uses the configured wait time
- **AND** wait time is retrieved from localStorage

#### Scenario: Wait time range validation
- **WHEN** user sets wait time in settings
- **AND** value is less than 1 second
- **THEN** system adjusts to minimum value of 1 second
- **WHEN** user sets wait time in settings
- **AND** value is greater than 30 seconds
- **THEN** system adjusts to maximum value of 30 seconds

### Requirement: Wait time setting UI
The system SHALL provide user interface for configuring wait time in settings.

#### Scenario: Display wait time setting
- **WHEN** user opens settings
- **THEN** system displays "连续写作等待时间" setting
- **AND** setting shows current value in seconds
- **AND** setting provides range indicator (1-30 seconds)

#### Scenario: Adjust wait time with slider
- **WHEN** user adjusts the wait time slider
- **THEN** system updates the displayed value in real-time
- **AND** system saves the new value to localStorage
- **AND** setting displays confirmation toast

#### Scenario: Adjust wait time with number input
- **WHEN** user enters a numeric value in the wait time input field
- **THEN** system validates the input
- **AND** system saves valid value to localStorage
- **AND** system displays error for invalid input

### Requirement: Interruptible wait between paragraphs
The system SHALL implement a wait period after each paragraph generation that can be interrupted by the user.

#### Scenario: Wait after paragraph generation
- **WHEN** a paragraph is generated successfully
- **THEN** system enters wait period
- **AND** wait period duration equals configured wait time
- **AND** system displays wait overlay on UI

#### Scenario: Display countdown during wait
- **WHEN** system is in wait period
- **THEN** system displays remaining time in seconds
- **AND** countdown updates every second
- **AND** format shows "等待：X 秒"

#### Scenario: Wait period completion
- **WHEN** wait period countdown reaches 0
- **THEN** system automatically continues to next paragraph generation
- **AND** wait overlay is removed
- **AND** system updates progress indicator

### Requirement: User can interrupt wait period
The system SHALL allow users to interrupt the wait period at any time.

#### Scenario: User interrupts wait period
- **WHEN** system is in wait period
- **AND** user clicks "中断" button
- **THEN** system immediately stops wait period
- **AND** wait overlay is removed
- **AND** system stops continuous writing
- **AND** system sends completion notification

#### Scenario: Interrupt button availability
- **WHEN** system is in wait period
- **THEN** "中断" button is enabled
- **AND** button is prominently displayed in wait overlay
- **AND** button is easily accessible

#### Scenario: Interrupt after multiple paragraphs
- **WHEN** user interrupts during wait after paragraph i
- **THEN** system stops continuous writing
- **AND** system sends notification indicating i paragraphs were generated
- **AND** system removes wait overlay
- **AND** system re-enables AI toolbar controls

### Requirement: Wait overlay UI
The system SHALL display a semi-transparent overlay during the wait period.

#### Scenario: Display wait overlay
- **WHEN** system enters wait period
- **THEN** system displays semi-transparent overlay over main editing area
- **AND** overlay shows progress panel
- **AND** overlay does not block visibility of newly generated paragraph

#### Scenario: Progress panel content
- **WHEN** wait overlay is displayed
- **THEN** progress panel shows:
  - Current paragraph count (e.g., "3/10 段落")
  - Remaining wait time countdown (e.g., "等待：4 秒")
  - "中断" button
- **AND** all elements are clearly readable

#### Scenario: Remove wait overlay
- **WHEN** wait period ends (timeout or interrupt)
- **THEN** system removes overlay from UI
- **AND** main editing area is fully accessible again

#### Scenario: Overlay responsiveness
- **WHEN** wait overlay is displayed
- **AND** browser window is resized
- **THEN** overlay adjusts to fit new dimensions
- **AND** progress panel remains centered

### Requirement: AbortController for interruption
The system SHALL use AbortController to implement interruptible wait periods.

#### Scenario: Create AbortController for each wait period
- **WHEN** system starts wait period
- **THEN** system creates new AbortController instance
- **AND** system associates AbortSignal with wait Promise

#### Scenario: Signal abort on user interrupt
- **WHEN** user clicks "中断" button
- **THEN** system calls abort() on AbortController
- **AND** wait Promise is rejected
- **AND** system handles rejection to stop continuous writing

#### Scenario: Cleanup AbortController
- **WHEN** wait period ends (timeout or abort)
- **THEN** system cleans up AbortController instance
- **AND** system removes event listeners
- **AND** system prevents memory leaks

### Requirement: Continuous writing cannot be interrupted during generation
The system SHALL NOT allow interruption while AI is generating a paragraph.

#### Scenario: Disable interrupt during generation
- **WHEN** system is generating a paragraph
- **THEN** "中断" button is disabled
- **AND** button displays "生成中..." text
- **AND** system shows loading indicator

#### Scenario: Enable interrupt after generation
- **WHEN** paragraph generation completes
- **THEN** "中断" button is enabled
- **AND** button displays "中断" text
- **AND** system enters wait period

#### Scenario: Multiple paragraphs without wait time
- **WHEN** user sets wait time to 1 second
- **AND** system generates multiple paragraphs
- **THEN** interrupt button is only enabled during 1-second wait
- **AND** button is disabled during generation

### Requirement: Resume continuous writing after error
The system SHALL allow user to resume continuous writing after an error occurs.

#### Scenario: Error during generation
- **WHEN** paragraph generation fails
- **THEN** system displays error message
- **AND** system shows "继续" and "中止" options
- **AND** system does not enter wait period

#### Scenario: User chooses to continue
- **WHEN** user clicks "继续" after error
- **THEN** system skips failed paragraph
- **AND** system continues with next paragraph
- **AND** system resumes normal wait period after successful generation

#### Scenario: User chooses to abort
- **WHEN** user clicks "中止" after error
- **THEN** system stops continuous writing
- **AND** system removes any overlay
- **AND** system sends notification with partial results

### Requirement: Wait time validation on start
The system SHALL validate wait time before starting continuous writing.

#### Scenario: Validate stored wait time
- **WHEN** user starts continuous writing
- **THEN** system retrieves wait time from localStorage
- **AND** system validates value is within range (1-30 seconds)
- **WHEN** value is invalid
- **THEN** system uses default value of 5 seconds
- **AND** system displays warning toast

#### Scenario: No stored wait time
- **WHEN** user starts continuous writing
- **AND** no wait time is stored in localStorage
- **THEN** system uses default value of 5 seconds
- **AND** system saves default value to localStorage

### Requirement: Keyboard shortcut for interrupt
The system SHALL support keyboard shortcut to interrupt continuous writing.

#### Scenario: Escape key interrupts
- **WHEN** wait overlay is displayed
- **AND** user presses Escape key
- **THEN** system interrupts continuous writing
- **AND** system behaves the same as clicking "中断" button

#### Scenario: Keyboard shortcut does not interrupt during generation
- **WHEN** system is generating a paragraph
- **AND** user presses Escape key
- **THEN** system ignores the keypress
- **AND** paragraph generation continues

#### Scenario: Document keyboard shortcut
- **WHEN** user views keyboard shortcuts help
- **THEN** system documents Escape key as "中断连续写作"

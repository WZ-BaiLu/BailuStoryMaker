# Tasks: AI Continuous Writing Feature

## Overview
Implementation tasks for the AI Continuous Writing feature, organized by dependency order.

## Phase 1: Core Manager Implementation

### Task 1.1: Create ContinuousWritingManager class
- [ ] 1.1 Create file `js/managers/ContinuousWritingManager.js`
- [ ] 1.2 Implement constructor with dependencies (story, state, AIManager, ParagraphAnalyzer, NotificationManager)
- [ ] 1.3 Add properties: isRunning, currentParagraphIndex, totalParagraphs, abortController, waitTime
- [ ] 1.4 Add storage key: `STORAGE_KEY_WAIT_TIME = 'continuous-writing.wait-time'`
- [ ] 1.5 Initialize with wait time from localStorage or default to 5 seconds

### Task 1.2: Implement starting paragraph detection
- [ ] 1.1 Implement `getStartingParagraph()` method
- [ ] 1.2 Check state.selectedParagraphId for selected paragraph
- [ ] 1.3 Fall back to last paragraph if none selected
- [ ] 1.4 Handle empty chapter (no paragraphs) case
- [ ] 1.5 Return paragraph object or null

### Task 1.3: Implement context building
- [ ] 1.1 Implement `buildContext(startingParagraph)` method
- [ ] 1.2 Collect starting paragraph content
- [ ] 1.3 Collect preceding paragraphs (up to configurable limit, default 5)
- [ ] 1.4 Include character information from story
- [ ] 1.5 Include location information from story
- [ ] 1.6 Include relevant events from story
- [ ] 1.7 Return context object with all information

### Task 1.4: Implement main continuous writing loop
- [ ] 1.1 Implement `startContinuousWriting(paragraphCount)` method
- [ ] 1.2 Validate paragraphCount (1-20 range)
- [ ] 1.3 Set isRunning flag and initialize progress tracking
- [ ] 1.4 Create AbortController for interruption
- [ ] 1.5 Loop from 1 to paragraphCount:
  - [ ] Generate paragraph using AI service
  - [ ] Add paragraph to story
  - [ ] Update UI
  - [ ] Analyze paragraph (if not skipped)
  - [ ] Apply analysis results
  - [ ] Save story
  - [ ] Wait with interruptible delay (if not last paragraph)
- [ ] 1.6 Send completion notification
- [ ] 1.7 Clear isRunning flag

### Task 1.5: Implement paragraph generation
- [ ] 1.1 Implement `generateParagraph(context)` method
- [ ] 1.2 Call AI service with context
- [ ] 1.3 Handle AI service errors
- [ ] 1.4 Prompt user to continue or abort on error
- [ ] 1.5 Return generated paragraph object or null

### Task 1.6: Implement interruptible wait
- [ ] 1.1 Implement `waitForInterruptibleDelay(ms)` method
- [ ] 1.2 Create Promise with setTimeout
- [ ] 1.3 Set up abort event listener on abortController.signal
- [ ] 1.4 Reject promise on abort
- [ ] 1.5 Cleanup event listener and timeout
- [ ] 1.6 Return Promise that resolves after delay or rejects on abort

### Task 1.7: Implement abort functionality
- [ ] 1.1 Implement `abort()` method
- [ ] 1.2 Call abortController.abort()
- [ ] 1.3 Clear isRunning flag
- [ ] 1.4 Send partial completion notification
- [ ] 1.5 Clean up AbortController

### Task 1.8: Implement paragraph analysis integration
- [ ] 1.1 Implement `analyzeParagraph(paragraph, context)` method
- [ ] 1.2 Check if analysis is skipped in settings
- [ ] 1.3 Call ParagraphAnalyzer.analyzeParagraph()
- [ ] 1.4 Handle analysis errors (log, warn, continue)
- [ ] 1.5 Return analysis result or null

### Task 1.9: Implement analysis result application
- [ ] 1.1 Implement `applyAnalysisResult(analysis, paragraph)` method
- [ ] 1.2 Apply character state changes to story
- [ ] 1.3 Apply element location changes to story
- [ ] 1.4 Add events to story
- [ ] 1.5 Record changes in state timeline
- [ ] 1.6 Return success status

### Task 1.10: Implement wait time management
- [ ] 1.1 Implement `getWaitTime()` method
- [ ] 1.2 Retrieve from localStorage
- [ ] 1.3 Validate range (1-30 seconds)
- [ ] 1.4 Return valid value or default (5 seconds)
- [ ] 1.5 Implement `setWaitTime(seconds)` method
- [ ] 1.6 Validate input range
- [ ] 1.7 Save to localStorage

## Phase 2: UI Implementation

### Task 2.1: Extend AIManager with continuous writing integration
- [ ] 2.1 Initialize ContinuousWritingManager in AIManager constructor
- [ ] 2.2 Create continuousWritingManager property
- [ ] 2.3 Pass required dependencies to ContinuousWritingManager constructor
- [ ] 2.4 Implement `startContinuousWriting(paragraphCount)` method
- [ ] 2.5 Implement `abortContinuousWriting()` method
- [ ] 2.6 Implement `isContinuousWritingRunning()` method

### Task 2.2: Add continuous writing button to AI toolbar
- [ ] 2.1 Locate AI toolbar rendering code in AIManager or UIRenderer
- [ ] 2.2 Add "连续写作" button HTML element
- [ ] 2.3 Position button alongside existing AI tools
- [ ] 2.4 Add click event listener to button
- [ ] 2.5 Implement button click handler to open input dialog

### Task 2.3: Create input dialog UI
- [ ] 2.1 Implement `showContinuousWritingInputDialog()` method in UIRenderer
- [ ] 2.2 Create modal dialog HTML structure
- [ ] 2.3 Add number input field for paragraph count (min=1, max=20, default=5)
- [ ] 2.4 Add "开始" and "取消" buttons
- [ ] 2.5 Style dialog with existing modal CSS
- [ ] 2.6 Implement "开始" button handler:
  - [ ] Validate input value
  - [ ] Call AIManager.startContinuousWriting(count)
  - [ ] Close dialog
- [ ] 2.7 Implement "取消" button handler to close dialog

### Task 2.4: Create wait overlay UI
- [ ] 2.1 Implement `showWaitOverlay(currentParagraph, totalParagraphs, remainingTime)` method in UIRenderer
- [ ] 2.2 Create semi-transparent overlay HTML structure
- [ ] 2.3 Create progress panel with:
  - [ ] Progress text (e.g., "3/10 段落")
  - [ ] Countdown text (e.g., "等待：4 秒")
  - [ ] "中断" button
- [ ] 2.4 Position overlay over main editing area
- [ ] 2.5 Style overlay with CSS (semi-transparent background, centered panel)
- [ ] 2.6 Make overlay responsive to window resize

### Task 2.5: Implement wait overlay updates
- [ ] 2.1 Implement `updateWaitOverlay(remainingTime)` method
- [ ] 2.2 Update countdown text display
- [ ] 2.3 Call method every second during wait period
- [ ] 2.4 Format time as "等待：X 秒"

### Task 2.6: Implement wait overlay removal
- [ ] 2.1 Implement `hideWaitOverlay()` method
- [ ] 2.2 Remove overlay HTML from DOM
- [ ] 2.3 Clean up any event listeners
- [ ] 2.4 Re-enable main editing area interaction

### Task 2.7: Add progress indicator to paragraph list
- [ ] 2.1 Implement `updateProgressIndicator(current, total)` method
- [ ] 2.2 Display progress text in UI (e.g., "3/10 段落")
- [ ] 2.3 Display percentage (e.g., "30%")
- [ ] 2.4 Update indicator after each paragraph generation

### Task 2.8: Display analysis results on paragraphs
- [ ] 2.1 Implement `displayAnalysisResults(paragraph, analysis)` method
- [ ] 2.2 Add character change indicators to paragraph
- [ ] 2.3 Add event markers to paragraph
- [ ] 2.4 Add element change indicators to paragraph
- [ ] 2.5 Implement tooltips for indicators
- [ ] 2.6 Style indicators appropriately

### Task 2.9: Add analysis status indicators
- [ ] 2.1 Add "分析中..." indicator to paragraph during analysis
- [ ] 2.2 Add "已分析" indicator with change count after successful analysis
- [ ] 2.3 Add "分析失败" indicator (red) after failed analysis
- [ ] 2.4 Implement retry button on "分析失败" indicator click
- [ ] 2.5 Style all indicators appropriately

### Task 2.10: Disable/enable controls during continuous writing
- [ ] 2.1 Disable edit controls for existing paragraphs when continuous writing starts
- [ ] 2.2 Disable "连续写作" button during continuous writing
- [ ] 2.3 Change button text to "正在进行..."
- [ ] 2.4 Re-enable all controls when continuous writing completes or aborts
- [ ] 2.5 Restore button text to "连续写作"

## Phase 3: Settings Integration

### Task 3.1: Extend settings storage
- [ ] 3.1 Add storage key: `STORAGE_KEY_WAIT_TIME = 'continuous-writing.wait-time'`
- [ ] 3.2 Add storage key: `STORAGE_KEY_SKIP_ANALYSIS = 'continuous-writing.skip-analysis'`
- [ ] 3.3 Implement helper methods to get/set these settings
- [ ] 3.4 Add validation for wait time (1-30 seconds)
- [ ] 3.5 Add default value handling

### Task 3.2: Create wait time setting UI
- [ ] 3.1 Locate settings rendering code
- [ ] 3.2 Add "连续写作等待时间" setting section
- [ ] 3.3 Add number input field (min=1, max=30, default=5)
- [ ] 3.4 Add slider control for intuitive adjustment
- [ ] 3.5 Display current value in seconds
- [ ] 3.6 Implement change handler to save to localStorage
- [ ] 3.7 Add validation error display for invalid input

### Task 3.3: Create skip analysis setting UI
- [ ] 3.1 Add "连续写作时跳过段落分析" checkbox setting
- [ ] 3.2 Set default state to unchecked (analysis enabled)
- [ ] 3.3 Implement change handler to save to localStorage
- [ ] 3.4 Update ContinuousWritingManager to read this setting

### Task 3.4: Integrate settings with ContinuousWritingManager
- [ ] 3.1 Update ContinuousWritingManager to read skip analysis setting
- [ ] 3.2 Skip analysis calls when setting is enabled
- [ ] 3.3 Mark paragraphs as "未分析" when analysis is skipped
- [ ] 3.4 Update UI to reflect skip setting status

## Phase 4: Styling

### Task 4.1: Add continuous writing modal styles
- [ ] 4.1 Create CSS class `.continuous-writing-input-modal`
- [ ] 4.2 Style modal content (width, padding, border-radius)
- [ ] 4.3 Style number input field
- [ ] 4.4 Style action buttons (primary/secondary)
- [ ] 4.5 Add hover and active states

### Task 4.2: Add wait overlay styles
- [ ] 4.1 Create CSS class `.continuous-writing-overlay`
- [ ] 4.2 Set semi-transparent background (rgba(0,0,0,0.5))
- [ ] 4.3 Position overlay absolutely over editing area
- [ ] 4.4 Set z-index to ensure overlay appears above content

### Task 4.3: Add progress panel styles
- [ ] 4.1 Create CSS class `.progress-panel`
- [ ] 4.2 Center panel on overlay
- [ ] 4.3 Style with white background and shadow
- [ ] 4.4 Style progress text and countdown text (large, readable)
- [ ] 4.5 Style "中断" button (prominent, red/accent color)

### Task 4.4: Add analysis indicator styles
- [ ] 4.1 Create CSS classes for analysis indicators
- [ ] 4.2 Style "分析中..." indicator (spinning animation)
- [ ] 4.3 Style "已分析" indicator (green checkmark)
- [ ] 4.4 Style "分析失败" indicator (red warning icon)
- [ ] 4.5 Style tooltips for indicators
- [ ] 4.6 Add hover effects

### Task 4.5: Add responsive styles
- [ ] 4.1 Make modal responsive on mobile devices
- [ ] 4.2 Adjust overlay and panel sizes for small screens
- [ ] 4.3 Ensure buttons remain touch-friendly on mobile
- [ ] 4.4 Test on various screen sizes

## Phase 5: Notifications

### Task 5.1: Implement completion notification
- [ ] 5.1 Create notification template for successful completion
- [ ] 5.2 Include paragraph count and total time
- [ ] 5.3 Include analysis summary (changes detected)
- [ ] 5.4 Use NotificationManager.showNotification()
- [ ] 5.5 Handle browser notification permission

### Task 5.2: Implement partial completion notification
- [ ] 5.1 Create notification template for interrupted completion
- [ ] 5.2 Include number of paragraphs generated
- [ ] 5.3 Indicate "已中断" status
- [ ] 5.4 Offer option to view generated paragraphs

### Task 5.3: Implement error notifications
- [ ] 5.1 Create notification for AI service errors
- [ ] 5.2 Create notification for analysis errors
- [ ] 5.3 Create notification for save failures
- [ ] 5.4 Include actionable options (retry, continue, abort)

### Task 5.4: Add in-app notification fallback
- [ ] 5.1 Detect when browser notifications are blocked
- [ ] 5.2 Display in-app toast notification instead
- [ ] 5.3 Style toast notification with same information
- [ ] 5.4 Add auto-dismiss after 5 seconds

## Phase 6: Telegram Bot Integration

### Task 6.1: Extend NotificationManager with Telegram support
- [ ] 6.1 Add Telegram storage keys:
  - [ ] 'telegram.enabled' - enable/disable flag
  - [ ] 'telegram.bot.token' - Bot token
  - [ ] 'telegram.chat.id' - Chat ID
- [ ] 6.2 Implement `getTelegramConfig()` method to retrieve configuration
- [ ] 6.3 Implement `setTelegramConfig(config)` method to save configuration
- [ ] 6.4 Implement `isTelegramEnabled()` method to check if notifications are enabled
- [ ] 6.5 Add configuration validation (token format, Chat ID numeric)
- [ ] 6.6 Extend showSuccess() to send Telegram notification
- [ ] 6.7 Extend showError() to send Telegram notification
- [ ] 6.8 Extend showWarning() to send Telegram notification
- [ ] 6.9 Ensure Telegram sending failure does not block toast notifications

### Task 6.2: Implement Telegram API integration
- [ ] 6.1 Implement `sendTelegramMessage(message, type)` method
- [ ] 6.2 Build request URL: `https://api.telegram.org/bot{TOKEN}/sendMessage`
- [ ] 6.3 Implement request body with chat_id, text, parse_mode
- [ ] 6.4 Add emoji based on notification type (✅❌⚠️)
- [ ] 6.5 Set parse_mode to 'HTML' for message formatting
- [ ] 6.6 Implement 10-second timeout for requests
- [ ] 6.7 Handle different HTTP status codes:
  - [ ] 401 Unauthorized (invalid token)
  - [ ] 400 Bad Request (invalid Chat ID)
  - [ ] 429 Too Many Requests (rate limit)
- [ ] 6.8 Implement retry logic for temporary failures (1 retry)
- [ ] 6.9 Log errors for debugging

### Task 6.3: Implement Telegram message formatting
- [ ] 6.1 Add emoji prefixes based on notification type
- [ ] 6.2 Escape HTML special characters in user content
- [ ] 6.3 Implement message truncation for messages > 4096 characters
- [ ] 6.4 Add "..." suffix to truncated messages
- [ ] 6.5 Log truncation for debugging

### Task 6.4: Implement Telegram test message
- [ ] 6.1 Implement `sendTestTelegramMessage()` method
- [ ] 6.2 Send test message: "✅ 测试消息 - BailuStory Telegram通知已配置成功"
- [ ] 6.3 Return success/failure status
- [ ] 6.4 Handle errors and provide user-friendly error messages
- [ ] 6.5 Suggest enabling Telegram notifications after successful test

### Task 6.5: Create Telegram settings UI
- [ ] 6.1 Add "Telegram 通知" section to settings UI
- [ ] 6.2 Add "启用Telegram通知" checkbox
- [ ] 6.3 Add Bot Token input field (password type)
- [ ] 6.4 Add Chat ID input field (password type)
- [ ] 6.5 Add "显示/隐藏" toggle for password fields
- [ ] 6.6 Add "发送测试消息" button
- [ ] 6.7 Add configuration help text:
  - [ ] How to get Bot Token from @BotFather
  - [ ] How to get Chat ID from @userinfobot
- [ ] 6.8 Add "清除Telegram配置" button
- [ ] 6.9 Style settings section consistently with existing settings

### Task 6.6: Implement Telegram settings validation
- [ ] 6.1 Validate Bot token format on input
- [ ] 6.2 Validate Chat ID is numeric on input
- [ ] 6.3 Display validation errors inline
- [ ] 6.4 Prevent enabling Telegram notifications without both fields configured
- [ ] 6.5 Show warning when trying to enable incomplete configuration
- [ ] 6.6 Provide example format in placeholder text

### Task 6.7: Implement Telegram error handling UI
- [ ] 6.1 Display success toast when test message is sent
- [ ] 6.2 Display error toast when test message fails
- [ ] 6.3 Include failure reason in error message
- [ ] 6.4 Provide guidance to fix configuration errors
- [ ] 6.5 Disable Telegram notifications automatically on invalid configuration
- [ ] 6.6 Show configuration status indicator (green/red)

### Task 6.8: Implement Telegram notification completion messages
- [ ] 6.1 Format success completion message for Telegram:
  - [ ] Add success emoji (✅)
  - [ ] Title: "连续写作完成"
  - [ ] Paragraph count
  - [ ] Total time
  - [ ] Analysis summary
- [ ] 6.2 Format partial completion message for Telegram:
  - [ ] Add warning emoji (⚠️)
  - [ ] Title: "连续写作已中断"
  - [ ] Generated paragraphs count
  - [ ] Remaining paragraphs
- [ ] 6.3 Format error message for Telegram:
  - [ ] Add error emoji (❌)
  - [ ] Title: "连续写作出错"
  - [ ] Error description
  - [ ] Paragraphs generated before error

### Task 6.9: Implement Telegram privacy and security
- [ ] 6.1 Ensure all configuration stored in localStorage only
- [ ] 6.2 Do not send configuration to any external server
- [ ] 6.3 Use password input fields for sensitive data
- [ ] 6.4 Implement show/hide toggle for password fields
- [ ] 6.5 Do not expose sensitive data in logs
- [ ] 6.6 Add confirmation dialog before clearing configuration

### Task 6.10: Test Telegram integration
- [ ] 6.1 Test successful message sending
- [ ] 6.2 Test message with different notification types
- [ ] 6.3 Test invalid Bot token handling
- [ ] 6.4 Test invalid Chat ID handling
- [ ] 6.5 Test network error handling
- [ ] 6.6 Test message truncation for long messages
- [ ] 6.7 Test test message functionality
- [ ] 6.8 Test enable/disable Telegram notifications
- [ ] 6.9 Test Telegram + in-app toast simultaneous sending
- [ ] 6.10 Test Telegram + browser notification simultaneous sending

## Phase 7: Event Handling & Keyboard Shortcuts

### Task 7.1: Implement interrupt button handler
- [ ] 7.1 Add click event listener to "中断" button
- [ ] 7.2 Call ContinuousWritingManager.abort()
- [ ] 7.3 Wait for abort to complete
- [ ] 7.4 Hide wait overlay
- [ ] 7.5 Update UI to show aborted status

### Task 7.2: Implement Escape key shortcut
- [ ] 7.1 Add keydown event listener for Escape key
- [ ] 7.2 Check if wait overlay is visible
- [ ] 7.3 Check if continuous writing is in wait period
- [ ] 7.4 If both true, trigger abort
- [ ] 7.5 Do not interrupt during paragraph generation

### Task 7.3: Document keyboard shortcuts
- [ ] 7.1 Update keyboard shortcuts documentation
- [ ] 7.2 Add "Escape: 中断连续写作" entry
- [ ] 7.3 Update help text to include continuous writing shortcuts

### Task 7.4: Handle input dialog keyboard events
- [ ] 7.1 Add Enter key handler to start continuous writing
- [ ] 7.2 Add Escape key handler to close dialog
- [ ] 7.3 Prevent default form submission behavior
- [ ] 7.4 Validate input on Enter key press

## Phase 8: Error Handling

### Task 7.1: Implement AI service error handling
- [ ] 7.1 Catch AI service errors in generateParagraph()
- [ ] 7.2 Display error message to user
- [ ] 7.3 Show "Continue" and "Abort" options
- [ ] 7.4 Handle user choice:
  - [ ] "Continue": Skip current paragraph, continue with next
  - [ ] "Abort": Stop continuous writing, show partial results
- [ ] 7.5 Log error for debugging

### Task 7.2: Implement analysis error handling
- [ ] 7.1 Catch ParagraphAnalyzer errors in analyzeParagraph()
- [ ] 7.2 Display warning toast to user
- [ ] 7.3 Mark paragraph as "分析失败"
- [ ] 7.4 Continue with next paragraph generation
- [ ] 7.5 Log error for debugging

### Task 7.3: Implement save error handling
- [ ] 7.1 Catch save errors after paragraph generation
- [ ] 7.2 Display warning toast to user
- [ ] 7.3 Keep paragraph in memory
- [ ] 7.4 Continue with next paragraph
- [ ] 7.5 Queue retry save attempt
- [ ] 7.6 Log error for debugging

### Task 7.4: Implement context building error handling
- [ ] 7.1 Catch context building errors
- [ ] 7.2 Display error message to user
- [ ] 7.3 Fall back to minimal context (starting paragraph only)
- [ ] 7.4 Log error for debugging
- [ ] 7.5 Continue with generation

### Task 7.5: Implement UI update error handling
- [ ] 7.1 Catch UI update errors
- [ ] 7.2 Log error to console
- [ ] 7.3 Continue with next paragraph generation
- [ ] 7.4 Display warning toast if UI is unresponsive

## Phase 9: Testing

### Task 8.1: Unit tests for ContinuousWritingManager
- [ ] 8.1 Test getStartingParagraph() with selected paragraph
- [ ] 8.2 Test getStartingParagraph() without selection (fallback to last)
- [ ] 8.3 Test getStartingParagraph() with empty chapter
- [ ] 8.4 Test buildContext() method
- [ ] 8.5 Test waitForInterruptibleDelay() normal completion
- [ ] 8.6 Test waitForInterruptibleDelay() with abort
- [ ] 8.7 Test abort() method
- [ ] 8.8 Test wait time management (get/set)
- [ ] 8.9 Test paragraph count validation

### Task 8.2: Integration tests for continuous writing flow
- [ ] 8.1 Test complete continuous writing with 3 paragraphs
- [ ] 8.2 Test continuous writing with analysis
- [ ] 8.3 Test continuous writing without analysis (skip setting)
- [ ] 8.4 Test interruption during wait period
- [ ] 8.5 Test interruption with Escape key
- [ ] 8.6 Test error handling (AI service failure)
- [ ] 8.7 Test error handling (analysis failure)
- [ ] 8.8 Test partial completion notification

### Task 8.3: UI tests
- [ ] 8.1 Test input dialog display and interaction
- [ ] 8.2 Test wait overlay display and updates
- [ ] 8.3 Test progress indicator updates
- [ ] 8.4 Test analysis result display
- [ ] 8.5 Test interrupt button functionality
- [ ] 8.6 Test responsive design on mobile

### Task 8.4: Settings tests
- [ ] 8.1 Test wait time setting save/load
- [ ] 8.2 Test wait time validation (range 1-30)
- [ ] 8.3 Test skip analysis setting
- [ ] 8.4 Test settings persistence across sessions

### Task 8.5: Manual testing scenarios
- [ ] 8.1 Test continuous writing with 1 paragraph
- [ ] 8.2 Test continuous writing with 20 paragraphs (max)
- [ ] 8.3 Test with minimum wait time (1 second)
- [ ] 8.4 Test with maximum wait time (30 seconds)
- [ ] 8.5 Test with character present in story
- [ ] 8.6 Test with multiple characters in story
- [ ] 8.7 Test with locations defined in story
- [ ] 8.8 Test with events in story
- [ ] 8.9 Test notification delivery
- [ ] 8.10 Test all keyboard shortcuts

## Phase 10: Documentation & Polish

### Task 10.1: Add CSS comments and documentation
- [ ] 9.1 Add comments to continuous writing CSS classes
- [ ] 9.2 Document responsive breakpoints
- [ ] 9.3 Document color scheme usage

### Task 10.2: Add code comments
- [ ] 10.1 Add JSDoc comments to ContinuousWritingManager methods
- [ ] 10.2 Document parameter types and return values
- [ ] 10.3 Add inline comments for complex logic
- [ ] 10.4 Document integration points with other managers

### Task 10.3: Update user documentation
- [ ] 10.1 Add "连续写作" section to user guide
- [ ] 10.2 Document how to start continuous writing
- [ ] 10.3 Document how to interrupt continuous writing
- [ ] 10.4 Document wait time setting
- [ ] 10.5 Document skip analysis setting
- [ ] 10.6 Document Telegram notification setup
- [ ] 10.7 Add screenshots of UI elements

### Task 10.4: Performance optimization
- [ ] 10.1 Profile continuous writing flow for bottlenecks
- [ ] 10.2 Optimize UI updates (batch DOM operations)
- [ ] 10.3 Optimize context building (cache frequent data)
- [ ] 10.4 Test with large chapter (50+ paragraphs)

## Total Tasks: 10 phases, ~95 tasks (added 15 tasks for Telegram integration)

## ADDED Requirements

### Requirement: Display AI Assistant Panel

The system SHALL display an AI assistant panel on the right side of the chapter editor when the user is editing a chapter.

#### Scenario: Display AI panel when chapter is selected
- **WHEN** user selects a chapter from the chapter list
- **THEN** system SHALL display the AI assistant panel on the right side of the chapter editor
- **AND** panel SHALL have default width of 300px

#### Scenario: Hide AI panel when no chapter is selected
- **WHEN** user deselects the chapter or navigates away from story view
- **THEN** system SHALL hide the AI assistant panel

---

### Requirement: AI Panel Adjustable Width

The system SHALL allow users to adjust the width of the AI assistant panel by dragging the resize handle.

#### Scenario: Increase panel width
- **WHEN** user drags the resize handle to the right
- **THEN** system SHALL increase the panel width
- **AND** width SHALL be limited to maximum of 600px

#### Scenario: Decrease panel width
- **WHEN** user drags the resize handle to the left
- **THEN** system SHALL decrease the panel width
- **AND** width SHALL be limited to minimum of 200px

#### Scenario: Persist panel width
- **WHEN** user adjusts the panel width
- **THEN** system SHALL save the width to localStorage
- **AND** system SHALL restore the saved width when the panel is reopened

---

### Requirement: AI Panel Collapsible

The system SHALL allow users to collapse and expand the AI assistant panel.

#### Scenario: Collapse AI panel
- **WHEN** user clicks the collapse button (hamburger icon or arrow)
- **THEN** system SHALL collapse the AI assistant panel
- **AND** panel SHALL only show the collapse/expand button
- **AND** system SHALL save collapsed state to localStorage

#### Scenario: Expand AI panel
- **WHEN** user clicks the expand button
- **THEN** system SHALL expand the AI assistant panel to previous width
- **AND** system SHALL update collapsed state in localStorage

---

### Requirement: Responsive Layout for Mobile Devices

The system SHALL display the AI assistant panel as a drawer-style panel from the bottom on mobile devices (screen width < 768px).

#### Scenario: Display bottom drawer on mobile
- **WHEN** user is on a device with screen width < 768px
- **THEN** system SHALL display a "AI Assistant" button at the bottom of the screen
- **AND** system SHALL hide the side panel

#### Scenario: Open drawer from bottom button
- **WHEN** user taps the "AI Assistant" button on mobile
- **THEN** system SHALL open the AI assistant panel as a drawer from the bottom
- **AND** panel SHALL overlay the content with a semi-transparent backdrop

#### Scenario: Close drawer
- **WHEN** user taps outside the drawer or taps the close button
- **THEN** system SHALL close the drawer
- **AND** backdrop SHALL be removed

---

### Requirement: AI Chat Interface

The system SHALL provide a chat interface for users to interact with AI.

#### Scenario: Display chat messages
- **WHEN** there are chat messages in the current session
- **THEN** system SHALL display all messages in the chat area
- **AND** user messages SHALL be styled differently from AI messages
- **AND** messages SHALL be displayed in chronological order (oldest at top)

#### Scenario: User sends message
- **WHEN** user types a message in the input field and presses Enter or clicks "Send"
- **THEN** system SHALL display the user message in the chat area
- **AND** system SHALL send the message to the AI service
- **AND** system SHALL clear the input field

#### Scenario: AI response displayed
- **WHEN** AI service returns a response
- **THEN** system SHALL display the AI response in the chat area
- **AND** response SHALL be styled as an AI message
- **AND** system SHALL show the timestamp for both user and AI messages

---

### Requirement: Loading State Indicator

The system SHALL display a loading indicator while waiting for AI response.

#### Scenario: Show loading indicator
- **WHEN** user sends a message to AI
- **THEN** system SHALL display a loading indicator in the chat area
- **AND** indicator SHALL show "AI正在思考..." or "AI is thinking..." based on current language

#### Scenario: Hide loading indicator on response
- **WHEN** AI response is received and displayed
- **THEN** system SHALL remove the loading indicator

#### Scenario: Hide loading indicator on error
- **WHEN** AI request fails with an error
- **THEN** system SHALL remove the loading indicator
- **AND** system SHALL display an error message

---

### Requirement: Insert AI Response to Editor

The system SHALL allow users to insert AI-generated content into the chapter editor.

#### Scenario: Show insert button on AI response
- **WHEN** AI returns a response
- **THEN** system SHALL display an "Insert to Editor" button below the AI message

#### Scenario: Insert at selected text
- **WHEN** user has selected text in the editor and clicks "Insert to Editor"
- **THEN** system SHALL replace the selected text with the AI response

#### Scenario: Insert at cursor position
- **WHEN** user has not selected text but has a cursor position and clicks "Insert to Editor"
- **THEN** system SHALL insert the AI response at the cursor position

#### Scenario: Insert at end of paragraph
- **WHEN** user has no selection and no active cursor position and clicks "Insert to Editor"
- **THEN** system SHALL append the AI response to the end of the current paragraph

---

### Requirement: Clear Chat History

The system SHALL allow users to clear the chat history for the current chapter.

#### Scenario: Clear chat history button
- **WHEN** user clicks the "Clear History" button in the AI panel
- **THEN** system SHALL display a confirmation dialog
- **AND** dialog SHALL ask "确定要清空当前会话历史吗？" or "Are you sure you want to clear the chat history?"

#### Scenario: Confirm clear history
- **WHEN** user confirms the clear history action
- **THEN** system SHALL delete all messages for the current chapter from localStorage
- **AND** system SHALL clear the chat area display

#### Scenario: Cancel clear history
- **WHEN** user cancels the clear history action
- **THEN** system SHALL close the dialog
- **AND** chat history SHALL remain unchanged

---

### Requirement: Chat History Per Chapter

The system SHALL maintain separate chat history for each chapter.

#### Scenario: Load chapter-specific history
- **WHEN** user selects a chapter
- **THEN** system SHALL load the chat history specific to that chapter from localStorage
- **AND** system SHALL display the messages in the chat area

#### Scenario: Save chapter history on switch
- **WHEN** user switches from one chapter to another
- **THEN** system SHALL save the current chat history before loading the new chapter's history

---

### Requirement: Configuration Settings Button

The system SHALL display a settings button in the AI panel header for accessing AI configuration.

#### Scenario: Show settings button
- **WHEN** AI panel is displayed
- **THEN** system SHALL show a settings button (⚙️ icon) in the panel header

#### Scenario: Settings button with warning badge
- **WHEN** AI configuration is not set or API key is missing
- **THEN** system SHALL display a red warning badge or dot on the settings button
- **AND** badge SHALL indicate that configuration is required

#### Scenario: Open settings modal
- **WHEN** user clicks the settings button
- **THEN** system SHALL open the AI configuration modal

---

### Requirement: Auto-scroll to Latest Message

The system SHALL automatically scroll the chat area to show the latest message.

#### Scenario: Scroll to new user message
- **WHEN** user sends a message
- **THEN** system SHALL automatically scroll the chat area to show the new user message

#### Scenario: Scroll to new AI response
- **WHEN** AI response is displayed
- **THEN** system SHALL automatically scroll the chat area to show the AI response

---

### Requirement: Copy AI Response

The system SHALL allow users to copy AI-generated text to clipboard.

#### Scenario: Copy button on AI response
- **WHEN** AI returns a response
- **THEN** system SHALL display a "Copy" button below the AI message

#### Scenario: Copy successful
- **WHEN** user clicks the "Copy" button
- **THEN** system SHALL copy the AI response text to clipboard
- **AND** system SHALL display a success notification

#### Scenario: Copy failed
- **WHEN** clipboard copy operation fails
- **THEN** system SHALL display an error notification

---

### Requirement: Error Display in Chat

The system SHALL display error messages directly in the chat area when AI requests fail.

#### Scenario: Display network error
- **WHEN** AI request fails due to network error
- **THEN** system SHALL display an error message in the chat area
- **AND** message SHALL say "网络连接失败，请检查网络" or "Network connection failed, please check your network"

#### Scenario: Display API error
- **WHEN** AI request fails with API error (e.g., invalid API key)
- **THEN** system SHALL display the specific error message in the chat area
- **AND** message SHALL include actionable guidance (e.g., "请检查API Key配置")

#### Scenario: Retry button on error
- **WHEN** error is retryable (network error, timeout, server error)
- **THEN** system SHALL display a "Retry" button with the error message
- **AND** clicking "Retry" SHALL resend the last user message

---

### Requirement: Character Counter for Input

The system SHALL display a character counter for the user input field.

#### Scenario: Update character count
- **WHEN** user types in the input field
- **THEN** system SHALL update the character count display

#### Scenario: Show character limit warning
- **WHEN** input exceeds 2000 characters
- **THEN** system SHALL change the character count color to indicate the limit
- **AND** system SHALL prevent sending if input exceeds maximum limit (e.g., 4000 characters)

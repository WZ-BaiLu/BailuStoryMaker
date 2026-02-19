# View Management Delta Specification

## MODIFIED Requirements

### Requirement: View Navigation

The system SHALL support multiple views and allow users to switch between them.

#### Scenario: Navigate to story view
- **WHEN** user clicks "故事" (Story) button in navigation
- **THEN** system SHALL switch to story view
- **AND** system SHALL display AI assistant panel if a chapter is selected

#### Scenario: Navigate to character view
- **WHEN** user clicks "角色" (Character) button in navigation
- **THEN** system SHALL switch to character view
- **AND** system SHALL hide the AI assistant panel

#### Scenario: Navigate to item view
- **WHEN** user clicks "道具" (Item) button in navigation
- **THEN** system SHALL switch to item view
- **AND** system SHALL hide the AI assistant panel

#### Scenario: Navigate to setting view
- **WHEN** user clicks "设定" (Setting) button in navigation
- **THEN** system SHALL switch to setting view
- **AND** system SHALL hide the AI assistant panel

#### Scenario: Navigate to prompt view
- **WHEN** user clicks "提示词" (Prompt) button in navigation
- **THEN** system SHALL switch to prompt view
- **AND** system SHALL hide the AI assistant panel

---

### Requirement: View Persistence

The system SHALL persist view state and AI panel state to localStorage.

#### Scenario: Persist current view and AI panel state
- **WHEN** user switches to a new view
- **THEN** system SHALL save the current view to localStorage
- **AND** system SHALL save the AI panel state (visible/hidden, width, collapsed)

#### Scenario: Restore view and AI panel state on load
- **WHEN** application initializes
- **THEN** system SHALL restore the last saved view
- **AND** system SHALL restore the AI panel state based on the restored view

---

### Requirement: View Refresh

The system SHALL provide methods to refresh the current view and AI panel.

#### Scenario: Refresh current view
- **WHEN** state changes (e.g., undo/redo)
- **THEN** system SHALL refresh the current view
- **AND** if AI panel is visible, system SHALL refresh the AI panel content

#### Scenario: Refresh AI panel only
- **WHEN** AI configuration changes or AI panel state changes
- **THEN** system SHALL refresh the AI panel without refreshing the main view

---

## ADDED Requirements

### Requirement: AI Assistant Panel Visibility Control

The system SHALL control the visibility of the AI assistant panel based on the current view and selection state.

#### Scenario: Show AI panel in story view with chapter selected
- **WHEN** user is in story view and a chapter is selected
- **THEN** system SHALL display the AI assistant panel

#### Scenario: Hide AI panel in story view without chapter
- **WHEN** user is in story view but no chapter is selected
- **THEN** system SHALL hide the AI assistant panel

#### Scenario: Hide AI panel in non-story views
- **WHEN** user switches to character, item, setting, or prompt view
- **THEN** system SHALL hide the AI assistant panel
- **AND** system SHALL save the AI panel hidden state

---

### Requirement: AI Assistant Panel State Persistence

The system SHALL persist AI assistant panel state to localStorage.

#### Scenario: Save AI panel visibility state
- **WHEN** AI panel visibility changes
- **THEN** system SHALL save the visibility state to localStorage
- **AND** state SHALL indicate whether panel is visible or hidden

#### Scenario: Save AI panel width
- **WHEN** user adjusts AI panel width
- **THEN** system SHALL save the width to localStorage
- **AND** default width SHALL be 300

#### Scenario: Save AI panel collapsed state
- **WHEN** user collapses or expands AI panel
- **THEN** system SHALL save the collapsed state to localStorage
- **AND** default collapsed state SHALL be false

#### Scenario: Restore AI panel state
- **WHEN** loading AI panel
- **THEN** system SHALL restore the saved width and collapsed state
- **AND** if no saved state exists, system SHALL use defaults

---

### Requirement: AI Assistant Panel Toggle

The system SHALL provide a method to toggle the AI assistant panel visibility.

#### Scenario: Toggle AI panel on
- **WHEN** user calls toggleAIAssistantPanel() method
- **AND** AI panel is currently hidden
- **THEN** system SHALL display the AI assistant panel

#### Scenario: Toggle AI panel off
- **WHEN** user calls toggleAIAssistantPanel() method
- **AND** AI panel is currently visible
- **THEN** system SHALL hide the AI assistant panel
- **AND** system SHALL save the hidden state to localStorage

---

### Requirement: Responsive Layout Management

The system SHALL manage responsive layout changes for AI assistant panel.

#### Scenario: Switch to mobile layout
- **WHEN** screen width becomes less than 768px
- **THEN** system SHALL switch AI panel to drawer mode
- **AND** system SHALL hide side panel
- **AND** system SHALL display bottom button for AI panel

#### Scenario: Switch to desktop layout
- **WHEN** screen width becomes 768px or more
- **THEN** system SHALL switch AI panel to side panel mode
- **AND** system SHALL hide bottom button
- **AND** system SHALL restore side panel visibility based on saved state

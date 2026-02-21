## ADDED Requirements

### Requirement: Timeline panel display
The system SHALL display a timeline panel on the right side of the paragraph editor when viewing a chapter.

#### Scenario: Timeline panel appears when viewing chapter
- **WHEN** user opens a chapter in the editor
- **THEN** system displays a timeline panel on the right side of the paragraph editor

#### Scenario: Timeline panel shows nodes for each paragraph
- **WHEN** a chapter has multiple paragraphs
- **THEN** each paragraph is represented as a node in the timeline panel
- **AND** nodes are displayed in sequential order matching paragraph order

### Requirement: Timeline panel expand and collapse
The system SHALL allow users to expand and collapse the timeline panel.

#### Scenario: Collapse timeline panel
- **WHEN** user clicks the collapse button on the timeline panel
- **THEN** timeline panel collapses to a minimized state
- **AND** only a toggle button remains visible
- **AND** paragraph editor width increases to fill available space

#### Scenario: Expand timeline panel
- **WHEN** user clicks the toggle button on a collapsed timeline panel
- **THEN** timeline panel expands to full width (300px default)
- **AND** panel content becomes visible
- **AND** paragraph editor width adjusts accordingly

#### Scenario: Persist panel state
- **WHEN** user expands or collapses the timeline panel
- **THEN** system saves the panel state to localStorage
- **AND** when user returns to the chapter, the panel state is restored

### Requirement: Timeline node navigation
The system SHALL allow users to navigate from timeline nodes to corresponding paragraphs.

#### Scenario: Click node to scroll to paragraph
- **WHEN** user clicks on a timeline node
- **THEN** paragraph editor scrolls to the corresponding paragraph
- **AND** the paragraph is highlighted briefly (visual feedback)
- **AND** the timeline node becomes active (different styling)

#### Scenario: Active node highlights current paragraph
- **WHEN** user scrolls the paragraph editor
- **THEN** system updates the active timeline node based on currently visible paragraph
- **AND** the active node is visually distinguished from other nodes

### Requirement: Timeline content filtering
The system SHALL allow users to filter timeline content by change type.

#### Scenario: Show all changes
- **WHEN** user selects "All" filter
- **THEN** timeline nodes display both character and item changes
- **AND** nodes with no changes are shown with default styling

#### Scenario: Show only character changes
- **WHEN** user selects "Characters" filter
- **THEN** timeline nodes only display character changes
- **AND** nodes with only item changes are hidden or dimmed

#### Scenario: Show only item changes
- **WHEN** user selects "Items" filter
- **THEN** timeline nodes only display item changes
- **AND** nodes with only character changes are hidden or dimmed

#### Scenario: Persist filter selection
- **WHEN** user changes the timeline filter
- **THEN** system saves the filter selection to localStorage
- **AND** when user returns, the same filter is active

### Requirement: Timeline panel styling
The system SHALL style the timeline panel according to the current theme.

#### Scenario: Light theme styling
- **WHEN** application is in light theme
- **THEN** timeline panel uses light background colors
- **AND** text uses dark colors for readability

#### Scenario: Dark theme styling
- **WHEN** application is in dark theme
- **THEN** timeline panel uses dark background colors
- **AND** text uses light colors for readability

#### Scenario: Theme change updates styling
- **WHEN** user toggles between themes
- **THEN** timeline panel immediately updates to match new theme

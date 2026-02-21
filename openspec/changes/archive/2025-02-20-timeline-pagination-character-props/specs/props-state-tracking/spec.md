## ADDED Requirements

### Requirement: Item state changes display
The system SHALL display item state changes in timeline nodes based on paragraph changes.

#### Scenario: Display item acquisition
- **WHEN** a paragraph records a character acquiring an item
- **THEN** the timeline node displays the item name
- **AND** shows which character acquired the item
- **AND** displays a "new" indicator (e.g., green "+" icon)

#### Scenario: Display item loss
- **WHEN** a paragraph records a character losing an item
- **THEN** the timeline node displays the item name
- **AND** shows which character lost the item
- **AND** displays a "removed" indicator (e.g., red "-" icon)

#### Scenario: Display item modification
- **WHEN** a paragraph records an item being modified (e.g., damaged, upgraded)
- **THEN** the timeline node displays the item name
- **AND** shows the modification details
- **AND** displays a "modified" indicator (e.g., blue "~" icon)

#### Scenario: Multiple items in one paragraph
- **WHEN** a paragraph affects multiple items
- **THEN** the timeline node displays all affected items
- **AND** each item's changes are listed separately

#### Scenario: Node without item changes
- **WHEN** a paragraph has no item changes
- **THEN** the timeline node displays a default state icon
- **AND** indicates no item changes

### Requirement: Item location tracking
The system SHALL track and display item location changes.

#### Scenario: Item transferred between characters
- **WHEN** a paragraph records an item moving from one character to another
- **THEN** the timeline node displays the transfer
- **AND** shows both the source and destination characters
- **AND** uses a transfer indicator (e.g., arrow icon)

#### Scenario: Item placed in location
- **WHEN** a paragraph records an item being placed in a specific location
- **THEN** the timeline node displays the location
- **AND** shows the item's new status

#### Scenario: Item picked up from location
- **WHEN** a paragraph records an item being picked up from a location
- **THEN** the timeline node displays the location
- **AND** shows which character picked up the item

### Requirement: Item change details view
The system SHALL allow users to view detailed item state changes.

#### Scenario: Expand node for details
- **WHEN** user clicks on a timeline node containing item changes
- **THEN** the node expands to show detailed change information
- **AND** displays all item changes with full context

#### Scenario: View item properties
- **WHEN** a node is expanded showing item changes
- **THEN** system displays relevant item properties (type, description, current owner)
- **AND** shows the change in properties if modified

### Requirement: Item change data structure
The system SHALL use the paragraph's `changes.items` array to store item state changes.

#### Scenario: Read item changes from paragraph
- **WHEN** rendering a timeline node for a paragraph
- **THEN** system reads the `changes.items` array from the paragraph data
- **AND** displays the changes according to the data structure

#### Scenario: Handle missing changes field
- **WHEN** a paragraph does not have a `changes.items` field (legacy data)
- **THEN** system treats it as having no item changes
- **AND** displays default node styling

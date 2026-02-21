# Props State Tracking Specification - Delta

## MODIFIED Requirements

### Requirement: Item state changes display
The system SHALL display item state changes in timeline nodes based on paragraph changes, and ensure item ownership is synchronized with character held items.

#### Scenario: Display item acquisition
- **WHEN** a paragraph records a character acquiring an item
- **THEN** timeline node displays item name
- **AND** shows which character acquired item
- **AND** displays a "new" indicator (e.g., green "+" icon)
- **AND** system adds item to character's `heldItems` array

#### Scenario: Display item loss
- **WHEN** a paragraph records a character losing an item
- **THEN** timeline node displays item name
- **AND** shows which character lost item
- **AND** displays a "removed" indicator (e.g., red "-" icon)
- **AND** system removes item from character's `heldItems` array

#### Scenario: Display item modification
- **WHEN** a paragraph records an item being modified (e.g., damaged, upgraded)
- **THEN** timeline node displays item name
- **AND** shows modification details
- **AND** displays a "modified" indicator (e.g., blue "~" icon)

#### Scenario: Multiple items in one paragraph
- **WHEN** a paragraph affects multiple items
- **THEN** timeline node displays all affected items
- **AND** each item's changes are listed separately

#### Scenario: Node without item changes
- **WHEN** a paragraph has no item changes
- **THEN** timeline node displays a default state icon
- **AND** indicates no item changes

### Requirement: Item location tracking
The system SHALL track and display item location changes, and synchronize with character held items when ownership changes.

#### Scenario: Item transferred between characters
- **WHEN** a paragraph records an item moving from one character to another
- **THEN** timeline node displays transfer
- **AND** shows both source and destination characters
- **AND** uses transfer indicator (e.g., arrow icon)
- **AND** system removes item from source character's `heldItems`
- **AND** system adds item to destination character's `heldItems`
- **AND** updates item's `owner` field to destination character ID

#### Scenario: Item placed in location
- **WHEN** a paragraph records an item being placed in a specific location
- **THEN** timeline node displays location
- **AND** shows item's new status
- **AND** system removes item from character's `heldItems` (if previously held)
- **AND** sets item's `owner` field to null

#### Scenario: Item picked up from location
- **WHEN** a paragraph records an item being picked up from a location
- **THEN** timeline node displays location
- **AND** shows which character picked up item
- **AND** system adds item to character's `heldItems`
- **AND** sets item's `owner` field to character ID

### Requirement: Item change data structure
The system SHALL use paragraph's `changes.items` array to store item state changes, and synchronize with character `heldItems` arrays.

#### Scenario: Read item changes from paragraph
- **WHEN** rendering a timeline node for a paragraph
- **THEN** system reads `changes.items` array from paragraph data
- **AND** displays changes according to data structure

#### Scenario: Handle missing changes field
- **WHEN** a paragraph does not have a `changes.items` field (legacy data)
- **THEN** system treats it as having no item changes
- **AND** displays default node styling

#### Scenario: Update item ownership
- **WHEN** item's `owner` field is changed
- **THEN** system updates character's `heldItems` array accordingly
- **AND** removes item from previous owner's `heldItems` (if exists)
- **AND** adds item to new owner's `heldItems` (if not null)

## ADDED Requirements

### Requirement: Props item assignment
The system SHALL provide methods to assign items to characters with automatic synchronization of `heldItems` arrays.

#### Scenario: Assign item to character successfully
- **WHEN** calling `PropsManager.setItemOwner(itemId, characterId)`
- **THEN** system updates item's `owner` field to `characterId`
- **AND** system adds `itemId` to character's `heldItems` array
- **AND** removes `itemId` from previous owner's `heldItems` (if any)
- **AND** persists all changes

#### Scenario: Unassign item from character
- **WHEN** calling `PropsManager.setItemOwner(itemId, null)`
- **THEN** system sets item's `owner` field to null
- **AND** system removes `itemId` from current owner's `heldItems`
- **AND** persists changes

#### Scenario: Assign item already owned by same character
- **WHEN** calling `setItemOwner` with same character ID
- **THEN** system does nothing
- **AND** returns success without error

#### Scenario: Transfer item between characters
- **WHEN** calling `PropsManager.setItemOwner(itemId, newCharacterId)` where item has current owner
- **THEN** system updates item's `owner` to new character ID
- **AND** removes `itemId` from old character's `heldItems`
- **AND** adds `itemId` to new character's `heldItems`

### Requirement: Props state summary
The system SHALL generate paragraph state summary showing only items held by characters present in the paragraph.

#### Scenario: Generate summary for paragraph with items
- **WHEN** generating state summary for a paragraph
- **THEN** system identifies characters in `changes.characters` array
- **AND** displays only items held by those characters
- **AND** shows item names, types, and properties

#### Scenario: Exclude items not held by present characters
- **WHEN** generating state summary
- **THEN** system excludes items held by characters not in `changes.characters`
- **AND** does not display items with no owner or in locations

#### Scenario: Generate summary for paragraph without characters
- **WHEN** generating state summary for a paragraph with no character changes
- **THEN** system displays "No items in this paragraph" message
- **AND** does not show any item states

### Requirement: Validate items-character consistency
The system SHALL validate consistency between item `owner` fields and character `heldItems` arrays.

#### Scenario: Detect inconsistent data
- **WHEN** checking consistency between items and characters
- **THEN** system identifies items where `owner` doesn't match `heldItems`
- **AND** reports inconsistencies to user
- **AND** provides repair option

#### Scenario: Auto-repair inconsistent data
- **WHEN** user triggers data repair
- **THEN** system rebuilds `heldItems` arrays based on item `owner` fields
- **AND** ensures all item-owner relationships are consistent
- **AND** persists repaired data

## API

```javascript
class PropsManager {
    // Existing methods...
    getItemChanges(paragraphId: string): Array<ItemChange>;
    addItemChange(paragraphId: string, change: ItemChange): void;
    updateItemChange(paragraphId: string, change: ItemChange): void;
    deleteItemChange(paragraphId: string, itemId: string): void;
    getItemStateAtParagraph(paragraphId: string, itemId: string): ItemState;

    /**
     * Set item owner and synchronize with character's heldItems
     * @param {string} itemId - Item ID
     * @param {string|null} characterId - Character ID or null to unassign
     */
    setItemOwner(itemId: string, characterId: string | null): void;

    /**
     * Validate consistency between item.owner and character.heldItems
     * @returns {Array<{itemId: string, issue: string}>} List of inconsistencies
     */
    validateItemsConsistency(): Array<{itemId: string, issue: string}>;

    /**
     * Repair inconsistent item-owner relationships
     */
    repairItemsConsistency(): void;
}
```

## Dependencies
- `state`: 应用状态管理器
- `localStorage`: 用于持久化道具变化数据
- `character-state-tracking`: 角色状态跟踪功能，需要同步 `heldItems`

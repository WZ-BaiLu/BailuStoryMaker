# Character Held Items Specification

## Purpose
提供角色持有道具管理功能，记录角色当前持有的道具列表，并支持道具的分配、转移和查询。

## ADDED Requirements

### Requirement: Character held items field
The system SHALL support a `heldItems` field in the Character data structure to track items currently held by a character.

#### Scenario: Character with held items
- **WHEN** loading a character with `heldItems` field
- **THEN** system parses the array of item IDs
- **AND** stores the list in character object

#### Scenario: Character without heldItems field (legacy data)
- **WHEN** loading a character without `heldItems` field
- **THEN** system initializes `heldItems` as an empty array `[]`
- **AND** character can be used normally

#### Scenario: Character with empty heldItems
- **WHEN** a character has no held items
- **THEN** `heldItems` field is an empty array
- **AND** character is considered to hold no items

### Requirement: Get held items for character
The system SHALL provide a method to retrieve the list of items held by a character.

#### Scenario: Get held items successfully
- **WHEN** calling `CharacterManager.getHeldItems(characterId)`
- **THEN** system returns array of item IDs
- **AND** array is sorted in the order items were acquired

#### Scenario: Get held items for non-existent character
- **WHEN** calling `getHeldItems` with invalid character ID
- **THEN** system returns empty array
- **AND** does not throw error

#### Scenario: Get held items for character with no items
- **WHEN** calling `getHeldItems` for a character with no held items
- **THEN** system returns empty array `[]`

### Requirement: Add item to character
The system SHALL provide a method to assign an item to a character.

#### Scenario: Add item successfully
- **WHEN** calling `CharacterManager.addItemToCharacter(characterId, itemId)`
- **THEN** system adds `itemId` to character's `heldItems` array
- **AND** updates item's `owner` field to `characterId`
- **AND** persists changes to storage

#### Scenario: Add item already held by character
- **WHEN** calling `addItemToCharacter` with an item already in character's `heldItems`
- **THEN** system does not add duplicate entry
- **AND** returns success without error

#### Scenario: Add item held by another character
- **WHEN** calling `addItemToCharacter` with an item already held by another character
- **THEN** system removes item from previous character's `heldItems`
- **AND** adds item to new character's `heldItems`
- **AND** updates item's `owner` to new character ID

#### Scenario: Add invalid item
- **WHEN** calling `addItemToCharacter` with invalid item ID
- **THEN** system throws error
- **AND** does not modify character data

### Requirement: Remove item from character
The system SHALL provide a method to remove an item from a character's inventory.

#### Scenario: Remove item successfully
- **WHEN** calling `CharacterManager.removeItemFromCharacter(characterId, itemId)`
- **THEN** system removes `itemId` from character's `heldItems` array
- **AND** sets item's `owner` field to null
- **AND** persists changes to storage

#### Scenario: Remove item not held by character
- **WHEN** calling `removeItemFromCharacter` with an item not in character's `heldItems`
- **THEN** system does nothing
- **AND** returns success without error

#### Scenario: Remove last item from character
- **WHEN** removing the last item from character's `heldItems`
- **THEN** system sets `heldItems` to empty array `[]`
- **AND** character can still acquire new items

### Requirement: Transfer item between characters
The system SHALL support transferring an item from one character to another.

#### Scenario: Transfer item successfully
- **WHEN** calling `CharacterManager.transferItem(itemId, fromCharacterId, toCharacterId)`
- **THEN** system removes `itemId` from `fromCharacterId`'s `heldItems`
- **AND** adds `itemId` to `toCharacterId`'s `heldItems`
- **AND** updates item's `owner` to `toCharacterId`
- **AND** persists all changes

#### Scenario: Transfer item to same character
- **WHEN** calling `transferItem` where `fromCharacterId` equals `toCharacterId`
- **THEN** system does nothing
- **AND** returns success without error

#### Scenario: Transfer non-existent item
- **WHEN** calling `transferItem` with invalid item ID
- **THEN** system throws error
- **AND** does not modify any character data

### Requirement: Validate character-items consistency
The system SHALL validate consistency between item `owner` field and character `heldItems` arrays.

#### Scenario: Validate consistent data
- **WHEN** checking data where item `owner` matches character `heldItems`
- **THEN** system confirms data is consistent
- **AND** no action is needed

#### Scenario: Detect inconsistent data (item owner not in heldItems)
- **WHEN** item's `owner` field points to a character but item ID not in that character's `heldItems`
- **THEN** system detects inconsistency
- **AND** can provide repair functionality

#### Scenario: Detect inconsistent data (item in heldItems but owner mismatch)
- **WHEN** item ID is in character's `heldItems` but item's `owner` points to different character
- **THEN** system detects inconsistency
- **AND** can provide repair functionality

#### Scenario: Auto-repair inconsistent data
- **WHEN** triggering data repair
- **THEN** system rebuilds `heldItems` arrays based on item `owner` fields
- **AND** ensures all item-owner relationships are consistent

### Requirement: Display held items in character editor
The system SHALL display the list of items held by a character in the character editor UI.

#### Scenario: Display held items list
- **WHEN** opening character editor for a character with held items
- **THEN** UI displays list of item names
- **AND** each item shows its properties (type, description)
- **AND** list is ordered by acquisition time

#### Scenario: Display empty held items
- **WHEN** opening character editor for a character with no held items
- **THEN** UI displays "No items held" message
- **AND** provides option to assign items

#### Scenario: Click item to view details
- **WHEN** user clicks on an item in held items list
- **THEN** UI shows item details panel
- **AND** displays item properties, description, and owner information

### Requirement: Assign items to character via UI
The system SHALL allow users to assign items to a character through the user interface.

#### Scenario: Drag and drop item to character
- **WHEN** user drags an item from items list to character
- **THEN** item is added to character's `heldItems`
- **AND** item's `owner` is updated
- **AND** UI reflects the change

#### Scenario: Select item from dropdown
- **WHEN** user selects an item from "Add Item" dropdown in character editor
- **THEN** selected item is added to character's `heldItems`
- **AND** item's `owner` is updated
- **AND** UI displays the new item in held items list

#### Scenario: Remove item from character via UI
- **WHEN** user clicks "Remove" button on an item in held items list
- **THEN** item is removed from character's `heldItems`
- **AND** item's `owner` is set to null
- **AND** UI updates to reflect removal

## API

```javascript
class CharacterManager {
    /**
     * Get items held by a character
     * @param {string} characterId - Character ID
     * @returns {string[]} Array of item IDs
     */
    getHeldItems(characterId: string): string[];

    /**
     * Add an item to a character's inventory
     * @param {string} characterId - Character ID
     * @param {string} itemId - Item ID
     */
    addItemToCharacter(characterId: string, itemId: string): void;

    /**
     * Remove an item from a character's inventory
     * @param {string} characterId - Character ID
     * @param {string} itemId - Item ID
     */
    removeItemFromCharacter(characterId: string, itemId: string): void;

    /**
     * Transfer an item from one character to another
     * @param {string} itemId - Item ID
     * @param {string} fromCharacterId - Source character ID
     * @param {string} toCharacterId - Destination character ID
     */
    transferItem(itemId: string, fromCharacterId: string, toCharacterId: string): void;

    /**
     * Validate consistency between item.owner and character.heldItems
     * @returns {boolean} True if data is consistent
     */
    validateItemsConsistency(): boolean;

    /**
     * Repair inconsistent item-owner relationships
     */
    repairItemsConsistency(): void;
}

interface Character {
    id: string;
    name: string;
    description: string;
    attributes: {
        base: Record<string, number>;
        current: Record<string, number>;
    };
    abilities: Array<{
        name: string;
        description: string;
        level: number;
        acquiredAt: string;
        evolutionHistory: Array<any>;
    }>;
    notes: string;
    heldItems: string[]; // NEW FIELD
}
```

## Dependencies
- `state`: 应用状态管理器
- `localStorage`: 用于持久化角色和道具数据
- `props-state-tracking`: 道具状态跟踪功能

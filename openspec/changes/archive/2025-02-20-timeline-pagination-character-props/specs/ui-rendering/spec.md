## MODIFIED Requirements

### Requirement: UR-2: Paragraph Rendering
应渲染段落列表，每个段落显示为气泡形式
- 应支持段落内容编辑
- 应支持段落删除
- 应显示段落编号
- 应显示段落关联的修改（角色、物品）
- 空状态时显示提示信息
- **应渲染段落与时间线节点的视觉连接线**，显示段落对应关系

### Requirement: Timeline Panel Rendering
系统应在段落编辑器右侧渲染时间线分页面板。

#### Scenario: Render timeline panel container
- **WHEN** rendering chapter editor
- **THEN** system renders timeline panel container on the right side
- **AND** panel width is 300px by default
- **AND** panel can be expanded or collapsed

#### Scenario: Render timeline nodes
- **WHEN** timeline panel is visible and chapter has paragraphs
- **THEN** system renders a timeline node for each paragraph
- **AND** nodes are displayed in sequential order
- **AND** each node shows summary of changes (if any)

#### Scenario: Render node with character changes
- **WHEN** a paragraph has character changes
- **THEN** timeline node displays character names
- **AND** shows visual indicators for change types (new/modified/removed)
- **AND** color-codes character changes (e.g., blue for characters)

#### Scenario: Render node with item changes
- **WHEN** a paragraph has item changes
- **THEN** timeline node displays item names
- **AND** shows visual indicators for change types (acquire/lose/transfer)
- **AND** color-codes item changes (e.g., green for items)

#### Scenario: Render node with both character and item changes
- **WHEN** a paragraph has both character and item changes
- **THEN** timeline node displays both types
- **AND** shows character changes first
- **AND** shows item changes below character changes

#### Scenario: Render node without changes
- **WHEN** a paragraph has no changes
- **THEN** timeline node displays a default icon
- **AND** shows paragraph number
- **AND** uses neutral styling

#### Scenario: Render active node
- **WHEN** a paragraph is currently selected or visible in viewport
- **THEN** corresponding timeline node is highlighted
- **AND** active node has distinct styling (e.g., bold border, different background)

#### Scenario: Render filter controls
- **WHEN** timeline panel is visible
- **THEN** system renders filter controls (All, Characters, Items)
- **AND** currently selected filter is visually distinguished
- **AND** clicking a filter updates node visibility

#### Scenario: Render collapse/expand toggle
- **WHEN** timeline panel is rendered
- **THEN** system renders collapse button (when expanded)
- **AND** system renders expand button (when collapsed)
- **AND** button shows current state icon

### Requirement: Timeline Theme Adaptation
时间线面板应适配当前主题。

#### Scenario: Apply light theme to timeline
- **WHEN** application theme is light
- **THEN** timeline panel uses light background color
- **AND** text uses dark color
- **AND** borders use subtle gray

#### Scenario: Apply dark theme to timeline
- **WHEN** application theme is dark
- **THEN** timeline panel uses dark background color
- **AND** text uses light color
- **AND** borders use subtle light gray

#### Scenario: Update styling on theme change
- **WHEN** user toggles theme
- **THEN** timeline panel styling updates immediately
- **AND** all timeline elements reflect new theme colors

### Requirement: Timeline Responsive Behavior
时间线面板应支持响应式布局。

#### Scenario: Collapse on mobile
- **WHEN** screen width < 768px
- **THEN** timeline panel defaults to collapsed state
- **AND** toggle button remains accessible

#### Scenario: Adjust width on desktop
- **WHEN** user resizes browser window on desktop
- **THEN** timeline panel maintains fixed width (300px)
- **AND** paragraph editor width adjusts to fill remaining space

## API

```javascript
class UIRenderer {
    // ... existing methods ...

    // NEW: Timeline rendering
    renderTimelinePanel(): void;
    renderTimelineNodes(paragraphs: Array): void;
    renderTimelineNode(paragraph: object, index: number): string;
    renderTimelineControls(): void;
    renderTimelineFilters(): void;
    renderTimelineToggle(): void;

    // NEW: Timeline interaction
    scrollToParagraph(paragraphId: string): void;
    highlightTimelineNode(paragraphId: string): void;
    updateActiveNodeOnScroll(): void;

    // NEW: Timeline state
    loadTimelineState(): object;
    saveTimelineState(): void;
}
```

## Data Models

```typescript
// NEW: Timeline node model
interface TimelineNode {
    id: string;
    paragraphIndex: number;
    changes: {
        characters: Array<CharacterChange>;
        items: Array<ItemChange>;
    };
    isActive: boolean;
}

// NEW: Timeline panel state model
interface TimelineState {
    isExpanded: boolean;
    filter: 'all' | 'characters' | 'items';
    width: number;
}

// NEW: Character change display model
interface CharacterChange {
    characterId: string;
    characterName: string;
    type: 'new' | 'modified' | 'removed';
    details: {
        attributes?: Record<string, string>;
        emotionalState?: string;
    };
}

// NEW: Item change display model
interface ItemChange {
    itemId: string;
    itemName: string;
    type: 'acquire' | 'lose' | 'transfer' | 'modify';
    details: {
        characterId?: string;
        location?: string;
    };
}
```

## Dependencies
- `app`: 主应用实例
- `state`: 应用状态管理器
- `i18n`: 国际化管理器
- `Constants`: 常量定义
- **localStorage**: 用于持久化时间线面板状态

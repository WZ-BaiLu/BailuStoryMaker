# UI Rendering Specification

## Purpose
提供各个视图的渲染逻辑，将渲染逻辑从 App 类中分离，提高代码的可维护性和可测试性。

## Requirements

### UR-1: Story View Rendering
- 应渲染章节列表，按 `order` 排序
- 应显示章节标题和顺序号
- 应支持选择章节并显示编辑器
- 应支持删除章节
- 应渲染章节编辑器，包括标题输入和段落列表

### UR-2: Paragraph Rendering
- 应渲染段落列表，每个段落显示为气泡形式
- 应支持段落内容编辑
- 应支持段落删除
- 应显示段落编号
- 应显示段落关联的修改（角色、物品）
- 空状态时显示提示信息

### UR-2.1: Timeline Panel Rendering
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

### UR-2.2: Timeline Theme Adaptation
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

### UR-2.3: Timeline Responsive Behavior
时间线面板应支持响应式布局。

#### Scenario: Collapse on mobile
- **WHEN** screen width < 768px
- **THEN** timeline panel defaults to collapsed state
- **AND** toggle button remains accessible

#### Scenario: Adjust width on desktop
- **WHEN** user resizes browser window on desktop
- **THEN** timeline panel maintains fixed width (300px)
- **AND** paragraph editor width adjusts to fill remaining space

### UR-3: Character View Rendering
- 应渲染角色列表
- 应显示角色名称
- 应支持选择角色并显示编辑器
- 应支持删除角色
- 应渲染角色编辑器，包括名称、描述、备注、属性和能力

### UR-4: Attribute/Ability Rendering
- 应渲染属性列表，每个属性包含名称和值
- 应支持添加新属性
- 应支持删除属性
- 应渲染能力列表，每个能力包含名称、等级和描述
- 应支持添加新能力
- 应支持删除能力

### UR-5: Item View Rendering
- 应渲染物品列表
- 应显示物品名称和类型标签
- 应支持选择物品并显示编辑器
- 应支持删除物品
- 应渲染物品编辑器，包括名称、类型、描述和属性

### UR-6: Setting View Rendering
- 应渲染设置列表
- 应显示设置名称和类型标签
- 应支持选择设置并显示编辑器
- 应支持删除设置
- 应渲染设置编辑器，包括名称、类型、父级和描述

### UR-7: Prompt View Rendering
- 应渲染章节选择下拉框
- 应渲染模板选择下拉框
- 应渲染生成的提示词文本域
- 应支持复制提示词到剪贴板

### UR-8: Empty State Handling
- 当列表为空时，应显示相应的空状态提示
- 空状态应包含图标和文本说明

## API

```javascript
class UIRenderer {
    constructor(app, state);
    renderChapters(): void;
    renderChapterEditor(chapterId): void;
    renderParagraphs(): void;
    renderCharacters(): void;
    renderCharacterEditor(characterId): void;
    renderAttributes(attributes): void;
    renderAbilities(abilities): void;
    renderItems(): void;
    renderItemEditor(itemId): void;
    renderItemProperties(properties): void;
    renderSettings(): void;
    renderSettingEditor(settingId): void;
    renderPromptOptions(): void;

    // Timeline rendering
    renderTimelinePanel(): void;
    renderTimelineNodes(paragraphs: Array): void;
    renderTimelineNode(paragraph: object, index: number): string;
    renderTimelineControls(): void;
    renderTimelineToggle(): void;

    // Timeline interaction
    scrollToParagraph(paragraphId: string): void;
    highlightTimelineNode(paragraphId: string): void;
    updateActiveNodeOnScroll(): void;

    // Timeline state
    loadTimelineState(): object;
    saveTimelineState(): void;
}
```

## Dependencies
- `app`: 主应用实例
- `state`: 应用状态管理器
- `i18n`: 国际化管理器
- `Constants`: 常量定义
- `localStorage`: 用于持久化时间线面板状态

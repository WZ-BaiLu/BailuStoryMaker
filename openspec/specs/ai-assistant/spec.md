# AI Assistant Specification

## Purpose
提供 AI 辅助写作功能，包括聊天界面、响应管理、内容插入等用户交互功能。

## Requirements

### AAR-1: Display AI Assistant Panel
- 系统应在用户编辑章节时在章节编辑器右侧显示 AI 助手面板
- 默认宽度应为 300px
- 未选择章节时或切换到非 story 视图时应隐藏面板

### AAR-2: AI Panel Adjustable Width
- 用户可通过拖动调整手柄调整面板宽度
- 宽度限制：最小 200px，最大 600px
- 宽度状态应保存到 localStorage 并在重新打开时恢复

### AAR-3: AI Panel Collapsible
- 用户可折叠/展开 AI 面板
- 折叠时只显示展开/设置按钮
- 折叠状态应保存到 localStorage

### AAR-4: Responsive Layout for Mobile
- 屏幕宽度 < 768px 时，AI 面板以底部抽屉方式显示
- 屏幕宽度 >= 768px 时，AI 面板以侧边栏方式显示
- 移动端显示底部按钮打开抽屉，点击外部或关闭按钮关闭抽屉

### AAR-5: AI Chat Interface
- 提供聊天界面与 AI 交互
- 用户消息和 AI 消息有不同的样式
- 消息按时间顺序显示（最旧的在顶部）
- 显示消息时间戳

### AAR-6: Loading State Indicator
- 等待 AI 响应时显示加载指示器
- 根据当前语言显示 "AI正在思考..." 或 "AI is thinking..."
- 收到响应或错误时移除指示器

### AAR-7: Insert AI Response to Editor
- AI 响应下方显示"插入到编辑器"按钮
- 有选中的段落时：插入到该段落之前
- 正在编辑段落时：插入到该段落之前
- 否则：插入到末尾作为新段落

### AAR-8: Clear Chat History
- 提供清除聊天历史功能
- 清空前显示确认对话框
- 为每个章节维护独立的聊天历史

### AAR-9: Chat History Per Chapter
- 为每个章节维护独立的聊天历史
- 切换章节时保存当前历史并加载新章节的历史
- 历史保存到 localStorage

### AAR-10: Configuration Settings Button
- 面板头部显示设置按钮 (⚙️ 图标)
- 配置无效或 API Key 缺失时显示红色警告徽章
- 点击打开 AI 配置模态框

### AAR-11: Auto-scroll to Latest Message
- 发送消息或收到 AI 响应时自动滚动到底部显示最新消息

### AAR-12: Copy AI Response
- AI 响应下方显示"复制"按钮
- 复制成功或失败时显示通知

### AAR-13: Error Display in Chat
- AI 请求失败时在聊天区域显示错误消息
- 网络错误：显示 "网络连接失败，请检查网络"
- API 错误：显示具体错误消息和可操作的建议
- 可重试的错误显示"重试"按钮

### AAR-14: Character Counter for Input
- 显示用户输入的字符计数
- 超过 2000 字符时改变计数器颜色
- 最大限制 4000 字符，超过时阻止发送

### AAR-15: AI Character State Update Tool
The system SHALL provide an AI tool to update character states based on story content.

#### Scenario: AI updates character attribute
- **WHEN** AI invokes `updateCharacterState` tool
- **THEN** system updates specified character's attributes
- **AND** records change in paragraph's `changes.characters` array
- **AND** notifies user of update

#### Scenario: AI updates character emotional state
- **WHEN** AI invokes `updateCharacterState` tool with emotional state
- **THEN** system updates character's emotional state
- **AND** records change in paragraph's `changes.characters` array

#### Scenario: AI updates multiple characters
- **WHEN** AI invokes `updateCharacterState` tool for multiple characters
- **THEN** system updates each character's state
- **AND** records all changes in paragraph's `changes.characters` array

### AAR-16: AI Item State Update Tool
The system SHALL provide an AI tool to update item states based on story content.

#### Scenario: AI records item acquisition
- **WHEN** AI invokes `updateItemState` tool with "acquire" action
- **THEN** system records item being acquired by a character
- **AND** adds to change to paragraph's `changes.items` array

#### Scenario: AI records item loss
- **WHEN** AI invokes `updateItemState` tool with "lose" action
- **THEN** system records item being lost by a character
- **AND** adds change to paragraph's `changes.items` array

#### Scenario: AI records item transfer
- **WHEN** AI invokes `updateItemState` tool with "transfer" action
- **THEN** system records item transfer between characters or locations
- **AND** adds change to paragraph's `changes.items` array

### AAR-17: AI Tool Parameter Validation
The system SHALL validate AI tool parameters before applying changes.

#### Scenario: Validate character ID
- **WHEN** AI invokes `updateCharacterState` with an invalid character ID
- **THEN** system returns an error
- **AND** does not apply any changes

#### Scenario: Validate item ID
- **WHEN** AI invokes `updateItemState` with an invalid item ID
- **THEN** system returns an error
- **AND** does not apply any changes

#### Scenario: Validate paragraph ID
- **WHEN** AI invokes state update tools without specifying a paragraph ID
- **THEN** system uses current selected paragraph
- **AND** if no paragraph is selected, returns an error

### AAR-18: AI State Change Notification
The system SHALL notify users when AI makes state changes.

#### Scenario: Notify on character state update
- **WHEN** AI successfully updates character state
- **THEN** system displays a success notification
- **AND** shows summary of changes (e.g., "Updated health of Character A: +10")

#### Scenario: Notify on item state update
- **WHEN** AI successfully updates item state
- **THEN** system displays a success notification
- **AND** shows summary of changes (e.g., "Character A acquired Sword")

#### Scenario: Notify on validation error
- **WHEN** AI tool validation fails
- **THEN** system displays an error notification
- **AND** provides details about validation failure

### AAR-18: Character Information in Prompts
The system SHALL include character information in AI prompts, including held items.

#### Scenario: Include character attributes and abilities
- **WHEN** generating AI prompt for a paragraph
- **THEN** system includes character's name, description
- **AND** includes character's current attributes
- **AND** includes character's abilities and their levels

#### Scenario: Include character held items
- **WHEN** generating AI prompt for a paragraph
- **THEN** system includes character's held items
- **AND** lists item names, types, and key properties
- **AND** indicates which items are available to character

#### Scenario: Include character emotional state
- **WHEN** generating AI prompt for a paragraph
- **THEN** system includes character's current emotional state
- **AND** provides context for character behavior

#### Scenario: Include multiple characters
- **WHEN** multiple characters are present in a paragraph
- **THEN** system includes information for each character
- **AND** organizes information by character ID
- **AND** shows each character's held items separately

### AAR-19: Props Information in Prompts
The system SHALL include props information in AI prompts, focusing on items held by present characters.

#### Scenario: Include items held by present characters
- **WHEN** generating AI prompt for a paragraph
- **THEN** system includes items held by characters in `changes.characters`
- **AND** provides item details (name, type, properties, description)
- **AND** excludes items held by non-present characters

#### Scenario: Include item ownership context
- **WHEN** including item information in prompts
- **THEN** system indicates which character holds each item
- **AND** shows item's current owner
- **AND** provides item's acquisition history if relevant

#### Scenario: Exclude items not relevant to paragraph
- **WHEN** generating AI prompt for a paragraph
- **THEN** system excludes items not held by present characters
- **AND** does not include items with no owner
- **AND** does not include items in locations (unless relevant to paragraph)

### AAR-20: Context-Aware Prompt Generation
The system SHALL generate context-aware prompts based on paragraph changes.

#### Scenario: Generate prompt for character interaction paragraph
- **WHEN** a paragraph involves multiple characters interacting
- **THEN** system includes all present characters' information
- **AND** includes items held by each character
- **AND** highlights potential item-related interactions

#### Scenario: Generate prompt for combat paragraph
- **WHEN** a paragraph involves combat or action
- **THEN** system includes character's combat-related abilities
- **AND** includes weapons and equipment from `heldItems`
- **AND** provides item properties relevant to combat (attack, defense, etc.)

#### Scenario: Generate prompt for puzzle-solving paragraph
- **WHEN** a paragraph involves puzzle or mystery
- **THEN** system includes key items from `heldItems`
- **AND** provides item descriptions that might be relevant to puzzle
- **AND** suggests potential item combinations or uses

### AAR-21: Held Items in Prompt Context
The system SHALL provide structured held items information in AI prompts.

#### Scenario: Format held items in prompt
- **WHEN** including held items in prompt
- **THEN** system formats items as structured list
- **AND** includes: item name, type, key properties, brief description
- **AND** organizes items by owner character

#### Scenario: Include item availability
- **WHEN** including held items in prompt
- **THEN** system indicates which items are available for use
- **AND** marks items that have been used recently (if applicable)
- **AND** suggests potential item interactions

#### Scenario: Contextual item suggestions
- **WHEN** generating prompt for action scene
- **THEN** system suggests items that might be relevant to action
- **AND** highlights weapons, tools, or special items in `heldItems`
- **AND** provides item properties that support action

## API

```javascript
class AIManager {
    constructor(app, state, configManager, aiService, notificationManager);
    initialize(): void;
    sendMessage(): Promise<void>;
    displayMessage(content: string, role: string): void;
    showLoadingIndicator(): void;
    hideLoadingIndicator(): void;
    showError(error: object): void;
    insertToEditor(content: string): void;
    loadHistory(chapterId: string): void;
    saveHistory(): void;
    clearHistory(): void;
    adjustPanelWidth(width: number): void;
    togglePanel(): void;
    collapsePanel(): void;
    expandPanel(): void;
    copyToClipboard(text: string): Promise<void>;
    buildContext(): object;
    buildMessageHistory(message: string): Array;

    // Character state update tools
    registerTool(name: string, handler: Function): void;
    updateCharacterState(toolArgs: object): Promise<object>;
    updateItemState(toolArgs: object): Promise<object>;

    // Held items formatting
    formatHeldItems(characterId: string): string;
}
```

## Data Models

```typescript
type MessageRole = 'user' | 'assistant';

interface ChatMessage {
    role: MessageRole;
    content: string;
    timestamp: string;
}

interface ContextInfo {
    chapterTitle?: string;
    chapterContent?: string;
    characters?: string[];
}
```

## Dependencies
- `AIConfigManager`: 管理 AI 配置
- `AIService`: 处理与 AI 提供商的通信
- `NotificationManager`: 显示通知
- `UIRenderer`: 渲染 UI
- `state`: 应用状态管理器

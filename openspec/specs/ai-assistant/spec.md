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

# View Management Specification

## Purpose
提供视图切换、渲染和导航管理的核心能力，将视图逻辑与业务逻辑分离。

## Requirements

### VR-1: View Navigation
- 应用应支持多个视图：`story`、`character`、`item`、`setting`、`prompt`
- 应支持通过导航栏切换视图
- 应支持通过键盘快捷键 Alt + 1-5 切换视图
- 切换视图时应更新导航栏的激活状态
- 当前视图状态应持久化到 localStorage

### VR-2: View Persistence
- 当前视图状态应保存到 `Constants.STORAGE_KEYS.CURRENT_VIEW`
- 应用初始化时应恢复上次保存的视图
- 当没有保存的视图时，默认切换到 `story` 视图

### VR-3: View Rendering Delegation
- ViewManager 应委托具体的渲染逻辑给相应的渲染器
- 每个视图应有独立的渲染方法
- 渲染方法应在视图切换时被调用

### VR-4: View Refresh
- 应提供刷新当前视图的方法
- 当状态变化时（如撤销/重做）应刷新当前视图
- 如果 AI 面板可见，刷新时应同时刷新 AI 面板内容

### VR-5: AI Assistant Panel Visibility Control
- 系统应根据当前视图和选择状态控制 AI 助手面板的可见性
- 在 story 视图且选择了章节时应显示 AI 面板
- 在 story 视图但未选择章节时应隐藏 AI 面板
- 切换到非 story 视图时应隐藏 AI 面板并保存隐藏状态

### VR-6: AI Assistant Panel State Persistence
- AI 面板状态应持久化到 localStorage
- 包括：可见性状态、宽度、折叠状态
- 加载 AI 面板时应恢复保存的状态，无保存时使用默认值

### VR-7: AI Assistant Panel Toggle
- 应提供切换 AI 面板可见性的方法
- 切换时同时更新 localStorage 中的状态

### VR-8: Responsive Layout Management
- 屏幕宽度 < 768px 时，AI 面板切换为底部抽屉模式
- 屏幕宽度 >= 768px 时，AI 面板切换为侧边栏模式
- 根据屏幕宽度变化自动切换布局模式

## API

```javascript
class ViewManager {
    constructor(app, state);
    switchView(viewName): void;
    refreshCurrentView(): void;
    loadViewFromStorage(): void;
    saveViewToStorage(): void;
    getCurrentView(): string;

    // AI Panel methods
    showAIAssistantPanel(): void;
    hideAIAssistantPanel(): void;
    toggleAIAssistantPanel(): void;
    checkResponsiveLayout(): void;
}
```

## Data Models

```typescript
type ViewName = 'story' | 'character' | 'item' | 'setting' | 'prompt';
```

## Dependencies
- `Constants.STORAGE_KEYS.CURRENT_VIEW`: localStorage 键名
- `state`: 应用状态管理器，提供数据访问
- `app`: 主应用实例，用于调用渲染方法

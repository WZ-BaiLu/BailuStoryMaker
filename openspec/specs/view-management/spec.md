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

## API

```javascript
class ViewManager {
    constructor(app, state);
    switchView(viewName): void;
    refreshCurrentView(): void;
    loadViewFromStorage(): void;
    saveViewToStorage(): void;
    getCurrentView(): string;
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

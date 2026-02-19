# Event Binding Specification

## Purpose
提供事件绑定和键盘快捷键处理的统一管理能力，将事件处理逻辑集中管理。

## Requirements

### EB-1: Keyboard Shortcuts
- 支持以下键盘快捷键：
  - Ctrl/Cmd + E: 导出
  - Ctrl/Cmd + I: 导入
  - Ctrl/Cmd + N: 新建故事
  - Ctrl/Cmd + Z: 撤销
  - Ctrl/Cmd + Y 或 Ctrl/Cmd + Shift + Z: 重做
  - Escape: 关闭模态框
  - Alt + 1-5: 切换视图
- 快捷键处理应在 `keydown` 事件上绑定
- 应阻止默认行为以避免冲突

### EB-2: Event Delegation
- UI 元素的事件应使用 EventManager 统一绑定
- 事件处理函数应委托给相应的处理方法
- 支持动态绑定和事件委托

### EB-3: Event Registration
- 提供注册事件处理器的接口
- 支持按类型注册（navigation、header、modal、view-specific）
- 支持事件解绑

## API

```javascript
class EventManager {
    constructor(app, state);
    setupKeyboardShortcuts(): void;
    bindEvents(): void;
    registerEventHandler(type, selector, handler): void;
    unregisterEventHandler(type, selector): void;
}
```

## Dependencies
- `app`: 主应用实例，提供处理方法
- `state`: 应用状态管理器

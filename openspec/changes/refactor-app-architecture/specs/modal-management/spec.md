# Modal Management Specification

## Purpose
提供模态框显示、隐藏和交互管理的统一能力，将模态框逻辑从 App 类中分离。

## Requirements

### MM-1: Modal Display
- 应支持显示模态框
- 应支持设置模态框标题
- 应支持设置输入框占位符和值
- 应支持清空输入框内容

### MM-2: Modal Hide
- 应支持隐藏模态框
- 隐藏时应添加 `hidden` 类

### MM-3: Modal Form Submission
- 应处理表单提交事件
- 应验证输入内容不为空
- 应根据当前操作类型执行相应逻辑（如新建故事）
- 提交成功后应隐藏模态框并显示提示

### MM-4: Modal Types
- 新建故事模态框：包含标题输入

## API

```javascript
class ModalManager {
    constructor(app, state);
    showNewStoryModal(): void;
    hideModal(): void;
    handleModalSubmit(event): void;
}
```

## Dependencies
- `app`: 主应用实例
- `state`: 应用状态管理器
- `i18n`: 国际化管理器

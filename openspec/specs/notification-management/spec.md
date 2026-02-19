# Notification Management Specification

## Purpose
提供 Toast 通知消息的统一管理能力，将通知显示逻辑从 App 类中分离。

## Requirements

### NM-1: Toast Display
- 应支持显示通知消息
- 应支持不同的消息类型：`success`、`error`、`warning`
- 通知应添加到 `body` 元素
- 通知应包含相应的样式类

### NM-2: Toast Auto-dismiss
- 通知应在 3 秒后自动消失
- 消失时应有淡出动画（300ms）
- 动画完成后应从 DOM 中移除元素

### NM-3: Toast Styling
- Success 类型：显示成功状态样式
- Error 类型：显示错误状态样式
- Warning 类型：显示警告状态样式

## API

```javascript
class NotificationManager {
    constructor();
    showToast(message: string, type?: 'success' | 'error' | 'warning'): void;
    showSuccess(message: string): void;
    showError(message: string): void;
    showWarning(message: string): void;
}
```

## Data Models

```typescript
type NotificationType = 'success' | 'error' | 'warning';
```

## Dependencies
- CSS 样式：`.toast`、`.toast.success`、`.toast.error`、`.toast.warning`

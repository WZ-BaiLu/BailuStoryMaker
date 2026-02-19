# Theme Management Specification

## Purpose
提供主题切换和持久化的能力，将主题管理逻辑从 App 类中分离。

## Requirements

### TM-1: Theme Persistence
- 当前主题应保存到 `Constants.STORAGE_KEYS.THEME`
- 应用初始化时应加载保存的主题
- 默认主题为 `light`

### TM-2: Theme Switching
- 应支持在 `light` 和 `dark` 主题之间切换
- 切换主题时应在 `body` 元素上添加/移除 `dark` 类
- 切换后应立即更新 localStorage

### TM-3: Theme Detection
- 应能够检测当前激活的主题
- 当前主题基于 `body` 是否包含 `dark` 类来判断

## API

```javascript
class ThemeManager {
    constructor();
    loadTheme(): void;
    toggleTheme(): void;
    getCurrentTheme(): 'light' | 'dark';
}
```

## Data Models

```typescript
type Theme = 'light' | 'dark';
```

## Dependencies
- `Constants.STORAGE_KEYS.THEME`: localStorage 键名

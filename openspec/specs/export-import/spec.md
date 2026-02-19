# Export Import Specification

## Purpose
提供导出和导入功能的管理能力，将文件操作逻辑从 App 类中分离。

## Requirements

### EI-1: Export
- 应支持将当前故事导出为 JSON 文件
- 文件名应为 `{故事标题}.json`
- 导出时应显示成功提示
- 导出失败时应显示错误提示

### EI-2: Import
- 应支持从 JSON 文件导入故事
- 应触发文件选择对话框
- 导入成功后应加载故事并显示提示
- 导入失败时应显示错误提示
- 导入后应清空文件输入，允许重复导入同一文件

### EI-3: File Management
- 应使用 FileManager 工具类进行文件操作
- 支持的文件格式为 JSON

## API

```javascript
class ExportImportManager {
    constructor(app, state);
    handleExport(): void;
    handleImport(): void;
    handleImportFile(event): Promise<void>;
}
```

## Dependencies
- `app`: 主应用实例，提供显示提示的方法
- `state`: 应用状态管理器
- `FileManager`: 文件操作工具类
- `i18n`: 国际化管理器

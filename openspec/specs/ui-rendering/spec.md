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
}
```

## Dependencies
- `app`: 主应用实例
- `state`: 应用状态管理器
- `i18n`: 国际化管理器
- `Constants`: 常量定义

## Why

当前 `app.js` 包含了约 1370 行代码，违反了单一职责原则和开闭原则。所有视图管理、事件处理、状态管理、主题管理、导入导出等逻辑都耦合在一个巨大的类中，导致：
- 代码难以维护和测试
- 添加新功能需要修改现有代码（违反开闭原则）
- 职责混乱，违反单一职责原则
- 重构风险高，影响面大

## What Changes

重构应用架构，将 `App` 类拆分为多个独立的、可扩展的模块：
- **ViewManager**: 管理视图切换、渲染和导航
- **EventManager**: 处理事件绑定和键盘快捷键
- **UIRenderer**: 负责各个视图的渲染逻辑（章节、角色、物品、设置）
- **ThemeManager**: 管理主题切换和持久化
- **ExportImportManager**: 处理导出和导入功能
- **ModalManager**: 管理模态框显示和交互
- **NotificationManager**: 管理 Toast 通知显示

每个模块遵循开闭原则，通过扩展而非修改来增强功能。

## Capabilities

### New Capabilities
- `view-management`: 视图切换和渲染管理能力
- `event-binding`: 事件绑定和键盘快捷键处理
- `ui-rendering`: 各个视图的渲染逻辑
- `theme-management`: 主题切换和持久化
- `export-import`: 导出导入功能管理
- `modal-management`: 模态框管理
- `notification-management`: 通知消息管理

### Modified Capabilities
无 - 这是纯架构重构，不改变业务行为

## Impact

- **代码结构**: `app.js` 将大幅精简，主要负责模块初始化和协调
- **新增文件**: 创建 `js/managers/` 目录，包含各个管理器模块
- **测试**: 每个管理器可独立测试，提高测试覆盖率
- **维护性**: 职责清晰，新功能可通过扩展管理器实现，无需修改现有代码
- **向后兼容**: 不改变外部 API，保证现有功能正常运行

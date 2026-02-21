# Element/Event/State Driven Architecture Proposal

## Why

当前系统将角色、道具、设定等分别管理,缺乏统一的抽象和状态跟踪机制。这导致:
- 元素管理分散,难以统一查询和操作
- 状态变化缺乏时间线追踪,无法回溯历史状态
- AI 上下文构建不够精确,无法根据场景动态筛选相关元素
- "被遗忘"、"在场"等概念无法系统化处理

引入 Element/Event/State 三层驱动模型,可以:
- 统一管理所有故事元素(人物、道具、地点、记忆、基础设定)
- 通过段落事件驱动状态变化,建立完整的时间线
- 基于故事视角和关键字智能筛选元素,提升 AI 生成质量
- 支持实时查询任意时刻的故事状态,辅助创作决策

## What Changes

### 核心架构变更
- **统一 StoryElement 模型**: 角色、道具、地点、记忆、基础设定都继承自 `StoryElement`
- **StoryViewManager**: 管理故事视角(当前所在地),控制"在场"元素的筛选
- **StateTimeline**: 跟录所有元素的状态变化,支持实时查询任意时刻的状态
- **StateContextCache**: 以章节为单位缓存故事状态,提升性能

### 数据模型变更

**新增字段**:
- 所有元素添加 `keywords: string[]` - AI 查询用关键字
- 所有元素添加 `stateHistory: StateChange[]` - 状态变化历史
- 所有元素添加 `location: string` - 当前所在地

**修改字段**:
- `paragraph.changes` 重构为统一的事件格式:
  ```javascript
  {
    elements: [{
      elementId: string;
      type: 'character'|'item'|'location'|'base'|'memory';
      stateChanges: {
        location?: string;
        description?: Record<string, any>;
        owner?: string;
        status?: string; // "破损", "被遗忘", "在场", "离场"
        keywords?: string[];
      };
    }]
  }
  ```

**移除字段**:
- `character.heldItems` - 改为通过 `location` 和 `owner` 关系推导
- `item.owner` - 改为在元素状态中维护

### AI Tools 新增
- `addElement`: 补充新的故事元素(设定/人物/道具/地点/记忆)
- `updateElementLocation`: 修改元素所在地
- `updateElementDescription`: 修改元素状态描述

### ContextBuilder 增强
- 根据 StoryView 筛选在场元素
- 根据"被遗忘"关键字和时间顺序动态过滤元素
- 实时计算当前章节的故事状态上下文

## Capabilities

### New Capabilities

- **element-management**: 统一的故事元素管理
  - 提供 StoryElement 基类和子类型(Character/Item/Location/Memory/Base)
  - 统一的元素 CRUD 接口
  - 元素关键字管理

- **state-tracking**: 元素状态时间线跟踪
  - StateTimeline 核心实现
  - 状态变化记录和推导
  - 混合状态管理(Element 关键历史 + 全局快照)

- **story-view-management**: 故事视角管理
  - StoryViewManager 管理当前所在地
  - "在场"元素自动筛选
  - 视角切换通知

- **state-context**: 故事状态上下文计算
  - 实时计算当前章节的故事状态
  - 章节级缓存
  - 纯规则驱动(不使用 AI)

- **ai-element-tools**: AI 辅助元素和状态管理
  - `addElement` tool
  - `updateElementLocation` tool
  - `updateElementDescription` tool
  - "预览-确认"插入流程

### Modified Capabilities

- **ai-assistant**: 集成新的 AI tools
  - 注册 3 个新的 AI tools
  - 更新 prompt 构建逻辑,使用 StateContext
  - 实现工具调用结果的预览机制

- **character-state-tracking**: 整合到新的状态跟踪系统
  - 迁移角色状态逻辑到 StateTimeline
  - 移除 `character.heldItems` 依赖

- **props-state-tracking**: 整合到新的状态跟踪系统
  - 迁移道具状态逻辑到 StateTimeline
  - 移除 `item.owner` 依赖

## Impact

### 代码影响
- **state.js**: 重构角色、道具、设定管理方法,适配新的 Element 模型
- **ContextBuilder.js**: 增强上下文构建逻辑,集成 StoryView 和 StateTimeline
- **AIManager.js**: 添加新的 AI tools,更新 prompt 构建流程
- **新增模块**:
  - `StoryElement.js`: 元素基类定义
  - `StoryViewManager.js`: 视角管理器
  - `StateTimeline.js`: 状态时间线
  - `StateContextCache.js`: 上下文缓存

### 数据影响
- **BREAKING**: 现有故事数据结构变更,需要数据迁移工具
  - 将 `character.heldItems` 转换为状态历史
  - 将 `item.owner` 转换为状态历史
  - 为所有元素添加 `keywords` 和 `stateHistory` 字段
- 新的 `paragraph.changes` 格式不向后兼容

### API 影响
- **state.js** 中的角色和道具管理方法签名保持不变(内部实现适配)
- 新增 `state.getElementState(elementId, paragraphId)` 方法
- 新增 `state.getCurrentStoryContext(chapterId)` 方法
- 新增 `state.setStoryView(locationId)` 方法

### 性能影响
- 章节级缓存显著提升状态查询性能
- 实时计算复杂度取决于章节段落数量(通常 < 100)
- 状态历史查询复杂度 O(n),n 为历史记录数(通常 < 1000)

### 用户体验影响
- AI 生成内容更加精确(考虑在场元素和状态)
- 支持查看任意时刻的故事状态(辅助创作)
- "被遗忘"等概念系统化,提升逻辑一致性
- UI 可能需要调整以显示新的状态信息

## Migration Strategy

### 阶段 1: 数据模型重构 (1-2天)
1. 创建 `StoryElement` 基类和子类型
2. 重构 `state.js` 中的角色、道具、设定数据结构
3. 实现数据迁移工具,将现有数据转换为新格式

### 阶段 2: 核心功能实现 (3-4天)
1. 实现 `StateTimeline` 核心逻辑
2. 实现 `StoryViewManager` 视角管理
3. 实现 `StateContextCache` 缓存机制
4. 更新 `ContextBuilder` 集成新组件

### 阶段 3: AI Tools 集成 (2-3天)
1. 实现 3 个新的 AI tools
2. 更新 `AIManager` 注册 tools
3. 实现"预览-确认"插入流程
4. 更新 prompt 构建逻辑

### 阶段 4: UI 和测试 (2-3天)
1. 更新 UI 显示新的状态信息
2. 添加状态历史查看器
3. 更新和添加单元测试
4. 集成测试验证端到端流程

**总计**: 8-12 天完成全部实施
